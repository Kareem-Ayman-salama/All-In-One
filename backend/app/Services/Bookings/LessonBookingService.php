<?php

namespace App\Services\Bookings;

use App\Exceptions\ApiException;
use App\Models\InstructorAvailabilitySlot;
use App\Models\LessonBooking;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LessonBookingService
{
    public function reserve(User $student, string $slotId, string $subject, ?string $note): LessonBooking
    {
        return DB::transaction(function () use ($student, $slotId, $subject, $note): LessonBooking {
            $slot = InstructorAvailabilitySlot::query()
                ->whereKey($slotId)
                ->lockForUpdate()
                ->first();
            if (! $slot || $slot->status !== 'open' || $slot->starts_at->isPast()) {
                throw new ApiException('SLOT_UNAVAILABLE', 'This lesson slot is no longer available.', 409);
            }

            $slot->update(['status' => 'booked']);

            return LessonBooking::query()->create([
                'organization_id' => $slot->organization_id,
                'instructor_id' => $slot->instructor_id,
                'slot_id' => $slot->id,
                'student_id' => $student->id,
                'subject' => $subject,
                'student_note' => $note,
                'status' => 'confirmed',
                'payment_status' => 'unpaid',
                'amount_minor' => $slot->price_minor,
                'currency' => $slot->currency,
            ])->load('instructor', 'slot');
        }, attempts: 3);
    }
}
