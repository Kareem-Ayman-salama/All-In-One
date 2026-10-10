<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\AccountDeletionRequest;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\Booking;
use App\Models\ContentAccessLog;
use App\Models\CourseEnrollment;
use App\Models\Invoice;
use App\Models\LessonBooking;
use App\Models\Notification;
use App\Models\OrganizationMembership;
use App\Models\Payment;
use App\Models\QuizAttempt;
use App\Models\SupportRequest;
use App\Models\UserDevice;
use App\Models\UserSession;
use App\Models\VideoWatchProgress;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacyController extends Controller
{
    public function export(Request $request): JsonResponse
    {
        $user = $request->user();

        return ApiResponse::success($request, [
            'generatedAt' => now(),
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'locale' => $user->locale,
                'timezone' => $user->timezone,
                'avatarPath' => $user->avatar_path,
                'status' => $user->status,
                'createdAt' => $user->created_at,
            ],
            'memberships' => OrganizationMembership::query()
                ->with('organization:id,name,slug,type', 'role:id,name')
                ->where('user_id', $user->id)
                ->get(),
            'bookings' => Booking::query()
                ->where('student_id', $user->id)
                ->orWhere('email', $user->email)
                ->orWhere('normalized_email', $user->normalized_email)
                ->get(),
            'lessonBookings' => LessonBooking::query()
                ->where('student_id', $user->id)
                ->get(),
            'enrollments' => CourseEnrollment::query()
                ->where('student_id', $user->id)
                ->get(),
            'payments' => Payment::query()
                ->where('user_id', $user->id)
                ->get([
                    'id',
                    'organization_id',
                    'booking_id',
                    'provider',
                    'provider_reference',
                    'amount_minor',
                    'currency',
                    'status',
                    'paid_at',
                    'failed_at',
                    'refunded_at',
                    'created_at',
                ]),
            'invoices' => Invoice::query()
                ->where('user_id', $user->id)
                ->get(),
            'attendanceRecords' => AttendanceRecord::query()
                ->where('student_id', $user->id)
                ->get(),
            'quizAttempts' => QuizAttempt::query()
                ->where('student_id', $user->id)
                ->get(),
            'assignmentSubmissions' => AssignmentSubmission::query()
                ->where('student_id', $user->id)
                ->get(),
            'watchProgress' => VideoWatchProgress::query()
                ->where('student_id', $user->id)
                ->get(),
            'devices' => UserDevice::query()
                ->where('user_id', $user->id)
                ->get([
                    'id',
                    'organization_id',
                    'device_name',
                    'browser',
                    'operating_system',
                    'platform',
                    'app_version',
                    'first_seen_at',
                    'last_seen_at',
                    'last_ip',
                    'status',
                    'approved_at',
                    'revoked_at',
                ]),
            'sessions' => UserSession::query()
                ->where('user_id', $user->id)
                ->get([
                    'id',
                    'user_device_id',
                    'name',
                    'installation_id',
                    'platform',
                    'app_version',
                    'ip_address',
                    'user_agent',
                    'last_used_at',
                    'expires_at',
                    'revoked_at',
                    'created_at',
                ]),
            'supportRequests' => SupportRequest::query()
                ->where('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->orWhere('email', $user->normalized_email)
                ->get(),
            'notifications' => Notification::query()
                ->where('user_id', $user->id)
                ->get(),
            'contentAccessLogs' => ContentAccessLog::query()
                ->where('user_id', $user->id)
                ->get(),
        ]);
    }

    public function requestDeletion(Request $request): JsonResponse
    {
        $existing = AccountDeletionRequest::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->first();
        if ($existing) {
            return ApiResponse::success($request, $existing);
        }
        $deletion = AccountDeletionRequest::query()->create([
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'reason' => $request->string('reason')->limit(2000)->toString() ?: null,
            'requested_at' => now(),
            'scheduled_for' => now()->addDays(
                max(1, (int) config('aio.privacy.deletion_grace_days')),
            ),
        ]);

        return ApiResponse::success($request, $deletion, status: 202);
    }

    public function cancelDeletion(Request $request): JsonResponse
    {
        $deletion = AccountDeletionRequest::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->latest('requested_at')
            ->first();
        if (! $deletion) {
            throw new ApiException(
                'DELETION_REQUEST_NOT_FOUND',
                'No pending account deletion request was found.',
                404,
            );
        }

        $deletion->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return ApiResponse::success($request, $deletion);
    }
}
