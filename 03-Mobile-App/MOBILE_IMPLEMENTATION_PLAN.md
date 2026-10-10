# Mobile Implementation Plan

This plan follows the Flutter specification while reflecting the current state:
the repository contains the web app, Laravel API, backend/mobile contracts, and
an initial Flutter foundation scaffold.

## Phase 0 - Audit And Contracts

Status: complete for repository audit and initial backend/mobile contracts.

- Map web routes and backend endpoint families.
- Add Flutter-facing OpenAPI seed: `docs/mobile-openapi.json`.
- Add mobile audit outputs:
  - `03-Mobile-App/WEB_MOBILE_FEATURE_MAPPING.md`
  - `03-Mobile-App/MOBILE_REQUIREMENTS.md`
  - `03-Mobile-App/API_INTEGRATION_MAP.md`
  - `03-Mobile-App/MOBILE_IMPLEMENTATION_PLAN.md`
- Keep `MOBILE_API_READINESS.md` as the backend readiness checklist.

## Phase 1 - Flutter Foundation

Status: scaffolded, pending Flutter SDK verification.

- Scaffold `03-Mobile-App/` Flutter app foundation.
- Add strict analysis, flavors, app configuration, and environment guards.
- Add Material 3 theme from the web design system.
- Add localization resources for Arabic and English.
- Add GoRouter route shells and Riverpod dependency graph.
- Add Dio client with auth headers, timeout, cancellation-ready wiring, and
  sensitive-header redaction.
- Add initial repositories for auth, workspaces, metadata, push device tokens,
  notifications, and protected content view/audit endpoints.
- Add initial core services for deep-link resolution, offline cache policy
  interpretation, and push token registration.
- Add tenant-aware cache scope and active workspace selection before entering
  the authenticated home screen.
- Add protected content viewer lifecycle controller for view session, watermark
  audit, security audit events, and memory-only signed URL state.
- Add privacy-aware telemetry, redaction, crash-reporting sink, and data map.
- Add Arabic-first localization and initial accessibility semantics for the
  scaffold screens.
- Add request/correlation headers and backend error-envelope mapping.
- Add refresh-token coordination with one in-flight refresh and one retry per
  authenticated request.
- Generate Dart API client from `docs/mobile-openapi.json`.

Created files include `pubspec.yaml`, `analysis_options.yaml`, `lib/main.dart`,
`lib/bootstrap.dart`, `lib/src/app`, `lib/src/core`, and initial auth,
workspace, splash, home, content, device, metadata, and notification feature
foundation files.

## Phase 2 - Auth, Sessions, And Workspaces

Status: started with backend-connected auth/session foundations.

- Splash restoration is wired to secure token presence.
- Login sends device metadata and stores backend-issued access/refresh tokens.
- Register, email verification, resend verification, forgot password, reset
  password, invitation preview, and invitation acceptance repository/controller
  methods are wired to real backend endpoints.
- Registration, email verification, forgot-password, reset-password, and
  invitation preview/accept screens are routed in GoRouter.
- Secure token storage and refresh rotation are implemented with a single
  in-flight refresh coordinator.
- Profile settings are wired to `GET/PATCH /api/v1/auth/me` with editable
  name, locale, timezone, workspace summary, and mobile logout.
- Session list and revocation are wired to `GET /api/v1/auth/sessions`,
  `DELETE /api/v1/auth/sessions/:session`, and
  `DELETE /api/v1/auth/sessions/others` from the mobile profile screen.
- Workspace selection and switching with tenant-scoped cache invalidation.
- Remaining work: user-facing forms for every auth completion flow, session
  management UI, and Flutter tests.

## Phase 3 - Student Marketplace And Learning

Status: started with public course catalog; remaining detail, booking, and
student learning flows still pending Flutter SDK verification.

- Explore courses and academies. Public course catalog is wired to
  `GET /api/v1/public/courses` with search, sort, pagination metadata, loading,
  empty, retry, and localized card states.
- Course detail and batch selection. Course detail is wired to
  `GET /api/v1/public/courses/:course` and shows open batches, localized
  details, learning outcomes, and seat availability.
- Booking submit/status. Public booking submit is wired to
  `POST /api/v1/public/bookings` with terms acceptance, contact validation, and
  an idempotency key. Booking success is routed to a public confirmation screen
  with request number, selected course, selected batch, pending academy
  confirmation fallback, authenticated `/student/bookings` status hydration,
  return-to-learning, and return-to-catalog actions.
- My courses/enrollments.
- My courses/enrollments is wired to `GET /api/v1/student/bookings` and
  `GET /api/v1/student/enrollments` with summary stats, pending booking cards,
  active enrollment cards, empty state, refresh, and return-to-catalog action.
- Lesson booking explore/reserve/cancel is wired to
  `GET /api/v1/public/instructors`, `GET/POST /api/v1/student/lesson-bookings`,
  and `POST /api/v1/student/lesson-bookings/:bookingId/cancel` at
  `/lesson-bookings`.
