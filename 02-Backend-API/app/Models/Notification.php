<?php

namespace App\Models;

use App\Jobs\SendPushNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'organization_id',
        'type',
        'priority',
        'title',
        'body',
        'target_type',
        'target_id',
        'data',
        'status',
        'read_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::created(function (Notification $notification): void {
            SendPushNotification::dispatch($notification->id)->afterCommit();
        });
    }
}
