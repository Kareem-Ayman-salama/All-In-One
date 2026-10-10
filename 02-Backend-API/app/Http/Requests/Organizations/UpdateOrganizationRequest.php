<?php

namespace App\Http\Requests\Organizations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'min:2', 'max:120'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'brandColor' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'locale' => ['sometimes', Rule::in(['ar', 'en'])],
            'timezone' => ['sometimes', 'timezone:all'],
        ];
    }
}
