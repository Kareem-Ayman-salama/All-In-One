# Mobile Push Notifications

Push registration uses Firebase Cloud Messaging tokens and the existing backend
device-token API.

## Implementation

- Registration service: `lib/src/core/notifications/push_registration_service.dart`.
- Device repository: `lib/src/features/devices/data/device_repository.dart`.
- Backend endpoints:
  - `POST /api/v1/devices/push-tokens`
  - `DELETE /api/v1/devices/push-tokens`

## Token Lifecycle

- Register the FCM token after login.
- Register again whenever Firebase reports a token refresh.
- Include the app-generated `installationId`, platform, optional device name,
  and app version.
- Revoke the current installation token during logout and explicit device
  unlink.
- Never include sensitive course, file, student, or token data in push bodies.

## Notification Tap Routing

Notification payloads should resolve a manifest route from
`GET /api/v1/meta/deep-links`. The app should open the native screen named by
`mobileScreen` after checking authentication and workspace context.

