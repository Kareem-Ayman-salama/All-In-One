# Mobile TODO Tracker

Last updated: 2026-10-02

Overall implementation coverage estimate: about 82% done and 18% remaining
before internal QA. Release readiness is about 62% after local Flutter,
Android, and Laravel verification. Public release still needs iOS/macOS
validation, signing, real-device QA, store assets, and privacy approval.

## Phase Summary

| Phase | Status | Approx. Progress | Notes |
|---|---:|---:|---|
| Phase 0 - Audit and contract mapping | Done | 100% | Web app, Laravel routes, controllers, docs, and mobile spec reviewed. |
| Phase 1 - Flutter foundation | Done | 100% | App shell, routing, API client, secure token storage, env config, telemetry guardrails. |
| Phase 2 - Account and workspace | Done | 95% | Auth, verification, reset password, workspace selection, profile, preferences, schedule. |
| Phase 3 - Student and marketplace | Done | 85% | Course catalog/details, booking request/success, learning, attendance, notifications, content entry. |
| Phase 4A - Organization operations | Mostly done | 80% | Organization dashboard and management surfaces are wired; some detailed edge actions still need native QA. |
| Phase 4B - Platform operations | In progress | 65% | Overview, academy approvals, category management, course approvals, and promotion approvals are wired. |
| Phase 5 - Offline, content hardening, deep links | Done | 100% | App-layer offline policy, cache fallback, readiness UI, notification stale/offline UI, secure viewer session UI, and deep-link manifest summary are wired. Native validation remains in Phase 6. |
| Phase 6 - Native app and release | In progress | 58% | Flutter/Dart/PHP/Composer are locally available, Android/iOS folders are generated, release builds fail closed without required secrets, and automated tests pass. Needs signed artifacts, iOS/macOS validation, QA, final package IDs, and store assets. |

## Done

### Phase 0 - Audit and Planning

- Audited the current web frontend and Laravel backend routes/controllers.
- Reviewed the mobile implementation specification source.
- Created mobile integration documentation and OpenAPI contract tracking.
- Added integration validation so Flutter endpoint usage, docs, and backend
  routes stay aligned.

### Phase 1 - Mobile Foundation

- Flutter mobile app structure.
- GoRouter navigation shell and guarded routes.
- Dio API client with bearer token handling.
- Secure token/session storage.
- Environment config and production safety checks.
- API envelope/error mapping.
- Localization scaffold for Arabic/English strings.
- Privacy-aware telemetry/logging guardrails.

### Phase 2 - Account, Workspace, Profile

- Login, registration, email verification, forgot/reset password.
- Auth restoration and authenticated redirect flow.
- Invitation preview and acceptance entry.
- Workspace selection.
- Active workspace/organization context.
- Role permissions and enabled subscription modules.
- Access-denied UX for missing permissions or plan modules.
- Profile page, notification preferences, active session list, session revoke.
- Schedule page.

### Phase 3 - Student, Guardian, Marketplace

- Public course catalog and course details.
- Published academies/courses are consumed through backend marketplace APIs.
- Booking request form and booking success route.
- Student enrollments and course workspace entry.
- Lesson bookings: explore, reserve, cancel.
- Student attendance.
- Guardian-linked student attendance.
- Notification inbox and tap routing.
- Protected course content entry with view-session awareness.

### Phase 4A - Organization Operations

- Organization overview dashboard.
- Organization profile update.
- Bookings list and decision actions.
- Courses and batches list/create/edit/submit-review.
- Instructor profiles and availability slots.
- Rooms and room members.
- Members and invitations.
- Announcements create/edit/delete.
- Events and tasks.
- Content list/create/delete.
- Organization attendance: sessions, marks, lock, QR.
- Organization promotions.
- Organization analytics.
- Subscription status banner in workspace selection, Home, and organization
  overview.

### Phase 4B - Platform Operations

- Platform overview for platform-role users.
- Platform academy approvals: list, verify, reject with note.
- Platform category management: list, create, edit, active toggle, sort order,
  parent category, and guarded delete for unused categories.
- Platform course approvals: list, approve, reject with note.
- Platform promotion approvals: list, approve, reject with note and metrics.
- Platform routes are linked from Home for platform-role users.

### Phase 5 - Offline, Content, Deep Links

- Offline/device readiness summary in Profile reads backend metadata policies.
- Cache policy summary shows persistable datasets, memory-only datasets,
  optimistic writes, server-confirmed writes, purge triggers, and device limits.
- Signed content view sessions are surfaced as memory-only and never-persist
  protected.
