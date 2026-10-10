# Web To Mobile Feature Mapping

This audit maps the implemented React routes to the first Flutter product
surface. Mobile should preserve the AIN identity while simplifying complex
desktop administration into focused workflows.

## Route Sources

- Public web routes: `/courses`, `/courses/:courseSlug`, `/academies`,
  `/academies/:academySlug`, `/booking/:courseId`, `/booking/success`,
  `/invite/:token`, password reset, auth, legal, and support.
- Student shell: `/end-user/:page`.
- Organization shell: `/tenant-admin/:page`.
- Platform shell: `/super-admin/:page`.
- Backend source of truth: `backend/routes/api.php`.
- Flutter API seed: `docs/mobile-openapi.json`.

## Mobile Priority Map

| Web area | Mobile priority | Flutter feature | Notes |
|---|---:|---|---|
| Auth, email verification, reset password | P0 | `features/auth` | Must use secure storage and centralized refresh handling. |
| Workspace selection/context | P0 | `features/workspaces` | Cache keys must include organization ID. |
| Course marketplace | P0 | `features/marketplace`, `features/courses` | Keep search/filter state when returning from details. |
| Public booking | P0 | `features/bookings` | Server confirmation only; prevent double submit. |
| Student dashboard and learning | P0 | `features/home`, `features/enrollments` | Start with active courses, next session, pending booking state. |
| Protected content | P0 | `features/content` | Use view sessions; never persist signed URLs. |
| Notifications | P0 | `features/notifications` | Register FCM token after login and on refresh. |
| Deep links | P0 | `core/deep_links` | Use `/meta/deep-links` and validate all incoming route payloads. |
| Offline policy | P0 | `core/cache` | Use `/meta/offline-cache-policy`; sensitive files are memory-only. |
| Organization overview | P1 | `features/organizations` | Mobile dashboard should emphasize counts and quick actions. |
| Courses and batches management | P1 | `features/courses`, `features/batches` | Use mobile steppers for create/edit. |
| Booking review and confirmation | P1 | `features/bookings` | Do not recreate enrollment logic locally. |
| Members and invitations | P1 | `features/members`, `features/invitations` | Permission guarded. |
| Rooms, announcements, calendar | P1 | `features/rooms`, `features/announcements`, `features/schedule` | Prioritize reading and quick create flows. |
| Analytics, audit logs, subscription admin | P2 | `features/reports`, `features/subscriptions` | Keep dense analysis web-first unless backend supports concise mobile summaries. |
| Super admin operations | P2 | `features/platform` | Limited approval/review only; full console remains web-first. |

## Navigation Recommendation

Student tabs:

- Home
- Explore
- My Courses
- Schedule
- Profile

Organization tabs:

- Overview
- Courses
- Bookings
- Members
- More

Instructor tabs:

- Overview
- My Courses
- My Rooms
- Schedule
- More

Super Admin:

- Keep web-first. Add only review queues that are already supported by stable
  backend endpoints.

## Design System Extraction

- Use Material 3 components adapted to AIN colors from `src/styles.css`.
- Preserve existing status semantics, badges, loading, empty, error, and locked
  module states.
- Build Arabic-first RTL layouts, then verify English LTR.
- Use mobile-first spacing and touch targets; do not copy desktop tables into
  narrow screens.

