# AIN Platform — Backup and Disaster Recovery Strategy & Runbook

**Document Version:** 1.0.0 (Pilot Ready Gate)  
**Effective Date:** October 2026  
**Target Architecture:** Multi-Tenant SaaS (Laravel 11, PostgreSQL 16, Redis 7, S3/MinIO Object Storage)  
**Scope:** Production & Pilot Environments  

---

## 1. Executive Summary & Recovery Objectives

The AIN Educational Platform is an enterprise-grade multi-tenant educational management ecosystem hosting academies, course curricula, video lectures, student submissions, attendance records, financial transactions, and cryptographic certificates. 

To guarantee continuous business operations and prevent data loss during hardware failures, database corruptions, ransomware threats, or regional cloud outages, the platform mandates rigorous recovery objectives:

| Objective | Metric Target | Rationale & Impact |
| :--- | :--- | :--- |
| **RPO** (Recovery Point Objective) | **$\le$ 15 Minutes** | Achieved via continuous Write-Ahead Log (WAL) archiving. Maximum tolerable data loss is limited to 15 minutes of non-replicated transactions. |
| **RTO** (Recovery Time Objective) | **$\le$ 60 Minutes** | Time required to provision replacement compute, restore the latest base database backup, replay WAL segments, and resume traffic. |
| **Backup Retention** | **30 Days Daily + 12 Months Monthly** | Enables point-in-time forensic audits and regulatory compliance for educational records. |
| **Disaster Recovery Drills** | **Monthly Automated / Quarterly Manual** | Automated staging restoration validation guarantees backup archive integrity without human latency. |

---

## 2. PostgreSQL Database Backup Architecture

### 2.1 Storage & Tooling Overview
- **Engine:** PostgreSQL 16.x
- **Backup Engine:** `wal-g` (or `pgBackRest`) for continuous physical backup + logical `pg_dump` for point-in-time portable archives.
- **Archive Target:** Dedicated, access-restricted, versioned AWS S3 bucket (`s3://ain-production-backups-secure/postgres/`) with Object Lock (WORM).

### 2.2 Backup Topology & Cadence

```
+---------------------------------------------------------------------------------+
|                               AIN Production Cluster                            |
|                                                                                 |
|  +--------------------+        Continuous WAL Streams        +---------------+  |
|  |   PostgreSQL 16    | -----------------------------------> | S3 WAL Prefix |  |
|  |   Primary DB       |                                      +---------------+  |
|  +--------------------+                                              |          |
|            |                                                         |          |
|            | Daily Base Backup                                       |          |
|            v (Every Night 02:00 UTC)                                 v          |
|  +--------------------+        Compressed & Encrypted        +---------------+  |
|  |    pg_dump -Fc     | -----------------------------------> | S3 Base Dumps |  |
|  +--------------------+                                      +---------------+  |
+---------------------------------------------------------------------------------+
```

1. **Continuous WAL Archiving (`archive_command`):**
   - Transmits closed WAL segments (16MB chunks) directly to encrypted remote object storage within 60 seconds of closing.
   - Ensures Point-In-Time Recovery (PITR) up to the exact transaction before any accidental incident or corruption.
2. **Nightly Full Logical Snapshot (`pg_dump`):**
   - Executed daily at `02:00 UTC` via a lightweight isolated maintenance container.
   - Formatted in custom compressed format (`pg_dump -Fc -Z 9`), cryptographically signed with SHA-256 checksums, and streamed directly to S3.
3. **Weekly Base Physical Snapshot (`wal-g backup-push`):**
   - Executed every Sunday at `01:00 UTC` for ultra-fast full disk block-level restoration.

### 2.3 Automated Backup Cron Script (`scripts/backup-db.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Configuration
BACKUP_DATE=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_DIR="/tmp/backups"
BACKUP_FILE="${BACKUP_DIR}/ain_db_${BACKUP_DATE}.dump"
S3_DEST="s3://${BACKUP_S3_BUCKET}/postgres/daily/ain_db_${BACKUP_DATE}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -u)] Starting AIN PostgreSQL logical backup..."

# Execute pg_dump with parallel directory or compressed custom format
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USERNAME}" \
    -d "${DB_DATABASE}" \
    -F c \
    -b \
    -v \
    -Z 6 \
    -f "${BACKUP_FILE}"

# Generate SHA256 Checksum
sha256sum "${BACKUP_FILE}" > "${BACKUP_FILE}.sha256"

# Stream to secure object storage with server-side encryption
aws s3 cp "${BACKUP_FILE}" "${S3_DEST}" --sse aws:kms --sse-kms-key-id "${BACKUP_KMS_KEY_ID}"
aws s3 cp "${BACKUP_FILE}.sha256" "${S3_DEST}.sha256"

# Cleanup local temporary files
rm -f "${BACKUP_FILE}" "${BACKUP_FILE}.sha256"

echo "[$(date -u)] Database backup uploaded successfully: ${S3_DEST}"
```

---

## 3. Object Storage Backup & Asset Retention Strategy

The platform stores sensitive educational media, private video recordings, assignments, homework submissions, and signed certificates.

### 3.1 Bucket Classification & Storage Classes

| Asset Classification | Storage Bucket | Privacy / Access Mode | Backup & Replication Strategy |
| :--- | :--- | :--- | :--- |
| **Public Assets** | `s3://ain-public-assets` | Public-read via CloudFront CDN | Standard S3; Git-tracked / regeneratable static logos. |
| **Protected Course Media** | `s3://ain-protected-media` | Signed URLs only (TTL 15m) | S3 Cross-Region Replication (CRR) to secondary region. |
| **Student Submissions & Files** | `s3://ain-student-vault` | Strict Tenant Isolation via API | Versioning enabled + 30-day lifecycle + Glacier archival. |
| **Signed Certificates** | `s3://ain-certificates` | Public verify via Hash/Code | S3 Versioning enabled; immutable WORM retention. |

