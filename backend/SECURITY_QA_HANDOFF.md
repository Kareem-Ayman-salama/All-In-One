# Security and QA Handoff

Last updated: 2026-08-09

## Production Safety Gates

Run this before allowing real users:

```bash
php artisan aio:production-check
```

The check now covers:

- production environment and disabled debug mode;
- HTTPS backend/frontend URLs and restricted CORS origins;
- secure refresh cookies and same-site cookie policy;
- PostgreSQL, Redis cache, Redis queue, and distributed sessions;
- private S3 object storage;
- transactional SMTP transport, credentials, and sender address;
- disabled demo access in production;
- FCM push provider with service account credentials;
- backup strategy enabled on S3 with at least 7 days retention;
- non-debug log level and server log streaming to stderr/syslog/papertrail;
- required Redis health checks.

## Required Production Variables

Keep all secrets in the hosting provider variable store. Do not commit real
values.

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://YOUR_BACKEND_HOST
FRONTEND_URL=https://YOUR_FRONTEND_HOST
CORS_ALLOWED_ORIGINS=https://YOUR_FRONTEND_HOST
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax

DB_CONNECTION=pgsql
DB_SSLMODE=require
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_REQUIRED=true

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=...

MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...

PUSH_PROVIDER=fcm
FCM_PROJECT_ID=...
FCM_SERVICE_ACCOUNT_JSON_BASE64=...

BACKUP_ENABLED=true
BACKUP_DISK=s3
BACKUP_RETENTION_DAYS=14

LOG_CHANNEL=stack
LOG_STACK=stderr
LOG_LEVEL=warning
AIO_DEMO_ACCESS_ENABLED=false
```

## Demo and Onboarding Data

Use `DemoWorkspaceSeeder` only in local or staging demo databases. It creates:

- platform admin: `super@ain.test`;
- company admin: `admin@techcorp.test`;
- company member: `employee@techcorp.test`;
- academy student: `student@ain.test`;
- TechCorp Egypt company workspace;
- Elite Academy public marketplace profile;
- three Arabic/English demo courses with active batches.

Default seeded password is `12345678`. Never seed these accounts into a real
production database.

## Practical Permission Checks

Automated coverage includes `RoleAccessMatrixTest`, which verifies:

- platform super admin can access `/api/v1/admin/*`;
- company admin cannot access platform admin APIs;
- company admin can view organization members;
- normal member cannot view members or create rooms;
- normal member can view allowed room lists;
- outside users cannot enter another organization.

Run:

```bash
php artisan test --filter=RoleAccessMatrixTest
```

## Operational Drills Still Required

- Configure a real scheduled database backup job on the hosting provider.
- Restore the latest backup into staging and document the restore time.
- Confirm log drains do not include passwords, tokens, OTPs, cookies, or file
  contents.
- Run a staging smoke test for signup, login, workspace creation, room entry,
  invitation acceptance, role switching, course booking, and notification send.
- Keep Firebase service account JSON only as a base64 environment variable on
  the server.
