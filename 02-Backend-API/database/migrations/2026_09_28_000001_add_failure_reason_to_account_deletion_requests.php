<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_deletion_requests', function (Blueprint $table): void {
            $table->text('failure_reason')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('account_deletion_requests', function (Blueprint $table): void {
            $table->dropColumn('failure_reason');
        });
    }
};
