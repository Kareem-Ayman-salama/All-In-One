<?php

namespace Tests\Feature;

use App\Models\SupportRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupportOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_user_can_submit_trial_lead(): void
    {
        $payload = [
            'name' => 'Dr. Ahmed Taha',
            'email' => 'ahmed.taha@example.com',
            'phone' => '01025849793',
            'organization' => 'Al-Nour Academy',
            'type' => 'academy',
            'students' => '150',
            'content' => 'High school physics videos',
        ];

        $this->postJson('/api/v1/public/trial-leads', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('support_requests', [
            'name' => 'Dr. Ahmed Taha',
            'email' => 'ahmed.taha@example.com',
            'subject' => 'One-month trial lead',
            'status' => 'open',
            'priority' => 'high',
        ]);

        $this->assertDatabaseHas('outbox_events', [
            'event_type' => 'lead.trial_requested',
            'aggregate_type' => 'SupportRequest',
        ]);
    }

    public function test_public_user_can_submit_support_ticket(): void
    {
        $payload = [
            'name' => 'Sara Ali',
            'email' => 'sara.ali@example.com',
            'subject' => 'Inquiry regarding student device binding',
            'message' => 'How can students change their registered device?',
            'priority' => 'normal',
        ];

        $this->postJson('/api/v1/support', $payload)
            ->assertCreated()
            ->assertJsonPath('data.status', 'open');

        $this->assertDatabaseHas('support_requests', [
            'name' => 'Sara Ali',
            'email' => 'sara.ali@example.com',
            'subject' => 'Inquiry regarding student device binding',
            'status' => 'open',
        ]);

        $this->assertDatabaseHas('outbox_events', [
            'event_type' => 'support.ticket_created',
            'aggregate_type' => 'SupportRequest',
        ]);
    }

    public function test_admin_can_list_and_filter_support_tickets(): void
    {
        $this->seed();
        $admin = User::factory()->create();
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        Sanctum::actingAs($admin);

        SupportRequest::query()->create([
            'name' => 'User One',
            'email' => 'user1@example.com',
            'subject' => 'Ticket 1',
            'message' => 'Help 1',
            'priority' => 'normal',
            'status' => 'open',
        ]);

        SupportRequest::query()->create([
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'subject' => 'Ticket 2',
            'message' => 'Help 2',
            'priority' => 'normal',
            'status' => 'resolved',
        ]);

        $this->getJson('/api/v1/admin/support?status=open')
            ->assertOk()
            ->assertJsonPath('data.0.subject', 'Ticket 1');
    }

    public function test_admin_can_update_support_ticket_status_and_crm_notes(): void
    {
        $this->seed();
        $admin = User::factory()->create();
        $admin->forceFill(['platform_role' => 'super_admin'])->save();
        Sanctum::actingAs($admin);

        $ticket = SupportRequest::query()->create([
            'name' => 'User Three',
            'email' => 'user3@example.com',
            'subject' => 'Trial Lead Lead 3',
            'message' => 'Wants trial setup',
            'priority' => 'high',
            'status' => 'open',
        ]);

        $this->patchJson("/api/v1/admin/support/{$ticket->id}", [
            'status' => 'in_progress',
            'notes' => 'Contacted via WhatsApp. Needs 100 student trial code.',
            'priority' => 'urgent',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.notes', 'Contacted via WhatsApp. Needs 100 student trial code.')
            ->assertJsonPath('data.priority', 'urgent');

        $this->assertDatabaseHas('support_requests', [
            'id' => $ticket->id,
            'status' => 'in_progress',
            'notes' => 'Contacted via WhatsApp. Needs 100 student trial code.',
            'priority' => 'urgent',
        ]);

        $this->assertDatabaseHas('outbox_events', [
            'event_type' => 'support.ticket_updated',
            'aggregate_id' => $ticket->id,
        ]);
    }
}
