# Mobile Crash Reporting

Crash reporting is prepared through a sink abstraction and must be enabled only
after Firebase staging and production projects are configured.

## Implemented Foundation

- `lib/src/core/telemetry/crash_reporting_sink.dart` adapts
  `FirebaseCrashlytics` to `TelemetrySink`.
- `TelemetryService.recordError()` redacts context before forwarding it to
  sinks.
- `AppEnvironment.enableCrashReporting` is read from Dart defines.

## Context Rules

Allowed:

- Environment.
- App version.
- Platform.
- Request ID.
- Safe backend error code/category.
- Organization ID only when privacy-safe and needed for debugging.

Never send:

- Access tokens.
- Refresh tokens.
- Passwords.
- Signed content URLs.
- Private file contents.
- Full student contact details.
- Full form payloads.

## Required Before Staging

- Add Firebase options for staging.
- Initialize Firebase before enabling `CrashReportingSink`.
- Verify redaction with unit tests.
- Confirm crash collection consent and privacy policy wording.

