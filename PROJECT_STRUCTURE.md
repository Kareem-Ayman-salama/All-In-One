# AIO 1st Project Structure

This folder is organized by application boundary. New work should happen only
inside the numbered folders below.

## Active Code

- `01-Frontend-Web/` - React/Vite web frontend.
- `02-Backend-API/` - Laravel API backend.
- `03-Mobile-App/` - Flutter mobile application.

## Supporting Folders

- `04-Docs-And-Specs/` - specifications, audits, diagrams, OpenAPI docs, and
  product/reference documents.
- `05-Releases/RELEASE_MANIFEST.md` - release checksums and artifact metadata.

Generated builds, release binaries, screenshots, dependency folders, local
databases, and legacy archives are not part of the repository.

## Run Commands

### Frontend Web

```bash
cd 01-Frontend-Web
pnpm install
pnpm dev
```

### Backend API

```bash
cd 02-Backend-API
composer install
php artisan serve
```

### Mobile App

```bash
cd 03-Mobile-App
flutter pub get
flutter analyze
flutter test
flutter build apk --flavor development --dart-define=AIN_FLAVOR=development --dart-define=AIN_API_BASE_URL=http://10.0.2.2:8000/api/v1 --dart-define=AIN_ENABLE_CRASH_REPORTING=false --dart-define=AIN_ALLOW_MOCK_DATA=false
```

## Deployment Notes

- Frontend deploy root: `01-Frontend-Web/`
- Backend deploy root: `02-Backend-API/`
- Mobile source root: `03-Mobile-App/`
- Generated release files should be uploaded to GitHub Releases or object
  storage. Update `05-Releases/RELEASE_MANIFEST.md` with their checksums.
