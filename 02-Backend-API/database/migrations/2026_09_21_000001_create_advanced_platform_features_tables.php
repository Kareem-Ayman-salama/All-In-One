<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Digital Certificates
        Schema::create('certificates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('certificate_number')->unique();
            $table->date('issue_date');
            $table->unsignedInteger('grade_score')->nullable();
            $table->string('verification_code')->unique()->index();
            $table->string('status')->default('issued');
            $table->json('metadata')->nullable();
            $table->timestampsTz();

            $table->unique(['course_id', 'student_id']);
            $table->index(['organization_id', 'status']);
        });

        // 2. Room Discussions (In-Room Community Feed replacing WhatsApp)
        Schema::create('room_discussions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_resolved')->default(false);
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['organization_id', 'room_id', 'is_pinned']);
            $table->index(['room_id', 'created_at']);
        });

        // 3. Room Discussion Comments
        Schema::create('room_discussion_comments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('discussion_id')->constrained('room_discussions')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_instructor_reply')->default(false);
            $table->boolean('is_best_answer')->default(false);
            $table->timestampsTz();

            $table->index(['discussion_id', 'created_at']);
        });

        // 4. Video Watch Progress & Resume Playback
        Schema::create('video_watch_progress', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('content_id')->index();
            $table->unsignedInteger('watched_seconds')->default(0);
            $table->unsignedInteger('total_duration_seconds')->default(0);
            $table->unsignedInteger('last_position_seconds')->default(0);
            $table->unsignedInteger('completion_percentage')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->dateTimeTz('completed_at')->nullable();
            $table->timestampsTz();

            $table->unique(['student_id', 'content_id']);
            $table->index(['organization_id', 'room_id', 'student_id']);
        });

        // 5. Invoices & Receipts
        Schema::create('invoices', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->unsignedBigInteger('subtotal_minor')->default(0);
            $table->unsignedBigInteger('tax_minor')->default(0);
            $table->unsignedBigInteger('total_minor')->default(0);
            $table->string('currency')->default('EGP');
            $table->string('status')->default('paid');
            $table->dateTimeTz('issued_at');
            $table->json('items_breakdown')->nullable();
            $table->timestampsTz();

            $table->index(['organization_id', 'user_id', 'status']);
        });

        // 6. Extend Learning Sessions with Meeting fields (Zoom / Meet)
        if (Schema::hasTable('learning_sessions')) {
            Schema::table('learning_sessions', function (Blueprint $table): void {
                if (! Schema::hasColumn('learning_sessions', 'meeting_provider')) {
                    $table->string('meeting_provider')->nullable()->after('notes'); // zoom, google_meet, custom
                    $table->string('meeting_link', 1000)->nullable()->after('meeting_provider');
                    $table->string('meeting_id')->nullable()->after('meeting_link');
                    $table->string('meeting_passcode')->nullable()->after('meeting_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('learning_sessions')) {
            Schema::table('learning_sessions', function (Blueprint $table): void {
                if (Schema::hasColumn('learning_sessions', 'meeting_provider')) {
                    $table->dropColumn(['meeting_provider', 'meeting_link', 'meeting_id', 'meeting_passcode']);
                }
            });
        }
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('video_watch_progress');
        Schema::dropIfExists('room_discussion_comments');
        Schema::dropIfExists('room_discussions');
        Schema::dropIfExists('certificates');
    }
};
