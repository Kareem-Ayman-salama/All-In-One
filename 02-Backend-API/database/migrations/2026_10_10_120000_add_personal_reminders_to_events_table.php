<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->boolean('is_private')->default(false)->after('status');
            $table->unsignedSmallInteger('reminder_minutes')->nullable()->after('is_private');
            $table->timestamp('reminder_notified_at')->nullable()->after('reminder_minutes');
            $table->timestamp('start_notified_at')->nullable()->after('reminder_notified_at');
            $table->index(['created_by', 'is_private', 'starts_at'], 'events_personal_reminders_index');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table): void {
            $table->dropIndex('events_personal_reminders_index');
            $table->dropColumn([
                'is_private',
                'reminder_minutes',
                'reminder_notified_at',
                'start_notified_at',
            ]);
        });
    }
};
