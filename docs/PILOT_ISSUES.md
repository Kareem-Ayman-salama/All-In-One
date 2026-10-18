# AIN Platform — Pilot Issues Log & Remediation Register

**Document Version:** 1.0.0 (Live Pilot Incident & Issue Tracking)  
**Status:** **ACTIVE / MONITORED**  
**Target Milestone:** First Real Pilot Academy (Al-Rowad STEM Academy)  
**Triage Policy:** P0 fixed immediately; P1 fixed before user expansion; P2 triaged/documented; P3 logged to backlog.

---

## 1. Issue Severity Classification

| Severity Level | Definition | SLA / Remediation Policy |
| :--- | :--- | :--- |
| **P0 — Critical** | Security vulnerability, data loss, tenant isolation leak, or entire system outage. | Stop pilot immediately. Fix & verify within 2 hours. |
| **P1 — Blocker** | Major core workflow blocked (e.g., owner cannot onboard, student cannot access room, grading fails). | Fix before onboarding additional pilot users. |
| **P2 — Usability** | Feature works but has UX friction, confusing error messages, or requires operational manual assistance. | Remediate in scheduled pilot sprint; maintain documented workaround. |
| **P3 — Cosmetic** | Visual misalignment, minor typo, or nice-to-have cosmetic enhancement. | Log in `docs/PILOT_FEEDBACK_BACKLOG.md`; do not disrupt pilot operations. |

---

## 2. Issues Log & Remediation Register

### Issue #001: Pilot Academy Owner Provisioning Unverified Email Lockout
- **Severity:** **P1 (Major Workflow Blocker)**
- **Component:** `AdminPilotAcademyController` / `User` Eloquent Model
- **Discovery Date:** 2026-10-18T17:30:19Z (Live Production Verification)
- **Symptom:**
  Super Admin successfully provisioned `Al-Rowad STEM Academy` via `POST /api/v1/admin/pilot-academies`. However, when attempting to log in as the newly created Academy Owner (`owner@alrowad-stem.edu.eg`), the API returned:
  ```json
  {"error":{"code":"EMAIL_NOT_VERIFIED","message":"Verify your email before signing in."}}
  ```
- **Root Cause Analysis:**
  The `User` model declares attribute protection using PHP 8 attributes:
  `#[Fillable(['name', 'email', 'password', 'locale', 'timezone', 'date_of_birth', 'is_minor'])]`.
  Columns `email_verified_at` and `status` are not in the fillable attribute list. Calling `User::query()->create(['status' => 'active', 'email_verified_at' => now()])` silently discarded these fields, leaving the owner in `status: pending_verification` and `email_verified_at: null`.
- **Remediation Implemented:**
  1. Updated `AdminPilotAcademyController::store()` to use `$owner->forceFill(['email_verified_at' => now(), 'status' => 'active'])->save()`.
  2. Implemented `AdminPilotAcademyController::setOwnerPassword()` with `forceFill` to allow Super Admin to set or reset pilot owner passwords directly and mark email verified.
  3. Registered route `POST /api/v1/admin/pilot-academies/{organization}/owner-password`.
- **Status:** **RESOLVED & VERIFIED IN PRODUCTION (Commit `ceb7194`)**

---

### Issue #002: Super Admin Administrative Lockout via Device Limit
- **Severity:** **P1 (Administrative Lockout)**
- **Component:** `AuthService::enforceDeviceLimit` / `UserSession`
- **Discovery Date:** 2026-10-18T17:44:04Z (Live Production Verification)
- **Symptom:**
  During automated API verification drills, `super@ain.test` was rejected on login with HTTP 403:
  ```json
  {"error":{"code":"DEVICE_LIMIT_REACHED","message":"Too many active devices. Revoke a device session and try again."}}
  ```
- **Root Cause Analysis:**
  `AuthService::enforceDeviceLimit` enforces `max_active_sessions_per_user` (8 sessions) strictly across all users, including platform Super Admins. When CLI or automation scripts log in without a persistent `installationId`, each login consumed a session slot until reaching 8, locking the platform administrator out of the entire platform.
- **Remediation Implemented:**
  Added automatic session pruning for `platform_role === 'super_admin'`:
  When a Super Admin logs in and active sessions $\ge 8$, the service automatically revokes the oldest active session (`orderBy('created_at')->limit(...)`), ensuring platform administration can never be locked out.
- **Status:** **RESOLVED & VERIFIED IN PRODUCTION (Commit `4af6147`)**

---

### Issue #003: Transactional Mailer Operates in Log Mode
- **Severity:** **P2 (Usability / Operational Workaround Active)**
- **Component:** Infrastructure Mailer (`/api/v1/health/otp`)
- **Discovery Date:** 2026-10-18T17:00:27Z (Pre-Launch Check)
- **Symptom:**
  Production `/api/v1/health/otp` reports `"mailer": "log"`, `"transactionalMail": false`.
  Outgoing invitation emails and password reset links are not delivered to external inboxes.
