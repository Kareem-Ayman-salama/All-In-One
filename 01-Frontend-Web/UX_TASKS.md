# AIO UX & Product Quality Tasks

This file tracks the professional UX pass for All In One (AIO). Mark items as done only after implementation and build verification.

## Phase 1 - Authentication & Role Routing

- [x] Create a shared UX/product task list.
- [x] Remove manual role selection from the login screen.
- [x] Route users automatically by email/account role.
- [x] Add mock email accounts until the backend auth API is ready.
- [x] Document the backend `/auth/login` response contract.

## Phase 2 - Visual Polish & Cards

- [x] Standardize dashboard card spacing, hover states, headers, and actions.
- [x] Improve room/file/member/tenant cards with clear metadata and status.
- [x] Add consistent empty states for rooms, files, members, and notifications.
- [x] Improve action inbox cards with priority, owner, and direct actions.

## Phase 3 - Product UX Features

- [x] Add onboarding checklist for tenant admins.
- [x] Improve global search command results with grouped actions.
- [x] Improve detail drawers with activity, permissions, and primary actions.
- [x] Add audit log preview for security and file access.
- [x] Add invitation flow screens and states.

## Phase 4 - Backend Readiness

- [x] Define users, roles, permissions, and tenant mapping.
- [x] Define invite acceptance and first-password flow.
- [x] Define secure file viewer API needs.
- [x] Define notification/action inbox API needs.

## Phase 5 - QA

- [x] Build verification.
- [x] Smoke test login role routing.
- [x] Smoke test core dashboards.
- [x] Prepare clean upload ZIP.

## Phase 6 - Stitch Web UX Pass

- [x] Keep the existing landing page unchanged.
- [x] Skip mobile application screens and focus on responsive web only.
- [x] Replace the old app shell with a right-side RTL Stitch-style shell.
- [x] Rebuild Tenant Admin dashboard, rooms, content library, members, notifications, security, and subscription views from the Stitch screen structure.
- [x] Rebuild End User dashboard, protected file viewer, meetings, notifications, and settings flow from the Stitch screen structure.
- [x] Rebuild Super Admin screens from the Stitch shell/table/card structure.
- [x] Replace the remaining generic auth screens with clean Stitch-style auth screens.
- [x] Fix broken Arabic/English language copy.
- [x] Fix account placement in the top bar.
- [x] Make dark mode a true black interface.
- [x] Clean broken mock data text and make it backend-ready.
- [x] Build and smoke test production server routes.

## Phase 7 - Authentication, Account, Language & Responsive QA

- [x] Rebuild sign-in, personal registration, email verification, forgot password, and reset password screens.
- [x] Add real-time validation, password visibility, strength feedback, remember-me storage, OTP resend state, and localized errors.
- [x] Complete no-workspace and invitation acceptance routing.
- [x] Route all three account roles by authenticated account data without manual role selection.
- [x] Replace static account settings with functional profile, security, notification, appearance, and language sections.
- [x] Persist profile, security preferences, notification preferences, theme, accent, and language in mock mode.
- [x] Keep the account menu anchored correctly and move the sidebar according to RTL/LTR.
- [x] Add an accessible mobile navigation drawer and responsive settings/auth layouts.
- [x] Translate authentication, account settings, app shell, and primary role dashboards into Arabic and English.
- [x] Add valid privacy, terms, and support routes.
- [x] Verify dark mode uses true-black surfaces.
- [x] Build, route-smoke-test, and browser-test the complete authentication cycle.

## Phase 8 - Workspace Operations

- [x] Smart onboarding checklist with completion percentage.
- [x] Permission-aware global search and keyboard command palette.
- [x] Filterable notification center with direct destinations.
- [x] Activity and audit log.
- [x] Saved table filters and named views.
- [x] Subscription, usage, limits, and invoice page.
- [x] Confirmation and undo for destructive actions.
- [x] In-app help center and support entry point.
- [x] Dedicated 403 page.
- [x] Room scheduling connected to admin and end-user calendars.
- [x] Responsive, dynamic monthly calendar.

## Phase 9 - Student Teacher Booking

- [x] Add a dedicated student booking destination to End User navigation.
- [x] Add subject, level, lesson type, and teacher search filters.
- [x] Add verified teacher cards with ratings, pricing, experience, and availability.
- [x] Add a guided subject, format, date, and time booking flow.
- [x] Prevent duplicate reservations for the same teacher time slot.
- [x] Add a My Bookings view with confirmed lesson details.
- [x] Connect confirmed lessons to the student calendar and notifications.
- [x] Add Arabic and English content, dark mode, and responsive mobile layouts.
- [x] Verify the complete booking journey in the browser.

## Phase 10 - Multi-Organization SaaS

- [x] Add company, academy, training-center, and educational-organization models.
- [x] Add organization memberships and workspace switching for multi-organization users.
- [x] Isolate mock workspace and learning data per organization.
- [x] Add centralized roles, permissions, plan entitlements, and module visibility.
- [x] Route organization owners/admins/instructors to operations and students/members to their portal.
- [x] Add Super Admin organization review, plan, subscription, and module controls.

## Phase 11 - Learning & Work Operations

- [x] Add organization-scoped courses and internal training programs.
- [x] Add batches/cohorts with dates, capacity, reservations, and linked rooms.
- [x] Add booking review with capacity checks and enrollment/room access creation.
- [x] Keep private teacher booking separate from course enrollment.
- [x] Add room-aware announcement feed with pinned updates.
- [x] Add scheduled meeting UI ready for a backend video provider.
- [x] Add shared task board with priorities, due dates, and status changes.
- [x] Add dynamic student/employee dashboard based on organization type and membership.
- [x] Add responsive Arabic/English layouts and true-black dark mode for all new screens.
- [x] Verify desktop/mobile rendering, role routing, modal layering, and production build.

