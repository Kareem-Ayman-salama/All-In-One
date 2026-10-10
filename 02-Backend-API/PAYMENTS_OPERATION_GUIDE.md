# AIN Platform — Payments & Paymob Operations Guide
*Production Gateway Integration, Webhook Rehearsals, Financial Reconciliation, and Refund Management*

---

## 1. Architecture Overview

AIN Platform integrates with **Paymob (Accept)** for processing electronic card and mobile wallet transactions in Egypt and the MENA region.

```
+----------------+          +-------------------+          +------------------+
|   Client / UI  | -------> |  AIN Backend API  | -------> |  Paymob Accept   |
| (Web & Mobile) |          | (Payment Service) |          | (Payment Gateway)|
+----------------+          +-------------------+          +------------------+
        |                             |                              |
        | Checkout iframe             |                              | Order / Payment
        |<----------------------------+                              | Key Generation
        |                                                            |
        +----------------------------------------------------------->|
        |               Student Card / Wallet Entry                  |
        |<-----------------------------------------------------------+
        |                                                            |
        |                                                            | Webhook Notification
        |                                                            | (HMAC SHA-512 Signed)
        |                           +-------------------+            |
        |                           |  Webhook Receiver | <----------+
        |                           | (Idempotent Event)|
        |                           +-------------------+
        |                                     |
        |                                     v
        |                           +-------------------+
        |                           | Financial Ledger  |
        |                           | & Booking Confirm |
        |                           +-------------------+
```

---

## 2. Environment Variables Configuration

Set these variables in your production environment (Railway Variables, Docker Compose, or `.env`):

```bash
# Gateway Provider
PAYMENT_GATEWAY_DRIVER=paymob

# Paymob Production Credentials
PAYMOB_API_KEY="sec_live_..."
PAYMOB_INTEGRATION_ID="123456"        # Live Card integration ID (or mobile wallet)
PAYMOB_IFRAME_ID="987654"             # Live checkout iframe ID
PAYMOB_HMAC_SECRET="7A8B9C0D..."      # Live HMAC SHA-512 calculation secret
PAYMOB_CURRENCY="EGP"
PAYMOB_BASE_URL="https://accept.paymob.com/api"

# Security & Simulation Controls
PAYMOB_SANDBOX_MODE=false             # MUST be false in production
PAYMOB_ALLOW_SIMULATION=false         # MUST be false in production

# Processing Fee Calculation (for financial reconciliation)
PAYMOB_FEE_PERCENT=2.75               # Percentage fee (e.g. 2.75%)
PAYMOB_FEE_FIXED_MINOR=300            # Fixed fee per transaction in minor units (300 = 3.00 EGP)
```

> [!CAUTION]
> In production (`APP_ENV=production`), the system enforces **strict fail-closed** behavior:
> 1. Missing credentials will never fallback to sandbox mocks; requests fail immediately with `503 PAYMENT_GATEWAY_MISCONFIGURED`.
> 2. Webhook simulation endpoints (`/payments/simulate-success`) are completely blocked.
> 3. Webhooks missing valid HMAC signatures are rejected with `401 MISSING_SIGNATURE` or `403 INVALID_SIGNATURE`.

---

## 3. Webhook Setup on Paymob Dashboard

