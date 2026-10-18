# AIN Platform — Security & Authorization Audit Report

**Audit Date:** October 18, 2026  
**Auditor:** Antigravity Advanced Agentic Security Team  
**Focus Areas:** Authentication, RBAC, Role Escalation Defense, Payment Integrity, Anti-Cheat, and Content Protection  
**Classification:** Confirmed & Hardened

---

## 1. Executive Summary

A comprehensive security audit of the AIN Platform codebase was conducted to verify that all authorization boundaries are enforced authoritatively on the server. The architecture treats the frontend client (Web React SPA & Mobile Flutter app) as an untrusted environment. Under this zero-trust model, all state changes, role assignments, payment statuses, and content unlocks are validated in the backend API (`02-Backend-API`).

Key Security Findings:
- **Zero Role Escalation via Public Registration:** The registration endpoint validates only `name`, `email`, and `password`. Any `role` or `is_admin` fields in query parameters or request bodies are discarded.
- **Strict Anti-Cheat Engine:** Quiz endpoints strictly filter out `correct_answer` and `explanation` from student payloads before submission.
- **Tamper-Resistant Payment Processing:** Client-sent `status = 'paid'` is impossible; only server-verified HMAC webhooks can confirm payments.
- **Authoritative Certificate Issuance:** Certificates require `courses.update` permission and server-side enrollment records. Public QR verification exposes zero PII.
- **Dynamic Content Watermarking:** Server-generated watermarks embed authenticated student metadata across all protected materials.

---

## 2. Role Security & Escalation Defense (P0 Verification)

### Threat Vector: Query Parameter Role Spoofing (`/register?role=...`)
Public marketing and landing page buttons may link to registration with intent indicators, such as `/register?role=instructor` or `/register?role=academy`.
If poorly implemented, attackers can forge requests such as:
```http
POST /api/v1/auth/register?role=super_admin HTTP/1.1
Content-Type: application/json

{
  "name": "Attacker",
  "email": "attacker@evil.com",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "role": "super_admin",
  "is_admin": true,
  "platform_role": "super_admin"
}
```

### Server-Side Defense Implementation
In `02-Backend-API/app/Http/Requests/Auth/RegisterRequest.php`:
```php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'min:2', 'max:120'],
        'email' => [
            'required',
            'email:rfc',
            'max:255',
            new Unique('users', 'normalized_email'),
        ],
        'password' => [
            'required',
            'confirmed',
            Password::min(10)->mixedCase()->numbers(),
        ],
    ];
}
```
In `AuthController::register`:
```php
$result = $this->auth->register($request->validated());
```
Only `$request->validated()` is forwarded to `AuthService::register()`. Any parameters outside `name`, `email`, and `password` are stripped. Furthermore, `AuthService::register()` hardcodes:
```php
$user = User::query()->create([
    'name' => trim($data['name']),
    'email' => $data['email'],
    'password' => $data['password'],
    'status' => 'pending_verification',
]);
```
**Conclusion:** A self-registered user is created strictly with `status = 'pending_verification'` and zero roles. Elevated roles (`super_admin`, `organization_owner`, `instructor`) can only be assigned through:
1. `OrganizationService::create` (creates an Organization and sets the caller as `owner` within that specific tenant).
2. `InvitationController::accept` (requires a valid, unexpired, cryptographic invitation token created by an organization admin).
3. Super Admin CLI / database seeding scripts.

---

## 3. Super Admin Provisioning & Surface Audit

### Threat Vector: Unauthorized Platform Control
Super Admins have platform-wide access, including suspending academies, editing system-wide plans, and inspecting cross-tenant metrics.

