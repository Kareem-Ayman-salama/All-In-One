<?php

namespace Database\Factories;

use App\Domain\Marketplace\Enums\CourseStatus;
use App\Models\Course;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    protected $model = Course::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->sentence(3);

        return [
            'organization_id' => Organization::factory(),
            'created_by' => User::factory(),
            'title' => $title,
            'title_ar' => 'دورة تعليمية تجريبية',
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'short_description' => fake()->sentence(10),
            'description' => fake()->paragraph(),
            'delivery_type' => 'online',
            'price_minor' => 50000,
            'currency' => 'EGP',
            'status' => CourseStatus::Published,
            'published_at' => now(),
        ];
    }
}
