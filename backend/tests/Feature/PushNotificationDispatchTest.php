<?php

namespace Tests\Feature;

use App\Contracts\Notifications\PushNotificationProvider;
use App\Jobs\SendPushNotification;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\PushDeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PushNotificationDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_notification_queues_push_delivery(): void
    {
        Queue::fake();
        $user = User::factory()->create();

        $notification = Notification::query()->create([
            'user_id' => $user->id,
            'type' => 'booking_confirmed',
            'priority' => 'high',
            'title' => 'Booking confirmed',
            'body' => 'Your course booking has been confirmed.',
            'status' => 'unread',
        ]);

        Queue::assertPushed(
            SendPushNotification::class,
            fn (SendPushNotification $job): bool => $job->notificationId === $notification->id,
        );
    }

    public function test_push_delivery_uses_preferences_and_active_tokens(): void
    {
        CapturingPushProvider::reset();
        $this->app->instance(
            PushNotificationProvider::class,
            new CapturingPushProvider,
        );
        $user = User::factory()->create();
        NotificationPreference::query()->create([
            'user_id' => $user->id,
            'organization_id' => null,
            'push_enabled' => true,
            'booking_updates' => true,
            'announcements' => true,
            'subscription_reminders' => true,
        ]);
        PushDeviceToken::query()->create([
            'user_id' => $user->id,
            'provider' => 'fcm',
            'platform' => 'ios',
            'installation_id' => 'test-installation',
            'token' => str_repeat('a', 80),
            'token_hash' => hash('sha256', str_repeat('a', 80)),
            'last_registered_at' => now(),
        ]);
        $notification = Notification::query()->create([
            'user_id' => $user->id,
            'type' => 'booking_confirmed',
            'priority' => 'high',
            'title' => 'Booking confirmed',
            'body' => 'Your course booking has been confirmed.',
            'target_type' => 'booking',
            'target_id' => fake()->uuid(),
            'status' => 'unread',
        ]);

        (new SendPushNotification($notification->id))->handle(
            app(PushNotificationProvider::class),
        );

        $this->assertSame([str_repeat('a', 80)], CapturingPushProvider::$tokens);
        $this->assertSame(
            'student.bookings',
            CapturingPushProvider::$payload['data']['routeName'],
        );
        $this->assertDatabaseHas('notifications', [
            'id' => $notification->id,
            'status' => 'unread',
        ]);
        $notification->refresh();
        $this->assertSame('attempted', $notification->data['pushDelivery']['status']);
        $this->assertSame(1, $notification->data['pushDelivery']['sent']);
    }
}

class CapturingPushProvider implements PushNotificationProvider
{
    /** @var list<string> */
    public static array $tokens = [];

    /** @var array<string, mixed> */
    public static array $payload = [];

    public static function reset(): void
    {
        self::$tokens = [];
        self::$payload = [];
    }

    /**
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $payload
     * @return array{sent:int,failed:int,skipped:bool}
     */
    public function send(array $tokens, array $payload): array
    {
        self::$tokens = $tokens;
        self::$payload = $payload;

        return [
            'sent' => count($tokens),
            'failed' => 0,
            'skipped' => false,
        ];
    }
}
