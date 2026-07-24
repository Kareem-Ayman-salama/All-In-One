# Mobile Localization

The app is Arabic-first and supports English LTR. The current scaffold uses a
manual `AppStrings` delegate until Flutter code generation is available.

## Implemented

- `lib/src/app/localization/app_locale_controller.dart` defaults to Arabic.
- `lib/src/app/localization/app_strings.dart` contains Arabic and English
  strings for the current scaffold screens.
- `MaterialApp.router` registers Arabic and English locales plus Flutter
  material, cupertino, and widget localization delegates.
- Login, workspace selection, home, and placeholder screens read user-facing
  scaffold text from `AppStrings`.

## Rules

- New user-facing strings must go through localization resources.
- Arabic copy is the primary source for product-critical screens.
- Keep route IDs, API codes, environment variable names, and backend enum values
  untranslated.
- Validate RTL for navigation, forms, buttons, errors, phone numbers, URLs,
  prices, dates, and mixed Arabic/English text.

## Next Step

Replace the manual delegate with generated ARB files after Flutter SDK is
available, then run `flutter gen-l10n`, `flutter analyze`, and RTL widget tests.

