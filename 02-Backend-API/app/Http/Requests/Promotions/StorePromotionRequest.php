<?php

namespace App\Http\Requests\Promotions;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePromotionRequest extends FormRequest
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
                'nullable',
                'uuid',
                Rule::exists('courses', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->where('status', 'published')
                        ->whereNull('deleted_at'),
                ),
            ],
            'type' => [
                'required',
                Rule::in([
                    'featured_course',
                    'featured_academy',
                    'homepage_banner',
                    'category_banner',
                    'search_boost',
                ]),
            ],
            'placement' => [
                'required',
                Rule::in(['homepage', 'courses', 'academies', 'category', 'search']),
            ],
            'startDate' => ['required', 'date', 'after_or_equal:today'],
            'endDate' => ['required', 'date', 'after_or_equal:startDate'],
            'destinationUrl' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
