# AIN Platform — First Real Pilot Academy Runbook

**Document Version:** 1.0.0 (Pilot Execution Phase)  
**Pilot Status:** **PILOT IN PROGRESS**  
**Production Platform:** `https://all-in-one-production-7c60.up.railway.app`  
**Production API Base:** `https://intuitive-vision-production-fbfa.up.railway.app/api/v1`  
**Target Pilot Institution:** **Al-Rowad STEM Academy (أكاديمية الرواد للعلوم والتكنولوجيا)**  
**Organization UUID:** `01a14ffa-681a-70ff-b0d1-bb9ca978f11a`  
**Organization Slug:** `al-rowad-stem-academy`  

---

## 1. Pilot Mission & Objective

This runbook serves as the single source of truth for executing the live pilot launch of **Al-Rowad STEM Academy** on the AIN Platform. The primary objective is to operate one real academy through the complete educational and business lifecycle:

```
[Super Admin] ──> Provisions Academy Workspace & Trial Subscription
      │
      ▼
[Academy Owner] ─> Completes Profile, Configures Settings, Invites Faculty
      │
      ▼
[Instructor] ────> Configures Course Curriculum, Live Room, Assignments, Quizzes
      │
      ▼
[Students] ──────> Enrolls via Audited Manual/InstaPay Workflow
      │
      ▼
[Learning] ──────> Lessons + Live Sessions + Attendance QR + Lab Submissions
      │
      ▼
[Graduation] ────> Authoritative Completion Engine -> Verifiable Certificate
```

---

## 2. Participant & Identity Roster

| Role | Name | Email | Initial Status | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Platform Admin | `super@ain.test` | Active | Platform-wide infrastructure, plans, audits |
| **Academy Owner** | Eng. Tamer Al-Rowad | `owner@alrowad-stem.edu.eg` | Provisioned | Full administrative control of Al-Rowad Academy |
| **Lead Instructor** | Dr. Karim Robotics | `dr.karim@alrowad-stem.edu.eg` | Invited | Course management, grading, attendance, live rooms |
| **Pilot Student 1** | Youssef Tarek | `youssef@alrowad-stem.edu.eg` | Enrolled | Active learning, labs, quizzes, certificate recipient |
| **Pilot Student 2** | Salma Mahmoud | `salma@alrowad-stem.edu.eg` | Enrolled | Active learning, labs, quizzes, attendance audits |
| **Pilot Student 3** | Omar Khaled | `omar@alrowad-stem.edu.eg` | Enrolled | Incomplete baseline tester (progress validation) |

---

## 3. Pre-Flight Operational Decisions

### 3.1 Payment Strategy: Mode B (Audited Manual Payment)
Because live Paymob production merchant credentials are not yet injected into production secrets, the pilot operates under **Mode B (Pilot Without Online Payment)**:
- Students book courses and batches online through the marketplace.
- Payment is executed via **InstaPay** or cash at the academy front desk.
- Academy Administrator confirms payment via audited manual activation (`/api/v1/organizations/{org}/bookings/{booking}/confirm` with `markAsPaid: true`).
- Records: Admin ID, Student ID, Amount Minor, Payment Method (`instapay` / `cash`), Reference Number, Timestamp, Notes.
- **Strict Rule:** No simulated Paymob webhooks in production.

### 3.2 Storage Strategy: Local Protected Storage
- Production storage is configured via protected local disk with signed streaming sessions.
- Private learning materials (starter code, safe PDF lab manuals, slide decks) are uploaded under tenant-segregated paths.
- Third-party unlisted video streams (YouTube/Vimeo private embed) used for video masterclasses.

---

## 4. Course Curriculum Blueprint

### Course: مقدمة في الروبوتات والأنظمة المدمجة (Embedded Systems & Robotics)
- **Category:** STEM & Engineering
- **Level:** Beginner to Intermediate
- **Price:** 1,500 EGP (150,000 Minor Units)
- **Delivery Mode:** Blended (Online Interactive Room + Live Lab Sessions)
- **Duration:** 6 Weeks (12 Sessions)

### Authoritative Completion Policy Configuration:
```json
{
  "require_lessons_completion": true,
  "minimum_lesson_completion_percentage": 85,
  "require_assignments": true,
  "require_all_required_assignments": true,
  "require_quizzes": true,
  "minimum_quiz_score": 60,
  "require_attendance": true,
  "minimum_attendance_percentage": 70,
  "certificate_enabled": true
}
```

---

## 5. Step-by-Step Pilot Execution Runbook

### Phase 1: Provisioning & Initial Handover (Completed)
1. Super Admin executed `POST /api/v1/admin/pilot-academies`:
   - Name: `Al-Rowad STEM Academy`
   - Plan: `growth` (60 Days Trial, 300 Students, 15 Rooms, 10 GB Storage)
   - Organization UUID: `01a14ffa-681a-70ff-b0d1-bb9ca978f11a`
   - Invitation Token generated and recorded.

