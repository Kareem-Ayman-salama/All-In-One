<?php

namespace App\Http\Requests\Bookings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingDecisionRequest extends FormRequest
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
            'internalNote' => ['nullable', 'string', 'max:3000'],
            'markAsPaid' => ['nullable', 'boolean'],
        ];
    }
}
