<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'booking_id',
        'user_id',
        'provider',
        'provider_reference',
        'idempotency_key',
        'amount_minor',
        'refunded_amount_minor',
        'fee_minor',
        'net_minor',
        'currency',
        'status',
        'metadata',
        'paid_at',
        'failed_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'refunded_amount_minor' => 'integer',
            'fee_minor' => 'integer',
            'net_minor' => 'integer',
            'metadata' => 'array',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(PaymentRefund::class);
    }

    public function remainingRefundableAmount(): int
    {
        return max(0, (int) $this->amount_minor - (int) ($this->refunded_amount_minor ?? 0));
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid' || $this->status === 'partially_refunded';
    }

    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    public function isPartiallyRefunded(): bool
    {
        return $this->status === 'partially_refunded';
    }
}
