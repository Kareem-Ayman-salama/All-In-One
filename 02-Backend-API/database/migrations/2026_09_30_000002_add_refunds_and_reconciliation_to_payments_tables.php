<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->unsignedBigInteger('refunded_amount_minor')->default(0)->after('amount_minor');
            $table->unsignedBigInteger('fee_minor')->default(0)->after('refunded_amount_minor');
            $table->bigInteger('net_minor')->nullable()->after('fee_minor');
            $table->index(['organization_id', 'status', 'created_at']);
        });

        Schema::create('payment_refunds', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('provider')->default('paymob');
            $table->string('provider_refund_id')->nullable()->index();
            $table->unsignedBigInteger('amount_minor');
            $table->char('currency', 3)->default('EGP');
            $table->string('status')->default('pending')->index();
            $table->text('reason')->nullable();
            $table->text('failure_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status', 'created_at']);
            $table->index(['payment_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_refunds');

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropIndex(['organization_id', 'status', 'created_at']);
            $table->dropColumn(['refunded_amount_minor', 'fee_minor', 'net_minor']);
        });
    }
};
