# Mobile Flavors

The Flutter app uses Dart defines for environment-specific configuration. Native
Android/iOS flavor files still need to be generated once Flutter SDK is
available.

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

- Staging Android smoke build: `make -C mobile build-staging-apk`.
- Production Android candidate: `make -C mobile build-production-appbundle`.
- Staging iOS no-codesign build: `make -C mobile build-staging-ios`.
- Production iOS candidate: `make -C mobile build-production-ipa`.

Production candidates require the release approval gate in `RELEASE_GUIDE.md`
and `STORE_CHECKLIST.md`.
