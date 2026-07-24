# Mobile Environment Setup

## Prerequisites

- Flutter stable SDK.
- Android Studio or command-line Android SDK.
- Xcode on macOS for iOS validation.
- Firebase projects for staging and production before push/crash reporting can
  be enabled.

## First Setup

```powershell
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter analyze
flutter test
```

## API Configuration

Use `--dart-define` values for every run/build. Do not commit secrets or real
Firebase service files until the release process defines their storage and
rotation policy.

Development example:

```powershell
flutter run --dart-define=AIN_FLAVOR=development --dart-define=AIN_API_BASE_URL=http://localhost:8000/api/v1
```

Staging example:

```powershell
flutter run --flavor staging --dart-define=AIN_FLAVOR=staging --dart-define=AIN_API_BASE_URL=https://staging-api.example.com/api/v1
```

Production builds must use HTTPS and must not enable mock data.

