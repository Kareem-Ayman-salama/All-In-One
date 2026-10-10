<?php

namespace App\Services\Guardians;

use App\Exceptions\ApiException;
use App\Models\GuardianConsent;
use App\Models\GuardianStudentLink;
use App\Models\User;
use App\Services\Auth\VerificationCodeService;
use App\Services\Operations\OperationRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GuardianConsentService
{
    public const DEFAULT_TERMS_VERSION = 'v1.0-2026';

    public const DEFAULT_TERMS_CONTENT = <<<'TEXT'
AIN Platform Minor Protection & Guardian Consent Agreement (v1.0):
By approving this consent, the parent or legal guardian authorizes the designated minor student to access educational materials, participate in moderated room discussions, and complete assignments. The guardian retains the right to review academic progress, audit security records, and revoke this consent at any time. Unapproved commercial transactions and unmoderated communications remain restricted until explicit parental authorization is granted and verified.
TEXT;

    public function __construct(
        protected VerificationCodeService $verificationCodes,
        protected OperationRecorder $recorder,
    ) {}

    public function isConsentRequiredForUser(User $student, ?string $organizationId = null): bool
    {
        return $student->isMinor();
    }

    public function hasActiveConsent(User $student, ?string $organizationId = null): bool
    {
        if (! $this->isConsentRequiredForUser($student, $organizationId)) {
            return true;
        }

        $query = GuardianConsent::query()
            ->where('student_id', $student->id)
            ->active();

        if ($organizationId) {
            $query->where(function ($q) use ($organizationId): void {
                $q->whereNull('organization_id')
                    ->orWhere('organization_id', $organizationId);
            });
        }

        return $query->exists();
    }

    public function assertActionAllowed(User $student, string $action, ?string $organizationId = null): void
    {
        if (! $this->hasActiveConsent($student, $organizationId)) {
            throw new ApiException(
                'GUARDIAN_CONSENT_REQUIRED',
                "Guardian consent is required for this minor account before you can {$action}.",
                403,
            );
        }
    }

    public function getActiveConsent(User $student, ?string $organizationId = null): ?GuardianConsent
    {
        $query = GuardianConsent::query()
            ->with(['guardian:id,name,email', 'organization:id,name'])
            ->where('student_id', $student->id)
            ->active()
            ->latest('consented_at');

        if ($organizationId) {
            $query->where(function ($q) use ($organizationId): void {
                $q->whereNull('organization_id')
                    ->orWhere('organization_id', $organizationId);
            });
        }

        return $query->first();
    }

    public function requestConsent(
        User $guardian,
        User $student,
        ?string $organizationId = null,
        string $termsVersion = self::DEFAULT_TERMS_VERSION,
        ?string $termsContent = null,
        string $verificationMethod = 'otp',
        ?Request $request = null,
    ): array {
        if ($guardian->id === $student->id) {
            throw new ApiException(
                'GUARDIAN_STUDENT_CONFLICT',
                'A student cannot be their own guardian.',
                422,
            );
        }

        $link = GuardianStudentLink::query()
            ->where('guardian_id', $guardian->id)
            ->where('student_id', $student->id)
            ->when($organizationId, fn ($q) => $q->where('organization_id', $organizationId))
            ->first();

        $contentToAgree = $termsContent ?: self::DEFAULT_TERMS_CONTENT;
        $contentHash = hash('sha256', $contentToAgree);

        $consent = DB::transaction(function () use (
            $guardian,
            $student,
            $organizationId,
            $link,
            $termsVersion,
            $contentHash,
            $contentToAgree,
            $verificationMethod,
            $request,
        ): GuardianConsent {
            // Cancel any pending consent requests for this student-guardian pair
            GuardianConsent::query()
                ->where('guardian_id', $guardian->id)
                ->where('student_id', $student->id)
                ->where('status', 'pending')
                ->update(['status' => 'expired']);

            return GuardianConsent::query()->create([
                'organization_id' => $organizationId,
                'guardian_id' => $guardian->id,
                'student_id' => $student->id,
                'guardian_student_link_id' => $link?->id,
                'status' => 'pending',
                'terms_version' => $termsVersion,
                'terms_content_hash' => $contentHash,
                'terms_content_snapshot' => $contentToAgree,
                'verification_method' => $verificationMethod,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
            ]);
        });

        // Issue OTP for verification
        $otpCode = $this->verificationCodes->issue($guardian, 'guardian_consent');

        $this->recorder->record(
            'guardian.consent_requested',
            'guardian_consent',
            $consent->id,
            $organizationId ?? $link?->organization_id,
            $guardian->id,
            [
                'studentId' => $student->id,
                'guardianId' => $guardian->id,
                'termsVersion' => $termsVersion,
            ],
            ['consentId' => $consent->id],
            $request,
        );

        return [
            'consent' => $consent->load('guardian:id,name,email', 'student:id,name,email'),
            'otpSent' => true,
            'expiresInMinutes' => 15,
            'code' => app()->environment('local', 'testing') ? $otpCode : null,
        ];
    }

    public function verifyConsentWithOtp(
        User $guardian,
        string $consentId,
        string $otpCode,
        ?Request $request = null,
    ): GuardianConsent {
        $consent = GuardianConsent::query()
            ->where('id', $consentId)
            ->where('guardian_id', $guardian->id)
            ->firstOrFail();

        if ($consent->status !== 'pending') {
            throw new ApiException(
                'BOOKING_INVALID_STATE',
                'This consent request is not pending verification.',
                409,
            );
        }

        // Consume OTP
        $this->verificationCodes->consume($guardian->email, 'guardian_consent', $otpCode);

        $consent->update([
            'status' => 'approved',
            'consented_at' => now(),
            'expires_at' => now()->addYear(),
            'verification_reference' => 'otp_verified',
            'ip_address' => $request?->ip() ?? $consent->ip_address,
            'user_agent' => $request?->userAgent() ?? $consent->user_agent,
        ]);

        $this->recorder->record(
            'guardian.consent_approved',
            'guardian_consent',
            $consent->id,
            $consent->organization_id,
            $guardian->id,
            [
                'studentId' => $consent->student_id,
                'guardianId' => $guardian->id,
                'termsVersion' => $consent->terms_version,
                'expiresAt' => $consent->expires_at->toIso8601String(),
            ],
            ['consentId' => $consent->id],
            $request,
        );

        return $consent->fresh(['guardian:id,name,email', 'student:id,name,email']);
    }

    public function revokeConsent(
        User $guardian,
        string $consentId,
        string $reason,
        ?Request $request = null,
    ): GuardianConsent {
        $consent = GuardianConsent::query()
            ->where('id', $consentId)
            ->where('guardian_id', $guardian->id)
            ->firstOrFail();

        if ($consent->status === 'revoked') {
            return $consent;
        }

        $consent->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revocation_reason' => $reason,
        ]);

        $this->recorder->record(
            'guardian.consent_revoked',
            'guardian_consent',
            $consent->id,
            $consent->organization_id,
            $guardian->id,
            [
                'studentId' => $consent->student_id,
                'guardianId' => $guardian->id,
                'reason' => $reason,
            ],
            ['consentId' => $consent->id],
            $request,
        );

        return $consent->fresh(['guardian:id,name,email', 'student:id,name,email']);
    }

    public function renewConsent(
        User $guardian,
        string $consentId,
        ?Request $request = null,
    ): array {
        $existing = GuardianConsent::query()
            ->where('id', $consentId)
            ->where('guardian_id', $guardian->id)
            ->firstOrFail();

        $student = User::query()->findOrFail($existing->student_id);

        return $this->requestConsent(
            guardian: $guardian,
            student: $student,
            organizationId: $existing->organization_id,
            termsVersion: $existing->terms_version,
            termsContent: $existing->terms_content_snapshot,
            verificationMethod: 'otp',
            request: $request,
        );
    }
}
