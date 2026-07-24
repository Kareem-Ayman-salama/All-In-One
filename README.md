# AIOFRONT React

React implementation for the AIOFRONT prototype, prepared for backend integration.

## Run locally

```bash
npm install
npm run dev
```

## Production

```bash
npm install
npm run build
npm start
```

The current data source is mocked in `src/data/mockData.js`. Replace the functions in `src/services/api.js` with backend endpoints when APIs are ready.

## Backend integration

Copy `.env.example` to `.env` and set:

```bash
VITE_API_BASE_URL=https://your-api-domain.com
VITE_USE_MOCK_API=false
```

Main integration files:

- `src/services/httpClient.js`: base URL, token headers, and request errors.
- `src/services/authService.js`: complete auth cycle, invitation acceptance, profile updates, and mock session handling.
- `src/services/api.js`: rooms, files, members, tenants, analytics, and subscription endpoints.
- `src/services/organizationRepository.js`: organization memberships and workspace selection.
- `src/services/learningRepository.js`: courses, cohorts, bookings, enrollments, announcements, meetings, and tasks.
- `src/domain/organization.js`: roles, permissions, plan entitlements, and module access rules.

### Multi-organization model

One account can belong to multiple organizations. Every request after sign-in should be scoped by an active `organizationId`; the backend remains authoritative for membership, role, permissions, and plan entitlements.

Core organization roles:

- `organization_owner`
- `organization_admin`
- `instructor`
- `staff`
- `student`
- `member`

Recommended API groups:

- `/users/me/organization-memberships`
- `/organizations/:organizationId`
- `/organizations/:organizationId/courses`
- `/organizations/:organizationId/batches`
- `/organizations/:organizationId/bookings`
- `/organizations/:organizationId/enrollments`
- `/organizations/:organizationId/announcements`
- `/organizations/:organizationId/meetings`
- `/organizations/:organizationId/tasks`

Course booking confirmation must be transactional: lock the cohort capacity, confirm the booking, create the enrollment, grant room access, and emit a notification in one backend transaction.

### Auth routing contract

The login screen no longer lets users choose their role manually. The backend should identify the user by email and return the correct role.

`POST /auth/login`

```json
{
  "email": "admin@techcorp.test",
  "password": "********"
}
```

Expected response:

```json
{
  "token": "jwt_or_session_token",
  "user": {
    "id": "user_123",
    "name": "Ahmed Mostafa",
    "email": "admin@techcorp.test",
    "role": "tenant-admin",
    "roleLabel": "Tenant Admin",
    "tenantId": "tenant_techcorp",
    "company": "TechCorp Egypt",
    "permissions": ["manage_rooms", "manage_members", "upload_files"]
  }
}
```

Frontend redirects by `user.role`:

- `super-admin` -> `/super-admin/dashboard`
- `tenant-admin` -> `/tenant-admin/dashboard`
- `end-user` -> `/end-user/home`

Mock accounts while backend auth is not connected:

- `super@ain.test`
- `admin@techcorp.test`
- `employee@techcorp.test`
- `student@ain.test`
- password: `12345678`

Production routes:

- `/login`
- `/create-account`
- `/verify-email`
- `/forgot-password`
- `/reset-password`
- `/join`
- `/invite/:token`
- `/no-workspace`
- `/end-user/home`
- `/end-user/files`
- `/tenant-admin/dashboard`
- `/tenant-admin/rooms`
- `/tenant-admin/files`
- `/tenant-admin/members`
- `/super-admin/dashboard`
- `/super-admin/tenants`
- `/super-admin/subscriptions`
- `/courses`
- `/courses/:courseSlug`
- `/academies`
- `/academies/:academySlug`
- `/booking/:courseId`
- `/booking/success`
- `/tenant-admin/academyProfile`
- `/tenant-admin/instructors`
- `/tenant-admin/invitations`
- `/tenant-admin/promotions`
- `/super-admin/academies`
- `/super-admin/courseApprovals`
- `/super-admin/promotions`
- `/super-admin/categories`

## QA demo

The mock build includes visible test-account shortcuts on `/login`. Personal-account registration and password recovery use OTP `123456` in mock mode. Remove demo hints by switching `VITE_USE_MOCK_API=false` and connecting the documented endpoints.
