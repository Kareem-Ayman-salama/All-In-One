<?php

namespace App\Http\Requests\Providers;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProviderApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->email_verified_at !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'providerType' => [
                'required',
                Rule::in(['independent_instructor']),
            ],
            'displayName' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'regex:/^[0-9+()\-\s]{8,30}$/'],
            'specialty' => ['required', 'string', 'min:2', 'max:160'],
            'yearsExperience' => ['required', 'integer', 'min:0', 'max:80'],
            'bio' => ['required', 'string', 'min:40', 'max:3000'],
            'qualifications' => ['nullable', 'string', 'max:3000'],
            'portfolioUrl' => ['nullable', 'url:http,https', 'max:2048'],
            'sampleCourseTitle' => ['required', 'string', 'min:3', 'max:180'],
            'sampleCourseDescription' => ['nullable', 'string', 'max:3000'],
            'identityDocument' => [
                Rule::requiredIf(fn (): bool => ! $this->hasExistingDocument('identity')),
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
            'qualificationDocument' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
        ];
    }

    private function hasExistingDocument(string $type): bool
    {
        return $this->user()?->providerApplications()
            ->where('provider_type', 'independent_instructor')
            ->whereHas('documents', fn ($query) => $query->where('type', $type))
            ->exists() ?? false;
    }
}
