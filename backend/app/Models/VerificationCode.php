<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class VerificationCode extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'email',
        'purpose',
        'code_hash',
        'attempts',
        'expires_at',
        'used_at',
    ];

    protected $hidden = ['code_hash'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }
}
