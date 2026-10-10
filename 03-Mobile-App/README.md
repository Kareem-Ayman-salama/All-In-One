# منصة عين | AIN Platform Mobile Application

Flutter mobile companion for **منصة عين (AIN Platform)**, an enterprise multi-tenant academy, course marketplace, and learning management system connected directly to the Laravel REST API backend (`02-Backend-API`) and mirroring the web portal (`01-Frontend-Web`).

---

## Brand Identity & Design System

- **Official Brand Name**: منصة عين | AIN Platform
- **Primary Color Palette**:
  - `AinColors.brand` = `#16458F` (Deep Ain Navy Blue)
  - `AinColors.brandDark` = `#0D2D64` (Dark Navy)
  - `AinColors.brandSoft` = `#EEF4FF` (Soft Light Blue Tint)
  - `AinColors.canvas` = `#F4F7FC` (Subtle Clean Canvas)
  - `AinColors.teal` = `#0F766E`, `AinColors.cyan` = `#0284C7`
- **Branding Assets**:
  - Official high-resolution logo: `assets/branding/ain-logo.png`
  - App Icon: `assets/branding/app_icon.png` (Adaptive background `#16458F`)
  - Native Splash: `assets/branding/splash_logo.png` (Background `#16458F`)

---

## Core Capabilities

### 1. Dual Localization (العربية / English)
- Fully localized with Modern Standard Arabic and English (`AppStrings`).
- Instant in-app language toggle via `appLocaleControllerProvider` with dynamic RTL / LTR layout mirroring.
- Persisted user language preference synced with student profile.

### 2. Access Controls & Digital Watermarking
- High-performance `AinWatermarkOverlay` widget powered by custom canvas rendering.
- Renders repeating diagonal semi-transparent security watermarks with student name, masked email, device ID, and timestamp over video and protected document viewers.
- Preserves full touch interactivity using `IgnorePointer`.
- Watermarking and device binding are deterrence and traceability controls; they are not a guarantee against screenshots, external cameras, or content extraction.

### 3. Marketplace & Payment Gateway Integration
- Interactive course catalog with real-time search, category filtering, and batch seat tracking.
- Course booking flow with payment method selection:
  - Credit / Debit Card (`card`)
  - Mobile Wallet (`wallet` - Vodafone Cash, Orange Cash, etc.)
  - Cash on Delivery (`cash`)
- Direct handoff to secure Paymob payment checkout URL from `BookingSuccessPage`.

### 4. Account & Security Controls (Profile Page)
- **Account Header**: Initials avatar, role and email-verification state, and a copyable real account identifier.
- **Device Binding (1 Student = 1 Device)**: Displays device records returned by the API and provides a reviewed device-replacement request flow. No synthetic device, IP, location, or fingerprint data is shown.
- **Login Verification**: The current backend can request an email verification code during login. WhatsApp, SMS, and authenticator-app enrollment are not implemented in this release.
- **Password Strength Analyzer**: Real-time 4-segment visual feedback meter with color coding (Weak, Fair, Good, Robust).
- **Personal Information**: Optional phone, academic bio, city/location, timezone, and language preferences backed by profile data.
- **UI Personalization & Video Streaming**: Light / Dark / System themes, 6 curated brand accent colors, streaming quality defaults (1080p, 720p, 480p Saver), and interactive sound chimes.
- **Guardian & Family Hub**: Real-time sync of attendance, quiz grades, and emergency contact with registered guardian.
- **Emergency Session Kill Switch**: One-tap revocation of all other active sessions and tokens across all platforms.

### 5. Device Binding & Session Security
- User session tracking with remote revocation of other active sessions.
- Push device token management (`DevicePushTokenController` & `deviceRepositoryProvider`).
- Organization member device auditing and approval controls.

---

## High-Fidelity UI Screenshots

High-fidelity preview mockups matching the implemented Flutter widgets are saved in `previews/screenshots/new-design/`:
- `01-login-screen.jpg`: Login screen with Ain logo, remember me, biometrics, and new student registration.
- `02-course-catalog.jpg`: Course explorer with horizontal category chips, live badges, star ratings, and EGP prices.
- `03-booking-payment.jpg`: Course booking checkout with payment method cards (Card, Wallets, Fawry), coupon code, and secure CTA.
- `04-drm-workspace.jpg`: Preview of a watermarked course workspace. Treat the image as design reference where offline download is not enabled by the API.
- `05-academy-dashboard.jpg`: Organization administration dashboard with 4 prominent KPI cards and operational items.

---

## Build & Test Commands

Use direct Flutter commands on developer workstations or CI/CD runners with Flutter installed:

```powershell
# 1. Install dependencies
flutter pub get

# 2. Format & Analyze
dart format --set-exit-if-changed .
flutter analyze

# 3. Run Unit Tests
flutter test

# 4. Build Staging APK
flutter build apk --flavor staging --dart-define=AIN_FLAVOR=staging --dart-define=AIN_API_BASE_URL=https://staging-api.ainplatform.com/api/v1

# 5. Build Production Android App Bundle
flutter build appbundle --flavor production --dart-define=AIN_FLAVOR=production --dart-define=AIN_API_BASE_URL=https://api.ainplatform.com/api/v1

# 6. Build Production iOS IPA
flutter build ipa --flavor production --dart-define=AIN_FLAVOR=production --dart-define=AIN_API_BASE_URL=https://api.ainplatform.com/api/v1

# 7. CI Pipeline
make -C 03-Mobile-App ci
```

> **Release Policy**: Production pipeline builds must not automatically release artifacts to app stores without manual human review and sign-off.

---

## Security & Release Guard

- `AppEnvironment.validate()` automatically rejects production builds that use insecure HTTP endpoints or enable mock data. Production builds must use HTTPS API URLs and cannot enable mock data.
- All tokens are stored in hardware-backed secure storage via `flutter_secure_storage`.
- Requests automatically carry `X-Request-ID`, `X-AIN-Client`, `X-AIN-Platform`, and device metadata headers.
