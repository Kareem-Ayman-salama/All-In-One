# Mobile Privacy Data Map

This map records data categories the mobile app may process and how they should
be stored or reported.

| Data category | Examples | Storage | Telemetry |
|---|---|---|---|
| Auth secrets | Access token, refresh token | `FlutterSecureStorage` only | Never send |
| Installation ID | App-generated device installation ID | `FlutterSecureStorage` | Allowed as device/session metadata when needed |
| User profile | Name, email, preferences | Secure/encrypted cache by policy | Avoid raw personal fields |
| Workspace membership | Organization ID, role, modules | Tenant-aware encrypted cache | Organization ID only when privacy-safe |
| Marketplace public data | Public courses, academies | Non-sensitive cache | Allowed as course/academy IDs |
| Booking data | Booking status, batch ID | Encrypted cache when policy allows | Status and IDs only |
| Notification data | Notification ID, type, target | Encrypted cache | Notification ID/type only |
| Protected content metadata | Content ID, MIME type, size | Encrypted cache without signed URLs | Content ID/MIME/status only |
| Signed content URL | View-session URL | Memory only | Never send |
| Private file content | PDF/image/video bytes | Viewer memory/cache controlled by platform policy | Never send |
| Student contact data | Email, phone | Encrypted cache only when required | Never send raw values |

## Purge Triggers

Purge user or organization-scoped data on logout, session revocation, account
deletion, device unlink, workspace removal, and security reset.

