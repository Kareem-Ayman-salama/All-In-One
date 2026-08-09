# Deployment and Operations

## Required Services

1. API service using `railway.json`.
2. Redis queue worker using the `worker` command in `Procfile`.
3. Scheduler using the `scheduler` command in `Procfile`.
4. PostgreSQL.
5. Redis.
6. Private S3-compatible storage.
7. Transactional email provider.
8. FCM service account for push notifications.
9. Scheduled database backups with restore rehearsal.

## Release Sequence

1. Deploy to staging with `.env.production.example` fully populated.
2. Run `php artisan aio:production-check`.
3. Run `php artisan migrate --force`.
4. Seed demo data only in staging when needed.
5. Start worker and scheduler.
6. Verify `/api/v1/health/live` and `/api/v1/health/ready`.
7. Run the staging smoke suite.
8. Take a production database snapshot.
9. Deploy the same immutable artifact to production.
10. Repeat preflight, readiness, and smoke checks.

## Monitoring

Alert on:

- readiness endpoint failures;
- HTTP 5xx rate and p95 latency;
- queue depth, oldest job age, and failed jobs;
- outbox events with repeated attempts;
- database/Redis connection failures;
- S3 and mail delivery errors;
- suspicious refresh reuse and OTP lockouts.

All logs should include the request ID. Do not log authorization headers,
refresh cookies, passwords, OTP values, or uploaded content.

## Recovery

Follow the backup and rollback procedures in `DEPLOYMENT.md`. A release is not
operationally approved until a restore into staging has succeeded.

See `SECURITY_QA_HANDOFF.md` for the final security, demo data, and role
verification checklist.
