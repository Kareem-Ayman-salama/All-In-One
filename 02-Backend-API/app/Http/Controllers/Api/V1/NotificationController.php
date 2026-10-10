<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Notification::query()
            ->where('user_id', $request->user()->id)
            ->when(
                $request->filled('organizationId'),
                fn ($query) => $query->where(
                    'organization_id',
                    $request->string('organizationId'),
                ),
            )
            ->when(
                $request->boolean('unreadOnly'),
                fn ($query) => $query->where('status', 'unread'),
            )
            ->latest()
            ->paginate(min($request->integer('perPage', 20), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
            'unreadCount' => Notification::query()
                ->where('user_id', $request->user()->id)
                ->where('status', 'unread')
                ->count(),
        ]);
    }

    public function markRead(
        Request $request,
        string $notification,
    ): JsonResponse {
        $model = Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('id', $notification)
            ->first();
        if (! $model) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Notification not found.',
                404,
            );
        }
        $model->update([
            'status' => 'read',
            'read_at' => $model->read_at ?? now(),
        ]);

        return ApiResponse::success($request, $model->fresh());
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = Notification::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'unread')
            ->update(['status' => 'read', 'read_at' => now()]);

        return ApiResponse::success($request, ['updated' => $updated]);
    }
}
