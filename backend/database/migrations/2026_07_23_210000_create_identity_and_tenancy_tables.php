<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('refresh_token_hash', 64)->unique();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('verification_codes', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('purpose');
            $table->string('code_hash', 64);
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('expires_at')->index();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->index(['email', 'purpose', 'created_at']);
        });

        Schema::create('organizations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->default('company')->index();
            $table->string('status')->default('active')->index();
            $table->string('logo_path')->nullable();
            $table->string('brand_color', 20)->nullable();
            $table->text('bio')->nullable();
            $table->string('locale', 10)->default('ar');
            $table->string('timezone')->default('Africa/Cairo');
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('roles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('scope')->default('organization')->index();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
            $table->unique(['organization_id', 'name']);
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table): void {
            $table->foreignUuid('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });

        Schema::create('organization_memberships', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('role_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('active')->index();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'user_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('plans', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->unsignedBigInteger('monthly_price_minor')->default(0);
            $table->unsignedBigInteger('yearly_price_minor')->default(0);
            $table->char('currency', 3)->default('EGP');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('plan_modules', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->string('module');
            $table->boolean('enabled')->default(true);
            $table->unsignedBigInteger('limit_value')->nullable();
            $table->timestamps();
            $table->unique(['plan_id', 'module']);
        });

        Schema::create('organization_subscriptions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained()->restrictOnDelete();
            $table->string('status')->default('trial')->index();
            $table->string('billing_interval')->default('monthly');
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_starts_at');
            $table->timestamp('current_period_ends_at')->index();
            $table->timestamp('grace_ends_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('workspace_invitations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('role_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('invited_by')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('accepted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email');
            $table->string('normalized_email');
            $table->string('phone')->nullable();
            $table->string('token_hash', 64)->unique();
            $table->text('note')->nullable();
            $table->string('status')->default('pending')->index();
            $table->timestamp('expires_at')->index();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'normalized_email', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_invitations');
        Schema::dropIfExists('organization_subscriptions');
        Schema::dropIfExists('plan_modules');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('organization_memberships');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('organizations');
        Schema::dropIfExists('verification_codes');
        Schema::dropIfExists('user_sessions');
    }
};
