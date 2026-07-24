# Mobile Integration Test Report

Date: 2026-07-24

## Backend Contract Coverage

`docs/mobile-openapi.json` and `scripts/validate-integration.mjs` currently
cover these mobile integration surfaces:

- Authentication, refresh, current user, sessions, and logout.
- Workspace list and organization context.
- Public marketplace course catalog, course details, and booking submission.
- Student bookings and enrollments.
- Organization content list, protected view sessions, and viewer audit.
- Error catalog, device policy, offline cache policy, and deep-link manifest.
- Push device token registration/revocation.
- Notification inbox, mark-read, mark-all-read, and tap routing.

## Staging Flows Still Required

- Student login.
- Workspace selection and switch.
- Explore courses with filters.
- Submit booking and verify backend confirmation.
- Confirm booking from organization role.
- Verify enrollment appears in My Courses.
- Open course workspace and protected content.
- Receive foreground/background/terminated notification.
- Accept invitation deep link.
- Logout and revoke session/device token.

## Current Result

No real-device or simulator integration test has been executed in this
environment because Flutter and native tooling are unavailable.