- Attendance is wired at `/attendance` to `GET /api/v1/student/attendance`,
  `GET /api/v1/guardian/students`, and
  `GET /api/v1/guardian/students/:studentId/attendance` with student and
  guardian summary tabs.
- Course workspace with overview, announcements, content, schedule,
  instructor, and subscription state.
- Course workspace entry is wired to
  `GET /api/v1/student/enrollments/:enrollment` with access validation,
  locked state, course/batch/subscription summary, next-session summary,
  protected room content, room-aware announcements, and back-to-my-courses
  action.
- Schedule is wired at `/schedule` by combining active student enrollment
  batch schedules with selected-workspace organization events from the backend.
- Organization subscription status is surfaced from `/workspaces` and
  `/organizations/:id/context` in workspace selection, Home, and organization
  overview. Mobile warns for missing, expired, past-due, grace, or expiring
  subscriptions and points renewal/change-plan work to the web dashboard until
  native payment endpoints are available.
- Protected course content is wired from the workspace to
  `GET /api/v1/organizations/:organizationId/content?roomId=:roomId`, then to
  the existing content view-session and viewer-audit controller. The first
  mobile viewer surface keeps signed URLs in controller memory, shows
  watermark/download policy state, records opened/watermark/blocked/closed
  events, and avoids displaying or persisting the signed URL.

## Phase 4 - Organization Operations

Status: started with mobile booking review and core organization management.

- Organization profile update is wired to
  `PATCH /api/v1/organizations/:id` and refreshes the active workspace context.
- Organization overview dashboard is implemented at `/organization/overview`
  by aggregating existing context, courses, batches, bookings, members,
  content, events, and tasks providers.
- Organization booking list is wired to
  `GET /api/v1/organizations/:id/bookings`.
- Booking confirm, reject, and cancel actions are wired to backend
  transactional endpoints and refresh the list after each decision.
- Courses and batches list review is wired to
  `GET /api/v1/organizations/:id/courses` and
  `GET /api/v1/organizations/:id/batches`.
- Course create/edit/submit-review and batch create/edit forms are wired to
  `POST /api/v1/organizations/:id/courses` and
  `PUT /api/v1/organizations/:id/courses/:courseId`,
  `POST /api/v1/organizations/:id/courses/:courseId/submit-review`, and
  `POST/PATCH /api/v1/organizations/:id/batches`.
- Instructor profiles and bookable availability slots are wired at
  `/organization/instructors` to `GET/POST/PUT /api/v1/organizations/:id/instructors`
  and `GET/POST /api/v1/organizations/:id/instructor-slots`.
- Invitation list, create, resend, and cancel are wired to
  `/api/v1/organizations/:id/invitations`.
- Room list, create, edit, delete, and room member management are wired to
  `GET/POST/PATCH/DELETE /api/v1/organizations/:id/rooms` and
  `/rooms/:roomId/members`.
- Announcement list, organization-wide and room-targeted create/edit, and
  delete are wired to
  `GET/POST/PATCH/DELETE /api/v1/organizations/:id/announcements`.
- Organization attendance is wired at `/organization/attendance` to
  learning-session list, attendance sheet, mark, lock, and QR check-in
  endpoints under `/api/v1/organizations/:id/learning-sessions`.
- Organization promotion list/create is wired at `/organization/promotions` to
  `GET/POST /api/v1/organizations/:id/promotions` with backend moderation
  status and campaign metrics.
- Organization analytics is wired at `/organization/analytics` to
  `GET /api/v1/organizations/:id/analytics/overview` with a date-range picker
  and KPI grid.
- Calendar event list with room filter, create with room picker and native
  date/time pickers, and delete are wired to
  `GET/POST/DELETE /api/v1/organizations/:id/events`.
- Task list, create with room/member assignment pickers, status/progress
  update, and delete are wired to
  `GET/POST/PATCH/DELETE /api/v1/organizations/:id/tasks`.
- Member list, role/status update, and remove are wired to
  `GET/PATCH/DELETE /api/v1/organizations/:id/members`; role/status changes
  and removal are guarded in the UI by `members.update` and `members.remove`,
  with backend last-owner protection still authoritative.
- Content list, link create, file picker upload, and delete are wired to
  `GET/POST/DELETE /api/v1/organizations/:id/content`.

## Phase 4B - Platform Operations

- Platform overview is wired at `/platform/overview` for users with
  `platformRole` from `/auth/me`. It reads
  `GET /api/v1/admin/analytics/overview` and
  `GET /api/v1/admin/organizations` to show tenant, revenue, subscription,
  booking, course, and latest-organization metrics without exposing moderation
  mutation actions yet.
- Platform academy approvals are wired at `/platform/academy-approvals` to
  `GET /api/v1/admin/academies`,
  `POST /api/v1/admin/academies/:academyId/verify`, and
  `POST /api/v1/admin/academies/:academyId/reject` with platform-role
  guarding, status tabs, verify action, and required rejection note.
