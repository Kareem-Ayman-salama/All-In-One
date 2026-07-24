# Mobile Deep Links

The app must load the deep-link manifest from
`GET /api/v1/meta/deep-links`. Do not hardcode route templates in feature
screens.

## Implementation

- Manifest repository: `lib/src/features/metadata/data/metadata_repository.dart`.
- Resolver service: `lib/src/core/deep_links/deep_link_service.dart`.
- Backend source: `backend/config/deep_links.php`.

The resolver matches incoming URI path segments against manifest route paths,
extracts path parameters, preserves query parameters, and returns the backend
`mobileScreen`, `requiresAuth`, and `fallbackPath` values.

## Required Handling

- Validate invitation, reset-password, marketplace, booking, notification,
  content, organization, and platform approval links through the manifest.
- If `requiresAuth=true` and there is no valid session, store the resolved link
  as pending navigation and redirect to login.
- Use `fallbackPath` for web fallback when the native screen cannot open the
  target.
- Treat unknown links as unsupported instead of guessing a screen.

