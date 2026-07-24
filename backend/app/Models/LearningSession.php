<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LearningSession extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'batch_id',
        'lesson_booking_id',
        'instructor_id',
        'created_by',
        'title',
        'title_ar',
        'starts_at',
        'ends_at',
        'status',
        'notes',
        'attendance_locked_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'attendance_locked_at' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CourseBatch::class, 'batch_id');
    }

    public function lessonBooking(): BelongsTo
    {
        return $this->belongsTo(LessonBooking::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'session_id');
    }
}
