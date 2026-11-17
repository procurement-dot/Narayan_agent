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
            val uri = Uri.parse("content://sms/inbox")

            val projection = arrayOf("_id", "address", "body", "date", "date_sent")

            val maxCount = if (options != null && options.hasKey("maxCount")) {
                options.getInt("maxCount")
            } else {
                -1 // No limit: fetch all history
            }

            val cursor: Cursor? = contentResolver.query(
                uri,
                projection,
                null,
                null,
                "date DESC"
            )

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
                    if (dateIdx != -1) map.putDouble("date", it.getLong(dateIdx).toDouble())
                    if (dateSentIdx != -1) map.putDouble("dateSent", it.getLong(dateSentIdx).toDouble())

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
