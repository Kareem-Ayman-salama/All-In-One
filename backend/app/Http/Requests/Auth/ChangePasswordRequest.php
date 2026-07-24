<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ChangePasswordRequest extends FormRequest
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
            'currentPassword' => ['required', 'string'],
            'newPassword' => [
                'required',
                'confirmed',
                Password::min(10)->mixedCase()->numbers(),
            ],
        ];
    }
}
