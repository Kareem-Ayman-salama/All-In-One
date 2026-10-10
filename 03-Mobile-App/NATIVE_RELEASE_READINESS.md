# Native Release Readiness

Date: 2026-10-02

## Current Decision

Do not release.

Phase 6 is in progress. Local Flutter, Android, and Laravel verification now
runs on this machine. The release remains blocked on iOS/macOS validation,
production signing, final store identifiers, real-device QA, and store/privacy
approval.

## Local Toolchain

- Flutter 3.44.8 and Dart 3.12.2 are available from
  `C:\Users\DELL\.cache\codex-runtimes\flutter-stable`.
- PHP 8.3.33 is available from
  `C:\Users\DELL\.cache\codex-runtimes\php-8.3.33`.
- Composer 2.10.2 is available from
  `C:\Users\DELL\.cache\codex-runtimes\composer.phar`.
- Android SDK 36.1.0 is available through Android Studio.
- `03-Mobile-App/android` and `03-Mobile-App/ios` are generated.
- iOS build validation still requires macOS/Xcode.
- Command names used by the local gates: `flutter`, `dart`, `php`, and
  `composer`.

## Completed Local Gates

- `flutter analyze` passes.
- `flutter test` passes.
- Android release builds reject missing or incomplete signing configuration.
- The release workflow requires the final HTTPS API and Firebase configuration.
- Laravel `php artisan test` passes with 148 tests and 1009 assertions.
- Flutter `flutter test` passes with 12 tests.
- Final signed APK/AAB artifacts still require the real upload key.
- Repository `pnpm test` passes marketplace, production, and integration
  validators.

## Required Flutter Gates

Run these from a clean checkout with the local toolchain on PATH:

```bash
make -C 03-Mobile-App bootstrap
make -C 03-Mobile-App generate
make -C 03-Mobile-App format
make -C 03-Mobile-App analyze
make -C 03-Mobile-App test
make -C 03-Mobile-App build-staging-apk STAGING_API_URL=https://staging-api.example.com/api/v1
make -C 03-Mobile-App build-production-appbundle PRODUCTION_API_URL=https://api.example.com/api/v1
make -C 03-Mobile-App build-staging-ios STAGING_API_URL=https://staging-api.example.com/api/v1
make -C 03-Mobile-App build-production-ipa PRODUCTION_API_URL=https://api.example.com/api/v1
```

## Android Native Audit

- `03-Mobile-App/android` is generated.
- Provisional package IDs are configured:
  `com.ain.ain_mobile.dev`, `com.ain.ain_mobile.staging`, and
  `com.ain.ain_mobile`.
- `compileSdk` is aligned to Android API 36 for app and plugin subprojects.
- Confirm only required permissions are declared, including network and push
  notification permissions.
- Confirm notification icon, channel, and Firebase configuration are present.
- Confirm signing uses local or CI secrets, with no keystore secrets committed.
- Confirm R8/ProGuard, backup rules, cleartext traffic policy, and app links.
- Confirm secure content behavior on device: no persisted signed URLs and no
  unintended download surface.

## iOS Native Audit

- `03-Mobile-App/ios` is generated.
- Default generated bundle ID is `com.ain.ainMobile`; final production bundle
  ID still needs product/App Store confirmation.
- Confirm iOS schemes/flavors on macOS/Xcode.
- Confirm bundle identifiers per flavor and production bundle ID.
- Confirm signing team, profiles, and release export options.
- Confirm push notification entitlement and `aps-environment`.
- Confirm associated domains for universal links.
- Confirm Info.plist display name, version, build number, and usage strings.
- Confirm App Transport Security allows only approved HTTPS endpoints.
- Confirm secure content behavior on device: signed URLs stay memory-only and
  blocked download/capture actions are audited where supported.

## Backend Release Gates

Run these with the local PHP/Composer toolchain:

```bash
composer install
php artisan test
php artisan route:list --path=api/v1
```

Verify production seed/demo data for auth, workspaces, courses, bookings,
notifications, organization management, platform moderation, metadata,
deep-link manifests, offline cache policy, and protected content sessions.

## Store Submission Gates

- App icon, splash screen, screenshots, and store listing copy are final.
- Privacy policy, terms URL, data safety, and App Privacy answers are reviewed.
- Arabic RTL and English LTR smoke checks pass on physical devices.
- TalkBack and VoiceOver smoke checks pass.
- Play internal testing and TestFlight pass before public rollout.
- Product, backend, QA, and privacy approvals are recorded in the release
  ticket.
- CI and store automation must not automatically release production builds.

## Exit Criteria

Phase 6 can close only after iOS builds pass on macOS/Xcode, Android/iOS
signing is configured, final IDs are approved, real-device QA passes, and store
approval gates are complete.
