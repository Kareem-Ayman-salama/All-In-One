<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderApplicationDocument extends Model
{
    use HasUuids;

    protected $fillable = [
        'provider_application_id',
        'type',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'checksum',
        'scan_status',
    ];

    protected $hidden = ['path'];

    protected function casts(): array
    {
        return ['size_bytes' => 'integer'];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(
            ProviderApplication::class,
            'provider_application_id',
        );
    }
}
