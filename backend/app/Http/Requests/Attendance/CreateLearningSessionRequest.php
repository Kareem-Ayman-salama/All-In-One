<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateLearningSessionRequest extends FormRequest
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
            'batchId' => [
                'nullable',
                'required_without:lessonBookingId',
                Rule::prohibitedIf(fn (): bool => $this->filled('lessonBookingId')),
                'uuid',
                Rule::exists('course_batches', 'id')->where(
                    fn ($query) => $query->where('organization_id', $organizationId),
                ),
            ],
            'lessonBookingId' => [
                'nullable',
                'required_without:batchId',
                Rule::prohibitedIf(fn (): bool => $this->filled('batchId')),
                'uuid',
                Rule::exists('lesson_bookings', 'id')->where(
                    fn ($query) => $query->where('organization_id', $organizationId),
                ),
            ],
            'instructorId' => [
                'nullable',
                'uuid',
                Rule::exists('instructors', 'id')->where(
                    fn ($query) => $query->where('organization_id', $organizationId),
                ),
            ],
            'title' => ['required', 'string', 'max:180'],
            'titleAr' => ['nullable', 'string', 'max:180'],
            'startsAt' => ['required', 'date'],
            'endsAt' => ['required', 'date', 'after:startsAt'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