- **Impact Assessment:**
  Non-blocking for pilot execution because:
  1. Super Admin Pilot Provisioning returns the exact `onboardingUrl` and `invitationToken` directly in the API response.
  2. Super Admin can provide the direct onboarding link and initial password to the Academy Owner via WhatsApp / direct handover.
- **Workaround / Protocol:**
  Use direct token handover protocol documented in `docs/FIRST_PILOT_RUNBOOK.md`.
- **Target Resolution:**
  Inject production Brevo / SendGrid SMTP credentials into Railway environment variables.
- **Status:** **DOCUMENTED & MANAGED (Mode B Workaround Active)**

---

### Issue #004: Payment Gateway Operates in Mode B (Offline / Manual Active)
- **Severity:** **P2 (Operational Decision)**
- **Component:** Paymob Integration / Health Endpoint
- **Discovery Date:** 2026-10-18T16:59:00Z
- **Symptom:**
  Health endpoint reports `"payments": "not_configured"`.
- **Impact Assessment:**
  Intentional design decision for initial pilot phase. Al-Rowad STEM Academy collects student tuition via InstaPay / Bank Transfer / Cash.
- **Workaround / Protocol:**
  Academy Administrator confirms payments via audited manual activation (`/api/v1/organizations/{org}/bookings/{booking}/confirm` with `markAsPaid: true`).
- **Status:** **OPERATING AS DESIGNED (Mode B Active)**

---

### Issue #005: Student Verification When Transactional Mailer Operates in Log Mode
- **Severity:** **P1 (Operational Workflow Blocker)**
- **Component:** `AdminPilotAcademyController` / Student Onboarding
- **Discovery Date:** 2026-10-18T18:32:00Z (Live Pilot Student Provisioning)
- **Symptom:**
  When students self-register in production, their email verification code is written to the Railway log rather than dispatched to an external inbox. Students were left in `status: pending_verification` and unable to reserve bookings.
- **Root Cause Analysis:**
  Production email delivery requires verified third-party SMTP API credentials. In log mode, student accounts could not complete the email handshake autonomously.
- **Remediation Implemented:**
  Added `POST /api/v1/admin/pilot-academies/{organization}/students` allowing Super Admin to provision and pre-verify pilot student accounts directly with passwords and immediate active status.
- **Status:** **RESOLVED & VERIFIED IN PRODUCTION (Commit `81f77b1`)**

---

### Issue #006: Academy Onboarding Wizard Payment Step Not Recognizing Mode B Payments
- **Severity:** **P2 (Usability & Progress Tracking)**
- **Component:** `AcademyOnboardingController::wizard`
- **Discovery Date:** 2026-10-18T18:35:00Z
- **Symptom:**
  Even after an academy owner confirmed student bookings with audited manual InstaPay payments (`markAsPaid: true`), the Onboarding Wizard stalled at 87% because the `payment` step only evaluated `organization->payments()->where('status', 'paid')` or live Paymob credentials.
- **Root Cause Analysis:**
  Manual booking confirmations did not create records in the `payments` table, and the wizard check did not inspect `bookings.payment_status = 'paid'`.
- **Remediation Implemented:**
  1. Updated `BookingService::confirm` to generate an audited manual `Payment` record with `provider: 'manual'`, `amount_minor`, and `status: 'paid'` when `markAsPaid` is true.
  2. Updated `AcademyOnboardingController::wizard` to check `$organization->bookings()->where('payment_status', 'paid')->exists()`.
  3. Wizard reached 100% completion in live production.
- **Status:** **RESOLVED & VERIFIED IN PRODUCTION (Commit `81f77b1`)**

---

### Issue #007: Course Completion Evaluation Lacked HTTP API Entrypoint
- **Severity:** **P2 (Feature Gap / Integration)**
- **Component:** `CourseController` / `StudentController` / `routes/api.php`
- **Discovery Date:** 2026-10-18T18:40:00Z
- **Symptom:**
  `CourseCompletionService::evaluate` existed as an internal service, but neither students nor academy owners had an HTTP route to trigger progress evaluation and authoritative enrollment completion.
- **Remediation Implemented:**
  1. Added `POST /api/v1/student/enrollments/{enrollment}/evaluate` in `StudentController`.
  2. Added `POST /api/v1/organizations/{organization}/enrollments/{enrollment}/evaluate` in `CourseController`.
  3. Verified both endpoints evaluate milestones and authoritatively transition enrollments to `completed`.
- **Status:** **RESOLVED & VERIFIED IN PRODUCTION (Commit `81f77b1`)**

---

## 3. Summary Scorecard

| Total Issues Logged | P0 Critical | P1 Blocker | P2 Usability | P3 Cosmetic | Resolved | Active Workarounds |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **7** | 0 | 3 | 4 | 0 | **5** | **2** |

