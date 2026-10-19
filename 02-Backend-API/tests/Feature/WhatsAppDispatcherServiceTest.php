<?php

namespace Tests\Feature;

use App\Services\Notifications\WhatsAppDispatcherService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppDispatcherServiceTest extends TestCase
{
    public function test_normalize_phone_number_formats_egyptian_and_international_numbers(): void
    {
        $service = new WhatsAppDispatcherService;

        $this->assertSame('+201012345678', $service->normalizePhoneNumber('01012345678'));
        $this->assertSame('+201123456789', $service->normalizePhoneNumber('01123456789'));
        $this->assertSame('+201234567890', $service->normalizePhoneNumber('01234567890'));
        $this->assertSame('+201512345678', $service->normalizePhoneNumber('01512345678'));
        $this->assertSame('+966501234567', $service->normalizePhoneNumber('00966501234567'));
        $this->assertSame('+201098765432', $service->normalizePhoneNumber('+20 10 9876 5432'));
    }

    public function test_whatsapp_dispatcher_simulates_cleanly_when_disabled(): void
    {
        config()->set('services.whatsapp.enabled', false);
        config()->set('services.whatsapp.webhook_url', '');

        Http::fake();

        $service = new WhatsAppDispatcherService;
        $result = $service->sendAttendanceAlert(
            phone: '01012345678',
            studentName: 'Ziad Hany',
            status: 'present',
            courseName: 'Physics 101',
            instructorNote: 'Participated well in the lab.',
            academyName: 'Al-Nour Academy',
        );

        $this->assertSame('simulated', $result['status']);
        $this->assertFalse($result['delivered']);
        $this->assertTrue($result['dry_run']);
        Http::assertNothingSent();
    }

    public function test_whatsapp_dispatcher_sends_attendance_webhook_when_enabled(): void
    {
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.whatsapp.webhook_url', 'https://api.example.com/v1/whatsapp/dispatch');
        config()->set('services.whatsapp.token', 'test-wa-token');

        Http::fake([
            'https://api.example.com/v1/whatsapp/dispatch' => Http::response(['success' => true, 'id' => 'wa-msg-123'], 200),
        ]);

        $service = new WhatsAppDispatcherService;
        $result = $service->sendAttendanceAlert(
            phone: '01099887766',
            studentName: 'Fatima Omar',
            status: 'present',
            courseName: 'Advanced Calculus',
            instructorNote: 'Excellent attendance record.',
            academyName: 'Al-Amal Academy',
        );

        $this->assertSame('delivered', $result['status']);
        $this->assertTrue($result['delivered']);
        $this->assertFalse($result['dry_run']);

        Http::assertSent(function ($request): bool {
            return $request->url() === 'https://api.example.com/v1/whatsapp/dispatch'
                && $request->hasHeader('Authorization', 'Bearer test-wa-token')
                && $request['recipient'] === '+201099887766'
                && str_contains($request['message'], 'Fatima Omar')
                && str_contains($request['message'], 'Advanced Calculus')
                && str_contains($request['message'], 'حاضر');
        });
    }

    public function test_whatsapp_dispatcher_sends_quiz_result_alert(): void
    {
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.whatsapp.webhook_url', 'https://api.example.com/v1/whatsapp/dispatch');
        config()->set('services.whatsapp.token', 'test-wa-token');

        Http::fake([
            'https://api.example.com/v1/whatsapp/dispatch' => Http::response(['success' => true], 200),
        ]);

        $service = new WhatsAppDispatcherService;
        $result = $service->sendQuizResultAlert(
            phone: '01011223344',
            studentName: 'Youssef Kareem',
            quizTitle: 'Biology Midterm',
            score: 92,
            passingScore: 60,
            status: 'passed',
            academyName: 'Al-Nour Academy',
        );

        $this->assertSame('delivered', $result['status']);
        $this->assertTrue($result['delivered']);

        Http::assertSent(function ($request): bool {
            return $request['recipient'] === '+201011223344'
                && str_contains($request['message'], 'Youssef Kareem')
                && str_contains($request['message'], 'Biology Midterm')
                && str_contains($request['message'], '92%');
        });
    }
}
