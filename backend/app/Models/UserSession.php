<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\PersonalAccessToken;

class UserSession extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'access_token_id',
        'name',
        'installation_id',
        'platform',
        'app_version',
        'refresh_token_hash',
        'ip_address',
        'user_agent',
        'last_used_at',
        'expires_at',
        'revoked_at',
    ];

    protected $hidden = ['refresh_token_hash'];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function accessToken(): BelongsTo
    {
        return $this->belongsTo(PersonalAccessToken::class, 'access_token_id');
    }

    public function pushDeviceTokens(): HasMany
    {
        return $this->hasMany(PushDeviceToken::class);
    }
}
