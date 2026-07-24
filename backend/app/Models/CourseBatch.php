<?php

namespace App\Models;

use App\Domain\Marketplace\Enums\BatchStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseBatch extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'course_id',
        'room_id',
        'title',
        'title_ar',
        'start_date',
        'end_date',
        'schedule',
        'delivery_type',
        'capacity',
        'reserved_seats',
        'confirmed_seats',
        'location',
        'meeting_reference',
        'enrollment_starts_at',
        'enrollment_ends_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => BatchStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'schedule' => 'array',
            'enrollment_starts_at' => 'datetime',
            'enrollment_ends_at' => 'datetime',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'batch_id');
    }
}
