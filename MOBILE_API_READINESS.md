# Mobile API Readiness

This checklist maps the Flutter mobile specification to the current React and
Laravel codebase. The Flutter app should treat the Laravel API as the source of
truth and wrap these contracts behind typed repositories.

## Ready Contracts

| Area | Current support | Primary files |
|---|---|---|
| Auth/session cycle | Register, verify email, login, refresh rotation, logout, session listing, revoke current/other sessions | `backend/routes/api.php`, `backend/app/Services/Auth/AuthService.php` |
| Workspace selection | Multi-organization workspace list and active organization context | `backend/app/Http/Controllers/Api/V1/WorkspaceController.php`, `src/contexts/OrganizationContext.jsx` |
| Public marketplace | Courses, academies, categories, instructors, course booking | `backend/app/Http/Controllers/Api/V1/PublicMarketplaceController.php`, `src/services/marketplaceRepository.js` |
| Student learning | Student bookings, enrollments, lesson bookings, course room access | `backend/app/Http/Controllers/Api/V1/StudentController.php`, `backend/app/Http/Controllers/Api/V1/LessonBookingController.php` |
| Organization operations | Courses, batches, bookings, members, rooms, content, announcements, events, tasks | `backend/routes/api.php`, `src/services/api.js`, `src/services/learningRepository.js` |
| Notification inbox | In-app notification list, mark read, mark all read, notification preferences | `backend/app/Http/Controllers/Api/V1/NotificationController.php`, `backend/app/Http/Controllers/Api/V1/NotificationPreferenceController.php` |
| Mobile push registration | FCM device token register, refresh, revoke, and cleanup on session revoke/logout | `backend/app/Http/Controllers/Api/V1/DevicePushTokenController.php`, `backend/app/Models/PushDeviceToken.php` |
| Push delivery worker | Notification-created queue job, preference-aware token lookup, provider contract, and disabled default provider for safe environments | `backend/app/Jobs/SendPushNotification.php`, `backend/app/Contracts/Notifications/PushNotificationProvider.php` |
| Protected content viewing | Short-lived signed view session, file metadata, download policy, watermark payload, access log | `backend/app/Http/Controllers/Api/V1/ContentController.php`, `src/services/api.js` |
| Content viewer audit | Viewer-side events for opened, closed, failed, screenshot/screen-capture warnings, blocked download, and watermark rendering | `backend/app/Http/Requests/Content/StoreContentViewerAuditRequest.php`, `src/services/contentViewerAudit.js` |
| Mobile error catalog | Public catalog with stable API codes, Arabic/English messages, categories, and retry hints | `backend/config/api_errors.php`, `backend/app/Http/Controllers/Api/V1/MetadataController.php`, `src/services/apiErrors.js` |
| Deep-link manifest | Public map of web/app route templates for invitations, reset password, marketplace, bookings, notifications, content, and moderation | `backend/config/deep_links.php`, `src/services/deepLinks.js` |
| Offline cache policy | Public policy for cacheable datasets, TTLs, storage class, purge triggers, sensitive fields, and offline write behavior | `backend/config/offline_cache.php`, `src/services/offlineCachePolicy.js` |
| Device policy | App-generated installation IDs, active-session limit, same-installation replacement, session metadata, and revocation cleanup | `backend/config/device_policy.php`, `src/services/devicePolicy.js` |

## Flutter Integration Contracts

The current checked-in OpenAPI seed for Flutter client generation is
`docs/mobile-openapi.json`. It covers the mobile auth/session metadata, push
token lifecycle, public metadata manifests, protected content view sessions,
and viewer audit events implemented in this pass.

### Push Tokens

- `POST /api/v1/devices/push-tokens`
- `DELETE /api/v1/devices/push-tokens`

Register the current FCM token after login and whenever Firebase reports a
token refresh. Send `installationId` from app-generated secure storage, not a
hardware fingerprint.

Every new backend `Notification` queues `SendPushNotification` after commit.
The job sends only when `pushEnabled` and the notification-specific preference
are enabled, and the default provider logs/skips delivery until a real Firebase
provider is configured.

### Content View Session

- `GET /api/v1/organizations/:organizationId/content/:contentId/view-session`
- `POST /api/v1/organizations/:organizationId/content/:contentId/viewer-audit`

Use the returned `url` directly in the mobile viewer until `expiresAt`. Do not
persist the signed URL or write it to logs. Use `watermark` to render an
in-viewer overlay when content policy requires it.

Send viewer audit events for `opened`, `closed`, `failed`,
`screenshot_warning`, `screen_capture_started`, `screen_capture_stopped`,
`download_blocked`, and `watermark_rendered`. The backend verifies room access
before writing the audit log.

### Error Catalog

- `GET /api/v1/meta/error-catalog`

Use this catalog to map API error codes to localized mobile messages. API error
responses also include `error.catalog` when the backend recognizes the code.

### Deep Links

- `GET /api/v1/meta/deep-links`

Use route names from the manifest rather than hardcoding screen paths in push
payloads. Notification taps should resolve `mobileScreen`, then fall back to
`webUrlTemplate` if the native app cannot open the target.

### Offline Cache Policy

- `GET /api/v1/meta/offline-cache-policy`

Use this manifest to configure Flutter local storage. Cache only datasets with
`offlineReadable=true`, never persist `memory_only` datasets, and purge
user-scoped or organization-scoped data on logout, session revocation, account
deletion, device unlink, or workspace removal. Writes such as bookings,
booking confirmation, and content upload require server confirmation; only
notification read state is marked as optimistic and reversible.

### Device Policy

- `GET /api/v1/meta/device-policy`

Flutter should generate an installation ID and keep it in secure storage. Login
requests may send `installationId`, `platform`, `appVersion`, and `deviceName`.
The backend enforces the active-session limit without hardware fingerprinting;
when the same installation signs in again, the old session is revoked and
replaced.

## Remaining Mobile Gaps

| Gap | Needed for release |
|---|---|
| Dart client generation | Run the approved Flutter code generator against `docs/mobile-openapi.json`, commit the generated client in the mobile repo, and smoke-test auth, push registration, metadata loading, and content viewing |
| Backend-generated OpenAPI parity | Once PHP is available in CI/dev, compare Scramble's generated OpenAPI output with `docs/mobile-openapi.json` and replace the seed if the generated contract is complete |
