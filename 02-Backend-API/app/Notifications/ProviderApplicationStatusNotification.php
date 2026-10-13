<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProviderApplicationStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [30, 120, 600, 1800];

    public function __construct(
        private readonly string $status,
        private readonly ?string $note,
        private readonly string $applicationUrl,
    ) {
        $this->afterCommit();
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $arabic = ($notifiable->locale ?? 'ar') === 'ar';
        $copy = $this->copy($arabic);
        $message = (new MailMessage)
            ->subject($copy['subject'])
            ->greeting($arabic ? "مرحبًا {$notifiable->name}،" : "Hello {$notifiable->name},")
            ->line($copy['body']);

        if ($this->note) {
            $message->line(($arabic ? 'ملاحظة المراجعة: ' : 'Review note: ').$this->note);
        }

        return $message
            ->action($arabic ? 'متابعة الطلب' : 'View application', $this->applicationUrl)
            ->line($arabic
                ? 'يمكنك متابعة حالة الطلب من حسابك داخل المنصة.'
                : 'You can track the application status from your platform account.');
    }

    /**
     * @return array{subject: string, body: string}
     */
    private function copy(bool $arabic): array
    {
        $translations = [
            'pending_review' => [
                'ar' => ['subject' => 'تم استلام طلب انضمامك كمدرس', 'body' => 'طلبك الآن قيد مراجعة فريق AIN.'],
                'en' => ['subject' => 'Your instructor application was received', 'body' => 'Your application is now under review by the AIN team.'],
            ],
            'needs_changes' => [
                'ar' => ['subject' => 'طلب المدرس يحتاج استكمال بيانات', 'body' => 'راجع ملاحظة فريق المراجعة وحدّث طلبك ثم أرسله مجددًا.'],
                'en' => ['subject' => 'Your instructor application needs changes', 'body' => 'Review the team note, update your application, and resubmit it.'],
            ],
            'approved' => [
                'ar' => ['subject' => 'تم قبول طلبك كمدرس على AIN', 'body' => 'تهانينا، تم تفعيل مساحة المدرس ويمكنك الآن تجهيز أول كورس للمراجعة.'],
                'en' => ['subject' => 'Your AIN instructor application was approved', 'body' => 'Congratulations. Your instructor workspace is active and ready for your first course.'],
            ],
            'rejected' => [
                'ar' => ['subject' => 'تحديث بخصوص طلب المدرس', 'body' => 'تعذر قبول الطلب في الوقت الحالي. راجع سبب القرار داخل حسابك.'],
                'en' => ['subject' => 'Instructor application update', 'body' => 'We could not approve the application at this time. Review the decision in your account.'],
            ],
        ];

        return $translations[$this->status][$arabic ? 'ar' : 'en'];
    }
}
