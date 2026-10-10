# AIN Platform — Staging Infrastructure Deployment & Validation Guide

Last updated: 2026-09-30

This guide documents the real, multi-service Staging environment for the AIN Platform. It provides an isolated, production-parity stack comprising **PostgreSQL 16**, **Redis 7**, **MinIO S3 (Cloudflare R2 simulation)**, **Mailpit SMTP**, **ClamAV daemon**, and **Laravel background queue workers**.

---

## 1. Staging Architecture Overview

```
                      +---------------------------------------+
                      |         AIN Client Apps               |
                      |  (React Web / Flutter Mobile)         |
                      +-------------------+-------------------+
                                          |
                                          v  :8000
+---------------------------------------------------------------------------------+
| Docker Staging Environment (docker-compose.staging.yml)                         |
|                                                                                 |
|   +-----------------------+                    +----------------------------+   |
|   |   backend-api         | <----------------> |   queue-worker             |   |
|   |   (PHP 8.3 CLI/Serve) |                    |   (High, Default, Malware) |   |
|   +-----------+-----------+                    +--------------+-------------+   |
|               |                                               |                 |
|               +-----------------------+-----------------------+                 |
|                                       |                                         |
|        +------------------+-----------+-----------+------------------+          |
|        |                  |                       |                  |          |
|        v                  v                       v                  v          |
|  +-----------+      +-----------+           +-----------+      +-----------+    |
|  | postgres  |      |   redis   |           |  clamav   |      |  mailpit  |    |
|  |  (v16.x)  |      |  (v7.x)   |           | (TCP:3310)|      | (SMTP:1025|    |
|  |  :5432    |      |  :6379    |           | ClamD)    |      |  Web:8025)|    |
|  +-----------+      +-----------+           +-----------+      +-----------+    |
|                           |                                                     |
|                           v                                                     |
|                     +-----------+                                               |
|                     |   minio   |                                               |
|                     |  (S3 API) |                                               |
|                     |   :9000   |                                               |
|                     +-----------+                                               |
+---------------------------------------------------------------------------------+
```

---

## 2. Service Endpoints & Credentials

| Service | Protocol / Port | UI / Console URL | Credentials | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | HTTP `:8000` | `http://localhost:8000/api/v1/health/ready` | N/A | REST API engine |
| **PostgreSQL** | TCP `:5432` | N/A | `ain_user` / `ain_staging_secret_pw` (DB: `ain_staging`) | Primary transactional database |
| **Redis** | TCP `:6379` | N/A | Pass: `ain_redis_staging_secret` | Cache, sessions, queue transport |
| **Mailpit (SMTP)** | SMTP `:1025` | `http://localhost:8025` | No auth (local inspection) | Email capture, OTP inspection |
| **MinIO (S3)** | S3 `:9000` | `http://localhost:9001` | `ain_staging_minio` / `ain_staging_minio_secret` | Private asset storage & quarantine |
| **ClamAV Daemon** | TCP `:3310` | N/A | Socket / zINSTREAM | Fail-closed malware scanning |

---

## 3. Quick Start Deployment

### Step 1: Start All Staging Services
From the project root:
```bash
docker compose -f docker-compose.staging.yml up -d
```

### Step 2: Run Database Migrations & Initial Seeds
```bash
docker compose -f docker-compose.staging.yml exec backend-api php artisan migrate --force
docker compose -f docker-compose.staging.yml exec backend-api php artisan db:seed
```

### Step 3: Run Automated Staging Infrastructure Verification
```bash
docker compose -f docker-compose.staging.yml exec backend-api php artisan staging:verify-infrastructure --eicar --fail-closed-test
```

Expected output:
```text
+------------------------------+-------------------------------------+--------+---------+-------------------------------------------------+
| Infrastructure Component     | Target / Endpoint                   | Status | Latency | Details                                         |
+------------------------------+-------------------------------------+--------+---------+-------------------------------------------------+
| Database (PostgreSQL)        | postgres / ain_staging              | PASS   | 4ms     | Connected (PostgreSQL 16.3), 38 tables present  |
| Cache & Queue (Redis)        | redis:6379                          | PASS   | 2ms     | PING/PONG verified, read/write roundtrip OK     |
| Object Storage (S3/R2)       | disk: s3 (ain-content-staging-priv) | PASS   | 18ms    | Bucket accessible, PUT/GET/DELETE successful    |
| Mail Server (SMTP / Mailpit) | mailpit:1025                        | PASS   | 3ms     | Connected: 220 mailpit ESMTP Service ready      |
| Malware Scanner (ClamAV)     | driver: clamav (clamav:3310)        | PASS   | 6ms     | Daemon active (PONG response received)          |
+------------------------------+-------------------------------------+--------+---------+-------------------------------------------------+

--- Running Live EICAR Antivirus Detection Test ---
✓ EICAR Test PASSED: Malware detected with threat: [Eicar-Signature FOUND] in 42ms.

--- Running Scanner Outage & Fail-Closed Simulation ---
✓ Fail-Closed Simulation PASSED: Broken daemon was caught gracefully. Scan result status: [failed].
  Quarantine system blocks file distribution until scanner recovers.

ALL STAGING INFRASTRUCTURE COMPONENTS ARE HEALTHY AND OPERATIONAL.
```

---

## 4. EICAR Test & Fail-Closed Behavior Verification

### A. Testing EICAR Detection
1. Create a dummy file containing the standard EICAR test string:
   ```text
   X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
   ```
2. Upload via API: `POST /api/v1/organizations/{orgId}/content`.
3. Verify that the asset status is marked `infected` immediately or quarantined.
4. Attempting to download `GET /api/v1/content/{id}/download` must return:
   ```json
   {
     "success": false,
     "error": {
       "code": "FILE_INFECTED",
       "message": "This file is quarantined due to a security threat."
     }
   }
   ```

### B. Testing Scanner Outage & Fail-Closed
1. Stop the ClamAV container to simulate an unexpected outage:
   ```bash
   docker compose -f docker-compose.staging.yml stop clamav
   ```
2. Upload a file or trigger `php artisan security:scan-assets`.
3. Confirm that assets **do not** become `ready`. They remain in `failed` quarantine status with an exponential retry schedule.
4. Downloads return `503 FILE_SCAN_FAILED` (no unscanned files are ever leaked).
5. Restart ClamAV:
   ```bash
   docker compose -f docker-compose.staging.yml start clamav
   ```
6. Run `php artisan security:scan-assets`. All pending files are automatically rescanned and transitioned to `ready`.

---

## 5. Transitioning from Staging to Production

| Staging Component | Production Equivalent | Configuration Parameter |
| :--- | :--- | :--- |
| **MinIO** | **Cloudflare R2 / AWS S3** | `AWS_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com` |
| **Mailpit** | **Resend / Amazon SES / Postmark** | `MAIL_MAILER=smtp`, `MAIL_HOST=smtp.resend.com`, `MAIL_PORT=465` |
| **Local ClamAV** | **Dedicated ClamAV Service / VM** | `CLAMAV_HOST=<clamav-internal-ip>`, `CLAMAV_PORT=3310` |
| **Local Postgres** | **Supabase / Neon / Managed DB** | `DB_HOST=<cloud-db-host>`, `DB_PORT=5432`, `DB_SSLMODE=require` |
| **Local Redis** | **Upstash Redis / Cloud Redis** | `REDIS_HOST=<upstash-host>`, `REDIS_PASSWORD=<token>` |
