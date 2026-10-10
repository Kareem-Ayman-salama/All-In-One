<?php

namespace App\Http\Requests\Bookings;

use Illuminate\Foundation\Http\FormRequest;

class CreateBookingRequest extends FormRequest
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
            'courseId' => ['required', 'uuid', 'exists:courses,id'],
            'batchId' => ['required', 'uuid', 'exists:course_batches,id'],
            'studentName' => ['required', 'string', 'min:2', 'max:160'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['required', 'string', 'min:7', 'max:40'],
            'note' => ['nullable', 'string', 'max:2000'],
            'termsAccepted' => ['accepted'],
            'idempotencyKey' => ['nullable', 'string', 'min:16', 'max:100'],
        ];
    }
}
