# Mobile Requirements

The Flutter app must be a real client for the existing Laravel API. It must not
ship with mock fallbacks, hardcoded production data, or duplicated backend
business rules.

## Product Requirements

- Support students, instructors, organization owners/admins, staff members, and
  a limited super-admin review experience where mobile is useful.
- Preserve the main product flow:
  course to batch to booking to enrollment to organization membership to room
  membership to subscription to protected content access.
- Keep marketplace, business workspace, protected content, notification, and
  subscription concepts separate in domain models.
- Use the backend as the final authority for tenant access, permissions,
  module availability, plan limits, booking confirmation, and content access.

## Technical Requirements

- Flutter stable with Dart strict analysis.
- Material 3, Riverpod, GoRouter, Dio, immutable DTO/domain models, typed JSON
  serialization, secure storage, typed local cache, FCM, local notifications,
  app links/universal links, connectivity monitoring, and privacy-aware crash
  reporting.
- Generate the first typed API client from `docs/mobile-openapi.json`; wrap it
  behind repository interfaces.
- Configure development, staging, and production flavors with API base URL,
  Firebase settings, logging level, and deep-link configuration.
- Release builds must fail fast if they point at development APIs or enable mock
  data.

## Security Requirements

- Store access and refresh tokens only in secure storage.
- Redact tokens, signed content URLs, passwords, private file metadata, and
  sensitive student data from logs and crash reports.
- Use app-generated installation IDs; do not use device fingerprinting.
- Isolate tenant cache by organization ID and purge scoped data on logout,
  session revocation, account deletion, device unlink, and workspace removal.
- Use HTTPS-only production networking and disable cleartext traffic in
  production Android configuration.
- Validate deep links against `/meta/deep-links`.
- Use protected content view sessions and viewer audit events; never persist
  signed content URLs.

## UX Requirements

- Arabic-first UI with full RTL support and English LTR support.
- Accessible touch targets, screen-reader labels, logical focus order,
  sufficient contrast, text scaling, and status states that are not color-only.
- Loading, empty, error, permission-denied, locked-module, expired-session, and
  offline states must exist for critical screens.
- Important writes require server confirmation. Optimistic updates are allowed
  only for reversible actions such as marking notifications as read.

## Testing Requirements

- Unit tests for model mapping, repositories, token refresh, error mapping,
  permission logic, workspace switching, deep-link parsing, notification
  routing, and protected-content logic.
- Widget tests for auth, workspace selection, marketplace, booking, content,
  permission states, empty states, errors, and RTL.
- Integration tests against staging/test backend for login, workspace switch,
  course exploration, booking, enrollment, protected content, notification tap,
  invitation acceptance, and logout/session revocation.
- Security tests for invalid tokens, failed refresh, cross-tenant cache,
  manipulated deep links, organization ID manipulation, content authorization,
  logout clearing, token redaction, and release debug logging.

