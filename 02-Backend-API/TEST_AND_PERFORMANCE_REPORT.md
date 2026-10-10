# Test and Performance Report

Audit date: 2026-07-24

## Automated Results

```text
Backend tests:     38 passed, 208 assertions
Laravel Pint:      passed
Composer validate: passed (strict)
API routes:        108
Migrations:        11 ran locally
Frontend data QA:  passed (4 courses, 3 batches, 3 academies)
Frontend build:    passed (1,640 modules)
```

Backend tests use isolated in-memory SQLite for speed. CI additionally defines
a PostgreSQL 17 service and runs `migrate:fresh`; that CI run must be green
before release.

## Dependency Audit

A prior locked production-dependency audit in this audit session reported no
known advisories. The latest repeat could not reach Packagist and timed out.
CI therefore remains the authoritative fresh advisory gate.

## Performance Evidence

The frontend production bundle built successfully:

- main CSS: 192.15 kB, 31.53 kB gzip
- main application JS: 468.67 kB, 133.58 kB gzip
- React chunk: 50.45 kB, 17.85 kB gzip
- icon chunk: 36.68 kB, 7.36 kB gzip

No server load or soak test was executed. There is no honest p95 latency,
throughput, queue-delay, or memory claim yet.

## Required Staging Tests

- Concurrent last-seat booking against PostgreSQL.
- 30-minute mixed read/write load with representative tenant sizes.
- Queue backlog recovery with worker restart.
- S3 upload/download of maximum permitted files.
- Redis interruption and recovery.
- SMTP failure/retry behavior.
- Browser smoke tests against the deployed frontend and API.
