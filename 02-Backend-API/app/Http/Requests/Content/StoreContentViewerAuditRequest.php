<?php

namespace App\Http\Requests\Content;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContentViewerAuditRequest extends FormRequest
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
            'event' => [
                'required',
                'string',
                Rule::in([
                    'opened',
                    'closed',
                    'failed',
                    'screenshot_warning',
                    'screen_capture_started',
                    'screen_capture_stopped',
                    'download_blocked',
                    'right_click_blocked',
                    'shortcut_blocked',
                    'watermark_rendered',
                ]),
            ],
            'result' => [
                'sometimes',
                'string',
                Rule::in(['allowed', 'blocked', 'failed', 'warning']),
            ],
            'viewerSessionId' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'positionSeconds' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'message' => ['nullable', 'string', 'max:300'],
        ];
    }
}
