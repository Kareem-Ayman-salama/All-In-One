# Mobile Offline Strategy

The backend-owned offline cache policy is available at
`GET /api/v1/meta/offline-cache-policy`.

## Implementation

- Manifest repository: `lib/src/features/metadata/data/metadata_repository.dart`.
- Policy parser: `lib/src/core/cache/offline_cache_policy.dart`.
- Tenant cache scope: `lib/src/core/cache/tenant_cache_scope.dart`.
- Backend source: `backend/config/offline_cache.php`.

`OfflineCachePolicy.shouldPersistDataset()` rejects unknown datasets,
`memory_only` datasets, non-readable datasets, and datasets marked
`neverPersist`.

## Storage Rules

- `content.view_session` is memory-only and must never be persisted.
- Tenant-scoped cache keys must include organization ID.
- User-scoped cache keys must include user ID.
- Public cache keys must not include tenant identifiers.
- User-scoped cache must be purged on logout, session revocation, account
  deletion, device unlink, workspace removal, and security reset.
- Write operations default to server confirmation unless the backend marks them
  as safe optimistic actions.

`TenantCacheKeyFactory.datasetKey()` throws when a user-scoped or
organization-scoped dataset is requested without the required active scope. This
prevents accidental cross-tenant cache reuse.

## Initial Cache Candidates

- User profile.
- Workspace list.
- Marketplace courses and academies.
- Student enrollments.
- Organization announcements and schedule.
- Notification inbox.
- Content metadata without signed URLs or private storage paths.

## Protected Content Viewer

`ContentViewerController` may hold a signed `ContentViewSession.url` while the
viewer is open, but this state must never be written to local storage. The
controller clears viewer state after `closed`.
