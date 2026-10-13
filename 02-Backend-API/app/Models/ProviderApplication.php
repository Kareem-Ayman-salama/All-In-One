<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProviderApplication extends Model
{
    use HasUuids;

    public const STATUS_PENDING_REVIEW = 'pending_review';

    public const STATUS_NEEDS_CHANGES = 'needs_changes';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'organization_id',
        'reviewed_by',
        'provider_type',
        'status',
        'display_name',
        'phone',
        'specialty',
        'years_experience',
        'bio',
        'qualifications',
        'portfolio_url',
        'sample_course_title',
        'sample_course_description',
        'review_note',
        'submitted_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'years_experience' => 'integer',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProviderApplicationDocument::class);
    }
}
