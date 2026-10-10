<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Organization;
use App\Models\User;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isOrgAdmin = $request->attributes->has('active_organization');

        $query = Certificate::query()->with([
            'course:id,title,title_ar,cover_image_url',
            'student:id,name,email',
            'organization:id,name,name_ar,logo_url',
        ]);

        if ($isOrgAdmin) {
            $org = $this->organization($request);
            $query->where('organization_id', $org->id);
            if ($request->filled('courseId')) {
                $query->where('course_id', $request->string('courseId'));
            }
            if ($request->filled('studentId')) {
                $query->where('student_id', $request->string('studentId'));
            }
        } else {
            $query->where('student_id', $user->id);
        }

        $items = $query->orderByDesc('issue_date')->paginate(min($request->integer('perPage', 30), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function generate(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);

        $validated = $request->validate([
            'courseId' => ['required', 'uuid', 'exists:courses,id'],
            'studentId' => ['required', 'uuid', 'exists:users,id'],
            'gradeScore' => ['nullable', 'integer', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $course = Course::query()->where('organization_id', $org->id)->findOrFail($validated['courseId']);
        $student = User::query()->findOrFail($validated['studentId']);

        // Check if certificate already exists
        $existing = Certificate::query()
            ->where('course_id', $course->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing) {
            return ApiResponse::success($request, $existing->load(['course', 'student', 'organization']), status: 200);
        }

        $verificationCode = 'CERT-'.strtoupper(Str::random(4)).'-'.strtoupper(Str::random(4));
        $certNumber = 'AIN-'.date('Y').'-'.strtoupper(Str::random(6));

        $certificate = Certificate::query()->create([
            'organization_id' => $org->id,
            'course_id' => $course->id,
            'student_id' => $student->id,
            'certificate_number' => $certNumber,
            'issue_date' => now()->toDateString(),
            'grade_score' => $validated['gradeScore'] ?? 95,
            'verification_code' => $verificationCode,
            'status' => 'issued',
            'metadata' => [
                'courseTitle' => $course->title,
                'courseTitleAr' => $course->title_ar,
                'studentName' => $student->name,
                'organizationName' => $org->name,
                'organizationNameAr' => $org->name_ar,
                'notes' => $validated['notes'] ?? null,
            ],
        ]);

        $recorder->record('certificate.issued', 'certificate', $certificate->id, $org->id, $request->user()->id, [], [
            'verificationCode' => $verificationCode,
        ], $request);

        return ApiResponse::success($request, $certificate->load(['course', 'student', 'organization']), status: 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $cert = Certificate::query()->with(['course', 'student', 'organization'])->findOrFail($id);

        $hasAccess = $user->hasRole('super_admin') ||
            $user->id === $cert->student_id ||
            $user->organizationMemberships()
                ->where('organization_id', $cert->organization_id)
                ->whereIn('role_id', function ($query) {
                    $query->select('id')->from('roles')
                        ->whereIn('name', ['organization_owner', 'organization_admin', 'staff', 'instructor']);
                })
                ->exists();

        if (! $hasAccess) {
            throw new ApiException('FORBIDDEN', 'You do not have access to view this certificate.', 403);
        }

        return ApiResponse::success($request, $cert);
    }

    /**
     * Public verification endpoint without authentication.
     * Anyone scanning the QR code or visiting this link can verify authenticity.
     */
    public function publicVerify(Request $request, string $code): JsonResponse
    {
        $cert = Certificate::query()
            ->with([
                'course:id,title,title_ar',
                'student:id,name',
                'organization:id,name,name_ar,logo_url',
            ])
            ->where('verification_code', strtoupper(trim($code)))
            ->first();

        if (! $cert) {
            return response()->json([
                'valid' => false,
                'message' => 'الشهادة غير موجودة أو غير مسجلة في النظام.',
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'certificate' => [
                'id' => $cert->id,
                'certificateNumber' => $cert->certificate_number,
                'verificationCode' => $cert->verification_code,
                'issueDate' => $cert->issue_date->toDateString(),
                'gradeScore' => $cert->grade_score,
                'status' => $cert->status,
                'studentName' => $cert->student?->name,
                'courseTitle' => $cert->course?->title_ar ?: $cert->course?->title,
                'organizationName' => $cert->organization?->name_ar ?: $cert->organization?->name,
                'organizationLogo' => $cert->organization?->logo_url,
            ],
        ]);
    }

    private function organization(Request $request): Organization
    {
        $org = $request->attributes->get('active_organization');
        if (! $org && $request->route('organization')) {
            $orgParam = $request->route('organization');
            $org = $orgParam instanceof Organization ? $orgParam : Organization::query()->where('id', $orgParam)->orWhere('slug', $orgParam)->first();
        }
        if (! $org && $request->header('X-Organization-Id')) {
            $org = Organization::query()->find($request->header('X-Organization-Id'));
        }
        if (! $org) {
            throw new ApiException('UNAUTHORIZED', 'Organization context required.', 403);
        }

        // Verify caller membership in the resolved organization (unless platform super_admin)
        $user = $request->user();
        if ($user && ! $user->hasRole('super_admin')) {
            $hasMembership = $user->organizationMemberships()
                ->where('organization_id', $org->id)
                ->where('status', 'active')
                ->exists();

            if (! $hasMembership) {
                throw new ApiException('TENANT_ACCESS_DENIED', 'You do not have access to this organization.', 403);
            }
        }

        return $org;
    }
}
