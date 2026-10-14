<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dateTimeTz('due_at')->nullable()->after('issued_at');
            $table->dateTimeTz('paid_at')->nullable()->after('due_at');
            $table->dateTimeTz('renewal_at')->nullable()->after('paid_at');
            $table->unique('payment_id');
            $table->index(['status', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropIndex(['status', 'due_at']);
            $table->dropUnique(['payment_id']);
            $table->dropColumn(['due_at', 'paid_at', 'renewal_at']);
        });
    }
};
