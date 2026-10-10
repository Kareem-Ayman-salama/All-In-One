<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'monthly_price_minor',
        'yearly_price_minor',
        'currency',
        'active',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function getIsActiveAttribute(): bool
    {
        return (bool) ($this->attributes['active'] ?? false);
    }

    public function setIsActiveAttribute($value): void
    {
        $this->attributes['active'] = (bool) $value;
    }

    public function modules(): HasMany
    {
        return $this->hasMany(PlanModule::class);
    }
}
