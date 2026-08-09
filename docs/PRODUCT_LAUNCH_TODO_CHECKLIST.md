# AIN Product Launch Checklist

Last updated: 2026-08-09

Use this file as the working checklist before launching the first public product trial.

Legend:
- `[x]` Done
- `[~]` Partially done / needs completion
- `[ ]` Not done

## 1. Current Foundation

- [x] Separate project folders for web frontend, backend API, mobile app, docs, releases, and archive.
- [x] Backend authentication is the single source of truth.
- [x] Email + password login.
- [x] Email verification flow.
- [x] Password reset flow.
- [x] Workspaces / organizations / tenants.
- [x] Roles and permissions.
- [x] Rooms.
- [x] Backend + frontend room messages.
- [x] Courses and course batches.
- [x] Public course marketplace endpoints.
- [x] Demo accounts and demo marketplace seed data.
- [x] Mobile API integration for login, courses, workspaces, and organization features.
- [x] Android development APK build.
- [~] Firebase code wiring for push notifications.
- [~] Content access logs.
- [~] Watermark display in mobile content viewer.
- [x] User sessions and session revoke.

## 2. Phase 1 - Product Trial Must-Haves

### 2.0 Landing Page and Market Message

- [x] Rewrite landing page to clearly explain what AIN does.
- [x] Position AIN for academies, training centers, and teachers.
- [x] Add clear first-screen message: publish, sell, and protect courses.
- [x] Add one-month free trial offer.
- [x] Add simple explanation of workspace, courses, rooms, students, and protected content.
- [x] Add anti-leakage section explaining realistic protection.
- [x] Add trial lead form that opens WhatsApp with structured details.
- [x] Add real lead capture backend endpoint instead of WhatsApp-only handoff.
- [ ] Add screenshots from the actual dashboard to the landing page.
- [ ] Add short demo video when the product flow is stable.
- [ ] Add clearer landing links to marketplace, company setup, and course demo flows.
- [ ] Run landing page user test with 3 academy/teacher prospects.
- [ ] Update landing copy after user feedback.

### 2.1 YouTube Video Content

- [x] Add backend fields for YouTube video content if missing:
  - `content_type`
  - `video_provider`
  - `external_video_id`
  - `external_url_encrypted`
  - `allow_fullscreen`
  - `display_order`
- [x] Add YouTube URL parser service.
- [x] Validate supported YouTube URL formats.
- [x] Store only the provider and video ID, not raw public links.
- [x] Add backend endpoint to create YouTube video content.
- [ ] Add backend endpoint to update video settings.
- [x] Add admin UI to paste YouTube link.
- [x] Add admin UI to select room/course.
- [ ] Add admin UI to set availability date.
- [x] Add admin UI to enable/disable fullscreen.
- [x] Add admin UI to enable/disable watermark.
- [ ] Add admin UI to order videos inside a room/course.
- [ ] Add mobile admin support for adding video links, if needed for pilot.

### 2.2 Secure Playback

- [~] Add playback endpoint for content:
  - validates auth
  - validates organization membership
  - validates room/course access
  - validates active subscription/trial
  - validates device policy
  - validates session policy
  - returns short-lived playback configuration
- [x] Do not allow playback by only knowing `content_id`.
- [x] Add short-lived viewer session expiration.
- [x] Add frontend secure video viewer.
- [ ] Add mobile secure video viewer.
- [x] Render YouTube embedded player without showing a raw YouTube link in UI.
- [x] Hide or disable download actions when `download_allowed = false`.
- [x] Return `403 DOWNLOAD_DISABLED` from backend download endpoints.
- [x] Add friendly UI for blocked playback reasons.

### 2.3 Dynamic Watermark

- [x] Add backend watermark config in playback response.
- [x] Include student name.
- [x] Include masked email or masked phone.
- [x] Include user ID or short user reference.
- [x] Include date/time.
- [x] Include short session ID.
- [x] Move watermark position every few seconds.
- [x] Keep watermark above video player.
- [x] Keep watermark visible during playback.
- [x] Make watermark hard to crop by changing position.
- [x] Add web implementation.
- [ ] Complete mobile implementation.
- [x] Add tests for watermark payload.

### 2.4 Anti-Leakage Controls

- [x] Disable right click on video playback pages in web.
- [x] Disable text selection on playback pages.
- [x] Disable drag/save behavior for video area and thumbnails.
- [x] Block common shortcuts on playback pages:
  - `Ctrl+S`
  - `Ctrl+U`
  - `Ctrl+Shift+I`
  - `F12`
  - `Ctrl+P`
- [x] Add CSS protections:
  - `user-select: none`
  - `-webkit-user-drag: none`
  - protected overlay layer
- [x] Add warning toast when blocked action is attempted.
- [x] Log blocked right-click attempts.
- [x] Log blocked shortcut attempts.
- [x] Prevent direct backend content download when disabled.
- [x] Prevent unsigned content access.
- [x] Add rate limiting on playback/session endpoints.
- [ ] Add suspicious IP/device change detection.
- [ ] Add admin alert flag for repeated blocked actions.

