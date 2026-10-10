<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardian_student_links', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('guardian_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('linked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('relationship')->default('guardian');
            $table->string('status')->default('active')->index();
            $table->boolean('can_view_notes')->default(true);
            $table->timestamps();
            $table->unique(
                ['organization_id', 'guardian_id', 'student_id'],
                'guardian_student_unique',
            );
            $table->index(['guardian_id', 'status']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('learning_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('batch_id')->nullable()->constrained('course_batches')->cascadeOnDelete();
            $table->foreignUuid('lesson_booking_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('instructor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->string('title_ar')->nullable();
            $table->timestamp('starts_at')->index();
            $table->timestamp('ends_at');
            $table->string('status')->default('scheduled')->index();
            $table->text('notes')->nullable();
            $table->timestamp('attendance_locked_at')->nullable();
            $table->timestamps();
            $table->index(['organization_id', 'batch_id', 'starts_at']);
            $table->index(['organization_id', 'instructor_id', 'starts_at']);
        });

        Schema::create('attendance_records', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('session_id')->constrained('learning_sessions')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('enrollment_id')->nullable()->constrained('course_enrollments')->nullOnDelete();
            $table->foreignUuid('lesson_booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('marked_by')->constrained('users')->restrictOnDelete();
            $table->string('status')->index();
            $table->unsignedSmallInteger('minutes_late')->default(0);
            $table->text('excuse_reason')->nullable();
            $table->text('instructor_note')->nullable();
            $table->boolean('guardian_visible')->default(true);
            $table->timestamp('marked_at');
            $table->timestamps();
            $table->unique(['session_id', 'student_id']);
            $table->index(['organization_id', 'student_id', 'status']);
        });

        $this->seedAuthorization();
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('learning_sessions');
        Schema::dropIfExists('guardian_student_links');
    }

    private function seedAuthorization(): void
    {
        $now = now();
        $permissionNames = [
            'attendance.view',
            'attendance.manage',
            'guardians.view',
            'guardians.manage',
            'reports.export',
        ];

        foreach ($permissionNames as $name) {
            if (! DB::table('permissions')->where('name', $name)->exists()) {
                DB::table('permissions')->insert([
                    'id' => (string) Str::uuid(),
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $guardianRole = DB::table('roles')
            ->whereNull('organization_id')
            ->where('name', 'guardian')
            ->first();
        if (! $guardianRole) {
            $guardianRoleId = (string) Str::uuid();
            DB::table('roles')->insert([
                'id' => $guardianRoleId,
                'organization_id' => null,
                'name' => 'guardian',
                'scope' => 'organization',
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } else {
            $guardianRoleId = $guardianRole->id;
        }

        $matrix = [
            'organization_owner' => $permissionNames,
            'organization_admin' => $permissionNames,
            'instructor' => [
                'attendance.view',
                'attendance.manage',
                'guardians.view',
                'reports.export',
            ],
            'staff' => [
                'attendance.view',
                'attendance.manage',
                'guardians.view',
                'guardians.manage',
                'reports.export',
            ],
            'student' => ['attendance.view'],
            'guardian' => ['attendance.view', 'guardians.view'],
        ];

        foreach ($matrix as $roleName => $names) {
            $roleId = $roleName === 'guardian'
                ? $guardianRoleId
                : DB::table('roles')
                    ->whereNull('organization_id')
                    ->where('name', $roleName)
                    ->value('id');
            if (! $roleId) {
                continue;
            }

            foreach ($names as $name) {
                $permissionId = DB::table('permissions')
                    ->where('name', $name)
                    ->value('id');
                DB::table('permission_role')->updateOrInsert([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }

        $attendancePlans = DB::table('plans')
            ->whereIn('code', ['growth', 'pro', 'enterprise'])
            ->pluck('id');
        foreach ($attendancePlans as $planId) {
            $existing = DB::table('plan_modules')
                ->where('plan_id', $planId)
                ->where('module', 'attendance');
            if ($existing->exists()) {
                $existing->update(['enabled' => true, 'updated_at' => $now]);
            } else {
                DB::table('plan_modules')->insert([
                    'id' => (string) Str::uuid(),
                    'plan_id' => $planId,
                    'module' => 'attendance',
                    'enabled' => true,
                    'limit_value' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
};
