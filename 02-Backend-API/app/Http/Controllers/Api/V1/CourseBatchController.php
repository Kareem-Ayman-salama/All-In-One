<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Batches\StoreBatchRequest;
use App\Http\Requests\Batches\UpdateBatchRequest;
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
        $batch = CourseBatch::query()->create($this->attributes($request) + [
            'organization_id' => $organization->id,
            'reserved_seats' => 0,
            'confirmed_seats' => 0,
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

    public function update(
        UpdateBatchRequest $request,
        string $organization,
        string $batch,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = $this->batch($request, $batch);
        $model->fill($this->attributes($request, partial: true))->save();
        $recorder->record(
            'batch.updated',
            'course_batch',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            ['changed' => array_keys($request->validated())],
            ['batchId' => $model->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $model->fresh()->load('course', 'room'),
        );
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function batch(Request $request, string $identifier): CourseBatch
    {
        return CourseBatch::query()
            ->with('course:id,title,title_ar,slug', 'room:id,name,slug')
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $identifier)
            ->first() ?? throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Batch not found.',
                404,
            );
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(
        StoreBatchRequest|UpdateBatchRequest $request,
        bool $partial = false,
    ): array {
        $validated = $request->validated();
        $map = [
            'courseId' => 'course_id',
            'roomId' => 'room_id',
            'title' => 'title',
            'titleAr' => 'title_ar',
            'startDate' => 'start_date',
            'endDate' => 'end_date',
            'schedule' => 'schedule',
            'deliveryType' => 'delivery_type',
            'capacity' => 'capacity',
            'location' => 'location',
            'meetingReference' => 'meeting_reference',
            'enrollmentStartsAt' => 'enrollment_starts_at',
            'enrollmentEndsAt' => 'enrollment_ends_at',
            'status' => 'status',
        ];

        $attributes = [];
        foreach ($map as $input => $column) {
            if (! $partial || array_key_exists($input, $validated)) {
                $attributes[$column] = $validated[$input] ?? null;
            }
        }
        if (! $partial && ! array_key_exists('status', $validated)) {
            $attributes['status'] = 'draft';
        }

        return $attributes;
    }
}
