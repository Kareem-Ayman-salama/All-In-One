<?php

namespace App\Domain\Bookings\Enums;

enum BookingStatus: string
{
    case PendingConfirmation = 'pending_confirmation';
    case Confirmed = 'confirmed';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    case Completed = 'completed';
}
