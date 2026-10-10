import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await FirebaseBootstrap.initializeFromBackground();
}

class FirebaseBootstrap {
  const FirebaseBootstrap._();

  static bool _initialized = false;

  static Future<bool> initialize(AppEnvironment environment) async {
    if (!environment.enableFirebase) {
      return false;
    }

    // Use a timeout so Firebase never blocks app startup
    final initialized = await _initializeFirebaseCore()
        .timeout(const Duration(seconds: 5), onTimeout: () => false);

    if (!initialized) {
      debugPrint('Firebase: skipped (timeout or unavailable)');
      return false;
    }

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    if (environment.enableCrashReporting) {
      FlutterError.onError =
          FirebaseCrashlytics.instance.recordFlutterFatalError;
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };
    }

    return true;
  }

  static Future<void> initializeFromBackground() async {
    await _initializeFirebaseCore();
  }

  static Future<bool> _initializeFirebaseCore() async {
    if (_initialized) {
      return true;
    }

    try {
      await Firebase.initializeApp();
      _initialized = true;
      return true;
    } on Object catch (error, stack) {
      debugPrint('Firebase initialization skipped: $error');
      debugPrintStack(stackTrace: stack);
      return false;
    }
  }
}
