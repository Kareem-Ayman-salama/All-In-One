# AIN staging review guide

This guide publishes a temporary review environment from GitHub without
committing credentials, local databases, dependency folders, or generated
builds.

## 1. Create the backend service

Create a Railway project from this repository and add a PostgreSQL service.
Create an application service with:

```text
Root directory: 02-Backend-API
Config file: railway.json
Health check: /api/v1/health/ready
```

Copy the staging-safe variables from `02-Backend-API/.env.staging.example` into
Railway. At minimum, configure:

```text
APP_ENV=production
APP_DEBUG=false
AIO_DEPLOYMENT_MODE=staging
APP_KEY=base64:GENERATE_A_UNIQUE_KEY
APP_URL=https://YOUR-BACKEND.up.railway.app
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND.up.railway.app
LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
REDIS_REQUIRED=false
PUSH_PROVIDER=disabled
```

Generate `APP_KEY` locally without sharing the local `.env` file:

```bash
cd 02-Backend-API
php artisan key:generate --show
```

## 2. Create the frontend service

Create a second Railway service from the same repository:

```text
Root directory: 01-Frontend-Web
Config file: railway.json
```

Set these build variables:

```text
VITE_API_BASE_URL=https://YOUR-BACKEND.up.railway.app/api/v1
VITE_USE_MOCK_API=false
VITE_SHOW_DEMO_ACCOUNTS=false
```

After Railway assigns the frontend URL, update `FRONTEND_URL` and
`CORS_ALLOWED_ORIGINS` on the backend service and redeploy it.

## 3. Verify the staging environment

- Backend readiness returns HTTP 200 at `/api/v1/health/ready`.
- Landing page and course marketplace load on desktop and mobile.
- Registration, sign-in, password reset, and workspace onboarding work.
- Student meetings show upcoming and completed sections.
- Student can view content from all active academies in one account.
- Calendar reminders are private and notifications are generated.
- Invoices render correctly and their print view is usable.
- Internal course chat works without exposing personal phone numbers.
- Instructor, employee, academy admin, and platform admin dashboards have no
  overlapping text or horizontal scrolling.

## 4. Collect feedback

Send reviewers only the frontend staging URL. Ask them to report:

1. Page URL and account role.
2. Device and browser.
3. Expected behavior versus actual behavior.
4. Screenshot or short recording.
5. Severity: blocker, confusing, or visual suggestion.

Do not use real student information, payment credentials, production API keys,
or private course content in the review environment.
