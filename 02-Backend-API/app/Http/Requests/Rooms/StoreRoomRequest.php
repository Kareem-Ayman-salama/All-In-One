<?php

namespace App\Http\Requests\Rooms;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:4000'],
            'accessType' => [
                'nullable',
                Rule::in(['read_only', 'collaborative']),
            ],
            'status' => ['nullable', Rule::in(['active', 'archived'])],
        ];
    }
}
