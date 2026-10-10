import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:ain_mobile/src/core/notifications/push_registration_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final firebasePushTokenServiceProvider = Provider<FirebasePushTokenService>((
  ref,
) {
  return FirebasePushTokenService(
    environment: ref.watch(appEnvironmentProvider),
    messaging: FirebaseMessaging.instance,
    pushRegistrationService: ref.watch(pushRegistrationServiceProvider),
  );
});

class FirebasePushTokenService {
  const FirebasePushTokenService({
    required AppEnvironment environment,
    required FirebaseMessaging messaging,
    required PushRegistrationService pushRegistrationService,
  })  : _environment = environment,
        _messaging = messaging,
        _pushRegistrationService = pushRegistrationService;

  final AppEnvironment _environment;
  final FirebaseMessaging _messaging;
  final PushRegistrationService _pushRegistrationService;

  Future<void> registerCurrentDevice() async {
    if (!_environment.enableFirebase) {
      return;
    }

    try {
      final settings = await _messaging.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        return;
      }

      final token = await _messaging.getToken();
      if (token == null || token.isEmpty) {
        return;
      }

      await _pushRegistrationService.registerFcmToken(
        token: token,
        deviceName: defaultTargetPlatform.name,
        appVersion: const String.fromEnvironment(
          'AIN_APP_VERSION',
          defaultValue: '0.1.0',
        ),
      );
    } on Object catch (error, stack) {
      debugPrint('FCM token registration skipped: $error');
      debugPrintStack(stackTrace: stack);
    }
  }
}
