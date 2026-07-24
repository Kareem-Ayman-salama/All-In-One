<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ErrorCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_error_catalog_is_available_for_mobile_clients(): void
    {
        $this->getJson('/api/v1/meta/error-catalog')
            ->assertOk()
            ->assertJsonPath('data.errors.INVALID_CREDENTIALS.category', 'auth')
            ->assertJsonPath('data.errors.VALIDATION_ERROR.messageAr', 'راجع الحقول المطلوبة وحاول مرة أخرى.')
            ->assertJsonPath('data.errors.RATE_LIMITED.retryable', true)
            ->assertJsonStructure([
                'data' => [
                    'version',
                    'errors' => [
                        'CONTENT_ACCESS_EXPIRED' => [
                            'status',
                            'category',
                            'retryable',
                            'messageEn',
                            'messageAr',
                        ],
                    ],
                ],
                'requestId',
            ]);
    }
}
