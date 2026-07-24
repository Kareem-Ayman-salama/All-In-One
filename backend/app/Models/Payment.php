<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

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
            'metadata' => 'array',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }
}
