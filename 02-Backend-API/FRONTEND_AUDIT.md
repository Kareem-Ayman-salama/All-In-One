# AIO Frontend Audit

## Source

- Active frontend: `../FrontEnd/AIOFRONT_FINAL`
- Framework: React 19, Vite 6, React Router 7
- Styling: application-wide CSS with reusable React primitives
- State: React contexts plus local browser persistence
- API layer: `src/services/httpClient.js`, `api.js`, and domain repositories
- Product name: **AIO - All In One**. References to AIN in legacy keys are compatibility details only.

## Public Routes

- `/` static marketing landing
- `/login`
- `/create-account`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/register-company`
- `/company-onboarding`
- `/join`
- `/no-workspace`
- `/invite/:token`
- `/courses`
- `/courses/:courseSlug`
- `/academies`
- `/academies/:academySlug`
- `/booking/:courseId`
- `/booking/success`
- `/privacy`
- `/terms`
- `/support`

## Authenticated Routes

- `/workspaces`
- `/end-user/:page`
- `/tenant-admin/:page`
- `/super-admin/:page`

The page parameter maps to dashboard modules. The backend must authorize every
module independently; frontend route visibility is not an authorization layer.

## Frontend Roles

Legacy UI role names:

- `super-admin`
- `tenant-admin`
- `end-user`

Backend canonical roles:

- Platform: `super_admin`, `platform_support`, `platform_moderator`
- Organization: `organization_owner`, `organization_admin`, `instructor`,
  `staff`, `student`, `member`

An API compatibility transformer will map canonical roles to the three legacy
shell names until the frontend route layer is upgraded.

## Main Forms

### Authentication

- Login: email, password, remember
- Personal account: name, email, password, password confirmation
- Email verification: six-digit code
- Forgot password: email
- Reset password: code, password, password confirmation
- Company registration: company, owner name, email, password
- Invitation acceptance: invitation code or token
- Account profile: display name, avatar
- Change password: current password, new password

### Organization Operations

- Organization: name, type, bio, branding, plan
- Room: name, access type, expected members, optional scheduled event
- Member invitation: name, email, role, rooms, expiry
- Protected file: file, room, download policy
- Announcement: localized title/body, audience, room, pinned
- Event/meeting: localized title, date, time, duration, room, host
- Task: localized title, scope, assignee, due date, priority

### Marketplace

- Academy profile: localized name/description, slug, location, phone, email,
  website, visibility
- Instructor: account link, localized bio, specialties
- Course wizard: localized title/descriptions, category, level, subject,
  instructor, delivery type, price, discount, outcomes, requirements,
  duration, sessions, room
- Batch: course, localized title, dates, schedule, capacity, room, location
- Public booking: batch, student name, email, phone, note, terms acceptance
- Booking review: status, payment status, internal note
- Promotion: course, type, placement, duration
- Category: localized name, parent category, active status

## Mock and Local-Only Areas

- Authentication accounts, OTP `123456`, and tokens are mocked.
- Marketplace data and booking confirmation are stored in localStorage.
- Organization, workspace, learning, settings, saved views, and notifications
  use local adapters.
- File uploads have UI only and are not persisted to object storage.
- Dashboard analytics are mock arrays.
- Role checks are client-side UX checks only.

Production must run with `VITE_USE_MOCK_API=false`; no silent mock fallback is
allowed after integration.

## Security Risks Found

1. Legacy user objects contain one `tenantId`; the real model must use
   organization memberships so one user can join multiple organizations.
2. Browser tokens are stored in local/session storage in mock mode. Production
   uses short-lived Sanctum tokens and rotating, revocable sessions.
3. Public forms currently imply roles in the UI. The backend must ignore role,
   organization, and permission values from public registration.
4. Booking capacity is calculated in browser state. The backend must lock and
   confirm capacity transactionally.
5. Protected file URLs cannot be trusted from the browser. The backend must
   authorize and issue short-lived signed access.
6. Local notification targets are not authoritative. The backend must produce
   permission-safe targets.

## Frontend Build Evidence

At backend start:

- Marketplace validation: passed
- Vite production build: passed
- Mobile and desktop visual verification: passed

