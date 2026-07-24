<?php

namespace App\Console\Commands;

use App\Domain\Bookings\Enums\BookingStatus;
use App\Domain\Marketplace\Enums\BatchStatus;
use App\Models\Booking;
use App\Models\CourseBatch;
use App\Models\CourseEnrollment;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\OrganizationSubscription;
use App\Models\Promotion;
use App\Models\RoomMembership;
use App\Models\StudentSubscription;
use App\Services\Operations\OperationRecorder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RunMaintenanceCommand extends Command
{
    protected $signature = 'aio:maintenance';

    protected $description = 'Expire stale access and advance scheduled AIO states';

    public function handle(OperationRecorder $recorder): int
    {
        $stats = [
            'bookingsExpired' => $this->expireBookings($recorder),
            'studentSubscriptionsExpired' => $this->expireStudentSubscriptions($recorder),
            'organizationSubscriptionsUpdated' => $this->advanceOrganizationSubscriptions(),
            'promotionsUpdated' => $this->advancePromotions(),
            'remindersCreated' => $this->createSubscriptionReminders($recorder),
        ];

        $this->info(json_encode($stats, JSON_THROW_ON_ERROR));

        return self::SUCCESS;
    }

    private function expireBookings(OperationRecorder $recorder): int
    {
        $count = 0;
        Booking::query()
            ->where('status', BookingStatus::PendingConfirmation)
            ->where('created_at', '<=', now()->subHours(48))
            ->pluck('id')
            ->each(function (string $id) use ($recorder, &$count): void {
                DB::transaction(function () use ($id, $recorder, &$count): void {
                    $booking = Booking::query()
                        ->whereKey($id)
                        ->lockForUpdate()
                        ->first();
                    if (! $booking
                        || $booking->status !== BookingStatus::PendingConfirmation) {
                        return;
                    }
                    $batch = CourseBatch::query()
                        ->whereKey($booking->batch_id)
                        ->lockForUpdate()
                        ->first();
                    if ($batch) {
                        $batch->update([
                            'reserved_seats' => max(0, $batch->reserved_seats - 1),
                            'status' => BatchStatus::Open,
                        ]);
                    }
                    $booking->update([
                        'status' => BookingStatus::Expired,
                        'cancelled_at' => now(),
                    ]);
                    $recorder->record(
                        'booking.expired',
                        'booking',
                        $booking->id,
                        $booking->organization_id,
                        null,
                        [],
                        ['bookingId' => $booking->id],
                    );
                    $count++;
                });
            });

        return $count;
    }

    private function expireStudentSubscriptions(
        OperationRecorder $recorder,
    ): int {
        $count = 0;
        StudentSubscription::query()
            ->where('status', 'active')
            ->where('ends_at', '<', now())
            ->pluck('id')
            ->each(function (string $id) use ($recorder, &$count): void {
                DB::transaction(function () use ($id, $recorder, &$count): void {
                    $subscription = StudentSubscription::query()
                        ->whereKey($id)
                        ->lockForUpdate()
                        ->first();
                    if (! $subscription || $subscription->status !== 'active') {
                        return;
                    }
                    $subscription->update(['status' => 'expired']);
                    $enrollment = CourseEnrollment::query()
                        ->whereKey($subscription->enrollment_id)
                        ->first();
                    if ($enrollment) {
                        $enrollment->update(['status' => 'expired']);
                        if ($enrollment->room_membership_id) {
                            RoomMembership::query()
                                ->whereKey($enrollment->room_membership_id)
                                ->update(['status' => 'suspended']);
                        }
                    }
                    $recorder->record(
                        'subscription.expired',
                        'student_subscription',
                        $subscription->id,
                        $subscription->organization_id,
                        null,
                        ['studentId' => $subscription->student_id],
                        ['subscriptionId' => $subscription->id],
                    );
                    $count++;
                });
            });

        return $count;
    }

    private function advanceOrganizationSubscriptions(): int
    {
        $count = OrganizationSubscription::query()
            ->whereIn('status', ['trial', 'active'])
            ->where('current_period_ends_at', '<', now())
            ->update([
                'status' => 'grace',
                'grace_ends_at' => now()->addDays(7),
                'updated_at' => now(),
            ]);
        $count += OrganizationSubscription::query()
            ->where('status', 'grace')
            ->whereNotNull('grace_ends_at')
            ->where('grace_ends_at', '<', now())
            ->update(['status' => 'expired', 'updated_at' => now()]);

        return $count;
    }

    private function advancePromotions(): int
    {
        $count = Promotion::query()
            ->where('status', 'approved')
            ->where('start_date', '<=', today())
            ->where('end_date', '>=', today())
            ->update(['status' => 'active', 'updated_at' => now()]);
        $count += Promotion::query()
            ->whereIn('status', ['approved', 'active', 'paused'])
            ->where('end_date', '<', today())
            ->update(['status' => 'completed', 'updated_at' => now()]);

        return $count;
    }

    private function createSubscriptionReminders(
        OperationRecorder $recorder,
    ): int {
        $count = 0;
        StudentSubscription::query()
            ->where('status', 'active')
            ->whereBetween('ends_at', [
                now()->addDays(6)->startOfDay(),
                now()->addDays(7)->endOfDay(),
            ])
            ->get()
            ->each(function (StudentSubscription $subscription) use (
                $recorder,
                &$count,
            ): void {
                $preference = NotificationPreference::query()
                    ->where('user_id', $subscription->student_id)
                    ->where(function ($query) use ($subscription): void {
                        $query
                            ->where('organization_id', $subscription->organization_id)
                            ->orWhereNull('organization_id');
                    })
                    ->orderByRaw('organization_id IS NULL')
                    ->first();
                if ($preference
                    && (! $preference->in_app_enabled
                        || ! $preference->subscription_reminders)) {
                    return;
                }
                $exists = Notification::query()
                    ->where('user_id', $subscription->student_id)
                    ->where('target_type', 'student_subscription')
                    ->where('target_id', $subscription->id)
                    ->where('type', 'subscription_expiring')
                    ->exists();
                if ($exists) {
                    return;
                }
                Notification::query()->create([
                    'user_id' => $subscription->student_id,
                    'organization_id' => $subscription->organization_id,
                    'type' => 'subscription_expiring',
                    'priority' => 'high',
                    'title' => 'Subscription expires soon',
                    'body' => 'Your course access expires in 7 days.',
                    'target_type' => 'student_subscription',
                    'target_id' => $subscription->id,
                    'data' => ['route' => '/student/subscriptions'],
                    'status' => 'unread',
                ]);
                $recorder->record(
                    'subscription.expiring',
                    'student_subscription',
                    $subscription->id,
                    $subscription->organization_id,
                    null,
                    ['studentId' => $subscription->student_id],
                    ['subscriptionId' => $subscription->id],
                );
                $count++;
            });

        return $count;
    }
}
