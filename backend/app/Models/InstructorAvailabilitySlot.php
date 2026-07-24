<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstructorAvailabilitySlot extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id', 'instructor_id', 'starts_at', 'ends_at',
        'delivery_type', 'location', 'price_minor', 'currency', 'status',
    ];

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime'];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }
}
