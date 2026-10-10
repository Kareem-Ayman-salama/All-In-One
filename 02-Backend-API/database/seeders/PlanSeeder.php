<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            'starter' => [
                'name' => 'Starter',
                'monthly_price_minor' => 50000,
                'yearly_price_minor' => 480000,
                'modules' => [
                    'rooms' => 3,
                    'members' => 100,
                    'admins' => 2,
                    'storage_bytes' => 2147483648,
                    'content' => 50,
                    'announcements' => null,
                    'calendar' => null,
                    'subscriptions' => null,
                ],
            ],
            'growth' => [
                'name' => 'Growth',
                'monthly_price_minor' => 120000,
                'yearly_price_minor' => 1152000,
                'modules' => [
                    'rooms' => 10,
                    'members' => 500,
                    'admins' => 10,
                    'storage_bytes' => 21474836480,
                    'content' => 300,
                    'announcements' => null,
                    'calendar' => null,
                    'subscriptions' => null,
                    'courses' => 20,
                    'batches' => null,
                    'bookings' => 1000,
                    'attendance' => null,
                    'analytics' => null,
                    'promotions' => null,
                ],
            ],
            'pro' => [
                'name' => 'Pro',
                'monthly_price_minor' => 250000,
                'yearly_price_minor' => 2400000,
                'modules' => [
                    'rooms' => null,
                    'members' => 5000,
                    'admins' => 50,
                    'storage_bytes' => 107374182400,
                    'content' => null,
                    'announcements' => null,
                    'calendar' => null,
                    'subscriptions' => null,
                    'courses' => null,
                    'batches' => null,
                    'bookings' => null,
                    'attendance' => null,
                    'exams' => null,
                    'payments' => null,
                    'analytics' => null,
                    'promotions' => null,
                    'live_sessions' => null,
                ],
            ],
            'enterprise' => [
                'name' => 'Enterprise',
                'monthly_price_minor' => 0,
                'yearly_price_minor' => 0,
                'modules' => [
                    'rooms' => null,
                    'members' => null,
                    'admins' => null,
                    'storage_bytes' => null,
                    'content' => null,
                    'announcements' => null,
                    'calendar' => null,
                    'subscriptions' => null,
                    'courses' => null,
                    'batches' => null,
                    'bookings' => null,
                    'attendance' => null,
                    'exams' => null,
                    'payments' => null,
                    'analytics' => null,
                    'promotions' => null,
                    'live_sessions' => null,
                    'ai_assistant' => null,
                ],
            ],
        ];

        foreach ($plans as $code => $definition) {
            $plan = Plan::query()->updateOrCreate([
                'code' => $code,
            ], [
                'name' => $definition['name'],
                'monthly_price_minor' => $definition['monthly_price_minor'],
                'yearly_price_minor' => $definition['yearly_price_minor'],
                'currency' => 'EGP',
                'active' => true,
            ]);

            foreach ($definition['modules'] as $module => $limit) {
                $plan->modules()->updateOrCreate([
                    'module' => $module,
                ], [
                    'enabled' => true,
                    'limit_value' => $limit,
                ]);
            }
        }
    }
}
