<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoWatchProgress extends Model
{
    use HasUuids;

    protected $table = 'video_watch_progress';

    protected $fillable = [
        'organization_id',
        'student_id',
        'room_id',
        'course_id',
        'content_id',
        'watched_seconds',
        'total_duration_seconds',
        'last_position_seconds',
        'completion_percentage',
        'is_completed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'watched_seconds' => 'integer',
            'total_duration_seconds' => 'integer',
            'last_position_seconds' => 'integer',
            'completion_percentage' => 'integer',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
