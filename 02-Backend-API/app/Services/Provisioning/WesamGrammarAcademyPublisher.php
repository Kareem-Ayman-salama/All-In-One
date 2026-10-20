<?php

namespace App\Services\Provisioning;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Services\Operations\OperationRecorder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class WesamGrammarAcademyPublisher
{
    public function __construct(
        private readonly OperationRecorder $recorder,
    ) {}

    /**
     * Publish the prepared academy as a free, self-paced public course.
     *
     * @return array<string, mixed>
     */
    public function publish(): array
    {
        return DB::transaction(function (): array {
            $organization = Organization::query()
                ->where('slug', WesamGrammarAcademyProvisioner::SLUG)
                ->lockForUpdate()
                ->firstOrFail();
            $profile = $organization->academyProfile()->lockForUpdate()->firstOrFail();
            $course = Course::query()
                ->where('organization_id', $organization->id)
                ->where('slug', 'nahw-from-foundations-to-mastery')
                ->lockForUpdate()
                ->firstOrFail();
            $batch = CourseBatch::query()
                ->where('organization_id', $organization->id)
                ->where('course_id', $course->id)
                ->where('title', 'الدفعة الأولى')
                ->lockForUpdate()
                ->firstOrFail();

            if ((! $course->description && ! $course->description_ar)
                || ! $course->instructor_id) {
                throw new RuntimeException(
                    'The course requires a description and instructor before publication.',
                );
            }

            $category = Category::query()->updateOrCreate(
                ['slug' => 'arabic-language'],
                [
                    'name' => 'Arabic Language',
                    'name_ar' => 'اللغة العربية',
                    'active' => true,
                    'sort_order' => 40,
                ],
            );

            $settings = $organization->settings ?? [];
            $settings['marketplace_enabled'] = true;
            $settings['setup_mode'] = false;
            $settings['onboarding'] = array_merge(
                $settings['onboarding'] ?? [],
                ['course_published' => true],
            );
            $organization->update(['settings' => $settings]);

            $profile->update([
                'is_public' => true,
                'verification_status' => 'verified',
                'verified_at' => $profile->verified_at ?? now(),
                'delivery_methods' => ['recorded'],
            ]);
            $course->update([
                'category_id' => $category->id,
                'delivery_type' => 'recorded',
                'price_minor' => 0,
                'discounted_price_minor' => null,
                'discount_ends_at' => null,
                'status' => CourseStatus::Published,
                'moderation_note' => 'Published as a free recorded course by the platform provisioning workflow.',
                'published_at' => $course->published_at ?? now(),
            ]);
            $batch->update([
                'start_date' => null,
                'end_date' => null,
                'schedule' => null,
                'delivery_type' => 'recorded',
                'capacity' => null,
                'enrollment_starts_at' => null,
                'enrollment_ends_at' => null,
                'status' => BatchStatus::Open,
            ]);

            $this->recorder->record(
                'academy.wesam.published',
                'organization',
                $organization->id,
                $organization->id,
                null,
                [
                    'visibility' => 'public',
                    'deliveryType' => 'recorded',
                    'priceMinor' => 0,
                    'enrollment' => 'open_unlimited',
                ],
                ['courseId' => $course->id, 'batchId' => $batch->id],
            );

            return [
                'academy' => $organization->name,
                'academySlug' => $profile->slug,
                'course' => $course->title_ar,
                'courseSlug' => $course->slug,
                'priceMinor' => 0,
                'deliveryType' => 'recorded',
                'academyPublic' => true,
                'courseStatus' => CourseStatus::Published->value,
                'batchStatus' => BatchStatus::Open->value,
                'enrollment' => 'open_unlimited',
            ];
        }, attempts: 3);
    }
}
