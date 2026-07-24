<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function platform(Request $request): JsonResponse
    {
        $items = AuditLog::query()
            ->when(
                $request->filled('organizationId'),
                fn ($query) => $query->where(
                    'organization_id',
                    $request->string('organizationId'),
                ),
            )
            ->when(
                $request->filled('action'),
                fn ($query) => $query->where('action', $request->string('action')),
            )
            ->latest('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function organization(Request $request): JsonResponse
    {
        $organization = $request->attributes->get('active_organization');
        $items = AuditLog::query()
            ->where('organization_id', $organization->id)
            ->when(
                $request->filled('action'),
                fn ($query) => $query->where('action', $request->string('action')),
            )
            ->latest('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }
}
