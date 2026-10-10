<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QuizController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $org = $this->organization($request);

        $items = Quiz::query()
            ->with(['room:id,name', 'course:id,title,title_ar', 'creator:id,name'])
            ->withCount(['questions', 'attempts'])
            ->where('organization_id', $org->id)
            ->when($request->filled('roomId'), fn ($q) => $q->where('room_id', $request->string('roomId')))
            ->when($request->filled('courseId'), fn ($q) => $q->where('course_id', $request->string('courseId')))
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $items->items(), [
            'currentPage' => $items->currentPage(),
            'lastPage' => $items->lastPage(),
            'total' => $items->total(),
        ]);
    }

    public function store(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);

        $validated = $request->validate([
            'roomId' => ['nullable', 'uuid', Rule::exists('rooms', 'id')->where('organization_id', $org->id)],
            'courseId' => ['nullable', 'uuid', Rule::exists('courses', 'id')->where('organization_id', $org->id)],
            'title' => ['required', 'string', 'min:2', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'durationMinutes' => ['nullable', 'integer', 'min:1', 'max:360'],
            'passingScore' => ['nullable', 'integer', 'min:1', 'max:100'],
            'maxAttempts' => ['nullable', 'integer', 'min:1', 'max:50'],
            'isPublished' => ['nullable', 'boolean'],
            'questions' => ['nullable', 'array'],
            'questions.*.questionText' => ['required_with:questions', 'string'],
            'questions.*.questionTextAr' => ['nullable', 'string'],
            'questions.*.type' => ['required_with:questions', Rule::in(['mcq', 'true_false'])],
            'questions.*.options' => ['required_with:questions', 'array'],
            'questions.*.correctAnswer' => ['required_with:questions', 'string'],
            'questions.*.points' => ['nullable', 'integer', 'min:1'],
            'questions.*.explanation' => ['nullable', 'string'],
        ]);

        $quiz = DB::transaction(function () use ($validated, $org, $request): Quiz {
            $quiz = Quiz::query()->create([
                'organization_id' => $org->id,
                'created_by' => $request->user()->id,
                'room_id' => $validated['roomId'] ?? null,
                'course_id' => $validated['courseId'] ?? null,
                'title' => $validated['title'],
                'title_ar' => $validated['titleAr'] ?? null,
                'description' => $validated['description'] ?? null,
                'duration_minutes' => $validated['durationMinutes'] ?? 30,
                'passing_score' => $validated['passingScore'] ?? 60,
                'max_attempts' => $validated['maxAttempts'] ?? 1,
                'is_published' => $validated['isPublished'] ?? true,
            ]);

            if (! empty($validated['questions'])) {
                foreach ($validated['questions'] as $index => $q) {
                    QuizQuestion::query()->create([
                        'quiz_id' => $quiz->id,
                        'question_text' => $q['questionText'],
                        'question_text_ar' => $q['questionTextAr'] ?? null,
                        'type' => $q['type'] ?? 'mcq',
                        'options' => $q['options'],
                        'correct_answer' => $q['correctAnswer'],
                        'points' => $q['points'] ?? 10,
                        'order' => $index,
                        'explanation' => $q['explanation'] ?? null,
                    ]);
                }
            }

            return $quiz;
        });

        $recorder->record('quiz.created', 'quiz', $quiz->id, $org->id, $request->user()->id, [], ['quizId' => $quiz->id], $request);

        return ApiResponse::success($request, $quiz->load(['questions', 'room', 'course']), status: 201);
    }

    public function show(Request $request, string $organization, string $quiz): JsonResponse
    {
        $model = $this->quiz($request, $quiz);
        $model->load(['questions', 'room', 'course', 'creator']);

        return ApiResponse::success($request, $model);
    }

    public function destroy(Request $request, string $organization, string $quiz, OperationRecorder $recorder): JsonResponse
    {
        $org = $this->organization($request);
        $model = $this->quiz($request, $quiz);
        $model->delete();

        $recorder->record('quiz.deleted', 'quiz', $model->id, $org->id, $request->user()->id, [], ['quizId' => $model->id], $request);

        return ApiResponse::success($request, ['deleted' => true]);
    }

    public function attempts(Request $request, string $organization, string $quiz): JsonResponse
    {
        $model = $this->quiz($request, $quiz);

        $attempts = QuizAttempt::query()
            ->with(['student:id,name,email'])
            ->where('quiz_id', $model->id)
            ->orderByDesc('created_at')
            ->paginate(min($request->integer('perPage', 50), 100));

        return ApiResponse::success($request, $attempts->items(), [
            'currentPage' => $attempts->currentPage(),
            'lastPage' => $attempts->lastPage(),
            'total' => $attempts->total(),
        ]);
    }

    // Student specific API
    public function studentIndex(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Quiz::query()
            ->with(['room:id,name', 'course:id,title,title_ar'])
            ->withCount('questions')
            ->where('is_published', true)
            ->when($request->filled('roomId'), fn ($q) => $q->where('room_id', $request->string('roomId')))
            ->when($request->filled('courseId'), fn ($q) => $q->where('course_id', $request->string('courseId')))
            ->orderByDesc('created_at');

        $quizzes = $query->paginate(min($request->integer('perPage', 50), 100));

        $quizIds = collect($quizzes->items())->pluck('id');
        $myAttempts = QuizAttempt::query()
            ->whereIn('quiz_id', $quizIds)
            ->where('student_id', $user->id)
            ->orderByDesc('percentage')
            ->get()
            ->groupBy('quiz_id');

        $data = collect($quizzes->items())->map(function (Quiz $quiz) use ($myAttempts) {
            $attempts = $myAttempts->get($quiz->id, collect());
            $array = $quiz->toArray();
            $array['attemptsCount'] = $attempts->count();
            $array['bestAttempt'] = $attempts->first();
            $array['canAttempt'] = $attempts->count() < $quiz->max_attempts;

            return $array;
        });

        return ApiResponse::success($request, $data, [
            'currentPage' => $quizzes->currentPage(),
            'lastPage' => $quizzes->lastPage(),
            'total' => $quizzes->total(),
        ]);
    }

    public function studentShow(Request $request, string $quiz): JsonResponse
    {
        $model = Quiz::query()
            ->with(['room:id,name', 'course:id,title,title_ar'])
            ->where('is_published', true)
            ->find($quiz);

        if (! $model) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Quiz not found.', 404);
        }

        // Questions without exposing correct_answer and explanation to prevent cheating
        $questions = QuizQuestion::query()
            ->select(['id', 'quiz_id', 'question_text', 'question_text_ar', 'type', 'options', 'points', 'order'])
            ->where('quiz_id', $model->id)
            ->orderBy('order')
            ->get();

        $pastAttempts = QuizAttempt::query()
            ->where('quiz_id', $model->id)
            ->where('student_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        $data = $model->toArray();
        $data['questions'] = $questions;
        $data['pastAttempts'] = $pastAttempts;
        $data['canAttempt'] = $pastAttempts->count() < $model->max_attempts;

        return ApiResponse::success($request, $data);
    }

    public function submitAttempt(Request $request, string $quiz, OperationRecorder $recorder): JsonResponse
    {
        $user = $request->user();
        $model = Quiz::query()->with('questions')->find($quiz);

        if (! $model || ! $model->is_published) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Quiz not found or not published.', 404);
        }

        $pastAttemptsCount = QuizAttempt::query()
            ->where('quiz_id', $model->id)
            ->where('student_id', $user->id)
            ->count();

        if ($pastAttemptsCount >= $model->max_attempts) {
            throw new ApiException('MAX_ATTEMPTS_REACHED', 'You have reached the maximum allowed attempts for this quiz.', 422);
        }

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'startedAt' => ['nullable', 'date'],
        ]);

        $submittedAnswers = $validated['answers'];
        $earnedPoints = 0;
        $totalPoints = 0;
        $gradedBreakdown = [];

        foreach ($model->questions as $question) {
            $totalPoints += $question->points;
            $userAns = $submittedAnswers[$question->id] ?? null;
            $isCorrect = (string) $userAns === (string) $question->correct_answer;

            if ($isCorrect) {
                $earnedPoints += $question->points;
            }

            $gradedBreakdown[] = [
                'questionId' => $question->id,
                'userAnswer' => $userAns,
                'correctAnswer' => $question->correct_answer,
                'isCorrect' => $isCorrect,
                'pointsEarned' => $isCorrect ? $question->points : 0,
                'maxPoints' => $question->points,
                'explanation' => $question->explanation,
            ];
        }

        $percentage = $totalPoints > 0 ? (int) round(($earnedPoints / $totalPoints) * 100) : 0;
        $passed = $percentage >= $model->passing_score;

        $attempt = QuizAttempt::query()->create([
            'organization_id' => $model->organization_id,
            'quiz_id' => $model->id,
            'student_id' => $user->id,
            'score' => $earnedPoints,
            'total_points' => $totalPoints,
            'percentage' => $percentage,
            'passed' => $passed,
            'answers' => $gradedBreakdown,
            'attempt_number' => $pastAttemptsCount + 1,
            'started_at' => $validated['startedAt'] ?? now()->subMinutes(min($model->duration_minutes, 10)),
            'completed_at' => now(),
        ]);

        $recorder->record('quiz.attempt_submitted', 'quiz_attempt', $attempt->id, $model->organization_id, $user->id, [], [
            'quizId' => $model->id,
            'score' => $earnedPoints,
            'percentage' => $percentage,
            'passed' => $passed,
        ], $request);

        return ApiResponse::success($request, [
            'attempt' => $attempt,
            'score' => $earnedPoints,
            'totalPoints' => $totalPoints,
            'percentage' => $percentage,
            'passed' => $passed,
            'passingScore' => $model->passing_score,
            'breakdown' => $gradedBreakdown,
        ], status: 201);
    }

    private function organization(Request $request): Organization
    {
        return $request->attributes->get('active_organization');
    }

    private function quiz(Request $request, string $id): Quiz
    {
        $quiz = Quiz::query()
            ->where('organization_id', $this->organization($request)->id)
            ->find($id);

        if (! $quiz) {
            throw new ApiException('RESOURCE_NOT_FOUND', 'Quiz not found.', 404);
        }

        return $quiz;
    }
}
