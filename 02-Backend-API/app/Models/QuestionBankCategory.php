<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class QuestionBankCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'kind',
        'code',
        'name',
        'name_ar',
        'sort_order',
        'active',
    ];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }
}
