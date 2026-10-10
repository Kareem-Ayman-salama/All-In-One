<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Allow audit records to reference UUIDs and external operation identifiers.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(
                'ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE VARCHAR(255) USING entity_id::text'
            );

            return;
        }

        if ($driver === 'mysql') {
            Schema::table('audit_logs', function (Blueprint $table): void {
                $table->string('entity_id')->nullable()->change();
            });
        }
    }

    /**
     * Restore UUID-only storage after discarding non-UUID external identifiers.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement(
                'UPDATE audit_logs SET entity_id = NULL WHERE entity_id IS NOT NULL '
                ."AND entity_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'"
            );
            DB::statement(
                'ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE UUID USING entity_id::uuid'
            );

            return;
        }

        if ($driver === 'mysql') {
            Schema::table('audit_logs', function (Blueprint $table): void {
                $table->uuid('entity_id')->nullable()->change();
            });
        }
    }
};
