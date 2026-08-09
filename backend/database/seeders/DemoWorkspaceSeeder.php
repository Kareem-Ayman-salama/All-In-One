<?php

namespace Database\Seeders;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Models\AcademyProfile;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Instructor;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoWorkspaceSeeder extends Seeder
{
    /**
     * Seed deterministic accounts for non-production acceptance testing.
     */
    public function run(): void
    {
        $this->call([
            AuthorizationSeeder::class,
            PlanSeeder::class,
        ]);

        $techCorp = $this->organization(
            'TechCorp Egypt',
            'techcorp-egypt',
            'company',
        );
        $academy = $this->organization(
            'Elite Academy',
            'elite-academy',
            'academy',
        );

        $this->subscribe($techCorp, 'growth');
        $this->subscribe($academy, 'pro');

        $superAdmin = $this->user(
            'Platform Admin',
            'super@ain.test',
            platformRole: 'super_admin',
        );
        $companyAdmin = $this->user(
            'Ahmed Mostafa',
            'admin@techcorp.test',
        );
        $employee = $this->user(
            'Mohamed Ahmed',
            'employee@techcorp.test',
        );
        $student = $this->user(
            'Mariam Hassan',
            'student@ain.test',
        );

        $this->membership($techCorp, $companyAdmin, 'organization_admin');
        $this->membership($techCorp, $employee, 'member');
        $this->membership($academy, $student, 'student');

        $this->seedMarketplace($academy, $student);

        $superAdmin->tokens()->delete();
    }

    private function organization(
        string $name,
        string $slug,
        string $type,
    ): Organization {
        return Organization::query()->updateOrCreate([
            'slug' => $slug,
        ], [
            'name' => $name,
            'type' => $type,
            'status' => 'active',
            'brand_color' => '#16458F',
            'locale' => 'ar',
            'timezone' => 'Africa/Cairo',
        ]);
    }

    private function subscribe(Organization $organization, string $planCode): void
    {
        $plan = Plan::query()->where('code', $planCode)->firstOrFail();

        OrganizationSubscription::query()->updateOrCreate([
            'organization_id' => $organization->id,
        ], [
            'plan_id' => $plan->id,
            'status' => 'active',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addYear(),
        ]);
    }

