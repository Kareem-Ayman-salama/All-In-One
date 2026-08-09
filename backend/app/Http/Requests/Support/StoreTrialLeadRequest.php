<?php

namespace App\Http\Requests\Support;

use Illuminate\Foundation\Http\FormRequest;

class StoreTrialLeadRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:2', 'max:160'],
            'phone' => ['required', 'string', 'min:7', 'max:40'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'organization' => ['required', 'string', 'min:2', 'max:180'],
            'type' => ['required', 'string', 'max:120'],
            'students' => ['nullable', 'string', 'max:80'],
            'content' => ['nullable', 'string', 'max:500'],
        ];
    }
}
