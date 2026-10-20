<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table): void {
            $table->timestamp('access_ends_at')->nullable()->change();
        });

        Schema::table('student_subscriptions', function (Blueprint $table): void {
            $table->timestamp('ends_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollments', function (Blueprint $table): void {
            $table->timestamp('access_ends_at')->nullable(false)->change();
        });

        Schema::table('student_subscriptions', function (Blueprint $table): void {
            $table->timestamp('ends_at')->nullable(false)->change();
        });
    }
};
