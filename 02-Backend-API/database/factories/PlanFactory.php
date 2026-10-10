<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->words(2, true).' Plan';

        return [
            'code' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'name' => $name,
            'monthly_price_minor' => 10000,
            'yearly_price_minor' => 100000,
            'currency' => 'EGP',
            'active' => true,
        ];
    }
}
