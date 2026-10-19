<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseLesson extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'course_id',
        'course_module_id',
        'created_by',
        'content_item_id',
        'title',
        'title_ar',
        'type',
        'status',
        'sort_order',
        'template_sections',
        'metadata',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'template_sections' => 'array',
            'metadata' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(CourseModule::class, 'course_module_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function contentItem(): BelongsTo
    {
        return $this->belongsTo(ContentItem::class);
    }
}
