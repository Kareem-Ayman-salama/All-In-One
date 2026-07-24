<?php

namespace App\Services\Bookings;

use App\Domain\Bookings\Enums\BookingStatus;
use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Exceptions\ApiException;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\CourseEnrollment;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\RoomMembership;
use App\Models\StudentSubscription;
use App\Models\User;
use App\Services\Operations\OperationRecorder;
use App\Services\Plans\EntitlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingService
{
    public function __construct(
        private readonly OperationRecorder $recorder,
        private readonly EntitlementService $entitlements,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function reserve(
        User $student,
        array $attributes,
        ?Request $request = null,
    ): Booking {
        return DB::transaction(function () use (
            $student,
            $attributes,
            $request,
        ): Booking {
            $course = Course::query()
                ->where('id', $attributes['courseId'])
                ->where('status', CourseStatus::Published)
                ->whereNotNull('published_at')
                ->first();
            if (! $course) {
                throw new ApiException(
                    'COURSE_NOT_BOOKABLE',
                    'This course is not available for booking.',
                    409,
                );
            }
            $organization = $course->organization()->firstOrFail();

            $idempotencyKey = $attributes['idempotencyKey']
                ?? $request?->header('Idempotency-Key');
            if ($idempotencyKey) {
                $existing = $this->idempotentBooking(
                    $course->organization_id,
                    $idempotencyKey,
                    $student,
                );
                if ($existing) {
                    return $existing->load('batch.course', 'enrollment');
                }
            }

            $batch = CourseBatch::query()
                ->where('id', $attributes['batchId'])
                ->where('course_id', $course->id)
                ->where('organization_id', $course->organization_id)
                ->lockForUpdate()
                ->first();

            if ($idempotencyKey) {
                $existing = $this->idempotentBooking(
                    $course->organization_id,
                    $idempotencyKey,
                    $student,
                );
                if ($existing) {
                    return $existing->load('batch.course', 'enrollment');
                }
            }

            if (! $batch || $batch->status !== BatchStatus::Open) {
                throw new ApiException(
                    'BATCH_NOT_BOOKABLE',
                    'The selected batch is not open for booking.',
                    409,
                );
            }

            if ($batch->enrollment_starts_at?->isFuture()
                || $batch->enrollment_ends_at?->isPast()) {
                throw new ApiException(
                    'ENROLLMENT_CLOSED',
                    'Enrollment is closed for this batch.',
                    409,
                );
            }

            $remaining = $batch->capacity
                - $batch->reserved_seats
                - $batch->confirmed_seats;
            if ($remaining <= 0) {
                $batch->update(['status' => BatchStatus::Full]);
                throw new ApiException(
                    'CAPACITY_FULL',
                    'No seats are available in this batch.',
                    409,
                );
            }

            $duplicate = Booking::query()
                ->where('batch_id', $batch->id)
                ->where('student_id', $student->id)
                ->whereIn('status', [
                    BookingStatus::PendingConfirmation,
                    BookingStatus::Confirmed,
                ])
                ->exists();
            if ($duplicate) {
                throw new ApiException(
                    'BOOKING_ALREADY_EXISTS',
                    'You already have an active booking for this batch.',
                    409,
                );
            }

            $this->entitlements->consumeMonthly($organization, 'bookings');

            $normalizedEmail = mb_strtolower(trim($attributes['email']));
            if ($normalizedEmail !== $student->normalized_email) {
                throw new ApiException(
                    'BOOKING_EMAIL_MISMATCH',
                    'Use the email address associated with your account.',
                    422,
                );
            }
            $amount = $course->discounted_price_minor ?? $course->price_minor;
            $booking = Booking::query()->create([
                'organization_id' => $course->organization_id,
                'course_id' => $course->id,
                'batch_id' => $batch->id,
                'student_id' => $student->id,
                'student_name' => $attributes['studentName'],
                'email' => trim($attributes['email']),
                'normalized_email' => $normalizedEmail,
                'phone' => $attributes['phone'],
                'note' => $attributes['note'] ?? null,
                'terms_accepted' => true,
                'status' => BookingStatus::PendingConfirmation,
                'payment_status' => $amount === 0 ? 'not_required' : 'unpaid',
                'amount_minor' => $amount,
                'currency' => $course->currency,
                'idempotency_key' => $idempotencyKey,
            ]);
            $batch->increment('reserved_seats');
            if ($remaining === 1) {
                $batch->update(['status' => BatchStatus::Full]);
            }

            $this->recorder->record(
                'booking.created',
                'booking',
                $booking->id,
                $course->organization_id,
                $student->id,
                ['courseId' => $course->id, 'batchId' => $batch->id],
                ['bookingId' => $booking->id],
                $request,
            );

            return $booking->load('batch.course');
        }, attempts: 3);
    }

    public function confirm(
        Booking $booking,
        User $actor,
        bool $markAsPaid = false,
        ?string $internalNote = null,
        ?Request $request = null,
    ): Booking {
        return DB::transaction(function () use (
            $booking,
            $actor,
            $markAsPaid,
            $internalNote,
            $request,
        ): Booking {
            $locked = Booking::query()
                ->with('enrollment.subscription')
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($locked->status === BookingStatus::Confirmed) {
                return $locked;
            }
            if ($locked->status !== BookingStatus::PendingConfirmation) {
                throw new ApiException(
                    'BOOKING_INVALID_STATE',
                    'Only pending bookings can be confirmed.',
                    409,
                );
            }

            $batch = CourseBatch::query()
                ->whereKey($locked->batch_id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($batch->confirmed_seats >= $batch->capacity) {
                throw new ApiException(
                    'CAPACITY_FULL',
                    'The batch has reached its confirmed capacity.',
                    409,
                );
            }

            $student = User::query()->find($locked->student_id);
            if (! $student) {
                throw new ApiException(
                    'STUDENT_ACCOUNT_REQUIRED',
                    'The booking is not linked to an active student account.',
                    409,
                );
            }

            $studentRole = Role::query()
                ->whereNull('organization_id')
                ->where('name', OrganizationRole::Student->value)
                ->firstOrFail();
            $membership = OrganizationMembership::query()
                ->where('organization_id', $locked->organization_id)
                ->where('user_id', $student->id)
                ->first();
            if (! $membership) {
                $membership = OrganizationMembership::query()->create([
                    'organization_id' => $locked->organization_id,
                    'user_id' => $student->id,
                    'role_id' => $studentRole->id,
                    'status' => 'active',
                    'joined_at' => now(),
                ]);
            } elseif ($membership->status !== 'active') {
                $membership->update([
                    'status' => 'active',
                    'suspended_at' => null,
                    'joined_at' => $membership->joined_at ?? now(),
                ]);
            }

            $roomMembership = RoomMembership::query()->updateOrCreate([
                'room_id' => $batch->room_id,
                'user_id' => $student->id,
            ], [
                'organization_id' => $locked->organization_id,
                'role' => 'member',
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $accessStartsAt = now();
            $accessEndsAt = $batch->end_date->copy()->endOfDay();
            $enrollment = CourseEnrollment::query()->firstOrCreate([
                'booking_id' => $locked->id,
            ], [
                'organization_id' => $locked->organization_id,
                'course_id' => $locked->course_id,
                'batch_id' => $locked->batch_id,
                'student_id' => $student->id,
                'room_membership_id' => $roomMembership->id,
                'status' => 'active',
                'access_starts_at' => $accessStartsAt,
                'access_ends_at' => $accessEndsAt,
            ]);
            StudentSubscription::query()->firstOrCreate([
                'enrollment_id' => $enrollment->id,
            ], [
                'organization_id' => $locked->organization_id,
                'student_id' => $student->id,
                'status' => 'active',
                'starts_at' => $accessStartsAt,
                'ends_at' => $accessEndsAt,
            ]);

            $batch->update([
                'reserved_seats' => max(0, $batch->reserved_seats - 1),
                'confirmed_seats' => $batch->confirmed_seats + 1,
                'status' => $batch->confirmed_seats + 1 >= $batch->capacity
                    ? BatchStatus::Full
                    : BatchStatus::Open,
            ]);
            $locked->update([
                'status' => BookingStatus::Confirmed,
                'payment_status' => $markAsPaid
                    ? 'paid'
                    : $locked->payment_status,
                'internal_note' => $internalNote,
                'confirmed_by' => $actor->id,
                'confirmed_at' => now(),
            ]);
            $preference = NotificationPreference::query()
                ->where('user_id', $student->id)
                ->where(function ($query) use ($locked): void {
                    $query
                        ->where('organization_id', $locked->organization_id)
                        ->orWhereNull('organization_id');
                })
                ->orderByRaw('organization_id IS NULL')
                ->first();
            if (! $preference
                || ($preference->in_app_enabled && $preference->booking_updates)) {
                Notification::query()->create([
                    'user_id' => $student->id,
                    'organization_id' => $locked->organization_id,
                    'type' => 'booking_confirmed',
                    'priority' => 'high',
                    'title' => 'Booking confirmed',
                    'body' => 'Your course booking has been confirmed.',
                    'target_type' => 'booking',
                    'target_id' => $locked->id,
                    'data' => [
                        'route' => "/student/courses/{$enrollment->id}",
                        'enrollmentId' => $enrollment->id,
                    ],
                    'status' => 'unread',
                ]);
            }
            $this->recorder->record(
                'booking.confirmed',
                'booking',
                $locked->id,
                $locked->organization_id,
                $actor->id,
                [
                    'enrollmentId' => $enrollment->id,
                    'roomMembershipId' => $roomMembership->id,
                ],
                ['bookingId' => $locked->id],
                $request,
            );

            return $locked->fresh([
                'batch.course',
                'enrollment.subscription',
            ]);
        }, attempts: 3);
    }

    public function reject(
        Booking $booking,
        User $actor,
        ?string $note,
        ?Request $request = null,
    ): Booking {
        return $this->closePending(
            $booking,
            $actor,
            BookingStatus::Rejected,
            $note,
            $request,
        );
    }

    public function cancel(
        Booking $booking,
        User $actor,
        ?string $note,
        ?Request $request = null,
    ): Booking {
        return $this->closePending(
            $booking,
            $actor,
            BookingStatus::Cancelled,
            $note,
            $request,
        );
    }

    private function closePending(
        Booking $booking,
        User $actor,
        BookingStatus $target,
        ?string $note,
        ?Request $request,
    ): Booking {
        return DB::transaction(function () use (
            $booking,
            $actor,
            $target,
            $note,
            $request,
        ): Booking {
            $locked = Booking::query()
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();
            if ($locked->status !== BookingStatus::PendingConfirmation) {
                throw new ApiException(
                    'BOOKING_INVALID_STATE',
                    'Only pending bookings can be closed.',
                    409,
                );
            }
            $batch = CourseBatch::query()
                ->whereKey($locked->batch_id)
                ->lockForUpdate()
                ->firstOrFail();
            $batch->update([
                'reserved_seats' => max(0, $batch->reserved_seats - 1),
                'status' => BatchStatus::Open,
            ]);
            $locked->update([
                'status' => $target,
                'internal_note' => $note,
                'cancelled_at' => now(),
            ]);
            $this->recorder->record(
                "booking.{$target->value}",
                'booking',
                $locked->id,
                $locked->organization_id,
                $actor->id,
                [],
                ['bookingId' => $locked->id],
                $request,
            );

            return $locked->fresh('batch.course');
        }, attempts: 3);
    }

    private function idempotentBooking(
        string $organizationId,
        string $idempotencyKey,
        User $student,
    ): ?Booking {
        $existing = Booking::query()
            ->where('organization_id', $organizationId)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing && $existing->student_id !== $student->id) {
            throw new ApiException(
                'IDEMPOTENCY_KEY_CONFLICT',
                'This idempotency key is already in use.',
                409,
            );
        }

        return $existing;
    }
}
