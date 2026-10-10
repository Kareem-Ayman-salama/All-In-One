<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'organization_id', 'room_id', 'created_by', 'assigned_to', 'title',
        'title_ar', 'description', 'due_at', 'priority', 'status', 'progress',
    ];

    protected function casts(): array
    {
        return ['due_at' => 'datetime', 'progress' => 'integer'];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
