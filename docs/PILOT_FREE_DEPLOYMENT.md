# AIO Pilot Free Deployment

This is the recommended near-free setup for the first Android/Web pilot.

## Stack

- Frontend: Cloudflare Pages free
- Backend API: Koyeb free or Render free
- Database: Neon Postgres free or Supabase Postgres free
- Email: Brevo free SMTP
- Push: Firebase Cloud Messaging free, disabled until `google-services.json` is provided
- Video: YouTube unlisted links for pilot content
- Payments: manual transfer, approved by super admin

## Backend Environment

Copy `02-Backend-API/.env.production.example` into the hosting provider variables.

Required variables:

- `APP_KEY`: generate with `php artisan key:generate --show`
- `APP_URL`: hosted backend URL
- `FRONTEND_URL`: hosted frontend URL
- `CORS_ALLOWED_ORIGINS`: hosted frontend URL
- `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`

Pilot security defaults:

- `MAX_ACTIVE_SESSIONS_PER_USER=1`
- `MAX_APPROVED_DEVICES_PER_MEMBER=1`
- `COOKIE_SECURE=true`
- `DB_SSLMODE=require`
- `QUEUE_CONNECTION=sync`

## Backend Start Commands

Build/install:

```bash
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
php artisan db:seed --force
```

Start:

```bash
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
```

## Frontend Environment

Set this on Cloudflare Pages:

```bash
VITE_API_BASE_URL=https://YOUR_BACKEND_HOST/api/v1
```

Build command:

```bash
pnpm install --frozen-lockfile
pnpm build
```

Output directory:

```bash
dist
```

## First Smoke Test

1. Open `/api/v1/health/live`.
2. Open `/api/v1/health/ready`.
3. Login as demo super admin or seeded owner.
4. Create organization.
5. Confirm one-month trial exists.
6. Create room.
7. Add YouTube content.
8. Open content viewer and confirm watermark.
9. Try a second device login and confirm approval is required.
10. Approve device from Super Admin / tenant Security screens.

## Still Manual

- Create hosting accounts.
- Create database.
- Add production env vars.
- Add Brevo SMTP credentials.
- Add Firebase config later for push notifications.
