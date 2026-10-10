<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\User;
use App\Services\Bookings\BookingService;
use App\Services\Guardians\GuardianConsentService;
use App\Services\Payments\FinancialReconciliationService;
use App\Services\Payments\PaymobGatewayService;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymobGatewayService $paymobService,
        protected BookingService $bookingService,
    ) {}

    /**
     * Initiate checkout for a booking.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'uuid', 'exists:bookings,id'],
            'payment_method' => ['nullable', 'string', 'in:paymob,card,wallet'],
        ]);

        $booking = Booking::query()->findOrFail($validated['booking_id']);

        $consentService = app(GuardianConsentService::class);
        if ($user = $request->user()) {
            $consentService->assertActionAllowed($user, 'execute purchases', $booking->organization_id);
        } elseif ($booking->student_id) {
            $student = User::query()->find($booking->student_id);
            if ($student) {
                $consentService->assertActionAllowed($student, 'execute purchases', $booking->organization_id);
            }
        }

        if ($booking->status->value === 'confirmed') {
            return ApiResponse::success($request, [
                'status' => 'already_confirmed',
                'message' => 'This booking is already confirmed.',
                'booking_id' => $booking->id,
            ]);
        }

        $payment = $this->paymobService->createPaymentForBooking(
            booking: $booking,
            user: $request->user(),
        );

        $intent = $this->paymobService->createIntent($payment, [
            'email' => $booking->email,
            'phone' => $booking->phone,
            'first_name' => $booking->student_name,
        ]);

        return ApiResponse::success($request, $intent, status: 200);
    }

    /**
     * Handle incoming Paymob webhook.
     */
    public function paymobWebhook(Request $request): JsonResponse
    {
        $payloadRaw = (string) $request->getContent();
        $signature = $request->header('X-Signature') ?: $request->query('hmac');

        try {
            $parsed = $this->paymobService->parseWebhook($payloadRaw, $signature);
        } catch (ApiException $e) {
            Log::warning('Paymob webhook verification rejected: '.$e->getMessage());

            return response()->json(['error' => 'Webhook signature verification failed.'], $e->status ?: 403);
        } catch (\Throwable $e) {
            Log::error('Paymob webhook processing failed: '.$e->getMessage());

            return response()->json(['error' => 'Webhook processing failed.'], 400);
        }

        $eventId = $parsed['eventId'];
        $orderId = $parsed['providerReference'];
        $status = $parsed['status'];

        // Idempotency: record event in payment_webhook_events
        $webhookEvent = PaymentWebhookEvent::query()->firstOrCreate(
            [
                'provider' => 'paymob',
                'provider_event_id' => $eventId,
            ],
            [
                'signature_hash' => hash('sha256', (string) $signature),
                'payload' => $parsed['payload'],
                'status' => 'received',
            ]
        );

        if ($webhookEvent->status === 'processed') {
            return response()->json(['status' => 'already_processed']);
        }

        // Find associated payment
        $payment = null;
        if ($orderId) {
            $payment = Payment::query()->where('provider_reference', $orderId)->first();
        }

        if (! $payment && isset($parsed['payload']['merchant_order_id'])) {
            $payment = Payment::query()->find($parsed['payload']['merchant_order_id']);
        }

        if ($payment) {
            if ($status === 'paid') {
                $this->paymobService->handleSuccessfulPayment(
                    payment: $payment,
                    webhookData: $parsed['payload'],
                    bookingService: $this->bookingService,
                );

                $webhookEvent->update([
                    'status' => 'processed',
                    'processed_at' => now(),
                ]);
            } elseif ($status === 'failed') {
                $this->paymobService->handleFailedPayment(
                    payment: $payment,
                    webhookData: $parsed['payload'],
                );

                $webhookEvent->update([
                    'status' => 'failed',
                    'processed_at' => now(),
                ]);
            } elseif ($status === 'refunded') {
                $obj = $parsed['payload']['obj'] ?? $parsed['payload'];
                $refundAmount = isset($obj['amount_cents']) ? (int) $obj['amount_cents'] : $payment->remainingRefundableAmount();
                if ($refundAmount > 0 && $refundAmount <= $payment->remainingRefundableAmount()) {
                    $this->paymobService->refund(
                        payment: $payment,
                        amountMinor: $refundAmount,
                        reason: 'Refunded via Paymob gateway webhook notification.',
                    );
                }

                $webhookEvent->update([
                    'status' => 'processed',
                    'processed_at' => now(),
                ]);
            } else {
                $webhookEvent->update([
                    'status' => 'recorded',
                    'processed_at' => now(),
                ]);
            }
        } else {
            $webhookEvent->update([
                'status' => 'recorded',
                'processed_at' => now(),
            ]);
        }

        return response()->json([
            'status' => 'success',
            'event_id' => $eventId,
            'payment_status' => $status,
        ]);
    }

    /**
     * Process a refund for a payment.
     */
    public function refund(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            throw new ApiException('AUTHENTICATION_REQUIRED', 'Authentication required to process refunds.', 401);
        }

        $validated = $request->validate([
            'amount_minor' => ['nullable', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = Payment::query()->findOrFail($id);

        $isAuthorized = $user->hasRole('super_admin') ||
            $this->canManageOrganizationPayments($user, $payment->organization_id);

        if (! $isAuthorized) {
            throw new ApiException('FORBIDDEN', 'You are not authorized to refund payments for this organization.', 403);
        }

        $amountMinor = $validated['amount_minor'] ?? $payment->remainingRefundableAmount();

        $refund = $this->paymobService->refund(
            payment: $payment,
            amountMinor: (int) $amountMinor,
            reason: $validated['reason'] ?? null,
            actor: $user,
        );

        $freshPayment = $payment->fresh();

        return ApiResponse::success($request, [
            'refund' => [
                'id' => $refund->id,
                'amount_minor' => $refund->amount_minor,
                'currency' => $refund->currency,
                'status' => $refund->status,
                'provider_refund_id' => $refund->provider_refund_id,
                'reason' => $refund->reason,
                'refunded_at' => $refund->refunded_at?->toIso8601String(),
            ],
            'payment' => [
                'id' => $freshPayment->id,
                'status' => $freshPayment->status,
                'amount_minor' => $freshPayment->amount_minor,
                'refunded_amount_minor' => $freshPayment->refunded_amount_minor,
                'remaining_refundable_minor' => $freshPayment->remainingRefundableAmount(),
            ],
        ]);
    }

    /**
     * Run financial reconciliation report.
     */
    public function reconciliation(Request $request, FinancialReconciliationService $reconciliationService): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            throw new ApiException('AUTHENTICATION_REQUIRED', 'Authentication required.', 401);
        }

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'organization_id' => ['nullable', 'uuid', 'exists:organizations,id'],
            'auto_fix' => ['nullable', 'boolean'],
        ]);

        $targetOrgId = $validated['organization_id'] ?? null;
        if (! $user->hasRole('super_admin')) {
            if ($targetOrgId) {
                if (! $this->canManageOrganizationPayments($user, $targetOrgId)) {
                    throw new ApiException('FORBIDDEN', 'You are not authorized to view reconciliation for this organization.', 403);
                }
            } else {
                // Default to user's first administered organization
                $membership = $user->organizationMemberships()
                    ->where('status', 'active')
                    ->first();
                $targetOrgId = $membership?->organization_id;
                if (! $targetOrgId) {
                    throw new ApiException('FORBIDDEN', 'No organization access found.', 403);
                }
            }
        }

        $from = ! empty($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : null;
        $to = ! empty($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : null;
        $autoFix = filter_var($validated['auto_fix'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $report = $reconciliationService->reconcile(
            from: $from,
            to: $to,
            organizationId: $targetOrgId,
            autoFix: $autoFix,
        );

        return ApiResponse::success($request, $report);
    }

    /**
     * Query status of a payment.
     */
    public function status(Request $request, string $id): JsonResponse
    {
        $payment = Payment::query()->findOrFail($id);

        $user = $request->user('sanctum');
        $token = $request->query('token') ?: $request->header('X-Payment-Token');
        $storedHash = $payment->metadata['client_secret_hash'] ?? null;
        $storedSecret = $payment->metadata['client_secret'] ?? null;

        $hasTokenAccess = false;
        if (! empty($token)) {
            if (! empty($storedHash)) {
                $hasTokenAccess = hash_equals((string) $storedHash, hash('sha256', (string) $token));
            } elseif (! empty($storedSecret)) {
                $hasTokenAccess = hash_equals((string) $storedSecret, (string) $token);
            }
        }
        $hasOrgStaffAccess = $user && $this->canManageOrganizationPayments($user, $payment->organization_id);
        $hasUserAccess = $user && (
            $user->id === $payment->user_id ||
            $user->hasRole('super_admin') ||
            $hasOrgStaffAccess
        );

        if (! $hasTokenAccess && ! $hasUserAccess) {
            throw new ApiException('UNAUTHORIZED_PAYMENT_ACCESS', 'You are not authorized to view this payment status.', 403);
        }

        $booking = $payment->booking_id ? Booking::query()->find($payment->booking_id) : null;

        return ApiResponse::success($request, [
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status,
                'amount_minor' => $payment->amount_minor,
                'refunded_amount_minor' => $payment->refunded_amount_minor ?? 0,
                'currency' => $payment->currency,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'refunded_at' => $payment->refunded_at?->toIso8601String(),
            ],
            'booking' => $booking ? [
                'id' => $booking->id,
                'booking_number' => $booking->booking_number ?? $booking->id,
                'status' => $booking->status->value ?? (string) $booking->status,
                'course_id' => $booking->course_id,
            ] : null,
            'is_confirmed' => $booking?->status->value === 'confirmed',
        ]);
    }

    /**
     * Simulate successful payment in development / staging sandbox only.
     */
    public function simulateSuccess(Request $request): JsonResponse
    {
        if (app()->isProduction() || ! config('services.paymob.allow_simulation', false)) {
            throw new ApiException('ENDPOINT_DISABLED', 'Simulate payment endpoint is not available.', 404);
        }

        $user = $request->user();
        if (! $user) {
            throw new ApiException('UNAUTHENTICATED', 'Authentication required to simulate payment.', 401);
        }

        $validated = $request->validate([
            'payment_id' => ['required', 'uuid', 'exists:payments,id'],
        ]);

        $payment = Payment::query()->findOrFail($validated['payment_id']);

        if ($payment->user_id && $payment->user_id !== $user->id) {
            $isAuthorized = $user->hasRole('super_admin') ||
                $this->canManageOrganizationPayments($user, $payment->organization_id);
            if (! $isAuthorized) {
                throw new ApiException('FORBIDDEN', 'You are not authorized to simulate payment for this booking.', 403);
            }
        }

        $updatedPayment = $this->paymobService->handleSuccessfulPayment(
            payment: $payment,
            webhookData: [
                'simulated' => true,
                'amount_cents' => (int) $payment->amount_minor,
                'currency' => $payment->currency,
                'integration_id' => (string) (config('services.paymob.integration_id') ?: 'simulation'),
                'timestamp' => now()->toIso8601String(),
            ],
            bookingService: $this->bookingService,
        );

        $booking = $updatedPayment->booking_id ? Booking::query()->find($updatedPayment->booking_id) : null;

        return ApiResponse::success($request, [
            'payment' => [
                'id' => $updatedPayment->id,
                'status' => $updatedPayment->status,
                'amount_minor' => $updatedPayment->amount_minor,
                'currency' => $updatedPayment->currency,
            ],
            'booking' => $booking ? [
                'id' => $booking->id,
                'status' => $booking->status->value ?? (string) $booking->status,
            ] : null,
            'message' => 'Simulated electronic payment successfully completed and booking confirmed.',
        ]);
    }

    /**
     * Check if a user has staff/admin/finance permissions to inspect or manage payments for an organization.
     */
    private function canManageOrganizationPayments(mixed $user, ?string $organizationId): bool
    {
        if (! $user || ! $organizationId) {
            return false;
        }

        if (method_exists($user, 'hasRole') && $user->hasRole(['owner', 'organization_owner', 'admin', 'organization_admin', 'finance'], $organizationId)) {
            return true;
        }

        if (method_exists($user, 'organizationMemberships')) {
            return $user->organizationMemberships()
                ->where('organization_id', $organizationId)
                ->where('status', 'active')
                ->whereHas('role.permissions', function ($pq) {
                    $pq->whereIn('name', [
                        'organization.manage_billing',
                        'subscriptions.view',
                        'subscriptions.manage',
                        'platform.payments.view',
                        'finance.view',
                        'payments.view',
                    ]);
                })->exists();
        }

        return false;
    }
}
