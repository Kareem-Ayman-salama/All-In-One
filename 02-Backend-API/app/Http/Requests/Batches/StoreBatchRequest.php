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
            'startDate' => ['required', 'date'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
            'schedule' => ['required', 'array', 'min:1', 'max:50'],
            'schedule.*.day' => ['required', 'string', 'max:20'],
            'schedule.*.startTime' => ['required', 'date_format:H:i'],
            'schedule.*.endTime' => ['required', 'date_format:H:i'],
            'deliveryType' => [
                'required',
                Rule::in(['online', 'offline', 'hybrid', 'recorded']),
            ],
            'capacity' => ['required', 'integer', 'min:1', 'max:100000'],
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
