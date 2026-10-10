<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'locale', 'timezone', 'date_of_birth', 'is_minor'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasUuids, Notifiable, SoftDeletes;

    public function memberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    public function organizationMemberships(): HasMany
    {
        return $this->hasMany(OrganizationMembership::class);
    }

    public function belongsToOrganization(string $organizationId): bool
    {
        return $this->memberships()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->exists();
    }

    public function hasRole(string|array $roles, ?string $organizationId = null): bool
    {
        $roles = (array) $roles;

        // 1. Check platform role first (e.g. super_admin)
        if (! empty($this->platform_role) && in_array($this->platform_role, $roles, true)) {
            return true;
        }

        // If checking specifically for super_admin and platform_role is not super_admin
        if (in_array('super_admin', $roles, true) && count($roles) === 1 && $organizationId === null) {
            return $this->platform_role === 'super_admin';
        }

        // 2. Check organization membership roles
        $query = $this->memberships()
            ->where('status', 'active')
            ->whereHas('role', function ($q) use ($roles) {
                $q->whereIn('name', $roles);
            });

        if ($organizationId !== null) {
            $query->where('organization_id', $organizationId);
        }

        return $query->exists();
    }

    public function isSuperAdmin(): bool
    {
        return $this->platform_role === 'super_admin';
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(UserSession::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    public function pushDeviceTokens(): HasMany
    {
        return $this->hasMany(PushDeviceToken::class);
    }

    public function guardianLinks(): HasMany
    {
        return $this->hasMany(GuardianStudentLink::class, 'guardian_id');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'student_id');
    }

    public function guardianConsentsGiven(): HasMany
    {
        return $this->hasMany(GuardianConsent::class, 'guardian_id');
    }

    public function guardianConsentsReceived(): HasMany
    {
        return $this->hasMany(GuardianConsent::class, 'student_id');
    }

    public function isMinor(): bool
    {
        if ($this->is_minor) {
            return true;
        }

        if ($this->date_of_birth) {
            return $this->date_of_birth->age < 18;
        }

        return false;
    }

    public function setEmailAttribute(string $value): void
    {
        $normalized = mb_strtolower(trim($value));
        $this->attributes['email'] = $normalized;
        $this->attributes['normalized_email'] = $normalized;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'date_of_birth' => 'date',
            'is_minor' => 'boolean',
        ];
    }
}
