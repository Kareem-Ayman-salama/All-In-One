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
- Android Gradle applies `google-services` and Crashlytics only when
  `android/app/google-services.json` exists.

## Required Firebase Console steps

1. Create or open a Firebase project.
2. Add Android apps for the package IDs:
   - `com.ain.ain_mobile.dev`
   - `com.ain.ain_mobile.staging`
   - `com.ain.ain_mobile`
3. Download the matching `google-services.json`.
4. Put it here:
   `mobile/android/app/google-services.json`
5. Enable Cloud Messaging and Crashlytics in Firebase Console.
6. Create a Firebase service account key for the backend sender.
7. Add these values to the backend `.env`:

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

## Backend note

The backend stores FCM tokens and has an FCM v1 sender. Push dispatch stays
disabled until the real Firebase project id and service account are added and
`PUSH_PROVIDER` is changed from `disabled` to `fcm`.
