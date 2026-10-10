import 'dart:async';
import 'package:ain_mobile/src/app/app.dart';
import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:ain_mobile/src/core/firebase/firebase_bootstrap.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Future<void> bootstrap(AppEnvironment environment) async {
  WidgetsFlutterBinding.ensureInitialized();

  // Fail-closed: Ensure environment configuration is strictly validated before starting app
  environment.validate();

  // Render the Flutter app immediately without blocking on network/Firebase
  runApp(
    ProviderScope(
      overrides: [appEnvironmentProvider.overrideWithValue(environment)],
      child: const AinMobileApp(),
    ),
  );

  // Initialize Firebase in background so cold start is instantaneous
  unawaited(
    FirebaseBootstrap.initialize(environment)
        .catchError((Object error, StackTrace stack) {
      debugPrint('Firebase background init failed: $error');
      return false;
    }),
  );
}
