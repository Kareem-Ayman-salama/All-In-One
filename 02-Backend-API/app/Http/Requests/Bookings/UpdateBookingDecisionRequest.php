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
            'notes' => ['nullable', 'string', 'max:3000'],
            'markAsPaid' => ['nullable', 'boolean'],
            'paymentMethod' => ['nullable', 'string', 'in:cash,instapay,bank_transfer,scholarship,free,other'],
            'paymentReference' => ['nullable', 'string', 'max:255'],
            'paymentDate' => ['nullable', 'date'],
            'paymentAmount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
