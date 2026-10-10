<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'quiz_id',
        'student_id',
        'score',
        'total_points',
        'percentage',
        'passed',
        'is_passed',
        'answers',
        'attempt_number',
        'started_at',
        'completed_at',
    ];

    protected $appends = [
        'is_passed',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'score' => 'integer',
            'total_points' => 'integer',
            'percentage' => 'integer',
            'passed' => 'boolean',
            'attempt_number' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function setIsPassedAttribute(bool $value): void
    {
        $this->attributes['passed'] = $value;
    }

    public function getIsPassedAttribute(): bool
    {
        return (bool) ($this->attributes['passed'] ?? false);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
