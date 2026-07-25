# AIO Backend Deployment

## Railway Services

Create one Railway project. For the first staging deployment, PostgreSQL is
enough. Production additionally requires Redis, private object storage, and a
transactional mail provider.

### API

Uses `railway.json`.

```text
sh -c 'if [ "$AIO_DEPLOYMENT_MODE" = "staging" ]; then php artisan aio:production-check || true; else php artisan aio:production-check; fi && php artisan migrate --force && php artisan optimize && php artisan serve --host=0.0.0.0 --port=$PORT'
```

Health check: `/api/v1/health/ready`

### Queue Worker

Override the start command:

```text
php artisan queue:work redis --queue=notifications,outbox,default --sleep=2 --tries=5 --timeout=120 --max-time=3600
```

### Scheduler

Override the start command:

```text
php artisan schedule:work
```

## Required Variables

```text
APP_NAME=AIO API
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
AIO_DEPLOYMENT_MODE=production
APP_URL=https://YOUR-API.up.railway.app
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND.up.railway.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
MAX_ACTIVE_SESSIONS_PER_USER=8
LOG_CHANNEL=stderr
LOG_LEVEL=info
DB_CONNECTION=pgsql
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_SSLMODE=prefer
REDIS_CLIENT=predis
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
QUEUE_CONNECTION=redis
PUSH_PROVIDER=disabled
PUSH_QUEUE=notifications
CACHE_STORE=redis
SESSION_DRIVER=redis
FILESYSTEM_DISK=s3
```

For a temporary staging deployment, set:

```text
AIO_DEPLOYMENT_MODE=staging
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
REDIS_REQUIRED=false
```

### Free OTP email for the MVP

Create a free Brevo account, verify the sender address or domain, then copy the
SMTP credentials into Railway Variables:

```text
MAIL_MAILER=smtp
MAIL_SCHEME=tls
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=YOUR_BREVO_SMTP_LOGIN
MAIL_PASSWORD=YOUR_BREVO_SMTP_KEY
MAIL_FROM_ADDRESS=YOUR_VERIFIED_SENDER
MAIL_FROM_NAME=AIO - All In One
QUEUE_CONNECTION=sync
```

`QUEUE_CONNECTION=sync` avoids paying for a separate worker during the MVP.
Move to Redis plus a dedicated worker before high-volume production use.

After deployment, verify both endpoints:

```text
GET /api/v1/health/ready
GET /api/v1/health/otp
```

The OTP endpoint must return `status: ready` before inviting real users.

After signing in as the platform Super Admin, open:

```text
/super-admin/settings
```

The OTP operations panel checks the transactional mail provider, verified
sender, SMTP credentials, and direct delivery mode. Use **Send test OTP** to
deliver a real code to the signed-in Super Admin email. The test endpoint never
accepts an arbitrary recipient and is limited to three attempts per ten
minutes.

Protected operational endpoints:

```text
GET  /api/v1/admin/otp/status
POST /api/v1/admin/otp/test
```

Only the `super_admin` platform role can access these endpoints. A successful
test is recorded in the platform audit log without storing or returning the
plain OTP.

### Weekly guardian attendance reports

The backend supports both manual report delivery from the organization dashboard
and scheduled delivery with:

```bash
php artisan attendance:send-weekly-guardian-reports
```

Run Laravel's scheduler once per minute in a worker or Railway cron service:

```bash
php artisan schedule:run
```

The schedule sends reports every Monday at 08:00 application time. Delivery uses
the same free SMTP configuration as OTP, so `/api/v1/health/otp` must report
`ready`. Reports are idempotent for the same weekly period.

Staging mode prints the complete production-readiness report but does not stop
the API when optional production providers are still missing. Never use
staging mode for a public production launch.

Configure SMTP and a private S3-compatible bucket before inviting real users
or uploading production content. Copy all required keys from
`.env.production.example`; never upload that file with real secrets.

## Frontend

Set these variables on the frontend service and redeploy:

```text
VITE_API_BASE_URL=https://YOUR-API.up.railway.app/api/v1
VITE_USE_MOCK_API=false
```

## Release Checks

```text
php artisan migrate:status
php artisan about
php artisan route:list --path=api/v1
php artisan test
php artisan aio:production-check
```

The deployment is healthy only when the preflight command succeeds and
`GET /api/v1/health/ready` returns HTTP 200.

## Backup and Restore

1. Enable automated PostgreSQL snapshots with a documented retention period.
2. Enable S3 versioning or provider snapshots for private content.
3. Before a schema release, take a database snapshot and record the deployed
   commit and migration list.
4. Restore into a separate staging database at least once before launch and
   verify login, tenant isolation, booking confirmation, and protected files.
5. Keep encryption keys and provider credentials in the platform secret store,
   separately from database snapshots.

## Rollback

Prefer forward fixes for migrations that have reached production. For an
application-only regression, redeploy the previous immutable release. For a
destructive data incident, stop API, worker, and scheduler services, restore
the verified snapshot, deploy the matching release, run
`php artisan aio:production-check`, then reopen traffic.
