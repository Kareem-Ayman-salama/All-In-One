<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreSupportRequest;
use App\Http\Requests\Support\StoreTrialLeadRequest;
use App\Models\SupportRequest as SupportTicket;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function trialLead(StoreTrialLeadRequest $request): JsonResponse
    {
        $data = $request->validated();
        $ticket = SupportTicket::query()->create([
            'organization_id' => null,
            'user_id' => null,
            'name' => $data['name'],
            'email' => mb_strtolower(trim($data['email'])),
            'subject' => 'One-month trial lead',
            'message' => collect([
                "Phone / WhatsApp: {$data['phone']}",
                "Organization: {$data['organization']}",
                "Business type: {$data['type']}",
                'Expected students: '.($data['students'] ?? 'Not provided'),
                'Protected content: '.($data['content'] ?? 'Not provided'),
            ])->implode(PHP_EOL),
            'priority' => 'high',
            'status' => 'open',
        ]);

        return ApiResponse::success($request, [
            'id' => $ticket->id,
            'status' => $ticket->status,
            'message' => 'Your trial request has been received.',
        ], status: 201);
    }

    public function store(StoreSupportRequest $request): JsonResponse
    {
        $ticket = SupportTicket::query()->create([
            'organization_id' => null,
            'user_id' => $request->user()?->id,
            'name' => $request->validated('name'),
            'email' => mb_strtolower(trim($request->validated('email'))),
            'subject' => $request->validated('subject'),
            'message' => $request->validated('message'),
            'priority' => $request->validated('priority', 'normal'),
            'status' => 'open',
        ]);

        return ApiResponse::success($request, [
            'id' => $ticket->id,
            'status' => $ticket->status,
            'message' => 'Your support request has been received.',
        ], status: 201);
    }

    public function index(Request $request): JsonResponse
    {
        $items = SupportTicket::query()
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
}
