<?php

namespace App\Domain\Marketplace\Enums;

enum CourseStatus: string
{
    case Draft = 'draft';
    case PendingReview = 'pending_review';
    case Published = 'published';
    case Rejected = 'rejected';
    case Unpublished = 'unpublished';
    case Completed = 'completed';
    case Archived = 'archived';
}
