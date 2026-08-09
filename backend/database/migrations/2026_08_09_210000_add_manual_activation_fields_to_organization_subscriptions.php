<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organization_subscriptions', function (Blueprint $table): void {
            $table->text('activation_note')->nullable()->after('billing_interval');
            $table->string('payment_proof_reference', 500)->nullable()->after('activation_note');
            $table->foreignUuid('approved_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->timestamp('rejected_at')->nullable()->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('rejected_at');
        });
    }

    public function down(): void
    {
        Schema::table('organization_subscriptions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropColumn([
                'activation_note',
                'payment_proof_reference',
                'approved_at',
                'rejected_at',
                'rejection_reason',
            ]);
        });
    }
};
