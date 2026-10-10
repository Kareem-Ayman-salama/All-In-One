<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('file_assets', function (Blueprint $table): void {
            $table->string('status')->default('pending')->change();
            $table->unsignedSmallInteger('scan_attempts')->default(0);
            $table->timestamp('last_scanned_at')->nullable();
            $table->timestamp('next_scan_at')->nullable();
            $table->index(['status', 'next_scan_at']);
        });

        DB::table('file_assets')
            ->where('status', 'ready')
            ->update(['status' => 'pending']);
    }

    public function down(): void
    {
        Schema::table('file_assets', function (Blueprint $table): void {
            $table->dropIndex(['status', 'next_scan_at']);
            $table->dropColumn([
                'scan_attempts',
                'last_scanned_at',
                'next_scan_at',
            ]);
            $table->string('status')->default('ready')->change();
        });
    }
};
