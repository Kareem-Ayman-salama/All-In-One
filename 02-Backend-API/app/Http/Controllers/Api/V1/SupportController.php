<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Support\StoreSupportRequest;
use App\Http\Requests\Support\StoreTrialLeadRequest;
use App\Models\Organization;
use App\Models\SupportRequest as SupportTicket;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    public function trialLead(StoreTrialLeadRequest $request, OperationRecorder $recorder): JsonResponse
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

        $recorder->record(
            action: 'lead.trial_requested',
            entityType: 'SupportRequest',
            entityId: $ticket->id,
            organizationId: null,
            actorId: null,
            metadata: [
                'name' => $ticket->name,
                'email' => $ticket->email,
                'organization' => $data['organization'] ?? null,
                'phone' => $data['phone'] ?? null,
            ],
            payload: [
                'ticket_id' => $ticket->id,
                'type' => 'trial_lead',
                'notification_channel' => 'email_outbox',
            ],
            request: $request,
        );

        return ApiResponse::success($request, [
            'id' => $ticket->id,
            'status' => $ticket->status,
            'message' => 'Your trial request has been received.',
        ], status: 201);
    }

    public function store(StoreSupportRequest $request, OperationRecorder $recorder): JsonResponse
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

        $recorder->record(
            action: 'support.ticket_created',
            entityType: 'SupportRequest',
            entityId: $ticket->id,
            organizationId: null,
            actorId: $request->user()?->id,
            metadata: [
                'priority' => $ticket->priority,
                'email' => $ticket->email,
                'subject' => $ticket->subject,
            ],
            payload: [
                'ticket_id' => $ticket->id,
                'type' => 'support_ticket',
                'notification_channel' => 'email_outbox',
            ],
            request: $request,
        );

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

    public function updateStatus(Request $request, string $id, OperationRecorder $recorder): JsonResponse
    {
        $data = $request->validate([
            'status' => ['nullable', 'string', 'in:open,in_progress,resolved,closed'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'priority' => ['nullable', 'string', 'in:low,normal,high,urgent'],
            'assigned_to' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $ticket = SupportTicket::query()->findOrFail($id);

        $updates = [];
        if (array_key_exists('status', $data) && $data['status'] !== null) {
            $updates['status'] = $data['status'];
        }
        if (array_key_exists('notes', $data)) {
            $updates['notes'] = $data['notes'];
        }
        if (array_key_exists('priority', $data) && $data['priority'] !== null) {
            $updates['priority'] = $data['priority'];
        }
        if (array_key_exists('assigned_to', $data)) {
            $updates['assigned_to'] = $data['assigned_to'];
        }

        if (! empty($updates)) {
            $ticket->update($updates);

            $recorder->record(
                action: 'support.ticket_updated',
                entityType: 'SupportRequest',
                entityId: $ticket->id,
                organizationId: $ticket->organization_id,
                actorId: $request->user()?->id,
                metadata: $updates,
                payload: ['ticket_id' => $ticket->id],
                request: $request,
            );
        }

        return ApiResponse::success($request, $ticket->fresh());
    }

    public function organizationLeads(Request $request): JsonResponse
    {
        $organization = $this->organization($request);
        $items = SupportTicket::query()
            ->where('organization_id', $organization->id)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search').'%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('subject', 'like', $term);
                });
            })
            ->latest()
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'total' => $items->total(),
            'currentPage' => $items->currentPage(),
        ]);
    }

    public function storeOrganizationLead(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $organization = $this->organization($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'subject' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'priority' => ['nullable', 'string', 'in:low,normal,high,urgent'],
            'status' => ['nullable', 'string', 'in:lead,contacted,interested,booking,approved,enrolled,open,in_progress,resolved,closed'],
        ]);

        $messageParts = [];
        if (! empty($data['phone'])) {
            $messageParts[] = "Phone: {$data['phone']}";
        }
        if (! empty($data['notes'])) {
            $messageParts[] = "Initial Notes: {$data['notes']}";
        }
        $message = ! empty($messageParts) ? implode(PHP_EOL, $messageParts) : 'New prospective student inquiry.';

        $lead = SupportTicket::query()->create([
            'organization_id' => $organization->id,
            'user_id' => null,
            'name' => $data['name'],
            'email' => mb_strtolower(trim($data['email'])),
            'subject' => $data['subject'] ?? 'New Student Lead / Inquiry',
            'message' => $message,
            'notes' => $data['notes'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
            'status' => $data['status'] ?? 'lead',
        ]);

        $recorder->record(
            action: 'crm.lead_created',
            entityType: 'SupportRequest',
            entityId: $lead->id,
            organizationId: $organization->id,
            actorId: $request->user()?->id,
            metadata: ['email' => $lead->email, 'status' => $lead->status],
            payload: ['lead_id' => $lead->id],
            request: $request,
        );

        return ApiResponse::success($request, $lead, status: 201);
    }

    public function updateOrganizationLead(
        Request $request,
        OperationRecorder $recorder,
        mixed $organization = null,
        mixed $lead = null,
    ): JsonResponse {
        $org = $this->organization($request);
        $leadParam = $lead ?: ($request->route('lead') ?: $request->route('id'));
        $leadId = $leadParam instanceof SupportTicket ? $leadParam->id : (string) $leadParam;

        $leadTicket = SupportTicket::query()
            ->where('organization_id', $org->id)
            ->findOrFail($leadId);

        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'priority' => ['nullable', 'string', 'in:low,normal,high,urgent'],
            'assigned_to' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $leadTicket->update(array_filter($data, fn ($v) => $v !== null));

        $recorder->record(
            action: 'crm.lead_updated',
            entityType: 'SupportRequest',
            entityId: $leadTicket->id,
            organizationId: $org->id,
            actorId: $request->user()?->id,
            metadata: $data,
            payload: ['lead_id' => $leadTicket->id],
            request: $request,
        );

        return ApiResponse::success($request, $leadTicket->fresh());
    }

    public function convertOrganizationLead(
        Request $request,
        OperationRecorder $recorder,
        mixed $organization = null,
        mixed $lead = null,
    ): JsonResponse {
        $org = $this->organization($request);
        $leadParam = $lead ?: ($request->route('lead') ?: $request->route('id'));
        $leadId = $leadParam instanceof SupportTicket ? $leadParam->id : (string) $leadParam;

        $leadTicket = SupportTicket::query()
            ->where('organization_id', $org->id)
            ->findOrFail($leadId);

        $leadTicket->update([
            'status' => 'enrolled',
            'notes' => trim(($leadTicket->notes ? $leadTicket->notes.PHP_EOL : '').'['.now()->toDateTimeString().'] Converted to enrolled student.'),
        ]);

        $recorder->record(
            action: 'crm.lead_converted',
            entityType: 'SupportRequest',
            entityId: $leadTicket->id,
            organizationId: $org->id,
            actorId: $request->user()?->id,
            metadata: ['status' => 'enrolled'],
            payload: ['lead_id' => $leadTicket->id],
            request: $request,
        );

        return ApiResponse::success($request, [
            'lead' => $leadTicket->fresh(),
            'message' => 'Lead successfully converted to enrolled student.',
        ]);
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}
