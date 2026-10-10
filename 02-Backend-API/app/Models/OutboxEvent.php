<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OutboxEvent extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'organization_id',
        'event_type',
        'aggregate_type',
        'aggregate_id',
        'payload',
        'available_at',
        'processed_at',
        'attempts',
        'last_error',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'available_at' => 'datetime',
            'processed_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
