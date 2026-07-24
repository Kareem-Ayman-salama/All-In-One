<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LessonBooking extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id', 'instructor_id', 'slot_id', 'student_id', 'subject',
        'student_note', 'status', 'payment_status', 'amount_minor', 'currency',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return ['cancelled_at' => 'datetime'];
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(InstructorAvailabilitySlot::class, 'slot_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
