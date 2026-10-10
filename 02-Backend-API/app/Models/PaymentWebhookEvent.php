<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PaymentWebhookEvent extends Model
{
    use HasUuids;

    protected $fillable = [
        'provider',
        'provider_event_id',
        'signature_hash',
        'payload',
        'status',
        'processed_at',
        'processing_error',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }
}
