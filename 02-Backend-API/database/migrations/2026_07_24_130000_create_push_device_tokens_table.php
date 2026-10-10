<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_device_tokens', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_session_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->string('provider')->default('fcm');
            $table->string('platform', 20);
            $table->string('installation_id', 120);
            $table->text('token');
            $table->string('token_hash', 64)->index();
            $table->string('device_name', 120)->nullable();
            $table->string('app_version', 60)->nullable();
            $table->timestamp('last_registered_at');
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();
            $table->unique(['user_id', 'installation_id', 'provider']);
            $table->index(['user_id', 'platform', 'revoked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_device_tokens');
    }
};
