<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id',
        'room_id',
        'created_by',
        'title',
        'title_ar',
        'body',
        'body_ar',
        'audience',
        'pinned',
        'published_at',
    ];

    protected function casts(): array
    {
        return ['pinned' => 'boolean', 'published_at' => 'datetime'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
