# Known Limitations & Release Status

## Resolved Infrastructure & Security Milestones
- **Guardian Consent Registry (Completed)**: Full minor detection, guardian OTP consent verification, terms version snapshotting/hashing, and strict fail-closed action blocking implemented on purchases, discussions, and course bookings.
- **Fail-Closed Malware Scanning (Completed)**: ClamAV TCP daemon integration with real-time stream scanning, EICAR test verification, and automated quarantine for suspicious assets.
- **Real Staging Environment (Completed)**: Multi-container staging stack defined via `docker-compose.staging.yml` (PostgreSQL 16, Redis 7, MinIO private S3, Mailpit SMTP, ClamAV, backend API, queue worker) with automated diagnostic CLI verification (`staging:verify-infrastructure`).
- **Backup & Observability (Completed)**: Automated database backups with GZIP level 9 compression, SHA-256 integrity hashing, restore rehearsal command (`backup:rehearsal`), Sentry error tracking with strict PII scrubbing, and structured JSON logging.
- **Electronic Payments & Reconciliation (Completed)**: Full Paymob integration with fail-closed production checks, SHA-512 HMAC webhook verification, duplicate/replay attack prevention, partial/full refund management, automated rehearsal command (`payments:rehearse-webhook`), and daily financial reconciliation (`payments:reconcile`).
- **Android Production Signing & CI/CD (Completed)**: Release signing configuration via `key.properties`, dedicated release pipeline in `.github/workflows/mobile-release.yml` (with secret-isolated `KEYSTORE_BASE64` and manual/tag gating), static validation pipeline in `.github/workflows/mobile-ci.yml`, automated keystore generator scripts, and App Links / deep link intent filters.

## Current Build and Product Coverage
- **Flutter SDK**: Local verification uses Flutter 3.44.8 and Dart 3.12.2; CI and release workflows must remain pinned to the same stable toolchain.
- **Native `android/` and `ios/` folders**: Both native projects are generated and checked in. Android production signing and iOS archive signing still require real release credentials.
- **Route and Home navigation guards**: The mobile router enforces authentication, organization membership, permission, and subscription-module guards; remaining gaps are release-environment and device validation gaps.
- **Course, batch, room**: Student and organization route contracts cover these resources and their permission-guarded actions; full acceptance still requires staging API and real-device verification.
- **Remaining detailed organization action gaps**: iOS schemes/signing, Firebase production files, store metadata, and physical-device regression coverage remain before public store release.

## Remaining Items for Public Store Release
- iOS archive and TestFlight upload still require a physical/cloud macOS machine with Xcode 15+ and Apple Developer account certificates.
- Physical device testing checklist (see `MOBILE_RELEASE_GUIDE.md`) to be executed across various Android & iOS models.
- Production Firebase project credentials (`google-services.json` and `GoogleService-Info.plist`) to be supplied for live push notifications.
- Store metadata, screenshots, and final privacy policy URLs to be finalized for Google Play and Apple App Store submissions.
