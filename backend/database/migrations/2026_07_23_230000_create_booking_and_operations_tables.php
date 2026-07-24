<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('batch_id')->constrained('course_batches')->restrictOnDelete();
            $table->foreignUuid('student_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('student_name');
            $table->string('email');
            $table->string('normalized_email')->index();
            $table->string('phone');
            $table->text('note')->nullable();
            $table->text('internal_note')->nullable();
            $table->boolean('terms_accepted');
            $table->string('status')->default('pending_confirmation')->index();
            $table->string('payment_status')->default('unpaid')->index();
            $table->unsignedBigInteger('amount_minor');
            $table->char('currency', 3)->default('EGP');
            $table->string('idempotency_key', 100)->nullable();
            $table->foreignUuid('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'idempotency_key']);
            $table->index(['organization_id', 'batch_id', 'status']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('course_enrollments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('batch_id')->constrained('course_batches')->restrictOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('booking_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignUuid('room_membership_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('active')->index();
            $table->timestamp('access_starts_at');
            $table->timestamp('access_ends_at');
            $table->timestamps();
            $table->unique(['student_id', 'batch_id']);
            $table->index(['organization_id', 'status']);
        });

        Schema::create('student_subscriptions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('enrollment_id')->unique()->constrained('course_enrollments')->cascadeOnDelete();
            $table->string('status')->default('active')->index();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at')->index();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'student_id', 'status']);
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('priority')->default('medium');
            $table->string('title');
            $table->text('body');
            $table->string('target_type')->nullable();
            $table->uuid('target_id')->nullable();
            $table->json('data')->nullable();
            $table->string('status')->default('unread')->index();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status', 'created_at']);
        });

        Schema::create('promotions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('type');
            $table->string('placement');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('creative_path')->nullable();
            $table->string('destination_url')->nullable();
            $table->string('status')->default('pending_approval')->index();
            $table->string('payment_status')->default('unpaid');
            $table->unsignedBigInteger('price_minor')->default(0);
            $table->char('currency', 3)->default('EGP');
            $table->unsignedBigInteger('impressions')->default(0);
            $table->unsignedBigInteger('clicks')->default(0);
            $table->unsignedBigInteger('booking_conversions')->default(0);
            $table->text('moderation_note')->nullable();
            $table->foreignUuid('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['placement', 'status', 'start_date', 'end_date']);
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action')->index();
            $table->string('entity_type');
            $table->uuid('entity_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['organization_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('outbox_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('event_type')->index();
            $table->string('aggregate_type');
            $table->uuid('aggregate_id');
            $table->json('payload');
            $table->timestamp('available_at')->index();
            $table->timestamp('processed_at')->nullable()->index();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('support_requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('subject');
            $table->text('message');
            $table->string('priority')->default('normal');
            $table->string('status')->default('open')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_requests');
        Schema::dropIfExists('outbox_events');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('student_subscriptions');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('bookings');
    }
};
