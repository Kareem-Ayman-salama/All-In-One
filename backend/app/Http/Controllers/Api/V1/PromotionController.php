<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Promotions\StorePromotionRequest;
use App\Models\Organization;
use App\Models\Promotion;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Promotion::query()
            ->with('course:id,title,title_ar,slug')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(
        StorePromotionRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $promotion = Promotion::query()->create([
            'organization_id' => $organization->id,
            'course_id' => $request->validated('courseId'),
            'created_by' => $request->user()->id,
            'type' => $request->validated('type'),
            'placement' => $request->validated('placement'),
            'start_date' => $request->validated('startDate'),
            'end_date' => $request->validated('endDate'),
            'destination_url' => $request->validated('destinationUrl'),
            'status' => 'pending_approval',
            'payment_status' => 'unpaid',
            'price_minor' => 0,
            'currency' => 'EGP',
        ]);
        $recorder->record(
            'promotion.submitted',
            'promotion',
            $promotion->id,
            $organization->id,
            $request->user()->id,
            ['type' => $promotion->type, 'placement' => $promotion->placement],
            ['promotionId' => $promotion->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $promotion->load('course'),
            status: 201,
        );
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}
