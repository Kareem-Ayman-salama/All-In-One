# Mobile Threat Model

## Scope

This model covers the Flutter app, Laravel API integration, local storage,
tenant switching, push notifications, deep links, protected content viewing,
and release configuration.

## Assets

| Asset | Risk | Current Control |
|---|---|---|
| Access and refresh tokens | Theft, replay, debug leakage | Secure storage, centralized auth interceptor, redaction. |
| Signed content URLs | Copying, logging, stale access | View-session endpoint, memory-only viewer state, audit events. |
| Tenant data | Cross-workspace leakage | Tenant cache keys require organization ID where scoped. |
| Student data | Crash/log exposure | `PrivacyRedactor` before telemetry/crash sinks. |
| Push payloads | Sensitive data in notification text | Backend push contract avoids private body data. |
| Deep links | Malicious route injection | Links resolve through `/meta/deep-links`. |

## Threats And Mitigations

| Threat | Mitigation | Status |
|---|---|---|
| Token theft from plain storage | Use `FlutterSecureStorage`. | Implemented foundation. |
| Multiple refresh races | Single `TokenRefreshCoordinator`. | Implemented foundation. |
| Cross-tenant cached records | Organization-aware cache keys. | Implemented foundation; needs tests. |
| Malicious deep link | Backend manifest validation. | Implemented foundation; needs tests. |
| Signed URL leakage | Redaction and memory-only viewer state. | Implemented foundation. |
| Screenshot capture | Platform secure screen policy. | Documented, platform implementation pending. |
| Cleartext production traffic | Production HTTPS validation. | Implemented in Dart; native Android guard pending. |
| Rooted or jailbroken devices | Risk-based warnings and reduced trust. | Pending product decision. |
| Reverse engineering | Obfuscation in release pipeline. | Pending native build validation. |
| Build secret exposure | No real secrets committed. | Requires CI secret scan. |

## Staging Exit Requirements

- Add Flutter tests for token refresh, redaction, deep-link rejection, and
  tenant cache keys.
- Add Android network security config for production cleartext denial.
- Review iOS file protection and associated domains.
- Run release builds with obfuscation strategy documented.
