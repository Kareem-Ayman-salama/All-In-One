<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guardian_student_links', function (Blueprint $table): void {
            $table->boolean('weekly_report_enabled')->default(true);
            $table->unsignedTinyInteger('absence_alert_threshold')->default(3);
            $table->unsignedInteger('last_absence_alert_count')->default(0);
            $table->timestamp('weekly_report_last_sent_at')->nullable();
        });

        Schema::table('learning_sessions', function (Blueprint $table): void {
            $table->string('qr_token_hash', 64)->nullable()->index();
            $table->timestamp('qr_expires_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('learning_sessions', function (Blueprint $table): void {
            $table->dropIndex(['qr_token_hash']);
            $table->dropColumn(['qr_token_hash', 'qr_expires_at']);
        });

        Schema::table('guardian_student_links', function (Blueprint $table): void {
            $table->dropColumn([
                'weekly_report_enabled',
                'absence_alert_threshold',
                'last_absence_alert_count',
                'weekly_report_last_sent_at',
            ]);
        });
    }
};
