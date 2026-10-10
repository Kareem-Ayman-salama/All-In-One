<?php

namespace App\Http\Requests\Devices;

use Illuminate\Foundation\Http\FormRequest;

class DeletePushDeviceTokenRequest extends FormRequest
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
            'token' => ['nullable', 'required_without:installationId', 'string', 'max:4096'],
            'installationId' => ['nullable', 'required_without:token', 'string', 'max:120'],
        ];
    }
}
