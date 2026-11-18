package com.nryn.mobile

import android.app.KeyguardManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class LockScreenService : Service() {

    companion object {
        const val CHANNEL_ID = "nryn_lockscreen_channel"
        const val NOTIFICATION_ID = 1001
    }

    private var screenReceiver: BroadcastReceiver? = null
    private lateinit var prefs: SharedPreferences

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences("nryn_lockscreen_prefs", Context.MODE_PRIVATE)

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification())

        registerScreenReceiver()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        unregisterScreenReceiver()
        super.onDestroy()
    }

    private fun registerScreenReceiver() {
        if (screenReceiver != null) return

        screenReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (context == null || intent == null) return

                val isEnabled = prefs.getBoolean("enabled", true)
                if (!isEnabled) return

                if (intent.action == Intent.ACTION_SCREEN_ON) {
                    val km = context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
                    if (km != null && km.isKeyguardLocked) {
                        launchLockScreenCalendar(context)
                    }
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_ON)
            addAction(Intent.ACTION_SCREEN_OFF)
        }
        registerReceiver(screenReceiver, filter)
    }

    private fun unregisterScreenReceiver() {
        screenReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (e: Exception) {
                // Ignore if already unregistered
            }
            screenReceiver = null
        }
    }

    private fun launchLockScreenCalendar(context: Context) {
        try {
            val activityIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                putExtra("fromLockScreen", true)
            }
            context.startActivity(activityIntent)
        } catch (e: Exception) {
            // Fallback: full-screen intent via notification on Android 10+
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                Intent(context, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    putExtra("fromLockScreen", true)
                },
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
            )

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("NRYN Calendar")
                .setContentText("Tap to view today's calendar on lock screen")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setFullScreenIntent(pendingIntent, true)
                .setAutoCancel(true)
                .build()

            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.notify(NOTIFICATION_ID + 1, notification)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Lock Screen Calendar",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live calendar schedule on lock screen"
                setShowBadge(false)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            },
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("NRYN Calendar")
            .setContentText("Lock screen calendar active")
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
