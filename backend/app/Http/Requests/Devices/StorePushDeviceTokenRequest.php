<?php

namespace App\Http\Requests\Devices;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePushDeviceTokenRequest extends FormRequest
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
            'token' => ['required', 'string', 'min:40', 'max:4096'],
            'provider' => ['sometimes', 'string', Rule::in(['fcm'])],
            'platform' => [
                'required',
                'string',
                Rule::in(['android', 'ios', 'web']),
            ],
            'installationId' => ['required', 'string', 'min:8', 'max:120'],
            'deviceName' => ['nullable', 'string', 'max:120'],
            'appVersion' => ['nullable', 'string', 'max:60'],
        ];
    }
}
