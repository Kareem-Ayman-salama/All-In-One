<?php

namespace App\Services\Invitations;

use App\Exceptions\ApiException;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\RoomMembership;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Notifications\WorkspaceInvitationNotification;
use App\Services\Operations\OperationRecorder;
use App\Services\Plans\EntitlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Str;

class InvitationService
{
    public function __construct(
        private readonly OperationRecorder $recorder,
        private readonly EntitlementService $entitlements,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     * @return array{invitation: WorkspaceInvitation, token: string}
     */
    public function create(
        Organization $organization,
        User $inviter,
        array $attributes,
        ?Request $request = null,
    ): array {
        $normalizedEmail = mb_strtolower(trim($attributes['email']));
        $pendingExists = WorkspaceInvitation::query()
            ->where('organization_id', $organization->id)
            ->where('normalized_email', $normalizedEmail)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->exists();

        if ($pendingExists) {
            throw new ApiException(
                'INVITATION_ALREADY_PENDING',
                'An active invitation already exists for this email.',
                409,
            );
        }

        if (OrganizationMembership::query()
            ->where('organization_id', $organization->id)
            ->whereHas('user', fn ($query) => $query->where(
                'normalized_email',
                $normalizedEmail,
            ))
            ->where('status', 'active')
            ->exists()) {
            throw new ApiException(
                'MEMBER_ALREADY_EXISTS',
                'This user is already a member of the organization.',
                409,
            );
        }

        $this->entitlements->assertCurrentCount(
            $organization,
            'members',
            OrganizationMembership::query()
                ->where('organization_id', $organization->id)
                ->where('status', 'active')
                ->count()
                + WorkspaceInvitation::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'pending')
                    ->where('expires_at', '>', now())
                    ->count(),
        );
        if (in_array($attributes['role'], [
            'organization_owner',
            'organization_admin',
        ], true)) {
            $this->entitlements->assertCurrentCount(
                $organization,
                'admins',
                OrganizationMembership::query()
                    ->where('organization_id', $organization->id)
                    ->where('status', 'active')
                    ->whereHas('role', fn ($query) => $query->whereIn('name', [
                        'organization_owner',
                        'organization_admin',
                    ]))
                    ->count(),
            );
        }

        $result = DB::transaction(function () use (
            $organization,
            $inviter,
            $attributes,
            $normalizedEmail,
            $request,
        ): array {
            $token = Str::random(80);
            $role = Role::query()
                ->whereNull('organization_id')
                ->where('name', $attributes['role'])
                ->where('scope', 'organization')
                ->firstOrFail();
            $invitation = WorkspaceInvitation::query()->create([
                'organization_id' => $organization->id,
                'role_id' => $role->id,
                'invited_by' => $inviter->id,
                'email' => trim($attributes['email']),
                'normalized_email' => $normalizedEmail,
                'phone' => $attributes['phone'] ?? null,
                'token_hash' => hash('sha256', $token),
                'note' => $attributes['note'] ?? null,
                'status' => 'pending',
                'expires_at' => now()->addDays($attributes['expiresInDays'] ?? 7),
            ]);

            $invitation->rooms()->sync($attributes['roomIds'] ?? []);
            $this->recorder->record(
                'invitation.sent',
                'workspace_invitation',
                $invitation->id,
                $organization->id,
                $inviter->id,
                ['email' => $normalizedEmail, 'role' => $role->name],
                ['invitationId' => $invitation->id],
                $request,
            );

            return [
                'invitation' => $invitation->load('rooms'),
                'token' => $token,
            ];
        });

        NotificationFacade::route('mail', $result['invitation']->email)
            ->notify(new WorkspaceInvitationNotification(
                $organization->name,
                rtrim((string) config('aio.frontend_url'), '/')
                    .'/invite/'.$result['token'],
                $result['invitation']->expires_at->toIso8601String(),
            ));

        return $result;
    }

    /**
     * @return array{invitation: WorkspaceInvitation, token: string}
     */
    public function resend(
        WorkspaceInvitation $invitation,
        User $actor,
        ?Request $request = null,
    ): array {
        if ($invitation->status === 'accepted' || $invitation->status === 'cancelled') {
            throw new ApiException(
                'INVITATION_NOT_RESENDABLE',
                'This invitation cannot be resent.',
                409,
            );
        }

        $token = Str::random(80);
        $invitation->forceFill([
            'token_hash' => hash('sha256', $token),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ])->save();

        $this->recorder->record(
            'invitation.resent',
            'workspace_invitation',
            $invitation->id,
            $invitation->organization_id,
            $actor->id,
            ['email' => $invitation->normalized_email],
            ['invitationId' => $invitation->id],
            $request,
        );

        return ['invitation' => $invitation->fresh('rooms'), 'token' => $token];
    }

    public function cancel(
        WorkspaceInvitation $invitation,
        User $actor,
        ?Request $request = null,
    ): WorkspaceInvitation {
        if ($invitation->status !== 'pending') {
            throw new ApiException(
                'INVITATION_NOT_CANCELLABLE',
                'Only pending invitations can be cancelled.',
                409,
            );
        }

        $invitation->update(['status' => 'cancelled']);
        $this->recorder->record(
            'invitation.cancelled',
            'workspace_invitation',
            $invitation->id,
            $invitation->organization_id,
            $actor->id,
            ['email' => $invitation->normalized_email],
            ['invitationId' => $invitation->id],
            $request,
        );

        return $invitation;
    }

    public function accept(
        string $rawToken,
        User $user,
        ?Request $request = null,
    ): OrganizationMembership {
        return DB::transaction(function () use ($rawToken, $user, $request): OrganizationMembership {
            $invitation = WorkspaceInvitation::query()
                ->with('rooms')
                ->where('token_hash', hash('sha256', $rawToken))
                ->lockForUpdate()
                ->first();

            if (! $invitation) {
                throw new ApiException(
                    'INVITATION_INVALID',
                    'The invitation link is invalid.',
                    404,
                );
            }

            if ($invitation->status !== 'pending' || $invitation->expires_at->isPast()) {
                if ($invitation->status === 'pending') {
                    $invitation->update(['status' => 'expired']);
                }

                throw new ApiException(
                    'INVITATION_EXPIRED',
                    'The invitation has expired or is no longer active.',
                    410,
                );
            }

            if ($user->normalized_email !== $invitation->normalized_email) {
                throw new ApiException(
                    'INVITATION_EMAIL_MISMATCH',
                    'Sign in using the email address that received this invitation.',
                    403,
                );
            }

            $membership = OrganizationMembership::query()->updateOrCreate([
                'organization_id' => $invitation->organization_id,
                'user_id' => $user->id,
            ], [
                'role_id' => $invitation->role_id,
                'status' => 'active',
                'joined_at' => now(),
                'suspended_at' => null,
            ]);

            foreach ($invitation->rooms as $room) {
                RoomMembership::query()->updateOrCreate([
                    'room_id' => $room->id,
                    'user_id' => $user->id,
                ], [
                    'organization_id' => $invitation->organization_id,
                    'role' => 'member',
                    'status' => 'active',
                    'joined_at' => now(),
                ]);
            }

            $invitation->update([
                'status' => 'accepted',
                'accepted_by' => $user->id,
                'accepted_at' => now(),
            ]);
            $this->recorder->record(
                'invitation.accepted',
                'workspace_invitation',
                $invitation->id,
                $invitation->organization_id,
                $user->id,
                ['membershipId' => $membership->id],
                ['invitationId' => $invitation->id],
                $request,
            );

            return $membership->load('organization', 'role.permissions');
        });
    }
}
