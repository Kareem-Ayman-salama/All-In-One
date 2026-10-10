<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invitations\AcceptInvitationRequest;
use App\Http\Requests\Invitations\CreateInvitationRequest;
use App\Models\Organization;
use App\Models\WorkspaceInvitation;
use App\Services\Invitations\InvitationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function preview(Request $request, string $token): JsonResponse
    {
        $invitation = WorkspaceInvitation::query()
            ->with([
                'organization:id,name,slug,logo_path',
                'role:id,name',
                'rooms:id,name',
                'inviter:id,name',
            ])
            ->where('token_hash', hash('sha256', $token))
            ->first();

        if (! $invitation) {
            throw new ApiException('INVITATION_INVALID', 'The invitation link is invalid.', 404);
        }

        $status = $invitation->status === 'pending' && $invitation->expires_at->isPast()
            ? 'expired'
            : $invitation->status;

        return ApiResponse::success($request, [
            'organization' => $invitation->organization,
            'role' => $invitation->role->name,
            'rooms' => $invitation->rooms,
            'inviter' => $invitation->inviter,
            'note' => $invitation->note,
            'status' => $status,
            'expiresAt' => $invitation->expires_at,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->organization($request);
        $query = WorkspaceInvitation::query()
            ->with('rooms')
            ->where('organization_id', $organization->id)
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search')->trim()->toString().'%';
            $query->where(fn ($builder) => $builder
                ->where('email', 'like', $search)
                ->orWhere('phone', 'like', $search));
        }

        $invitations = $query->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success(
            $request,
            collect($invitations->items())->map(
                fn (WorkspaceInvitation $invitation): array => $this->present($invitation),
            ),
            [
                'currentPage' => $invitations->currentPage(),
                'lastPage' => $invitations->lastPage(),
                'total' => $invitations->total(),
            ],
        );
    }

    public function store(
        CreateInvitationRequest $request,
        InvitationService $service,
    ): JsonResponse {
        $result = $service->create(
            $this->organization($request),
            $request->user(),
            $request->validated(),
            $request,
        );

        return ApiResponse::success($request, [
            'invitation' => $this->present($result['invitation']),
            'token' => $result['token'],
            'acceptUrl' => rtrim((string) config('aio.frontend_url'), '/')
                .'/invite/'.$result['token'],
        ], status: 201);
    }

    public function resend(
        Request $request,
        string $organization,
        string $invitation,
        InvitationService $service,
    ): JsonResponse {
        $model = $this->invitation($request, $invitation);
        $result = $service->resend($model, $request->user(), $request);

        return ApiResponse::success($request, [
            'invitation' => $this->present($result['invitation']),
            'token' => $result['token'],
            'acceptUrl' => rtrim((string) config('aio.frontend_url'), '/')
                .'/invite/'.$result['token'],
        ]);
    }

    public function cancel(
        Request $request,
        string $organization,
        string $invitation,
        InvitationService $service,
    ): JsonResponse {
        $model = $service->cancel(
            $this->invitation($request, $invitation),
            $request->user(),
            $request,
        );

        return ApiResponse::success($request, $this->present($model));
    }

    public function accept(
        AcceptInvitationRequest $request,
        InvitationService $service,
    ): JsonResponse {
        $membership = $service->accept(
            $request->string('token')->toString(),
            $request->user(),
            $request,
        );

        return ApiResponse::success($request, [
            'membershipId' => $membership->id,
            'organization' => $membership->organization,
            'role' => $membership->role->name,
            'permissions' => $membership->role->permissions->pluck('name')->values(),
            'next' => "/app/{$membership->organization->slug}",
        ]);
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function invitation(
        Request $request,
        string $identifier,
    ): WorkspaceInvitation {
        $model = WorkspaceInvitation::query()
            ->with('rooms')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $identifier)
            ->first();

        if (! $model) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Invitation not found.',
                404,
            );
        }

        return $model;
    }

    /**
     * @return array<string, mixed>
     */
    private function present(WorkspaceInvitation $invitation): array
    {
        return [
            'id' => $invitation->id,
            'email' => $invitation->email,
            'phone' => $invitation->phone,
            'note' => $invitation->note,
            'status' => $invitation->status,
            'expiresAt' => $invitation->expires_at,
            'acceptedAt' => $invitation->accepted_at,
            'roomIds' => $invitation->rooms->pluck('id')->values(),
            'createdAt' => $invitation->created_at,
        ];
    }
}
