package com.nryn.mobile

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LockScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences("nryn_lockscreen_prefs", Context.MODE_PRIVATE)

    override fun getName(): String {
        return "LockScreen"
    }

    @ReactMethod
    fun startLockScreenService(promise: Promise) {
        try {
            prefs.edit().putBoolean("enabled", true).apply()
            val intent = Intent(reactApplicationContext, LockScreenService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LOCKSCREEN_SERVICE_ERROR", e.message ?: "Failed to start service", e)
        }
    }

    @ReactMethod
    fun stopLockScreenService(promise: Promise) {
        try {
            prefs.edit().putBoolean("enabled", false).apply()
            val intent = Intent(reactApplicationContext, LockScreenService::class.java)
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LOCKSCREEN_SERVICE_ERROR", e.message ?: "Failed to stop service", e)
        }
    }

    @ReactMethod
    fun isLockScreenEnabled(promise: Promise) {
        val enabled = prefs.getBoolean("enabled", true)
        promise.resolve(enabled)
    }

    @ReactMethod
    fun isKeyguardLocked(promise: Promise) {
        val km = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
        val isLocked = km?.isKeyguardLocked ?: false
        promise.resolve(isLocked)
    }

    @ReactMethod
    fun dismissKeyguard(promise: Promise) {
        try {
            val activity = MainActivity.instance
            if (activity != null) {
                activity.dismissKeyguard()
                promise.resolve(true)
            } else {
                val km = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && currentActivity != null) {
                    km?.requestDismissKeyguard(currentActivity!!, null)
                }
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("DISMISS_KEYGUARD_ERROR", e.message ?: "Failed to dismiss keyguard", e)
        }
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + reactApplicationContext.packageName)
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("OVERLAY_PERMISSION_ERROR", e.message ?: "Failed to request permission", e)
        }
    }
}
