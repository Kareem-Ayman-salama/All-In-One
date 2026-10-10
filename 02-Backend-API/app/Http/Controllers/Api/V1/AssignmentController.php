<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $org = $this->organization($request);
        $user = $request->user();

        $items = Assignment::query()
            ->with(['room:id,name', 'course:id,title,title_ar', 'creator:id,name'])
            ->withCount('submissions')
            ->where('organization_id', $org->id)
            ->when($request->filled('roomId'), fn ($q) => $q->where('room_id', $request->string('roomId')))
            ->when($request->filled('courseId'), fn ($q) => $q->where('course_id', $request->string('courseId')))
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        // Attach current user submission if available
        $assignmentIds = collect($items->items())->pluck('id');
        $mySubmissions = AssignmentSubmission::query()
            ->whereIn('assignment_id', $assignmentIds)
            ->where('student_id', $user->id)
            ->get()
            ->keyBy('assignment_id');

        $data = collect($items->items())->map(function (Assignment $assignment) use ($mySubmissions) {
            $array = $assignment->toArray();
            $array['mySubmission'] = $mySubmissions->get($assignment->id);

            return $array;
        });

        return ApiResponse::success($request, $data, [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);
        $validated = $this->validateAssignment($request, $org);

        $assignment = Assignment::query()->create($validated + [
            'organization_id' => $org->id,
            'created_by' => $request->user()->id,
        ]);

        $recorder->record('assignment.created', 'assignment', $assignment->id, $org->id, $request->user()->id, [], ['assignmentId' => $assignment->id], $request);

        return ApiResponse::success($request, $assignment->load(['room', 'course', 'creator']), status: 201);
    }

    public function show(Request $request, string $organization, string $assignment): JsonResponse
    {
        $model = $this->assignment($request, $assignment);
        $model->load(['room', 'course', 'creator']);
        $model->loadCount('submissions');

        $submission = AssignmentSubmission::query()
            ->where('assignment_id', $model->id)
            ->where('student_id', $request->user()->id)
            ->first();

        $data = $model->toArray();
        $data['mySubmission'] = $submission;

        return ApiResponse::success($request, $data);
    }

    public function update(Request $request, string $organization, string $assignment, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);
        $model = $this->assignment($request, $assignment);
        $validated = $this->validateAssignment($request, $org, true);

        $model->update($validated);
        $recorder->record('assignment.updated', 'assignment', $model->id, $org->id, $request->user()->id, [], ['assignmentId' => $model->id], $request);

        return ApiResponse::success($request, $model->fresh(['room', 'course', 'creator']));
    }

    public function destroy(Request $request, string $organization, string $assignment, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);
        $model = $this->assignment($request, $assignment);
        $model->delete();

        $recorder->record('assignment.deleted', 'assignment', $model->id, $org->id, $request->user()->id, [], ['assignmentId' => $model->id], $request);

        return ApiResponse::success($request, ['deleted' => true]);
    }

    public function submissions(Request $request, string $organization, string $assignment): JsonResponse
    {
        $model = $this->assignment($request, $assignment);

        $submissions = AssignmentSubmission::query()
            ->with(['student:id,name,email', 'grader:id,name'])
            ->where('assignment_id', $model->id)
            ->orderByDesc('submitted_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $submissions->items(), [
            'currentPage' => $submissions->currentPage(),
            'lastPage' => $submissions->lastPage(),
            'total' => $submissions->total(),
        ]);
    }

    public function grade(Request $request, string $organization, string $assignment, string $submission, OperationRecorder $recorder): JsonResponse
    {
        $model = $this->assignment($request, $assignment);
        $sub = AssignmentSubmission::query()
            ->where('assignment_id', $model->id)
            ->where('id', $submission)
            ->first();

        if (! $sub) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Submission not found.', 404);
        }

        $validated = $request->validate([
            'score' => ['required', 'integer', 'min:0', "max:{$model->max_score}"],
            'feedback' => ['nullable', 'string', 'max:2000'],
        ]);

        $sub->update([
            'score' => $validated['score'],
            'feedback' => $validated['feedback'] ?? null,
            'status' => 'graded',
            'graded_by' => $request->user()->id,
            'graded_at' => now(),
        ]);

        $recorder->record('assignment.graded', 'assignment_submission', $sub->id, $model->organization_id, $request->user()->id, [], ['score' => $sub->score], $request);

        return ApiResponse::success($request, $sub->fresh(['student:id,name,email', 'grader:id,name']));
    }

    // Student specific API
    public function studentIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Assignment::query()
            ->with(['room:id,name', 'course:id,title,title_ar'])
            ->where('status', 'published')
            ->when($request->filled('roomId'), fn ($q) => $q->where('room_id', $request->string('roomId')))
            ->when($request->filled('courseId'), fn ($q) => $q->where('course_id', $request->string('courseId')))
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at');

        $assignments = $query->paginate(min($request->integer('perPage', 50), 100));

        $assignmentIds = collect($assignments->items())->pluck('id');
        $submissions = AssignmentSubmission::query()
            ->whereIn('assignment_id', $assignmentIds)
            ->where('student_id', $user->id)
            ->get()
            ->keyBy('assignment_id');

        $data = collect($assignments->items())->map(function (Assignment $assignment) use ($submissions) {
            $array = $assignment->toArray();
            $array['mySubmission'] = $submissions->get($assignment->id);

            return $array;
        });

        return ApiResponse::success($request, $data, [
            'currentPage' => $assignments->currentPage(),
            'lastPage' => $assignments->lastPage(),
            'total' => $assignments->total(),
        ]);
    }

    public function submit(Request $request, string $assignment, OperationRecorder $recorder): JsonResponse
    {
        $user = $request->user();
        $model = Assignment::query()->where('status', '!=', 'closed')->find($assignment);

        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Assignment not found or closed.', 404);
        }

        $validated = $request->validate([
            'submissionText' => ['nullable', 'string', 'max:5000'],
            'attachmentUrl' => ['nullable', 'string', 'url', 'max:1000'],
            'fileName' => ['nullable', 'string', 'max:255'],
        ]);

        if (empty($validated['submissionText']) && empty($validated['attachmentUrl'])) {
            throw new ApiException('VALIDATION_ERROR', 'You must provide submission text or an attachment file.', 422);
        }

        $isLate = $model->due_at && now()->isAfter($model->due_at);

        $submission = AssignmentSubmission::query()->updateOrCreate(
            [
                'assignment_id' => $model->id,
                'student_id' => $user->id,
            ],
            [
                'organization_id' => $model->organization_id,
                'submission_text' => $validated['submissionText'] ?? null,
                'attachment_url' => $validated['attachmentUrl'] ?? null,
                'file_name' => $validated['fileName'] ?? null,
                'status' => $isLate ? 'late' : 'submitted',
                'submitted_at' => now(),
            ]
        );

        $recorder->record('assignment.submitted', 'assignment_submission', $submission->id, $model->organization_id, $user->id, [], ['isLate' => $isLate], $request);

        return ApiResponse::success($request, $submission, status: 200);
    }

    private function validateAssignment(Request $request, Organization $organization, bool $partial = false): array
    {
        $validated = $request->validate([
            'roomId' => ['nullable', 'uuid', Rule::exists('rooms', 'id')->where('organization_id', $organization->id)],
            'courseId' => ['nullable', 'uuid', Rule::exists('courses', 'id')->where('organization_id', $organization->id)],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'min:2', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'dueAt' => ['nullable', 'date'],
            'maxScore' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'allowedFileTypes' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['draft', 'published', 'closed'])],
        ]);

        $map = [
            'roomId' => 'room_id',
            'courseId' => 'course_id',
            'title' => 'title',
            'titleAr' => 'title_ar',
            'description' => 'description',
            'dueAt' => 'due_at',
            'maxScore' => 'max_score',
            'allowedFileTypes' => 'allowed_file_types',
            'status' => 'status',
        ];

        $attributes = [];
        foreach ($map as $reqKey => $col) {
            if (array_key_exists($reqKey, $validated)) {
                $attributes[$col] = $validated[$reqKey];
            }
        }

        return $attributes;
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function assignment(Request $request, string $id): Assignment
    {
        $assignment = Assignment::query()
            ->where('organization_id', $this->organization($request)->id)
            ->find($id);

        if (! $assignment) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Assignment not found.', 404);
        }

        return $assignment;
    }
}
