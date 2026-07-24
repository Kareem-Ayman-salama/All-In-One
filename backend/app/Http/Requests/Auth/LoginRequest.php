<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => mb_strtolower(trim((string) $this->input('email'))),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
            'deviceName' => ['sometimes', 'string', 'max:120'],
            'installationId' => ['sometimes', 'string', 'min:8', 'max:120'],
            'platform' => [
                'sometimes',
                'string',
                Rule::in(config('device_policy.allowed_platforms')),
            ],
            'appVersion' => ['sometimes', 'string', 'max:60'],
            'mfaCode' => ['sometimes', 'string', 'digits:6'],
        ];
    }
}
