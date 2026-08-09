<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_devices', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('device_hash', 128);
            $table->string('device_name', 120)->nullable();
            $table->string('browser', 120)->nullable();
            $table->string('operating_system', 120)->nullable();
            $table->string('platform', 40)->nullable();
            $table->string('app_version', 40)->nullable();
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->string('last_ip', 45)->nullable();
            $table->string('status', 30)->default('pending')->index();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->unique(['organization_id', 'user_id', 'device_hash']);
            $table->index(['organization_id', 'user_id', 'status']);
        });

        Schema::table('user_sessions', function (Blueprint $table): void {
            $table->foreignUuid('user_device_id')
                ->nullable()
                ->after('access_token_id')
                ->constrained('user_devices')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_sessions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('user_device_id');
        });

        Schema::dropIfExists('user_devices');
    }
};
