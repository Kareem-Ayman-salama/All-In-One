<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->text('description')->nullable();
            $table->dateTimeTz('due_at')->nullable();
            $table->string('priority')->default('medium');
            $table->string('status')->default('todo');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->timestampsTz();
            $table->softDeletesTz();
            $table->index(['organization_id', 'status', 'due_at']);
            $table->index(['assigned_to', 'status']);
        });

        Schema::create('instructor_availability_slots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('instructor_id')->constrained()->cascadeOnDelete();
            $table->dateTimeTz('starts_at');
            $table->dateTimeTz('ends_at');
            $table->string('delivery_type');
            $table->string('location')->nullable();
            $table->unsignedBigInteger('price_minor');
            $table->string('currency', 3)->default('EGP');
            $table->string('status')->default('open');
            $table->timestampsTz();
            $table->unique(['instructor_id', 'starts_at']);
            $table->index(['organization_id', 'status', 'starts_at']);
        });

        Schema::create('lesson_bookings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('instructor_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('slot_id')->constrained('instructor_availability_slots')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('subject');
            $table->text('student_note')->nullable();
            $table->string('status')->default('confirmed');
            $table->string('payment_status')->default('unpaid');
            $table->unsignedBigInteger('amount_minor');
            $table->string('currency', 3)->default('EGP');
            $table->dateTimeTz('cancelled_at')->nullable();
            $table->timestampsTz();
            $table->index(['student_id', 'status', 'created_at']);
            $table->index(['organization_id', 'instructor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_bookings');
        Schema::dropIfExists('instructor_availability_slots');
        Schema::dropIfExists('tasks');
    }
};
