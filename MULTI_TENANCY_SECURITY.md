# Multi-Tenancy Security

- Resolve the active tenant from a verified membership, never only from request input.
- Scope every tenant-owned table and query by `organization_id`.
- Use compound uniqueness for enrollment, room membership, subscription, and invitation tokens.
- Clear tenant query caches when switching workspace.
- Verify object ownership to prevent cross-tenant IDOR attacks.
- Enforce capacity using database locks or serializable transactions.
- Generate invitation tokens server-side, store hashes, and enforce expiry and one-time acceptance.
- Use signed, short-lived URLs for protected content.
- Never expose storage, email, payment, or video-provider secrets in Vite environment variables.
- Record course moderation, booking confirmation, membership changes, and subscription activation in audit logs.
- Rate-limit authentication, invitation, booking, and public search endpoints.
- Treat frontend role guards as UX only; backend authorization is mandatory.

## Browser session security

- Access tokens are stored in `sessionStorage`, not persistent `localStorage`.
- Long-lived sessions must be restored by a Secure, HttpOnly, SameSite refresh cookie.
- API requests include credentials so the backend can rotate the refresh cookie.
- Logout must revoke the refresh session on the backend and clear the browser session.
- The production static server sends CSP, HSTS on HTTPS, frame denial, MIME sniffing
  protection, a restrictive permissions policy, and explicit cache policies.
- Keep `VITE_*` values public-only. A Vite environment variable is visible to users.

## Deployment checks

- Allow CORS only from the deployed frontend origin.
- Set cookies with `Secure`, `HttpOnly`, and an appropriate `SameSite` value.
- Rotate refresh tokens and invalidate the previous token after use.
- Use HTTPS for both frontend and API domains.
- Keep protected file URLs short-lived and authorize every download on the backend.
- Remove mock accounts and OTP hints by setting `VITE_USE_MOCK_API=false`.
