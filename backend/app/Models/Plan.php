<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuids;

    protected $fillable = [
        'code',
        'name',
        'monthly_price_minor',
        'yearly_price_minor',
        'currency',
        'active',
    ];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function modules(): HasMany
    {
        return $this->hasMany(PlanModule::class);
    }
}
