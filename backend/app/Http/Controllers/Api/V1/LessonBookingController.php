<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Instructor;
use App\Models\InstructorAvailabilitySlot;
use App\Models\LessonBooking;
use App\Models\Organization;
use App\Services\Bookings\LessonBookingService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LessonBookingController extends Controller
{
    public function publicInstructors(Request $request): JsonResponse
    {
        $items = Instructor::query()
            ->with(['availabilitySlots' => fn ($query) => $query
                ->where('status', 'open')
                ->where('starts_at', '>', now())
                ->orderBy('starts_at')])
            ->where('status', 'active')
            ->whereHas('organization', fn ($query) => $query
                ->where('status', 'active')
                ->whereHas('subscriptions', fn ($subscription) => $subscription
                    ->currentlyAccessible()
                    ->whereHas('plan.modules', fn ($module) => $module
                        ->where('module', 'courses')
                        ->where('enabled', true))))
            ->whereHas('organization.academyProfile', fn ($query) => $query->where('is_public', true)->where('verification_status', 'verified'))
            ->orderBy('name')
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function slots(Request $request): JsonResponse
    {
        $items = InstructorAvailabilitySlot::query()
            ->with('instructor:id,name,name_ar')
            ->where('organization_id', $this->organization($request)->id)
            ->orderBy('starts_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), ['total' => $items->total()]);
    }

    public function createSlot(Request $request): JsonResponse
    {
        $organization = $this->organization($request);
        $data = $request->validate([
            'instructorId' => ['required', 'uuid', Rule::exists('instructors', 'id')->where('organization_id', $organization->id)],
            'startsAt' => ['required', 'date', 'after:now'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'deliveryType' => ['required', Rule::in(['online', 'onsite'])],
            'location' => ['nullable', 'string', 'max:500'],
            'priceMinor' => ['required', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
        ]);

        return ApiResponse::success($request, InstructorAvailabilitySlot::query()->create([
            'organization_id' => $organization->id,
            'instructor_id' => $data['instructorId'],
            'starts_at' => $data['startsAt'],
            'ends_at' => $data['endsAt'],
            'delivery_type' => $data['deliveryType'],
            'location' => $data['location'] ?? null,
            'price_minor' => $data['priceMinor'],
            'currency' => strtoupper($data['currency'] ?? 'EGP'),
            'status' => 'open',
        ]), status: 201);
    }

    public function reserve(Request $request, LessonBookingService $service): JsonResponse
    {
        $data = $request->validate([
            'slotId' => ['required', 'uuid'],
            'subject' => ['required', 'string', 'max:120'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        return ApiResponse::success($request, $service->reserve($request->user(), $data['slotId'], $data['subject'], $data['note'] ?? null), status: 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $items = LessonBooking::query()
            ->with('instructor', 'slot')
            ->where('student_id', $request->user()->id)
            ->latest()
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), ['total' => $items->total()]);
    }

    public function cancel(Request $request, string $booking): JsonResponse
    {
        $model = LessonBooking::query()
            ->with('slot')
            ->where('student_id', $request->user()->id)
            ->where('id', $booking)
            ->first();
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Lesson booking not found.', 404);
        }
        if ($model->status !== 'confirmed' || $model->slot->starts_at->lte(now()->addHours(2))) {
            throw new ApiException('BOOKING_NOT_CANCELLABLE', 'This lesson can no longer be cancelled online.', 409);
        }

        DB::transaction(function () use ($model): void {
            $model->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            $model->slot()->update(['status' => 'open']);
        });

        return ApiResponse::success($request, $model->fresh('instructor', 'slot'));
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}
