<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Bookings\CreateBookingRequest;
use App\Http\Requests\Bookings\UpdateBookingDecisionRequest;
use App\Models\Booking;
use App\Models\Organization;
use App\Services\Bookings\BookingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function reserve(
        CreateBookingRequest $request,
        BookingService $service,
    ): JsonResponse {
        $booking = $service->reserve(
            $request->user(),
            $request->validated(),
            $request,
        );

        return ApiResponse::success($request, [
            'booking' => $booking,
            'next' => "/booking/success?bookingId={$booking->id}",
        ], status: 201);
    }

    public function index(Request $request): JsonResponse
    {
        $items = Booking::query()
            ->with('course:id,title,title_ar,slug', 'batch:id,title,title_ar,start_date')
            ->where('organization_id', $this->organization($request)->id)
            ->when(
                $request->filled('courseId'),
                fn ($query) => $query->where(
                    'course_id',
                    $request->string('courseId'),
                ),
            )
            ->when(
                $request->filled('batchId'),
                fn ($query) => $query->where(
                    'batch_id',
                    $request->string('batchId'),
                ),
            )
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->when(
                $request->filled('paymentStatus'),
                fn ($query) => $query->where(
                    'payment_status',
                    $request->string('paymentStatus'),
                ),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function confirm(
        UpdateBookingDecisionRequest $request,
        string $organization,
        string $booking,
        BookingService $service,
    ): JsonResponse {
        $model = $service->confirm(
            $this->booking($request, $booking),
            $request->user(),
            $request->boolean('markAsPaid'),
            $request->validated('internalNote'),
            $request,
        );

        return ApiResponse::success($request, $model);
    }

    public function reject(
        UpdateBookingDecisionRequest $request,
        string $organization,
        string $booking,
        BookingService $service,
    ): JsonResponse {
        return ApiResponse::success($request, $service->reject(
            $this->booking($request, $booking),
            $request->user(),
            $request->validated('internalNote'),
            $request,
        ));
    }

    public function cancel(
        UpdateBookingDecisionRequest $request,
        string $organization,
        string $booking,
        BookingService $service,
    ): JsonResponse {
        return ApiResponse::success($request, $service->cancel(
            $this->booking($request, $booking),
            $request->user(),
            $request->validated('internalNote'),
            $request,
        ));
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function booking(Request $request, string $id): Booking
    {
        $model = Booking::query()
            ->where('organization_id', $this->organization($request)->id)
            ->where('id', $id)
            ->first();
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Booking not found.', 404);
        }

        return $model;
    }
}
