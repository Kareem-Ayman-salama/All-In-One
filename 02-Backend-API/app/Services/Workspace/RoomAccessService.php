<?php

namespace App\Services\Workspace;

use App\Exceptions\ApiException;
use App\Models\OrganizationMembership;
use App\Models\RoomMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class RoomAccessService
{
    /**
     * Determine whether a membership may access every room in its organization.
     */
    public function canReadAllRooms(OrganizationMembership $membership): bool
    {
        return in_array($membership->role->name, [
            'organization_owner',
            'organization_admin',
            'instructor',
            'staff',
        ], true);
    }

    /**
     * Limit a room-owned query to rooms visible to the current membership.
     *
     * @param  Builder<Model>  $query
     */
    public function scopeVisibleRooms(
        Builder $query,
        User $user,
        OrganizationMembership $membership,
        string $roomColumn = 'room_id',
        bool $includeOrganizationWide = false,
    ): Builder {
        if ($this->canReadAllRooms($membership)) {
            return $query;
        }

        $roomIds = RoomMembership::query()
            ->where('organization_id', $membership->organization_id)
            ->where('user_id', $user->id)
            ->where('status', 'active');
        $this->scopeCurrentCourseAccess($roomIds, $user, $membership);
        $roomIds
            ->select('room_id');

        return $query->where(function (Builder $builder) use (
            $roomColumn,
            $roomIds,
            $includeOrganizationWide,
        ): void {
            if ($includeOrganizationWide) {
                $builder->whereNull($roomColumn)
                    ->orWhereIn($roomColumn, $roomIds);

                return;
            }

            $builder->whereIn($roomColumn, $roomIds);
        });
    }

    public function ensureCanRead(
        User $user,
        OrganizationMembership $membership,
        string $roomId,
    ): void {
        if ($this->canReadAllRooms($membership)) {
            return;
        }

        $roomMemberships = RoomMembership::query()
            ->where('organization_id', $membership->organization_id)
            ->where('room_id', $roomId)
            ->where('user_id', $user->id)
            ->where('status', 'active');
        $this->scopeCurrentCourseAccess(
            $roomMemberships,
            $user,
            $membership,
        );
        $allowed = $roomMemberships->exists();

        if (! $allowed) {
            throw new ApiException(
                'ROOM_ACCESS_DENIED',
                'You do not have access to this room.',
                403,
            );
        }
    }

    /**
     * Require live enrollment and subscription access for student course rooms.
     *
     * @param  Builder<RoomMembership>  $query
     */
    private function scopeCurrentCourseAccess(
        Builder $query,
        User $user,
        OrganizationMembership $membership,
    ): void {
        if ($membership->role->name !== 'student') {
            return;
        }

        $now = now();
        $query->where(function (Builder $access) use ($user, $now): void {
            $access
                ->whereNotExists(
                    fn ($batches) => $batches
                        ->selectRaw('1')
                        ->from('course_batches')
                        ->whereColumn(
                            'course_batches.room_id',
                            'room_memberships.room_id',
                        )
                        ->whereNull('course_batches.deleted_at'),
                )
                ->orWhereExists(
                    fn ($enrollments) => $enrollments
                        ->selectRaw('1')
                        ->from('course_enrollments')
                        ->join(
                            'student_subscriptions',
                            'student_subscriptions.enrollment_id',
                            '=',
                            'course_enrollments.id',
                        )
                        ->whereColumn(
                            'course_enrollments.room_membership_id',
                            'room_memberships.id',
                        )
                        ->where(
                            'course_enrollments.student_id',
                            $user->id,
                        )
                        ->where('course_enrollments.status', 'active')
                        ->where(
                            'course_enrollments.access_starts_at',
                            '<=',
                            $now,
                        )
                        ->where(
                            'course_enrollments.access_ends_at',
                            '>=',
                            $now,
                        )
                        ->where('student_subscriptions.status', 'active')
                        ->where('student_subscriptions.starts_at', '<=', $now)
                        ->where('student_subscriptions.ends_at', '>=', $now),
                );
        });
    }
}
