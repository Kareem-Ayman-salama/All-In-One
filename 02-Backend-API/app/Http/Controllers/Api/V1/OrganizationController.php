<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Organizations\CreateOrganizationRequest;
use App\Http\Requests\Organizations\UpdateOrganizationRequest;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use App\Services\Organizations\OrganizationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class OrganizationController extends Controller
{
    public function store(
        CreateOrganizationRequest $request,
        OrganizationService $service,
    ): JsonResponse {
        $organization = $service->create(
            $request->user(),
            $request->validated(),
            $request,
        );

        return ApiResponse::success($request, [
            'organization' => $organization,
            'next' => "/app/{$organization->slug}",
        ], status: 201);
    }

    public function update(
        UpdateOrganizationRequest $request,
        string $organization,
        OperationRecorder $recorder,
    ): JsonResponse {
        /** @var Organization $model */
        $model = $request->attributes->get('active_organization');
        $validated = $request->validated();
        $model->fill([
            'name' => $validated['name'] ?? $model->name,
            'bio' => array_key_exists('bio', $validated)
                ? $validated['bio']
                : $model->bio,
            'brand_color' => array_key_exists('brandColor', $validated)
                ? $validated['brandColor']
                : $model->brand_color,
            'locale' => $validated['locale'] ?? $model->locale,
            'timezone' => $validated['timezone'] ?? $model->timezone,
        ])->save();
        $recorder->record(
            'organization.updated',
            'organization',
            $model->id,
            $model->id,
            $request->user()->id,
            ['changed' => array_keys($validated)],
            ['organizationId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }
}
