<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('must_change_password')->default(false)->after('password');
        });

        Schema::create('course_modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('status')->default('draft')->index();
            $table->timestamps();
            $table->index(['organization_id', 'course_id', 'sort_order']);
        });

        Schema::create('course_lessons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_module_id')->constrained('course_modules')->cascadeOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('content_item_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->string('type')->default('placeholder')->index();
            $table->string('status')->default('draft')->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('template_sections')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'course_id', 'course_module_id']);
        });

        Schema::create('lesson_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('locale', 10)->default('ar');
            $table->json('sections');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->unique(['organization_id', 'name']);
        });

        Schema::create('question_bank_categories', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('kind')->index();
            $table->string('code');
            $table->string('name');
            $table->string('name_ar');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->unique(['organization_id', 'kind', 'code']);
        });

        Schema::table('course_batches', function (Blueprint $table): void {
            $table->date('start_date')->nullable()->change();
            $table->date('end_date')->nullable()->change();
            $table->json('schedule')->nullable()->change();
            $table->unsignedInteger('capacity')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('course_batches', function (Blueprint $table): void {
            $table->date('start_date')->nullable(false)->change();
            $table->date('end_date')->nullable(false)->change();
            $table->json('schedule')->nullable(false)->change();
            $table->unsignedInteger('capacity')->nullable(false)->change();
        });

        Schema::dropIfExists('question_bank_categories');
        Schema::dropIfExists('lesson_templates');
        Schema::dropIfExists('course_lessons');
        Schema::dropIfExists('course_modules');

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('must_change_password');
        });
    }
};