1. Log in to the [Paymob Dashboard](https://accept.paymob.com/).
2. Navigate to **Developers -> Payment Integrations**.
3. Edit your Integration ID (e.g., Card or Wallet).
4. Under **Transaction Processed Callback**:
   - Set URL: `https://api.yourdomain.com/api/v1/payments/webhook/paymob`
   - Method: `POST`
5. Under **Transaction Response Callback** (Redirect):
   - Set URL: `https://yourdomain.com/checkout/callback`
6. Under **Account Settings -> Security**:
   - Copy your **HMAC Secret** and assign it to `PAYMOB_HMAC_SECRET`.

---

## 4. Automated Webhook Rehearsal Tool

Before launching to live customers, verify your deployment and HMAC keys using the automated rehearsal command:

```bash
php artisan payments:rehearse-webhook --all
```

### What the Rehearsal Verifies:
1. **Scenario 1: Happy-path Webhook**:
   - Computes live SHA-512 HMAC checksum matching Paymob's 20-field specification.
   - Parses payload and transitions Payment to `paid`.
   - Automatically confirms booking, enrolls student, and calculates net fees.
2. **Scenario 2: Idempotency & Duplicate Replay Protection**:
   - Replays the identical webhook event.
   - Asserts system returns `already_processed` without double-crediting or failing.
3. **Scenario 3: Failed Payment Webhook**:
   - Simulates rejected transaction; verifies payment is recorded as `failed` without confirming booking.
4. **Scenario 4: Refund Flow (Partial & Full)**:
   - Tests partial refund (e.g., 400 EGP of 1000 EGP), verifying remaining balances.
   - Tests full balance refund, verifying state transitions to `refunded`.
5. **Scenario 5: Signature Tampering Protection**:
   - Sends forged HMAC signature; verifies strict `403 INVALID_SIGNATURE` rejection.
6. **Scenario 6: Underpayment / Amount Mismatch Protection**:
   - Webhook claims a different amount from the database expectation; verifies strict `422 PAYMENT_AMOUNT_MISMATCH` rejection.

---

## 5. Daily Financial Reconciliation

Financial reconciliation matches gateway webhooks against local database records, computes financial metrics, and identifies anomalies.

### Running via CLI:

```bash
# Reconcile past 30 days
php artisan payments:reconcile

# Reconcile specific date range with auto-repair
php artisan payments:reconcile --from=2026-09-01 --to=2026-09-30 --auto-fix

# Output JSON for monitoring or ELK ingestion
php artisan payments:reconcile --json
```

### Metrics Reported:
- **Gross Volume**: Total paid bookings volume.
- **Refunded Volume**: Total refunds processed.
- **Estimated Gateway Fees**: Paymob fee deduction (`amount * 2.75% + 3 EGP`).
- **Estimated Net Payout**: Gross minus refunds minus gateway fees.
- **Currency Breakdown**: Multi-currency ledger balances.

### Discrepancy Auditing & Auto-Fix:
- `UNCONFIRMED_PAID_BOOKING` (CRITICAL): A payment was captured as `paid`, but the student booking remained unconfirmed. Passing `--auto-fix` automatically confirms the booking and triggers outbox notifications.
- `UNPAID_CONFIRMED_BOOKING` (HIGH): A booking is marked confirmed but payment was never completed.
- `AMOUNT_MISMATCH` (CRITICAL): Payment amount differs from booking amount.
- `STALE_PENDING_PAYMENT` (MEDIUM): Payment created > 2 hours ago with no webhook resolution.

### Automated Schedule:
The command is scheduled to run every night at 03:00 AM via Laravel Scheduler (`routes/console.php`).

---

## 6. Refund Management

### API Endpoint:
`POST /api/v1/payments/{payment_id}/refund`

**Headers:**
```http
Authorization: Bearer <STAFF_SANCTUM_TOKEN>
Content-Type: application/json
```

**Payload:**
```json
{
  "amount_minor": 50000,
  "reason": "Student requested schedule cancellation within refund window"
}
```
*(If `amount_minor` is omitted, the entire remaining balance is refunded).*

### Authorization Rules:
- Only users with role `super_admin` or organization staff with `organization.manage_billing`, `finance.view`, or `payments.view` permissions can issue refunds.
- Students and unauthorized users receive `403 FORBIDDEN`.

### Outbox & Audit Trails:
Every refund automatically creates:
1. A permanent row in `payment_refunds` with reference ID, actor UUID, timestamp, and metadata.
2. An audit log entry via `OperationRecorder` (`action: payment.refunded`).
3. An `outbox_events` event for asynchronous notification dispatch.
