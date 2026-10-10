<?php

namespace App\Http\Requests\Notifications;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'organizationId' => ['nullable', 'uuid'],
            'inAppEnabled' => ['required', 'boolean'],
            'emailEnabled' => ['required', 'boolean'],
            'pushEnabled' => ['required', 'boolean'],
            'bookingUpdates' => ['required', 'boolean'],
            'announcements' => ['required', 'boolean'],
            'subscriptionReminders' => ['required', 'boolean'],
        ];
    }
}
