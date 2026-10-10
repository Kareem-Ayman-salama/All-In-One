# AIN Platform — Pre-Client QA & Compliance Checklist
*Staging E2E Testing, RBAC Matrix, Tenant Isolation, Load Testing, and Bilingual Verification*

---

## 1. Automated Pre-Client Readiness Audit

Run the automated verification suite before deploying any build to pilot academies or production:

```bash
php artisan qa:pre-client-audit
```

This automated command audits:
1. **Bilingual Parity**: Validates that all error codes in `config/api_errors.php` have complete, polite, and user-facing copy in both Modern Standard Arabic (`messageAr`) and English (`messageEn`).
2. **Multi-Tenant Isolation**: Proves that tenant memberships and data boundaries strictly prevent leakage between competing academies.
3. **Guardian Consent & Minor Protection**: Verifies that unconsented minors are blocked with `403 GUARDIAN_CONSENT_REQUIRED` across financial checkout, classroom discussions, and course bookings.
4. **Payment Gateway Integrity**: Verifies SHA-512 HMAC checksum calculations, replay attack rejection, and amount mismatch detection.
5. **GDPR / Privacy Compliance**: Verifies the account deletion queue, data retention purge schedules, and complete JSON personal data export.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Feature / Resource | Super Admin | Org Owner | Org Admin | Instructor | Student | Guardian |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Platform Administration | **Yes** | No | No | No | No | No |
| Organization Billing & Subscription | **Yes** | **Yes** | **Yes** | No | No | No |
| Issue Payment Refunds | **Yes** | **Yes** | **Yes** | No | No | No |
| Course Creation & Publishing | **Yes** | **Yes** | **Yes** | Assigned only | No | No |
| Room Content Upload & Quarantine | **Yes** | **Yes** | **Yes** | Assigned only | No | No |
| View Financial Reconciliation | **Yes** | **Yes** | **Yes** | No | No | No |
| View Minor Progress & Attendance | No | **Yes** | **Yes** | Assigned only | Self only | Linked Minors |
| Approve Guardian Consent OTP | No | No | No | No | No | **Yes** |
| Download Personal Data (GDPR) | Self | Self | Self | Self | Self | Self |
| Request Account Deletion | Self | Self | Self | Self | Self | Self |

---

## 3. Multi-Tenant Data Isolation Test

To manually verify isolation between two academies on Staging:

1. Create test user `teacher.alpha@example.com` in Academy Alpha.
2. Attempt to query Academy Beta's context:
   ```http
   GET /api/v1/organizations/{ACADEMY_BETA_UUID}/context
   Authorization: Bearer <ALPHA_TOKEN>
   ```
   **Expected Response**: `403 Forbidden` (`error.code: TENANT_ACCESS_DENIED`).
3. Attempt to fetch private content item belonging to Academy Beta:
   ```http
   GET /api/v1/content/{ACADEMY_BETA_ITEM_UUID}/download
   Authorization: Bearer <ALPHA_TOKEN>
   ```
   **Expected Response**: `403 Forbidden` or `404 Not Found`.

---

## 4. Performance & Load Testing with k6

The load test simulates 50 to 100 concurrent virtual users hitting the public course catalog, search, and health endpoints.

### Prerequisites:
Install [k6](https://k6.io/docs/get-started/installation/):
```powershell
winget install k6 --source winget
```

### Running the Test:
```powershell
cd 02-Backend-API/tests/Load
.\run-load-test.ps1 -BaseUrl "http://staging.ainplatform.com/api/v1" -Vus "50" -Duration "2m"
```

### SLA Targets:
- **p95 Latency**: < 500 ms under 100 concurrent users.
- **Error Rate**: < 0.1% HTTP 5xx responses.
- **Database CPU**: < 60% on PostgreSQL 16.
- **Redis Response**: < 5 ms for cached session checks.

---

## 5. Accessibility (a11y) & RTL Verification

1. **Arabic Font & RTL Rendering**:
   - Ensure `dir="rtl"` is applied dynamically to the root HTML and Flutter text directions.
   - Verify Arabic numbers and dates format using standard Arabic locale (`ar-EG`).
   - Check that navigation chevrons and back buttons flip directions appropriately.
2. **Color Contrast**:
   - Primary buttons (`#0F172A` on `#FFFFFF` or `#2563EB` on `#FFFFFF`) must exceed **4.5:1** contrast ratio.
3. **Touch Targets**:
   - All interactive controls on mobile and touchscreens must measure at least **48x48 dp**.
4. **Screen Reader (TalkBack / VoiceOver)**:
   - Form inputs have associated labels.
   - Modal dialogs trap focus and announce dismiss actions.

---

## 6. Privacy, Deletion, and Data Export Test

1. **Personal Data Export**:
   ```http
   GET /api/v1/privacy/export
   Authorization: Bearer <STUDENT_TOKEN>
   ```
   Verify returned JSON includes user profile, enrollments, bookings, and payments, with sensitive secrets (passwords, tokens, idempotency keys) completely scrubbed.

2. **Account Deletion Lifecycle**:
   ```http
   POST /api/v1/privacy/request-deletion
   Authorization: Bearer <STUDENT_TOKEN>
   ```
   - Verifies 14-day grace period is scheduled.
   - Running `php artisan privacy:process-deletions` after the grace period anonymizes personal data, purges active sessions, and revokes tokens.
