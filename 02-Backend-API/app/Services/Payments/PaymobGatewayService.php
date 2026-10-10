<?php

namespace App\Services\Payments;

use App\Contracts\Payments\PaymentProvider;
use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\User;
use App\Services\Bookings\BookingService;
use App\Services\Operations\OperationRecorder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymobGatewayService implements PaymentProvider
{
    public function __construct(
        protected OperationRecorder $recorder,
    ) {}

    public function name(): string
    {
        return 'paymob';
    }

    /**
     * Create a payment intent for Paymob checkout.
     *
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function createIntent(Payment $payment, array $context = []): array
    {
        $apiKey = config('services.paymob.api_key');
        $integrationId = config('services.paymob.integration_id');
        $iframeId = config('services.paymob.iframe_id', 'mock_iframe');
        $baseUrl = config('services.paymob.base_url', 'https://accept.paymob.com/api');
        $isProduction = app()->isProduction();

        // In production, live credentials must be configured; failure is never silently fallback to mock
        if ($isProduction && (empty($apiKey) || empty($integrationId))) {
            Log::error('Paymob credentials missing in production environment.');
            throw new ApiException('PAYMENT_GATEWAY_MISCONFIGURED', 'Payment gateway is not properly configured.', 503);
        }

        // Check if live API key is provided and we can authenticate against Paymob API
        if (! empty($apiKey) && ! empty($integrationId)) {
            try {
                // Step 1: Authentication request
                $authResponse = Http::asJson()->post("{$baseUrl}/auth/tokens", [
                    'api_key' => $apiKey,
                ]);

                if (! $authResponse->successful()) {
                    Log::error('Paymob auth token request failed: '.$authResponse->body());
                    if ($isProduction) {
                        throw new ApiException('PAYMENT_GATEWAY_ERROR', 'Payment gateway authentication failed.', 502);
                    }
                } else {
                    $token = $authResponse->json('token');

                    // Step 2: Order registration
                    $orderResponse = Http::asJson()->post("{$baseUrl}/ecommerce/orders", [
                        'auth_token' => $token,
                        'delivery_needed' => 'false',
                        'amount_cents' => (int) $payment->amount_minor,
                        'currency' => $payment->currency,
                        'merchant_order_id' => $payment->id,
                        'items' => [],
                    ]);

                    if (! $orderResponse->successful()) {
                        Log::error('Paymob order creation failed: '.$orderResponse->body());
                        if ($isProduction) {
                            throw new ApiException('PAYMENT_GATEWAY_ERROR', 'Payment order creation failed.', 502);
                        }
                    } else {
                        $orderId = (string) $orderResponse->json('id');

                        // Step 3: Payment key generation
                        $paymentKeyResponse = Http::asJson()->post("{$baseUrl}/acceptance/payment_keys", [
                            'auth_token' => $token,
                            'amount_cents' => (int) $payment->amount_minor,
                            'expiration' => 3600,
                            'order_id' => $orderId,
                            'billing_data' => [
                                'apartment' => 'NA',
                                'email' => $context['email'] ?? 'customer@example.com',
                                'floor' => 'NA',
                                'first_name' => $context['first_name'] ?? 'Student',
                                'street' => 'NA',
                                'building' => 'NA',
                                'phone_number' => $context['phone'] ?? '+201000000000',
                                'shipping_method' => 'PKG',
                                'postal_code' => 'NA',
                                'city' => 'Cairo',
                                'country' => 'EG',
                                'last_name' => $context['last_name'] ?? 'User',
                                'state' => 'NA',
                            ],
                            'currency' => $payment->currency,
                            'integration_id' => $integrationId,
                        ]);

                        if (! $paymentKeyResponse->successful()) {
                            Log::error('Paymob payment key request failed: '.$paymentKeyResponse->body());
                            if ($isProduction) {
                                throw new ApiException('PAYMENT_GATEWAY_ERROR', 'Payment key generation failed.', 502);
                            }
                        } else {
                            $paymentToken = $paymentKeyResponse->json('token');
                            $checkoutUrl = "{$baseUrl}/acceptance/iframes/{$iframeId}?payment_token={$paymentToken}";

                            $payment->update([
                                'provider' => 'paymob',
                                'provider_reference' => $orderId,
                                'metadata' => array_merge($payment->metadata ?? [], [
                                    'order_id' => $orderId,
                                    'client_secret_hash' => hash('sha256', $paymentToken),
                                    'mode' => 'live',
                                ]),
                            ]);

                            return [
                                'provider' => 'paymob',
                                'payment_id' => $payment->id,
                                'provider_reference' => $orderId,
                                'client_secret' => $paymentToken,
                                'checkout_url' => $checkoutUrl,
                                'amount_minor' => $payment->amount_minor,
                                'currency' => $payment->currency,
                            ];
                        }
                    }
                }
            } catch (ApiException $e) {
                throw $e;
            } catch (\Throwable $e) {
                Log::warning('Paymob live API communication error: '.$e->getMessage());
                if ($isProduction) {
                    throw new ApiException('PAYMENT_GATEWAY_ERROR', 'Unable to communicate with payment gateway.', 502);
                }
            }
        }

        // In production, never fallback to sandbox mock checkout
        if ($isProduction) {
            throw new ApiException('PAYMENT_GATEWAY_ERROR', 'Payment initiation failed in live environment.', 502);
        }

        // Staging/Sandbox fallback mode: generate a reliable checkout session token
        $mockOrderId = 'paymob_ord_'.Str::lower(Str::random(12));
        $mockToken = 'paymob_tok_'.Str::random(32);
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        $simulatedCheckoutUrl = "{$frontendUrl}/checkout/paymob?payment_id={$payment->id}&token={$mockToken}";

        $payment->update([
            'provider' => 'paymob',
            'provider_reference' => $mockOrderId,
            'metadata' => array_merge($payment->metadata ?? [], [
                'order_id' => $mockOrderId,
                'client_secret_hash' => hash('sha256', $mockToken),
                'mode' => 'sandbox',
            ]),
        ]);

        return [
            'provider' => 'paymob',
            'payment_id' => $payment->id,
            'provider_reference' => $mockOrderId,
            'client_secret' => $mockToken,
            'checkout_url' => $simulatedCheckoutUrl,
            'amount_minor' => $payment->amount_minor,
            'currency' => $payment->currency,
        ];
    }

    /**
     * Create or retrieve a payment instance for a booking.
     */
    public function createPaymentForBooking(
        Booking $booking,
        ?User $user = null,
        ?string $idempotencyKey = null,
    ): Payment {
        $idempotencyKey = $idempotencyKey ?: 'book_pay_'.$booking->id;

        return Payment::query()->firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'organization_id' => $booking->organization_id,
                'booking_id' => $booking->id,
                'user_id' => $user?->id ?: $booking->student_id,
                'provider' => 'paymob',
                'amount_minor' => $booking->amount_minor,
                'refunded_amount_minor' => 0,
                'fee_minor' => 0,
                'currency' => $booking->currency ?: 'EGP',
                'status' => 'pending',
                'metadata' => [
                    'course_id' => $booking->course_id,
                    'batch_id' => $booking->batch_id,
                    'student_name' => $booking->student_name,
                    'email' => $booking->email,
                ],
            ]
        );
    }

    /**
     * Parse and validate incoming Paymob webhook.
     *
     * @return array{
     *   eventId:string,
     *   providerReference:?string,
     *   status:string,
     *   payload:array<string,mixed>
     * }
     */
    public function parseWebhook(string $payload, ?string $signature): array
    {
        $data = json_decode($payload, true);
        if (! is_array($data)) {
            throw new ApiException('INVALID_PAYLOAD', 'Malformed webhook JSON payload.', 400);
        }

        $obj = $data['obj'] ?? $data;
        $orderId = isset($obj['order']['id']) ? (string) $obj['order']['id'] : ($obj['order_id'] ?? null);
        $transactionId = isset($obj['id']) ? (string) $obj['id'] : Str::uuid()->toString();
        $isSuccess = filter_var($obj['success'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $isRefunded = filter_var($obj['is_refunded'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $isVoided = filter_var($obj['is_voided'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Strict HMAC verification - secret and signature are mandatory
        $hmacSecret = config('services.paymob.hmac_secret');
        if (empty($hmacSecret)) {
            Log::error('Paymob webhook rejected: PAYMOB_HMAC_SECRET is not configured.');
            throw new ApiException('PAYMENT_GATEWAY_MISCONFIGURED', 'Webhook verification failed.', 500);
        }

        if (empty($signature)) {
            Log::warning('Paymob webhook rejected: Missing HMAC signature in request.');
            throw new ApiException('MISSING_SIGNATURE', 'Missing webhook signature.', 401);
        }

        $isValid = $this->verifyHmac($obj, $signature, $hmacSecret);
        if (! $isValid) {
            Log::warning('Paymob webhook rejected: HMAC signature verification failed.');
            throw new ApiException('INVALID_SIGNATURE', 'Invalid webhook signature.', 403);
        }

        $status = 'failed';
        if ($isRefunded || $isVoided) {
            $status = 'refunded';
        } elseif ($isSuccess) {
            $status = 'paid';
        }

        return [
            'eventId' => $transactionId,
            'providerReference' => $orderId ? (string) $orderId : null,
            'status' => $status,
            'payload' => $data,
        ];
    }

    /**
     * Compute Paymob SHA-512 HMAC string against payload object.
     */
    public function calculateHmac(array $obj, string $secret): string
    {
        $keys = [
            'amount_cents',
            'created_at',
            'currency',
            'error_occured',
            'has_parent_transaction',
            'id',
            'integration_id',
            'is_3d_secure',
            'is_auth',
            'is_capture',
            'is_refunded',
            'is_standalone_payment',
            'is_voided',
            'order.id',
            'owner',
            'pending',
            'source_data.pan',
            'source_data.sub_type',
            'source_data.type',
            'success',
        ];

        $concatenated = '';
        foreach ($keys as $key) {
            if (str_contains($key, '.')) {
                [$parent, $child] = explode('.', $key);
                $val = $obj[$parent][$child] ?? '';
            } else {
                $val = $obj[$key] ?? '';
            }

            if (is_bool($val)) {
                $val = $val ? 'true' : 'false';
            }
            $concatenated .= (string) $val;
        }

        return hash_hmac('sha512', $concatenated, $secret);
    }

    /**
     * Validate Paymob HMAC string against payload object.
     */
    public function verifyHmac(array $obj, string $signature, string $secret): bool
    {
        $calculated = $this->calculateHmac($obj, $secret);

        return hash_equals($calculated, $signature);
    }

    /**
     * Process a successful payment: update Payment record, calculate fees, confirm booking and enroll student.
     */
    public function handleSuccessfulPayment(
        Payment $payment,
        array $webhookData,
        BookingService $bookingService,
    ): Payment {
        $isSimulated = ! empty($webhookData['simulated']);

        if ($isSimulated) {
            if (app()->isProduction() || ! config('services.paymob.allow_simulation', false)) {
                throw new ApiException('SIMULATION_DISABLED', 'Payment simulation is disabled.', 403);
            }
        }

        $obj = $webhookData['obj'] ?? $webhookData['payload']['obj'] ?? $webhookData['payload'] ?? $webhookData;
        $expectedAmountCents = (int) $payment->amount_minor;
        $receivedAmountCents = isset($obj['amount_cents']) ? (int) $obj['amount_cents'] : null;
        $receivedCurrency = $obj['currency'] ?? null;
        $receivedIntegrationId = isset($obj['integration_id']) ? (string) $obj['integration_id'] : null;
        $configuredIntegrationId = (string) config('services.paymob.integration_id');

        if (! $isSimulated) {
            // Real production webhooks MUST include complete transaction fields
            if ($receivedAmountCents === null || $receivedCurrency === null || $receivedIntegrationId === null) {
                Log::error("Paymob payment {$payment->id} rejected: required transaction fields missing from webhook payload.", [
                    'has_amount' => $receivedAmountCents !== null,
                    'has_currency' => $receivedCurrency !== null,
                    'has_integration_id' => $receivedIntegrationId !== null,
                ]);
                throw new ApiException(
                    'INVALID_PAYMENT_PAYLOAD',
                    'Payment verification failed: required transaction fields (amount_cents, currency, integration_id) are missing from webhook.',
                    422,
                );
            }
        }

        if ($receivedAmountCents !== null && $receivedAmountCents !== $expectedAmountCents) {
            Log::error("Paymob payment {$payment->id} amount mismatch: expected {$expectedAmountCents}, got {$receivedAmountCents}");
            throw new ApiException('PAYMENT_AMOUNT_MISMATCH', 'Payment verification failed due to amount mismatch.', 422);
        }

        if ($receivedCurrency !== null && strtoupper((string) $receivedCurrency) !== strtoupper((string) $payment->currency)) {
            Log::error("Paymob payment {$payment->id} currency mismatch: expected {$payment->currency}, got {$receivedCurrency}");
            throw new ApiException('PAYMENT_CURRENCY_MISMATCH', 'Payment verification failed due to currency mismatch.', 422);
        }

        if (! empty($configuredIntegrationId) && $receivedIntegrationId !== null && (string) $receivedIntegrationId !== $configuredIntegrationId) {
            Log::error("Paymob payment {$payment->id} integration ID mismatch: expected {$configuredIntegrationId}, got {$receivedIntegrationId}");
            throw new ApiException('PAYMENT_INTEGRATION_MISMATCH', 'Payment verification failed due to integration mismatch.', 422);
        }

        return DB::transaction(function () use ($payment, $webhookData, $bookingService): Payment {
            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->status === 'paid') {
                return $lockedPayment;
            }

            $sanitizedWebhookEvent = [
                'id' => $webhookData['id'] ?? ($webhookData['obj']['id'] ?? null),
                'success' => $webhookData['obj']['success'] ?? ($webhookData['success'] ?? true),
                'amount_cents' => $webhookData['obj']['amount_cents'] ?? ($webhookData['amount_cents'] ?? null),
                'currency' => $webhookData['obj']['currency'] ?? ($webhookData['currency'] ?? null),
                'integration_id' => $webhookData['obj']['integration_id'] ?? ($webhookData['integration_id'] ?? null),
                'order_id' => $webhookData['obj']['order']['id'] ?? ($webhookData['order_id'] ?? null),
            ];

            // Calculate estimated gateway processing fee
            $feePercent = (float) config('services.paymob.fee_percent', 2.75);
            $feeFixed = (int) config('services.paymob.fee_fixed_minor', 300); // 3.00 EGP
            $feeMinor = (int) round(($lockedPayment->amount_minor * ($feePercent / 100)) + $feeFixed);
            $netMinor = max(0, $lockedPayment->amount_minor - $feeMinor);

            $lockedPayment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'fee_minor' => $feeMinor,
                'net_minor' => $netMinor,
                'metadata' => array_merge($lockedPayment->metadata ?? [], [
                    'webhook_processed_at' => now()->toIso8601String(),
                    'webhook_event' => $sanitizedWebhookEvent,
                ]),
            ]);

            // If this payment is tied to a booking, automatically confirm the booking
            if ($lockedPayment->booking_id) {
                $booking = Booking::query()->find($lockedPayment->booking_id);
                if ($booking && $booking->status->value !== 'confirmed') {
                    $bookingService->confirm(
                        booking: $booking,
                        actor: null,
                        markAsPaid: true,
                        internalNote: 'Automated confirmation via Paymob gateway payment: '.$lockedPayment->id,
                    );
                }
            }

            // Record outbox event and audit log
            $this->recorder->record(
                action: 'payment.succeeded',
                entityType: 'Payment',
                entityId: $lockedPayment->id,
                organizationId: $lockedPayment->organization_id,
                actorId: $lockedPayment->user_id,
                metadata: [
                    'provider' => 'paymob',
                    'amount_minor' => $lockedPayment->amount_minor,
                    'fee_minor' => $feeMinor,
                    'net_minor' => $netMinor,
                    'currency' => $lockedPayment->currency,
                    'booking_id' => $lockedPayment->booking_id,
                ],
                payload: [
                    'payment_id' => $lockedPayment->id,
                    'booking_id' => $lockedPayment->booking_id,
                    'status' => 'paid',
                ],
            );

            return $lockedPayment->fresh();
        });
    }

    /**
     * Handle failed payment webhook.
     */
    public function handleFailedPayment(Payment $payment, array $webhookData): Payment
    {
        return DB::transaction(function () use ($payment, $webhookData): Payment {
            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPayment->status === 'paid') {
                return $lockedPayment;
            }

            $lockedPayment->update([
                'status' => 'failed',
                'failed_at' => now(),
                'metadata' => array_merge($lockedPayment->metadata ?? [], [
                    'webhook_failed_at' => now()->toIso8601String(),
                    'webhook_event' => [
                        'id' => $webhookData['id'] ?? ($webhookData['obj']['id'] ?? null),
                        'error_occured' => $webhookData['obj']['error_occured'] ?? true,
                    ],
                ]),
            ]);

            $this->recorder->record(
                action: 'payment.failed',
                entityType: 'Payment',
                entityId: $lockedPayment->id,
                organizationId: $lockedPayment->organization_id,
                actorId: $lockedPayment->user_id,
                metadata: [
                    'provider' => 'paymob',
                    'amount_minor' => $lockedPayment->amount_minor,
                    'currency' => $lockedPayment->currency,
                    'booking_id' => $lockedPayment->booking_id,
                ],
                payload: [
                    'payment_id' => $lockedPayment->id,
                    'booking_id' => $lockedPayment->booking_id,
                    'status' => 'failed',
                ],
            );

            return $lockedPayment->fresh();
        });
    }

    /**
     * Process a refund for a payment. Supports both full and partial refunds.
     */
    public function refund(
        Payment $payment,
        int $amountMinor,
        ?string $reason = null,
        ?User $actor = null,
    ): PaymentRefund {
        if (! in_array($payment->status, ['paid', 'partially_refunded'], true)) {
            throw new ApiException('PAYMENT_NOT_REFUNDABLE', 'Only paid payments can be refunded.', 422);
        }

        $remainingRefundable = $payment->remainingRefundableAmount();
        if ($amountMinor <= 0) {
            throw new ApiException('INVALID_REFUND_AMOUNT', 'Refund amount must be greater than zero.', 422);
        }

        if ($amountMinor > $remainingRefundable) {
            throw new ApiException(
                'REFUND_EXCEEDS_PAYMENT',
                "Refund amount ({$amountMinor}) exceeds remaining refundable amount ({$remainingRefundable}).",
                422,
            );
        }

        $apiKey = config('services.paymob.api_key');
        $baseUrl = config('services.paymob.base_url', 'https://accept.paymob.com/api');
        $isProduction = app()->isProduction();
        $isLivePayment = ($payment->metadata['mode'] ?? '') === 'live' || ! empty($apiKey);

        $providerRefundId = null;

        // In production or live mode with credentials, call Paymob Void/Refund API
        if ($isProduction && $isLivePayment) {
            $transactionId = $payment->metadata['webhook_event']['id']
                ?? $payment->metadata['order_id']
                ?? $payment->provider_reference;

            if (empty($transactionId)) {
                Log::error("Paymob refund failed: Missing transaction reference for payment {$payment->id}");
                throw new ApiException('PAYMENT_REFUND_FAILED', 'Cannot locate gateway transaction reference for refund.', 422);
            }

            try {
                // Get auth token
                $authResponse = Http::asJson()->post("{$baseUrl}/auth/tokens", [
                    'api_key' => $apiKey,
                ]);

                if (! $authResponse->successful()) {
                    Log::error('Paymob refund auth failed: '.$authResponse->body());
                    throw new ApiException('PAYMENT_REFUND_FAILED', 'Payment gateway authentication failed during refund.', 502);
                }

                $token = $authResponse->json('token');

                // Call Paymob refund endpoint
                $refundResponse = Http::asJson()->post("{$baseUrl}/acceptance/void_refund/refund", [
                    'auth_token' => $token,
                    'transaction_id' => $transactionId,
                    'amount_cents' => $amountMinor,
                ]);

                if (! $refundResponse->successful()) {
                    Log::error("Paymob refund request failed for payment {$payment->id}: ".$refundResponse->body());
                    throw new ApiException('PAYMENT_REFUND_FAILED', 'Paymob refund rejected by gateway: '.$refundResponse->json('message', 'Unknown error'), 502);
                }

                $providerRefundId = (string) $refundResponse->json('id');
            } catch (ApiException $e) {
                throw $e;
            } catch (\Throwable $e) {
                Log::error("Paymob refund communication exception for payment {$payment->id}: ".$e->getMessage());
                throw new ApiException('PAYMENT_REFUND_FAILED', 'Unable to communicate with payment gateway for refund.', 502);
            }
        } else {
            // Simulated / Sandbox refund
            $providerRefundId = 'paymob_rf_'.Str::lower(Str::random(12));
        }

        return DB::transaction(function () use ($payment, $amountMinor, $reason, $actor, $providerRefundId): PaymentRefund {
            $lockedPayment = Payment::query()
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $newRefundedTotal = (int) $lockedPayment->refunded_amount_minor + $amountMinor;
            $isFullyRefunded = $newRefundedTotal >= (int) $lockedPayment->amount_minor;
            $newStatus = $isFullyRefunded ? 'refunded' : 'partially_refunded';

            $refund = PaymentRefund::query()->create([
                'organization_id' => $lockedPayment->organization_id,
                'payment_id' => $lockedPayment->id,
                'actor_id' => $actor?->id,
                'provider' => 'paymob',
                'provider_refund_id' => $providerRefundId,
                'amount_minor' => $amountMinor,
                'currency' => $lockedPayment->currency,
                'status' => 'succeeded',
                'reason' => $reason,
                'refunded_at' => now(),
                'metadata' => [
                    'previous_refunded_minor' => $lockedPayment->refunded_amount_minor,
                    'new_refunded_minor' => $newRefundedTotal,
                    'fully_refunded' => $isFullyRefunded,
                ],
            ]);

            $newNet = max(0, (int) $lockedPayment->amount_minor - $newRefundedTotal - (int) $lockedPayment->fee_minor);

            $lockedPayment->update([
                'status' => $newStatus,
                'refunded_amount_minor' => $newRefundedTotal,
                'net_minor' => $newNet,
                'refunded_at' => $isFullyRefunded ? now() : $lockedPayment->refunded_at,
                'metadata' => array_merge($lockedPayment->metadata ?? [], [
                    'last_refund_id' => $refund->id,
                    'last_refund_at' => now()->toIso8601String(),
                ]),
            ]);

            // If fully refunded and linked to a booking, note the refund in booking
            if ($isFullyRefunded && $lockedPayment->booking_id) {
                $booking = Booking::query()->find($lockedPayment->booking_id);
                if ($booking) {
                    $booking->update([
                        'payment_status' => 'refunded',
                    ]);
                }
            }

            // Record audit event
            $this->recorder->record(
                action: 'payment.refunded',
                entityType: 'PaymentRefund',
                entityId: $refund->id,
                organizationId: $lockedPayment->organization_id,
                actorId: $actor?->id,
                metadata: [
                    'payment_id' => $lockedPayment->id,
                    'refund_id' => $refund->id,
                    'amount_minor' => $amountMinor,
                    'currency' => $lockedPayment->currency,
                    'is_fully_refunded' => $isFullyRefunded,
                    'reason' => $reason,
                ],
                payload: [
                    'payment_id' => $lockedPayment->id,
                    'status' => $newStatus,
                    'refunded_amount_minor' => $newRefundedTotal,
                ],
            );

            return $refund;
        });
    }
}
