# AIO Backend Architecture

## Style

Laravel modular monolith with domain-oriented controllers, requests, services,
policies, models, resources, jobs, and events.

## Runtime Processes

1. API/web process
2. Queue worker process
3. PostgreSQL
4. Redis
5. S3-compatible object storage

## Domain Modules

- Identity: auth, users, sessions, devices, verification, password reset
- Tenancy: organizations, memberships, roles, permissions, invitations
- Commercial: plans, entitlements, organization subscriptions, usage
- Collaboration: rooms, memberships, content, announcements, events, tasks
- Marketplace: academies, instructors, categories, courses, batches
- Learning access: bookings, enrollments, student subscriptions
- Operations: notifications, promotions, analytics, support, audit, outbox

## Dependency Rules

- Controllers validate and delegate.
- Services own use cases and transactions.
- Policies and middleware own authorization.
- Models define persistence and relationships, not orchestration.
- Tenant-aware services require a verified organization context.
- Side effects are recorded to the outbox inside the business transaction and
  delivered asynchronously.

## Critical Transaction

`BookingService` locks the booking and batch, verifies capacity,
confirms once, creates enrollment, organization membership, room membership,
student subscription, outbox events, and audit records in one transaction.

Unique constraints make repeated requests idempotent.
