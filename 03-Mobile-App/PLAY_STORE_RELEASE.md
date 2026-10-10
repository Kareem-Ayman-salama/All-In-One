# Play Store Release

## App Listing Inputs

| Field | Current Value |
|---|---|
| App name | AIN |
| Package ID | Provisional production ID: `com.ain.ain_mobile`. |
| Category | Education / Business, final choice pending store strategy. |
| Short description | Pending marketing approval. |
| Full description | Pending marketing approval. |
| Privacy policy URL | Required before internal testing. |
| Support URL | Required before internal testing. |
| Terms URL | Required before internal testing. |

## Required Android Work

- Android project files are generated.
- Development, staging, and production application IDs are configured
  provisionally.
- Add adaptive launcher icon and splash screen.
- Configure notification channels.
- Configure verified app links.
- Disable cleartext traffic for production.
- Add file provider only if uploads/downloads require it.
- Configure the real upload/signing credentials and required CI secrets; debug
  signing fallback is already blocked for release builds.
- Review ProGuard/R8 and release obfuscation.
- Request only required permissions.

## Release Gate

Do not upload to production without explicit approval. Internal testing may use
staging builds after Flutter analysis, tests, Android build validation, and
security checklist items pass.
