<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_applications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider_type')->default('independent_instructor')->index();
            $table->string('status')->default('pending_review')->index();
            $table->string('display_name', 120);
            $table->string('phone', 30);
            $table->string('specialty', 160);
            $table->unsignedSmallInteger('years_experience')->default(0);
            $table->text('bio');
            $table->text('qualifications')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->string('sample_course_title', 180);
            $table->text('sample_course_description')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'provider_type']);
            $table->index(['status', 'submitted_at']);
        });

        Schema::create('provider_application_documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('provider_application_id')
                ->constrained('provider_applications')
                ->cascadeOnDelete();
            $table->string('type');
            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->string('checksum', 64)->index();
            $table->string('scan_status')->default('ready')->index();
            $table->timestamps();
            $table->unique(['provider_application_id', 'type']);
            $table->unique(['disk', 'path']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_application_documents');
        Schema::dropIfExists('provider_applications');
    }
};
