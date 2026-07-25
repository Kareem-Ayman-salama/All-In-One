<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_bookings', function (Blueprint $table): void {
            $table->string('student_phone', 40)
                ->nullable()
                ->after('student_id');
        });
    }

    public function down(): void
    {
        Schema::table('lesson_bookings', function (Blueprint $table): void {
            $table->dropColumn('student_phone');
        });
    }
};
