<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class OrganizationUsageCounter extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'metric',
        'period_key',
        'value',
    ];
}
