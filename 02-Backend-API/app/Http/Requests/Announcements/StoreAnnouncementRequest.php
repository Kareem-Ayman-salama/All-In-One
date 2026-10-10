<?php

namespace App\Http\Requests\Announcements;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
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
            'body' => ['required', 'string', 'max:10000'],
            'bodyAr' => ['nullable', 'string', 'max:10000'],
            'audience' => ['nullable', Rule::in(['organization', 'room'])],
            'pinned' => ['nullable', 'boolean'],
            'publishedAt' => ['nullable', 'date'],
        ];
    }
}
