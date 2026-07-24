# AIO Backend Contracts

This document defines the API concepts needed to connect the current frontend to a real backend.

## Workspace Operations

The frontend currently uses `WorkspaceContext` as an optimistic local adapter. Replace its methods with these endpoints without changing the presentation components.

### Global Search

- `GET /search?q={query}&scope={role}` returns only entities the authenticated user can access.
- Result shape: `{ id, type, title, subtitle, target }[]`.

### Calendar And Room Scheduling

- `GET /events?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- `POST /rooms` accepts the room plus optional `event` data: `{ title, date, time, duration, attendeeIds, description }`.
- `POST /events`, `PATCH /events/:id`, and `DELETE /events/:id` manage independent events.
- Creating a scheduled room should atomically create the event, notify invited users, and append an audit entry.

### Notifications

- `GET /notifications?type=&read=&cursor=`.
- `PATCH /notifications/:id/read` and `POST /notifications/read-all`.
- Each notification must include a permission-safe `target` or `{ entityType, entityId }` used to build it.
- Real-time delivery can use SSE at `GET /notifications/stream` or a WebSocket channel.

### Audit Log

- `GET /audit-log?action=&actor=&from=&to=&cursor=`.
- Records are append-only and include `{ id, action, actor, target, area, createdAt, metadata }`.
- The server is authoritative for all security and compliance events.

### Saved Views And Onboarding

- `GET /users/me/saved-views`, `POST /users/me/saved-views`, and `DELETE /users/me/saved-views/:id`.
- `GET /users/me/onboarding` and `PATCH /users/me/onboarding`.

### Subscription And Invoices

- `GET /billing/subscription`, `GET /billing/usage`, and `GET /billing/invoices?cursor=`.
- `GET /billing/invoices/:id/pdf` and `PATCH /billing/subscription`.

### Reversible Destructive Actions

- `DELETE /rooms/:id` and `DELETE /files/:id` return a short-lived `undoToken`.
- `POST /undo` accepts `{ undoToken }` while it is valid.
- Authorization is enforced again for both deletion and undo.

## Authentication Cycle

The frontend is wired for these production endpoints:

- `POST /auth/login`: email/password login; returns `{ user, token }`.
- `POST /auth/register`: creates a personal account and sends email OTP.
- `POST /auth/verify-email`: verifies the six-digit registration OTP.
- `POST /auth/resend-verification`: sends a replacement registration OTP.
- `POST /auth/forgot-password`: always returns a generic accepted response to prevent account enumeration.
- `POST /auth/reset-password`: verifies reset OTP and changes the password.
- `POST /auth/change-password`: requires the authenticated user's current password.
- `PATCH /auth/me`: updates display name and profile image reference.
- `POST /auth/logout`: revokes the active server session or refresh token.
- `POST /invites/:token/accept`: links the signed-in personal account to a tenant and returns the updated user.

Production recommendation: use a short-lived access token plus a rotating refresh token in a `Secure`, `HttpOnly`, `SameSite` cookie. The browser storage token in the current app is only for the frontend mock/demo mode.

Error responses should include stable codes such as `INVALID_CREDENTIALS`, `ACCOUNT_EXISTS`, `INVALID_CODE`, `ACCOUNT_NOT_FOUND`, `AUTH_REQUIRED`, and `CURRENT_PASSWORD_INCORRECT`. The frontend converts these codes to Arabic or English messages.

## Account Settings

Suggested settings endpoints:

- `PATCH /auth/me`: `name`, `avatarId`.
- `POST /auth/avatar`: multipart image upload; validate MIME type and 2 MB maximum size server-side.
- `GET /auth/sessions`: list active devices.
- `DELETE /auth/sessions/:id`: revoke one session.
- `DELETE /auth/sessions?except=current`: sign out other devices.
- `GET /users/me/preferences`: theme, language, accent, and notification preferences.
- `PATCH /users/me/preferences`: partial preference update.
- `POST /auth/2fa/totp/setup` and `POST /auth/2fa/totp/verify`.
- `POST /auth/2fa/sms/enable` and `DELETE /auth/2fa/:method`.

The backend must never accept `role`, `tenantId`, or elevated permissions from public registration forms. These values come from internal administration or a validated invitation.

## Users, Roles, Permissions, Tenant Mapping

`users`

- `id`
- `name`
- `email`
- `password_hash`
- `role`: `super-admin | tenant-admin | end-user`
- `tenant_id`: nullable for super admin
- `status`: `active | pending | disabled | blocked`
- `permissions`: string array or normalized relation table
- `last_login_at`

Roles:

- `super-admin`: platform management, tenants, billing, pricing, reports.
- `tenant-admin`: company workspace, rooms, members, files, security, analytics.
- `end-user`: assigned rooms and protected file viewer only.

## Invite Acceptance & First Password

1. Tenant admin creates invite with `email`, `roomIds`, `expiresAt`.
2. Backend creates `invite_token`.
3. User opens `/accept-invite?token=...`.
4. User sets password.
5. Backend activates user and maps tenant/rooms.

Required states:

- `pending`
- `accepted`
- `expired`
- `revoked`

## Secure File Viewer API

Frontend needs:

- Signed stream URL.
- File metadata.
- Watermark payload: user name, email, phone/id, timestamp.
- Blocked actions policy: download, print, copy, screen recording hints.
- Audit event endpoint for every open/view attempt.

Suggested endpoints:

- `POST /files/:id/view-session`
- `POST /files/:id/audit`
- `GET /rooms/:id/files`

## Notification / Action Inbox API

Notifications should be actionable items, not plain text only.

Fields:

- `id`
- `type`: `security | billing | content | system`
- `priority`: `low | medium | high | critical`
- `title`
- `body`
- `targetType`: `tenant | room | file | member | subscription`
- `targetId`
- `status`: `unread | needs_action | resolved`
- `createdAt`
- `owner`

Suggested endpoints:

- `GET /notifications`
- `POST /notifications/:id/resolve`
- `POST /notifications/mark-all-read`

## Audit Logs

Every sensitive action should create an audit event:

- file viewed
- download blocked
- new device login
- permission changed
- member invited
- subscription changed

Suggested endpoint:

- `GET /audit-logs?tenantId=...`

## Student Teacher Booking API

The backend must be the source of truth for teacher availability. Booking creation must reserve a slot atomically to prevent two students from taking the same time.

Suggested endpoints:

- `GET /subjects`
- `GET /teachers?subjectId=&level=&format=&query=`
- `GET /teachers/:teacherId/availability?from=&to=`
- `GET /users/me/bookings`
- `POST /bookings`
- `PATCH /bookings/:bookingId/reschedule`
- `PATCH /bookings/:bookingId/cancel`

`POST /bookings` request:

```json
{
  "teacherId": "teacher-id",
  "subjectId": "subject-id",
  "slotId": "availability-slot-id",
  "format": "online"
}
```

The response should include the confirmed booking, payment state, meeting or location details, and calendar event. Return `409 Conflict` when the slot was reserved by another student.
