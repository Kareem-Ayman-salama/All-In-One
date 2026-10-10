# AIN Platform — Backup, Observability & Monitoring Operations Guide

Last updated: 2026-09-30

This document describes the backup lifecycle, automated recovery rehearsal drills, error tracking with PII scrubbing, infrastructure alerts, and structured logging in the AIN Platform.

---

## 1. Backup & Restore Rehearsal System

### Architecture
- **Engine**: [`BackupService.php`](file:///d:/Freelance%20work/Startup/1st_Project/02-Backend-API/app/Services/Operations/BackupService.php)
- **Format**: SQL transactional dump compressed via **GZIP level 9** (`.sql.gz`).
- **Integrity**: Every backup is stamped with a **SHA-256 cryptographic checksum** recorded in both the backup manifest (`backups/manifest.json`) and the database audit logs table (`audit_logs`).
- **Disks Supported**: `local` (staging/testing) and `s3` (production AWS S3 / Cloudflare R2).

### CLI Commands

#### Create a Manual or Labeled Backup
```bash
php artisan backup:create --label=pre_migration
```

#### List Backups from the Manifest
```bash
php artisan backup:create --list
```

#### Run Automated Backup & Restore Rehearsal Drill
The rehearsal command performs a full end-to-end dry-run verification:
1. Generates fresh database backup snapshot.
2. Validates SHA-256 checksum against actual stored bytes.
3. Tests GZIP decompression and SQL parsing.
4. Performs schema parity check (verifies table count in backup equals table count in live database).
5. Writes an immutable audit trail (`backup.rehearsal_completed`) with duration and verification status.

```bash
php artisan backup:rehearsal
```

#### Automated Schedule
Configured in `routes/console.php`:
- `backup:create --label=daily_auto` runs daily at **02:00 UTC**.

---

## 2. Error Tracking & PII Sanitization (Sentry)

### Configuration
Configured in [`config/sentry.php`](file:///d:/Freelance%20work/Startup/1st_Project/02-Backend-API/config/sentry.php):
- `SENTRY_LARAVEL_DSN`: Sentry DSN endpoint.
- `SENTRY_ENVIRONMENT`: Environment tag (`staging` / `production`).
- `SENTRY_RELEASE`: Application release identifier (e.g. `ain-api@1.0.0`).
- `send_default_pii`: `false` (Strict compliance).

### Automated PII & Secret Scrubbing
Handled by [`ErrorTrackingService.php`](file:///d:/Freelance%20work/Startup/1st_Project/02-Backend-API/app/Services/Observability/ErrorTrackingService.php):
The service recursively inspects all context arrays, HTTP headers, and error messages before dispatching, automatically replacing sensitive fields with `[REDACTED]`:
- Passwords & password confirmations
- Bearer tokens & JWTs (`Bearer [REDACTED]`)
- Cookies & Session tokens
- Client secrets & API keys
- Credit card / debit card numbers (`[REDACTED_CARD]`)
- CVV / CVC security codes
- Verification OTP codes
- National IDs & date of birth
- EICAR antivirus test signatures

---

## 3. Infrastructure & Failure Alerts

### Monitored Failure Scenarios
Handled by [`AlertNotificationService.php`](file:///d:/Freelance%20work/Startup/1st_Project/02-Backend-API/app/Services/Observability/AlertNotificationService.php):

1. **Queue Job Failures (`Queue::failing` listener):**
   - Automatically hooked in `AppServiceProvider`.
   - Any job failing in `high`, `default`, `notifications`, or `malware` queues immediately dispatches a critical alert and records an audit log (`alert.queue_failed`).
2. **Malware Scanner Outage:**
   - Detects if ClamAV daemon is unreachable on TCP `3310`.
   - Triggers critical security alert (`alert.scanner_outage`) and confirms that fail-closed quarantine policy is active.
3. **Storage Capacity & Health:**
   - Detects if S3/R2 storage read/write operations fail or disk capacity exceeds thresholds.

### Service Heartbeat Command
Scheduled to run every 5 minutes in `routes/console.php`:
```bash
php artisan health:check-services
```

---

## 4. Structured JSON Logging

### Log Channel: `structured_json`
Configured in `config/logging.php` using [`SanitizedJsonFormatter.php`](file:///d:/Freelance%20work/Startup/1st_Project/02-Backend-API/app/Logging/SanitizedJsonFormatter.php):
- Writes standard single-line JSON log events to `storage/logs/structured.log`.
- Redacts all sensitive keys and authentication headers before serialization.
- Fully compatible with log ingestors (Grafana Loki, Datadog, AWS CloudWatch, ELK).

Example Output:
```json
{
  "timestamp": "2026-09-30T10:00:00+00:00",
  "level": "INFO",
  "channel": "staging",
  "message": "User login session created",
  "context": {
    "user_id": "usr_9921",
    "ip": "192.168.1.10",
    "password": "[REDACTED]",
    "token": "[REDACTED]"
  },
  "extra": {}
}
```
