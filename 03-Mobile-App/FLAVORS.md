# Mobile Flavors

The Flutter app uses Dart defines for environment-specific configuration.
Android native flavors are generated. iOS still needs Xcode-side scheme,
bundle identifier, and signing verification on macOS.

| Flavor | App label | API URL | Crash reporting | Mock data |
|---|---|---|---|---|
| development | AIN Dev | Local or dev API | Off by default | Must remain false unless a test explicitly overrides it |
| staging | AIN Staging | Staging API | On when Firebase staging exists | false |
| production | AIN | Production API over HTTPS | On when Firebase production exists | false |

## Required Dart Defines

- `AIN_FLAVOR`
- `AIN_API_BASE_URL`
- `AIN_ENABLE_CRASH_REPORTING`
- `AIN_ALLOW_MOCK_DATA`

Production validation is enforced in
`lib/src/app/configuration/app_environment.dart`.

## Build Targets

- Staging Android smoke build: `make -C 03-Mobile-App build-staging-apk`.
- Production Android candidate: `make -C 03-Mobile-App build-production-appbundle`.
- Staging iOS no-codesign build: `make -C 03-Mobile-App build-staging-ios`.
- Production iOS candidate: `make -C 03-Mobile-App build-production-ipa`.

Production candidates require the release approval gate in `RELEASE_GUIDE.md`
and `STORE_CHECKLIST.md`.

## Android Native IDs

- `development`: `com.ain.ain_mobile.dev`
- `staging`: `com.ain.ain_mobile.staging`
- `production`: `com.ain.ain_mobile`

The production ID is provisional until product confirms the final store package
name.
