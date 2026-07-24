<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

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
        'priority',
        'status',
    ];
}