- Notification inbox surfaces its backend cache policy, including TTL,
  storage, stale-while-revalidate behavior, offline readability, and optimistic
  read-state behavior.
- Secure content viewer surfaces signed URL expiry, memory-only protection,
  blocked downloads, watermark status, and a refresh action for expired view
  sessions.
- Profile readiness surfaces deep-link manifest version, route count, and
  auth-required route count from `/meta/deep-links`.
- Policy-aware offline cache store is implemented with tenant-aware keys,
  expiry metadata, stale status, and persistence guards that reject memory-only
  or never-persist datasets.
- Notification inbox writes successful responses to the approved offline cache
  and falls back to cached notifications when refresh fails.

### Phase 6 - Native Release Readiness

- Added native release readiness checklist with Flutter, Android, iOS, backend,
  QA, store, and approval gates.
- Installed local Flutter 3.44.8/Dart 3.12.2 under the user cache.
- Installed local PHP 8.3.33 and Composer 2.10.2 under the user cache.
- Generated `03-Mobile-App/android` and `03-Mobile-App/ios` platform folders.
- Added Android development/staging/production flavors and provisional package
  IDs.
- Enabled Android desugaring, compileSdk 36 overrides, and Java/Kotlin 17 build
  compatibility for current plugins.
- Updated `file_picker` to 10.3.3 and added `cupertino_icons`.
- `flutter analyze` passes.
- `flutter test` passes.
- Android release builds fail closed when production signing is not configured.
- The release workflow requires signing, HTTPS API, and Firebase secrets before
  generating an AAB or split APKs.
- Laravel `php artisan test` passes: 148 tests, 1009 assertions.
- Flutter `flutter test` passes: 12 tests.
- Profile certificates and invoices use authenticated backend records instead
  of fixed demo document numbers or amounts.

### Documentation and Verification

- Updated `03-Mobile-App/API_INTEGRATION_MAP.md`.
- Updated `03-Mobile-App/NAVIGATION.md`.
- Updated `03-Mobile-App/MOBILE_IMPLEMENTATION_PLAN.md`.
- Updated `docs/mobile-openapi.json`.
- Updated `scripts/validate-integration.mjs`.
- `pnpm test` passes with marketplace, production, and integration validation.

## In Progress

### Phase 4B - Finish Platform Operations

- Platform support/admin tools if product requires them in mobile.
- Platform audit logs.
- Platform OTP/security operations if required.
- Confirm whether web-only admin features should stay web-only.

## Remaining

### Phase 6 - Native Release Readiness

- Run iOS build where available on macOS.
- Configure iOS schemes/flavors, signing team, entitlements, associated domains,
  and push capabilities.
- Confirm final Android package IDs and iOS bundle identifiers with product.
- Configure the real Android upload keystore and protected CI secrets.
- Audit Android/iOS native project settings.
- Validate native screen-capture/download-blocking behavior where supported.
- Decide whether to replace the secure-storage cache implementation with Drift
  tables for higher-volume datasets after Flutter/native profiling.
- App icon, splash, permissions, package IDs, and store metadata.
- Internal QA pass on real devices.
- Privacy review.
- Release signing.
- Play internal testing and TestFlight readiness.

### Backend Verification Gates

- Verify mobile-facing endpoints against seed/demo data.
- Confirm platform moderation permissions with backend policies.

### Product Decisions Needed

- Decide whether subscription renewal should be native in-app or web checkout.
- Decide which platform admin screens are required on mobile.
- Decide how much offline behavior is required for first release.
- Decide final Arabic copy tone and whether all current English fallback strings
  should be fully translated before QA.

## Current Blockers

- iOS build and TestFlight validation require macOS/Xcode.
- Production Android signing is not configured yet; unsigned or debug-signed
  release builds are blocked by Gradle and CI.
- Final store package IDs, privacy URLs, screenshots, app icon, splash, and
  store copy are not approved.
- Real-device QA has not run.
- `file_picker` 10.3.3 currently emits a Flutter KGP compatibility warning;
  monitor or upgrade once a built-in-Kotlin compatible release is confirmed.

## Next Recommended Work Order

1. Confirm final platform/admin surfaces that are mobile-first.
2. Configure production Android signing and final package IDs.
3. Validate iOS project on macOS/Xcode and configure signing/entitlements.
4. Run real-device QA for auth, content protection, notifications, offline
   cache, deep links, and Arabic/English layout.
5. Do UI polish pass against the web design language and generated mobile
   mockup direction.
6. Prepare final store assets, privacy URLs, screenshots, and release approvals.
