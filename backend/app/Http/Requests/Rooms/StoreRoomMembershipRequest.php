<?php

namespace App\Http\Requests\Rooms;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomMembershipRequest extends FormRequest
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
            'userId' => [
                'required',
                'uuid',
                Rule::exists('organization_memberships', 'user_id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->where('status', 'active'),
                ),
            ],
            'role' => [
                'sometimes',
                'nullable',
                Rule::in(['member', 'assistant', 'instructor']),
            ],
        ];
    }
}
