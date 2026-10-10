<?php

namespace Tests\Feature;

use Tests\TestCase;

class ObservabilityTest extends TestCase
{
    public function test_valid_request_id_is_returned_to_the_client(): void
    {
        $this->withHeader('X-Request-ID', 'client-request-123')
            ->getJson('/api/v1/health/live')
            ->assertOk()
            ->assertHeader('X-Request-ID', 'client-request-123')
            ->assertJsonPath('requestId', 'client-request-123');
    }

    public function test_unsafe_request_id_is_replaced(): void
    {
        $response = $this
            ->withHeader('X-Request-ID', "unsafe\nrequest")
            ->getJson('/api/v1/health/live')
            ->assertOk();

        $requestId = $response->headers->get('X-Request-ID');
        $this->assertIsString($requestId);
        $this->assertMatchesRegularExpression(
            '/\A[0-9a-f-]{36}\z/',
            $requestId,
        );
        $response->assertJsonPath('requestId', $requestId);
    }
}
