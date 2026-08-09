<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminSubscriptionApprovalTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_request_and_approve_manual_subscription(): void
    {
        $this->seed();
        $admin = User::factory()->create();
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        $organization = Organization::query()->create([
            'name' => 'Manual Academy',
            'slug' => 'manual-academy',
            'type' => 'academy',
        ]);
        Sanctum::actingAs($admin);

        $request = $this->postJson(
            "/api/v1/admin/organizations/{$organization->id}/subscriptions/request-activation",
            [
                'planCode' => 'growth',
                'billingInterval' => 'monthly',
                'activationNote' => 'Bank transfer received.',
                'paymentProofReference' => 'TRX-123',
            ],
        )
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending_activation')
            ->assertJsonPath('data.payment_proof_reference', 'TRX-123');

        $subscriptionId = $request->json('data.id');
        $this->postJson("/api/v1/admin/subscriptions/{$subscriptionId}/approve", [
            'periodMonths' => 2,
            'note' => 'Approved for pilot.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.approved_by', $admin->id);

        $subscription = OrganizationSubscription::query()->findOrFail($subscriptionId);
        $this->assertSame('active', $subscription->status);
        $this->assertNotNull($subscription->approved_at);
        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $organization->id,
            'actor_id' => $admin->id,
            'action' => 'subscription.approved',
            'entity_id' => $subscriptionId,
        ]);
    }

    public function test_super_admin_can_reject_subscription_and_suspend_workspace(): void
    {
        $this->seed();
        $admin = User::factory()->create();
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        $organization = Organization::query()->create([
            'name' => 'Rejected Academy',
            'slug' => 'rejected-academy',
            'type' => 'academy',
        ]);
        $subscription = OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'pending_activation',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);
        Sanctum::actingAs($admin);

        $this->postJson("/api/v1/admin/subscriptions/{$subscription->id}/reject", [
            'reason' => 'Payment proof was invalid.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Payment proof was invalid.');

        $this->postJson("/api/v1/admin/organizations/{$organization->id}/suspend", [
            'reason' => 'Payment not confirmed.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->postJson("/api/v1/admin/organizations/{$organization->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
    }

    public function test_non_super_admin_cannot_approve_subscription(): void
    {
        $this->seed();
        $support = User::factory()->create();
        $support->forceFill(['platform_role' => 'platform_support'])->save();
        $organization = Organization::query()->create([
            'name' => 'Support Academy',
            'slug' => 'support-academy',
            'type' => 'academy',
        ]);
        $subscription = OrganizationSubscription::query()->create([
            'organization_id' => $organization->id,
            'plan_id' => Plan::query()->where('code', 'growth')->firstOrFail()->id,
            'status' => 'pending_activation',
            'billing_interval' => 'monthly',
            'current_period_starts_at' => now(),
            'current_period_ends_at' => now()->addMonth(),
        ]);
        Sanctum::actingAs($support);

        $this->postJson("/api/v1/admin/subscriptions/{$subscription->id}/approve")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'PLATFORM_ACCESS_DENIED');
    }
}
