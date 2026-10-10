# Mobile Error Handling

The Laravel API returns a standard error envelope through
`backend/app/Support/ApiResponse.php`. Mobile error handling must preserve the
backend `code`, `requestId`, localized catalog entry, retry hint, and validation
details.

## Implemented Foundation

- Dio adds `X-Request-ID` to every request.
- Dio adds `X-AIN-Platform` and `X-AIN-App-Version` for audit and viewer-event
  metadata.
- `lib/src/core/errors/api_error_mapper.dart` maps Dio errors and Laravel error
  envelopes into `ApiError`.
- `ApiError` stores `code`, `message`, `messageAr`, `requestId`, `category`,
  `retryable`, and `details`.
- Auth sign-in uses `ApiErrorMapper` instead of displaying raw exception text.

## Mobile Rules

- UI layers should display localized messages, not backend enum codes.
- Log only the `requestId` and safe code/category metadata.
- Retry only when `retryable=true` or the failure is a safe network timeout for
  an idempotent operation.
- Validation details should be mapped to form fields when the backend returns
  `VALIDATION_ERROR`.
- `SESSION_EXPIRED` and refresh failure should clear secure session state and
  return to login.

## Refresh Rules

- `TokenRefreshCoordinator` performs at most one in-flight refresh request.
- Requests that receive `401` are retried once after a successful refresh.
- Refresh requests are marked with `skipAuthRefresh` to avoid recursive refresh
  loops.
- Retried requests are marked with `retriedAfterRefresh` and will not be retried
  again.
- If refresh fails or returns an incomplete token payload, secure session state
  is cleared.

## Catalog

Load `GET /api/v1/meta/error-catalog` during app startup or after login and
cache it according to `OFFLINE_STRATEGY.md`. API responses also include
`error.catalog` for recognized codes.
