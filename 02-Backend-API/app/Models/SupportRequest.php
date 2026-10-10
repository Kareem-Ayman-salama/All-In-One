<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportRequest extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'email',
        'subject',
        'message',
        'notes',
        'priority',
        'status',
        'assigned_to',
    ];

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
