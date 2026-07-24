# Security and Tenancy Report

## Implemented Controls

- Every protected tenant route resolves an active organization membership.
- Tenant IDs from route/body data are never sufficient authorization.
- Platform roles and organization permissions are separated.
- Suspended organizations and expired subscriptions are blocked.
- Student course-room access is checked live against enrollment and student
  subscription dates, independent of scheduler timing.
- Access tokens expire and are paired with rotating refresh sessions.
- Refresh reuse revokes all sessions; password changes revoke all sessions.
- Super admins require email OTP MFA.
- Verification codes are hashed, expire, persist failed attempts, and lock
  after the configured maximum.
- Booking creation is idempotent; confirmation is transactional and locks the
  booking and batch.
- Uploads are private and checked by extension, MIME, and magic signature.
- Logs include request IDs but exclude request bodies, tokens, and raw job
  exception messages.
- CORS, HTTPS cookie, PostgreSQL, Redis, S3, mail, and logging requirements are
  enforced by production preflight.

## Tested Abuse Cases

- Cross-organization access denial.
- Disabled user with a previously issued token.
- Reused refresh token.
- Old access token after refresh rotation.
- Session revocation isolation between users.
- Expired organization subscription.
- Hidden suspended/expired academy.
- Last-seat booking and duplicate idempotency key.
- Expired student subscription with active room membership.
- OTP brute-force attempt persistence and one-time consumption.
- HTML disguised as PDF, executable double extension, and type mismatch.
- Unsafe incoming request ID replacement.

## Residual Risks

- Backend authorization still requires staging penetration testing.
- S3 bucket policy, signed download lifetime, and CDN behavior are unverified.
- Antivirus/content-disarm is absent.
- Rate limits need calibration under real traffic.
- Secrets rotation and incident response are operational responsibilities and
  have not been rehearsed.
- Payment and webhook security are out of scope until a provider is selected.
