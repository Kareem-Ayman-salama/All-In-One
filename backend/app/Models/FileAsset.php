<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileAsset extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'uploaded_by',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size_bytes',
        'checksum',
        'status',
        'metadata',
    ];

    protected $hidden = ['path'];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
