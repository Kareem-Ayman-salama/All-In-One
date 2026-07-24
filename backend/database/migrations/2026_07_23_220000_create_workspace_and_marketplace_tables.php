<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('access_type')->default('read_only');
            $table->string('status')->default('active')->index();
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'slug']);
        });

        Schema::create('room_memberships', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member');
            $table->string('status')->default('active')->index();
            $table->timestamp('joined_at')->nullable();
            $table->timestamps();
            $table->unique(['room_id', 'user_id']);
            $table->index(['organization_id', 'user_id', 'status']);
        });

        Schema::create('invitation_room', function (Blueprint $table): void {
            $table->foreignUuid('invitation_id')->constrained('workspace_invitations')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained()->cascadeOnDelete();
            $table->primary(['invitation_id', 'room_id']);
        });

        Schema::create('file_assets', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size_bytes');
            $table->string('checksum', 64)->nullable()->index();
            $table->string('status')->default('ready')->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['disk', 'path']);
        });

        Schema::create('content_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('file_asset_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type');
            $table->string('external_url')->nullable();
            $table->boolean('download_allowed')->default(false);
            $table->boolean('watermark_enabled')->default(true);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->string('status')->default('published')->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'room_id', 'status']);
        });

        Schema::create('announcements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('body');
            $table->text('body_ar')->nullable();
            $table->string('audience')->default('room');
            $table->boolean('pinned')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'published_at']);
        });

        Schema::create('events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->string('type')->default('event');
            $table->timestamp('starts_at')->index();
            $table->timestamp('ends_at');
            $table->string('location')->nullable();
            $table->string('meeting_provider')->nullable();
            $table->text('meeting_reference')->nullable();
            $table->string('status')->default('scheduled')->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'starts_at']);
        });

        Schema::create('academy_profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('public_name');
            $table->string('public_name_ar')->nullable();
            $table->text('description');
            $table->text('description_ar')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('location')->nullable();
            $table->json('branches')->nullable();
            $table->json('delivery_methods')->nullable();
            $table->text('cancellation_policy')->nullable();
            $table->boolean('is_public')->default(false)->index();
            $table->string('verification_status')->default('pending')->index();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('instructors', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('name_ar')->nullable();
            $table->text('bio')->nullable();
            $table->text('bio_ar')->nullable();
            $table->string('photo_path')->nullable();
            $table->json('specialties')->nullable();
            $table->json('social_links')->nullable();
            $table->string('status')->default('active')->index();
            $table->timestamps();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('categories', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->string('name_ar');
            $table->string('slug')->unique();
            $table->boolean('active')->default(true)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('academy_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('instructor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->string('slug');
            $table->text('short_description')->nullable();
            $table->text('short_description_ar')->nullable();
            $table->longText('description')->nullable();
            $table->longText('description_ar')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('education_level')->nullable()->index();
            $table->string('subject')->nullable()->index();
            $table->string('delivery_type')->default('online')->index();
            $table->unsignedBigInteger('price_minor')->default(0);
            $table->unsignedBigInteger('discounted_price_minor')->nullable();
            $table->char('currency', 3)->default('EGP');
            $table->timestamp('discount_ends_at')->nullable();
            $table->json('learning_outcomes')->nullable();
            $table->json('requirements')->nullable();
            $table->string('duration')->nullable();
            $table->unsignedSmallInteger('sessions_count')->nullable();
            $table->string('status')->default('draft')->index();
            $table->text('moderation_note')->nullable();
            $table->foreignUuid('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['organization_id', 'slug']);
            $table->index(['status', 'published_at']);
        });

        Schema::create('course_batches', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained()->restrictOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->json('schedule');
            $table->string('delivery_type')->default('online');
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('reserved_seats')->default(0);
            $table->unsignedInteger('confirmed_seats')->default(0);
            $table->string('location')->nullable();
            $table->text('meeting_reference')->nullable();
            $table->timestamp('enrollment_starts_at')->nullable();
            $table->timestamp('enrollment_ends_at')->nullable();
            $table->string('status')->default('draft')->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['course_id', 'status']);
            $table->index(['organization_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_batches');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('instructors');
        Schema::dropIfExists('academy_profiles');
        Schema::dropIfExists('events');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('content_items');
        Schema::dropIfExists('file_assets');
        Schema::dropIfExists('invitation_room');
        Schema::dropIfExists('room_memberships');
        Schema::dropIfExists('rooms');
    }
};
