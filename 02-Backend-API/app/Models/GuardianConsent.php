<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardianConsent extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'guardian_id',
        'student_id',
        'guardian_student_link_id',
        'status',
        'terms_version',
        'terms_content_hash',
        'terms_content_snapshot',
        'verification_method',
        'verification_reference',
        'consented_at',
        'revoked_at',
        'revocation_reason',
        'expires_at',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'consented_at' => 'datetime',
            'revoked_at' => 'datetime',
            'expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guardian_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function guardianStudentLink(): BelongsTo
    {
        return $this->belongsTo(GuardianStudentLink::class);
    }

    public function isActive(): bool
    {
        if ($this->status !== 'approved') {
            return false;
        }

        if ($this->revoked_at !== null) {
            return false;
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'approved')
            ->whereNull('revoked_at')
            ->where(function (Builder $q): void {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }
}
