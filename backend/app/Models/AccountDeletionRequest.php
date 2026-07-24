<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AccountDeletionRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'status',
        'reason',
        'requested_at',
        'scheduled_for',
        'cancelled_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'scheduled_for' => 'datetime',
            'cancelled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
