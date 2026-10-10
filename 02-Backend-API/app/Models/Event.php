<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'room_id',
        'created_by',
        'title',
        'title_ar',
        'description',
        'type',
        'starts_at',
        'ends_at',
        'location',
        'meeting_provider',
        'meeting_reference',
        'status',
        'is_private',
        'reminder_minutes',
        'reminder_notified_at',
        'start_notified_at',
    ];

    protected $hidden = ['meeting_reference'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_private' => 'boolean',
            'reminder_notified_at' => 'datetime',
            'start_notified_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
