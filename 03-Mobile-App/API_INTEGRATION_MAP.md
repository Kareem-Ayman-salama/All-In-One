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
| Mobile readiness | `GET /api/v1/meta/offline-cache-policy`, `GET /api/v1/meta/device-policy`, `GET /api/v1/meta/deep-links` | Profile shows cache counts, write behavior, purge triggers, device limits, signed URL memory-only protection, and deep-link manifest coverage. |
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
| Profile update | `PATCH /api/v1/auth/me` | Update authenticated user name, locale, and timezone from mobile profile settings. |
| Sessions | `GET /api/v1/auth/sessions` | Show active devices with installation metadata. |
| Revoke session | `DELETE /api/v1/auth/sessions/:session` | Clear matching local/push state when current device is revoked. |
| Revoke other sessions | `DELETE /api/v1/auth/sessions/others` | Sign out other devices while preserving the current mobile session. |
| Logout | `POST /api/v1/auth/logout` | Revoke push token and clear secure/cache state. |

Initial repository/controller files:

- `lib/src/features/auth/data/auth_repository.dart`
- `lib/src/features/auth/application/auth_controller.dart`
- `lib/src/features/auth/presentation/auth_flow_pages.dart`
- `lib/src/features/auth/presentation/login_page.dart`
- `lib/src/features/profile/application/profile_controller.dart`
- `lib/src/features/profile/presentation/profile_page.dart`

## Marketplace And Student

| Flow | Endpoint family | Mobile behavior |
|---|---|---|
| Course catalog | `/api/v1/public/courses` | Debounced search, filters, pagination/infinite list. |
| Course details | `/api/v1/public/courses/:course` | Do not expose private content before authorization. |
| Academies | `/api/v1/public/academies` | Public profile and course list. |
| Booking | `/api/v1/public/bookings` | Server-confirmed submit, handle duplicate/full errors, then route to a confirmation screen. |
| Student bookings | `/api/v1/student/bookings` | Show booking status and next action; hydrate booking success deep links with live status and payment state when authenticated. |
| Enrollments | `/api/v1/student/enrollments` | Entry point to course workspace. |
| Enrollment detail | `/api/v1/student/enrollments/:enrollment` | Validate access state before opening course workspace. |
| Lesson instructors | `GET /api/v1/public/instructors` | Show active verified instructors with open future slots. |
| Lesson bookings | `GET/POST /api/v1/student/lesson-bookings`, `POST /api/v1/student/lesson-bookings/:bookingId/cancel` | Reserve with `slotId`, `subject`, required `studentPhone`, and optional `note`; cancel confirmed bookings through the backend policy. |
| Student attendance | `GET /api/v1/student/attendance` | Show authenticated student attendance records and summary. |
| Guardian attendance | `GET /api/v1/guardian/students`, `GET /api/v1/guardian/students/:studentId/attendance` | Show linked students and guardian-visible attendance summaries/records. |
| Unified schedule | `GET /api/v1/student/enrollments`, `GET /api/v1/organizations/:id/events` | Combine confirmed course batch schedules and selected-workspace calendar events into the mobile schedule route. |

Initial repository and screen files:

- `lib/src/features/marketplace/data/public_course_repository.dart`
- `lib/src/features/marketplace/application/public_course_catalog_controller.dart`
- `lib/src/features/marketplace/presentation/course_catalog_page.dart`
- `lib/src/features/marketplace/presentation/course_detail_page.dart`
- `lib/src/features/marketplace/presentation/booking_success_page.dart`
- `lib/src/features/learning/data/student_learning_repository.dart`
- `lib/src/features/learning/data/lesson_booking_repository.dart`
- `lib/src/features/learning/data/attendance_repository.dart`
- `lib/src/features/learning/application/student_learning_controller.dart`
- `lib/src/features/learning/application/lesson_booking_controller.dart`
- `lib/src/features/learning/application/attendance_controller.dart`
- `lib/src/features/learning/presentation/my_courses_page.dart`
- `lib/src/features/learning/presentation/course_workspace_page.dart`
- `lib/src/features/learning/presentation/lesson_bookings_page.dart`
- `lib/src/features/learning/presentation/attendance_page.dart`
- `lib/src/features/schedule/application/schedule_controller.dart`
- `lib/src/features/schedule/presentation/schedule_page.dart`

