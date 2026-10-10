<?php

namespace App\Http\Requests\Rooms;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
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
            'description' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'accessType' => [
                'sometimes',
                Rule::in(['read_only', 'collaborative']),
            ],
            'status' => ['sometimes', Rule::in(['active', 'archived'])],
        ];
    }
}
