# Routes

## Public

- `/` existing workspace entry
- `/courses`
- `/courses/:courseSlug`
- `/academies`
- `/academies/:academySlug`
- `/booking/:courseId`
- `/booking/success`
- `/login`, `/create-account`, `/forgot-password`, `/reset-password`
- `/invite/:token`

## Student

- `/end-user/home`
- `/end-user/courses`
- `/end-user/course?enrollment=:enrollmentId`
- `/end-user/bookings`
- `/end-user/calendar`
- `/end-user/files`
- `/end-user/notifications`
- `/end-user/settings`

## Organization

- `/tenant-admin/courses`
- `/tenant-admin/batches`
- `/tenant-admin/bookingRequests`
- `/tenant-admin/academyProfile`
- `/tenant-admin/instructors`
- `/tenant-admin/invitations`
- `/tenant-admin/promotions`
- Existing room, content, member, announcement, meeting, task, analytics, security, billing, and settings routes.

## Platform

- `/super-admin/academies`
- `/super-admin/courseApprovals`
- `/super-admin/promotions`
- `/super-admin/categories`
- Existing organization, revenue, subscription, pricing, activity, notification, and settings routes.
