<?php

namespace App\Http\Requests\Organizations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateOrganizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->email_verified_at !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'min:2',
                'max:120',
                'alpha_dash:ascii',
                Rule::unique('organizations', 'slug'),
            ],
            'type' => [
                'required',
                Rule::in(['academy', 'training_center', 'company']),
            ],
            'planCode' => [
                'nullable',
                'string',
                Rule::exists('plans', 'code')->where('active', true),
            ],
            'bio' => ['nullable', 'string', 'max:2000'],
            'brandColor' => [
                'nullable',
                'regex:/^#[0-9A-Fa-f]{6}$/',
            ],
            'locale' => ['nullable', Rule::in(['ar', 'en'])],
            'timezone' => ['nullable', 'timezone:all'],
        ];
    }
}
