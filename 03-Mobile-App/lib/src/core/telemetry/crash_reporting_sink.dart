import 'package:ain_mobile/src/core/telemetry/telemetry_service.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

class CrashReportingSink implements TelemetrySink {
  const CrashReportingSink({required FirebaseCrashlytics crashlytics})
      : _crashlytics = crashlytics;

  final FirebaseCrashlytics _crashlytics;

  @override
  Future<void> track(String eventName, Map<String, Object?> properties) async {
    await _crashlytics.log(eventName);
    for (final entry in properties.entries) {
      await _crashlytics.setCustomKey(entry.key, entry.value.toString());
    }
  }

  @override
  Future<void> recordError(
    Object error,
    StackTrace stackTrace,
    Map<String, Object?> context,
  ) async {
    for (final entry in context.entries) {
      await _crashlytics.setCustomKey(entry.key, entry.value.toString());
    }
    await _crashlytics.recordError(error, stackTrace);
  }
}