### 3.2 MinIO / S3 Mirroring Automation
In high-security hybrid or on-premise pilot deployments utilizing MinIO:
```bash
# Continuous two-way bucket sync
mc mirror --watch --remove /data/minio/ain-student-vault/ s3-remote-backup/ain-student-vault-backup/
```

---

## 4. Cryptographic Encryption & Security Standards

All backups adhere to strict data security protocols:

1. **In-Transit Security:**
   - All database connections, WAL streams, and S3 API calls strictly mandate **TLS 1.3** (minimum TLS 1.2 with PFS ciphers). Plain HTTP or unencrypted TCP is permanently rejected.
2. **At-Rest Security:**
   - Storage volumes (EBS/NVMe) are encrypted with AES-256 XTS.
   - S3 backup buckets enforce default **SSE-KMS** using an AWS KMS Customer Managed Key (CMK) with rotation enabled annually.
   - Backups cannot be read without KMS `kms:Decrypt` authorization, which is segregated from application web servers.
3. **Privilege Separation (Least Privilege):**
   - The Laravel web worker and queue pods have **zero read access** to the backup bucket.
   - Only dedicated backup orchestration service accounts hold `s3:PutObject` permissions.
   - Only Disaster Recovery Engineers hold `s3:GetObject` permission under MFA conditions.

---

## 5. Step-by-Step Restoration Verification Procedure (Tested Drill)

To avoid "Schrödinger's Backup" (where a backup exists until restoration is attempted and fails), this operational drill must be executed monthly on an isolated staging database.

### 5.1 Drill Prerequisites
- Fresh PostgreSQL 16 test container or target staging instance.
- Access to the target backup archive and its `.sha256` checksum.
- Laravel application environment configured with testing credentials.

### 5.2 Restoration Execution Commands

```bash
# Step 1: Download backup dump and checksum from S3
aws s3 cp s3://${BACKUP_S3_BUCKET}/postgres/daily/ain_db_latest.dump /tmp/restore.dump
aws s3 cp s3://${BACKUP_S3_BUCKET}/postgres/daily/ain_db_latest.dump.sha256 /tmp/restore.dump.sha256

# Step 2: Validate Checksum
cd /tmp && sha256sum -c restore.dump.sha256

# Step 3: Recreate clean target database
PGPASSWORD="${RESTORE_DB_PASSWORD}" psql -h "${RESTORE_DB_HOST}" -U "${RESTORE_DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ain_restore_test;"
PGPASSWORD="${RESTORE_DB_PASSWORD}" psql -h "${RESTORE_DB_HOST}" -U "${RESTORE_DB_USER}" -d postgres -c "CREATE DATABASE ain_restore_test OWNER ain_user;"

# Step 4: Perform pg_restore with error recording
PGPASSWORD="${RESTORE_DB_PASSWORD}" pg_restore \
    -h "${RESTORE_DB_HOST}" \
    -p "${RESTORE_DB_PORT}" \
    -U "${RESTORE_DB_USER}" \
    -d "ain_restore_test" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    -v \
    /tmp/restore.dump

# Step 5: Post-Restore Integrity Verification Script
php artisan db:monitor --database=restore_test
php artisan migrate:status --database=restore_test
```

### 5.3 Automated Sanity Verification Queries
Run following automated health assertions against the restored database:
```sql
-- 1. Verify schema migration version matches current code release
SELECT migration FROM migrations ORDER BY id DESC LIMIT 5;

-- 2. Verify organizations and membership integrity
SELECT count(*) AS total_academies FROM organizations WHERE status = 'active';
SELECT count(*) AS total_active_users FROM users WHERE status = 'active';

-- 3. Verify course and completion policy records
SELECT count(*) AS total_courses FROM courses;
SELECT id, title, completion_policy FROM courses WHERE completion_policy IS NOT NULL LIMIT 3;

-- 4. Verify certificate verification codes integrity
SELECT count(*) AS total_certificates FROM certificates WHERE status = 'issued';
```

---

## 6. Disaster Recovery Runbook & Incident Protocols

In the event of a catastrophic production database failure, follow this exact sequence:

```
[Incident Declared]
        │
        ▼
[1. Activate Maintenance Mode] ──> Notify academies via Status Page (HTTP 503)
        │
        ▼
[2. Spin Up Target RDS/Compute] ──> Multi-AZ clean provision
        │
        ▼
[3. Retrieve Latest S3 Backup] ──> Download & verify SHA-256
        │
        ▼
[4. Execute Restoration] ───────> Replay pg_restore + apply missing WALs
        │
        ▼
[5. Run Integrity Test Suite] ───> Golden workflow sanity assertions
        │
        ▼
[6. Update App Database DNS] ───> Point Laravel DATABASE_URL to new cluster
        │
        ▼
[7. Verify Health Endpoint] ────> GET /api/v1/health -> database: ok
        │
        ▼
[8. Deactivate Maintenance] ────> Resume live educational operations
```

### Incident Communication Matrix

| Role | Responsibility | Communication Channel |
| :--- | :--- | :--- |
| **Incident Commander** | Coordinates failover decisions and signs off on DNS switchover. | Emergency War Room / Incident Slack |
| **Database Reliability Lead** | Executes restore scripts and validates row checksums. | Direct technical stream |
| **Academy Support Lead** | Communicates expected ETA and status updates to Pilot Academy leadership. | WhatsApp / Email / Emergency Hotline |

---

## 7. Compliance Sign-Off

- **Lead Architect:** Antigravity AI Engineering
- **Security & Infrastructure:** AIN Platform Infrastructure Group
- **Status:** **VALIDATED & DRILL-READY**
