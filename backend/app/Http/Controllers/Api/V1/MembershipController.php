<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Members\UpdateMembershipRequest;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MembershipController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = OrganizationMembership::query()
            ->with('user:id,name,email,avatar_path,status', 'role:id,name')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = '%'.$request->string('search')->trim()->toString().'%';
                $query->whereHas('user', fn ($user) => $user
                    ->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search));
            })
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function update(
        UpdateMembershipRequest $request,
        string $organization,
        string $membership,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->membership($request, $membership);
        $updated = DB::transaction(function () use (
            $request,
            $model,
            $recorder,
        ): OrganizationMembership {
            $locked = OrganizationMembership::query()
                ->with('role')
                ->whereKey($model->id)
                ->lockForUpdate()
                ->firstOrFail();
            $newRole = $request->filled('role')
                ? Role::query()
                    ->whereNull('organization_id')
                    ->where('name', $request->string('role'))
                    ->firstOrFail()
                : $locked->role;
            $newStatus = $request->validated('status', $locked->status);
            $this->protectLastOwner($locked, $newRole->name, $newStatus);
            $locked->update([
                'role_id' => $newRole->id,
                'status' => $newStatus,
                'suspended_at' => $newStatus === 'suspended' ? now() : null,
            ]);
            $recorder->record(
                'membership.updated',
                'organization_membership',
                $locked->id,
                $locked->organization_id,
                $request->user()->id,
                ['role' => $newRole->name, 'status' => $newStatus],
                ['membershipId' => $locked->id],
                $request,
            );

            return $locked->fresh('user', 'role');
        });

        return ApiResponse::success($request, $updated);
    }

    public function destroy(
        Request $request,
        string $organization,
        string $membership,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->membership($request, $membership);
        DB::transaction(function () use ($request, $model, $recorder): void {
            $locked = OrganizationMembership::query()
                ->with('role')
                ->whereKey($model->id)
                ->lockForUpdate()
                ->firstOrFail();
            $this->protectLastOwner($locked, 'member', 'removed');
            $locked->delete();
            $recorder->record(
                'membership.removed',
                'organization_membership',
                $locked->id,
                $locked->organization_id,
                $request->user()->id,
                ['removedUserId' => $locked->user_id],
                ['membershipId' => $locked->id],
                $request,
            );
        });

        return ApiResponse::success($request, ['deleted' => true]);
    }

    private function protectLastOwner(
        OrganizationMembership $membership,
        string $newRole,
        string $newStatus,
    ): void {
        if ($membership->role->name !== 'organization_owner'
            || ($newRole === 'organization_owner' && $newStatus === 'active')) {
            return;
        }
        $otherOwners = OrganizationMembership::query()
            ->where('organization_id', $membership->organization_id)
            ->whereKeyNot($membership->id)
            ->where('status', 'active')
            ->whereHas('role', fn ($query) => $query->where(
                'name',
                'organization_owner',
            ))
            ->exists();
        if (! $otherOwners) {
            throw new ApiException(
                'LAST_OWNER_REQUIRED',
                'Assign another active owner before changing or removing this owner.',
                409,
            );
        }
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function membership(
        Request $request,
        string $id,
    ): OrganizationMembership {
        $model = OrganizationMembership::query()
            ->with('role')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $id)
            ->first();
        if (! $model) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Membership not found.',
                404,
            );
        }

        return $model;
    }
}
