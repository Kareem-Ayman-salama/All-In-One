<?php

namespace App\Services\Organizations;

use App\Domain\Tenancy\Enums\OrganizationRole;
use App\Models\Organization;
use App\Models\OrganizationMembership;
use App\Models\OrganizationSubscription;
use App\Models\Plan;
use App\Models\Role;
use App\Models\User;
use App\Services\Operations\OperationRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrganizationService
{
    public function __construct(
        private readonly OperationRecorder $recorder,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(
        User $owner,
        array $attributes,
        ?Request $request = null,
    ): Organization {
        return DB::transaction(function () use ($owner, $attributes, $request): Organization {
            $organization = Organization::query()->create([
                'name' => $attributes['name'],
                'slug' => $this->uniqueSlug(
                    $attributes['slug'] ?? $attributes['name'],
                ),
                'type' => $attributes['type'],
                'status' => 'active',
                'bio' => $attributes['bio'] ?? null,
                'brand_color' => $attributes['brandColor'] ?? '#16458F',
                'locale' => $attributes['locale'] ?? 'ar',
                'timezone' => $attributes['timezone'] ?? 'Africa/Cairo',
                'settings' => [],
            ]);

            $ownerRole = Role::query()
                ->whereNull('organization_id')
                ->where('name', OrganizationRole::Owner->value)
                ->firstOrFail();

            OrganizationMembership::query()->create([
                'organization_id' => $organization->id,
                'user_id' => $owner->id,
                'role_id' => $ownerRole->id,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            $planCode = $attributes['planCode']
                ?? ($organization->type === 'company' ? 'starter' : 'growth');
            $plan = Plan::query()
                ->where('code', $planCode)
                ->where('active', true)
                ->firstOrFail();

            OrganizationSubscription::query()->create([
                'organization_id' => $organization->id,
                'plan_id' => $plan->id,
                'status' => 'trial',
                'billing_interval' => 'monthly',
                'trial_ends_at' => now()->addDays(14),
                'current_period_starts_at' => now(),
                'current_period_ends_at' => now()->addDays(14),
            ]);

            $this->recorder->record(
                'organization.created',
                'organization',
                $organization->id,
                $organization->id,
                $owner->id,
                ['plan' => $plan->code, 'type' => $organization->type],
                ['organizationId' => $organization->id],
                $request,
            );

            return $organization->load([
                'subscriptions' => fn ($query) => $query
                    ->with('plan.modules')
                    ->latest('current_period_ends_at'),
            ]);
        });
    }

    private function uniqueSlug(string $value): string
    {
        $base = Str::slug($value) ?: 'workspace';
        $slug = $base;
        $suffix = 2;

        while (Organization::withTrashed()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
