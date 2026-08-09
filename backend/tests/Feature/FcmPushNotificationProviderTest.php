<?php

namespace Tests\Feature;

use App\Services\Notifications\FcmPushNotificationProvider;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FcmPushNotificationProviderTest extends TestCase
{
    public function test_fcm_provider_sends_each_token_with_oauth_access_token(): void
    {
        Cache::flush();
        $clientEmail = 'firebase-adminsdk@test.iam.gserviceaccount.com';
        config()->set('push.fcm.project_id', 'ain-test');
        config()->set('push.fcm.service_account_json_base64', base64_encode(json_encode([
            'client_email' => $clientEmail,
            'private_key' => 'test-private-key',
            'token_uri' => 'https://oauth2.googleapis.com/token',
        ], JSON_THROW_ON_ERROR)));
        Cache::put('aio.fcm.access_token.'.sha1($clientEmail), 'fcm-access-token', now()->addMinutes(5));

        Http::fake([
            'https://fcm.googleapis.com/v1/projects/ain-test/messages:send' => Http::response([
                'name' => 'projects/ain-test/messages/1',
            ]),
        ]);

        $result = (new FcmPushNotificationProvider)->send(
            ['token-one', 'token-two'],
            [
                'notification' => [
                    'title' => 'Booking confirmed',
                    'body' => 'Open AIN to review your update.',
                ],
                'data' => [
                    'notificationId' => 'notification-1',
                    'targetId' => null,
                    'attempt' => 1,
                ],
            ],
        );

        $this->assertSame(['sent' => 2, 'failed' => 0, 'skipped' => false], $result);
        Http::assertSentCount(2);
        Http::assertSent(fn ($request): bool => $request->hasHeader('Authorization', 'Bearer fcm-access-token')
            && $request['message']['token'] === 'token-one'
            && $request['message']['data']['attempt'] === '1'
            && ! array_key_exists('targetId', $request['message']['data']));
    }

    public function test_fcm_provider_skips_without_credentials(): void
    {
        config()->set('push.fcm.project_id', null);
        config()->set('push.fcm.service_account_json_base64', null);
        config()->set('push.fcm.service_account_path', null);

        Http::fake();

        $result = (new FcmPushNotificationProvider)->send(['token-one'], [
            'notification' => ['title' => 'Test', 'body' => 'Test'],
            'data' => ['notificationId' => 'notification-1'],
        ]);

        $this->assertSame(['sent' => 0, 'failed' => 0, 'skipped' => true], $result);
        Http::assertNothingSent();
    }
}
