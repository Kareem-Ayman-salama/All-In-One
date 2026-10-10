<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academies\UpsertAcademyProfileRequest;
use App\Models\AcademyProfile;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademyProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success(
            $request,
            $this->organization($request)->academyProfile,
        );
    }

    public function upsert(
        UpsertAcademyProfileRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $profile = AcademyProfile::query()->updateOrCreate([
            'organization_id' => $organization->id,
        ], [
            'slug' => $request->validated('slug'),
            'public_name' => $request->validated('publicName'),
            'public_name_ar' => $request->validated('publicNameAr'),
            'description' => $request->validated('description'),
            'description_ar' => $request->validated('descriptionAr'),
            'phone' => $request->validated('phone'),
            'email' => $request->validated('email'),
            'website' => $request->validated('website'),
            'location' => $request->validated('location'),
            'branches' => $request->validated('branches', []),
            'delivery_methods' => $request->validated('deliveryMethods', []),
            'cancellation_policy' => $request->validated('cancellationPolicy'),
            'is_public' => $request->boolean('isPublic'),
        ]);
        $recorder->record(
            $profile->wasRecentlyCreated
                ? 'academy_profile.created'
                : 'academy_profile.updated',
            'academy_profile',
            $profile->id,
            $organization->id,
            $request->user()->id,
            ['isPublic' => $profile->is_public],
            ['academyProfileId' => $profile->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $profile,
            status: $profile->wasRecentlyCreated ? 201 : 200,
        );
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}
