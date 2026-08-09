<?php

namespace App\Http\Requests\Announcements;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnnouncementRequest extends FormRequest
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
                'sometimes',
                'nullable',
                'uuid',
                Rule::exists('rooms', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'titleAr' => ['sometimes', 'nullable', 'string', 'max:200'],
            'body' => ['sometimes', 'required', 'string', 'max:10000'],
            'bodyAr' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'audience' => [
                'sometimes',
                'nullable',
                Rule::in(['organization', 'room']),
            ],
            'pinned' => ['sometimes', 'boolean'],
            'publishedAt' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
