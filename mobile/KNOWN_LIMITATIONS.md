# Known Limitations

- Flutter SDK, Dart SDK, PHP, Android tooling, and iOS tooling are not available
  in the current Codex environment, so mobile/native builds and Laravel tests
  remain unverified here.
- Native `android/` and `ios/` folders are not generated/audited yet.
- Registration, password reset, email verification, invitation acceptance,
  organization management, instructor workflows, subscriptions, file uploads,
  and full schedule/profile screens still need implementation.
- Drift cache schema is not implemented yet.
- Firebase project files are not configured.
- Local notification foreground/background handling requires native validation.
- Permission-level route guards need to be expanded beyond authentication
  guards.
- Store metadata and privacy declarations need product/legal approval.