Important note: browser protections are deterrents, not guaranteed protection. Watermark, device policy, sessions, and logs are the real protection layers.

### 2.5 Device Policy

- [x] Add `user_devices` table if current session table is not enough.
- [x] Store:
  - `user_id`
  - `organization_id`
  - `device_hash`
  - `device_name`
  - `browser`
  - `operating_system`
  - `first_seen_at`
  - `last_seen_at`
  - `last_ip`
  - `status`
  - `approved_at`
  - `revoked_at`
- [ ] Generate stable device fingerprint on web.
- [ ] Generate stable installation ID on mobile.
- [x] Register first device automatically or as pending, based on organization settings.
- [x] Enforce one approved device per student for the first public trial.
- [x] Block or require approval for new device.
- [x] Add admin device list for each member.
- [x] Add approve device action.
- [x] Add block device action.
- [x] Add revoke device action.
- [ ] Add student page showing current registered device.
- [ ] Add request device change flow.

### 2.6 Session Policy

- [x] List active sessions.
- [x] Revoke sessions.
- [x] Enforce max active sessions per student.
- [ ] Default product-trial policy: one active session.
- [x] Link sessions to approved device.
- [ ] Block concurrent student login when policy requires it.
- [x] Add admin revoke all member sessions.
- [x] Add logout all endpoint.
- [x] Log session revoked event.
- [ ] Log concurrent session blocked event.

### 2.7 Security Logs

- [x] Content access logs table exists.
- [x] Normalize security event names:
  - `login_success`
  - `login_failed`
  - `new_device_detected`
  - `device_approved`
  - `device_blocked`
  - `device_revoked`
  - `concurrent_session_blocked`
  - `content_opened`
  - `video_started`
  - `video_progress`
  - `video_completed`
  - `download_blocked`
  - `right_click_blocked`
  - `shortcut_blocked`
  - `session_revoked`
  - `suspicious_ip_change`
- [x] Add backend logger service.
- [ ] Log auth events.
- [x] Log device events.
- [x] Log playback events.
- [x] Log download block events.
- [x] Add admin security logs page.
- [~] Add filters by member, event type, date, IP, content.
- [ ] Add CSV export after pilot, if needed.

### 2.8 Trial Plans and Limits

- [~] Plans and subscriptions exist.
- [ ] Add explicit trial plan.
- [x] Set default trial duration to one month.
- [x] Show one-month free trial in plan/subscription UI.
- [~] Add editable plan limits:
  - max rooms
  - max members
  - max videos
  - max storage MB
  - device policy enabled
  - security logs enabled
  - analytics enabled
- [ ] Enforce max rooms.
- [ ] Enforce max members.
- [x] Enforce max videos.
- [x] Add plan usage endpoint.
- [x] Add plan usage UI for organization admin.
- [x] Add trial status and trial end date.
- [ ] Add super admin trial settings.

### 2.9 Manual Subscription Activation

- [x] Subscription model exists.
- [x] Add payment proof upload or payment proof note.
- [x] Add subscription activation request.
- [x] Add super admin subscription approval page.
- [x] Add approve subscription action.
- [x] Add reject subscription action with reason.
- [x] Add workspace suspension/activation controls.
- [x] Add audit log for subscription changes.
- [x] Keep payment gateway out of the first public trial.

## 3. Phase 2 - After First Pilot Feedback

- [ ] Email OTP for new device approval.
- [ ] Email OTP for changing password.
- [ ] Email OTP for changing email.
- [ ] Email OTP for sensitive admin actions.
- [ ] Device change request workflow.
- [ ] Login alerts by email.
- [ ] Video progress tracking.
- [ ] Resume video from last watched position.
- [ ] Instructor analytics.
- [ ] Course/room engagement analytics.
- [ ] Export security logs.
- [ ] Improve watermark movement patterns.
- [ ] Improve suspicious account-sharing detection.
- [ ] Add admin notifications for suspicious activity.
- [ ] Add better Arabic copy across all screens.
- [ ] Add onboarding screens for academy/company admins.

## 4. Phase 3 - Paid / Scale Stage

- [ ] Buy production domain.
- [ ] Move backend to stable paid hosting.
- [ ] Configure production SMTP/domain authentication.
- [ ] Add private video hosting.
- [ ] Add signed video URLs.
- [ ] Evaluate Cloudflare R2 or video streaming provider.
- [ ] Add SMS OTP if business requires it.
- [ ] Add WhatsApp OTP if business requires it.
- [ ] Add payment gateway.
- [ ] Add advanced analytics.
- [ ] Add stronger monitoring and error tracking.
- [ ] Add automated backups.
- [ ] Add production incident runbook.

## 5. Free / Almost Free Infrastructure

### Recommended Pilot Stack

- [ ] Frontend hosting: Cloudflare Pages free.
- [ ] Backend hosting: Koyeb free or Render free.
- [ ] Database: Neon Postgres free or Supabase Postgres free.
- [ ] Video hosting: YouTube Unlisted.
- [ ] Email / OTP: Brevo free plan.
- [ ] Push notifications: Firebase Cloud Messaging free.
- [ ] File storage: avoid in the first public trial where possible.
- [ ] Payment: manual transfer outside the app for pilot.

