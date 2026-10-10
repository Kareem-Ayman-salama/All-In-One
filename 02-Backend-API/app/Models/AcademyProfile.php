<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademyProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'slug',
        'public_name',
        'public_name_ar',
        'description',
        'description_ar',
        'cover_path',
        'phone',
        'email',
        'website',
        'location',
        'branches',
        'delivery_methods',
        'cancellation_policy',
        'is_public',
        'verification_status',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'branches' => 'array',
            'delivery_methods' => 'array',
            'is_public' => 'boolean',
            'verified_at' => 'datetime',
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
}
