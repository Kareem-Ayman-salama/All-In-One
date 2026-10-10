<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->dateTimeTz('due_at')->nullable();
            $table->unsignedInteger('max_score')->default(100);
            $table->string('allowed_file_types')->default('pdf,zip,doc,docx,png,jpg');
            $table->string('status')->default('published');
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['organization_id', 'room_id', 'due_at']);
            $table->index(['organization_id', 'course_id', 'status']);
        });

        Schema::create('assignment_submissions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('submission_text')->nullable();
            $table->string('attachment_url')->nullable();
            $table->string('file_name')->nullable();
            $table->string('status')->default('submitted');
            $table->decimal('score', 8, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->dateTimeTz('submitted_at');
            $table->dateTimeTz('graded_at')->nullable();
            $table->timestampsTz();

            $table->unique(['assignment_id', 'student_id']);
            $table->index(['organization_id', 'assignment_id', 'status']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('quizzes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->default(30);
            $table->unsignedInteger('passing_score')->default(60);
            $table->unsignedTinyInteger('max_attempts')->default(1);
            $table->boolean('is_published')->default(true);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['organization_id', 'room_id', 'is_published']);
            $table->index(['organization_id', 'course_id', 'is_published']);
        });

        Schema::create('quiz_questions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->text('question_text');
            $table->text('question_text_ar')->nullable();
            $table->string('type')->default('mcq');
            $table->json('options');
            $table->string('correct_answer');
            $table->unsignedInteger('points')->default(10);
            $table->unsignedSmallInteger('order')->default(0);
            $table->text('explanation')->nullable();
            $table->timestampsTz();

            $table->index(['quiz_id', 'order']);
        });

        Schema::create('quiz_attempts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('score')->default(0);
            $table->unsignedInteger('total_points')->default(0);
            $table->unsignedTinyInteger('percentage')->default(0);
            $table->boolean('passed')->default(false);
            $table->json('answers');
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->dateTimeTz('started_at');
            $table->dateTimeTz('completed_at')->nullable();
            $table->timestampsTz();

            $table->index(['organization_id', 'quiz_id', 'student_id']);
            $table->index(['student_id', 'quiz_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('quizzes');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignments');
    }
};
