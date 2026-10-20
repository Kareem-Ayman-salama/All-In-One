<?php

namespace App\Services\Provisioning;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\CourseLesson;
use App\Models\CourseModule;
use App\Models\Instructor;
use App\Models\LessonTemplate;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\QuestionBankCategory;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use App\Services\Operations\OperationRecorder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class WesamGrammarAcademyProvisioner
{
    public const SLUG = 'wesam-nahw';

    /**
     * Provision or reconcile Ms. Wesam's production academy.
     *
     * @return array<string, mixed>
     */
    public function provision(
        string $email,
        ?string $temporaryPassword,
        bool $rotatePassword = false,
        bool $forcePasswordChange = true,
    ): array {
        return DB::transaction(function () use ($email, $temporaryPassword, $rotatePassword, $forcePasswordChange): array {
            $existingOrganization = Organization::query()
                ->where('slug', self::SLUG)
                ->first();
            $defaultSettings = [
                'workspace_mode' => 'solo_instructor',
                'marketplace_enabled' => false,
                'setup_mode' => true,
                'country' => 'EG',
                'currency' => 'EGP',
                'default_direction' => 'rtl',
                'secondary_locale' => 'en',
                'subject' => 'Arabic Language',
                'specialization' => 'Arabic Grammar / النحو',
                'english_name' => 'Wesam Arabic Grammar Academy',
                'instructor_display_name' => 'أ. وسام',
                'tagline' => 'النحو ببساطة… من الفهم إلى الإتقان',
                'onboarding' => [
                    'academy_ready' => true,
                    'course_ready' => true,
                    'modules_ready' => true,
                    'room_ready' => true,
                    'first_lesson_added' => false,
                    'first_file_uploaded' => false,
                    'batch_scheduled' => false,
                    'course_published' => false,
                ],
            ];
            $organization = Organization::query()->updateOrCreate(
                ['slug' => self::SLUG],
                [
                    'name' => 'أكاديمية النحو مع الأستاذة وسام',
                    'type' => 'academy',
                    'status' => 'active',
                    'brand_color' => '#123B67',
                    'bio' => 'النحو ببساطة… من الفهم إلى الإتقان',
                    'locale' => 'ar',
                    'timezone' => 'Africa/Cairo',
                    'settings' => array_replace_recursive(
                        $defaultSettings,
                        $existingOrganization?->settings ?? [],
                    ),
                ],
            );

            $existingProfile = AcademyProfile::query()
                ->where('organization_id', $organization->id)
                ->first();
            $profile = AcademyProfile::query()->updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'slug' => self::SLUG,
                    'public_name' => 'Wesam Arabic Grammar Academy',
                    'public_name_ar' => 'أكاديمية النحو مع الأستاذة وسام',
                    'description' => 'A private Arabic grammar academy prepared for content setup.',
                    'description_ar' => 'منصة تعليمية متخصصة في تبسيط النحو العربي وتقديمه بطريقة عملية وتفاعلية تساعد الطلاب على الفهم والتطبيق والتدرج من الأساسيات حتى المستويات المتقدمة.',
                    'phone' => null,
                    'email' => null,
                    'website' => null,
                    'location' => null,
                    'branches' => [],
                    'delivery_methods' => $existingProfile?->delivery_methods ?? ['online'],
                    'is_public' => $existingProfile?->is_public ?? false,
                    'verification_status' => $existingProfile?->verification_status ?? 'verified',
                    'verified_at' => $existingProfile?->verified_at ?? now(),
                ],
            );

            $user = User::query()->where('normalized_email', mb_strtolower(trim($email)))->first();
            if (! $user) {
                $user = new User;
            }

            $userAttributes = [
                'name' => 'الأستاذة وسام',
                'email' => mb_strtolower(trim($email)),
                'status' => 'active',
                'platform_role' => null,
                'email_verified_at' => now(),
                'locale' => 'ar',
                'timezone' => 'Africa/Cairo',
            ];
            if (! $user->exists || $rotatePassword) {
                if ($temporaryPassword === null) {
                    throw new \InvalidArgumentException('A temporary password is required for a new account or password rotation.');
                }
                $userAttributes['password'] = Hash::make($temporaryPassword);
                $userAttributes['must_change_password'] = $forcePasswordChange;
            }
            $user->forceFill($userAttributes)->save();

            $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)
                ->whereNull('organization_id')->firstOrFail();
            OrganizationMembership::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'user_id' => $user->id],
                ['role_id' => $ownerRole->id, 'status' => 'active', 'joined_at' => now()],
            );

            $instructor = Instructor::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'user_id' => $user->id],
                [
                    'name' => 'Ms. Wesam',
                    'name_ar' => 'الأستاذة وسام',
                    'bio_ar' => 'متخصصة في تدريس النحو واللغة العربية.',
                    'specialties' => ['النحو', 'اللغة العربية'],
                    'social_links' => [],
                    'status' => 'active',
                ],
            );

            $plan = Plan::query()->where('code', 'pilot')->first()
                ?? Plan::query()->where('code', 'growth')->firstOrFail();
            OrganizationSubscription::query()->updateOrCreate(
                ['organization_id' => $organization->id],
                [
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'billing_interval' => 'monthly',
                    'activation_note' => 'Private content-setup workspace for the first production academy.',
                    'current_period_starts_at' => now(),
                    'current_period_ends_at' => now()->addYear(),
                    'trial_ends_at' => null,
                ],
            );

            $existingCourse = Course::query()
                ->where('organization_id', $organization->id)
                ->where('slug', 'nahw-from-foundations-to-mastery')
                ->first();
            $course = Course::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'slug' => 'nahw-from-foundations-to-mastery'],
                [
                    'academy_profile_id' => $profile->id,
                    'instructor_id' => $instructor->id,
                    'created_by' => $user->id,
                    'title' => 'Arabic Grammar — From Foundations to Mastery',
                    'title_ar' => 'النحو من البداية إلى الاحتراف',
                    'short_description_ar' => 'دورة متدرجة لتعلّم النحو العربي بطريقة مبسطة وعملية.',
                    'description_ar' => 'دورة متدرجة لتعلّم النحو العربي بطريقة مبسطة وعملية، تبدأ من المفاهيم الأساسية ثم تنتقل تدريجياً إلى القواعد والتطبيقات الأكثر تقدماً، مع تدريبات واختبارات تساعد الطالب على الفهم والتطبيق وليس الحفظ فقط.',
                    'education_level' => 'all_levels',
                    'subject' => 'Arabic Language / النحو',
                    'delivery_type' => $existingCourse?->delivery_type ?? 'online',
                    'price_minor' => $existingCourse?->price_minor ?? 0,
                    'currency' => 'EGP',
                    'learning_outcomes' => [],
                    'requirements' => [],
                    'status' => $existingCourse?->status ?? 'draft',
                    'published_at' => $existingCourse?->published_at,
                    'completion_policy' => [
                        'require_lessons_completion' => true,
                        'minimum_lesson_completion_percentage' => 80,
                        'require_assignments' => false,
                        'require_all_required_assignments' => false,
                        'require_quizzes' => true,
                        'minimum_quiz_score' => 60,
                        'require_attendance' => false,
                        'minimum_attendance_percentage' => 0,
                        'certificate_enabled' => true,
                    ],
                ],
            );

            $outline = $this->courseOutline();
            foreach ($outline as $moduleIndex => $definition) {
                $module = CourseModule::query()->updateOrCreate(
                    ['organization_id' => $organization->id, 'course_id' => $course->id, 'sort_order' => $moduleIndex + 1],
                    ['title' => $definition['title'], 'title_ar' => $definition['title'], 'status' => 'draft'],
                );
                foreach ($definition['topics'] as $topicIndex => $topic) {
                    CourseLesson::query()->updateOrCreate(
                        ['course_module_id' => $module->id, 'sort_order' => $topicIndex + 1],
                        [
                            'organization_id' => $organization->id,
                            'course_id' => $course->id,
                            'created_by' => $user->id,
                            'title' => $topic,
                            'title_ar' => $topic,
                            'type' => 'placeholder',
                            'status' => 'draft',
                            'template_sections' => [],
                            'metadata' => ['structural_placeholder' => true],
                            'published_at' => null,
                        ],
                    );
                }
            }

            LessonTemplate::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'name' => 'قالب درس النحو'],
                [
                    'locale' => 'ar',
                    'sections' => ['عنوان الدرس', 'شرح مبسط', 'القاعدة', 'أمثلة', 'ملحوظات مهمة', 'أخطاء شائعة', 'تدريب سريع', 'واجب', 'اختبار قصير'],
                    'is_default' => true,
                ],
            );
            $this->provisionQuestionBankCategories($organization);

            $room = Room::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'slug' => 'nahw-academy-room'],
                [
                    'created_by' => $user->id,
                    'name' => 'غرفة أكاديمية النحو',
                    'description' => 'الغرفة الرقمية للكورس الرئيسي.',
                    'access_type' => 'private',
                    'status' => 'active',
                    'settings' => [
                        'course_id' => $course->id,
                        'instructor_id' => $instructor->id,
                        'navigation' => ['الرئيسية', 'الدروس', 'الملفات', 'التدريبات', 'الواجبات', 'الاختبارات', 'الإعلانات', 'الطلاب', 'التقدم'],
                    ],
                ],
            );

            $existingBatch = CourseBatch::query()
                ->where('organization_id', $organization->id)
                ->where('course_id', $course->id)
                ->where('title', 'الدفعة الأولى')
                ->first();
            $batch = CourseBatch::query()->updateOrCreate(
                ['organization_id' => $organization->id, 'course_id' => $course->id, 'title' => 'الدفعة الأولى'],
                [
                    'room_id' => $room->id,
                    'title_ar' => 'الدفعة الأولى',
                    'start_date' => $existingBatch?->start_date,
                    'end_date' => $existingBatch?->end_date,
                    'schedule' => $existingBatch?->schedule,
                    'delivery_type' => $existingBatch?->delivery_type ?? 'online',
                    'capacity' => $existingBatch?->capacity,
                    'reserved_seats' => $existingBatch?->reserved_seats ?? 0,
                    'confirmed_seats' => $existingBatch?->confirmed_seats ?? 0,
                    'status' => $existingBatch?->status ?? 'draft',
                ],
            );

            app(OperationRecorder::class)->record(
                'academy.wesam.provisioned',
                'organization',
                $organization->id,
                $organization->id,
                $user->id,
                [
                    'slug' => self::SLUG,
                    'marketplaceEnabled' => (bool) ($organization->settings['marketplace_enabled'] ?? false),
                ],
                ['courseId' => $course->id, 'roomId' => $room->id, 'batchId' => $batch->id],
            );

            return [
                'organizationId' => $organization->id,
                'academy' => $organization->name,
                'slug' => $organization->slug,
                'email' => $user->email,
                'courseId' => $course->id,
                'course' => $course->title_ar,
                'modules' => count($outline),
                'lessons' => array_sum(array_map(fn (array $item): int => count($item['topics']), $outline)),
                'room' => $room->name,
                'batch' => $batch->title,
                'marketplaceEnabled' => (bool) ($organization->settings['marketplace_enabled'] ?? false),
                'mustChangePassword' => (bool) $user->must_change_password,
            ];
        });
    }

    /** @return array<int, array{title: string, topics: array<int, string>}> */
    private function courseOutline(): array
    {
        return [
            ['title' => 'مدخل إلى النحو', 'topics' => ['ما هو النحو؟', 'لماذا نتعلم النحو؟', 'أقسام الكلام', 'الاسم والفعل والحرف']],
            ['title' => 'الاسم', 'topics' => ['علامات الاسم', 'المفرد والمثنى والجمع', 'المعرفة والنكرة', 'المذكر والمؤنث']],
            ['title' => 'الجملة الاسمية', 'topics' => ['المبتدأ', 'الخبر', 'أنواع الخبر', 'تدريبات على الجملة الاسمية']],
            ['title' => 'الجملة الفعلية', 'topics' => ['الفعل', 'الفاعل', 'المفعول به', 'نائب الفاعل']],
            ['title' => 'الإعراب', 'topics' => ['مفهوم الإعراب', 'الرفع', 'النصب', 'الجر', 'الجزم']],
            ['title' => 'الأفعال', 'topics' => ['الفعل الماضي', 'الفعل المضارع', 'فعل الأمر', 'الأفعال الخمسة']],
            ['title' => 'النواسخ', 'topics' => ['كان وأخواتها', 'إن وأخواتها', 'ظن وأخواتها']],
            ['title' => 'التوابع', 'topics' => ['النعت', 'العطف', 'التوكيد', 'البدل']],
            ['title' => 'المنصوبات', 'topics' => ['الحال', 'التمييز', 'المفعول المطلق', 'المفعول لأجله', 'المفعول فيه']],
            ['title' => 'المراجعة والتطبيق', 'topics' => ['تحليل الجمل', 'أخطاء نحوية شائعة', 'تدريبات شاملة', 'اختبارات نهائية']],
        ];
    }

    private function provisionQuestionBankCategories(Organization $organization): void
    {
        $groups = [
            'question_type' => ['اختيار من متعدد', 'صح أو خطأ', 'اختر الإجابة الصحيحة', 'أعرب', 'أكمل', 'صحح الخطأ', 'حدد نوع الكلمة', 'حدد الموقع الإعرابي'],
            'practice_level' => ['مبتدئ', 'متوسط', 'متقدم'],
            'practice_topic' => ['أقسام الكلام', 'الجملة الاسمية', 'الجملة الفعلية', 'الإعراب', 'النواسخ', 'التوابع', 'المنصوبات'],
        ];

        foreach ($groups as $kind => $items) {
            foreach ($items as $index => $name) {
                QuestionBankCategory::query()->updateOrCreate(
                    ['organization_id' => $organization->id, 'kind' => $kind, 'code' => $kind.'_'.($index + 1)],
                    ['name' => $name, 'name_ar' => $name, 'sort_order' => $index + 1, 'active' => true],
                );
            }
        }
    }
}
