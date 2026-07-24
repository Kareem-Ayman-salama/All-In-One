<?php

namespace App\Services\Marketplace;

use App\Models\Course;
use App\Models\CourseBatch;

class CoursePresenter
{
    /**
     * @return array<string, mixed>
     */
    public function present(Course $course, bool $detailed = false): array
    {
        $course->loadMissing(
            'academyProfile',
            'instructor',
            'category',
            'batches',
        );

        $payload = [
            'id' => $course->id,
            'organizationId' => $course->organization_id,
            'slug' => $course->slug,
            'title' => $course->title,
            'titleAr' => $course->title_ar,
            'shortDescription' => $course->short_description,
            'shortDescriptionAr' => $course->short_description_ar,
            'cover' => $course->cover_path,
            'educationLevel' => $course->education_level,
            'subject' => $course->subject,
            'deliveryType' => $course->delivery_type,
            'priceMinor' => $course->price_minor,
            'discountedPriceMinor' => $course->discounted_price_minor,
            'effectivePriceMinor' => $course->discounted_price_minor
                ?? $course->price_minor,
            'currency' => $course->currency,
            'status' => $course->status->value,
            'publishedAt' => $course->published_at,
            'academy' => $course->academyProfile ? [
                'id' => $course->academyProfile->id,
                'slug' => $course->academyProfile->slug,
                'name' => $course->academyProfile->public_name,
                'nameAr' => $course->academyProfile->public_name_ar,
                'verified' => $course->academyProfile->verification_status === 'verified',
            ] : null,
            'instructor' => $course->instructor ? [
                'id' => $course->instructor->id,
                'name' => $course->instructor->name,
                'nameAr' => $course->instructor->name_ar,
                'photo' => $course->instructor->photo_path,
            ] : null,
            'category' => $course->category ? [
                'id' => $course->category->id,
                'slug' => $course->category->slug,
                'name' => $course->category->name,
                'nameAr' => $course->category->name_ar,
            ] : null,
            'batches' => $course->batches->map(
                fn (CourseBatch $batch): array => [
                    'id' => $batch->id,
                    'title' => $batch->title,
                    'titleAr' => $batch->title_ar,
                    'startDate' => $batch->start_date,
                    'endDate' => $batch->end_date,
                    'schedule' => $batch->schedule,
                    'deliveryType' => $batch->delivery_type,
                    'capacity' => $batch->capacity,
                    'remainingSeats' => max(
                        0,
                        $batch->capacity
                            - $batch->reserved_seats
                            - $batch->confirmed_seats,
                    ),
                    'location' => $batch->location,
                    'status' => $batch->status->value,
                ],
            )->values(),
        ];

        if ($detailed) {
            $payload += [
                'description' => $course->description,
                'descriptionAr' => $course->description_ar,
                'learningOutcomes' => $course->learning_outcomes ?? [],
                'requirements' => $course->requirements ?? [],
                'duration' => $course->duration,
                'sessionsCount' => $course->sessions_count,
                'discountEndsAt' => $course->discount_ends_at,
                'moderationNote' => $course->moderation_note,
            ];
        }

        return $payload;
    }
}
