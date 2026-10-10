# AIN Platform

Production-oriented education platform for academies, independent instructors,
students, staff, and platform operators.

## Repository layout

- `01-Frontend-Web/` — React 19 and Vite web application, public landing page,
  course marketplace, and role-based dashboards.
- `02-Backend-API/` — Laravel API, tenancy, billing, attendance, meetings,
  notifications, privacy, and operational jobs.
- `03-Mobile-App/` — Flutter student application.
- `04-Docs-And-Specs/` — product, API, QA, security, and operational documents.
- `05-Releases/RELEASE_MANIFEST.md` — checksums and metadata for release files.

Generated builds, dependencies, local databases, environment files, APKs,
screenshots, logs, and legacy archives are intentionally excluded from Git.

## Local development

### Web

```bash
cd 01-Frontend-Web
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

### API

```bash
cd 02-Backend-API
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The default local URLs are:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000/api/v1`

## Quality gates

```bash
cd 01-Frontend-Web
pnpm test
pnpm test:e2e
VITE_USE_MOCK_API=false pnpm build

cd ../02-Backend-API
php artisan test
php vendor/bin/pint --test
```

## Staging review deployment

The repository supports two Railway services using the same GitHub repository:

1. Frontend service with root directory `01-Frontend-Web`.
2. Backend service with root directory `02-Backend-API` plus PostgreSQL.

Follow [`SERVER_REVIEW_GUIDE.md`](SERVER_REVIEW_GUIDE.md) for the exact setup,
environment variables, health check, and reviewer checklist. Never commit real
`.env` files or production credentials.

## Main documentation

- [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)
- [`02-Backend-API/DEPLOYMENT.md`](02-Backend-API/DEPLOYMENT.md)
- [`04-Docs-And-Specs/`](04-Docs-And-Specs/)
