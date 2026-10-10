# Release Readiness

Date: 2026-10-02

## Decision

Do not release.

## Ready

- Backend/mobile API contract seed exists.
- Flutter app source scaffold exists.
- Release command list and Makefile exist.
- CI workflow scaffold exists.
- Security, privacy, push, deep-link, offline, content, localization, and
  accessibility documentation exists.
- Native release readiness checklist exists in `03-Mobile-App/NATIVE_RELEASE_READINESS.md`.
- App-layer offline cache policy, notification cache fallback, protected
  content session UX, and deep-link readiness UI are implemented.
- Flutter 3.44.8/Dart 3.12.2 local verification is available.
- Android and iOS platform folders are generated.
- `flutter analyze` and `flutter test` pass.
- Android release builds fail closed unless a complete production keystore is configured.
- Laravel `php artisan test` passes locally (148 tests, 1009 assertions).
- Flutter static analysis and all 12 tests pass locally.
- Certificates and invoices in Profile load from the authenticated APIs; no
  synthetic document numbers or amounts are shown.

## Not Ready

- iOS build validation has not run because macOS/Xcode is required.
- Staging integration testing has not run.
- Store listing, privacy policy URLs, screenshots, and legal text are pending.
- Native signing, package identifiers, entitlements, permissions, app links,
  screenshots, and store metadata have not been verified on real devices.
- Android production signing, API URL, and Firebase configuration are required
  GitHub secrets; the release workflow stops before building if any are missing.
- A signed production AAB has not yet been generated with the final keystore.
- `file_picker` emits a Flutter KGP compatibility warning; monitor or upgrade
  once a built-in-Kotlin compatible release is available.
- Platform support/admin scope still needs a product decision if those web-only
  operations must ship on mobile.

## Next Release Milestone

Validate the generated iOS project on macOS/Xcode, configure final Android/iOS
identifiers and signing, finish any confirmed platform-admin mobile scope,
complete real-device QA, then repeat the final audit with store-ready artifacts.