## Organization Operations

| Flow | Endpoint family | Mobile behavior |
|---|---|---|
| Workspace list | `GET /api/v1/workspaces` | Select active organization, show plan/subscription status, and namespace cache. |
| Organization context | `GET /api/v1/organizations/:id/context` | Load permissions, modules, plan limits, subscription status, and period end for renewal warnings. |
| Organization overview | `/api/v1/organizations/:id/context`, `/courses`, `/batches`, `/bookings`, `/members`, `/content`, `/events`, `/tasks` | Aggregate existing workspace providers into a mobile operations dashboard without adding a backend-only summary contract. |
| Organization profile update | `PATCH /api/v1/organizations/:id` | Update workspace name, bio, brand color, locale, and timezone through backend permissions. |
| Booking list | `GET /api/v1/organizations/:id/bookings` | Show owner/admin booking requests from the selected workspace. |
| Booking confirm | `POST /api/v1/organizations/:id/bookings/:bookingId/confirm` | Confirm through the backend transactional endpoint; show the action only with `bookings.confirm`. |
| Booking reject/cancel | `POST /api/v1/organizations/:id/bookings/:bookingId/reject`, `/cancel` | Apply decision through backend, refresh the list, and show actions only with `bookings.manage`/`bookings.cancel`. |
| Course list/create/update/review | `GET /api/v1/organizations/:id/courses`, `POST /api/v1/organizations/:id/courses`, `PUT /api/v1/organizations/:id/courses/:courseId`, `POST /api/v1/organizations/:id/courses/:courseId/submit-review` | Show owner/admin course status; create/edit/review actions require `courses.create`, `courses.update`, and `courses.publish`. |
| Batch list/create/update | `GET /api/v1/organizations/:id/batches`, `POST /api/v1/organizations/:id/batches`, `PATCH /api/v1/organizations/:id/batches/:batchId` | Show linked batches, seats, status, and room context; create/edit controls require `batches.manage`. |
| Instructor list/create/update/slots | `GET/POST /api/v1/organizations/:id/instructors`, `PUT /api/v1/organizations/:id/instructors/:instructorId`, `GET/POST /api/v1/organizations/:id/instructor-slots` | Manage instructor profiles and create bookable availability slots with course permissions. |
| Invitation list | `GET /api/v1/organizations/:id/invitations` | Show pending/accepted invitation state. |
| Invite member | `POST /api/v1/organizations/:id/invitations` | Send role-based invitation through backend policy when `members.invite` is available. |
| Invitation resend/cancel | `POST /api/v1/organizations/:id/invitations/:invitationId/resend`, `DELETE /api/v1/organizations/:id/invitations/:invitationId` | Refresh invitation links or cancel pending invites only with `members.invite`. |
| Room list/create/update/delete | `GET /api/v1/organizations/:id/rooms`, `POST /api/v1/organizations/:id/rooms`, `PATCH /api/v1/organizations/:id/rooms/:roomId`, `DELETE /api/v1/organizations/:id/rooms/:roomId` | Show visible rooms; create/edit/delete/member controls require `rooms.create`, `rooms.update`, and `rooms.delete`. |
| Announcement list/create/update/delete | `GET /api/v1/organizations/:id/announcements`, `POST /api/v1/organizations/:id/announcements`, `PATCH /api/v1/organizations/:id/announcements/:announcementId`, `DELETE /api/v1/organizations/:id/announcements/:announcementId` | Show published announcements, create organization-wide or room-targeted announcements through backend notification fan-out, edit announcement copy/target, and delete announcements. |
| Attendance sessions/marking | `GET /api/v1/organizations/:id/learning-sessions`, `GET/PUT /api/v1/organizations/:id/learning-sessions/:sessionId/attendance`, `POST /api/v1/organizations/:id/learning-sessions/:sessionId/attendance/lock`, `POST /api/v1/organizations/:id/learning-sessions/:sessionId/attendance/qr` | Review learning sessions, load participants, mark attendance, copy QR check-in links, and lock sheets only with attendance permissions. |
| Promotion list/create | `GET/POST /api/v1/organizations/:id/promotions` | Review campaign status and metrics, then submit marketplace promotions for backend moderation. |
| Organization analytics | `GET /api/v1/organizations/:id/analytics/overview` | Show range-filtered workspace metrics for rooms, members, courses, bookings, enrollments, subscriptions, and confirmed revenue. |
| Event list/create/delete | `GET /api/v1/organizations/:id/events`, `POST /api/v1/organizations/:id/events`, `DELETE /api/v1/organizations/:id/events/:eventId` | Show visible calendar items with room filters, and manage scheduled classes, exams, and meetings with native date/time pickers. |
| Task list/create/update/delete | `GET /api/v1/organizations/:id/tasks`, `POST /api/v1/organizations/:id/tasks`, `PATCH /api/v1/organizations/:id/tasks/:taskId`, `DELETE /api/v1/organizations/:id/tasks/:taskId` | Track workspace tasks, assign rooms/members from mobile pickers, and update status/progress through backend policy. |
| Member list/update/remove | `GET /api/v1/organizations/:id/members`, `PATCH /api/v1/organizations/:id/members/:membershipId`, `DELETE /api/v1/organizations/:id/members/:membershipId` | Review active memberships; role/status controls require `members.update`, removal requires `members.remove`, and backend last-owner protection remains authoritative. |
| Content create/delete | `POST /api/v1/organizations/:id/content`, `DELETE /api/v1/organizations/:id/content/:contentId` | Publish link-based or file-upload room content and remove content through backend file/content policy. |
| Rooms | `/api/v1/organizations/:id/rooms`, `/api/v1/organizations/:id/rooms/:roomId/members` | List, create, edit, delete, and manage room members. |
| Content | `/api/v1/organizations/:id/content` | Upload only when authorized; show processing state. |
| Announcements | `/api/v1/organizations/:id/announcements` | Read, create, edit, and delete where permitted. |
| Calendar/events | `/api/v1/organizations/:id/events` | Schedule lists and detail views. |
| Courses/batches | `/api/v1/organizations/:id/courses`, `/batches` | Mobile review, create, course edit, course review submit, and batch create/edit. |
| Bookings | `/api/v1/organizations/:id/bookings` | Transactional confirm/reject/cancel only through backend. |
| Members/invitations | `/api/v1/organizations/:id/members`, `/invitations` | Permission-guarded management. |

