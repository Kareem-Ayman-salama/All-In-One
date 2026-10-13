<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Providers\ReviewProviderApplicationRequest;
use App\Http\Requests\Providers\StoreProviderApplicationRequest;
use App\Models\ProviderApplication;
use App\Models\ProviderApplicationDocument;
use App\Services\Providers\ProviderApplicationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProviderApplicationController extends Controller
{
    public function mine(Request $request): JsonResponse
    {
        $application = ProviderApplication::query()
            ->with(['documents', 'organization:id,name,slug,status'])
            ->where('user_id', $request->user()->id)
            ->where('provider_type', 'independent_instructor')
            ->first();

        return ApiResponse::success($request, $application);
    }

    public function store(
        StoreProviderApplicationRequest $request,
        ProviderApplicationService $service,
    ): JsonResponse {
        $application = $service->submit(
            $request->user(),
            $request->validated(),
            $request->file('identityDocument'),
            $request->file('qualificationDocument'),
            $request,
        );

        return ApiResponse::success($request, $application, status: 201);
    }

    public function index(Request $request): JsonResponse
    {
        $items = ProviderApplication::query()
            ->with([
                'user:id,name,email,locale',
                'reviewer:id,name,email',
                'organization:id,name,slug,status',
                'documents',
            ])
            ->when(
                $request->filled('status')
                    && $request->string('status')->toString() !== 'all',
                fn ($query) => $query->where('status', $request->string('status')),
            )
            ->when(
                ! $request->filled('status'),
                fn ($query) => $query->where('status', ProviderApplication::STATUS_PENDING_REVIEW),
            )
            ->latest('submitted_at')
            ->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function approve(
        ReviewProviderApplicationRequest $request,
        ProviderApplication $providerApplication,
        ProviderApplicationService $service,
    ): JsonResponse {
        return ApiResponse::success(
            $request,
            $service->approve(
                $providerApplication,
                $request->user(),
                $request->validated('note'),
                $request,
            ),
        );
    }

    public function requestChanges(
        ReviewProviderApplicationRequest $request,
        ProviderApplication $providerApplication,
        ProviderApplicationService $service,
    ): JsonResponse {
        $note = trim((string) $request->validated('note'));
        if ($note === '') {
            throw new ApiException(
                'MODERATION_NOTE_REQUIRED',
                'A review note is required when requesting changes.',
                422,
            );
        }

        return ApiResponse::success(
            $request,
            $service->requestChanges(
                $providerApplication,
                $request->user(),
                $note,
                $request,
            ),
        );
    }

    public function reject(
        ReviewProviderApplicationRequest $request,
        ProviderApplication $providerApplication,
        ProviderApplicationService $service,
    ): JsonResponse {
        $note = trim((string) $request->validated('note'));
        if ($note === '') {
            throw new ApiException(
                'MODERATION_NOTE_REQUIRED',
                'A rejection reason is required.',
                422,
            );
        }

        return ApiResponse::success(
            $request,
            $service->reject(
                $providerApplication,
                $request->user(),
                $note,
                $request,
            ),
        );
    }

    public function document(
        Request $request,
        ProviderApplication $providerApplication,
        ProviderApplicationDocument $document,
    ): StreamedResponse {
        if ($document->provider_application_id !== $providerApplication->id) {
            throw new ApiException(
                'RESOURCE_NOT_FOUND',
                'Provider document not found.',
                404,
            );
        }
        if ($document->scan_status !== 'ready') {
            throw new ApiException(
                'FILE_SCAN_PENDING',
                'This document is not cleared for access.',
                423,
            );
        }

        return Storage::disk($document->disk)->download(
            $document->getRawOriginal('path'),
            $document->original_name,
            ['Content-Type' => $document->mime_type],
        );
    }
}
