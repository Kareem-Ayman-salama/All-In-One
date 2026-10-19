<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class LessonTemplate extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'locale',
        'sections',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'is_default' => 'boolean',
        ];
    }
}
