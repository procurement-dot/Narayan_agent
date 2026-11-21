package com.nryn.mobile

import android.database.Cursor
import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class SmsReaderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SmsReader"
    }

    /**
     * Reads all inbox SMS without 30-day or date limits.
     * Can optionally accept filter options (like maxCount if needed).
     */
    @ReactMethod
    fun getAllSms(options: ReadableMap?, promise: Promise) {
        try {
            val contentResolver = reactApplicationContext.contentResolver
            val projection = arrayOf("_id", "address", "body", "date", "date_sent")

            val maxCount = if (options != null && options.hasKey("maxCount")) {
                options.getInt("maxCount")
            } else {
                -1 // No limit: fetch all history
            }

            // Query incoming SMS directly from content://sms/inbox (official Android Telephony Inbox URI)
            val inboxUri = Uri.parse("content://sms/inbox")
            var cursor: Cursor? = null
            try {
                cursor = contentResolver.query(
                    inboxUri,
                    projection,
                    null,
                    null,
                    "date DESC"
                )
            } catch (e: Exception) {
                // Fallback attempt below
            }

            if (cursor == null || cursor.count == 0) {
                try {
                    cursor = contentResolver.query(
                        Uri.parse("content://sms"),
                        projection,
                        null,
                        null,
                        "date DESC"
                    )
                } catch (e: Exception) {
                    // Ignore
                }
            }

            val smsList = Arguments.createArray()
            var count = 0

            cursor?.use {
                val idIdx = it.getColumnIndex("_id")
                val addressIdx = it.getColumnIndex("address")
                val bodyIdx = it.getColumnIndex("body")
                val dateIdx = it.getColumnIndex("date")
                val dateSentIdx = it.getColumnIndex("date_sent")

                while (it.moveToNext()) {
                    if (maxCount > 0 && count >= maxCount) {
                        break
                    }

                    val map = Arguments.createMap()
                    if (idIdx != -1) map.putString("id", it.getString(idIdx) ?: "")
                    if (addressIdx != -1) map.putString("address", it.getString(addressIdx) ?: "")
                    if (bodyIdx != -1) map.putString("body", it.getString(bodyIdx) ?: "")
                    val d = if (dateIdx != -1) it.getLong(dateIdx) else 0L
                    val ds = if (dateSentIdx != -1) it.getLong(dateSentIdx) else 0L
                    val bestDate = if (d > 0L) d else if (ds > 0L) ds else System.currentTimeMillis()
                    map.putDouble("date", bestDate.toDouble())
                    map.putDouble("dateSent", (if (ds > 0L) ds else bestDate).toDouble())

                    smsList.pushMap(map)
                    count++
                }
            }

            promise.resolve(smsList)
        } catch (e: Exception) {
            promise.reject("SMS_READ_ERROR", e.message ?: "Failed to read SMS", e)
        }
    }
}
