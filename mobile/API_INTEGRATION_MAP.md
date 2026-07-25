# API Integration Map

This file is the Flutter integration index for the current Laravel backend.
The generated Dart client should start from `docs/mobile-openapi.json`, then be
wrapped by feature repositories.

## Client Foundation

| Concern | Backend evidence | Flutter owner |
|---|---|---|
| API envelope | `backend/app/Support/ApiResponse.php` | `core/api` |
| Error catalog | `GET /api/v1/meta/error-catalog` | `core/errors` |
| Deep links | `GET /api/v1/meta/deep-links` | `core/deep_links` |
| Offline cache policy | `GET /api/v1/meta/offline-cache-policy` | `core/cache` |
| Device policy | `GET /api/v1/meta/device-policy` | `core/security` |
| OpenAPI seed | `docs/mobile-openapi.json` | `core/api/generated` |

## Auth And Sessions

| Flow | Endpoint | Mobile behavior |
|---|---|---|
| Register | `POST /api/v1/auth/register` | Create personal account and show email verification step. |
| Verify email | `POST /api/v1/auth/verify-email` | Store returned access/refresh tokens in secure storage. |
| Resend verification | `POST /api/v1/auth/resend-verification` | Retry email code delivery with backend throttling. |
| Login | `POST /api/v1/auth/login` | Send `installationId`, `platform`, `appVersion`, and `deviceName` when available. |
| Refresh | `POST /api/v1/auth/refresh` | Queue eligible requests during refresh and retry once; mobile stores `refreshToken` from JSON in secure storage. |
| Forgot password | `POST /api/v1/auth/forgot-password` | Request reset code; do not reveal whether account exists beyond backend policy. |
| Reset password | `POST /api/v1/auth/reset-password` | Submit email, code, and confirmed password. |
| Invitation preview | `GET /api/v1/public/invitations/:token` | Validate link and display organization/role before auth. |
| Invitation accept | `POST /api/v1/invitations/accept` | Accept as authenticated user, then refresh workspaces. |
| Current user | `GET /api/v1/auth/me` | Restore session after launch. |
| Sessions | `GET /api/v1/auth/sessions` | Show active devices with installation metadata. |
| Revoke session | `DELETE /api/v1/auth/sessions/:session` | Clear matching local/push state when current device is revoked. |
| Logout | `POST /api/v1/auth/logout` | Revoke push token and clear secure/cache state. |

Initial repository/controller files:

- `lib/src/features/auth/data/auth_repository.dart`
- `lib/src/features/auth/application/auth_controller.dart`
- `lib/src/features/auth/presentation/auth_flow_pages.dart`
- `lib/src/features/auth/presentation/login_page.dart`

## Marketplace And Student

| Flow | Endpoint family | Mobile behavior |
|---|---|---|
| Course catalog | `/api/v1/public/courses` | Debounced search, filters, pagination/infinite list. |
| Course details | `/api/v1/public/courses/:course` | Do not expose private content before authorization. |
| Academies | `/api/v1/public/academies` | Public profile and course list. |
| Booking | `/api/v1/public/bookings` | Server-confirmed submit, handle duplicate/full errors. |
| Student bookings | `/api/v1/student/bookings` | Show booking status and next action. |
| Enrollments | `/api/v1/student/enrollments` | Entry point to course workspace. |
| Enrollment detail | `/api/v1/student/enrollments/:enrollment` | Validate access state before opening course workspace. |
| Lesson bookings | `/api/v1/student/lesson-bookings` | Reserve with `slotId`, `subject`, required `studentPhone`, and optional `note`; cancel through backend endpoints. |

Initial repository and screen files:

- `lib/src/features/marketplace/data/public_course_repository.dart`
- `lib/src/features/marketplace/application/public_course_catalog_controller.dart`
- `lib/src/features/marketplace/presentation/course_catalog_page.dart`
- `lib/src/features/marketplace/presentation/course_detail_page.dart`
- `lib/src/features/marketplace/presentation/booking_success_page.dart`
- `lib/src/features/learning/data/student_learning_repository.dart`
- `lib/src/features/learning/application/student_learning_controller.dart`
- `lib/src/features/learning/presentation/my_courses_page.dart`
- `lib/src/features/learning/presentation/course_workspace_page.dart`

