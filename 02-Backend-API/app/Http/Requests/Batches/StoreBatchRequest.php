<?php

namespace App\Http\Requests\Batches;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBatchRequest extends FormRequest
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
                'required',
                'uuid',
                Rule::exists('courses', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'roomId' => [
                'required',
                'uuid',
                Rule::exists('rooms', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'title' => ['required', 'string', 'max:160'],
            'titleAr' => ['nullable', 'string', 'max:160'],
            'startDate' => ['nullable', 'date', 'required_unless:status,draft'],
            'endDate' => ['nullable', 'date', 'after_or_equal:startDate', 'required_unless:status,draft'],
            'schedule' => ['nullable', 'array', 'max:50', 'required_unless:status,draft'],
            'schedule.*.day' => ['required_with:schedule', 'string', 'max:20'],
            'schedule.*.startTime' => ['required_with:schedule', 'date_format:H:i'],
            'schedule.*.endTime' => ['required_with:schedule', 'date_format:H:i'],
            'deliveryType' => [
                'required',
                Rule::in(['online', 'offline', 'hybrid', 'recorded']),
            ],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:100000', 'required_unless:status,draft'],
            'location' => ['nullable', 'string', 'max:500'],
            'meetingReference' => ['nullable', 'string', 'max:2048'],
            'enrollmentStartsAt' => ['nullable', 'date'],
            'enrollmentEndsAt' => [
                'nullable',
                'date',
                'after:enrollmentStartsAt',
            ],
            'status' => [
                'nullable',
                Rule::in(['draft', 'open', 'full', 'in_progress', 'completed', 'cancelled']),
            ],
        ];
    }
}
