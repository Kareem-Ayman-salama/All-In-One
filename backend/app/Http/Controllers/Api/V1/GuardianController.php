<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Guardians\LinkGuardianRequest;
use App\Models\AttendanceRecord;
use App\Models\GuardianStudentLink;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\Role;
use App\Models\User;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuardianController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = GuardianStudentLink::query()
            ->with('guardian:id,name,email', 'student:id,name,email')
            ->where('organization_id', $this->organization($request)->id)
            ->latest()
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'total' => $items->total(),
        ]);
    }

    public function link(
        LinkGuardianRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $organization = $this->organization($request);
        $email = mb_strtolower(trim($request->string('guardianEmail')->toString()));
        $guardian = User::query()->where('normalized_email', $email)->first();
        if (! $guardian || ! $guardian->email_verified_at) {
            throw new ApiException(
                'GUARDIAN_ACCOUNT_REQUIRED',
                'The guardian must create and verify an AIO account first.',
                422,
            );
        }
        if ($guardian->id === $request->validated('studentId')) {
            throw new ApiException(
                'GUARDIAN_STUDENT_CONFLICT',
                'A student cannot be their own guardian.',
                422,
            );
        }

        $link = DB::transaction(function () use (
            $request,
            $organization,
            $guardian,
        ): GuardianStudentLink {
            $role = Role::query()
                ->whereNull('organization_id')
                ->where('name', 'guardian')
                ->firstOrFail();
            $membership = OrganizationMembership::query()->firstOrCreate([
                'organization_id' => $organization->id,
                'user_id' => $guardian->id,
            ], [
                'role_id' => $role->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);
            if ($membership->status !== 'active') {
                $membership->update([
                    'status' => 'active',
                    'joined_at' => $membership->joined_at ?? now(),
                ]);
            }

            return GuardianStudentLink::query()->updateOrCreate([
                'organization_id' => $organization->id,
                'guardian_id' => $guardian->id,
                'student_id' => $request->validated('studentId'),
            ], [
                'linked_by' => $request->user()->id,
                'relationship' => $request->validated('relationship'),
                'status' => 'active',
                'can_view_notes' => $request->boolean('canViewNotes', true),
            ]);
        });

        $recorder->record(
            'guardian.linked',
            'guardian_student_link',
            $link->id,
            $organization->id,
            $request->user()->id,
            ['studentId' => $link->student_id, 'guardianId' => $link->guardian_id],
            ['guardianLinkId' => $link->id],
            $request,
        );

        return ApiResponse::success(
            $request,
            $link->load('guardian:id,name,email', 'student:id,name,email'),
            status: 201,
        );
    }

    public function unlink(
        Request $request,
        string $organization,
        string $link,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = GuardianStudentLink::query()
            ->where('organization_id', $this->organization($request)->id)
            ->find($link);
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Guardian link not found.', 404);
        }
        $model->update(['status' => 'revoked']);
        $recorder->record(
            'guardian.unlinked',
            'guardian_student_link',
            $model->id,
            $model->organization_id,
            $request->user()->id,
            [],
            ['guardianLinkId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function students(Request $request): JsonResponse
    {
        $items = GuardianStudentLink::query()
            ->with('student:id,name,email', 'organization:id,name,slug,logo_path')
            ->where('guardian_id', $request->user()->id)
            ->where('status', 'active')
            ->latest()
            ->get();

        return ApiResponse::success($request, $items);
    }

    public function attendance(
        Request $request,
        string $student,
    ): JsonResponse {
        $link = GuardianStudentLink::query()
            ->with('student:id,name,email')
            ->where('guardian_id', $request->user()->id)
            ->where('student_id', $student)
            ->where('status', 'active')
            ->first();
        if (! $link) {
            throw new ApiException(
                'GUARDIAN_ACCESS_DENIED',
                'You are not authorized to view this student.',
                403,
            );
        }

        $items = AttendanceRecord::query()
            ->with([
                'session.batch.course:id,title,title_ar',
                'session.instructor:id,name,name_ar',
                'markedBy:id,name',
            ])
            ->where('organization_id', $link->organization_id)
            ->where('student_id', $student)
            ->where('guardian_visible', true)
            ->latest('marked_at')
            ->paginate(min($request->integer('perPage', 50), 100));
        $counts = AttendanceRecord::query()
            ->where('organization_id', $link->organization_id)
            ->where('student_id', $student)
            ->where('guardian_visible', true)
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');
        $total = (int) $counts->sum();
        $attended = (int) ($counts['present'] ?? 0) + (int) ($counts['late'] ?? 0);
        $records = collect($items->items())->map(function (
            AttendanceRecord $record,
        ) use ($link): AttendanceRecord {
            if (! $link->can_view_notes) {
                $record->setAttribute('instructor_note', null);
                $record->setAttribute('excuse_reason', null);
            }

            return $record;
        })->values();

        return ApiResponse::success($request, [
            'student' => $link->student,
            'records' => $records,
            'summary' => [
                'total' => $total,
                'present' => (int) ($counts['present'] ?? 0),
                'absent' => (int) ($counts['absent'] ?? 0),
                'late' => (int) ($counts['late'] ?? 0),
                'excused' => (int) ($counts['excused'] ?? 0),
                'attendanceRate' => $total > 0
                    ? round(($attended / $total) * 100, 1)
                    : 0,
            ],
        ], ['total' => $items->total()]);
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }
}