- Platform category management is wired at `/platform/categories` to
  `GET /api/v1/admin/categories`, `POST /api/v1/admin/categories`,
  `PUT /api/v1/admin/categories/:categoryId`, and
  `DELETE /api/v1/admin/categories/:categoryId` with platform-role guarding,
  create/edit forms, hierarchy selection, active toggle, sort order, and
  guarded delete for unused categories.
- Platform course approvals are wired at `/platform/course-approvals` to
  `GET /api/v1/admin/courses`,
  `POST /api/v1/admin/courses/:courseId/approve`, and
  `POST /api/v1/admin/courses/:courseId/reject` with platform-role guarding,
  status tabs, approve action, and required rejection note.
- Platform promotion approvals are wired at `/platform/promotion-approvals` to
  `GET /api/v1/admin/promotions`,
  `POST /api/v1/admin/promotions/:promotionId/approve`, and
  `POST /api/v1/admin/promotions/:promotionId/reject` with platform-role
  guarding, campaign metrics, approve action, and required rejection note.
- Booking review and confirmation.
- Members, invitations, rooms, and content.
- Organization route permission guards are wired from workspace context;
  route and Home navigation module guards read enabled `subscription.plan.modules`;
  direct links to unavailable organization routes open `/access-denied` with a
  role-permission or plan-module explanation instead of silently redirecting;
  booking decision buttons are guarded by `bookings.confirm`,
  `bookings.manage`, and `bookings.cancel`; content create/delete controls are
  guarded by `content.create` and `content.delete`; announcement create,
  update, and delete controls are guarded by `announcements.create`,
  `announcements.update`, and `announcements.delete`; event and task mutation
  controls are guarded by `events.manage`; course create/update/review and
  batch create/update controls are guarded by `courses.create`,
  `courses.update`, `courses.publish`, and `batches.manage`; room
  create/update/delete/member controls are guarded by `rooms.create`,
  `rooms.update`, and `rooms.delete`; invitation create/resend/cancel controls
  are guarded by `members.invite`. Remaining detailed action affordances stay
  backend-enforced until expanded in UI.

## Phase 5 - Notifications, Deep Links, Offline, Content

Status: complete for app-layer notifications, deep-link routing, offline
policy/cache fallback, and protected content shell. Native capture/download
validation and cache backend profiling remain Phase 6 release gates.

- FCM token register/refresh/revoke.
- Notification inbox and tap routing. The inbox is wired to
  `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`, and
  `POST /api/v1/notifications/read-all`; taps mark read, resolve `data.route`
  through `/meta/deep-links`, and fall back by `targetType`. The inbox also
  surfaces the `notifications.inbox` offline cache policy, including TTL,
  storage, stale-while-revalidate behavior, offline readability, and optimistic
  read-state behavior.
- Notification preferences are wired from profile to
  `GET/PUT /api/v1/notification-preferences`, scoped to the active workspace
  when selected.
- Deep-link manifest loading and validation. Notification tap routing maps
  `marketplace.courseDetails`, `student.bookingStatus`,
  `notifications.inbox`, `content.library`, and student learning destinations
  to the Flutter routes currently implemented. Profile readiness surfaces
  manifest version, route count, and auth-required route count from
  `/meta/deep-links` for support/debug visibility.
- Offline policy loading and tenant-safe local cache. `OfflineCacheStore`
  persists only policy-approved datasets with tenant-aware keys, `storedAt`,
  `expiresAt`, and stale status; it refuses memory-only or never-persist
  datasets such as `content.view_session`.
- Offline/device readiness is surfaced in Profile from
  `GET /api/v1/meta/offline-cache-policy` and
  `GET /api/v1/meta/device-policy`. The summary exposes persistable datasets,
  memory-only datasets, optimistic writes, server-confirmed writes, purge
  triggers, active-session limits, disallowed device practices, and signed
  content URL memory-only protection.
- Protected content viewer with signed view session, watermark, screenshot or
  screen-capture handling where supported, and viewer audit events. The course
  workspace secure viewer now surfaces signed URL expiry, memory-only
  protection, blocked-download state, watermark status, and refresh for expired
  view sessions.
- Notification inbox writes successful responses to the approved
  `notifications.inbox` cache and falls back to cached notifications when
  refresh fails.

## Phase 6 - Quality And Release

Status: not started.

- Unit, widget, integration, security, offline, notification, RTL,
  accessibility, and performance tests.
- Android staging build and production app bundle.
- iOS staging build and production archive validation.
- Store readiness documents and final mobile audit.

## Current Blockers

- Flutter SDK, Dart SDK, and PHP are not available in the current PATH, so
  Flutter dependency resolution, static analysis, builds, Laravel feature tests,
  and Scramble-generated OpenAPI cannot be executed locally from this session.
- Firebase project configuration is not present; production push delivery still
  needs a real provider binding and credentials.

