<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_sessions', function (Blueprint $table): void {
            $table->foreignId('access_token_id')
                ->nullable()
                ->unique()
                ->after('user_id')
                ->constrained('personal_access_tokens')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_sessions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('access_token_id');
        });
    }
};
