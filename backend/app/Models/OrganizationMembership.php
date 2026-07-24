<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationMembership extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'user_id',
        'role_id',
        'status',
        'joined_at',
        'suspended_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
