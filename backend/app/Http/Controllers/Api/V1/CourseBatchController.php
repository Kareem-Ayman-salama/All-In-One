<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Batches\StoreBatchRequest;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseBatchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = CourseBatch::query()
            ->with('course:id,title,title_ar,slug', 'room:id,name,slug')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('courseId'),
                fn ($query) => $query->where(
                    'course_id',
                    $request->string('courseId'),
                ),
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->orderBy('start_date')
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StoreBatchRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $batch = CourseBatch::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $request->validated('courseId'),
            'room_id' => $request->validated('roomId'),
            'title' => $request->validated('title'),
            'title_ar' => $request->validated('titleAr'),
            'start_date' => $request->validated('startDate'),
            'end_date' => $request->validated('endDate'),
            'schedule' => $request->validated('schedule'),
            'delivery_type' => $request->validated('deliveryType'),
            'capacity' => $request->validated('capacity'),
            'reserved_seats' => 0,
            'confirmed_seats' => 0,
            'location' => $request->validated('location'),
            'meeting_reference' => $request->validated('meetingReference'),
            'enrollment_starts_at' => $request->validated('enrollmentStartsAt'),
            'enrollment_ends_at' => $request->validated('enrollmentEndsAt'),
            'status' => $request->validated('status', 'draft'),
        ]);
        $recorder->record(
            'batch.created',
            'course_batch',
            $batch->id,
            $organization->id,
            $request->user()->id,
            ['courseId' => $batch->course_id, 'capacity' => $batch->capacity],
            ['batchId' => $batch->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $batch->load('course', 'room'),
            status: 201,
        );
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}
