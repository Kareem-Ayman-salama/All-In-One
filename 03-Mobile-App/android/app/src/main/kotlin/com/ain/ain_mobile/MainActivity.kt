package com.ain.ain_mobile

import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // FLAG_SECURE can be enabled for protected-content screens after native
        // device testing. It is disabled globally to preserve accessibility and casting.
    }
}
