<?php

namespace App\Http\Requests\Academies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertAcademyProfileRequest extends FormRequest
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
        $profileId = $this->attributes->get('active_organization')
            ?->academyProfile?->id;

        return [
            'slug' => [
                'required',
                'string',
                'alpha_dash:ascii',
                'max:120',
                Rule::unique('academy_profiles', 'slug')->ignore($profileId),
            ],
            'publicName' => ['required', 'string', 'max:160'],
            'publicNameAr' => ['nullable', 'string', 'max:160'],
            'description' => ['required', 'string', 'min:20', 'max:10000'],
            'descriptionAr' => ['nullable', 'string', 'max:10000'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'website' => ['nullable', 'url:http,https', 'max:2048'],
            'location' => ['nullable', 'string', 'max:500'],
            'branches' => ['nullable', 'array', 'max:50'],
            'branches.*' => ['string', 'max:500'],
            'deliveryMethods' => ['nullable', 'array', 'max:4'],
            'deliveryMethods.*' => [
                Rule::in(['online', 'offline', 'hybrid', 'recorded']),
            ],
            'cancellationPolicy' => ['nullable', 'string', 'max:5000'],
            'isPublic' => ['nullable', 'boolean'],
        ];
    }
}
