<?php

namespace App\Http\Requests\Content;

use App\Rules\SecureContentFile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContentRequest extends FormRequest
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
        $contentType = (string) $this->input('type', 'file');

        return [
            'roomId' => [
                'required',
                'uuid',
                Rule::exists('rooms', 'id')->where(
                    fn ($query) => $query
                        ->where('organization_id', $organizationId)
                        ->whereNull('deleted_at'),
                ),
            ],
            'title' => ['required', 'string', 'min:2', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'type' => [
                'required',
                Rule::in(['file', 'pdf', 'image', 'video', 'link']),
            ],
            'file' => [
                'required_unless:type,link',
                'file',
                'max:'.config('uploads.max_kilobytes'),
                new SecureContentFile($contentType),
            ],
            'externalUrl' => ['required_if:type,link', 'nullable', 'url:http,https', 'max:2048'],
            'downloadAllowed' => ['nullable', 'boolean'],
            'watermarkEnabled' => ['nullable', 'boolean'],
            'availableFrom' => ['nullable', 'date'],
            'availableUntil' => ['nullable', 'date', 'after:availableFrom'],
            'status' => ['nullable', Rule::in(['draft', 'published', 'archived'])],
        ];
    }
}
