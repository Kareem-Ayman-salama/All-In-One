<?php

namespace App\Console\Commands;

use App\Domain\Marketplace\Enums\BatchStatus;
use App\Domain\Marketplace\Enums\CourseStatus;
use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\AcademyProfile;
use App\Models\AttendanceRecord;
use App\Models\Booking;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\GuardianConsent;
use App\Models\GuardianStudentLink;
use App\Models\Instructor;
use App\Models\LearningSession;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SeedDemoWorkspaceCommand extends Command
{
    protected $signature = 'demo:seed-workspace
                            {--reset : Wipe and re-create demo academy from scratch}';

    protected $description = 'Seed an enterprise sales demo workspace with realistic courses, students, attendance, and payments.';

    public function handle(): int
    {
        $this->newLine();
        $this->line('===========================================================');
        $this->line('         AIN PLATFORM — SALES DEMO WORKSPACE SEEDER        ');
        $this->line('===========================================================');

        $demoSlug = 'elite-future-academy';
        $existingOrg = Organization::query()->where('slug', $demoSlug)->first();

        if ($existingOrg) {
            if ($this->option('reset')) {
                $this->warn('Resetting existing demo workspace...');
                $existingOrg->payments()->delete();
                $existingOrg->forceDelete();
            } else {
                $this->info("Demo workspace already exists: [{$existingOrg->name}]");
                $this->printCredentials();

                return 0;
            }
        }

        $this->info('Seeding demo academy entities...');

        DB::transaction(function () use ($demoSlug) {
            // 1. Roles & Plans
            $ownerRole = Role::query()->where('name', OrganizationRole::Owner->value)->firstOrFail();
            $adminRole = Role::query()->where('name', OrganizationRole::Admin->value)->first();
            $instructorRole = Role::query()->where('name', OrganizationRole::Instructor->value)->first() ?? $adminRole;
            $growthPlan = Plan::query()->where('code', 'growth')->firstOrFail();

            // 2. Demo Users
            $password = Hash::make('Demo@2026!');

            $owner = User::query()->updateOrCreate(
                ['email' => 'demo.owner@ainplatform.com'],
                ['name' => 'د. حسام السعيد (مدير الأكاديمية)', 'password' => $password, 'is_minor' => false]
            );

            $instructor = User::query()->updateOrCreate(
                ['email' => 'demo.instructor@ainplatform.com'],
                ['name' => 'أ. أحمد فهمي (كبير معلمي الفيزياء)', 'password' => $password, 'is_minor' => false]
            );

            $guardian = User::query()->updateOrCreate(
                ['email' => 'demo.guardian@ainplatform.com'],
                ['name' => 'م. محمود الشريف (ولي أمر)', 'password' => $password, 'is_minor' => false]
            );

            $student = User::query()->updateOrCreate(
                ['email' => 'demo.student@ainplatform.com'],
                [
                    'name' => 'عمر محمود الشريف (طالب)',
                    'password' => $password,
                    'is_minor' => true,
                    'date_of_birth' => now()->subYears(16)->toDateString(),
                ]
            );

            // 3. Organization & Subscription
            $org = Organization::query()->create([
                'name' => 'أكاديمية نخبة المستقبل التعليمية',
                'slug' => $demoSlug,
                'status' => 'active',
                'locale' => 'ar',
                'timezone' => 'Africa/Cairo',
            ]);

            OrganizationSubscription::query()->create([
                'organization_id' => $org->id,
                'plan_id' => $growthPlan->id,
                'status' => 'active',
                'billing_interval' => 'monthly',
                'current_period_starts_at' => now(),
                'current_period_ends_at' => now()->addMonths(6),
            ]);

            // Memberships
            OrganizationMembership::query()->create([
                'organization_id' => $org->id,
                'user_id' => $owner->id,
                'role_id' => $ownerRole->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            OrganizationMembership::query()->create([
                'organization_id' => $org->id,
                'user_id' => $instructor->id,
                'role_id' => $instructorRole->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $instructorProfile = Instructor::query()->create([
                'organization_id' => $org->id,
                'user_id' => $instructor->id,
                'name' => $instructor->name,
                'status' => 'active',
            ]);

            // 4. Academy Profile
            AcademyProfile::query()->create([
                'organization_id' => $org->id,
                'slug' => $demoSlug,
                'public_name' => 'أكاديمية نخبة المستقبل',
                'description' => 'منصة تعليمية متطورة لطلاب الثانوية العامة واللغات، مع فصول تفاعلية ووسائل ردع وتتبع لتقليل تسريب المحتوى.',
                'is_public' => true,
                'verification_status' => 'verified',
                'verified_at' => now(),
            ]);

            // 5. Room & Courses
            $room = Room::query()->create([
                'organization_id' => $org->id,
                'created_by' => $owner->id,
                'name' => 'شعبة الفيزياء والعلوم المتكاملة',
                'slug' => 'physics-dept-demo',
                'status' => 'active',
            ]);

            $course = Course::query()->create([
                'organization_id' => $org->id,
                'academy_profile_id' => AcademyProfile::query()->where('organization_id', $org->id)->first()->id,
                'instructor_id' => $instructorProfile->id,
                'created_by' => $instructor->id,
                'title' => 'الفيزياء الحديثة والكهربية (الصف الثالث الثانوي)',
                'slug' => 'modern-physics-demo',
                'description' => 'شرح تفصيلي مع حل نماذج الامتحانات الوزارية والتطبيقات العملية وبنك الأسئلة التفاعلي.',
                'delivery_type' => 'online',
                'price_minor' => 85000, // 850.00 EGP
                'currency' => 'EGP',
                'status' => CourseStatus::Published,
                'published_at' => now(),
            ]);

            $batch = CourseBatch::query()->create([
                'organization_id' => $org->id,
                'course_id' => $course->id,
                'room_id' => $room->id,
                'title' => 'المجموعة الذهبية (أيام الأحد والثلاثاء)',
                'start_date' => now()->addDays(3)->toDateString(),
                'end_date' => now()->addMonths(3)->toDateString(),
                'schedule' => [
                    ['day' => 'Sunday', 'startTime' => '17:00', 'endTime' => '19:00'],
                    ['day' => 'Tuesday', 'startTime' => '17:00', 'endTime' => '19:00'],
                ],
                'delivery_type' => 'online',
                'capacity' => 25,
                'status' => BatchStatus::Open,
            ]);

            // 6. Guardian Consent & Student Link
            GuardianStudentLink::query()->create([
                'organization_id' => $org->id,
                'guardian_id' => $guardian->id,
                'student_id' => $student->id,
                'status' => 'active',
                'relationship' => 'father',
            ]);

            GuardianConsent::query()->create([
                'guardian_id' => $guardian->id,
                'student_id' => $student->id,
                'organization_id' => $org->id,
                'status' => 'approved',
                'terms_version' => '1.0',
                'terms_content_hash' => hash('sha256', 'Terms of Service v1.0'),
                'consented_at' => now()->subDays(5),
            ]);

            // 7. Booking & Electronic Payment
            $booking = Booking::query()->create([
                'organization_id' => $org->id,
                'course_id' => $course->id,
                'batch_id' => $batch->id,
                'student_id' => $student->id,
                'student_name' => $student->name,
                'email' => $student->email,
                'phone' => '+201012345678',
                'terms_accepted' => true,
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'amount_minor' => 85000,
                'currency' => 'EGP',
                'idempotency_key' => 'demo-booking-001',
            ]);

            Payment::query()->create([
                'organization_id' => $org->id,
                'booking_id' => $booking->id,
                'user_id' => $student->id,
                'provider' => 'paymob',
                'provider_reference' => 'paymob_demo_order_8899',
                'idempotency_key' => 'demo-payment-001',
                'amount_minor' => 85000,
                'refunded_amount_minor' => 0,
                'fee_minor' => 2638,
                'net_minor' => 82362,
                'currency' => 'EGP',
                'status' => 'paid',
                'paid_at' => now()->subDays(2),
            ]);

            // 8. Attendance Records
            for ($i = 1; $i <= 4; $i++) {
                $session = LearningSession::query()->create([
                    'organization_id' => $org->id,
                    'batch_id' => $batch->id,
                    'instructor_id' => $instructorProfile->id,
                    'created_by' => $instructor->id,
                    'title' => "Demo session {$i}",
                    'title_ar' => "الحصة التجريبية {$i}",
                    'starts_at' => now()->subWeeks($i)->setTime(17, 0),
                    'ends_at' => now()->subWeeks($i)->setTime(19, 0),
                    'status' => 'completed',
                ]);

                AttendanceRecord::query()->create([
                    'organization_id' => $org->id,
                    'session_id' => $session->id,
                    'student_id' => $student->id,
                    'marked_by' => $instructor->id,
                    'status' => 'present',
                    'instructor_note' => 'حضور متميز وتفاعل فعال في المناقشة',
                    'marked_at' => now()->subWeeks($i),
                ]);
            }
        });

        $this->info('✓ Enterprise sales demo workspace seeded successfully!');
        $this->printCredentials();

        return 0;
    }

    protected function printCredentials(): void
    {
        $this->newLine();
        $this->line('-----------------------------------------------------------');
        $this->line('            SALES DEMO LOGIN CREDENTIALS                   ');
        $this->line('-----------------------------------------------------------');
        $this->line('Password for all demo accounts: <fg=yellow>Demo@2026!</>');
        $this->newLine();
        $this->table(
            ['Role', 'Email', 'Purpose'],
            [
                ['Academy Owner (مدير المؤسسة)', 'demo.owner@ainplatform.com', 'Academy dashboard, billing, finance, analytics'],
                ['Senior Instructor (المعلم)', 'demo.instructor@ainplatform.com', 'Course authoring, batch schedules, student tasks'],
                ['Student (الطالب)', 'demo.student@ainplatform.com', 'Interactive classroom, courses, exams, video player'],
                ['Guardian (ولي الأمر)', 'demo.guardian@ainplatform.com', 'Attendance tracking, reports, consent approval'],
            ]
        );
        $this->line('Demo Academy URL: /app/elite-future-academy');
        $this->newLine();
    }
}
