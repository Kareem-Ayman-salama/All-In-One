<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Instructors\StoreInstructorRequest;
use App\Models\Instructor;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Instructor::query()
            ->withCount('courses')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->orderBy('name')
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StoreInstructorRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $instructor = Instructor::query()->create(
            $this->attributes($request, $organization),
        );
        $recorder->record(
            'instructor.created',
            'instructor',
            $instructor->id,
            $organization->id,
            $request->user()->id,
            ['name' => $instructor->name],
            ['instructorId' => $instructor->id],
            $request,
        );

        return ApiResponse::success($request, $instructor, status: 201);
    }

    public function update(
        StoreInstructorRequest $request,
        string $organization,
        string $instructor,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->instructor($request, $instructor);
        $model->update($this->attributes(
            $request,
            $this->organization($request),
        ));
        $recorder->record(
            'instructor.updated',
            'instructor',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['instructorId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(
        StoreInstructorRequest $request,
        Organization $organization,
    ): array {
        return [
            'organization_id' => $organization->id,
            'user_id' => $request->validated('userId'),
            'name' => $request->validated('name'),
            'name_ar' => $request->validated('nameAr'),
            'bio' => $request->validated('bio'),
            'bio_ar' => $request->validated('bioAr'),
            'specialties' => $request->validated('specialties', []),
            'social_links' => $request->validated('socialLinks', []),
            'status' => $request->validated('status', 'active'),
        ];
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function instructor(Request $request, string $id): Instructor
    {
        $model = Instructor::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $id)
            ->first();
        if (! $model) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Instructor not found.',
                404,
            );
        }

        return $model;
    }
}
