<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminSubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = OrganizationSubscription::query()
            ->with('organization:id,name,slug,type,status', 'plan:id,code,name,currency,monthly_price_minor,yearly_price_minor')
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->latest('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function requestActivation(
        Request $request,
        string $organization,
        OperationRecorder $recorder,
    ): JsonResponse {
        $validated = $request->validate([
            'planCode' => ['required', 'string', Rule::exists('plans', 'code')],
            'billingInterval' => ['required', Rule::in(['monthly', 'yearly'])],
            'activationNote' => ['nullable', 'string', 'max:2000'],
            'paymentProofReference' => ['nullable', 'string', 'max:500'],
        ]);
        $model = Organization::query()->findOrFail($organization);
        $plan = Plan::query()->where('code', $validated['planCode'])->firstOrFail();
        $subscription = OrganizationSubscription::query()->create([
            'organization_id' => $model->id,
            'plan_id' => $plan->id,
            'status' => 'pending_activation',
            'billing_interval' => $validated['billingInterval'],
            'activation_note' => $validated['activationNote'] ?? null,
            'payment_proof_reference' => $validated['paymentProofReference'] ?? null,
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);
        $recorder->record(
            'subscription.activation_requested',
            'organization_subscription',
            $subscription->id,
            $model->id,
            $request->user()->id,
            ['planCode' => $plan->code],
            ['subscriptionId' => $subscription->id],
            $request,
        );

        return ApiResponse::success($request, $subscription->load('organization', 'plan'), status: 201);
    }

    public function approve(
        Request $request,
        string $subscription,
        OperationRecorder $recorder,
    ): JsonResponse {
        $validated = $request->validate([
            'periodMonths' => ['nullable', 'integer', 'min:1', 'max:36'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);
        $model = OrganizationSubscription::query()
            ->with('organization', 'plan')
            ->findOrFail($subscription);

        $startsAt = now();
        $endsAt = now()->addMonths($validated['periodMonths'] ?? (
            $model->billing_interval === 'yearly' ? 12 : 1
        ));
        $model->forceFill([
            'status' => 'active',
            'activation_note' => $validated['note'] ?? $model->activation_note,
            'trial_ends_at' => null,
            'current_period_starts_at' => $startsAt,
            'current_period_ends_at' => $endsAt,
            'grace_ends_at' => null,
            'cancelled_at' => null,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ])->save();
        $model->organization?->forceFill(['status' => 'active'])->save();
        $recorder->record(
            'subscription.approved',
            'organization_subscription',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['periodEndsAt' => $model->current_period_ends_at],
            ['subscriptionId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh('organization', 'plan'));
    }

    public function reject(
        Request $request,
        string $subscription,
        OperationRecorder $recorder,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);
        $model = OrganizationSubscription::query()
            ->with('organization', 'plan')
            ->findOrFail($subscription);
        $model->forceFill([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $validated['reason'],
            'approved_by' => null,
            'approved_at' => null,
        ])->save();
        $recorder->record(
            'subscription.rejected',
            'organization_subscription',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['reason' => $validated['reason']],
            ['subscriptionId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh('organization', 'plan'));
    }

    public function suspendWorkspace(
        Request $request,
        string $organization,
        OperationRecorder $recorder,
    ): JsonResponse {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);
        $model = Organization::query()->findOrFail($organization);
        if ($model->status === 'suspended') {
            throw new ApiException('ORGANIZATION_ALREADY_SUSPENDED', 'Workspace is already suspended.', 409);
        }
        $model->forceFill(['status' => 'suspended'])->save();
        $recorder->record(
            'organization.suspended',
            'organization',
            $model->id,
            $model->id,
            $request->user()->id,
            ['reason' => $validated['reason'] ?? null],
            ['organizationId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model);
    }

    public function activateWorkspace(
        Request $request,
        string $organization,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = Organization::query()->findOrFail($organization);
        $model->forceFill(['status' => 'active'])->save();
        $recorder->record(
            'organization.activated',
            'organization',
            $model->id,
            $model->id,
            $request->user()->id,
            [],
            ['organizationId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model);
    }
}
