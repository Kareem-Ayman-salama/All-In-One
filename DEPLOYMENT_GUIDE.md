# دليل نشر منصة AIN — Production Deployment Guide

## نظرة عامة

| المكوّن | الوجهة المقترحة | الحالة |
|---------|-----------------|--------|
| Backend API (Laravel) | Koyeb / Render / Railway | جاهز للنشر |
| Frontend Web (React) | Cloudflare Pages / Vercel | جاهز للنشر |
| Mobile App (Flutter) | APK → TestFlight + Play Console | جاهز للبناء |
| Database | PlanetScale / Supabase / Railway | يحتاج إعداد |
| Redis | Upstash / Redis Cloud | يحتاج إعداد |
| Storage | Cloudflare R2 / AWS S3 | يحتاج إعداد |
| Email | Resend.com (مجاني 3,000 رسالة/شهر) | يحتاج API key |

---

## الخطوة 0 — Firebase (إلزامية)

1. اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
2. أنشئ مشروعاً جديداً: `ain-platform-prod`
3. **Android**: أضف تطبيق → Package: `com.ain.platform` → حمّل `google-services.json`:
   ```
   03-Mobile-App/android/app/google-services.json
   ```
4. **iOS**: أضف تطبيق → Bundle ID: `com.ain.platform` → حمّل `GoogleService-Info.plist`:
   ```
   03-Mobile-App/ios/Runner/GoogleService-Info.plist
   ```
5. Project Settings → Service Accounts → Generate new private key → أضفه في `FIREBASE_CREDENTIALS_JSON`

---

## الخطوة 1 — Backend API

### Railway (موصى به للـ Monorepo)

- **Root Directory**: `02-Backend-API` (من Service Settings -> Source -> Root Directory)
- يستخدم تلقائيًا: `02-Backend-API/railway.json`
- لا تنسَ ربط قاعدة بيانات PostgreSQL في نفس المشروع وضبط متغيرات البيئة من `02-Backend-API/.env.production.example`.

### Koyeb / Render

```bash
# Build
composer install --no-dev --optimize-autoloader

# Post-deploy commands
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache

# Start
php artisan serve --host=0.0.0.0 --port=$PORT
```

أضف جميع متغيرات `02-Backend-API/.env.production.example` في لوحة تحكم الـ host.

---

## الخطوة 2 — Frontend Web

### Cloudflare Pages / Railway

- **Railway Root Directory**: `01-Frontend-Web` (يستخدم `01-Frontend-Web/railway.json`)
- **Cloudflare Pages Root directory**: `01-Frontend-Web`
- **Build command**: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- **Output dir**: `dist`

متغيرات البيئة:
```
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_USE_MOCK_API=false
VITE_SHOW_DEMO_ACCOUNTS=false
VITE_PUSHER_KEY=your_pusher_key
VITE_PUSHER_CLUSTER=eu
```

---

## الخطوة 3 — Mobile App

```bash
cd 03-Mobile-App

# Android APK
flutter build apk --release --split-per-abi

# Android Bundle (Play Store)
flutter build appbundle --release

# iOS (Xcode → Archive → App Store Connect)
```

---

## الخطوة 4 — Database

```bash
# بعد ربط قاعدة البيانات:
php artisan migrate --force
```

جداول مهمة يجب أن تكون موجودة: `users`, `organizations`, `user_devices`, `video_watch_progress`, `content_access_logs`, `audit_logs`, `certificates`, `invoices`, `live_meetings`.

---

## الخطوة 5 — Storage (Cloudflare R2)

```bash
# أنشئ bucket في Cloudflare R2
# أضف:
AWS_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
AWS_BUCKET=ain-content-production
AWS_URL=https://cdn.yourdomain.com
```

---

## الخطوة 6 — Real-time (Pusher)

```bash
# Pusher.com → Channels → New App
PUSHER_APP_ID=xxx
PUSHER_APP_KEY=xxx
PUSHER_APP_SECRET=xxx
PUSHER_APP_CLUSTER=eu
```

---

## الخطوة 7 — Zoom

```bash
# marketplace.zoom.us → Server-to-Server OAuth App
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx
ZOOM_ACCOUNT_ID=xxx
```

---

## Pre-Launch Checklist

- [ ] `google-services.json` في `android/app/`
- [ ] `GoogleService-Info.plist` في `ios/Runner/`
- [ ] كل متغيرات `.env.production.example` مملوءة
- [ ] `php artisan migrate --force` اكتمل
- [ ] `APP_DEBUG=false`
- [ ] SSL مفعّل على كل endpoints
- [ ] Push Notification وصل على جهاز اختباري
- [ ] البريد الإلكتروني يعمل
- [ ] Queue Worker يعمل (`php artisan queue:work`)

---

## التكلفة التقديرية — الشهر الأول

| الخدمة | الخطة | التكلفة |
|--------|-------|---------|
| Koyeb / Railway | Free/Hobby | $0–5 |
| Cloudflare Pages | Free | $0 |
| PlanetScale Hobby | 5 GB | $0 |
| Upstash Redis | Free | $0 |
| Cloudflare R2 | 10 GB/شهر | $0 |
| Resend Email | 3k/شهر | $0 |
| Pusher Sandbox | 200k/يوم | $0 |
| **المجموع** | | **~$0–5/شهر** |

---

## Domain Setup

```
api.ainplatform.com  →  Backend API
app.ainplatform.com  →  Frontend Web
cdn.ainplatform.com  →  Cloudflare R2 CDN
```
