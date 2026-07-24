<?php

namespace App\Http\Requests\Instructors;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInstructorRequest extends FormRequest
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
            'userId' => [
                'nullable',
                'uuid',
                Rule::exists('organization_memberships', 'user_id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->where('status', 'active'),
                ),
            ],
            'name' => ['required', 'string', 'max:160'],
            'nameAr' => ['nullable', 'string', 'max:160'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'bioAr' => ['nullable', 'string', 'max:5000'],
            'specialties' => ['nullable', 'array', 'max:30'],
            'specialties.*' => ['string', 'max:100'],
            'socialLinks' => ['nullable', 'array', 'max:10'],
            'socialLinks.*' => ['nullable', 'url:http,https', 'max:2048'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ];
    }
}