## Platform Operations

| Flow | Endpoint family | Mobile behavior |
|---|---|---|
| Platform overview | `GET /api/v1/admin/analytics/overview`, `GET /api/v1/admin/organizations` | Show platform role users tenant, revenue, subscription, booking, and course metrics with latest organizations. |
| Academy approvals | `GET /api/v1/admin/academies`, `POST /api/v1/admin/academies/:academyId/verify`, `POST /api/v1/admin/academies/:academyId/reject` | Let platform role users review academy marketplace profiles, verify visibility, or reject with a required note. |
| Category management | `GET /api/v1/admin/categories`, `POST /api/v1/admin/categories`, `PUT /api/v1/admin/categories/:categoryId`, `DELETE /api/v1/admin/categories/:categoryId` | Let platform role users manage marketplace category names, hierarchy, visibility, and ordering. |
| Course approvals | `GET /api/v1/admin/courses`, `POST /api/v1/admin/courses/:courseId/approve`, `POST /api/v1/admin/courses/:courseId/reject` | Let platform role users review pending courses, approve publication, or reject with a required note. |
| Promotion approvals | `GET /api/v1/admin/promotions`, `POST /api/v1/admin/promotions/:promotionId/approve`, `POST /api/v1/admin/promotions/:promotionId/reject` | Let platform role users review sponsored placements, approve activation, or reject with a required note. |

Initial repository/controller/page files:

