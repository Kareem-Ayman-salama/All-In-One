<?php

namespace App\Http\Requests\Members;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMembershipRequest extends FormRequest
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
                'required',
                Rule::exists('roles', 'name')->where(
                    fn ($query) => $query
                        ->whereNull('organization_id')
                        ->where('scope', 'organization'),
                ),
            ],
            'status' => [
                'sometimes',
                Rule::in(['active', 'suspended']),
            ],
        ];
    }
}