    private function user(
        string $name,
        string $email,
        ?string $platformRole = null,
    ): User {
        $user = User::query()->withTrashed()->firstOrNew([
            'normalized_email' => mb_strtolower($email),
        ]);
        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('12345678'),
            'platform_role' => $platformRole,
            'status' => 'active',
            'email_verified_at' => now(),
            'deleted_at' => null,
        ])->save();

        return $user;
    }

    private function membership(
        Organization $organization,
        User $user,
        string $roleName,
    ): void {
        $role = Role::query()
            ->whereNull('organization_id')
            ->where('scope', 'organization')
            ->where('name', $roleName)
            ->firstOrFail();

        OrganizationMembership::query()->updateOrCreate([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
        ], [
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
            'suspended_at' => null,
        ]);
    }

    private function seedMarketplace(Organization $academy, User $creator): void
    {
        $profile = AcademyProfile::query()->updateOrCreate([
            'organization_id' => $academy->id,
        ], [
            'slug' => 'elite-academy',
            'public_name' => 'Elite Academy',
            'public_name_ar' => 'إليت أكاديمي',
            'description' => 'Practical technology academy for AI, data, and digital skills.',
            'description_ar' => 'أكاديمية عملية لتعلم الذكاء الاصطناعي وتحليل البيانات والمهارات الرقمية.',
            'phone' => '+201000000000',
            'email' => 'hello@elite-academy.test',
            'website' => 'https://elite-academy.test',
            'location' => 'Cairo, Egypt',
            'branches' => [
                ['name' => 'Nasr City', 'address' => 'Cairo'],
                ['name' => 'Online', 'address' => 'Remote'],
            ],
            'delivery_methods' => ['online', 'onsite', 'hybrid'],
            'cancellation_policy' => 'Students can reschedule within 24 hours before the first session.',
            'is_public' => true,
            'verification_status' => 'verified',
            'verified_at' => now(),
        ]);

        $aiCategory = $this->category('Artificial Intelligence', 'الذكاء الاصطناعي', 'ai', 1);
        $dataCategory = $this->category('Data Analytics', 'تحليل البيانات', 'data-analytics', 2);
        $programmingCategory = $this->category('Programming', 'البرمجة', 'programming', 3);

        $instructor = Instructor::query()->updateOrCreate([
            'organization_id' => $academy->id,
            'name' => 'Nour Samir',
        ], [
            'name_ar' => 'نور سمير',
            'bio' => 'Senior instructor focused on building job-ready digital skills.',
            'bio_ar' => 'مدربة متخصصة في بناء مهارات رقمية عملية جاهزة لسوق العمل.',
            'specialties' => ['AI', 'Data', 'Productivity'],
            'social_links' => ['linkedin' => 'https://linkedin.com/in/demo'],
            'status' => 'active',
        ]);

        $room = Room::query()->updateOrCreate([
            'organization_id' => $academy->id,
            'slug' => 'elite-live-classroom',
        ], [
            'created_by' => $creator->id,
            'name' => 'Elite Live Classroom',
            'description' => 'Default classroom for demo live courses.',
            'access_type' => 'course',
            'status' => 'active',
            'settings' => ['allow_chat' => true, 'allow_downloads' => true],
        ]);

        $this->course($academy, $profile, $instructor, $aiCategory, $creator, $room, [
            'title' => 'AI Productivity Bootcamp',
            'title_ar' => 'معسكر إنتاجية الذكاء الاصطناعي',
            'slug' => 'ai-productivity-bootcamp',
            'subject' => 'AI',
            'education_level' => 'beginner',
            'delivery_type' => 'online',
            'price_minor' => 250000,
            'discounted_price_minor' => 180000,
            'duration' => '4 weeks',
            'sessions_count' => 8,
            'sort_offset' => 3,
        ]);

        $this->course($academy, $profile, $instructor, $dataCategory, $creator, $room, [
            'title' => 'Data Analysis with Excel and Power BI',
            'title_ar' => 'تحليل البيانات باستخدام Excel و Power BI',
            'slug' => 'data-analysis-excel-power-bi',
            'subject' => 'Data Analytics',
            'education_level' => 'intermediate',
            'delivery_type' => 'hybrid',
            'price_minor' => 320000,
            'discounted_price_minor' => null,
            'duration' => '6 weeks',
            'sessions_count' => 12,
            'sort_offset' => 10,
        ]);

        $this->course($academy, $profile, $instructor, $programmingCategory, $creator, $room, [
            'title' => 'Flutter Mobile App Foundations',
            'title_ar' => 'أساسيات تطبيقات الموبايل باستخدام Flutter',
            'slug' => 'flutter-mobile-app-foundations',
            'subject' => 'Mobile Development',
            'education_level' => 'beginner',
            'delivery_type' => 'onsite',
            'price_minor' => 400000,
            'discounted_price_minor' => 350000,
            'duration' => '5 weeks',
            'sessions_count' => 10,
            'sort_offset' => 17,
        ]);
    }

    private function category(
        string $name,
        string $nameAr,
        string $slug,
        int $sortOrder,
    ): Category {
        return Category::query()->updateOrCreate([
            'slug' => $slug,
        ], [
            'name' => $name,
            'name_ar' => $nameAr,
            'active' => true,
            'sort_order' => $sortOrder,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function course(
        Organization $academy,
        AcademyProfile $profile,
        Instructor $instructor,
        Category $category,
        User $creator,
        Room $room,
        array $attributes,
    ): void {
        $course = Course::query()->updateOrCreate([
            'organization_id' => $academy->id,
            'slug' => $attributes['slug'],
        ], [
            'academy_profile_id' => $profile->id,
            'instructor_id' => $instructor->id,
            'category_id' => $category->id,
            'created_by' => $creator->id,
            'title' => $attributes['title'],
            'title_ar' => $attributes['title_ar'],
            'short_description' => 'A practical, mentor-led course with live practice and workspace content.',
            'short_description_ar' => 'كورس عملي مع متابعة مباشرة ومحتوى داخل مساحة العمل.',
            'description' => 'Learn by building real workflows, submitting practical tasks, and joining live sessions with an instructor.',
            'description_ar' => 'تعلم من خلال تطبيقات عملية وتسليم مهام وحضور جلسات مباشرة مع المدرب.',
            'education_level' => $attributes['education_level'],
            'subject' => $attributes['subject'],
            'delivery_type' => $attributes['delivery_type'],
            'price_minor' => $attributes['price_minor'],
            'discounted_price_minor' => $attributes['discounted_price_minor'],
            'currency' => 'EGP',
            'discount_ends_at' => now()->addWeeks(2),
            'learning_outcomes' => [
                'Build a complete practical project',
                'Use the AIO workspace for lessons and tasks',
                'Prepare a portfolio-ready final submission',
            ],
            'requirements' => [
                'Laptop or mobile device',
                'Basic English reading',
                'Stable internet connection',
            ],
            'duration' => $attributes['duration'],
            'sessions_count' => $attributes['sessions_count'],
            'status' => CourseStatus::Published,
            'published_at' => now()->subDays($attributes['sort_offset']),
        ]);

        CourseBatch::query()->updateOrCreate([
            'organization_id' => $academy->id,
            'course_id' => $course->id,
            'title' => 'August Cohort',
        ], [
            'room_id' => $room->id,
            'title_ar' => 'دفعة أغسطس',
            'start_date' => now()->addDays($attributes['sort_offset'])->toDateString(),
            'end_date' => now()->addDays($attributes['sort_offset'] + 35)->toDateString(),
            'schedule' => [
                ['day' => 'Monday', 'time' => '19:00'],
                ['day' => 'Wednesday', 'time' => '19:00'],
            ],
            'delivery_type' => $attributes['delivery_type'],
            'capacity' => 30,
            'reserved_seats' => 4,
            'confirmed_seats' => 8,
            'location' => $attributes['delivery_type'] === 'onsite'
                ? 'Elite Academy, Nasr City'
                : 'Live online classroom',
            'meeting_reference' => 'https://meet.elite-academy.test/demo',
            'enrollment_starts_at' => now()->subWeek(),
            'enrollment_ends_at' => now()->addDays($attributes['sort_offset'] - 1),
            'status' => BatchStatus::Open,
        ]);
    }
}
