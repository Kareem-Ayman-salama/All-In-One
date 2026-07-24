<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Models\Category;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return ApiResponse::success(
            $request,
            Category::query()
                ->withCount('courses')
                ->orderBy('sort_order')
                ->get(),
        );
    }

    public function store(
        StoreCategoryRequest $request,
        OperationRecorder $recorder,
    ): JsonResponse {
        $category = Category::query()->create(
            $this->attributes($request),
        );
        $recorder->record(
            'category.created',
            'category',
            $category->id,
            null,
            $request->user()->id,
            ['slug' => $category->slug],
            ['categoryId' => $category->id],
            $request,
        );

        return ApiResponse::success($request, $category, status: 201);
    }

    public function update(
        StoreCategoryRequest $request,
        string $category,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = Category::query()->findOrFail($category);
        if ($request->validated('parentId') === $model->id) {
            throw new ApiException(
                'CATEGORY_PARENT_INVALID',
                'A category cannot be its own parent.',
                422,
            );
        }
        $model->update($this->attributes($request, $model));
        $recorder->record(
            'category.updated',
            'category',
            $model->id,
            null,
            $request->user()->id,
            [],
            ['categoryId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, $model->fresh());
    }

    public function destroy(
        Request $request,
        string $category,
        OperationRecorder $recorder,
    ): JsonResponse {
        $model = Category::query()->withCount('courses', 'children')->findOrFail(
            $category,
        );
        if ($model->courses_count > 0 || $model->children_count > 0) {
            throw new ApiException(
                'CATEGORY_IN_USE',
                'Move courses and child categories before deleting this category.',
                409,
            );
        }
        $model->delete();
        $recorder->record(
            'category.deleted',
            'category',
            $model->id,
            null,
            $request->user()->id,
            ['slug' => $model->slug],
            ['categoryId' => $model->id],
            $request,
        );

        return ApiResponse::success($request, ['deleted' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(
        StoreCategoryRequest $request,
        ?Category $category = null,
    ): array {
        return [
            'parent_id' => $request->validated('parentId'),
            'name' => $request->validated('name'),
            'name_ar' => $request->validated('nameAr'),
            'slug' => $request->validated('slug')
                ?? $this->uniqueSlug($request->validated('name'), $category?->id),
            'active' => $request->has('active')
                ? $request->boolean('active')
                : true,
            'sort_order' => $request->validated('sortOrder', 0),
        ];
    }

    private function uniqueSlug(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;
        $suffix = 2;
        while (Category::query()
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