### Deployment Tasks

- [x] Convert local SQLite config to production Postgres config.
- [x] Add production `.env` template.
- [x] Add CORS config for deployed frontend domain.
- [x] Add backend health check endpoint to hosting config.
- [x] Add Laravel queue strategy for free hosting.
- [x] Use sync queue for transactional emails if no worker is available.
- [ ] Run migrations on hosted database.
- [ ] Seed initial super admin.
- [ ] Deploy frontend.
- [ ] Deploy backend.
- [ ] Test mobile APK against hosted API.
- [ ] Build APK using hosted API URL.

## 6. Firebase Tasks

- [~] Firebase code is wired in mobile app.
- [ ] Create Firebase project.
- [ ] Add Android app package IDs:
  - `com.ain.ain_mobile.dev`
  - `com.ain.ain_mobile.staging`
  - `com.ain.ain_mobile`
- [ ] Download `google-services.json`.
- [ ] Place it in `03-Mobile-App/android/app/google-services.json`.
- [ ] Build APK with `AIN_ENABLE_FIREBASE=true`.
- [ ] Test FCM token registration.
- [ ] Test notification delivery to one device.
- [ ] Add notification templates for:
  - invitation
  - announcement
  - booking confirmation
  - session reminder
  - suspicious login warning

## 7. Web Frontend Tasks

- [x] Add YouTube video creation form.
- [ ] Add video security settings form.
- [x] Add secure video player page.
- [x] Add moving watermark overlay.
- [x] Add right-click blocking on playback page.
- [x] Add shortcut blocking on playback page.
- [x] Add member devices page.
- [x] Add active sessions page for admins.
- [x] Add security logs page.
- [x] Add plan usage page.
- [ ] Add trial limits page for super admin.
- [ ] Add subscription approval page for super admin.
- [ ] Add suspicious activity page.
- [ ] Add polished empty/error/loading states.
- [ ] Add responsive checks for mobile web.

## 8. Mobile App Tasks

- [x] Android APK can be built.
- [ ] Rebuild APK against hosted API.
- [ ] Enable Firebase after config file is added.
- [ ] Add secure YouTube video playback.
- [ ] Complete moving watermark overlay.
- [ ] Show registered device status.
- [ ] Add request device change screen.
- [ ] Show blocked playback messages clearly.
- [ ] Record video start/progress/complete events.
- [ ] Test on real Android device.
- [ ] Build split APKs per ABI to reduce APK size.
- [ ] Prepare production signing key later.
- [ ] Keep iOS parked until Android pilot is validated.

## 9. Backend API Tasks

- [x] Add YouTube video content endpoint.
- [~] Add playback config endpoint.
- [ ] Add video event endpoints:
  - start
  - progress
  - complete
- [x] Add device register endpoint.
- [x] Add device approve/block/revoke endpoints.
- [x] Add member devices endpoint.
- [x] Add admin member sessions endpoint.
- [x] Add revoke all member sessions endpoint.
- [x] Add security logs endpoint.
- [ ] Add security logs export endpoint later.
- [x] Add plan limits enforcement middleware/service.
- [ ] Add manual subscription approval endpoints.
- [ ] Add Email OTP service.
- [ ] Add tests for all tenant/role boundaries.
- [ ] Add tests for playback authorization.
- [x] Add tests for device/session enforcement.
- [x] Add tests for trial limits.

## 10. Anti-Leakage Definition

AIN should not promise perfect content protection. The promise should be:

- [ ] Make casual sharing harder.
- [ ] Make account sharing harder.
- [ ] Make leaked screen recordings traceable to the student.
- [ ] Give admins visibility into suspicious activity.
- [ ] Avoid expensive private video infrastructure until there is market validation.

## 11. Market Launch Definition of Done

- [ ] Admin can create workspace.
- [ ] Admin can invite students.
- [ ] Admin can create room/course.
- [ ] Admin can add YouTube video.
- [ ] Student can open only assigned room/course content.
- [ ] Student from another organization cannot access content.
- [ ] Non-member cannot access content.
- [ ] Playback shows dynamic watermark.
- [ ] One student account cannot be used on two devices at the same time.
- [ ] Admin can see and revoke member devices.
- [ ] Download disabled content returns `403`.
- [ ] Security logs show successful and blocked actions.
- [ ] Trial limits are enforced.
- [ ] Super admin can activate subscription manually.
- [ ] Frontend is deployed.
- [ ] Backend is deployed.
- [ ] Database is hosted.
- [ ] Email verification works from hosted environment.
- [ ] Android APK works against hosted API.
- [ ] First pilot academy/school can use the system without developer intervention.

## 12. Not In First Public Trial

- [ ] Private video storage.
- [ ] Guaranteed screenshot prevention.
- [ ] Camera monitoring.
- [ ] Eye tracking.
- [ ] Exam proctoring.
- [ ] SMS OTP.
- [ ] WhatsApp OTP.
- [ ] Payment gateway.
- [ ] Advanced AI features.
- [ ] Supabase Auth migration.
- [ ] Microservices.
- [ ] Large paid storage.
- [ ] Full iOS release.
