# RBAC

## Platform roles

- `super-admin`: all platform moderation and organization controls.
- Future backend roles: `platform_support`, `platform_moderator`.

## Organization roles

- `organization_owner`: billing, branding, roles, modules, and all organization operations.
- `organization_admin`: organization operations except ownership-only billing controls.
- `instructor`: assigned courses, batches, content, announcements, attendance, and students.
- `staff`: explicitly granted operational permissions.
- `student` / `member`: assigned rooms, enrollments, content, notifications, tasks, and schedule.

## Enforcement

Navigation visibility is not authorization. Production APIs must verify the authenticated membership, organization ID, permission, module entitlement, and subscription state for every request.

Student course access requires all of:

- Booking belongs to the authenticated email or user ID.
- Enrollment is active.
- Room membership is active.
- Subscription/access period is active.
- Requested resource belongs to the same organization and course.
