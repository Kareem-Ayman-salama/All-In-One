<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'date_of_birth')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->date('date_of_birth')->nullable()->after('timezone');
            });
        }

        if (! Schema::hasColumn('users', 'is_minor')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->boolean('is_minor')->default(false)->after('date_of_birth');
            });
        }

        Schema::create('guardian_consents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('guardian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('guardian_student_link_id')->nullable()->constrained('guardian_student_links')->nullOnDelete();
            $table->string('status', 32)->default('pending')->index(); // pending, approved, revoked, expired
            $table->string('terms_version', 64)->default('v1.0');
            $table->string('terms_content_hash', 64)->nullable();
            $table->longText('terms_content_snapshot')->nullable();
            $table->string('verification_method', 32)->default('otp'); // otp, digital_signature, written_proof
            $table->string('verification_reference', 128)->nullable();
            $table->timestamp('consented_at')->nullable()->index();
            $table->timestamp('revoked_at')->nullable();
            $table->text('revocation_reason')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['guardian_id', 'status']);
            $table->index(['organization_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_consents');

        if (Schema::hasColumn('users', 'date_of_birth')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('date_of_birth');
            });
        }

        if (Schema::hasColumn('users', 'is_minor')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('is_minor');
            });
        }
    }
};
