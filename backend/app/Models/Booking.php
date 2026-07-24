<?php

namespace App\Models;

use App\Domain\Bookings\Enums\BookingStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'course_id',
        'batch_id',
        'student_id',
        'student_name',
        'email',
        'normalized_email',
        'phone',
        'note',
        'internal_note',
        'terms_accepted',
        'status',
        'payment_status',
        'amount_minor',
        'currency',
        'idempotency_key',
        'confirmed_by',
        'confirmed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'terms_accepted' => 'boolean',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(CourseBatch::class, 'batch_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function enrollment(): HasOne
    {
        return $this->hasOne(CourseEnrollment::class);
    }
}
