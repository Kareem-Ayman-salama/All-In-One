# Frontend to Backend Mapping

All API routes are versioned under `/api/v1`.

Recent integrations:

- Room, content, announcement, and event lists are scoped to active room
  membership for students and members.
- Invitation links use `GET /public/invitations/{token}` before acceptance.
- Instructor availability and private lesson reservation/cancellation are
  connected to real endpoints.
- Organization tasks are connected to workspace task endpoints.
- Billing uses the real plan, interval, limits, and period end from
  `/workspaces`; the UI does not render placeholder invoices.
- Mobile push registration is available through device-token endpoints for
  Firebase Cloud Messaging integration.
- Backend notifications queue preference-aware push delivery jobs; production
  Firebase delivery can be enabled by binding a real push provider.
- Protected content supports short-lived mobile view sessions instead of
  exposing private object storage URLs.
- Mobile clients can load stable error and deep-link manifests from `/meta`.

| Frontend area | Backend domain | Primary endpoints |
|---|---|---|
| Login and account cycle | Auth | `/auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/logout` |
| Account settings | Users / Auth | `/auth/me`, `/auth/sessions`, `/users/me/preferences` |
| Workspace picker | Organizations / Memberships | `/workspaces`, `/organizations/:id/context` |
| Organization onboarding | Organizations / Plans | `/organizations`, `/organizations/:id/subscription` |
| Members and invitations | Memberships / Invitations | `/organizations/:id/members`, `/organizations/:id/invitations` |
| Rooms | Rooms | `/organizations/:id/rooms` |
| Files | Content / Files | `/organizations/:id/content`, `/organizations/:id/content/:contentId/view-session`, `/organizations/:id/content/:contentId/viewer-audit`, `/organizations/:id/content/:contentId/download` |
| Announcements | Announcements | `/organizations/:id/announcements` |
| Calendar and meetings | Events | `/organizations/:id/events` |
| Public course marketplace | Courses | `/public/courses`, `/public/courses/:slug` |
| Public academies | Academy profiles | `/public/academies`, `/public/academies/:slug` |
| Course wizard | Courses | `/organizations/:id/courses` |
| Batch management | Batches | `/organizations/:id/batches` |
| Public booking | Bookings | `/public/bookings` |
| Booking review | Bookings / Enrollments | `/organizations/:id/bookings/:bookingId/confirm` |
| Student course workspace | Enrollments / Content | `/me/enrollments`, `/me/enrollments/:id/workspace` |
| Promotions | Promotions | `/organizations/:id/promotions`, `/admin/promotions` |
| Platform moderation | Platform admin | `/admin/academies`, `/admin/courses`, `/admin/categories` |
| Notifications | Notifications | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` |
| Mobile push tokens | Devices / Notifications | `/devices/push-tokens` |
| Mobile metadata | API metadata | `/meta/error-catalog`, `/meta/deep-links`, `/meta/offline-cache-policy`, `/meta/device-policy` |
| Audit screen | Audit logs | `/organizations/:id/audit-logs`, `/admin/audit-logs` |
| Dashboard cards | Analytics | `/organizations/:id/analytics/overview`, `/admin/analytics/overview` |

## Compatibility Response

Authenticated responses include:

```json
{
  "user": {},
  "accessToken": "...",
  "token": "...",
  "workspaces": [],
  "activeWorkspace": null
}
```

`token` remains temporarily for the current frontend. `accessToken` is the
canonical field. The frontend will migrate to the canonical field during the
integration phase.

## Tenant Context

The requested organization ID is accepted only as a route selector. Middleware
must resolve an active membership for the authenticated user and place this
verified context on the request. Controllers and services receive the verified
context, not a raw body field.