- `lib/src/features/workspaces/data/workspace_repository.dart`
- `lib/src/features/organization/presentation/organization_overview_page.dart`
- `lib/src/features/organization/presentation/organization_profile_page.dart`
- `lib/src/features/organization/data/organization_booking_repository.dart`
- `lib/src/features/organization/application/organization_booking_controller.dart`
- `lib/src/features/organization/presentation/organization_bookings_page.dart`
- `lib/src/features/organization/data/organization_course_repository.dart`
- `lib/src/features/organization/application/organization_course_controller.dart`
- `lib/src/features/organization/presentation/organization_courses_page.dart`
- `lib/src/features/organization/data/organization_instructor_repository.dart`
- `lib/src/features/organization/application/organization_instructor_controller.dart`
- `lib/src/features/organization/presentation/organization_instructors_page.dart`
- `lib/src/features/organization/data/organization_invitation_repository.dart`
- `lib/src/features/organization/application/organization_invitation_controller.dart`
- `lib/src/features/organization/presentation/organization_invitations_page.dart`
- `lib/src/features/organization/data/organization_room_repository.dart`
- `lib/src/features/organization/application/organization_room_controller.dart`
- `lib/src/features/organization/presentation/organization_rooms_page.dart`
- `lib/src/features/organization/data/organization_announcement_repository.dart`
- `lib/src/features/organization/application/organization_announcement_controller.dart`
- `lib/src/features/organization/presentation/organization_announcements_page.dart`
- `lib/src/features/organization/data/organization_attendance_repository.dart`
- `lib/src/features/organization/application/organization_attendance_controller.dart`
- `lib/src/features/organization/presentation/organization_attendance_page.dart`
- `lib/src/features/organization/data/organization_promotion_repository.dart`
- `lib/src/features/organization/application/organization_promotion_controller.dart`
- `lib/src/features/organization/presentation/organization_promotions_page.dart`
- `lib/src/features/organization/data/organization_analytics_repository.dart`
- `lib/src/features/organization/application/organization_analytics_controller.dart`
- `lib/src/features/organization/presentation/organization_analytics_page.dart`
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
- `lib/src/features/platform/data/platform_overview_repository.dart`
- `lib/src/features/platform/application/platform_overview_controller.dart`
- `lib/src/features/platform/presentation/platform_overview_page.dart`
- `lib/src/features/platform/data/platform_academy_moderation_repository.dart`
- `lib/src/features/platform/application/platform_academy_moderation_controller.dart`
- `lib/src/features/platform/presentation/platform_academy_approvals_page.dart`
- `lib/src/features/platform/data/platform_category_repository.dart`
- `lib/src/features/platform/application/platform_category_controller.dart`
- `lib/src/features/platform/presentation/platform_categories_page.dart`
- `lib/src/features/platform/data/platform_course_moderation_repository.dart`
- `lib/src/features/platform/application/platform_course_moderation_controller.dart`
- `lib/src/features/platform/presentation/platform_course_approvals_page.dart`
- `lib/src/features/platform/data/platform_promotion_moderation_repository.dart`
- `lib/src/features/platform/application/platform_promotion_moderation_controller.dart`
- `lib/src/features/platform/presentation/platform_promotion_approvals_page.dart`

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
| Inbox | `GET /api/v1/notifications` | Cache successful responses according to `notifications.inbox`; fall back to cached notifications on refresh failure; show TTL, storage, stale-while-revalidate, offline readable, cache fallback, and optimistic read-state indicators. |
| Mark read | `POST /api/v1/notifications/:id/read` | Optimistic and reversible. |
| Mark all read | `POST /api/v1/notifications/read-all` | Optimistic and reversible. |
| Preferences | `/api/v1/notification-preferences` | Respect push preference before local notification display. |
| Preferences update | `PUT /api/v1/notification-preferences` | Update in-app, email, push, booking, announcement, and subscription reminder switches. |
| Register push token | `POST /api/v1/devices/push-tokens` | Register after login and on FCM token refresh. |
| Revoke push token | `DELETE /api/v1/devices/push-tokens` | Revoke on logout and explicit device unlink. |

Initial repository files:

- `lib/src/features/notifications/data/notification_repository.dart`
- `lib/src/features/notifications/application/notification_controller.dart`
- `lib/src/features/notifications/application/notification_tap_router.dart`
- `lib/src/features/notifications/presentation/notification_inbox_page.dart`
- `lib/src/features/devices/data/device_repository.dart`
- `lib/src/features/metadata/data/metadata_repository.dart`
- `lib/src/features/metadata/application/mobile_readiness_controller.dart`

