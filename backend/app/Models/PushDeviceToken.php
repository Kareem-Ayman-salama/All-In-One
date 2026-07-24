<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushDeviceToken extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'user_session_id',
        'provider',
        'platform',
        'installation_id',
        'token',
        'token_hash',
        'device_name',
        'app_version',
        'last_registered_at',
        'revoked_at',
    ];

    protected $hidden = ['token'];

    protected function casts(): array
    {
        return [
            'last_registered_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(UserSession::class, 'user_session_id');
    }
}
