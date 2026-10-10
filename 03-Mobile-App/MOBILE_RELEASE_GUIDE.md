# AIN Mobile App — Production Release & Device Testing Guide
*Android Signing, GitHub Actions CI/CD, iOS TestFlight, FCM Push Notifications, and Deep Linking*

---

## 1. Android Production Release Pipeline

### Step 1: Generate Release Keystore
Run the generation script (do this once on a secure workstation):

**On Linux/macOS:**
```bash
cd 03-Mobile-App
chmod +x scripts/generate-release-keystore.sh
./scripts/generate-release-keystore.sh
```

**On Windows PowerShell:**
```powershell
cd 03-Mobile-App
.\scripts\generate-release-keystore.ps1
```

The script generates:
- `android/upload-keystore.jks` (RSA 4096-bit, 25-year validity).
- `android/upload-keystore.jks.base64` (Base64 encoded string for GitHub Secrets).
- `android/key.properties` (Local configuration for development test builds).

> [!CAUTION]
> Never commit `upload-keystore.jks` or `key.properties` to version control. They are already added to `.gitignore`. Keep an encrypted offline backup of the keystore file.

---

### Step 2: Configure GitHub Repository Secrets
Navigate to **GitHub Repository -> Settings -> Secrets and variables -> Actions** and add these required secrets:

| Secret Name | Value Description |
| :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | The entire base64 string from `upload-keystore.jks.base64` |
| `ANDROID_KEY_ALIAS` | `upload` (or your chosen alias) |
| `ANDROID_KEY_PASSWORD` | Password for the key entry |
| `ANDROID_STORE_PASSWORD` | Password for the keystore file |
| `PRODUCTION_API_BASE_URL` | Final HTTPS API base URL, including `/api/v1` |
| `ANDROID_GOOGLE_SERVICES_JSON_BASE64` | Base64-encoded production `google-services.json` |

---

### Step 3: Automated Build via GitHub Actions
The production release workflow runs on version tags or an explicit manual trigger. It:
1. Stops immediately if signing, HTTPS API, or Firebase secrets are missing.
2. Decodes the keystore and production Firebase configuration from secrets.
3. Compiles the **Android App Bundle (`.aab`)** and split APKs.
4. Publishes short-lived artifacts under the workflow run summary for review.

---

## 2. Google Play Console Deployment

1. Log in to [Google Play Console](https://play.google.com/console).
2. Create or select application: **AIN Platform** (`com.ain.ain_mobile`).
3. Set up **Play App Signing**:
   - Google manages the app signing key; you upload using the upload key generated in Step 1.
4. Navigate to **Testing -> Closed testing** (or Internal testing).
5. Create a new release and upload the signed `.aab` file from GitHub Actions (`ain-mobile-production-aab.zip`).
6. Complete store listing requirements:
   - Target audience (Family / Students & Minors policy declarations).
   - Data safety questionnaire (encryption in transit, personal info collection, deletion request mechanism).
   - App permissions declaration (`POST_NOTIFICATIONS`, `INTERNET`).
7. Distribute to internal beta testers for device validation.

---

## 3. iOS TestFlight Release Workflow

Apple requires building on a macOS machine with Xcode 15+:

### Step 1: Apple Developer Portal Setup
1. Register App ID: `com.ain.ainMobile` on [developer.apple.com](https://developer.apple.com/).
2. Enable capabilities:
   - **Associated Domains** (for Universal Links: `applinks:app.ainplatform.com`).
   - **Push Notifications** (APNs).
3. Create App Store Distribution Certificate and App Store Provisioning Profile.

### Step 2: Build & Archive in Xcode
```bash
cd 03-Mobile-App
flutter pub get
cd ios
pod install
open Runner.xcworkspace
```

1. In Xcode, select target **Runner -> Signing & Capabilities**.
2. Select your Apple Developer Team and ensure provisioning profile is valid.
3. Select generic device: **Any iOS Device (arm64)**.
4. Menu: **Product -> Archive**.
5. Once build completes in the Organizer window, click **Distribute App -> App Store Connect -> Upload**.

### Step 3: TestFlight Distribution
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Go to **TestFlight**.
3. Add internal testing group (immediate availability) and external testing group (requires Apple beta review).

---

## 4. Push Notifications & Firebase Setup

AIN Mobile uses Firebase Cloud Messaging (FCM) for push notifications:

1. **Android Setup**:
   - Download `google-services.json` from Firebase Console.
   - Place in `03-Mobile-App/android/app/src/production/google-services.json`.
2. **iOS Setup**:
   - Download `GoogleService-Info.plist` from Firebase Console.
   - Place in `03-Mobile-App/ios/Runner/GoogleService-Info.plist`.
   - Upload APNs Auth Key (`.p8`) to Firebase Project Settings -> Cloud Messaging.
3. **Backend Service Account**:
   - Provide Firebase service account credentials to backend API via `FCM_SERVICE_ACCOUNT_PATH` or `FCM_SERVICE_ACCOUNT_JSON_BASE64`.

---

## 5. Deep Linking Verification (App Links & Universal Links)

### Android Digital Asset Links:
The domain `https://app.ainplatform.com/.well-known/assetlinks.json` must serve:
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.ain.ain_mobile",
      "sha256_cert_fingerprints": [
        "YOUR_RELEASE_KEYSTORE_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

### iOS Apple App Site Association:
The domain `https://app.ainplatform.com/.well-known/apple-app-site-association` must serve:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.ain.ainMobile",
        "paths": ["/courses/*", "/bookings/*", "/notifications/*"]
      }
    ]
  }
}
```

### Supported Routes:
- `https://app.ainplatform.com/courses/:slug` -> Opens Course Details screen.
- `https://app.ainplatform.com/bookings/:id` -> Opens Booking Status screen.
- `ain://notifications?id=XYZ` -> Opens Notification Inbox item.

---

## 6. Real-Device Acceptance Testing Checklist

Before submitting for public store review, complete this checklist on physical devices (Android 11+, iOS 16+):

- [ ] **RTL & Arabic Layout**: Verify all widgets, margins, icons, and text alignments reverse naturally in Arabic locale (`ar-EG`).
- [ ] **Screen Sizes**: Test on compact phone (5.5"), standard phone (6.7"), and tablet form factors.
- [ ] **Push Notification Wakeup**:
  - [ ] Foreground notification banner received and tap navigates correctly.
  - [ ] Background notification tap brings app to foreground and routes to target screen.
  - [ ] Terminated/killed app notification tap cold-boots app and routes to target screen.
- [ ] **Deep Link Navigation**: Tap link in SMS/Email/WhatsApp; app launches directly into target course or booking.
- [ ] **Offline / Flaky Network**: App gracefully indicates offline state without crashing; cached content renders.
- [ ] **Minor Consent Action Block**: Minor accounts cannot initiate checkout or room chats until guardian approves.
- [ ] **Session Expiry & Biometrics**: Expired token cleanly presents login without UI lockups.
