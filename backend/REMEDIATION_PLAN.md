# Remediation Plan

## P0: Before Real Users

- Provision staging PostgreSQL, Redis, S3, and SMTP.
- Pass production preflight and GitHub CI.
- Verify private bucket policy and signed download behavior.
- Rehearse backup restore and application rollback.
- Run PostgreSQL concurrency and baseline load tests.
- Configure queue, readiness, error-rate, and storage alerts.

## P1: Before Paid Launch

- Select and integrate a payment provider with signed, replay-safe webhooks.
- Add malware scanning or content-disarm for uploaded documents.
- Add end-to-end browser tests for Arabic/English critical journeys.
- Define retention/deletion policies and export flows.
- Run an independent security review.

## P2: Scale and Product Expansion

- Add live meetings only after provider/security requirements are defined.
- Add AI retrieval only with tenant-isolated indexing and source citations.
- Add performance budgets and automated Lighthouse/browser monitoring.
- Calibrate per-plan limits and rate limits from real usage.

## Exit Criteria

P0 is complete only when evidence is attached for every item. Passing local
tests alone does not change the production decision.
