# Mobile Architecture

The mobile app follows feature-first Clean Architecture with Riverpod
dependency injection.

## Layers

- Presentation: pages and widgets only.
- Application: controllers, route guards, and UI state orchestration.
- Domain: entities, repository interfaces, and use cases.
- Data: generated API client wrappers, DTOs, mappers, local data sources, and
  repository implementations.

Screens must not call Dio directly. Feature repositories should wrap generated
OpenAPI clients from `../docs/mobile-openapi.json` and map DTOs to domain
models before exposing data to widgets.

The current scaffold already follows this direction with repository adapters
under `lib/src/features/*/data`. These adapters use Dio temporarily and should
be swapped to generated OpenAPI clients after Dart code generation is available.

## Core Modules

- `core/api`: Dio, generated client integration, request IDs, auth headers,
  refresh coordination, retry policy, and error mapping.
- `core/errors`: Laravel error-envelope parsing, catalog-aware messages,
  retryability, validation details, and request ID preservation.
- `core/auth`: secure token storage, session restoration, refresh, logout, and
  device metadata.
- `core/auth/token_refresh_coordinator.dart`: single-flight refresh-token
  rotation and one retry for authenticated requests.
- `core/cache`: tenant-aware local persistence using the offline cache policy.
- `core/cache/tenant_cache_scope.dart`: active user/organization cache scope and
  cache-key generation that rejects missing user or tenant IDs.
- `core/deep_links`: manifest loading and route validation.
- `core/notifications`: FCM token lifecycle, local notifications, tap routing,
  and preference handling.
- `core/security`: log redaction, protected content policies, and environment
  guards.
