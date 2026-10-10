<?php

namespace App\Http\Requests\Invitations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateInvitationRequest extends FormRequest
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
        $organizationId = $this->attributes->get('active_organization')?->id;

        return [
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'role' => [
                'required',
                'string',
                Rule::exists('roles', 'name')->where(
                    fn ($query) => $query
                        ->whereNull('organization_id')
                        ->where('scope', 'organization'),
                ),
            ],
            'roomIds' => ['nullable', 'array', 'max:100'],
            'roomIds.*' => [
                'uuid',
                Rule::exists('rooms', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'note' => ['nullable', 'string', 'max:1000'],
            'expiresInDays' => ['nullable', 'integer', 'min:1', 'max:30'],
        ];
    }
}
