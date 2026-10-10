<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomDiscussionComment extends Model
{
    use HasUuids;

    protected $fillable = [
        'discussion_id',
        'user_id',
        'body',
        'is_instructor_reply',
        'is_best_answer',
    ];

    protected function casts(): array
    {
        return [
            'is_instructor_reply' => 'boolean',
            'is_best_answer' => 'boolean',
        ];
    }

    public function discussion(): BelongsTo
    {
        return $this->belongsTo(RoomDiscussion::class, 'discussion_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
