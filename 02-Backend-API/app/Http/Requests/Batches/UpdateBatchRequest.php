<?php

namespace App\Http\Requests\Batches;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBatchRequest extends FormRequest
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
            'courseId' => [
                'sometimes',
                'required',
                'uuid',
                Rule::exists('courses', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'roomId' => [
                'sometimes',
                'required',
                'uuid',
                Rule::exists('rooms', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'title' => ['sometimes', 'required', 'string', 'max:160'],
            'titleAr' => ['sometimes', 'nullable', 'string', 'max:160'],
            'startDate' => ['sometimes', 'required', 'date'],
            'endDate' => ['sometimes', 'required', 'date'],
            'schedule' => ['sometimes', 'required', 'array', 'min:1', 'max:50'],
            'schedule.*.day' => ['required_with:schedule', 'string', 'max:20'],
            'schedule.*.startTime' => ['required_with:schedule', 'date_format:H:i'],
            'schedule.*.endTime' => ['required_with:schedule', 'date_format:H:i'],
            'deliveryType' => [
                'sometimes',
                'required',
                Rule::in(['online', 'offline', 'hybrid', 'recorded']),
            ],
            'capacity' => ['sometimes', 'required', 'integer', 'min:1', 'max:100000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:500'],
            'meetingReference' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'enrollmentStartsAt' => ['sometimes', 'nullable', 'date'],
            'enrollmentEndsAt' => [
                'sometimes',
                'nullable',
                'date',
            ],
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    'draft',
                    'open',
                    'full',
                    'in_progress',
                    'completed',
                    'cancelled',
                ]),
            ],
        ];
    }
}
