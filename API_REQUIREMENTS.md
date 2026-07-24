# Backend API Requirements

All tenant endpoints derive organization access from the authenticated membership. Do not trust an editable `organizationId` alone.

## Public

- `GET /public/courses`
- `GET /public/courses/:slug`
- `GET /public/academies`
- `GET /public/academies/:slug`
- `GET /public/categories`
- `POST /public/bookings`

## Organization

- CRUD `/organizations/:organizationId/academy-profile`
- CRUD `/organizations/:organizationId/instructors`
- CRUD `/organizations/:organizationId/courses`
- CRUD `/organizations/:organizationId/batches`
- `GET /organizations/:organizationId/bookings`
- `POST /organizations/:organizationId/bookings/:bookingId/confirm`
- `POST /organizations/:organizationId/bookings/:bookingId/reject`
- CRUD `/organizations/:organizationId/invitations`
- `POST /organizations/:organizationId/invitations/:id/resend`
- CRUD `/organizations/:organizationId/promotions`

## Platform

- `GET /admin/academy-approvals`
- `POST /admin/academies/:id/approve|reject|suspend`
- `GET /admin/course-approvals`
- `POST /admin/courses/:id/approve|reject|request-changes`
- CRUD `/admin/categories`
- `POST /admin/promotions/:id/approve|reject|pause`

## Booking confirmation response

Return the confirmed booking, enrollment, room membership, subscription, and emitted notification. The operation must be transactional and idempotent.

## Environment

- `VITE_API_BASE_URL`
- `VITE_USE_MOCK_API=false`
- Public media CDN URL when storage is connected.
- Payment and storage secrets belong only on the server.
