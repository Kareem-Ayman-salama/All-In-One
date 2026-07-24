# Mobile Security

This file records the implemented security posture for the current scaffold and
the remaining mobile hardening work.

## Implemented Foundation

- `AppEnvironment.validate()` rejects production builds using non-HTTPS API
  URLs.
- `AppEnvironment.validate()` rejects mock data in production.
- Tokens are stored through `FlutterSecureStorage`.
- Dio attaches the access token centrally and redacts the `Authorization`
  header from request options before forwarding errors.
- `TokenRefreshCoordinator` limits token refresh to one in-flight request and
  retries failed authenticated requests once.
- Installation IDs are app-generated with `Random.secure()` and stored in
  secure storage.
- Protected content uses short-lived view sessions and viewer audit events.
- `ContentViewerController` stores signed view URLs only in memory and clears
  viewer state on close.
- Offline policy rejects memory-only signed content URLs from persistence.
- Tenant cache keys require user ID for user-scoped datasets and organization ID
  for organization-scoped datasets.
- Deep links resolve through the backend manifest instead of arbitrary route
  guesses.
- `TelemetryService` sends events and errors only through `PrivacyRedactor`.
- `CrashReportingSink` is prepared for Firebase Crashlytics after Firebase
  configuration is available.

## Required Before Staging

- Add Android cleartext-traffic production guard.
- Add iOS file protection review.
- Add encrypted Drift persistence behind the tenant-aware cache key factory.
- Configure Firebase staging/production projects before enabling crash
  reporting.
- Add manipulated deep-link and cross-tenant cache tests.
- Run `flutter analyze`, `flutter test`, Android build, and iOS validation on a
  machine with Flutter and native tooling installed.
