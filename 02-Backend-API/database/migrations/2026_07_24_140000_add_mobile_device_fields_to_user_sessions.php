<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_sessions', function (Blueprint $table): void {
            $table->string('installation_id', 120)->nullable()->after('name');
            $table->string('platform', 20)->nullable()->after('installation_id');
            $table->string('app_version', 60)->nullable()->after('platform');
            $table->index(['user_id', 'installation_id']);
        });
    }

    public function down(): void
    {
        Schema::table('user_sessions', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'installation_id']);
            $table->dropColumn(['installation_id', 'platform', 'app_version']);
        });
    }
};
