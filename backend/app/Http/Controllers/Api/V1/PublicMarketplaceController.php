<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\AcademyProfile;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Services\Marketplace\CoursePresenter;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicMarketplaceController extends Controller
{
    public function courses(
        Request $request,
        CoursePresenter $presenter,
    ): JsonResponse {
        $query = $this->publicCourses()
            ->with(['academyProfile', 'instructor', 'category'])
            ->with(['batches' => fn ($builder) => $builder
                ->whereIn('status', [
                    BatchStatus::Open->value,
                    BatchStatus::InProgress->value,
                ])
                ->orderBy('start_date')])
            ->when($request->filled('search'), function (Builder $builder) use ($request): void {
                $search = '%'.$request->string('search')->trim()->toString().'%';
                $builder->where(fn (Builder $nested) => $nested
                    ->where('title', 'like', $search)
                    ->orWhere('title_ar', 'like', $search)
                    ->orWhere('subject', 'like', $search)
                    ->orWhereHas('instructor', fn (Builder $instructor) => $instructor
                        ->where('name', 'like', $search)
                        ->orWhere('name_ar', 'like', $search))
                    ->orWhereHas('academyProfile', fn (Builder $academy) => $academy
                        ->where('public_name', 'like', $search)
                        ->orWhere('public_name_ar', 'like', $search)));
            })
            ->when(
                $request->filled('category'),
                fn (Builder $builder) => $builder->whereHas(
                    'category',
                    fn (Builder $category) => $category->where(
                        'slug',
                        $request->string('category'),
                    ),
                ),
            )
            ->when(
                $request->filled('subject'),
                fn (Builder $builder) => $builder->where(
                    'subject',
                    $request->string('subject'),
                ),
            )
            ->when(
                $request->filled('educationLevel'),
                fn (Builder $builder) => $builder->where(
                    'education_level',
                    $request->string('educationLevel'),
                ),
            )
            ->when(
                $request->filled('deliveryType'),
                fn (Builder $builder) => $builder->where(
                    'delivery_type',
                    $request->string('deliveryType'),
                ),
            )
            ->when(
                $request->filled('academy'),
                fn (Builder $builder) => $builder->whereHas(
                    'academyProfile',
                    fn (Builder $academy) => $academy->where(
                        'slug',
                        $request->string('academy'),
                    ),
                ),
            )
            ->when(
                $request->filled('minPrice'),
                fn (Builder $builder) => $builder->where(
                    'price_minor',
                    '>=',
                    $request->integer('minPrice'),
                ),
            )
            ->when(
                $request->filled('maxPrice'),
                fn (Builder $builder) => $builder->where(
                    'price_minor',
                    '<=',
                    $request->integer('maxPrice'),
                ),
            );
        $this->sort($query, $request->string('sort', 'newest')->toString());
        $courses = $query->paginate(min($request->integer('perPage', 12), 48));

        return ApiResponse::success(
            $request,
            collect($courses->items())->map(
                fn (Course $course): array => $presenter->present($course),
            ),
            [
                'currentPage' => $courses->currentPage(),
                'lastPage' => $courses->lastPage(),
                'perPage' => $courses->perPage(),
                'total' => $courses->total(),
            ],
        );
    }

    public function course(
        Request $request,
        string $course,
        CoursePresenter $presenter,
    ): JsonResponse {
        $model = $this->publicCourses()
            ->with([
                'academyProfile',
                'instructor',
                'category',
                'batches' => fn ($builder) => $builder
                    ->where('status', BatchStatus::Open->value)
                    ->orderBy('start_date'),
            ])
            ->where(fn (Builder $query) => $query
                ->where('id', $course)
                ->orWhere('slug', $course))
            ->first();
        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Course not found.', 404);
        }

        return ApiResponse::success($request, $presenter->present($model, true));
    }

    public function academies(Request $request): JsonResponse
    {
        $profiles = AcademyProfile::query()
            ->withCount(['courses' => fn ($query) => $query
                ->where('status', CourseStatus::Published->value)])
            ->where('is_public', true)
            ->where('verification_status', 'verified')
            ->whereHas(
                'organization',
                fn (Builder $query) => $this->publicOrganization($query),
            )
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $search = '%'.$request->string('search')->trim()->toString().'%';
                $query->where(fn (Builder $nested) => $nested
                    ->where('public_name', 'like', $search)
                    ->orWhere('public_name_ar', 'like', $search)
                    ->orWhere('location', 'like', $search));
            })
            ->orderBy('public_name')
            ->paginate(min($request->integer('perPage', 12), 48));

        return ApiResponse::success($request, $profiles->items(), [
            'currentPage' => $profiles->currentPage(),
            'lastPage' => $profiles->lastPage(),
            'total' => $profiles->total(),
        ]);
    }

    public function academy(
        Request $request,
        string $academy,
        CoursePresenter $presenter,
    ): JsonResponse {
        $profile = AcademyProfile::query()
            ->where('slug', $academy)
            ->where('is_public', true)
            ->where('verification_status', 'verified')
            ->whereHas(
                'organization',
                fn (Builder $query) => $this->publicOrganization($query),
            )
            ->first();
        if (! $profile) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Academy not found.', 404);
        }
        $courses = $this->publicCourses()
            ->where('academy_profile_id', $profile->id)
            ->with('academyProfile', 'instructor', 'category', 'batches')
            ->latest('published_at')
            ->get();

        return ApiResponse::success($request, [
            'academy' => $profile,
            'courses' => $courses->map(
                fn (Course $course): array => $presenter->present($course),
            ),
        ]);
    }

    public function categories(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->withCount(['courses' => fn ($query) => $query
                ->where('status', CourseStatus::Published->value)])
            ->where('active', true)
            ->orderBy('sort_order')
            ->get();

        return ApiResponse::success($request, $categories);
    }

    private function publicCourses(): Builder
    {
        return Course::query()
            ->where('status', CourseStatus::Published->value)
            ->whereNotNull('published_at')
            ->whereHas(
                'organization',
                fn (Builder $query) => $this->publicOrganization($query),
            )
            ->whereHas('academyProfile', fn (Builder $query) => $query
                ->where('is_public', true)
                ->where('verification_status', 'verified'));
    }

    private function publicOrganization(Builder $query): Builder
    {
        return $query
            ->where('status', 'active')
            ->whereHas(
                'subscriptions',
                fn (Builder $subscription) => $subscription
                    ->currentlyAccessible()
                    ->whereHas(
                        'plan.modules',
                        fn (Builder $module) => $module
                            ->where('module', 'courses')
                            ->where('enabled', true),
                    ),
            );
    }

    private function sort(Builder $query, string $sort): void
    {
        match ($sort) {
            'price_asc' => $query->orderByRaw(
                'COALESCE(discounted_price_minor, price_minor) ASC',
            ),
            'price_desc' => $query->orderByRaw(
                'COALESCE(discounted_price_minor, price_minor) DESC',
            ),
            'starting_soon' => $query->orderBy(
                CourseBatch::select('start_date')
                    ->whereColumn('course_id', 'courses.id')
                    ->where('status', BatchStatus::Open->value)
                    ->orderBy('start_date')
                    ->limit(1),
            ),
            default => $query->latest('published_at'),
        };
    }
}
