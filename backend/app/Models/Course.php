<?php

namespace App\Models;

use App\Domain\Marketplace\Enums\CourseStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Course extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'academy_profile_id',
        'instructor_id',
        'category_id',
        'created_by',
        'title',
        'title_ar',
        'slug',
        'short_description',
        'short_description_ar',
        'description',
        'description_ar',
        'cover_path',
        'education_level',
        'subject',
        'delivery_type',
        'price_minor',
        'discounted_price_minor',
        'currency',
        'discount_ends_at',
        'learning_outcomes',
        'requirements',
        'duration',
        'sessions_count',
        'status',
        'moderation_note',
        'moderated_by',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => CourseStatus::class,
            'discount_ends_at' => 'datetime',
            'learning_outcomes' => 'array',
            'requirements' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(CourseBatch::class);
    }

    public function academyProfile(): BelongsTo
    {
        return $this->belongsTo(AcademyProfile::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
