# Mobile Analytics

Analytics must be privacy-conscious and disabled until the product owner
approves a provider and event policy.

## Implemented Foundation

- `lib/src/core/privacy/privacy_redactor.dart` redacts tokens, signed URLs,
  passwords, private file content, and sensitive student fields.
- `lib/src/core/telemetry/telemetry_service.dart` centralizes event tracking and
  error reporting behind `TelemetrySink`.
- Current tracked foundation events:
  - `loginSuccess`
  - `workspaceSelected`
  - `contentOpened`
- No Firebase Analytics package is enabled yet.

## Rules

- Do not send access tokens, refresh tokens, passwords, private content URLs,
  private file content, or unnecessary student form values.
- Use IDs, route names, roles, booleans, and coarse statuses instead of raw
  personal data.
- Signed protected-content URLs must always redact to `[REDACTED]`.
- Event payloads must pass through `PrivacyRedactor` before reaching any sink.

## Future Events

- Course viewed.
- Course search.
- Booking started.
- Booking submitted.
- Booking confirmed.
- Subscription renewal opened.
- Notification opened.

