# Mobile Protected Content Viewer

Protected content must use the backend view-session and viewer-audit contracts.
The signed URL is a short-lived secret and must remain memory-only.

## Implementation

- Repository: `lib/src/features/content/data/content_repository.dart`.
- Controller: `lib/src/features/content/application/content_viewer_controller.dart`.
- Backend endpoints:
  - `GET /api/v1/organizations/:organizationId/content/:contentId/view-session`
  - `POST /api/v1/organizations/:organizationId/content/:contentId/viewer-audit`
- Offline policy: `content.view_session` is `memory_only` and `neverPersist`.

## Lifecycle

1. `ContentViewerController.open()` requests a view session.
2. It generates an in-memory `viewerSessionId`.
3. It records `opened`.
4. If watermarking is enabled, it records `watermark_rendered`.
5. The renderer uses `ContentViewSession.url` in memory until `expiresAt`.
6. `close()` records `closed` and clears the viewer state.
7. `recordFailure()` records `failed`.

## Security Events

The controller exposes explicit methods for:

- `screenshot_warning`
- `screen_capture_started`
- `screen_capture_stopped`
- `download_blocked`

The future PDF/image/video renderer should call these methods instead of
hand-writing event names.

## Rules

- Do not persist `ContentViewSession.url`.
- Do not log signed URLs.
- Do not enable downloads unless `downloadAllowed=true` and backend download
  authorization succeeds.
- The viewer UI must render watermark data when `watermark.enabled=true`.

