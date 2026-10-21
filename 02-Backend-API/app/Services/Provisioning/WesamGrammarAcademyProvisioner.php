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
use App\Models\Quiz;
use App\Models\QuizQuestion;
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
                    'cover_path' => '/images/courses/wesam-nahw-journey.jpg',
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
            $practiceQuizCount = $this->provisionPracticeQuizzes($organization, $course, $room, $user);

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
                'practiceQuizzes' => $practiceQuizCount,
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

    private function provisionPracticeQuizzes(
        Organization $organization,
        Course $course,
        Room $room,
        User $owner,
    ): int {
        $definitions = $this->practiceQuizDefinitions();

        foreach ($definitions as $definition) {
            $quiz = Quiz::query()->updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'course_id' => $course->id,
                    'title_ar' => $definition['title'],
                ],
                [
                    'room_id' => $room->id,
                    'created_by' => $owner->id,
                    'title' => $definition['title'],
                    'description' => $definition['description'],
                    'duration_minutes' => $definition['duration'],
                    'passing_score' => 70,
                    'max_attempts' => 5,
                    'is_published' => true,
                ],
            );

            foreach ($definition['questions'] as $index => $question) {
                QuizQuestion::query()->updateOrCreate(
                    ['quiz_id' => $quiz->id, 'order' => $index + 1],
                    [
                        'question_text' => $question['prompt'],
                        'question_text_ar' => $question['prompt'],
                        'type' => $question['type'],
                        'options' => $question['options'],
                        'correct_answer' => $question['answer'],
                        'points' => 10,
                        'explanation' => $question['explanation'],
                    ],
                );
            }

            $quiz->questions()->where('order', '>', count($definition['questions']))->delete();
        }

        return count($definitions);
    }

    /**
     * @return array<int, array{
     *     title: string,
     *     description: string,
     *     duration: int,
     *     questions: array<int, array{
     *         prompt: string,
     *         type: string,
     *         options: array<int, array{id: string, text: string}>,
     *         answer: string,
     *         explanation: string
     *     }>
     * }>
     */
    private function practiceQuizDefinitions(): array
    {
        return [
            [
                'title' => 'تدريب أقسام الكلمة',
                'description' => 'تدريب تأسيسي مجاني لتمييز الاسم والفعل والحرف مع تصحيح وشرح فوري.',
                'duration' => 6,
                'questions' => [
                    $this->practiceQuestion('ما نوع كلمة «كتبَ» في جملة: كتبَ الطالبُ الدرسَ؟', ['اسم', 'فعل ماضٍ', 'حرف'], 'B', '«كتبَ» تدل على حدث وقع في الزمن الماضي، ولذلك هي فعل ماضٍ.'),
                    $this->practiceQuestion('أيُّ الكلمات الآتية حرف جر؟', ['في', 'كتاب', 'يقرأ'], 'A', '«في» حرف جر يربط الكلمات ويُكسب الجملة معنى الظرفية.'),
                    $this->practiceQuestion('أيُّ الكلمات تقبل دخول «الـ» عليها؟', ['مدرسة', 'ذهبَ', 'من'], 'A', 'دخول «الـ» من علامات الاسم، فنقول: المدرسة.'),
                    $this->practiceQuestion('كلمة «يكتبُ» فعل مضارع لأنها تدل على حدث يقع الآن أو في المستقبل.', ['صحيح', 'خطأ'], 'A', 'الفعل المضارع يدل غالبًا على حدث يقع في الحال أو الاستقبال.', 'true_false'),
                    $this->practiceQuestion('ما نوع كلمة «إلى» في جملة: ذهبتُ إلى المدرسة؟', ['حرف جر', 'اسم', 'فعل'], 'A', '«إلى» حرف جر، والاسم الذي بعدها يكون مجرورًا.'),
                    $this->practiceQuestion('الحرف يدل على معنى كامل مستقل حتى إذا جاء وحده.', ['صحيح', 'خطأ'], 'B', 'الحرف يظهر معناه عند دخوله في تركيب مع كلمات أخرى.', 'true_false'),
                ],
            ],
            [
                'title' => 'تدريب المبتدأ والخبر',
                'description' => 'تدريب مجاني على ركني الجملة الاسمية وأنواع الخبر وعلامات الرفع.',
                'duration' => 7,
                'questions' => [
                    $this->practiceQuestion('ما المبتدأ في جملة: السماءُ صافيةٌ؟', ['السماءُ', 'صافيةٌ', 'الجملة كلها'], 'A', '«السماءُ» الاسم الذي بدأنا به الحديث، ولذلك هي المبتدأ.'),
                    $this->practiceQuestion('ما الخبر في جملة: الطالبُ مجتهدٌ؟', ['الطالبُ', 'مجتهدٌ', 'لا يوجد خبر'], 'B', '«مجتهدٌ» أكملت المعنى وأخبرتنا عن الطالب، فهي الخبر.'),
                    $this->practiceQuestion('المبتدأ والخبر في الأصل مرفوعان.', ['صحيح', 'خطأ'], 'A', 'الأصل أن المبتدأ والخبر مرفوعان ما لم يدخل على الجملة ناسخ.', 'true_false'),
                    $this->practiceQuestion('ما نوع الخبر في جملة: الكتابُ فوقَ الطاولةِ؟', ['مفرد', 'جملة فعلية', 'شبه جملة'], 'C', '«فوقَ الطاولةِ» ظرف ومضاف إليه، وشبه الجملة في محل رفع خبر.'),
                    $this->practiceQuestion('ما الخبر في جملة: الأمانةُ فضيلةٌ؟', ['الأمانةُ', 'فضيلةٌ', 'لا يوجد خبر'], 'B', '«فضيلةٌ» هي التي تممت معنى المبتدأ «الأمانةُ».'),
                    $this->practiceQuestion('علامة رفع المبتدأ في جملة «الطالبانِ حاضرانِ» هي:', ['الضمة', 'الألف', 'الواو'], 'B', '«الطالبانِ» مبتدأ مرفوع بالألف لأنه مثنى.'),
                ],
            ],
            [
                'title' => 'تدريب الإعراب الأساسي',
                'description' => 'تدريب مجاني على تحديد وظيفة الكلمة وحكمها وعلامة إعرابها.',
                'duration' => 8,
                'questions' => [
                    $this->practiceQuestion('ما إعراب «محمدٌ» في جملة: قرأَ محمدٌ الكتابَ؟', ['مبتدأ مرفوع', 'فاعل مرفوع', 'مفعول به منصوب'], 'B', 'محمد هو الذي قام بفعل القراءة، فهو فاعل مرفوع بالضمة.'),
                    $this->practiceQuestion('ما إعراب «الكتابَ» في الجملة نفسها؟', ['فاعل مرفوع', 'مفعول به منصوب', 'اسم مجرور'], 'B', 'وقع فعل القراءة على الكتاب، ولذلك هو مفعول به منصوب بالفتحة.'),
                    $this->practiceQuestion('ما إعراب «الطالبِ» في جملة: مررتُ بالطالبِ؟', ['اسم مجرور', 'فاعل', 'خبر'], 'A', 'دخل حرف الجر الباء على «الطالبِ»، فأصبح اسمًا مجرورًا بالكسرة.'),
                    $this->practiceQuestion('الفتحة هي علامة النصب الأصلية.', ['صحيح', 'خطأ'], 'A', 'الفتحة هي علامة النصب الأصلية في الاسم المفرد وجمع التكسير.', 'true_false'),
                    $this->practiceQuestion('ما الموقع الإعرابي لكلمة «العلمَ» في جملة: إنَّ العلمَ نورٌ؟', ['اسم إنَّ منصوب', 'خبر إنَّ مرفوع', 'فاعل مرفوع'], 'A', '«إنَّ» تنصب المبتدأ ويسمى اسمها، وترفع الخبر ويسمى خبرها.'),
                    $this->practiceQuestion('أي ترتيب يساعدك على الإعراب بطريقة صحيحة؟', ['العلامة ثم المعنى فقط', 'نوع الكلمة ثم موقعها ثم حكمها ثم علامتها', 'حفظ آخر الكلمة دون فهم'], 'B', 'الإعراب السليم يبدأ بالفهم وتحديد الوظيفة قبل اختيار العلامة.'),
                ],
            ],
        ];
    }

    /**
     * @param  array<int, string>  $options
     * @return array{prompt: string, type: string, options: array<int, array{id: string, text: string}>, answer: string, explanation: string}
     */
    private function practiceQuestion(
        string $prompt,
        array $options,
        string $answer,
        string $explanation,
        string $type = 'mcq',
    ): array {
        return [
            'prompt' => $prompt,
            'type' => $type,
            'options' => array_map(
                fn (string $option, int $index): array => ['id' => chr(65 + $index), 'text' => $option],
                $options,
                array_keys($options),
            ),
            'answer' => $answer,
            'explanation' => $explanation,
        ];
    }
}
