<?php

namespace App\Http\Requests\Rooms;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomMembershipRequest extends FormRequest
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
            'role' => [
                'sometimes',
                'nullable',
                Rule::in(['member', 'assistant', 'instructor']),
            ],
            'status' => [
                'sometimes',
                'nullable',
                Rule::in(['active', 'suspended']),
            ],
        ];
    }
}
