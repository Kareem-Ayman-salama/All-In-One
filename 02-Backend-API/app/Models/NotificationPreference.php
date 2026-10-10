<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'organization_id',
        'in_app_enabled',
        'email_enabled',
        'push_enabled',
        'booking_updates',
        'announcements',
        'subscription_reminders',
    ];

    protected function casts(): array
    {
        return [
            'in_app_enabled' => 'boolean',
            'email_enabled' => 'boolean',
            'push_enabled' => 'boolean',
            'booking_updates' => 'boolean',
            'announcements' => 'boolean',
            'subscription_reminders' => 'boolean',
        ];
    }
}
