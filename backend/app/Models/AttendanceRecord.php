<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'session_id',
        'student_id',
        'enrollment_id',
        'lesson_booking_id',
        'marked_by',
        'status',
        'minutes_late',
        'excuse_reason',
        'instructor_note',
        'guardian_visible',
        'marked_at',
    ];

    protected function casts(): array
    {
        return [
            'guardian_visible' => 'boolean',
            'marked_at' => 'datetime',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(LearningSession::class, 'session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(CourseEnrollment::class, 'enrollment_id');
    }

    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}
