# AIO Laravel API Requirements

## Stack Decision

The original backend prompt proposed NestJS when no backend existed. The user
selected PHP Laravel explicitly, so the implementation uses:

- PHP 8.5
- Laravel 13 modular monolith
- REST under `/api/v1`
- PostgreSQL in production
- SQLite for fast local and unit/integration tests
- Redis for cache, queues, locks, and distributed rate limits
- Laravel Sanctum for API authentication
- S3-compatible storage for production files
- Scramble-generated OpenAPI documentation

The domain boundaries, security requirements, transactions, observability, and
deployment acceptance criteria from the original prompt remain unchanged.

## Response Contract

Success:

```json
{
  "data": {},
  "meta": {},
  "requestId": "uuid"
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": {},
    "catalog": {
      "category": "request",
      "retryable": false,
      "messageEn": "Check the highlighted fields and try again.",
      "messageAr": "راجع الحقول المطلوبة وحاول مرة أخرى."
    },
    "requestId": "uuid"
  }
}
```

Mobile clients can also load `GET /api/v1/meta/error-catalog` to cache the full
localized error catalog.

Mobile metadata endpoints:

- `GET /api/v1/meta/error-catalog`
- `GET /api/v1/meta/deep-links`
- `GET /api/v1/meta/offline-cache-policy`
- `GET /api/v1/meta/device-policy`

## Required Error Codes

- `VALIDATION_ERROR`
- `AUTHENTICATION_REQUIRED`
- `INVALID_CREDENTIALS`
- `SESSION_EXPIRED`
- `FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `TENANT_ACCESS_DENIED`
- `DUPLICATE_RESOURCE`
- `INVITATION_EXPIRED`
- `MODULE_DISABLED`
- `PLAN_LIMIT_REACHED`
- `COURSE_NOT_PUBLISHED`
- `BATCH_NOT_OPEN`
- `BOOKING_CAPACITY_FULL`
- `DUPLICATE_BOOKING`
- `SUBSCRIPTION_EXPIRED`
- `FILE_NOT_AVAILABLE`
- `CONTENT_NOT_AVAILABLE`
- `CONTENT_ACCESS_EXPIRED`
- `DOWNLOAD_DISABLED`
- `RATE_LIMITED`
- `INTERNAL_SERVER_ERROR`

## Initial Release Gates

- No route may trust an editable tenant ID.
- All tenant-owned tables include `organization_id`.
- Booking confirmation is transactional and idempotent.
- Public listings expose only approved and published records.
- Protected content requires active enrollment, room membership, and access
  subscription.
- Production startup fails when required secrets are absent.
- Mock data is never a production fallback.
