<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Academic Course Completion Policy
    |--------------------------------------------------------------------------
    |
    | Authoritative platform defaults applied when neither the organization
    | nor the individual course specifies custom completion thresholds.
    |
    */
    'default_policy' => [
        'require_lessons_completion' => true,
        'minimum_lesson_completion_percentage' => 85,
        'require_assignments' => true,
        'require_all_required_assignments' => true,
        'require_quizzes' => true,
        'minimum_quiz_score' => 60,
        'require_attendance' => true,
        'minimum_attendance_percentage' => 70,
        'certificate_enabled' => true,
    ],
];
