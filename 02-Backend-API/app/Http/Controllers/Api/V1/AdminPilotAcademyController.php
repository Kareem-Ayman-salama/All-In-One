<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Http\Controllers\Controller;
use App\Models\AcademyProfile;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Services\Operations\OperationRecorder;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminPilotAcademyController extends Controller
{
    /**
     * List all provisioned pilot academies and their resource usage.
     */
    public function index(Request $request): JsonResponse
    {
        $academies = Organization::query()
            ->where('type', 'academy')
            ->with(['academyProfile', 'subscriptions.plan'])
            ->withCount(['memberships', 'rooms', 'courses'])
            ->latest()
            ->paginate(25);

        return ApiResponse::success($request, $academies->items(), [
            'currentPage' => $academies->currentPage(),
            'lastPage' => $academies->lastPage(),
            'total' => $academies->total(),
        ]);
    }

    /**
     * Authoritative provisioning workflow for pilot organizations.
     * Automates tenant, profile, owner, plan subscription, and invitation generation.
     */
    public function store(Request $request, OperationRecorder $recorder): JsonResponse
    {
        $validated = $request->validate([
            'academyName' => ['required', 'string', 'min:3', 'max:150'],
            'ownerName' => ['required', 'string', 'min:3', 'max:100'],
            'ownerEmail' => ['required', 'email'],
            'ownerPassword' => ['nullable', 'string', 'min:8'],
            'planCode' => ['nullable', 'string', 'exists:plans,code'],
            'trialDays' => ['nullable', 'integer', 'min:1', 'max:365'],
            'studentLimit' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'roomLimit' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'storageMb' => ['nullable', 'integer', 'min:100', 'max:1000000'],
            'enabledFeatures' => ['nullable', 'array'],
            'enabledFeatures.*' => ['string'],
        ]);

        $trialDays = (int) ($validated['trialDays'] ?? 30);
        $planCode = $validated['planCode'] ?? 'pilot';

        $plan = Plan::query()->where('code', $planCode)->first();
        if (! $plan) {
            $plan = Plan::query()->where('code', 'growth')->firstOrFail();
        }

        $result = DB::transaction(function () use ($validated, $plan, $trialDays, $request, $recorder) {
            // 1. Generate Unique Slug
            $baseSlug = Str::slug($validated['academyName']);
            if (empty($baseSlug)) {
                $baseSlug = 'pilot-academy';
            }
            $slug = $baseSlug;
            $counter = 1;
            while (Organization::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$counter}";
                $counter++;
            }

            // 2. Create Organization
            $org = Organization::query()->create([
                'name' => $validated['academyName'],
                'slug' => $slug,
                'type' => 'academy',
                'status' => 'active',
                'settings' => [
                    'is_pilot' => true,
                    'pilot_provisioned_at' => now()->toIso8601String(),
                    'trial_days' => $trialDays,
                    'public_certificate_show_grade' => false,
                ],
            ]);

            // 3. Create Academy Profile
            $profile = AcademyProfile::query()->create([
                'organization_id' => $org->id,
                'slug' => $slug,
                'public_name' => $validated['academyName'],
                'description' => "Official pilot learning portal for {$validated['academyName']}.",
                'is_public' => true,
                'verification_status' => 'verified',
                'verified_at' => now(),
            ]);

            // 4. Find or Create Owner User
            $owner = User::query()->where('email', strtolower($validated['ownerEmail']))->first();
            $plainPassword = $validated['ownerPassword'] ?? 'Pilot@2026!';
            $isNewUser = false;
            if (! $owner) {
                $isNewUser = true;
                $owner = new User;
                $owner->forceFill([
                    'name' => $validated['ownerName'],
                    'email' => strtolower($validated['ownerEmail']),
                    'password' => Hash::make($plainPassword),
                    'status' => 'active',
                    'email_verified_at' => now(),
                ])->save();
            } else {
                $owner->forceFill([
                    'password' => Hash::make($plainPassword),
                    'status' => 'active',
                    'email_verified_at' => now(),
                ])->save();
            }

            // 5. Assign Owner Role Membership
            $ownerRole = Role::query()
                ->where('name', OrganizationRole::Owner->value)
                ->first();

            if (! $ownerRole) {
                $ownerRole = Role::query()->create([
                    'name' => OrganizationRole::Owner->value,
                    'scope' => 'organization',
                    'is_system' => true,
                ]);
            }

            OrganizationMembership::query()->updateOrCreate([
                'organization_id' => $org->id,
                'user_id' => $owner->id,
            ], [
                'role_id' => $ownerRole->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            // 6. Provision Subscription
            $subscription = OrganizationSubscription::query()->create([
                'organization_id' => $org->id,
                'plan_id' => $plan->id,
                'status' => 'active',
                'billing_interval' => 'monthly',
                'starts_at' => now(),
                'trial_ends_at' => now()->addDays($trialDays),
                'current_period_starts_at' => now(),
                'current_period_ends_at' => now()->addDays($trialDays),
            ]);

            // 7. Generate Onboarding Invitation Token
            $token = Str::random(48);
            $inviterId = $request->user()?->id ?? $owner->id;
            $invitation = WorkspaceInvitation::query()->create([
                'organization_id' => $org->id,
                'role_id' => $ownerRole->id,
                'invited_by' => $inviterId,
                'email' => $owner->email,
                'normalized_email' => strtolower($owner->email),
                'token_hash' => hash('sha256', $token),
                'status' => 'pending',
                'expires_at' => now()->addDays(14),
            ]);

            // 8. Audit Log
            $recorder->record(
                'pilot.academy.provisioned',
                'organization',
                $org->id,
                $org->id,
                $request->user()?->id ?? $owner->id,
                [
                    'academyName' => $org->name,
                    'ownerEmail' => $owner->email,
                    'planCode' => $plan->code,
                    'trialDays' => $trialDays,
                ],
                ['invitationToken' => $token],
                $request,
            );

            return [
                'organization' => $org,
                'profile' => $profile,
                'owner' => $owner,
                'isNewUser' => $isNewUser,
                'subscription' => $subscription,
                'invitationToken' => $token,
                'onboardingUrl' => config('aio.frontend_url', 'http://localhost:5173')."/invitations/accept?token={$token}",
            ];
        });

        return ApiResponse::success($request, $result, status: 201);
    }

    /**
     * List all system plans and their limits for Super Admin inspection and tuning.
     */
    public function plans(Request $request): JsonResponse
    {
        $plans = Plan::query()->with('modules')->get();

        return ApiResponse::success($request, $plans);
    }

    /**
     * Update plan parameters and module limits.
     */
    public function updatePlan(Request $request, string $planId): JsonResponse
    {
        $plan = Plan::query()->findOrFail($planId);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
            'monthlyPriceMinor' => ['nullable', 'integer', 'min:0'],
            'yearlyPriceMinor' => ['nullable', 'integer', 'min:0'],
            'active' => ['nullable', 'boolean'],
            'modules' => ['nullable', 'array'],
            'modules.*.module' => ['required_with:modules', 'string'],
            'modules.*.enabled' => ['required_with:modules', 'boolean'],
            'modules.*.limitValue' => ['nullable', 'integer'],
        ]);

        if (isset($validated['name'])) {
            $plan->name = $validated['name'];
        }
        if (isset($validated['monthlyPriceMinor'])) {
            $plan->monthly_price_minor = $validated['monthlyPriceMinor'];
        }
        if (isset($validated['yearlyPriceMinor'])) {
            $plan->yearly_price_minor = $validated['yearlyPriceMinor'];
        }
        if (isset($validated['active'])) {
            $plan->active = $validated['active'];
        }
        $plan->save();

        if (! empty($validated['modules'])) {
            foreach ($validated['modules'] as $mod) {
                $plan->modules()->updateOrCreate([
                    'module' => $mod['module'],
                ], [
                    'enabled' => $mod['enabled'],
                    'limit_value' => $mod['limitValue'] ?? null,
                ]);
            }
        }

        return ApiResponse::success($request, $plan->fresh()->load('modules'));
    }

    /**
     * Direct operational tool for Super Admin to set or reset a Pilot Academy Owner's password.
     */
    public function setOwnerPassword(Request $request, string $organization): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $org = Organization::query()->findOrFail($organization);
        $ownerMembership = $org->memberships()
            ->whereHas('role', fn ($r) => $r->where('name', OrganizationRole::Owner->value))
            ->firstOrFail();

        $owner = $ownerMembership->user;
        $owner->forceFill([
            'password' => Hash::make($validated['password']),
            'status' => 'active',
            'email_verified_at' => now(),
        ])->save();

        return ApiResponse::success($request, [
            'ownerEmail' => $owner->email,
            'passwordUpdated' => true,
        ]);
    }

    /**
     * Operational tool for Super Admin to provision and verify pilot student accounts.
     */
    public function provisionStudent(Request $request, string $organization): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $org = Organization::query()->findOrFail($organization);
        $user = User::query()->where('normalized_email', strtolower($validated['email']))->first();
        if (! $user) {
            $user = new User([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);
        } else {
            $user->name = $validated['name'];
            $user->password = Hash::make($validated['password']);
        }
        $user->forceFill([
            'email_verified_at' => now(),
            'status' => 'active',
        ])->save();

        return ApiResponse::success($request, [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'emailVerified' => true,
        ], status: 201);
    }
}
