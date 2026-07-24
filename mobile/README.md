# AIN Mobile

Flutter foundation for the AIN All In One mobile app. The app is intended to
connect to the existing Laravel backend and must not use mock data in release
builds.

## Current State

- API contract seed: `../docs/mobile-openapi.json`.
- Audit outputs:
  - `WEB_MOBILE_FEATURE_MAPPING.md`
  - `MOBILE_REQUIREMENTS.md`
  - `API_INTEGRATION_MAP.md`
  - `MOBILE_IMPLEMENTATION_PLAN.md`
- Operational docs:
  - `DEEP_LINKS.md`
  - `OFFLINE_STRATEGY.md`
  - `PUSH_NOTIFICATIONS.md`
  - `CONTENT_VIEWER.md`
  - `SECURITY.md`
  - `ERROR_HANDLING.md`
  - `MOBILE_ANALYTICS.md`
  - `CRASH_REPORTING.md`
  - `MOBILE_THREAT_MODEL.md`
  - `MOBILE_SECURITY_CHECKLIST.md`
  - `MOBILE_PERFORMANCE.md`
  - `PRIVACY_DATA_MAP.md`
  - `TESTING.md`
  - `MOBILE_TEST_REPORT.md`
  - `INTEGRATION_TEST_REPORT.md`
  - `LOCALIZATION.md`
  - `ACCESSIBILITY_REPORT.md`
  - `NAVIGATION.md`
  - `RELEASE_GUIDE.md`
  - `PLAY_STORE_RELEASE.md`
  - `APP_STORE_RELEASE.md`
  - `STORE_CHECKLIST.md`
  - `KNOWN_LIMITATIONS.md`
  - `FINAL_MOBILE_AUDIT.md`
  - `FINAL_MOBILE_TEST_REPORT.md`
  - `MOBILE_SECURITY_REPORT.md`
  - `RELEASE_READINESS.md`
- Flutter SDK was not available in the current Codex environment when this
  scaffold was created, so `flutter pub get`, `flutter analyze`, and builds
  still need to run on a machine with Flutter installed.

## Required Commands

Use `Makefile` on CI/Linux/macOS runners:

```bash
make -C mobile ci
make -C mobile build-staging-apk
make -C mobile build-production-appbundle PRODUCTION_API_URL=https://api.example.com/api/v1
make -C mobile build-production-ipa PRODUCTION_API_URL=https://api.example.com/api/v1
```

Equivalent direct commands:

```powershell
flutter pub get
dart run build_runner build --delete-conflicting-outputs
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter test integration_test
flutter build apk --flavor staging --dart-define=AIN_FLAVOR=staging --dart-define=AIN_API_BASE_URL=https://staging-api.example.com/api/v1
flutter build appbundle --flavor production --dart-define=AIN_FLAVOR=production --dart-define=AIN_API_BASE_URL=https://api.example.com/api/v1
flutter build ios --flavor staging --no-codesign --dart-define=AIN_FLAVOR=staging --dart-define=AIN_API_BASE_URL=https://staging-api.example.com/api/v1
flutter build ipa --flavor production --dart-define=AIN_FLAVOR=production --dart-define=AIN_API_BASE_URL=https://api.example.com/api/v1
```

## Release Guard

`AppEnvironment.validate()` rejects production builds that use non-HTTPS API
URLs or enable mock data. Keep this guard in the bootstrap path for every
flavor entry point.

Production builds must go through manual approval. CI may validate and build
candidate artifacts, but must not automatically release to App Store Connect or
Google Play.