## Phase 12 - Backend Implementation (after frontend sign-off)

- [ ] Replace organization and learning mock repositories with production APIs.
- [ ] Connect payment provider and webhook-confirmed enrollment.
- [ ] Connect video meeting provider and signed meeting tokens.
- [ ] Connect file upload/storage, protected streaming, and watermark services.
- [ ] Add server-side notification delivery (in-app, email, and optional push).
- [ ] Add AI material indexing, grounded Q&A, and summaries after content APIs are stable.

## Phase 13 - Public Course Marketplace & Moderation

- [x] Add public course search with shareable URL filters, sorting, empty states, and responsive cards.
- [x] Add public course details with batches, instructor, academy, outcomes, pricing, and mobile booking CTA.
- [x] Add public academy directory and academy profile pages.
- [x] Add reserve-now-pay-later booking and success flow.
- [x] Add academy public profile settings and instructor management.
- [x] Replace simple course creation with a six-step draft/review wizard.
- [x] Connect marketplace batches to courses, capacity, schedules, and rooms.
- [x] Confirm bookings idempotently into enrollment, subscription, and room membership.
- [x] Add complete invitation management with copy, resend, cancel, and status states.
- [x] Add promotion requests and Super Admin promotion approval.
- [x] Add academy verification, course moderation, and category management.
- [x] Add locked-module upgrade states instead of silently hiding unavailable features.
- [x] Add student booking summary and protected course workspace.
- [x] Verify public, tenant, platform, and student routes in Chrome at desktop and mobile widths.
- [x] Verify no console errors and no mobile horizontal overflow.

## Phase 14 - Frontend Release Readiness

- [x] Keep the approved landing page at the root and connect it to the course marketplace.
- [x] Add Arabic/English controls and true-black dark mode to public marketplace pages.
- [x] Add dynamic SEO titles, descriptions, canonical URLs, and social metadata.
- [x] Add optimized lazy-loaded course artwork and responsive media framing.
- [x] Add course-wizard draft persistence, unsaved-change protection, and final preview.
- [x] Add booking details, internal notes, payment state, cancellation, and capacity restoration.
- [x] Add marketplace booking notifications and student cancellation controls.
- [x] Replace fixed academy dashboard metrics with organization-scoped marketplace data.
- [x] Add reusable empty states and responsive operational modals.
- [x] Add marketplace data-integrity tests.
- [x] Verify production build, Chrome, Edge, true-black dark mode, and mobile overflow.

## Phase 15 - Mobile Landing Experience & Company Presence

- [x] Convert feature, use-case, pricing, proof, process, and testimonial groups into touch-friendly mobile carousels.
- [x] Add mobile scroll snapping, card peeking, momentum scrolling, and hidden scrollbars.
- [x] Keep horizontal movement contained inside each carousel with zero page-level overflow.
- [x] Add a complete company-about section with value pillars.
- [x] Add contact actions, support entry, and ready-to-configure social channels.
- [x] Connect footer company, contact, privacy, terms, and support links.
- [x] Verify the 390px mobile layout and social/contact accessibility in Chrome.

## Phase 16 - Verified Public Information & Lead Capture

- [x] Replace placeholder social links with the confirmed Facebook and WhatsApp accounts.
- [x] Publish the approved phone number, Gmail address, Cairo location, and support hours.
- [x] Add a founder section for Kareem Ayman with confirmed LinkedIn and GitHub links.
- [x] Describe Tenfold Software Solutions accurately as the development team.
- [x] Add validated Demo and contact forms that prepare structured WhatsApp messages.
- [x] Explain clearly that lead data is not stored until a backend contact service is connected.
- [x] Remove unconfirmed Instagram, YouTube, TikTok, and X channels.
- [x] Update the footer copyright and public company information.

## Phase 17 - Attendance, Guardians & Free Operations

- [x] Add course-batch and private-lesson attendance sessions.
- [x] Allow instructors to record present, absent, late, and excused states.
- [x] Add instructor notes and guardian visibility controls.
- [x] Add guardian accounts with student-specific read-only attendance access.
- [x] Add configurable repeated-absence alerts for guardians.
- [x] Add weekly guardian attendance summaries with manual and scheduled delivery.
- [x] Add secure, expiring QR self check-in without a paid QR service.
- [x] Add attendance change history with actor and timestamp.
- [x] Export attendance and course/teacher bookings to Excel-compatible and CSV files.
- [x] Keep email delivery compatible with Brevo's free transactional SMTP plan.
- [x] Verify the production frontend build and integration contract checks.

## Phase 18 - OTP Operational Readiness

- [x] Centralize OTP mail readiness checks without exposing SMTP credentials.
- [x] Require a real transactional mailer, verified sender, and SMTP credentials.
- [x] Add a Super Admin-only OTP status endpoint.
- [x] Add a rate-limited OTP delivery test to the signed-in administrator email only.
- [x] Record successful OTP delivery tests in the audit log without storing plain codes.
- [x] Add a responsive OTP operations panel to Super Admin settings.
- [x] Add loading, not-ready, delivery-error, and success states.
- [x] Add authorization, readiness, and delivery feature tests.
- [x] Verify the frontend production build and integration checks.

## Phase 19 - Booking Export Data Quality

- [x] Require a student contact phone when booking a private lesson.
- [x] Persist the contact phone on the lesson booking for academy follow-up.
- [x] Include student name, email, phone, teacher, subject, schedule, and payment state in exports.
- [x] Verify course bookings, teacher bookings, and attendance content inside generated files.
- [x] Protect CSV exports from spreadsheet formula injection.
- [x] Keep Excel and CSV generation local to the backend without a paid export service.
