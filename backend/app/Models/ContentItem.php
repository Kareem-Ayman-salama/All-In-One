<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ContentItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'room_id',
        'file_asset_id',
        'created_by',
        'title',
        'description',
        'type',
        'external_url',
        'video_provider',
        'external_video_id',
        'external_url_encrypted',
        'download_allowed',
        'watermark_enabled',
        'allow_fullscreen',
        'display_order',
        'available_from',
        'available_until',
        'status',
    ];

    protected $hidden = [
        'external_url_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'download_allowed' => 'boolean',
            'watermark_enabled' => 'boolean',
            'allow_fullscreen' => 'boolean',
            'display_order' => 'integer',
            'external_url_encrypted' => 'encrypted:string',
            'available_from' => 'datetime',
            'available_until' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function fileAsset(): BelongsTo
    {
        return $this->belongsTo(FileAsset::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
