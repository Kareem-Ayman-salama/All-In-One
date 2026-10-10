# AIO Frontend Architecture

AIO is a multi-tenant React application with three authenticated product shells and one public marketplace.

## Product surfaces

- Public marketplace: academies, courses, course details, and reserve-now-pay-later booking.
- Organization workspace: rooms, content, courses, batches, bookings, invitations, promotions, and settings.
- Student workspace: bookings, active enrollments, course workspaces, protected content, and schedule.
- Platform administration: organizations, academy verification, course moderation, promotions, and categories.

## State boundaries

- `AuthContext`: authenticated account and session actions.
- `OrganizationContext`: active tenant membership, role, permissions, plan, and enabled modules.
- `MarketplaceContext`: public academies, instructors, courses, batches, bookings, enrollments, subscriptions, room memberships, promotions, categories, and invitations.
- `WorkspaceContext`: organization rooms, files, members, notifications, and calendar data.

Mock persistence is isolated in local storage. Backend integration must replace context persistence through repository interfaces without changing presentation components.

## Enrollment transaction

The required atomic backend operation is:

`Booking -> Enrollment -> RoomMembership -> Subscription -> ContentAccess`

`confirmBooking` is idempotent in the frontend mock. The production endpoint must enforce capacity and uniqueness in one database transaction.

## Main source directories

- `src/pages/MarketplacePages.jsx`: public discovery and booking.
- `src/components/MarketplaceAdminOperations.jsx`: tenant and platform operations.
- `src/components/StudentMarketplaceOperations.jsx`: student learning experience.
- `src/contexts/MarketplaceContext.jsx`: connected mock domain operations.
- `src/data/marketplaceData.js`: deterministic demo data.
