<?php

namespace App\Http\Requests\Events;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEventRequest extends FormRequest
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
        $organizationId = $this->attributes->get('active_organization')?->id;

        return [
            'roomId' => [
                'nullable',
                'uuid',
                Rule::exists('rooms', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'title' => ['required', 'string', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => ['nullable', Rule::in(['event', 'class', 'exam', 'meeting'])],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'location' => ['nullable', 'string', 'max:500'],
            'meetingProvider' => [
                'nullable',
                Rule::in(['zoom', 'google_meet', 'teams', 'internal']),
            ],
            'meetingReference' => ['nullable', 'string', 'max:2048'],
            'status' => [
                'nullable',
                Rule::in(['scheduled', 'completed', 'cancelled']),
            ],
        ];
    }
}
