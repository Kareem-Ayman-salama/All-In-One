<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfflineCachePolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_offline_cache_policy_is_available_for_mobile_clients(): void
    {
        $response = $this->getJson('/api/v1/meta/offline-cache-policy')
            ->assertOk()
            ->assertJsonPath('data.defaultWritePolicy', 'server_confirmation_required')
            ->assertJsonStructure([
                'data' => [
                    'version',
                    'purgeOn',
                    'datasets' => [
                        'auth.profile' => [
                            'endpoint',
                            'scope',
                            'ttlSeconds',
                            'storage',
                            'sensitivity',
                            'offlineReadable',
                            'staleWhileRevalidate',
                            'purgeOnLogout',
                        ],
                    ],
                    'writeOperations',
                ],
                'requestId',
            ]);

        $datasets = $response->json('data.datasets');
        $operations = $response->json('data.writeOperations');
        $this->assertSame('memory_only', $datasets['content.view_session']['storage']);
        $this->assertTrue($datasets['content.view_session']['neverPersist']);
        $this->assertSame('mark_read', $datasets['notifications.inbox']['optimisticActions'][0]);
        $this->assertTrue($operations['bookings.confirm']['requiresServerConfirmation']);
    }
}
