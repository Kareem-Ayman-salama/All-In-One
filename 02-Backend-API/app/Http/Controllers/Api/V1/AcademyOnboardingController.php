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
        $hasCourse = Course::query()->where('organization_id', $organization->id)->exists();
        $hasPublishedCourse = Course::query()->where('organization_id', $organization->id)->where('status', CourseStatus::Published)->exists();
        $hasBatch = CourseBatch::query()->where('organization_id', $organization->id)->exists();
        $hasStudent = $organization->bookings()->exists();
        $hasPayment = $organization->payments()->where('status', 'paid')->exists();

        $checklist = [
            [
                'id' => 'profile',
                'title_ar' => 'إكمال الملف التعريفي للأكاديمية',
                'title_en' => 'Complete Academy Profile',
                'description_ar' => 'أضف اسم الأكاديمية والشعار والوصف العام ورابط الصفحة العامة.',
                'description_en' => 'Add public name, logo, description, and custom vanity URL.',
                'completed' => $hasProfile,
                'action_path' => "/app/{$organization->slug}/settings/profile",
            ],
            [
                'id' => 'course',
                'title_ar' => 'إنشاء ونشر أول كورس تعليمي',
                'title_en' => 'Create and Publish First Course',
                'description_ar' => 'حدد المنهج الدراسي، وسعر الاشتراك، وتفاصيل الحصص.',
                'description_en' => 'Specify curriculum, pricing, and lesson outline.',
                'completed' => $hasPublishedCourse,
                'action_path' => "/app/{$organization->slug}/courses/new",
            ],
            [
                'id' => 'batch',
                'title_ar' => 'جدولة المجموعات والمواعيد (Batches)',
                'title_en' => 'Schedule Cohorts & Batches',
                'description_ar' => 'حدد مواعيد الحصص الأسبوعية وعدد المقاعد المتاحة.',
                'description_en' => 'Set weekly schedule and student capacity limit.',
                'completed' => $hasBatch,
                'action_path' => "/app/{$organization->slug}/batches",
            ],
            [
                'id' => 'first_student',
                'title_ar' => 'استقبال أول طالب أو تسجيل تجريبي',
                'title_en' => 'Enroll First Student',
                'description_ar' => 'شارك رابط الكورس مع طلابك أو قم بإجراء تسجيل تجريبي.',
                'description_en' => 'Share course link or complete a trial enrollment.',
                'completed' => $hasStudent,
                'action_path' => "/app/{$organization->slug}/bookings",
            ],
            [
                'id' => 'payment',
                'title_ar' => 'تفعيل الدفع الإلكتروني عبر Paymob',
                'title_en' => 'Enable Paymob Online Payments',
                'description_ar' => 'استقبل المدفوعات بالبطاقات البنكية والمحافظ الإلكترونية المصرية.',
                'description_en' => 'Collect fees seamlessly via card and Egyptian mobile wallets.',
                'completed' => $hasPayment,
                'action_path' => "/app/{$organization->slug}/settings/billing",
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
