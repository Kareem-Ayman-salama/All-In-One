# Authentication & Account QA Report

## Problems Found and Resolved

1. Authentication pages duplicated layout and hardcoded Arabic text.
   - Replaced with shared bilingual auth layout and reusable password/OTP controls.
2. Login redirected authenticated users to stale or unsafe paths.
   - Added role-safe routing and explicit invitation-return handling.
3. Logout could return to the previous dashboard.
   - It now clears local and session authentication and always routes to `/login`.
4. Remember-me did not work with API requests when session storage was used.
   - HTTP client now reads the token from the active local or session store.
5. OTP boxes lost earlier digits and blocked verification.
   - Replaced with a reliable six-digit, paste-friendly OTP input.
6. New personal accounts could become trapped without a workspace.
   - Added a clear no-workspace state, account switching, code entry, and invitation flow.
7. Accepting an invitation did not update tenant membership.
   - Added invitation acceptance service/context handling and role-home routing.
8. Password reset did not persist for seeded demo accounts.
   - Seeded accounts now receive a persisted override after password reset.
9. Profile updates disappeared after sign-out.
   - Mock account overrides now persist name and avatar updates.
10. Account settings were static controls with no active sections.
    - Added functional profile, security, notifications, appearance, and language sections.
11. Language switching changed document direction but left the account/sidebar placement incorrect.
    - Added explicit Arabic/right and English/left shell positioning and direction-aware settings navigation.
12. Mobile hid the sidebar without providing another navigation method.
    - Added an accessible slide-in navigation drawer and overlay.
13. Dark mode used blue/slate surfaces and inconsistent panels.
    - Unified body, shell, cards, settings, and auth surfaces around true black `#050505` and `#0b0b0b`.
14. Legal/footer links led to missing pages.
    - Added responsive privacy, terms, and support routes.
15. Several role dashboards stayed in one language after switching.
    - Localized the app shell and primary Tenant, Super Admin, and End User screen content.

## Verification Evidence

- Production build: passed with Vite.
- HTTP smoke test: all 18 public/auth/role routes returned `200`.
- Browser flow: personal registration -> email OTP -> no workspace -> invitation acceptance -> End User dashboard passed.
- Browser flow: logout -> forgot password -> reset password -> login with new password passed.
- Role routing: Super Admin, Tenant Admin, and End User demo accounts reached their correct dashboards.
- Responsive checks: `375px` mobile viewport had no horizontal overflow on login or account settings.
- Direction checks: English sidebar rendered on the left; Arabic sidebar rendered on the right.
- Dark mode check: body `rgb(5, 5, 5)`, panels `rgb(11, 11, 11)`.

## Backend Boundary

The frontend behavior and service boundaries are ready. Real email delivery, OTP expiry, refresh-token security, avatar storage, 2FA enrollment, and session revocation require the backend endpoints documented in `BACKEND_CONTRACTS.md`.
