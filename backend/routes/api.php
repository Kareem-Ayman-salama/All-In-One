<?php

use App\Http\Controllers\Api\V1\AcademyProfileController;
use App\Http\Controllers\Api\V1\AdminCategoryController;
use App\Http\Controllers\Api\V1\AdminModerationController;
use App\Http\Controllers\Api\V1\AnalyticsController;
use App\Http\Controllers\Api\V1\AnnouncementController;
use App\Http\Controllers\Api\V1\AttendanceController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BookingController;
use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\CourseBatchController;
use App\Http\Controllers\Api\V1\CourseController;
use App\Http\Controllers\Api\V1\DevicePushTokenController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\GuardianController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\InstructorController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\LessonBookingController;
use App\Http\Controllers\Api\V1\MemberDeviceController;
use App\Http\Controllers\Api\V1\MembershipController;
use App\Http\Controllers\Api\V1\MetadataController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\NotificationPreferenceController;
use App\Http\Controllers\Api\V1\OrganizationController;
use App\Http\Controllers\Api\V1\OtpOperationsController;
use App\Http\Controllers\Api\V1\PrivacyController;
use App\Http\Controllers\Api\V1\PromotionController;
use App\Http\Controllers\Api\V1\PublicMarketplaceController;
use App\Http\Controllers\Api\V1\ReportExportController;
use App\Http\Controllers\Api\V1\RoomController;
use App\Http\Controllers\Api\V1\RoomMembershipController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\StudentController;
use App\Http\Controllers\Api\V1\SupportController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health/live', [HealthController::class, 'live']);
    Route::get('/health/ready', [HealthController::class, 'ready']);
    Route::get('/health/otp', [HealthController::class, 'otp']);
    Route::get('/meta/error-catalog', [MetadataController::class, 'errorCatalog']);
    Route::get('/meta/deep-links', [MetadataController::class, 'deepLinks']);
    Route::get('/meta/offline-cache-policy', [MetadataController::class, 'offlineCachePolicy']);
    Route::get('/meta/device-policy', [MetadataController::class, 'devicePolicy']);
    Route::get('/public/courses', [PublicMarketplaceController::class, 'courses']);
    Route::get('/public/courses/{course}', [PublicMarketplaceController::class, 'course']);
    Route::get('/public/academies', [PublicMarketplaceController::class, 'academies']);
    Route::get('/public/academies/{academy}', [PublicMarketplaceController::class, 'academy']);
    Route::get('/public/categories', [PublicMarketplaceController::class, 'categories']);
    Route::get('/public/instructors', [LessonBookingController::class, 'publicInstructors']);
    Route::get('/content-view/{content}', [ContentController::class, 'viewSigned'])
        ->middleware(['signed', 'throttle:120,1'])
        ->name('api.v1.content-view.show');
    Route::get('/public/invitations/{token}', [InvitationController::class, 'preview'])
        ->middleware('throttle:30,1');
    Route::post('/public/trial-leads', [SupportController::class, 'trialLead'])
        ->middleware('throttle:support');
    Route::post('/support', [SupportController::class, 'store'])
        ->middleware('throttle:support');

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', [AuthController::class, 'register'])
            ->middleware('throttle:verification');
        Route::post('/verify-email', [AuthController::class, 'verifyEmail'])
            ->middleware('throttle:verification');
        Route::post('/resend-verification', [AuthController::class, 'resendVerification'])
            ->middleware('throttle:verification');
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:login');
        Route::post('/refresh', [AuthController::class, 'refresh'])
            ->middleware('throttle:login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
            ->middleware('throttle:verification');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])
            ->middleware('throttle:verification');

        Route::middleware(['auth:sanctum', 'account.active'])->group(function (): void {
            Route::get('/me', [AuthController::class, 'me']);
            Route::patch('/me', [AuthController::class, 'updateProfile']);
            Route::post('/change-password', [AuthController::class, 'changePassword']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/sessions', [SessionController::class, 'index']);
            Route::delete('/sessions/others', [SessionController::class, 'destroyOthers']);
            Route::delete('/sessions/{session}', [SessionController::class, 'destroy']);
        });
    });

    Route::middleware(['auth:sanctum', 'account.active'])->group(function (): void {
        Route::get('/workspaces', [WorkspaceController::class, 'index']);
        Route::post('/organizations', [OrganizationController::class, 'store']);
        Route::post('/invitations/accept', [InvitationController::class, 'accept']);
        Route::post('/public/bookings', [BookingController::class, 'reserve'])
            ->middleware('throttle:public-booking');
        Route::get('/student/bookings', [StudentController::class, 'bookings']);
        Route::get('/student/enrollments', [StudentController::class, 'enrollments']);
        Route::get('/student/enrollments/{enrollment}', [StudentController::class, 'enrollment']);
        Route::get('/student/lesson-bookings', [LessonBookingController::class, 'mine']);
        Route::post('/student/lesson-bookings', [LessonBookingController::class, 'reserve'])
            ->middleware('throttle:20,1');
        Route::post('/student/lesson-bookings/{booking}/cancel', [LessonBookingController::class, 'cancel']);
        Route::get('/student/attendance', [AttendanceController::class, 'mine']);
        Route::post('/student/attendance/check-in', [AttendanceController::class, 'checkIn']);
        Route::get('/guardian/students', [GuardianController::class, 'students']);
        Route::get('/guardian/students/{student}/attendance', [GuardianController::class, 'attendance']);
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::get('/notification-preferences', [NotificationPreferenceController::class, 'show']);
        Route::put('/notification-preferences', [NotificationPreferenceController::class, 'update']);
        Route::post('/devices/push-tokens', [DevicePushTokenController::class, 'store'])
            ->middleware('throttle:30,1');
        Route::delete('/devices/push-tokens', [DevicePushTokenController::class, 'destroy'])
            ->middleware('throttle:30,1');
        Route::get('/privacy/export', [PrivacyController::class, 'export']);
        Route::post('/privacy/deletion', [PrivacyController::class, 'requestDeletion']);
        Route::delete('/privacy/deletion', [PrivacyController::class, 'cancelDeletion']);
        Route::get('/organizations/{organization}/context', [WorkspaceController::class, 'context'])
            ->middleware('organization.context');

        Route::prefix('/organizations/{organization}')
            ->middleware('organization.context')
            ->group(function (): void {
                Route::get('/rooms', [RoomController::class, 'index'])
                    ->middleware(['module:rooms', 'permission:rooms.view']);
                Route::post('/rooms', [RoomController::class, 'store'])
                    ->middleware(['module:rooms', 'permission:rooms.create']);
                Route::get('/rooms/{room}', [RoomController::class, 'show'])
                    ->middleware(['module:rooms', 'permission:rooms.view']);
                Route::patch('/rooms/{room}', [RoomController::class, 'update'])
                    ->middleware(['module:rooms', 'permission:rooms.update']);
                Route::delete('/rooms/{room}', [RoomController::class, 'destroy'])
                    ->middleware(['module:rooms', 'permission:rooms.delete']);
                Route::get('/rooms/{room}/members', [RoomMembershipController::class, 'index'])
                    ->middleware(['module:rooms', 'permission:rooms.view']);
                Route::post('/rooms/{room}/members', [RoomMembershipController::class, 'store'])
                    ->middleware(['module:rooms', 'permission:rooms.update']);
                Route::patch('/rooms/{room}/members/{roomMembership}', [RoomMembershipController::class, 'update'])
                    ->middleware(['module:rooms', 'permission:rooms.update']);
                Route::delete('/rooms/{room}/members/{roomMembership}', [RoomMembershipController::class, 'destroy'])
                    ->middleware(['module:rooms', 'permission:rooms.update']);

                Route::get('/invitations', [InvitationController::class, 'index'])
                    ->middleware(['module:members', 'permission:members.view']);
                Route::post('/invitations', [InvitationController::class, 'store'])
                    ->middleware(['module:members', 'permission:members.invite']);
                Route::post('/invitations/{invitation}/resend', [InvitationController::class, 'resend'])
                    ->middleware(['module:members', 'permission:members.invite']);
                Route::delete('/invitations/{invitation}', [InvitationController::class, 'cancel'])
                    ->middleware(['module:members', 'permission:members.invite']);

                Route::patch('/', [OrganizationController::class, 'update'])
                    ->middleware('permission:organization.update');
                Route::get('/members', [MembershipController::class, 'index'])
                    ->middleware(['module:members', 'permission:members.view']);
                Route::patch('/members/{membership}', [MembershipController::class, 'update'])
                    ->middleware(['module:members', 'permission:members.update']);
                Route::delete('/members/{membership}', [MembershipController::class, 'destroy'])
                    ->middleware(['module:members', 'permission:members.remove']);

                Route::get('/content', [ContentController::class, 'index'])
                    ->middleware(['module:content', 'permission:content.view']);
                Route::post('/content', [ContentController::class, 'store'])
                    ->middleware(['module:content', 'permission:content.create']);
                Route::get('/content/{content}/download', [ContentController::class, 'download'])
                    ->middleware(['module:content', 'permission:content.view', 'throttle:content-playback']);
                Route::get('/content/{content}/view-session', [ContentController::class, 'viewSession'])
                    ->middleware(['module:content', 'permission:content.view', 'throttle:content-playback']);
                Route::post('/content/{content}/viewer-audit', [ContentController::class, 'viewerAudit'])
                    ->middleware(['module:content', 'permission:content.view', 'throttle:content-playback']);
                Route::delete('/content/{content}', [ContentController::class, 'destroy'])
                    ->middleware(['module:content', 'permission:content.delete']);

                Route::get('/announcements', [AnnouncementController::class, 'index'])
                    ->middleware(['module:announcements', 'permission:announcements.view']);
                Route::post('/announcements', [AnnouncementController::class, 'store'])
                    ->middleware(['module:announcements', 'permission:announcements.create']);
                Route::patch('/announcements/{announcement}', [AnnouncementController::class, 'update'])
                    ->middleware(['module:announcements', 'permission:announcements.create']);
                Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])
                    ->middleware(['module:announcements', 'permission:announcements.create']);

                Route::get('/events', [EventController::class, 'index'])
                    ->middleware(['module:calendar', 'permission:events.view']);
                Route::post('/events', [EventController::class, 'store'])
                    ->middleware(['module:calendar', 'permission:events.manage']);
                Route::delete('/events/{event}', [EventController::class, 'destroy'])
                    ->middleware(['module:calendar', 'permission:events.manage']);

                Route::get('/tasks', [TaskController::class, 'index'])
                    ->middleware(['module:calendar', 'permission:events.view']);
                Route::post('/tasks', [TaskController::class, 'store'])
                    ->middleware(['module:calendar', 'permission:events.manage']);
                Route::patch('/tasks/{task}', [TaskController::class, 'update'])
                    ->middleware(['module:calendar', 'permission:events.manage']);
                Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])
                    ->middleware(['module:calendar', 'permission:events.manage']);

                Route::middleware('module:courses')->group(function (): void {
                    Route::get('/academy-profile', [AcademyProfileController::class, 'show'])
                        ->middleware('permission:organization.view');
                    Route::put('/academy-profile', [AcademyProfileController::class, 'upsert'])
                        ->middleware('permission:organization.manage_branding');

                    Route::get('/instructors', [InstructorController::class, 'index'])
                        ->middleware('permission:courses.view');
                    Route::post('/instructors', [InstructorController::class, 'store'])
                        ->middleware('permission:courses.create');
                    Route::put('/instructors/{instructor}', [InstructorController::class, 'update'])
                        ->middleware('permission:courses.update');
                    Route::get('/instructor-slots', [LessonBookingController::class, 'slots'])
                        ->middleware('permission:courses.view');
                    Route::post('/instructor-slots', [LessonBookingController::class, 'createSlot'])
                        ->middleware('permission:courses.update');
                    Route::get('/lesson-bookings', [LessonBookingController::class, 'organizationIndex'])
                        ->middleware('permission:bookings.view');

                    Route::get('/courses', [CourseController::class, 'index'])
                        ->middleware('permission:courses.view');
                    Route::post('/courses', [CourseController::class, 'store'])
                        ->middleware('permission:courses.create');
                    Route::get('/courses/{course}', [CourseController::class, 'show'])
                        ->middleware('permission:courses.view');
                    Route::put('/courses/{course}', [CourseController::class, 'update'])
                        ->middleware('permission:courses.update');
                    Route::post('/courses/{course}/submit-review', [CourseController::class, 'submitForReview'])
                        ->middleware('permission:courses.publish');

                    Route::get('/batches', [CourseBatchController::class, 'index'])
                        ->middleware('permission:batches.view');
                    Route::post('/batches', [CourseBatchController::class, 'store'])
                        ->middleware('permission:batches.manage');
                    Route::patch('/batches/{batch}', [CourseBatchController::class, 'update'])
                        ->middleware('permission:batches.manage');
                });

                Route::middleware('module:bookings')->group(function (): void {
                    Route::get('/bookings', [BookingController::class, 'index'])
                        ->middleware('permission:bookings.view');
                    Route::post('/bookings/{booking}/confirm', [BookingController::class, 'confirm'])
                        ->middleware('permission:bookings.confirm');
                    Route::post('/bookings/{booking}/reject', [BookingController::class, 'reject'])
                        ->middleware('permission:bookings.manage');
                    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel'])
                        ->middleware('permission:bookings.cancel');
                    Route::get('/reports/bookings', [ReportExportController::class, 'bookings'])
                        ->middleware('permission:reports.export');
                });

                Route::get('/learning-sessions', [AttendanceController::class, 'sessions'])
                    ->middleware('permission:attendance.view');
                Route::post('/learning-sessions', [AttendanceController::class, 'storeSession'])
                    ->middleware('permission:attendance.manage');
                Route::get('/learning-sessions/{session}/attendance', [AttendanceController::class, 'attendance'])
                    ->middleware('permission:attendance.view');
                Route::put('/learning-sessions/{session}/attendance', [AttendanceController::class, 'mark'])
                    ->middleware('permission:attendance.manage');
                Route::post('/learning-sessions/{session}/attendance/lock', [AttendanceController::class, 'lock'])
                    ->middleware('permission:attendance.manage');
                Route::post('/learning-sessions/{session}/attendance/qr', [AttendanceController::class, 'generateQr'])
                    ->middleware('permission:attendance.manage');
                Route::get('/learning-sessions/{session}/attendance/history', [AttendanceController::class, 'history'])
                    ->middleware('permission:attendance.view');
                Route::get('/guardians', [GuardianController::class, 'index'])
                    ->middleware('permission:guardians.view');
                Route::post('/guardians', [GuardianController::class, 'link'])
                    ->middleware('permission:guardians.manage');
                Route::delete('/guardians/{link}', [GuardianController::class, 'unlink'])
                    ->middleware('permission:guardians.manage');
                Route::post('/guardians/weekly-reports/send', [GuardianController::class, 'sendWeeklyReports'])
                    ->middleware('permission:guardians.manage');
                Route::get('/reports/attendance', [ReportExportController::class, 'attendance'])
                    ->middleware('permission:reports.export');

                Route::middleware('module:promotions')->group(function (): void {
                    Route::get('/promotions', [PromotionController::class, 'index'])
                        ->middleware('permission:promotions.view');
                    Route::post('/promotions', [PromotionController::class, 'store'])
                        ->middleware('permission:promotions.manage');
                });

                Route::get('/audit-logs', [AuditLogController::class, 'organization'])
                    ->middleware('permission:audit.view');
                Route::get('/content-access-logs', [AuditLogController::class, 'contentAccess'])
                    ->middleware('permission:audit.view');
                Route::get('/member-sessions', [SessionController::class, 'organizationSessions'])
                    ->middleware('permission:audit.view');
                Route::delete('/members/{member}/sessions', [SessionController::class, 'destroyMemberSessions'])
                    ->middleware('permission:audit.view');
                Route::get('/member-devices', [MemberDeviceController::class, 'index'])
                    ->middleware('permission:audit.view');
                Route::get('/members/{member}/devices', [MemberDeviceController::class, 'member'])
                    ->middleware('permission:audit.view');
                Route::post('/members/{member}/devices/{device}/approve', [MemberDeviceController::class, 'approve'])
                    ->middleware('permission:audit.view');
                Route::post('/members/{member}/devices/{device}/block', [MemberDeviceController::class, 'block'])
                    ->middleware('permission:audit.view');
                Route::post('/members/{member}/devices/{device}/revoke', [MemberDeviceController::class, 'revoke'])
                    ->middleware('permission:audit.view');
                Route::get('/analytics/overview', [AnalyticsController::class, 'organization'])
                    ->middleware(['module:analytics', 'permission:analytics.view']);
            });

        Route::prefix('/admin')
            ->middleware('platform.role:super_admin,platform_support,platform_moderator')
            ->group(function (): void {
                Route::get('/organizations', [AdminModerationController::class, 'organizations']);
                Route::get('/academies', [AdminModerationController::class, 'academies']);
                Route::post('/academies/{academy}/verify', [AdminModerationController::class, 'verifyAcademy']);
                Route::post('/academies/{academy}/reject', [AdminModerationController::class, 'rejectAcademy']);
                Route::get('/courses', [AdminModerationController::class, 'courses']);
                Route::post('/courses/{course}/approve', [AdminModerationController::class, 'approveCourse']);
                Route::post('/courses/{course}/reject', [AdminModerationController::class, 'rejectCourse']);
                Route::get('/promotions', [AdminModerationController::class, 'promotions']);
                Route::post('/promotions/{promotion}/approve', [AdminModerationController::class, 'approvePromotion']);
                Route::post('/promotions/{promotion}/reject', [AdminModerationController::class, 'rejectPromotion']);
                Route::get('/categories', [AdminCategoryController::class, 'index']);
                Route::post('/categories', [AdminCategoryController::class, 'store']);
                Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
                Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);
                Route::get('/audit-logs', [AuditLogController::class, 'platform']);
                Route::get('/analytics/overview', [AnalyticsController::class, 'platform']);
                Route::get('/support', [SupportController::class, 'index']);
                Route::middleware('platform.role:super_admin')->group(function (): void {
                    Route::get('/otp/status', [OtpOperationsController::class, 'status']);
                    Route::post('/otp/test', [OtpOperationsController::class, 'sendTest'])
                        ->middleware('throttle:otp-operations');
                });
            });
    });
});
