<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Task;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Task::query()
            ->with('room:id,name', 'assignee:id,name,email')
            ->where('organization_id', $this->organization($request)->id)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->when($request->boolean('mine'), fn ($query) => $query->where('assigned_to', $request->user()->id))
            ->orderByRaw('due_at IS NULL')
            ->orderBy('due_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $organization = $this->organization($request);
        $data = $this->validateTask($request, $organization);
        $task = Task::query()->create($data + [
            'organization_id' => $organization->id,
            'created_by' => $request->user()->id,
        ]);
        $recorder->record('task.created', 'task', $task->id, $organization->id, $request->user()->id, [], ['taskId' => $task->id], $request);

        return ApiResponse::success($request, $task->load('room', 'assignee'), status: 201);
    }

    public function update(Request $request, string $organization, string $task, OperationRecorder $recorder): JsonResponse
    {
        $model = $this->task($request, $task);
        $model->update($this->validateTask($request, $this->organization($request), true));
        $recorder->record('task.updated', 'task', $model->id, $model->organization_id, $request->user()->id, [], ['taskId' => $model->id], $request);

        return ApiResponse::success($request, $model->fresh('room', 'assignee'));
    }

    public function destroy(Request $request, string $organization, string $task, OperationRecorder $recorder): JsonResponse
    {
        $model = $this->task($request, $task);
        $model->delete();
        $recorder->record('task.deleted', 'task', $model->id, $model->organization_id, $request->user()->id, [], ['taskId' => $model->id], $request);

        return ApiResponse::success($request, ['deleted' => true]);
    }

    private function validateTask(Request $request, Organization $organization, bool $partial = false): array
    {
        $validated = $request->validate([
            'roomId' => ['nullable', 'uuid', Rule::exists('rooms', 'id')->where('organization_id', $organization->id)],
            'assignedTo' => ['nullable', 'uuid', Rule::exists('organization_memberships', 'user_id')->where('organization_id', $organization->id)->where('status', 'active')],
            'title' => [$partial ? 'sometimes' : 'required', 'string', 'min:2', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'dueAt' => ['nullable', 'date'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['nullable', Rule::in(['todo', 'in_progress', 'done', 'cancelled'])],
            'progress' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $attributes = [];
        $fieldMap = [
            'roomId' => 'room_id',
            'assignedTo' => 'assigned_to',
            'title' => 'title',
            'titleAr' => 'title_ar',
            'description' => 'description',
            'dueAt' => 'due_at',
            'priority' => 'priority',
            'status' => 'status',
            'progress' => 'progress',
        ];
        foreach ($fieldMap as $input => $column) {
            if (array_key_exists($input, $validated)) {
                $attributes[$column] = $validated[$input];
            }
        }

        return $attributes;
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function task(Request $request, string $id): Task
    {
        $task = Task::query()->where('organization_id', $this->organization($request)->id)->find($id);
        if (! $task) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Task not found.', 404);
        }

        return $task;
    }
}
