# Mobile Security Checklist

## Completed Foundation

- [x] Production API URL must be HTTPS.
- [x] Production builds cannot enable mock data.
- [x] Access token attachment is centralized in Dio.
- [x] Token refresh is coordinated to avoid parallel refresh storms.
- [x] Tokens use secure storage.
- [x] Installation ID is app-generated instead of hardware fingerprinted.
- [x] Telemetry and crash context pass through privacy redaction.
- [x] Protected content uses short-lived view sessions.
- [x] Signed content URLs are not persisted.
- [x] Notification taps resolve through validated deep-link metadata.

## Required Before Staging

- [ ] Run `flutter analyze`.
- [ ] Run `flutter test`.
- [ ] Run `flutter test integration_test` against staging/test backend.
- [ ] Add manipulated deep-link tests.
- [ ] Add cross-tenant cache leakage tests.
- [ ] Add logout data-clearing tests.
- [ ] Add Android production cleartext-traffic guard.
- [ ] Add iOS file protection review.
- [ ] Configure Firebase staging and production projects.
- [ ] Verify crash reports contain no tokens, signed URLs, or private file data.
- [ ] Verify push notification bodies do not include sensitive student data.

## Release Blockers

- Missing Flutter SDK/native build verification in the current environment.
- Native Android and iOS folders are not yet generated or audited.
- Store privacy declarations must be completed with final analytics/crash
  configuration.