## Organization Operations

| Flow | Endpoint family | Mobile behavior |
|---|---|---|
| Workspace list | `GET /api/v1/workspaces` | Select active organization and namespace cache. |
| Organization context | `GET /api/v1/organizations/:id/context` | Load permissions, modules, plan limits. |
| Organization profile update | `PATCH /api/v1/organizations/:id` | Update workspace name, bio, brand color, locale, and timezone through backend permissions. |
| Booking list | `GET /api/v1/organizations/:id/bookings` | Show owner/admin booking requests from the selected workspace. |
| Booking confirm | `POST /api/v1/organizations/:id/bookings/:bookingId/confirm` | Confirm through the backend transactional endpoint; no local enrollment logic. |
| Booking reject/cancel | `POST /api/v1/organizations/:id/bookings/:bookingId/reject`, `/cancel` | Apply decision through backend and refresh the list. |
| Course list | `GET /api/v1/organizations/:id/courses` | Show owner/admin course status and pricing from backend. |
| Batch list | `GET /api/v1/organizations/:id/batches` | Show linked batches, seats, status, and room context. |
| Invitation list | `GET /api/v1/organizations/:id/invitations` | Show pending/accepted invitation state. |
| Invite member | `POST /api/v1/organizations/:id/invitations` | Send role-based invitation through backend policy. |
| Invitation resend/cancel | `POST /api/v1/organizations/:id/invitations/:invitationId/resend`, `DELETE /api/v1/organizations/:id/invitations/:invitationId` | Refresh invitation links or cancel pending invites. |
| Room list/create | `GET /api/v1/organizations/:id/rooms`, `POST /api/v1/organizations/:id/rooms` | Show visible rooms and create rooms through backend policy. |
| Announcement list/create | `GET /api/v1/organizations/:id/announcements`, `POST /api/v1/organizations/:id/announcements` | Show published announcements and create organization-wide announcements through backend notification fan-out. |
| Event list/create/delete | `GET /api/v1/organizations/:id/events`, `POST /api/v1/organizations/:id/events`, `DELETE /api/v1/organizations/:id/events/:eventId` | Show visible calendar items and manage scheduled classes, exams, and meetings. |
| Task list/create/update/delete | `GET /api/v1/organizations/:id/tasks`, `POST /api/v1/organizations/:id/tasks`, `PATCH /api/v1/organizations/:id/tasks/:taskId`, `DELETE /api/v1/organizations/:id/tasks/:taskId` | Track workspace tasks and update status/progress through backend policy. |
| Member list/update/remove | `GET /api/v1/organizations/:id/members`, `PATCH /api/v1/organizations/:id/members/:membershipId`, `DELETE /api/v1/organizations/:id/members/:membershipId` | Review active memberships, change role/status, and remove members with backend last-owner protection. |
| Content link create/delete | `POST /api/v1/organizations/:id/content`, `DELETE /api/v1/organizations/:id/content/:contentId` | Publish link-based room content and remove content through backend file/content policy. |
| Rooms | `/api/v1/organizations/:id/rooms` | List, create, edit, room member/content entry. |
| Content | `/api/v1/organizations/:id/content` | Upload only when authorized; show processing state. |
| Announcements | `/api/v1/organizations/:id/announcements` | Read and quick create where permitted. |
| Calendar/events | `/api/v1/organizations/:id/events` | Schedule lists and detail views. |
| Courses/batches | `/api/v1/organizations/:id/courses`, `/batches` | Mobile stepper for create/edit. |
| Bookings | `/api/v1/organizations/:id/bookings` | Transactional confirm/reject/cancel only through backend. |
| Members/invitations | `/api/v1/organizations/:id/members`, `/invitations` | Permission-guarded management. |

Initial repository/controller/page files:

