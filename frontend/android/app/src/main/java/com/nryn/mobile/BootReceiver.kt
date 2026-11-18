package com.nryn.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
        if (context == null || intent == null) return

        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED || action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            val prefs: SharedPreferences =
                context.getSharedPreferences("nryn_lockscreen_prefs", Context.MODE_PRIVATE)
            val isEnabled = prefs.getBoolean("enabled", true)

            if (isEnabled) {
                try {
                    val serviceIntent = Intent(context, LockScreenService::class.java)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent)
                    } else {
                        context.startService(serviceIntent)
                    }
                } catch (e: Exception) {
                    // Ignore background start restrictions if any
                }
            }
        }
    }
}
