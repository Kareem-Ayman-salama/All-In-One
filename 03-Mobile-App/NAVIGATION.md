# Mobile Navigation

The current Flutter scaffold uses GoRouter with route guards in
`lib/src/app/router/app_router.dart`.

## Public Routes

| Route | Screen | Notes |
|---|---|---|
| `/explore` | Course catalog | Public marketplace entry. |
| `/explore/course/:courseSlug` | Course details | Does not expose protected content. |
| `/booking/success` | Booking result | Can be opened from booking submit and deep links. |
| `/login` | Login | Redirects authenticated users to workspace selection. |
| `/register` | Registration | Creates account through backend and routes to verification. |
| `/verify-email` | Email verification | Stores backend-issued mobile session after code verification. |
| `/forgot-password` | Forgot password | Requests reset code through backend. |
| `/reset-password` | Reset password | Changes password with email code and returns to login. |
| `/invite/:token` | Invitation preview | Public deep-link entry before authenticated acceptance. |

## Authenticated Routes

| Route | Screen | Notes |
|---|---|---|
| `/workspaces` | Workspace selection | Loads organization context before tenant work. |
| `/home` | Home | Authenticated landing screen. |
| `/access-denied` | Access unavailable | Explains missing role permissions or plan modules, with Home and workspace-switch actions. |
| `/platform/overview` | Platform overview | Platform-role dashboard for tenant, revenue, subscription, booking, and course metrics. |
| `/platform/academy-approvals` | Academy approvals | Platform-role academy profile moderation with verify and reject-note actions. |
| `/platform/categories` | Platform categories | Platform-role marketplace category management with create, edit, ordering, visibility, and guarded delete. |
| `/platform/course-approvals` | Course approvals | Platform-role course moderation list with approve and reject-note actions. |
| `/platform/promotion-approvals` | Promotion approvals | Platform-role sponsored placement moderation with approve and reject-note actions. |
| `/my-courses` | Student learning overview | Shows bookings and enrollments. |
| `/lesson-bookings` | Lesson bookings | Shows public instructors with open slots and authenticated student lesson bookings. |
| `/attendance` | Attendance | Shows authenticated student attendance and guardian-visible linked-student attendance. |
| `/my-courses/enrollments/:enrollmentId` | Course workspace | Loads enrollment access and room content. |
| `/notifications` | Notification inbox | Supports highlighted notification query parameter. |
| `/organization/overview` | Organization overview | Aggregates workspace health, pending bookings, active members, content, events, and tasks. |
| `/organization/profile` | Organization profile | Update workspace identity, locale, and timezone. |
| `/organization/announcements` | Organization announcements | View, target by organization or room, create, edit, and delete announcements from backend. |
| `/organization/attendance` | Organization attendance | View learning sessions, mark participants, generate QR check-in links, and lock attendance sheets. |
| `/organization/courses` | Organization courses | Owner/admin course/batch review, create, edit, and course submit-review actions from backend. |
| `/organization/instructors` | Organization instructors | Manage instructor profiles and create bookable availability slots. |
| `/organization/promotions` | Organization promotions | Review campaign metrics and submit marketplace promotions for moderation. |
| `/organization/analytics` | Organization analytics | Shows range-based organization KPI summary. |
| `/organization/bookings` | Organization bookings | Owner/admin booking review and backend decision actions. |
| `/organization/content` | Organization content | View content, add room links or file uploads, and delete items. |
| `/organization/events` | Organization events | View with room filters, create with native date/time pickers, and delete calendar events. |
| `/organization/invitations` | Organization invitations | Invite members and manage pending invitation links. |
| `/organization/members` | Organization members | View, update role/status, and remove members. |
| `/organization/rooms` | Organization rooms | View, create, edit, delete, and manage workspace room members from backend. |
| `/organization/tasks` | Organization tasks | View, create with room/member assignment, update status, and delete workspace tasks. |
| `/schedule` | Schedule | Combines active student course schedules and selected organization calendar events. |
| `/profile` | Profile | Shows the current user from `/auth/me`, editable account settings, workspace summary, and sign out. |

## Guard Rules

- Unauthenticated users are redirected to `/login` for protected routes.
- Authenticated users are redirected away from `/login` to `/workspaces`.
- Splash owns session restoration while `AuthState.isRestoring` is true.
- Organization routes require an active selected workspace and check
  `membership.permissions` plus enabled `subscription.plan.modules` from
  `/organizations/:id/context` before opening management pages.
- Direct links to unavailable organization routes open `/access-denied` with a
  permission or module explanation instead of silently returning to Home.
- Home hides organization navigation cards when the selected workspace lacks
  the required permission or module, keeping unavailable plan areas out of the
  primary mobile affordances.

## Target Navigation Model

- Student tabs: Home, Explore, My Courses, Schedule, Profile.
- Instructor tabs: Overview, Courses, Rooms, Schedule, More.
- Organization owner/admin tabs: Overview, Courses, Bookings, Members, More.
- Super-admin remains web-first unless mobile-specific backend contracts are
  added.

