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
            'startDate' => [
                'nullable',
                'date',
                Rule::requiredIf(fn (): bool => $this->requiresSchedule()),
            ],
            'endDate' => [
                'nullable',
                'date',
                'after_or_equal:startDate',
                Rule::requiredIf(fn (): bool => $this->requiresSchedule()),
            ],
            'schedule' => [
                'nullable',
                'array',
                'max:50',
                Rule::requiredIf(fn (): bool => $this->requiresSchedule()),
            ],
            'schedule.*.day' => ['required_with:schedule', 'string', 'max:20'],
            'schedule.*.startTime' => ['required_with:schedule', 'date_format:H:i'],
            'schedule.*.endTime' => ['required_with:schedule', 'date_format:H:i'],
            'deliveryType' => [
                'required',
                Rule::in(['online', 'offline', 'hybrid', 'recorded']),
            ],
            'capacity' => [
                'nullable',
                'integer',
                'min:1',
                'max:100000',
                Rule::requiredIf(fn (): bool => $this->requiresSchedule()),
            ],
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

    private function requiresSchedule(): bool
    {
        return $this->input('status', 'draft') !== 'draft'
            && $this->input('deliveryType') !== 'recorded';
    }
}
