# Feature and Integration Matrix

| Area | Backend | Frontend contract | Status |
|---|---|---|---|
| Registration, verification, login, reset | Implemented | Mapped | Verified |
| MFA for platform super admin | Implemented | API ready | Verified |
| Rotating refresh sessions and devices | Implemented | Mapped | Verified |
| Workspace selection and switching | Implemented | Mapped | Verified |
| Tenant RBAC and permissions | Implemented | Mapped | Verified |
| Plan modules and usage limits | Implemented | Locked-state contract | Verified |
| Rooms and memberships | Implemented | Mapped | Verified |
| Private content upload/download | Implemented | Mapped | Verified locally |
| Announcements, events, tasks | Implemented | Mapped | Verified |
| Notifications and preferences | Implemented | Mapped | Verified |
| Academy/instructor public profiles | Implemented | Mapped | Verified |
| Courses, categories, and batches | Implemented | Mapped | Verified |
| Public search and marketplace | Implemented | Mapped | Verified |
| Reserve-now booking | Implemented | Mapped | Verified |
| Enrollment, room, subscription linkage | Transactional | Mapped | Verified |
| Student course workspace | Implemented | Mapped | Verified |
| Promotions and moderation | Implemented | Mapped | Verified |
| Audit log and transactional outbox | Implemented | Admin mapping | Verified |
| Private lesson slots/bookings | Implemented | Mapped | Verified |
| Support/privacy/deletion requests | Implemented with scheduled deletion and retention jobs | API ready | Verified |
| Paymob online payments | Implemented with signed/replay-safe webhook handling | Mapped | Code verified; live credentials and provider certification pending |
| Live video meetings | Not implemented | No backend contract | Deferred |
| AI content assistant | Not implemented | No backend contract | Deferred |
| Malware scanning | ClamAV streaming, fail-closed quarantine, retries, and audit events implemented | Upload errors mapped | Automated coverage verified; production daemon pending |

## Integration Rule

The frontend must use:

```text
VITE_API_BASE_URL=https://API-DOMAIN/api/v1
VITE_USE_MOCK_API=false
```

No production screen may silently fall back to mock data. Canonical endpoint
mapping is maintained in `FRONTEND_BACKEND_MAPPING.md`.
