# Mobile Implementation Plan

This plan follows the Flutter specification while reflecting the current state:
the repository contains the web app, Laravel API, backend/mobile contracts, and
an initial Flutter foundation scaffold.

## Phase 0 - Audit And Contracts

Status: complete for repository audit and initial backend/mobile contracts.

- Map web routes and backend endpoint families.
- Add Flutter-facing OpenAPI seed: `docs/mobile-openapi.json`.
- Add mobile audit outputs:
  - `mobile/WEB_MOBILE_FEATURE_MAPPING.md`
  - `mobile/MOBILE_REQUIREMENTS.md`
  - `mobile/API_INTEGRATION_MAP.md`
  - `mobile/MOBILE_IMPLEMENTATION_PLAN.md`
- Keep `MOBILE_API_READINESS.md` as the backend readiness checklist.

## Phase 1 - Flutter Foundation

Status: scaffolded, pending Flutter SDK verification.

- Scaffold `mobile/` Flutter app foundation.
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
- Session list, revoke device, logout all devices.
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
  confirmation state, and return-to-catalog action; authenticated booking
  history/status tracking remains pending.
- My courses/enrollments.
- My courses/enrollments is wired to `GET /api/v1/student/bookings` and
  `GET /api/v1/student/enrollments` with summary stats, pending booking cards,
  active enrollment cards, empty state, refresh, and return-to-catalog action.
- Course workspace with overview, announcements, content, schedule,
  instructor, and subscription state.
- Course workspace entry is wired to
  `GET /api/v1/student/enrollments/:enrollment` with access validation,
  locked state, course/batch/subscription summary, next-session placeholder,
  content placeholder, announcement placeholder, and back-to-my-courses action.
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
- Organization overview dashboard is still pending.
- Organization booking list is wired to
  `GET /api/v1/organizations/:id/bookings`.
- Booking confirm, reject, and cancel actions are wired to backend
  transactional endpoints and refresh the list after each decision.
- Courses and batches list review is wired to
  `GET /api/v1/organizations/:id/courses` and
  `GET /api/v1/organizations/:id/batches`.
- Course/batch create and edit steppers remain pending.
- Invitation list, create, resend, and cancel are wired to
  `/api/v1/organizations/:id/invitations`.
- Room list and create are wired to
  `GET/POST /api/v1/organizations/:id/rooms`; room edit/delete/member
  management remains pending.
- Announcement list and organization-wide create are wired to
  `GET/POST /api/v1/organizations/:id/announcements`; room targeting,
  edit, and delete remain pending.
- Calendar event list, create, and delete are wired to
  `GET/POST/DELETE /api/v1/organizations/:id/events`; room-aware calendar
  filters and native date/time pickers remain pending.
- Task list, create, status/progress update, and delete are wired to
  `GET/POST/PATCH/DELETE /api/v1/organizations/:id/tasks`; room/member
  assignment pickers remain pending.
- Member list, role/status update, and remove are wired to
  `GET/PATCH/DELETE /api/v1/organizations/:id/members`; role/status changes
  rely on backend permission and last-owner guards.
- Content list, link create, and delete are wired to
  `GET/POST/DELETE /api/v1/organizations/:id/content`; native file upload and
  file picker integration remain pending.
- Booking review and confirmation.
- Members, invitations, rooms, and content.
- Permission, module, and subscription guards on every route and action.

## Phase 5 - Notifications, Deep Links, Offline, Content

Status: started for notifications, deep-link routing, offline policy, and
protected content.

- FCM token register/refresh/revoke.
- Notification inbox and tap routing. The inbox is wired to
  `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`, and
  `POST /api/v1/notifications/read-all`; taps mark read, resolve `data.route`
  through `/meta/deep-links`, and fall back by `targetType`.
- Deep-link manifest loading and validation. Notification tap routing maps
  `marketplace.courseDetails`, `student.bookingStatus`,
  `notifications.inbox`, `content.library`, and student learning destinations
  to the Flutter routes currently implemented.
- Offline policy loading and tenant-safe local cache.
- Protected content viewer with signed view session, watermark, screenshot or
  screen-capture handling where supported, and viewer audit events.

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

