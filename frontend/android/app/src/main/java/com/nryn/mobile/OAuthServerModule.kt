package com.nryn.mobile

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.PowerManager
import android.provider.OpenableColumns
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Base64
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class OAuthServerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val serverSockets = mutableListOf<ServerSocket>()
    private var isRunning = false
    private var pendingFilePromise: Promise? = null
    private var wakeLock: PowerManager.WakeLock? = null

    // Native Speech Recognizer for Voice Notes & Meeting MoM
    private var speechRecognizer: SpeechRecognizer? = null
    private val currentTranscript = StringBuilder()
    private var latestPartial: String = ""

    init {
        reactContext.addActivityEventListener(object : BaseActivityEventListener() {
            override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
                if (requestCode == 8821) {
                    val promise = pendingFilePromise
                    pendingFilePromise = null

                    if (resultCode == Activity.RESULT_OK && data?.data != null) {
                        try {
                            val uri = data.data!!
                            val resolver = reactApplicationContext.contentResolver
                            var fileName = "upload_file"
                            var mimeType = resolver.getType(uri) ?: "application/octet-stream"

                            resolver.query(uri, null, null, null, null)?.use { cursor ->
                                val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                                if (nameIdx != -1 && cursor.moveToFirst()) {
                                    val name = cursor.getString(nameIdx)
                                    if (!name.isNullOrEmpty()) fileName = name
                                }
                            }

                            val inputStream = resolver.openInputStream(uri)
                            val bytes = inputStream?.readBytes() ?: ByteArray(0)
                            inputStream?.close()

                            val base64 = Base64.encodeToString(bytes, Base64.NO_WRAP)
                            val map = Arguments.createMap().apply {
                                putString("name", fileName)
                                putInt("size", bytes.size)
                                putString("mimeType", mimeType)
                                putString("base64", base64)
                            }
                            promise?.resolve(map)
                        } catch (e: Exception) {
                            promise?.resolve(null)
                        }
                    } else {
                        promise?.resolve(null)
                    }
                }
            }
        })
    }

    override fun getName(): String = "OAuthServer"

    override fun initialize() {
        super.initialize()
        startServerInternal()
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        stopServerInternal()
        releaseWakeLock()
        UiThreadUtil.runOnUiThread {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = null
            } catch (ignored: Exception) {}
        }
    }

    @ReactMethod
    fun startServer(promise: Promise) {
        try {
            acquireWakeLock()
            startServerInternal()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun stopServer(promise: Promise) {
        stopServerInternal()
        releaseWakeLock()
        promise.resolve(true)
    }

    private fun acquireWakeLock() {
        try {
            if (wakeLock == null) {
                val pm = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as? PowerManager
                wakeLock = pm?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NRYN:OAuthWakeLock")
            }
            if (wakeLock?.isHeld != true) {
                wakeLock?.acquire(180000) // 3 minutes timeout
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            wakeLock = null
        } catch (e: Exception) {}
    }

    @Synchronized
    private fun startServerInternal() {
        if (isRunning && serverSockets.any { !it.isClosed }) {
            return
        }
        stopServerInternal()
        isRunning = true

        val sockets = mutableListOf<ServerSocket>()

        // 1. Bind Wildcard dual-stack FIRST on port 4000
        // On Linux / Android, binding wildcard with reuseAddress handles BOTH IPv4 (127.0.0.1) and IPv6 (::1) simultaneously
        try {
            val sWild = ServerSocket()
            sWild.reuseAddress = true
            sWild.bind(InetSocketAddress(4000), 50)
            sockets.add(sWild)
        } catch (e: Exception) {
            try {
                val s4 = ServerSocket()
                s4.reuseAddress = true
                s4.bind(InetSocketAddress(InetAddress.getByName("127.0.0.1"), 4000), 50)
                sockets.add(s4)
            } catch (_: Exception) {}
            try {
                val s6 = ServerSocket()
                s6.reuseAddress = true
                s6.bind(InetSocketAddress(InetAddress.getByName("::1"), 4000), 50)
                sockets.add(s6)
            } catch (_: Exception) {}
        }

        serverSockets.clear()
        serverSockets.addAll(sockets)

        for (sock in sockets) {
            thread(name = "OAuthLoopbackAccept-${sock.localSocketAddress}", isDaemon = true) {
                try {
                    while (isRunning && !sock.isClosed) {
                        val client: Socket = sock.accept()
                        thread(name = "OAuthClient-${client.remoteSocketAddress}", isDaemon = true) {
                            handleClient(client)
                        }
                    }
                } catch (e: Exception) {
                    // Socket closed
                }
            }
        }
    }

    private fun stopServerInternal() {
        isRunning = false
        for (s in serverSockets) {
            try {
                s.close()
            } catch (ignored: Exception) {}
        }
        serverSockets.clear()
    }

    private fun handleClient(socket: Socket) {
        try {
            socket.soTimeout = 6000
            val reader = BufferedReader(InputStreamReader(socket.getInputStream()))
            val firstLine = reader.readLine() ?: ""

            // Handle preflight OPTIONS request from Chrome Private Network Access (PNA)
            if (firstLine.startsWith("OPTIONS")) {
                val pnaResponse = "HTTP/1.1 204 No Content\r\n" +
                        "Access-Control-Allow-Origin: *\r\n" +
                        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
                        "Access-Control-Allow-Headers: *\r\n" +
                        "Access-Control-Allow-Private-Network: true\r\n" +
                        "Connection: close\r\n\r\n"
                val out = socket.getOutputStream()
                out.write(pnaResponse.toByteArray(Charsets.UTF_8))
                out.flush()
                socket.close()
                return
            }

            // Ignore favicon cleanly
            if (firstLine.contains("/favicon.ico")) {
                val res = "HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n"
                val out = socket.getOutputStream()
                out.write(res.toByteArray(Charsets.UTF_8))
                out.flush()
                socket.close()
                return
            }

            val parts = firstLine.split(" ")
            var code: String? = null
            var state: String? = null

            if (parts.size >= 2) {
                val fullUri = Uri.parse("http://127.0.0.1:4000" + parts[1])
                code = fullUri.getQueryParameter("code")
                state = fullUri.getQueryParameter("state")
            }

            val html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>NRYN · Gmail Connected</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            background-color: #f7f6f2;
                            color: #2b332b;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            padding: 20px;
                            box-sizing: border-box;
                        }
                        .card {
                            background: #ffffff;
                            padding: 36px 28px;
                            border-radius: 20px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
                            text-align: center;
                            max-width: 400px;
                            width: 100%;
                            border: 1px solid #e3e1d8;
                            box-sizing: border-box;
                        }
                        .badge {
                            display: inline-block;
                            width: 50px;
                            height: 50px;
                            line-height: 50px;
                            border-radius: 50%;
                            background: #e2ede5;
                            color: #2e603d;
                            font-size: 24px;
                            margin-bottom: 16px;
                        }
                        h2 { margin: 0 0 10px 0; font-size: 22px; }
                        p { color: #6e756e; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; }
                        .btn {
                            background: #2b332b;
                            color: #ffffff;
                            padding: 14px 28px;
                            border-radius: 12px;
                            text-decoration: none;
                            font-size: 14px;
                            font-weight: 600;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="badge">✓</div>
                        <h2>Gmail Connected!</h2>
                        <p>Returning to Narayan Agent app...</p>
                        <a href="nryn://email?connected=true" class="btn">Open Narayan App ➔</a>
                    </div>
                    <script>
                        setTimeout(function() {
                            window.location.href = "nryn://email?connected=true";
                        }, 400);
                    </script>
                </body>
                </html>
            """.trimIndent()

            val bodyBytes = html.toByteArray(Charsets.UTF_8)
            val responseHeader = "HTTP/1.1 200 OK\r\n" +
                    "Content-Type: text/html; charset=utf-8\r\n" +
                    "Access-Control-Allow-Origin: *\r\n" +
                    "Access-Control-Allow-Private-Network: true\r\n" +
                    "Content-Length: " + bodyBytes.size + "\r\n" +
                    "Connection: close\r\n\r\n"

            val out: OutputStream = socket.getOutputStream()
            out.write(responseHeader.toByteArray(Charsets.UTF_8))
            out.write(bodyBytes)
            out.flush()
            socket.close()

            releaseWakeLock()

            if (code != null) {
                val authCode = code
                val authState = state ?: ""
                thread(name = "OAuthForwardThread", isDaemon = true) {
                    try {
                        val backendUrl = "https://narayan-agent.onrender.com/api/email/oauth/callback?code=" +
                                Uri.encode(authCode) +
                                "&state=" + Uri.encode(authState)
                        val conn = URL(backendUrl).openConnection() as HttpURLConnection
                        conn.requestMethod = "GET"
                        conn.connectTimeout = 30000
                        conn.readTimeout = 30000
                        conn.responseCode
                        conn.disconnect()
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                val params = Arguments.createMap().apply {
                    putString("code", authCode)
                    putString("state", authState)
                }
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onOAuthCodeReceived", params)
            }
        } catch (e: Exception) {
            try { socket.close() } catch (ignored: Exception) {}
        }
    }

    @ReactMethod
    fun getClipboardText(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val clipboard = reactApplicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as? android.content.ClipboardManager
                if (clipboard != null && clipboard.hasPrimaryClip()) {
                    val item = clipboard.primaryClip?.getItemAt(0)
                    val text = item?.text?.toString() ?: ""
                    promise.resolve(text)
                } else {
                    promise.resolve("")
                }
            } catch (e: Exception) {
                promise.resolve("")
            }
        }
    }

    // --- Native Speech Recognition Methods ---

    @ReactMethod
    fun startSpeechRecognition(lang: String?, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(reactApplicationContext)) {
                    promise.resolve(false)
                    return@runOnUiThread
                }

                speechRecognizer?.destroy()
                currentTranscript.setLength(0)
                latestPartial = ""

                val recognizer = SpeechRecognizer.createSpeechRecognizer(reactApplicationContext)
                speechRecognizer = recognizer

                val targetLang = when (lang) {
                    "hi-IN" -> "hi-IN"
                    "en-IN" -> "en-IN"
                    else -> "mr-IN"
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, targetLang)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactApplicationContext.packageName)
                }

                recognizer.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {}
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {}
                    override fun onError(error: Int) {}
                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            val text = matches[0].trim()
                            if (text.isNotEmpty()) {
                                if (currentTranscript.isNotEmpty()) currentTranscript.append(" ")
                                currentTranscript.append(text)
                            }
                        }
                    }
                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            latestPartial = matches[0].trim()
                        }
                    }
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                recognizer.startListening(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun stopSpeechRecognition(promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                speechRecognizer?.stopListening()
                val full = if (latestPartial.isNotEmpty() && !currentTranscript.contains(latestPartial)) {
                    if (currentTranscript.isNotEmpty()) "$currentTranscript $latestPartial" else latestPartial
                } else {
                    currentTranscript.toString()
                }.trim()
                promise.resolve(full)
            } catch (e: Exception) {
                promise.resolve(currentTranscript.toString().trim())
            }
        }
    }

    @ReactMethod
    fun pickDocument(accept: String?, promise: Promise) {
        try {
            val act = currentActivity
            if (act == null) {
                promise.resolve(null)
                return
            }
            pendingFilePromise = promise
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                type = if (!accept.isNullOrEmpty() && accept.contains("image")) "image/*" else "*/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            act.startActivityForResult(Intent.createChooser(intent, "Choose Document or Photo"), 8821)
        } catch (e: Exception) {
            pendingFilePromise = null
            promise.resolve(null)
        }
    }
}
