<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notifications\UpdateNotificationPreferencesRequest;
use App\Models\NotificationPreference;
use App\Models\OrganizationMembership;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $organizationId = $request->input('organizationId');
        $this->assertOrganizationAccess($request, $organizationId);
        $preference = NotificationPreference::query()->firstOrCreate([
            'user_id' => $request->user()->id,
            'organization_id' => $organizationId,
        ]);

        return ApiResponse::success($request, $preference);
    }

    public function update(
        UpdateNotificationPreferencesRequest $request,
    ): JsonResponse {
        $organizationId = $request->validated('organizationId');
        $this->assertOrganizationAccess($request, $organizationId);
        $preference = NotificationPreference::query()->updateOrCreate([
            'user_id' => $request->user()->id,
            'organization_id' => $organizationId,
        ], [
            'in_app_enabled' => $request->boolean('inAppEnabled'),
            'email_enabled' => $request->boolean('emailEnabled'),
            'push_enabled' => $request->boolean('pushEnabled'),
            'booking_updates' => $request->boolean('bookingUpdates'),
            'announcements' => $request->boolean('announcements'),
            'subscription_reminders' => $request->boolean('subscriptionReminders'),
        ]);

        return ApiResponse::success($request, $preference);
    }

    private function assertOrganizationAccess(
        Request $request,
        ?string $organizationId,
    ): void {
        if ($organizationId === null) {
            return;
        }
        $allowed = OrganizationMembership::query()
            ->where('organization_id', $organizationId)
            ->where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->exists();
        if (! $allowed) {
            throw new ApiException(
                'TENANT_ACCESS_DENIED',
                'You do not have access to this organization.',
                403,
            );
        }
    }
}
