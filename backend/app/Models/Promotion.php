<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'course_id',
        'created_by',
        'type',
        'placement',
        'start_date',
        'end_date',
        'creative_path',
        'destination_url',
        'status',
        'payment_status',
        'price_minor',
        'currency',
        'impressions',
        'clicks',
        'booking_conversions',
        'moderation_note',
        'moderated_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
