# Firebase Setup

The app is wired to Firebase Core, Firebase Messaging, and Crashlytics, but
Firebase is disabled by default for local builds so the app can run without
project credentials.

## What is already implemented

- Optional Firebase initialization controlled by `AIN_ENABLE_FIREBASE`.
- Optional Crashlytics capture controlled by `AIN_ENABLE_CRASH_REPORTING`.
- FCM permission request after successful sign in/email verification.
- FCM token registration to the Laravel endpoint:
  `/api/v1/devices/push-tokens`.
- Android Gradle applies `google-services` and Crashlytics when a root or
  flavor-specific `google-services.json` exists.

## Current Firebase project

- Project name: `AIN All In One`
- Project ID: `ain-all-in-one`
- Project number: `837892248017`
- Android apps:
  - Development: `com.ain.ain_mobile.dev`
  - Staging: `com.ain.ain_mobile.staging`
  - Production: `com.ain.ain_mobile`

## Required Firebase Console steps

1. Keep the Android Firebase apps above registered in the project.
2. Keep the downloaded config files in the matching flavor folders:
   - `android/app/src/development/google-services.json`
   - `android/app/src/staging/google-services.json`
   - `android/app/src/production/google-services.json`
3. Enable Cloud Messaging and Crashlytics in Firebase Console.
4. Create a Firebase service account key for the backend sender.
5. Add these values to the backend `.env`:

```bash
PUSH_PROVIDER=fcm
FCM_PROJECT_ID=your-firebase-project-id
FCM_SERVICE_ACCOUNT_JSON_BASE64=base64-encoded-service-account-json
```

Keep the service account JSON out of Git. If you prefer a file on the server,
use `FCM_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json`
instead of the base64 value.

## Local APK commands

Emulator without Firebase:

```bash
make build-local-emulator-apk
```

Real device with Firebase, after replacing `LOCAL_DEVICE_API_URL` with the
computer LAN IP:

```bash
make build-local-device-firebase-apk LOCAL_DEVICE_API_URL=http://192.168.1.10:8000/api/v1
```

Direct verified Firebase build:

```bash
flutter build apk --flavor development \
  --dart-define=AIN_FLAVOR=development \
  --dart-define=AIN_API_BASE_URL=http://10.0.2.2:8000/api/v1 \
  --dart-define=AIN_ENABLE_FIREBASE=true \
  --dart-define=AIN_ENABLE_CRASH_REPORTING=false \
  --dart-define=AIN_ALLOW_MOCK_DATA=false
```

## Backend note

The backend stores FCM tokens and has an FCM v1 sender. Push dispatch stays
disabled until the real Firebase project id and service account are added and
`PUSH_PROVIDER` is changed from `disabled` to `fcm`.
