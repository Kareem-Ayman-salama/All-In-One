<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkAttendanceRequest extends FormRequest
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
            'records' => ['required', 'array', 'min:1', 'max:250'],
            'records.*.studentId' => ['required', 'uuid', 'distinct'],
            'records.*.status' => [
                'required',
                Rule::in(['present', 'absent', 'late', 'excused']),
            ],
            'records.*.minutesLate' => ['nullable', 'integer', 'min:0', 'max:600'],
            'records.*.excuseReason' => ['nullable', 'string', 'max:1000'],
            'records.*.instructorNote' => ['nullable', 'string', 'max:2000'],
            'records.*.guardianVisible' => ['nullable', 'boolean'],
        ];
    }
}
