# AIN Platform — Pilot Feedback & Feature Backlog

**Document Version:** 1.0.0 (Pilot Phase Scope Control)  
**Status:** **ACTIVE / CONTROLLED SCOPE**  
**Guideline Rule:** To protect the stability of the first real pilot academy launch, no non-essential features are implemented mid-flight. All non-blocking requests, enhancements, and secondary feature proposals are recorded in this backlog for post-pilot prioritization.

---

## 1. Scope Control Policy

During the live pilot of **Al-Rowad STEM Academy**:
- **P0 / P1 Blocker Issues:** Remediated immediately (security, data loss, workflow stoppage).
- **P2 Usability Improvements:** Documented, triaged, and bundled into scheduled maintenance releases.
- **P3 Cosmetic & Enhancements:** Logged in this backlog; development deferred until pilot exit criteria are satisfied.

---

## 2. Categorized Feature Backlog

### Category A: Video & Real-Time Communications
| Feature Request | Description | Proposed Priority | Target Release |
| :--- | :--- | :--- | :--- |
| **Native In-App Video Calling** | WebRTC / Mediasoup embedded video rooms replacing third-party Zoom/Google Meet links. | Low (Pilot works via external meeting links) | v2.0 Post-Pilot |
| **Automated Video Transcoding** | Multiple bitrates (1080p, 720p, 480p) via asynchronous FFmpeg worker pipeline. | Medium | v1.2 Phase |
| **Dynamic Video Watermarking** | Moving timestamp + viewer IP floating overlay across playback canvas. | Medium (Canvas overlay currently functional) | v1.2 Phase |

### Category B: AI & Learning Automation
| Feature Request | Description | Proposed Priority | Target Release |
| :--- | :--- | :--- | :--- |
| **AI Quiz Question Generator** | Gemini API integration to generate MCQ / True-False questions from uploaded PDF lectures. | Low (Manual quiz creation works smoothly) | v2.0 Post-Pilot |
| **AI Lesson Summarizer** | Automatic Arabic & English key takeaways generator for recorded sessions. | Low | v2.1 |
| **Automated Code Submission Checker** | Python/C++ sandbox execution for embedded systems code grading. | Medium | v2.0 |

### Category C: Mobile Experience & Offline Learning
| Feature Request | Description | Proposed Priority | Target Release |
| :--- | :--- | :--- | :--- |
| **Mobile Push Notifications** | Native iOS APNs & Android FCM push notifications for upcoming sessions and graded tasks. | Medium | v1.2 Mobile Pass |
| **Offline Lesson DRM Download** | Encrypted local storage playback inside Flutter mobile app. | Low | v2.2 |

### Category D: Advanced Gamification & Engagement
| Feature Request | Description | Proposed Priority | Target Release |
| :--- | :--- | :--- | :--- |
| **Student Badges & Leaderboards** | XP points for on-time homework submission and 100% attendance streaks. | Low (Non-essential for academic workflow) | v2.1 |
| **Certificate Social Sharing** | One-click share to LinkedIn Certifications with metadata preview tags. | Medium | v1.1 Post-Pilot |

### Category E: Advanced CRM & Commerce
| Feature Request | Description | Proposed Priority | Target Release |
| :--- | :--- | :--- | :--- |
| **Automated WhatsApp Reminders** | WhatsApp Cloud API triggers for session reminders and fee collection alerts. | Medium | v1.2 |
| **Discount Code Engine** | Percentage and fixed-minor promotional coupon codes with usage quotas. | Medium | v1.1 |
| **Installment Payment Plans** | Multi-part milestone payment schedules for high-tuition academy courses. | Medium | v1.2 |

---

## 3. Feedback Intake Protocol

Feedback from pilot academy participants (Owners, Instructors, Students, Guardians) is captured using the standard feedback format:
- **Role:** `[Owner | Instructor | Student | Guardian | Support]`
- **Page / Component:** URL or UI view
- **Issue Type:** `[Bug | Confusing UX | Missing Feature | Performance | Content Problem | Suggestion]`
- **Severity:** `[P0 | P1 | P2 | P3]`
- **Client Details:** Device, OS, Browser
- **Recorded Date:** ISO-8601 Timestamp
