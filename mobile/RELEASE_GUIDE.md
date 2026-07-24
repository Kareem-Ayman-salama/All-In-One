# Mobile Release Guide

This guide defines the manual release path for the AIN Flutter app. CI may build
and validate artifacts, but it must not automatically release to App Store
Connect or Google Play.

## Required Approval

Production releases require approval from product, backend, QA, and privacy
owners before any store upload. Use a protected CI environment such as
`mobile-production-approval` for production build checks.

## Preflight

- Confirm `docs/mobile-openapi.json` matches the deployed Laravel API version.
- Confirm production uses HTTPS and `AIN_ALLOW_MOCK_DATA=false`.
- Confirm Firebase projects, push credentials, and Crashlytics keys belong to
  the selected flavor.
- Confirm signed content view sessions are memory-only and never persisted.
- Run the full mobile CI command from `mobile/Makefile`.

## Commands

```bash
make -C mobile ci
make -C mobile build-production-appbundle PRODUCTION_API_URL=https://api.example.com/api/v1
make -C mobile build-production-ipa PRODUCTION_API_URL=https://api.example.com/api/v1
```

## Store Flow

1. Upload Android app bundle to Play Console internal testing first.
2. Upload iOS IPA to TestFlight first.
3. Complete smoke testing against the production API with an approved test
   organization.
4. Review crash logs, push registration, login refresh, workspace selection,
   deep links, protected content playback, and logout/device revocation.
5. Promote only after approval is recorded in the release ticket.

## Rollback

Stop rollout in the store console, revoke affected push credentials if needed,
and disable risky backend feature flags before publishing a replacement build.

