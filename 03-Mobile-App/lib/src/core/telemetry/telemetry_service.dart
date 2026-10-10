import 'package:ain_mobile/src/app/configuration/app_environment.dart';
import 'package:ain_mobile/src/core/privacy/privacy_redactor.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final telemetryServiceProvider = Provider<TelemetryService>((ref) {
  return TelemetryService(
    environment: ref.watch(appEnvironmentProvider),
    redactor: const PrivacyRedactor(),
    sinks: const <TelemetrySink>[],
  );
});

class TelemetryService {
  const TelemetryService({
    required AppEnvironment environment,
    required PrivacyRedactor redactor,
    required List<TelemetrySink> sinks,
  })  : _environment = environment,
        _redactor = redactor,
        _sinks = sinks;

  final AppEnvironment _environment;
  final PrivacyRedactor _redactor;
  final List<TelemetrySink> _sinks;

  Future<void> track(
    TelemetryEvent event, {
    Map<String, Object?> properties = const <String, Object?>{},
  }) async {
    final safeProperties = _redactor.redact({
      ...properties,
      'environment': _environment.flavor.name,
    });

    for (final sink in _sinks) {
      await sink.track(event.name, safeProperties);
    }
  }

  Future<void> recordError(
    Object error,
    StackTrace stackTrace, {
    Map<String, Object?> context = const <String, Object?>{},
  }) async {
    final safeContext = _redactor.redact({
      ...context,
      'environment': _environment.flavor.name,
    });

    for (final sink in _sinks) {
      await sink.recordError(error, stackTrace, safeContext);
    }
  }
}

abstract class TelemetrySink {
  Future<void> track(String eventName, Map<String, Object?> properties);

  Future<void> recordError(
    Object error,
    StackTrace stackTrace,
    Map<String, Object?> context,
  );
}

enum TelemetryEvent {
  loginSuccess,
  workspaceSelected,
  courseViewed,
  courseSearch,
  bookingStarted,
  bookingSubmitted,
  bookingConfirmed,
  contentOpened,
  subscriptionRenewalOpened,
  notificationOpened,
}
