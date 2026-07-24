# AIO Backend

Production Laravel API for the AIO multi-tenant SaaS and course marketplace.

## Runtime

- PHP 8.3+
- Laravel 13
- PostgreSQL
- Redis cache, queues, locks, and sessions
- S3-compatible object storage
- Sanctum access tokens with rotating refresh sessions

## Local Setup

```text
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Run the background processes in separate terminals:

```text
php artisan queue:work
php artisan schedule:work
```

The API is served under `/api/v1`. Interactive API documentation is exposed
by Scramble in non-production environments.

## Quality

```text
php artisan test
vendor/bin/pint --test
php artisan route:list --path=api/v1
php artisan aio:production-check
```

## Integration

Active frontend:

`D:\Freelance work\Startup\1st Project\FrontEnd\AIOFRONT_FINAL`

Set the frontend variables:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_USE_MOCK_API=false
```

See `DEPLOYMENT.md` for Railway, `ARCHITECTURE.md` for domain boundaries,
and `FRONTEND_BACKEND_MAPPING.md` for the screen-to-endpoint map.

## Optional local demo accounts

Demo records are not created by normal migrations or production seeding. For
an explicit local QA database only:

```text
php artisan db:seed --class="Database\Seeders\DemoWorkspaceSeeder"
```

The demo password is `12345678`. Never run this seeder in production.
