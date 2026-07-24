<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Instructor extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'name_ar',
        'bio',
        'bio_ar',
        'photo_path',
        'specialties',
        'social_links',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'specialties' => 'array',
            'social_links' => 'array',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    public function availabilitySlots(): HasMany
    {
        return $this->hasMany(InstructorAvailabilitySlot::class);
    }
}
