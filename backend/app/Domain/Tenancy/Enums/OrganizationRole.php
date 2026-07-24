<?php

namespace App\Domain\Tenancy\Enums;

enum OrganizationRole: string
{
    case Owner = 'organization_owner';
    case Admin = 'organization_admin';
    case Instructor = 'instructor';
    case Staff = 'staff';
    case Student = 'student';
    case Guardian = 'guardian';
    case Member = 'member';
}
