<?php

namespace App\Services\Courses;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\ContentItem;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\LearningSession;
use App\Models\Organization;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use App\Models\VideoWatchProgress;
use App\Services\Operations\OperationRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseCompletionService
{
    public function __construct(
        protected OperationRecorder $recorder,
    ) {}

    /**
     * Resolves completion policy using hierarchical resolution:
     * Platform Default -> Organization Default -> Course Override.
     *
     * @return array{
     *   require_lessons_completion: bool,
     *   minimum_lesson_completion_percentage: int,
     *   require_assignments: bool,
     *   require_all_required_assignments: bool,
     *   require_quizzes: bool,
     *   minimum_quiz_score: int,
     *   require_attendance: bool,
     *   minimum_attendance_percentage: int,
     *   certificate_enabled: bool
     * }
     */
    public function resolvePolicy(?Course $course = null, ?Organization $organization = null): array
    {
        $platformDefaults = config('course_completion.default_policy', [
            'require_lessons_completion' => true,
            'minimum_lesson_completion_percentage' => 85,
            'require_assignments' => true,
            'require_all_required_assignments' => true,
            'require_quizzes' => true,
            'minimum_quiz_score' => 60,
            'require_attendance' => true,
            'minimum_attendance_percentage' => 70,
            'certificate_enabled' => true,
        ]);

        $org = $organization ?? $course?->organization;
        $orgPolicy = $org?->settings['completion_policy']
            ?? $org?->settings['default_completion_policy']
            ?? [];

        $coursePolicy = $course?->completion_policy ?? [];

        return array_merge(
            $platformDefaults,
            array_filter($orgPolicy, fn ($v) => $v !== null),
            array_filter($coursePolicy, fn ($v) => $v !== null),
        );
    }

    /**
     * Evaluate completion rules authoritatively for a course enrollment based on resolved policy.
     *
     * @return array{
     *   eligible: bool,
     *   completed: bool,
     *   policy: array<string, mixed>,
     *   summary: array<string, mixed>,
     *   reasons: list<string>
     * }
     */
    public function evaluate(CourseEnrollment $enrollment, ?Request $request = null): array
    {
        $course = $enrollment->course;
        $student = $enrollment->student;
        $batch = $enrollment->batch;
        $orgId = $enrollment->organization_id;
        $organization = $enrollment->organization;

        $policy = $this->resolvePolicy($course, $organization);

        $reasons = [];
        $summary = [
            'lessons' => [
                'required' => (bool) $policy['require_lessons_completion'],
                'threshold' => (int) $policy['minimum_lesson_completion_percentage'],
                'total' => 0,
                'completed' => 0,
                'passed' => true,
            ],
            'quizzes' => [
                'required' => (bool) $policy['require_quizzes'],
                'threshold' => (int) $policy['minimum_quiz_score'],
                'total' => 0,
                'passed' => 0,
                'passedAll' => true,
            ],
            'assignments' => [
                'required' => (bool) $policy['require_assignments'],
                'total' => 0,
                'submitted' => 0,
                'passedAll' => true,
            ],
            'attendance' => [
                'required' => (bool) $policy['require_attendance'],
                'threshold' => (int) $policy['minimum_attendance_percentage'],
                'totalSessions' => 0,
                'attended' => 0,
                'rate' => 100,
                'passed' => true,
            ],
            'certificateEnabled' => (bool) $policy['certificate_enabled'],
        ];

        // 1. Lessons & Video Completion Rule
        $roomId = $batch?->room_id ?? $enrollment->room_membership_id;
        $lessonQuery = ContentItem::query()->where('organization_id', $orgId);
        if ($roomId) {
            $lessonQuery->where('room_id', $roomId);
        }
        $totalLessons = $lessonQuery->count();
        $summary['lessons']['total'] = $totalLessons;

        if ($policy['require_lessons_completion']) {
            if ($totalLessons > 0) {
                $minPercent = (int) $policy['minimum_lesson_completion_percentage'];
                $lessonIds = $lessonQuery->pluck('id')->all();
                $completedCount = VideoWatchProgress::query()
                    ->where('student_id', $student->id)
                    ->whereIn('content_id', $lessonIds)
                    ->where(function ($q) use ($minPercent): void {
                        $q->where('is_completed', true)
                            ->orWhere('completion_percentage', '>=', $minPercent);
                    })
                    ->count();

                $summary['lessons']['completed'] = $completedCount;
                if ($completedCount < $totalLessons) {
                    $summary['lessons']['passed'] = false;
                    $reasons[] = "Incomplete course lessons ({$completedCount}/{$totalLessons} completed at >= {$minPercent}%).";
                }
            }
        } else {
            $summary['lessons']['passed'] = true;
        }

        // 2. Published Quizzes Rule
        $quizzes = Quiz::query()
            ->where('organization_id', $orgId)
            ->where('is_published', true)
            ->where(function ($q) use ($course, $roomId): void {
                $q->whereNull('course_id')
                    ->orWhere('course_id', $course->id)
                    ->when($roomId, fn ($sub) => $sub->orWhere('room_id', $roomId));
            })
            ->get();
        $summary['quizzes']['total'] = $quizzes->count();

        if ($policy['require_quizzes']) {
            if ($quizzes->isNotEmpty()) {
                $passedQuizzes = 0;
                $minScore = (int) $policy['minimum_quiz_score'];
                foreach ($quizzes as $quiz) {
                    $hasPassed = QuizAttempt::query()
                        ->where('quiz_id', $quiz->id)
                        ->where('student_id', $student->id)
                        ->where(function ($q) use ($minScore): void {
                            $q->where('passed', true)
                                ->orWhere('score', '>=', $minScore);
                        })
                        ->exists();

                    if ($hasPassed) {
                        $passedQuizzes++;
                    } else {
                        $reasons[] = "Required quiz not passed: '{$quiz->title}'.";
                    }
                }
                $summary['quizzes']['passed'] = $passedQuizzes;
                $summary['quizzes']['passedAll'] = ($passedQuizzes === $quizzes->count());
            }
        } else {
            $summary['quizzes']['passedAll'] = true;
        }

        // 3. Published Assignments Rule
        $assignments = Assignment::query()
            ->where('organization_id', $orgId)
            ->where('status', 'published')
            ->get();
        $summary['assignments']['total'] = $assignments->count();

        if ($policy['require_assignments']) {
            if ($assignments->isNotEmpty()) {
                $submittedAssignments = 0;
                foreach ($assignments as $assignment) {
                    $hasSubmitted = AssignmentSubmission::query()
                        ->where('assignment_id', $assignment->id)
                        ->where('student_id', $student->id)
                        ->whereIn('status', ['submitted', 'graded'])
                        ->exists();

                    if ($hasSubmitted) {
                        $submittedAssignments++;
                    } else {
                        $reasons[] = "Required assignment not submitted: '{$assignment->title}'.";
                    }
                }
                $summary['assignments']['submitted'] = $submittedAssignments;
                $summary['assignments']['passedAll'] = ($submittedAssignments === $assignments->count());
            }
        } else {
            $summary['assignments']['passedAll'] = true;
        }

        // 4. Minimum Attendance Rule
        if ($policy['require_attendance'] && $batch) {
            $sessionIds = LearningSession::query()
                ->where('batch_id', $batch->id)
                ->pluck('id')
                ->all();
            $totalSessions = count($sessionIds);
            $summary['attendance']['totalSessions'] = $totalSessions;

            if ($totalSessions > 0) {
                $attended = AttendanceRecord::query()
                    ->whereIn('session_id', $sessionIds)
                    ->where('student_id', $student->id)
                    ->whereIn('status', ['present', 'late'])
                    ->count();

                $minAttendance = (int) $policy['minimum_attendance_percentage'];
                $rate = round(($attended / $totalSessions) * 100);
                $summary['attendance']['attended'] = $attended;
                $summary['attendance']['rate'] = $rate;

                if ($rate < $minAttendance) {
                    $summary['attendance']['passed'] = false;
                    $reasons[] = "Attendance rate ({$rate}%) is below the required {$minAttendance}% threshold.";
                }
            }
        } else {
            $summary['attendance']['passed'] = true;
        }

        $isEligible = empty($reasons);

        if ($isEligible && $enrollment->status !== 'completed') {
            DB::transaction(function () use ($enrollment, $course, $student, $orgId, $request): void {
                $enrollment->update(['status' => 'completed']);

                $this->recorder->record(
                    'course.completed',
                    'course_enrollment',
                    $enrollment->id,
                    $orgId,
                    $student->id,
                    ['course_id' => $course->id],
                    ['completedAt' => now()->toIso8601String()],
                    $request,
                );
            });
        }

        return [
            'eligible' => $isEligible,
            'completed' => $enrollment->status === 'completed',
            'policy' => $policy,
            'summary' => $summary,
            'reasons' => $reasons,
        ];
    }

    /**
     * Authoritative manual override by organization owner/admin.
     */
    public function markCompleted(CourseEnrollment $enrollment, User $actor, ?string $notes = null, ?Request $request = null): void
    {
        DB::transaction(function () use ($enrollment, $actor, $notes, $request): void {
            $enrollment->update(['status' => 'completed']);

            $this->recorder->record(
                'course.completed.override',
                'course_enrollment',
                $enrollment->id,
                $enrollment->organization_id,
                $actor->id,
                [
                    'notes' => $notes,
                    'student_id' => $enrollment->student_id,
                    'course_id' => $enrollment->course_id,
                ],
                ['completedAt' => now()->toIso8601String()],
                $request,
            );
        });
    }
}
