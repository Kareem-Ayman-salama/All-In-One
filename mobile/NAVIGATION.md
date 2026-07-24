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
| `/my-courses` | Student learning overview | Shows bookings and enrollments. |
| `/my-courses/enrollments/:enrollmentId` | Course workspace | Loads enrollment access and room content. |
| `/notifications` | Notification inbox | Supports highlighted notification query parameter. |
| `/organization/profile` | Organization profile | Update workspace identity, locale, and timezone. |
| `/organization/announcements` | Organization announcements | View and create organization-wide announcements from backend. |
| `/organization/courses` | Organization courses | Owner/admin course and batch review from backend. |
| `/organization/bookings` | Organization bookings | Owner/admin booking review and backend decision actions. |
| `/organization/content` | Organization content | View content, add room links, and delete items. |
| `/organization/events` | Organization events | View, create, and delete calendar events. |
| `/organization/invitations` | Organization invitations | Invite members and manage pending invitation links. |
| `/organization/members` | Organization members | View, update role/status, and remove members. |
| `/organization/rooms` | Organization rooms | View and create workspace rooms from backend. |
| `/organization/tasks` | Organization tasks | View, create, update status, and delete workspace tasks. |
| `/schedule` | Schedule placeholder | Requires implementation before staging. |
| `/profile` | Profile placeholder | Requires implementation before staging. |

## Guard Rules

- Unauthenticated users are redirected to `/login` for protected routes.
- Authenticated users are redirected away from `/login` to `/workspaces`.
- Splash owns session restoration while `AuthState.isRestoring` is true.
- Permission-level route guards still need to be extended after organization
  management screens are implemented.

## Target Navigation Model

- Student tabs: Home, Explore, My Courses, Schedule, Profile.
- Instructor tabs: Overview, Courses, Rooms, Schedule, More.
- Organization owner/admin tabs: Overview, Courses, Bookings, Members, More.
- Super-admin remains web-first unless mobile-specific backend contracts are
  added.

