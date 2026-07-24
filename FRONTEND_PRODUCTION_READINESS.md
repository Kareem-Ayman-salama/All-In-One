# Frontend Production Readiness

## Active frontend

The only active frontend is:

`FrontEnd/AIOFRONT_FINAL`

Build and deploy this directory. Do not deploy an older archive or parent folder.

## Academy workflow

Use the Tenant Admin dashboard in this order:

1. **Academy Profile**: add the public academy name, contact details, description,
   location, logo, and publishing settings.
2. **Instructors**: create instructor profiles and specialties.
3. **Rooms**: create the private learning workspace used after enrollment.
4. **Courses**: use the six-step course wizard to add information, delivery,
   pricing, content details, room access, and publishing.
5. **Batches**: add dates, schedule, capacity, and connect each batch to a room.
6. **Bookings**: review student requests and confirm or reject them.

The tenant dashboard includes a launch guide with direct links to these pages.

## Responsive coverage

- Desktop sidebar and dense operational layouts.
- Tablet drawer shell below 1024 px.
- Mobile navigation, forms, modals, tables, and account settings.
- Long card groups use touch-friendly horizontal scrolling with scroll snapping.
- RTL Arabic and LTR English layouts.
- Light and black dark themes.
- Mobile account settings use a horizontal tab bar instead of a tall sidebar.

## Verification

Run:

```bash
pnpm test
pnpm build
```

The validation checks marketplace fixtures, public routes, role guards, tenant
context, account settings reuse, responsive rules, browser token storage, unsafe
browser APIs, and production security headers.

The latest verified production build transformed 1640 modules successfully.

## Deployment configuration

Set:

```bash
VITE_API_BASE_URL=https://api.example.com
VITE_USE_MOCK_API=false
```

The frontend server command is:

```bash
pnpm start
```

Railway must deploy from the `AIOFRONT_FINAL` root so it can find
`package.json`, `pnpm-lock.yaml`, `server.js`, and the build configuration.

## Backend gate

The frontend is ready for backend integration and staging. Real production use
still requires the backend to enforce:

- Authentication, refresh sessions, MFA, and password reset.
- Organization data isolation and permission checks.
- Transactional booking confirmation, enrollment, room membership, and access.
- Plan limits and locked modules.
- Protected uploads and short-lived file URLs.
- Email and notification delivery.
- Rate limiting, audit logging, monitoring, and backups.

Frontend route guards and hidden controls improve UX but never replace backend
authorization.