- `lib/src/features/workspaces/data/workspace_repository.dart`
- `lib/src/features/organization/presentation/organization_profile_page.dart`
- `lib/src/features/organization/data/organization_booking_repository.dart`
- `lib/src/features/organization/application/organization_booking_controller.dart`
- `lib/src/features/organization/presentation/organization_bookings_page.dart`
- `lib/src/features/organization/data/organization_course_repository.dart`
- `lib/src/features/organization/application/organization_course_controller.dart`
- `lib/src/features/organization/presentation/organization_courses_page.dart`
- `lib/src/features/organization/data/organization_invitation_repository.dart`
- `lib/src/features/organization/application/organization_invitation_controller.dart`
- `lib/src/features/organization/presentation/organization_invitations_page.dart`
- `lib/src/features/organization/data/organization_room_repository.dart`
- `lib/src/features/organization/application/organization_room_controller.dart`
- `lib/src/features/organization/presentation/organization_rooms_page.dart`
- `lib/src/features/organization/data/organization_announcement_repository.dart`
- `lib/src/features/organization/application/organization_announcement_controller.dart`
- `lib/src/features/organization/presentation/organization_announcements_page.dart`
- `lib/src/features/organization/data/organization_event_repository.dart`
- `lib/src/features/organization/application/organization_event_controller.dart`
- `lib/src/features/organization/presentation/organization_events_page.dart`
- `lib/src/features/organization/data/organization_task_repository.dart`
- `lib/src/features/organization/application/organization_task_controller.dart`
- `lib/src/features/organization/presentation/organization_tasks_page.dart`
- `lib/src/features/organization/data/organization_member_repository.dart`
- `lib/src/features/organization/application/organization_member_controller.dart`
- `lib/src/features/organization/presentation/organization_members_page.dart`
- `lib/src/features/organization/application/organization_content_controller.dart`
- `lib/src/features/organization/presentation/organization_content_page.dart`

## Protected Content

| Flow | Endpoint | Mobile behavior |
|---|---|---|
| View session | `GET /api/v1/organizations/:organizationId/content/:contentId/view-session` | Use signed URL until `expiresAt`; never persist or log it. |
| Room content | `GET /api/v1/organizations/:organizationId/content?roomId=:roomId` | Load visible course-room content before opening a protected view session. |
| Link content create | `POST /api/v1/organizations/:organizationId/content` | Create published link content for a selected room without storing local files. |
| Content delete | `DELETE /api/v1/organizations/:organizationId/content/:contentId` | Remove content and let backend clean linked file assets where present. |
| Viewer audit | `POST /api/v1/organizations/:organizationId/content/:contentId/viewer-audit` | Send opened, closed, failed, screenshot/screen-capture, blocked download, and watermark events. |
| Download | `GET /api/v1/organizations/:organizationId/content/:contentId/download` | Use only when `downloadAllowed` and backend permits. |

Initial repository file: `lib/src/features/content/data/content_repository.dart`.

Initial content list provider:

- `lib/src/features/content/application/course_content_controller.dart`

## Notifications

| Flow | Endpoint | Mobile behavior |
|---|---|---|
| Inbox | `GET /api/v1/notifications` | Cache according to offline policy. |
| Mark read | `POST /api/v1/notifications/:id/read` | Optimistic and reversible. |
| Mark all read | `POST /api/v1/notifications/read-all` | Optimistic and reversible. |
| Preferences | `/api/v1/notification-preferences` | Respect push preference before local notification display. |
| Register push token | `POST /api/v1/devices/push-tokens` | Register after login and on FCM token refresh. |
| Revoke push token | `DELETE /api/v1/devices/push-tokens` | Revoke on logout and explicit device unlink. |

Initial repository files:

- `lib/src/features/notifications/data/notification_repository.dart`
- `lib/src/features/notifications/application/notification_controller.dart`
- `lib/src/features/notifications/application/notification_tap_router.dart`
- `lib/src/features/notifications/presentation/notification_inbox_page.dart`
- `lib/src/features/devices/data/device_repository.dart`
- `lib/src/features/metadata/data/metadata_repository.dart`