### Server-Side Defense Implementation
1. **No Public Endpoint:** There is no API route that allows creating a Super Admin.
2. **Access Middleware:** Platform admin routes under `/api/v1/admin/*` are guarded by the `platform.role:super_admin` middleware:
```php
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'platform.role:super_admin'])
    ->group(function () {
        Route::get('/overview', [AdminPlatformController::class, 'overview']);
        Route::post('/organizations/{id}/suspend', [AdminPlatformController::class, 'suspendOrganization']);
        Route::post('/plans', [AdminPlatformController::class, 'storePlan']);
    });
```
3. **MFA Verification:** High-risk actions (e.g., suspending an organization or modifying pricing models) require re-authentication or step-up MFA verification. Non-super admin requests are halted with `403 Forbidden` (`PLATFORM_ACCESS_DENIED`).

---

## 4. Authentication Lifecycle & Credential Security

| Component | Security Invariant | Code Location | Status |
| :--- | :--- | :--- | :--- |
| **Password Policy** | Minimum 10 characters, mixed case (uppercase + lowercase), at least one numerical digit. | `RegisterRequest.php:39` | ✅ Enforced |
| **Password Hashing** | Uses Bcrypt / Argon2ID via Laravel `Hash::make()`. Passwords never stored in plaintext. | `User.php` casts | ✅ Enforced |
| **Access Tokens** | Laravel Sanctum personal access tokens with 2-hour expiration. | `config/sanctum.php` | ✅ Enforced |
| **Refresh Tokens** | Cryptographically secure tokens stored in `user_sessions`, returned in `HttpOnly`, `Secure`, `SameSite=Lax` cookies. | `AuthController.php:58` | ✅ Enforced |
| **Email Verification** | 6-digit numeric OTP generated via `random_int`, hashed, and expired after 15 minutes. Maximum 5 failed attempts allowed. | `VerificationCodeService.php` | ✅ Enforced |
| **Session Invalidation** | Logging out or changing password instantly revokes all active Sanctum tokens and session records. | `AuthService::logout` | ✅ Enforced |

---

## 5. Anti-Cheat Engine in Quizzes & Assessments

### Threat Vector: Inspecting API Responses for Correct Answers
In naive implementations, frontend quiz applications receive questions including `correct_answer`, hiding it with CSS or client JavaScript. Any student inspecting network traffic in DevTools can easily extract the answer key.

### Server-Side Defense Implementation
In `02-Backend-API/app/Http/Controllers/Api/V1/QuizController.php`:
```php
public function studentShow(Request $request, string $id): JsonResponse
{
    $quiz = Quiz::query()->findOrFail($id);
    
    // Select ONLY student-safe fields — correct_answer is deliberately EXCLUDED
    $questions = $quiz->questions()
        ->select(['id', 'quiz_id', 'question_text', 'question_text_ar', 'type', 'options', 'points', 'order'])
        ->orderBy('order')
        ->get();

    return ApiResponse::success($request, [
        'id' => $quiz->id,
        'title' => $quiz->title,
        'title_ar' => $quiz->title_ar,
        'durationMinutes' => $quiz->duration_minutes,
        'passingScore' => $quiz->passing_score,
        'questions' => $questions,
    ]);
}
```
- The `correct_answer` column is never sent over the wire before submission.
- Upon submission via `POST /api/v1/student/quizzes/{id}/attempt`, the student transmits only `[question_id => selected_key]`.
- The server loads the authoritative `correct_answer` from PostgreSQL, compares the responses, calculates the score, and stores the attempt record.
- If `attempt_count >= max_attempts`, subsequent submissions are blocked with `422 MAX_ATTEMPTS_REACHED`.

---

## 6. Payment Processing & Webhook Integrity

### Threat Vector: Client-Side Amount Tampering & Status Spoofing
Attackers often attempt to:
1. Modify the price parameter in the request payload to `0.01 EGP`.
2. Post directly to `/bookings/{id}/confirm` sending `{"status": "paid"}` without paying.
3. Replay valid Paymob webhook payloads to unlock multiple courses.

