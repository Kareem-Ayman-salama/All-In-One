# App Store Release

## App Listing Inputs

| Field | Current Value |
|---|---|
| App name | AIN |
| Bundle ID | Generated default: `com.ain.ainMobile`; final ID pending App Store confirmation. |
| Category | Education / Business, final choice pending store strategy. |
| Subtitle | Pending marketing approval. |
| Description | Pending marketing approval. |
| Privacy policy URL | Required before TestFlight external testing. |
| Support URL | Required before TestFlight external testing. |

## Required iOS Work

- iOS project files are generated.
- Configure development, staging, and production bundle identifiers.
- Validate schemes, signing, and archive on macOS/Xcode.
- Configure app icon and launch screen.
- Configure associated domains for universal links.
- Configure push notification capability.
- Review Keychain storage and file protection.
- Add privacy usage descriptions only for enabled capabilities.
- Add signing documentation and CI key management.
- Review screen-capture handling policy for protected content.

## Release Gate

Do not release to App Store production without explicit approval. TestFlight may
start only after iOS build validation, privacy declarations, and security
checklist items pass.
