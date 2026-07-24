<?php

namespace App\Domain\Identity\Enums;

enum PlatformRole: string
{
    case SuperAdmin = 'super_admin';
    case PlatformSupport = 'platform_support';
    case PlatformModerator = 'platform_moderator';
}
