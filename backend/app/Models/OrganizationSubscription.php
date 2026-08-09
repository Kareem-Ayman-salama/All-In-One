<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationSubscription extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'plan_id',
        'status',
        'billing_interval',
        'activation_note',
        'payment_proof_reference',
        'trial_ends_at',
        'current_period_starts_at',
        'current_period_ends_at',
        'grace_ends_at',
        'cancelled_at',
        'approved_by',
        'approved_at',
        'rejected_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'current_period_starts_at' => 'datetime',
            'current_period_ends_at' => 'datetime',
            'grace_ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeCurrentlyAccessible(Builder $query): Builder
    {
        $now = now();

        return $query->where(function (Builder $builder) use ($now): void {
            $builder
                ->where(function (Builder $trial) use ($now): void {
                    $trial
                        ->where('status', 'trial')
                        ->where('trial_ends_at', '>=', $now)
                        ->where('current_period_ends_at', '>=', $now);
                })
                ->orWhere(function (Builder $active) use ($now): void {
                    $active
                        ->where('status', 'active')
                        ->where('current_period_ends_at', '>=', $now);
                })
                ->orWhere(function (Builder $grace) use ($now): void {
                    $grace
                        ->where('status', 'grace')
                        ->where('grace_ends_at', '>=', $now);
                });
        });
    }
}