### Server-Side Defense Implementation
1. **Server-Calculated Amounts:** The payment amount is never taken from the frontend. In `PaymentController::initiate`, the price is looked up directly from `Course::findOrFail($courseId)->price`.
2. **HMAC Webhook Verification:** Paymob transaction callbacks are verified using HMAC SHA512 against the secret configured in `config('services.paymob.hmac_secret')`. If the signature fails, the webhook returns `400 Bad Request` and no access is granted.
3. **Idempotency & Replay Protection:** Webhook transaction IDs are recorded in `payment_webhook_events`. If a transaction ID is re-submitted, the server responds with HTTP 200 to acknowledge receipt but skips execution, preventing duplicate balance credits.
4. **Production Lockout on Simulation:** Test payment simulations (`markAsPaid: true`) are strictly disabled in production environments (`if (app()->isProduction()) throw new ApiException('PAYMENT_SIMULATION_DISABLED', ...)`) unless authorized by an authenticated owner in manual reconciliation mode.

---

## 7. Dynamic Watermarking & Private Content Protection

### 1. Watermark Architecture
To prevent educational leaks and unauthorized recordings:
- When a student streams video or views a lesson document, the backend supplies a watermark context derived from the authenticated request:
  - Student Full Name (`$user->name`)
  - Masked Student ID (`USR-****-` + last 4 chars)
  - Client IP Address (`$request->ip()`)
  - Generation Timestamp (`now()->toIso8601String()`)
- The frontend renders this dynamic layer using SVG/Canvas, floating and cycling across the playback container. The client cannot configure or falsify these watermark values.

### 2. Temporary Signed URLs
- Lesson media stored on S3/MinIO is never exposed through persistent public links.
- Calling `GET /api/v1/rooms/{room}/contents/{id}/url` checks active room membership and returns an AWS S3 / MinIO pre-signed URL valid for **5 minutes only**.
- Direct bucket access is set to private (`BlockPublicAcls = true`).

### 3. YouTube Unlisted Honest Security Positioning
The platform supports YouTube Unlisted video integration for academies preferring low-cost hosting.
- **Access Gating:** The iframe embed parameters are served only to students with active room enrollments.
- **Watermarking:** The dynamic floating watermark overlays the YouTube player container.
- **Documentation Notice:** Unlisted YouTube links do not offer hardware-level DRM. Academies requiring strict anti-download DRM are guided to use the platform's native S3 HLS segmented streaming with signed token authentication.

---

## 8. Rate Limiting Matrix

The following rate limits are enforced across all public and authenticated endpoints:

| Endpoint Group | Route Middleware | Limit | Rationale |
| :--- | :--- | :--- | :--- |
| **Authentication** | `throttle:auth` | 5 requests / minute per IP | Prevents brute-forcing user passwords. |
| **Email OTP Verification** | `throttle:otp` | 3 attempts / 5 minutes | Prevents automated OTP guessing attacks. |
| **Public Marketplaces** | `throttle:60,1` | 60 requests / minute | Protects course catalog against scraping. |
| **Invitations Preview** | `throttle:30,1` | 30 requests / minute | Blocks token scanning and brute-force guessing. |
| **QR Attendance Scan** | `throttle:60,1` | 60 requests / minute | Protects check-in sessions from replay floods. |
| **Signed Content URLs** | `throttle:120,1` | 120 requests / minute | Prevents mass URL harvesting. |
| **Certificate Verification**| `throttle:60,1` | 60 requests / minute | Prevents automated credential enumeration. |

---

## 9. Certificate Fraud Prevention

- **Student Generation Block:** The certificate issuance endpoint (`POST /api/v1/organizations/{org}/certificates`) is protected by the `permission:courses.update` middleware. Regular students calling this endpoint receive `403 Forbidden`.
- **Enrollment Verification:** In `CertificateController::generate`, the server verifies that the student is actually enrolled in the course. Upon generation, the student's `CourseEnrollment` record is authoritatively updated to `status = 'completed'`.
- **Public QR Verification:** The verification endpoint (`GET /api/v1/public/certificates/verify/{code}`) queries by a unique 10-character code (`CERT-XXXX-YYYY`) and returns only public-safe fields (Student Name, Course Title, Issuing Academy, Grade Score, Issue Date). Private identifiers (email, phone, student ID) are completely excluded.
