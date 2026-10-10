<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Organization;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isOrgAdmin = $request->attributes->has('active_organization');

        $query = Invoice::query()->with([
            'organization:id,name,name_ar,logo_url',
            'user:id,name,email,phone',
        ]);

        if ($isOrgAdmin) {
            $org = $this->organization($request);
            $query->where('organization_id', $org->id);
        } else {
            $query->where('user_id', $user->id);
        }

        $invoices = $query->orderByDesc('issued_at')->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $invoices->items(), [
            'currentPage' => $invoices->currentPage(),
            'lastPage' => $invoices->lastPage(),
            'total' => $invoices->total(),
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $invoice = Invoice::query()
            ->with(['organization', 'user', 'payment'])
            ->findOrFail($id);

        $isOrgAdmin = $request->attributes->has('active_organization');
        if (! $isOrgAdmin && $invoice->user_id !== $user->id) {
            throw new ApiException('UNAUTHORIZED', 'You cannot view this invoice.', 403);
        }

        return ApiResponse::success($request, $invoice);
    }

    private function organization(Request $request): Organization
    {
        $org = $request->attributes->get('active_organization');
        if (! $org) {
            throw new ApiException('UNAUTHORIZED', 'Organization context required.', 403);
        }

        return $org;
    }
}
