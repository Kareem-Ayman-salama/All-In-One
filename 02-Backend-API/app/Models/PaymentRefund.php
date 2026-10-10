<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRefund extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'payment_id',
        'actor_id',
        'provider',
        'provider_refund_id',
        'amount_minor',
        'currency',
        'status',
        'reason',
        'failure_reason',
        'metadata',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'metadata' => 'array',
            'refunded_at' => 'datetime',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
