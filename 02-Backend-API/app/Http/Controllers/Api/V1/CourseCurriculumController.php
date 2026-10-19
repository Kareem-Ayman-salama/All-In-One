<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\LessonTemplate;
use App\Models\Organization;
use App\Models\QuestionBankCategory;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseCurriculumController extends Controller
{
    private const LESSON_TYPES = [
        'placeholder', 'video', 'pdf', 'written', 'examples', 'exercise',
        'quiz', 'homework', 'external_link', 'audio',
    ];

    public function index(Request $request, string $organization, string $course): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $courseModel->load([
            'modules.lessons' => fn ($query) => $query->with('contentItem:id,title,type,status,file_asset_id'),
        ]);

        return ApiResponse::success($request, [
            'course' => $courseModel,
            'modules' => $courseModel->modules,
            'lessonTemplate' => LessonTemplate::query()
                ->where('organization_id', $this->organization($request)->id)
                ->where('is_default', true)
                ->first(),
            'questionBankCategories' => QuestionBankCategory::query()
                ->where('organization_id', $this->organization($request)->id)
                ->where('active', true)
                ->orderBy('kind')
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function storeModule(Request $request, string $organization, string $course): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'titleAr' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:3000'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
        ]);

        $module = CourseModule::query()->create([
            'organization_id' => $courseModel->organization_id,
            'course_id' => $courseModel->id,
            'title' => $validated['title'],
            'title_ar' => $validated['titleAr'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sortOrder'] ?? ($courseModel->modules()->max('sort_order') + 1),
            'status' => $validated['status'] ?? 'draft',
        ]);

        return ApiResponse::success($request, $module, status: 201);
    }

    public function updateModule(Request $request, string $organization, string $course, string $module): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $moduleModel = $this->module($courseModel, $module);
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:160'],
            'titleAr' => ['sometimes', 'nullable', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'sortOrder' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
        ]);

        $moduleModel->fill($this->map($validated, [
            'title' => 'title', 'titleAr' => 'title_ar', 'description' => 'description',
            'sortOrder' => 'sort_order', 'status' => 'status',
        ]))->save();

        return ApiResponse::success($request, $moduleModel->fresh('lessons'));
    }

    public function destroyModule(Request $request, string $organization, string $course, string $module): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $this->module($courseModel, $module)->delete();

        return ApiResponse::success($request, ['deleted' => true]);
    }

    public function storeLesson(Request $request, string $organization, string $course): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $validated = $this->validateLesson($request, $courseModel);
        $status = $validated['status'] ?? 'draft';

        $lesson = CourseLesson::query()->create($this->lessonAttributes($validated) + [
            'organization_id' => $courseModel->organization_id,
            'course_id' => $courseModel->id,
            'created_by' => $request->user()->id,
            'status' => $status,
            'published_at' => $status === 'published' ? now() : null,
        ]);
        if ($lesson->content_item_id !== null) {
            ContentItem::query()->where('organization_id', $courseModel->organization_id)
                ->where('id', $lesson->content_item_id)->update(['status' => $status]);
        }

        return ApiResponse::success($request, $lesson->load('contentItem'), status: 201);
    }

    public function updateLesson(Request $request, string $organization, string $course, string $lesson): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $lessonModel = $this->lesson($courseModel, $lesson);
        $validated = $this->validateLesson($request, $courseModel, true);
        $attributes = $this->lessonAttributes($validated);

        if (array_key_exists('status', $validated)) {
            $attributes['published_at'] = $validated['status'] === 'published' ? now() : null;
        }

        $lessonModel->fill($attributes)->save();
        if (array_key_exists('status', $validated) && $lessonModel->content_item_id !== null) {
            ContentItem::query()->where('organization_id', $courseModel->organization_id)
                ->where('id', $lessonModel->content_item_id)->update(['status' => $validated['status']]);
        }

        return ApiResponse::success($request, $lessonModel->fresh('contentItem'));
    }

    public function destroyLesson(Request $request, string $organization, string $course, string $lesson): JsonResponse
    {
        $courseModel = $this->course($request, $course);
        $this->lesson($courseModel, $lesson)->delete();

        return ApiResponse::success($request, ['deleted' => true]);
    }

    /** @return array<string, mixed> */
    private function validateLesson(Request $request, Course $course, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'moduleId' => [
                $required, 'uuid',
                Rule::exists('course_modules', 'id')->where(
                    fn ($query) => $query->where('organization_id', $course->organization_id)
                        ->where('course_id', $course->id),
                ),
            ],
            'contentItemId' => [
                'sometimes', 'nullable', 'uuid',
                Rule::exists('content_items', 'id')->where(
                    fn ($query) => $query->where('organization_id', $course->organization_id)
                        ->whereNull('deleted_at'),
                ),
            ],
            'title' => [$required, 'string', 'max:200'],
            'titleAr' => ['sometimes', 'nullable', 'string', 'max:200'],
            'type' => [$required, Rule::in(self::LESSON_TYPES)],
            'status' => ['sometimes', Rule::in(['draft', 'published'])],
            'sortOrder' => ['sometimes', 'integer', 'min:0'],
            'templateSections' => ['sometimes', 'nullable', 'array', 'max:20'],
            'templateSections.*' => ['string', 'max:120'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
    }

    /** @param array<string, mixed> $validated @return array<string, mixed> */
    private function lessonAttributes(array $validated): array
    {
        return $this->map($validated, [
            'moduleId' => 'course_module_id', 'contentItemId' => 'content_item_id',
            'title' => 'title', 'titleAr' => 'title_ar', 'type' => 'type',
            'status' => 'status', 'sortOrder' => 'sort_order',
            'templateSections' => 'template_sections', 'metadata' => 'metadata',
        ]);
    }

    /** @param array<string, mixed> $source @param array<string, string> $mapping @return array<string, mixed> */
    private function map(array $source, array $mapping): array
    {
        $result = [];
        foreach ($mapping as $input => $column) {
            if (array_key_exists($input, $source)) {
                $result[$column] = $source[$input];
            }
        }

        return $result;
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function course(Request $request, string $id): Course
    {
        return Course::query()->where('organization_id', $this->organization($request)->id)
            ->where('id', $id)->first() ?? throw new ApiException('RESOURCE_NOT_FOUND', 'Course not found.', 404);
    }

    private function module(Course $course, string $id): CourseModule
    {
        return CourseModule::query()->where('organization_id', $course->organization_id)
            ->where('course_id', $course->id)->where('id', $id)->first()
            ?? throw new ApiException('RESOURCE_NOT_FOUND', 'Course module not found.', 404);
    }

    private function lesson(Course $course, string $id): CourseLesson
    {
        return CourseLesson::query()->where('organization_id', $course->organization_id)
            ->where('course_id', $course->id)->where('id', $id)->first()
            ?? throw new ApiException('RESOURCE_NOT_FOUND', 'Course lesson not found.', 404);
    }
}
