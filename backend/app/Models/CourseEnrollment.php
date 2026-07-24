<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CourseEnrollment extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'course_id',
        'batch_id',
        'student_id',
        'booking_id',
        'room_membership_id',
        'status',
        'access_starts_at',
        'access_ends_at',
    ];

    protected function casts(): array
    {
        return [
            'access_starts_at' => 'datetime',
            'access_ends_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(StudentSubscription::class, 'enrollment_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CourseBatch::class, 'batch_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function roomMembership(): BelongsTo
    {
        return $this->belongsTo(RoomMembership::class);
    }
}
