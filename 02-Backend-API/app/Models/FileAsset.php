<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileAsset extends Model
{
    use HasUuids;

    public const STATUS_PENDING = 'pending';

    public const STATUS_SCANNING = 'scanning';

    public const STATUS_READY = 'ready';

    public const STATUS_INFECTED = 'infected';

    public const STATUS_FAILED = 'failed';

    protected $attributes = [
        'status' => self::STATUS_PENDING,
    ];

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
        'scan_attempts',
        'last_scanned_at',
        'next_scan_at',
        'metadata',
    ];

    protected $hidden = ['path', 'metadata'];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'scan_attempts' => 'integer',
            'last_scanned_at' => 'datetime',
            'next_scan_at' => 'datetime',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Determine whether the stored payload may be served to users.
     */
    public function isSecurityCleared(): bool
    {
        return $this->status === self::STATUS_READY;
    }
}
