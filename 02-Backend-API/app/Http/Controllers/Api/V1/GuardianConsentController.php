<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\GuardianConsent;
use App\Models\User;
use App\Services\Guardians\GuardianConsentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuardianConsentController extends Controller
{
    public function __construct(
        protected GuardianConsentService $consentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = GuardianConsent::query()
            ->with(['guardian:id,name,email', 'student:id,name,email', 'organization:id,name'])
            ->latest();

        // Filter based on user role
        if ($user->hasRole(['organization_owner', 'organization_admin'])) {
            $org = $this->organization($request);
            $query->where('organization_id', $org->id);
        } elseif ($user->hasRole('guardian')) {
            $query->where('guardian_id', $user->id);
        } else {
            // Student
            $query->where('student_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $items = $query->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'total' => $items->total(),
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
        ]);
    }

    public function show(Request $request, string $consent): JsonResponse
    {
        $user = $request->user();
        $model = GuardianConsent::query()
            ->with(['guardian:id,name,email', 'student:id,name,email', 'organization:id,name'])
            ->findOrFail($consent);

        $this->authorizeConsentAccess($user, $model);

        return ApiResponse::success($request, $model);
    }

    public function requestConsent(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'student_id' => ['required', 'uuid', 'exists:users,id'],
            'organization_id' => ['nullable', 'uuid', 'exists:organizations,id'],
            'terms_version' => ['nullable', 'string', 'max:64'],
            'verification_method' => ['nullable', 'string', 'in:otp,digital_signature,written_proof'],
        ]);

        $student = User::query()->findOrFail($validated['student_id']);

        $result = $this->consentService->requestConsent(
            guardian: $user,
            student: $student,
            organizationId: $validated['organization_id'] ?? null,
            termsVersion: $validated['terms_version'] ?? GuardianConsentService::DEFAULT_TERMS_VERSION,
            verificationMethod: $validated['verification_method'] ?? 'otp',
            request: $request,
        );

        return ApiResponse::success($request, $result, status: 201);
    }

    public function verifyOtp(Request $request, string $consent): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:10'],
        ]);

        $model = $this->consentService->verifyConsentWithOtp(
            guardian: $request->user(),
            consentId: $consent,
            otpCode: $validated['code'],
            request: $request,
        );

        return ApiResponse::success($request, $model);
    }

    public function revoke(Request $request, string $consent): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        $model = $this->consentService->revokeConsent(
            guardian: $request->user(),
            consentId: $consent,
            reason: $validated['reason'],
            request: $request,
        );

        return ApiResponse::success($request, $model);
    }

    public function renew(Request $request, string $consent): JsonResponse
    {
        $result = $this->consentService->renewConsent(
            guardian: $request->user(),
            consentId: $consent,
            request: $request,
        );

        return ApiResponse::success($request, $result);
    }

    public function studentStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $isMinor = $user->isMinor();
        $hasActiveConsent = $this->consentService->hasActiveConsent($user);
        $activeConsent = $this->consentService->getActiveConsent($user);

        return ApiResponse::success($request, [
            'userId' => $user->id,
            'isMinor' => $isMinor,
            'consentRequired' => $isMinor,
            'hasActiveConsent' => $hasActiveConsent,
            'activeConsent' => $activeConsent ? [
                'id' => $activeConsent->id,
                'status' => $activeConsent->status,
                'termsVersion' => $activeConsent->terms_version,
                'consentedAt' => $activeConsent->consented_at?->toIso8601String(),
                'expiresAt' => $activeConsent->expires_at?->toIso8601String(),
                'guardian' => $activeConsent->guardian ? [
                    'id' => $activeConsent->guardian->id,
                    'name' => $activeConsent->guardian->name,
                ] : null,
            ] : null,
        ]);
    }

    protected function authorizeConsentAccess(User $user, GuardianConsent $consent): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        if ($consent->guardian_id === $user->id || $consent->student_id === $user->id) {
            return;
        }

        if ($consent->organization_id && $user->belongsToOrganization($consent->organization_id) && $user->hasRole(['organization_owner', 'organization_admin'])) {
            return;
        }

        throw new ApiException('FORBIDDEN', 'You do not have permission to view this consent.', 403);
    }
}