### Phase 2: Academy Branding & Onboarding Wizard
1. Academy Owner accesses dashboard at:
   `https://all-in-one-production-7c60.up.railway.app/app/al-rowad-stem-academy/dashboard`
2. Completes Organization Profile via `PUT /api/v1/organizations/{org}/academy-profile`:
   - Public Name (AR): `أكاديمية الرواد للعلوم والتكنولوجيا`
   - Description: `بوابة التعليم التكنولوجي الرائدة للأنظمة المدمجة والذكاء الاصطناعي والروبوتات في مصر.`
   - Phone: `+201002233445`
   - Support Email: `support@alrowad-stem.edu.eg`
   - Currency: `EGP`, Timezone: `Africa/Cairo`
   - Certificate Branding: Configured with official academy title.

### Phase 3: Faculty Onboarding (Instructor)
1. Academy Owner invites Dr. Karim via `POST /api/v1/organizations/{org}/invitations`:
   - Email: `dr.karim@alrowad-stem.edu.eg`, Role: `instructor`.
2. Instructor profile created with Bio: `دكتوراه في هندسة الروبوتات والمتحكمات الدقيقة`.

### Phase 4: Course, Batch & Room Creation
1. Owner creates course: `Embedded Systems & Robotics` with custom completion policy override.
2. Creates Course Batch: `Batch 1 - Fall 2026`:
   - Schedule: Sunday & Wednesday, 18:00 - 20:00 Cairo Time.
   - Capacity: 25 students.
3. Provisions Digital Classroom Room: `Robotics Lab Core`:
   - Linked to Batch 1.
   - Modules active: Lessons, Files, Discussions, Assignments, Quizzes, Attendance.

### Phase 5: Student Booking & Audited Offline Payment
1. Students submit booking requests for Batch 1.
2. Academy Admin validates InstaPay receipt transfer reference.
3. Executes `POST /api/v1/organizations/{org}/bookings/{booking}/confirm`:
   - `markAsPaid: true`
   - `paymentMethod: 'instapay'`
   - `reference: 'INSTA-20261018-9841'`
4. System automatically activates `CourseEnrollment` and grants room membership.

### Phase 6: Content Delivery & Download Security
1. Instructor uploads Lab Manual 1 (`GPIO_Programming_Guide.pdf`).
2. Publishes Lecture 1 video.
3. Students stream content; verify video progress tracker records completion percentage.

### Phase 7: Live Session & Dynamic QR Attendance
1. Instructor schedules `Live Session 1: Introduction to Microcontrollers` with Zoom/Meet link.
2. At session start, Instructor generates dynamic QR token (`POST /learning-sessions/{session}/attendance/qr`).
3. Students scan QR within 30-second TTL window.
4. Attendance registered as `present`. Duplicate scans and expired tokens rejected.

### Phase 8: Lab Assignment & Instructor Grading
1. Instructor publishes `Assignment 1: GPIO Driver Implementation` (Max score: 100).
2. Students submit code zip archive before due date.
3. Instructor inspects submission, enters Grade `95/100` and Feedback: `Excellent code modularity and clean register manipulation`.

### Phase 9: Automated Examination (Quiz)
1. Instructor publishes `Robotics Fundamentals Quiz` (Passing threshold: 60%, Duration: 30m).
2. Student completes MCQ & True/False questions.
3. System auto-grades submission; score: `85%`.
4. Correct answers remain hidden during active attempts.

### Phase 10: Progress Audit & Completion Evaluation
1. Student views Progress page:
   - Lessons: 95% (Required: 85%) -> PASSED
   - Attendance: 100% (Required: 70%) -> PASSED
   - Assignment: 1/1 Submitted & Graded (95) -> PASSED
   - Quiz: 85% (Required: 60%) -> PASSED
2. Server-side `CourseCompletionService` evaluates status.
3. `CourseEnrollment::status` authoritatively transitions to `completed`.

### Phase 11: Certificate Generation & Public Verification
1. Academy Administrator generates official certificate for completed student.
2. Certificate receives unique verification code (`CERT-XXXX-XXXX`).
3. External visitor scans QR code or queries `/api/v1/public/certificates/verify/{code}`:
   - Valid: `true`
   - Student Name: `Youssef Tarek`
   - Academy: `Al-Rowad STEM Academy`
   - Grade: Masked (Privacy Protected by Default)
   - Student Email/Phone: Excluded from public payload.
4. Revocation Test: Admin revokes certificate with reason; verification immediately returns `valid: false, status: 'revoked'`.

---

## 6. Pilot Governance & Daily Checks

The Academy Owner monitors daily metrics using the built-in Academy Analytics & Onboarding Scorecard:
- Daily active student logins
- Video completion rates
- Attendance percentages
- Pending assignment submissions
- Device approval requests
