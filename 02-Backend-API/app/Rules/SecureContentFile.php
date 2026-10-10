<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;
use Illuminate\Translation\PotentiallyTranslatedString;

class SecureContentFile implements ValidationRule
{
    public function __construct(
        private readonly string $declaredType,
    ) {}

    /**
     * Validate the server-detected type and the file's leading signature.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(
        string $attribute,
        mixed $value,
        Closure $fail,
    ): void {
        if (! $value instanceof UploadedFile || ! $value->isValid()) {
            $fail('The uploaded file is invalid.');

            return;
        }

        $extension = mb_strtolower($value->getClientOriginalExtension());
        $allowedExtensions = config("uploads.types.{$this->declaredType}", []);
        if (! in_array($extension, $allowedExtensions, true)) {
            $fail('The uploaded file does not match the selected content type.');

            return;
        }

        $detectedMime = $value->getMimeType() ?? 'application/octet-stream';
        $allowedMimes = config("uploads.mime_types.{$extension}", []);
        if (! in_array($detectedMime, $allowedMimes, true)) {
            $fail('The uploaded file type could not be verified.');

            return;
        }

        if (! $this->hasExpectedSignature($value, $extension)) {
            $fail('The uploaded file signature is invalid.');
        }
    }

    private function hasExpectedSignature(
        UploadedFile $file,
        string $extension,
    ): bool {
        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            return false;
        }

        try {
            $header = fread($handle, 16);
        } finally {
            fclose($handle);
        }

        if (! is_string($header)) {
            return false;
        }

        $hex = bin2hex($header);

        return match ($extension) {
            'pdf' => str_starts_with($header, '%PDF-'),
            'png' => str_starts_with($hex, '89504e470d0a1a0a'),
            'jpg', 'jpeg' => str_starts_with($hex, 'ffd8ff'),
            'webp' => str_starts_with($header, 'RIFF')
                && substr($header, 8, 4) === 'WEBP',
            'mp4' => substr($header, 4, 4) === 'ftyp',
            'webm' => str_starts_with($hex, '1a45dfa3'),
            'doc', 'ppt', 'xls' => str_starts_with($hex, 'd0cf11e0a1b11ae1'),
            'docx', 'pptx', 'xlsx' => str_starts_with($hex, '504b0304'),
            default => false,
        };
    }
}
