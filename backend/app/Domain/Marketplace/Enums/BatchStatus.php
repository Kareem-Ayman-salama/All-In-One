<?php

namespace App\Domain\Marketplace\Enums;

enum BatchStatus: string
{
    case Draft = 'draft';
    case Open = 'open';
    case Full = 'full';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
