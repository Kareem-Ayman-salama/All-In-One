<?php

namespace App\Http\Requests\Courses;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
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
            'title' => ['required', 'string', 'min:3', 'max:200'],
            'titleAr' => ['nullable', 'string', 'max:200'],
            'shortDescription' => ['nullable', 'string', 'max:500'],
            'shortDescriptionAr' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:50000'],
            'descriptionAr' => ['nullable', 'string', 'max:50000'],
            'instructorId' => [
                'nullable',
                'uuid',
                Rule::exists('instructors', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->where('status', 'active'),
                ),
            ],
            'categoryId' => [
                'nullable',
                'uuid',
                Rule::exists('categories', 'id')->where('active', true),
            ],
            'educationLevel' => ['nullable', 'string', 'max:100'],
            'subject' => ['nullable', 'string', 'max:100'],
            'deliveryType' => [
                'required',
                Rule::in(['online', 'offline', 'hybrid', 'recorded']),
            ],
            'priceMinor' => ['required', 'integer', 'min:0', 'max:999999999'],
            'discountedPriceMinor' => [
                'nullable',
                'integer',
                'min:0',
                'lte:priceMinor',
            ],
            'currency' => ['nullable', 'string', 'size:3'],
            'discountEndsAt' => ['nullable', 'date', 'after:now'],
            'learningOutcomes' => ['nullable', 'array', 'max:50'],
            'learningOutcomes.*' => ['string', 'max:500'],
            'requirements' => ['nullable', 'array', 'max:50'],
            'requirements.*' => ['string', 'max:500'],
            'duration' => ['nullable', 'string', 'max:100'],
            'sessionsCount' => ['nullable', 'integer', 'min:1', 'max:1000'],
        ];
    }
}
