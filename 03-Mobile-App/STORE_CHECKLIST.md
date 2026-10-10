# Mobile Store Checklist

Use this checklist before uploading a production candidate to Play internal
testing or TestFlight.

## Build

- `03-Mobile-App/android` and `03-Mobile-App/ios` are generated or restored and committed.
- `flutter pub get` completed on a clean checkout.
- `dart run build_runner build --delete-conflicting-outputs` completed.
- `dart format --set-exit-if-changed .` completed.
- `flutter analyze` completed.
- `flutter test` completed.
- Android app bundle built with `flutter build appbundle --flavor production`.
- iOS archive built with `flutter build ipa --flavor production`.

## Security And Privacy

- Production API URL is HTTPS.
- Mock data is disabled.
- Android release workflow has `PRODUCTION_API_BASE_URL`, signing secrets, and
  `ANDROID_GOOGLE_SERVICES_JSON_BASE64` configured.
- Native package IDs, bundle IDs, entitlements, app links, and permissions are
  audited per `03-Mobile-App/NATIVE_RELEASE_READINESS.md`.
- Signed content URLs are memory-only.
- Telemetry and crash logs are redacted by `PrivacyRedactor`.
- Push tokens are tied to installation ID and revoked on logout.
- No Firebase Analytics package is enabled without privacy approval.

## QA

- Login and token refresh pass on production.
- Workspace selection loads organization context before navigation.
- Offline cache keys are scoped by user and organization.
- Deep links route through the backend manifest.
- Protected content audits `opened`, `watermark_rendered`, `closed`, and
  blocked download or capture events.
- Arabic RTL and English LTR smoke checks are complete.
- TalkBack and VoiceOver smoke checks are complete.

## Release Gate

- Product approval recorded.
- Backend approval recorded.
- QA approval recorded.
- Privacy approval recorded.
- Candidate goes to Play internal testing and TestFlight before public rollout.
- CI and store automation do not automatically release production builds.
