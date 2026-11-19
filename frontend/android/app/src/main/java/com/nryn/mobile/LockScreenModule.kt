package com.nryn.mobile

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class LockScreenModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val prefs by lazy {
        reactApplicationContext.getSharedPreferences("nryn_lockscreen_prefs", Context.MODE_PRIVATE)
    }

    override fun getName(): String = "LockScreen"

    @ReactMethod
    fun startLockScreenService(promise: Promise) {
        try {
            prefs.edit().putBoolean("enabled", true).apply()
            val activity = MainActivity.instance
            activity?.setupLockScreenDisplay()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun stopLockScreenService(promise: Promise) {
        try {
            prefs.edit().putBoolean("enabled", false).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun isLockScreenEnabled(promise: Promise) {
        try {
            val enabled = prefs.getBoolean("enabled", true)
            promise.resolve(enabled)
        } catch (e: Exception) {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun isKeyguardLocked(promise: Promise) {
        try {
            val km = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            val isLocked = km?.isKeyguardLocked ?: false
            promise.resolve(isLocked)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun dismissKeyguard(promise: Promise) {
        try {
            val activity = MainActivity.instance ?: currentActivity
            if (activity != null) {
                if (activity is MainActivity) {
                    activity.dismissKeyguard()
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val km = reactApplicationContext.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
                    km?.requestDismissKeyguard(activity, null)
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
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
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
