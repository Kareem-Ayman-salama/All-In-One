<?php

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsAppDispatcherService
{
    /**
     * Normalize a phone number to standard international E.164-compatible format.
     * Handles local Egyptian formats (010..., 011..., 012..., 015...).
     */
    public function normalizePhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^\d+]/', '', trim($phone)) ?? '';

        if (str_starts_with($cleaned, '00')) {
            $cleaned = '+'.substr($cleaned, 2);
        }

        // Egyptian local numbers starting with 01X
        if (preg_match('/^01[0125]\d{8}$/', $cleaned)) {
            $cleaned = '+20'.substr($cleaned, 1);
        }

        if (! str_starts_with($cleaned, '+') && strlen($cleaned) >= 9) {
            $cleaned = '+'.$cleaned;
        }

        return $cleaned;
    }

    /**
     * Send an attendance notification to a student's guardian via WhatsApp.
     *
     * @return array{status:string,delivered:bool,dry_run:bool,error?:string}
     */
    public function sendAttendanceAlert(
        string $phone,
        string $studentName,
        string $status,
        string $courseName,
        ?string $instructorNote = null,
        ?string $academyName = null
    ): array {
        $academy = $academyName ?: config('app.name', 'AIN Platform');
        $statusLabels = [
            'present' => 'حاضر (Present)',
            'absent' => 'غائب (Absent)',
            'late' => 'متأخر (Late)',
            'excused' => 'غياب بعذر مقبول (Excused)',
        ];
        $statusLabel = $statusLabels[$status] ?? $status;
        $frontendUrl = rtrim((string) config('aio.frontend_url', 'https://all-in-one-production-7c60.up.railway.app'), '/');
        $portalUrl = "{$frontendUrl}/guardian/attendance";

        $message = "📚 *{$academy}* — إشعار متابعة الحضور\n\n";
        $message .= "السيد/ة ولي أمر الطالب: *{$studentName}*\n";
        $message .= "نحيطكم علماً بأنه تم تسجيل حالة الطالب في حصة *{$courseName}* كـ: *{$statusLabel}*.\n";

        if ($instructorNote) {
            $message .= "\n📝 *ملاحظة المعلم:* {$instructorNote}\n";
        }

        $message .= "\n🔗 لمتابعة سجل الحضور والواجبات المدرسية:\n{$portalUrl}";

        return $this->dispatch($phone, $message, [
            'type' => 'attendance_alert',
            'studentName' => $studentName,
            'status' => $status,
            'course' => $courseName,
        ]);
    }

    /**
     * Send a quiz result alert to a student's guardian via WhatsApp.
     *
     * @return array{status:string,delivered:bool,dry_run:bool,error?:string}
     */
    public function sendQuizResultAlert(
        string $phone,
        string $studentName,
        string $quizTitle,
        int|float $score,
        int|float $passingScore,
        string $status,
        ?string $academyName = null
    ): array {
        $academy = $academyName ?: config('app.name', 'AIN Platform');
        $passed = $score >= $passingScore;
        $evaluation = $passed ? 'ناجح ومتميز 🌟' : 'يحتاج إلى مراجعة إضافية ✍️';
        $frontendUrl = rtrim((string) config('aio.frontend_url', 'https://all-in-one-production-7c60.up.railway.app'), '/');
        $portalUrl = "{$frontendUrl}/guardian/attendance";

        $message = "🎯 *{$academy}* — نتيجة اختبار تفاعلي\n\n";
        $message .= "السيد/ة ولي أمر الطالب: *{$studentName}*\n";
        $message .= "أتم الطالب اختبار: *{$quizTitle}*\n";
        $message .= "📊 الدرجة المحققة: *{$score}%* (درجة الاجتياز: {$passingScore}%)\n";
        $message .= "التقييم: *{$evaluation}*\n";
        $message .= "\n🔗 لمراجعة تفاصيل الإجابات وملاحظات التصحيح:\n{$portalUrl}";

        return $this->dispatch($phone, $message, [
            'type' => 'quiz_result',
            'studentName' => $studentName,
            'quiz' => $quizTitle,
            'score' => $score,
            'passed' => $passed,
        ]);
    }

    /**
     * Low-level dispatcher to external webhook or logging engine.
     *
     * @param  array<string, mixed>  $metadata
     * @return array{status:string,delivered:bool,dry_run:bool,error?:string}
     */
    public function dispatch(string $phone, string $message, array $metadata = []): array
    {
        $normalizedPhone = $this->normalizePhoneNumber($phone);
        $enabled = (bool) config('services.whatsapp.enabled', false);
        $webhookUrl = (string) config('services.whatsapp.webhook_url', '');
        $token = (string) config('services.whatsapp.token', '');

        if (! $enabled || empty($webhookUrl)) {
            Log::info('aio.whatsapp.simulated', [
                'recipient' => $normalizedPhone,
                'metadata' => $metadata,
                'messagePreview' => mb_substr($message, 0, 120),
                'enabled' => $enabled,
            ]);

            return [
                'status' => 'simulated',
                'delivered' => false,
                'dry_run' => true,
            ];
        }

        try {
            $client = Http::timeout(6)->acceptJson();
            if ($token !== '') {
                $client = $client->withToken($token);
            }

            $response = $client->post($webhookUrl, [
                'recipient' => $normalizedPhone,
                'phone' => $normalizedPhone,
                'message' => $message,
                'body' => $message,
                'metadata' => $metadata,
                'dispatched_at' => now()->toIso8601String(),
            ]);

            if ($response->successful()) {
                Log::info('aio.whatsapp.delivered', [
                    'recipient' => $normalizedPhone,
                    'status' => $response->status(),
                    'type' => $metadata['type'] ?? 'general',
                ]);

                return [
                    'status' => 'delivered',
                    'delivered' => true,
                    'dry_run' => false,
                ];
            }

            Log::warning('aio.whatsapp.failed', [
                'recipient' => $normalizedPhone,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'status' => 'failed',
                'delivered' => false,
                'dry_run' => false,
                'error' => "HTTP {$response->status()}",
            ];
        } catch (Throwable $e) {
            Log::error('aio.whatsapp.exception', [
                'recipient' => $normalizedPhone,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 'error',
                'delivered' => false,
                'dry_run' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
