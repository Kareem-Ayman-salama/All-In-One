<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Marketplace\Enums\CourseStatus;
use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\AcademyProfile;
use App\Models\Course;
use App\Models\CourseBatch;
use App\Models\Organization;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademyOnboardingController extends Controller
{
    /**
     * Return comprehensive onboarding readiness scorecard and next steps for an academy.
     */
    public function wizard(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            throw new ApiException('AUTHENTICATION_REQUIRED', 'Authentication required.', 401);
        }

        $orgId = $request->query('organization_id');
        $organization = null;

        if ($orgId) {
            $organization = Organization::query()->find($orgId);
        } else {
            $membership = $user->organizationMemberships()
                ->where('status', 'active')
                ->first();
            $organization = $membership ? Organization::query()->find($membership->organization_id) : null;
        }

        if (! $organization) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'No active academy found for this user.', 404);
        }

        $hasProfile = AcademyProfile::query()->where('organization_id', $organization->id)->exists();
        $hasInstructor = $organization->instructors()->exists()
            || $organization->memberships()->whereHas('role', fn ($r) => $r->where('name', 'instructor'))->exists();
        $hasCourse = Course::query()->where('organization_id', $organization->id)->exists();
        $hasPublishedCourse = Course::query()->where('organization_id', $organization->id)->where('status', CourseStatus::Published)->exists();
        $hasBatch = CourseBatch::query()->where('organization_id', $organization->id)->exists();
        $hasRoom = $organization->rooms()->exists();
        $hasStudent = $organization->bookings()->exists() || $organization->courseEnrollments()->exists();
        $hasPayment = $organization->payments()->where('status', 'paid')->exists()
            || ! empty(config('services.paymob.api_key'));

        $checklist = [
            [
                'id' => 'profile',
                'title_ar' => 'إكمال الملف التعريفي للأكاديمية',
                'title_en' => 'Academy Profile',
                'description_ar' => 'أضف اسم الأكاديمية والشعار والوصف العام.',
                'description_en' => 'Add public name, logo, and academy description.',
                'completed' => $hasProfile,
                'action_path' => "/app/{$organization->slug}/settings/profile",
            ],
            [
                'id' => 'instructor',
                'title_ar' => 'إضافة أو دعوة محاضر',
                'title_en' => 'Instructor Added',
                'description_ar' => 'أضف محاضرين أو قم بدعوة أعضاء هيئة التدريس.',
                'description_en' => 'Invite faculty members and instructors.',
                'completed' => $hasInstructor,
                'action_path' => "/app/{$organization->slug}/instructors",
            ],
            [
                'id' => 'course',
                'title_ar' => 'إنشاء كورس تعليمي',
                'title_en' => 'Course Created',
                'description_ar' => 'حدد المنهج الدراسي وسعر الاشتراك وسياسة إكمال الكورس.',
                'description_en' => 'Specify curriculum, price, and completion policy.',
                'completed' => $hasCourse,
                'action_path' => "/app/{$organization->slug}/courses/new",
            ],
            [
                'id' => 'batch',
                'title_ar' => 'جدولة مجموعة (Batch)',
                'title_en' => 'Batch Created',
                'description_ar' => 'حدد مواعيد الحصص الأسبوعية وعدد المقاعد المتاحة.',
                'description_en' => 'Set weekly schedule and student capacity limit.',
                'completed' => $hasBatch,
                'action_path' => "/app/{$organization->slug}/batches",
            ],
            [
                'id' => 'room',
                'title_ar' => 'إنشاء غرفة تعليمية (Room)',
                'title_en' => 'Room Created',
                'description_ar' => 'أنشئ غرفة الحصص والمحتوى المحمي.',
                'description_en' => 'Create protected learning room for live and recorded sessions.',
                'completed' => $hasRoom,
                'action_path' => "/app/{$organization->slug}/rooms",
            ],
            [
                'id' => 'students',
                'title_ar' => 'تسجيل أو إضافة طلاب',
                'title_en' => 'Students Added',
                'description_ar' => 'استقبل تسجيلات الطلاب أو قم بدعوتهم إلى الغرفة.',
                'description_en' => 'Enroll students or import existing rosters.',
                'completed' => $hasStudent,
                'action_path' => "/app/{$organization->slug}/bookings",
            ],
            [
                'id' => 'payment',
                'title_ar' => 'تهيئة بوابة الدفع (Paymob)',
                'title_en' => 'Payment Configured',
                'description_ar' => 'تفعيل الدفع الإلكتروني أو العمل في وضع التحصيل اليدوي/التجريبي.',
                'description_en' => 'Configure Paymob or operate in manual collection / pilot mode.',
                'completed' => $hasPayment,
                'action_path' => "/app/{$organization->slug}/settings/billing",
            ],
            [
                'id' => 'course_published',
                'title_ar' => 'نشر أول كورس في سوق الكورسات',
                'title_en' => 'First Course Published',
                'description_ar' => 'انشر الكورس ليظهر للطلاب في الصفحة العامة وسوق الكورسات.',
                'description_en' => 'Publish the course to make it discoverable on the marketplace.',
                'completed' => $hasPublishedCourse,
                'action_path' => "/app/{$organization->slug}/courses",
            ],
        ];

        $completedCount = collect($checklist)->where('completed', true)->count();
        $totalCount = count($checklist);
        $progressPercent = (int) round(($completedCount / $totalCount) * 100);

        $nextStep = collect($checklist)->firstWhere('completed', false);

        return ApiResponse::success($request, [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
            ],
            'progress_percent' => $progressPercent,
            'completed_steps' => $completedCount,
            'total_steps' => $totalCount,
            'is_fully_onboarded' => $progressPercent === 100,
            'next_step' => $nextStep,
            'checklist' => $checklist,
        ]);
    }
}
