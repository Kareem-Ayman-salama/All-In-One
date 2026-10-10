# Mobile Testing Strategy

Flutter SDK is not available in the current environment, so these tests are not
yet executable here. This file defines the required test plan for the scaffold.

## Unit Tests

- `AppEnvironment.validate()` rejects production non-HTTPS URLs and mock data.
- `RequestIdFactory.create()` returns unique request IDs.
- `ApiErrorMapper` parses Laravel `error.catalog`, `requestId`, retryable flag,
  and validation details.
- `TokenRefreshCoordinator` runs one in-flight refresh and retries each
  authenticated request once.
- `OfflineCachePolicy.shouldPersistDataset()` rejects `content.view_session`.
- `TenantCacheKeyFactory.datasetKey()` includes organization ID for
  organization-scoped datasets and throws when scope is missing.
- `DeepLinkService` resolves manifest routes and rejects unknown links.
- `PushRegistrationService` registers and revokes by installation ID.
- `AuthController` stores tokens through `SecureTokenStore` after login.
- `PrivacyRedactor` redacts tokens, signed URLs, and sensitive student fields.
- `TelemetryService` forwards only redacted event/error context to sinks.

## Widget Tests

- Login form validates email and password.
- Workspace screen shows loading, error, empty, and list states.
- Workspace selection loads organization context before navigating home.
- Current scaffold strings render in Arabic and English.
- RTL text direction is correct for Arabic.
- Loading indicators expose semantic labels.

## Integration Tests

- Login against staging/test backend.
- Restore session after app restart.
- Workspace switch clears tenant-scoped state.
- Register push token after login and on token refresh.
- Open a protected content view session and record viewer audit events.
- Verify `ContentViewerController.close()` clears the in-memory signed URL state.
- Verify telemetry for content opening never includes signed URLs.
- Resolve notification taps through `/meta/deep-links`.
- Confirm offline write blocking for bookings/content upload.

## Required Commands

```powershell
flutter pub get
dart run build_runner build --delete-conflicting-outputs
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter test integration_test
```

Do not mark mobile acceptance complete until these commands run on a machine
with Flutter and native tooling installed.
