# Railway Deployment

Use one Railway project connected to this GitHub repository. Create two
services from the same `main` branch.

## 1. PostgreSQL

Add a PostgreSQL database to the Railway project before deploying the API.

## 2. Backend service

Create a service from the repository and set:

```text
Root Directory: /backend
```

The service reads `backend/railway.json`. For the first server test, configure:

```text
APP_NAME=AIO API
APP_ENV=production
APP_KEY=base64:GENERATE_A_REAL_KEY
APP_DEBUG=false
AIO_DEPLOYMENT_MODE=staging
APP_URL=https://YOUR-BACKEND.up.railway.app
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND.up.railway.app
COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
LOG_CHANNEL=stderr
LOG_LEVEL=info
DB_CONNECTION=pgsql
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_DATABASE=${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_SSLMODE=prefer
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
MAIL_MAILER=log
REDIS_REQUIRED=false
```

Generate `APP_KEY` locally with:

```bash
php artisan key:generate --show
```

After deployment, verify:

```text
https://YOUR-BACKEND.up.railway.app/api/v1/health/ready
```

It must return status `ready`.

## 3. Frontend service

Create another service from the same repository. Leave Root Directory empty
because the frontend is in the repository root.

Set:

```text
VITE_API_BASE_URL=https://YOUR-BACKEND.up.railway.app/api/v1
VITE_USE_MOCK_API=false
VITE_SHOW_DEMO_ACCOUNTS=false
```

Deploy the backend first, copy its public URL into the frontend variable, then
deploy the frontend.

## 4. Update backend URLs

Once the frontend receives its public URL, update these backend variables:

```text
FRONTEND_URL=https://YOUR-FRONTEND.up.railway.app
CORS_ALLOWED_ORIGINS=https://YOUR-FRONTEND.up.railway.app
```

Redeploy the backend after changing them.

## 5. Production launch

Before real users or protected content:

- Add Redis and use it for cache, queue, and sessions.
- Add a private S3-compatible bucket.
- Configure transactional SMTP.
- Run a queue worker and scheduler service.
- Set `AIO_DEPLOYMENT_MODE=production`.
- Run `php artisan aio:production-check`; every check must pass.
