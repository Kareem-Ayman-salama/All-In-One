<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeepLinkManifestTest extends TestCase
{
    use RefreshDatabase;

    public function test_deep_link_manifest_is_available_for_mobile_clients(): void
    {
        $response = $this->getJson('/api/v1/meta/deep-links')
            ->assertOk()
            ->assertJsonPath('data.scheme', 'ain')
            ->assertJsonStructure([
                'data' => [
                    'version',
                    'scheme',
                    'webHost',
                    'baseUrl',
                    'routes' => [
                        'marketplace.course' => [
                            'path',
                            'requiresAuth',
                            'fallbackPath',
                            'parameters',
                            'mobileScreen',
                            'webUrlTemplate',
                            'appUrlTemplate',
                        ],
                    ],
                ],
                'requestId',
            ]);

        $routes = $response->json('data.routes');
        $this->assertSame('/invite/{token}', $routes['invite.accept']['path']);
        $this->assertSame('invitations.accept', $routes['invite.accept']['mobileScreen']);
        $this->assertFalse($routes['invite.accept']['requiresAuth']);
        $this->assertTrue($routes['student.notifications']['requiresAuth']);
    }
}
