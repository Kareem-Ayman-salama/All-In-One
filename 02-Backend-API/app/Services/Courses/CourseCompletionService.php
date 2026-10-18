<?php

namespace App\Services\Courses;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\AttendanceRecord;
use App\Models\ContentItem;
use App\Models\CourseEnrollment;
use App\Models\LearningSession;
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
     * Evaluate completion rules authoritatively for a course enrollment.
     *
     * @return array{
     *   eligible: bool,
     *   completed: bool,
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

        $reasons = [];
        $summary = [
            'lessons' => ['total' => 0, 'completed' => 0, 'passed' => true],
            'quizzes' => ['total' => 0, 'passed' => 0, 'passed' => true],
            'assignments' => ['total' => 0, 'submitted' => 0, 'passed' => true],
            'attendance' => ['totalSessions' => 0, 'attended' => 0, 'rate' => 100, 'passed' => true],
        ];

        // 1. Lessons & Video Completion Rule (Threshold: >= 85% watched)
        $roomId = $batch?->room_id ?? $enrollment->room_membership_id;
        $lessonQuery = ContentItem::query()->where('organization_id', $orgId);
        if ($roomId) {
            $lessonQuery->where('room_id', $roomId);
        }
        $totalLessons = $lessonQuery->count();
        $summary['lessons']['total'] = $totalLessons;

        if ($totalLessons > 0) {
            $lessonIds = $lessonQuery->pluck('id')->all();
            $completedCount = VideoWatchProgress::query()
                ->where('student_id', $student->id)
                ->whereIn('content_id', $lessonIds)
                ->where(function ($q): void {
                    $q->where('is_completed', true)
                        ->orWhere('completion_percentage', '>=', 85);
                })
                ->count();

            $summary['lessons']['completed'] = $completedCount;
            if ($completedCount < $totalLessons) {
                $summary['lessons']['passed'] = false;
                $reasons[] = "Incomplete course lessons ({$completedCount}/{$totalLessons} completed).";
            }
        }

        // 2. Published Quizzes Rule (Student must have at least one passed attempt)
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

        if ($quizzes->isNotEmpty()) {
            $passedQuizzes = 0;
            foreach ($quizzes as $quiz) {
                $hasPassed = QuizAttempt::query()
                    ->where('quiz_id', $quiz->id)
                    ->where('student_id', $student->id)
                    ->where('passed', true)
                    ->exists();

                if ($hasPassed) {
                    $passedQuizzes++;
                } else {
                    $reasons[] = "Required quiz not passed: '{$quiz->title}'.";
                }
            }
            $summary['quizzes']['passed'] = $passedQuizzes;
            $summary['quizzes']['passed'] = ($passedQuizzes === $quizzes->count());
        }

        // 3. Published Assignments Rule (Student must have submitted)
        $assignments = Assignment::query()
            ->where('organization_id', $orgId)
            ->where('status', 'published')
            ->get();
        $summary['assignments']['total'] = $assignments->count();

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
            $summary['assignments']['passed'] = ($submittedAssignments === $assignments->count());
        }

        // 4. Minimum Attendance Rule (Threshold: >= 70% if sessions exist)
        if ($batch) {
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

                $rate = round(($attended / $totalSessions) * 100);
                $summary['attendance']['attended'] = $attended;
                $summary['attendance']['rate'] = $rate;

                if ($rate < 70) {
                    $summary['attendance']['passed'] = false;
                    $reasons[] = "Attendance rate ({$rate}%) is below the minimum required 70% threshold.";
                }
            }
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
