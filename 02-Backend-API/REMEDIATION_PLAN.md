# Remediation Plan

## P0: Before Real Users

- Provision staging PostgreSQL, Redis, S3, and SMTP.
- Pass production preflight and GitHub CI.
- Verify private bucket policy and signed download behavior.
- Rehearse backup restore and application rollback.
- Run PostgreSQL concurrency and baseline load tests.
- Configure queue, readiness, error-rate, and storage alerts.

## P1: Before Paid Launch

- Complete Paymob live-account activation, credential provisioning, and a real test-payment/refund/webhook rehearsal.
- Provision a private ClamAV daemon, automate signature updates, and rehearse clean, EICAR, outage, and recovery paths in staging.
- Expand the current responsive browser smoke suite into authenticated Arabic/English booking, payment, and account-deletion journeys against staging.
- Obtain legal approval for the implemented retention, deletion, export, and minor-consent wording.
- Run an independent security review.

## P2: Scale and Product Expansion

- Add live meetings only after provider/security requirements are defined.
- Add AI retrieval only with tenant-isolated indexing and source citations.
- Add performance budgets and automated Lighthouse/browser monitoring.
- Calibrate per-plan limits and rate limits from real usage.

## Exit Criteria

P0 is complete only when evidence is attached for every item. Passing local
tests alone does not change the production decision.
