<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
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
        $categoryId = $this->route('category');

        return [
            'parentId' => ['nullable', 'uuid', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'nameAr' => ['required', 'string', 'max:120'],
            'slug' => [
                'nullable',
                'string',
                'alpha_dash:ascii',
                'max:120',
                Rule::unique('categories', 'slug')->ignore($categoryId),
            ],
            'active' => ['nullable', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
