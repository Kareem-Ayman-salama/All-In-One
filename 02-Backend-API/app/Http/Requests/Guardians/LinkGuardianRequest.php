<?php

namespace App\Http\Requests\Guardians;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LinkGuardianRequest extends FormRequest
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
            'guardianEmail' => ['required', 'email:rfc', 'max:255'],
            'studentId' => [
                'required',
                'uuid',
                Rule::exists('organization_memberships', 'user_id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->where('status', 'active'),
                ),
            ],
            'relationship' => [
                'required',
                Rule::in(['father', 'mother', 'guardian', 'other']),
            ],
            'canViewNotes' => ['nullable', 'boolean'],
            'weeklyReportEnabled' => ['nullable', 'boolean'],
            'absenceAlertThreshold' => ['nullable', 'integer', 'min:1', 'max:20'],
        ];
    }
}
