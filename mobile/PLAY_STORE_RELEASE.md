# Play Store Release

## App Listing Inputs

| Field | Current Value |
|---|---|
| App name | AIN |
| Package ID | Pending Android project generation. |
| Category | Education / Business, final choice pending store strategy. |
| Short description | Pending marketing approval. |
| Full description | Pending marketing approval. |
| Privacy policy URL | Required before internal testing. |
| Support URL | Required before internal testing. |
| Terms URL | Required before internal testing. |

## Required Android Work

- Generate/audit Android project files.
- Configure development, staging, and production application IDs.
- Add adaptive launcher icon and splash screen.
- Configure notification channels.
- Configure verified app links.
- Disable cleartext traffic for production.
- Add file provider only if uploads/downloads require it.
- Add release signing placeholders and CI secret references.
- Review ProGuard/R8 and release obfuscation.
- Request only required permissions.

## Release Gate

Do not upload to production without explicit approval. Internal testing may use
staging builds after Flutter analysis, tests, Android build validation, and
security checklist items pass.
