<?php

namespace App\Domain\Authorization\Enums;

enum PermissionName: string
{
    case PlatformOrganizationsView = 'platform.organizations.view';
    case PlatformOrganizationsManage = 'platform.organizations.manage';
    case PlatformAcademiesVerify = 'platform.academies.verify';
    case PlatformCoursesModerate = 'platform.courses.moderate';
    case PlatformPromotionsModerate = 'platform.promotions.moderate';
    case PlatformPlansManage = 'platform.plans.manage';
    case PlatformPaymentsView = 'platform.payments.view';
    case PlatformSupportManage = 'platform.support.manage';
    case PlatformAuditView = 'platform.audit.view';
    case OrganizationView = 'organization.view';
    case OrganizationUpdate = 'organization.update';
    case OrganizationManageBranding = 'organization.manage_branding';
    case OrganizationManageBilling = 'organization.manage_billing';
    case MembersView = 'members.view';
    case MembersInvite = 'members.invite';
    case MembersUpdate = 'members.update';
    case MembersRemove = 'members.remove';
    case RolesView = 'roles.view';
    case RolesManage = 'roles.manage';
    case RoomsView = 'rooms.view';
    case RoomsCreate = 'rooms.create';
    case RoomsUpdate = 'rooms.update';
    case RoomsDelete = 'rooms.delete';
    case ContentView = 'content.view';
    case ContentCreate = 'content.create';
    case ContentUpdate = 'content.update';
    case ContentDelete = 'content.delete';
    case AnnouncementsView = 'announcements.view';
    case AnnouncementsCreate = 'announcements.create';
    case EventsView = 'events.view';
    case EventsManage = 'events.manage';
    case CoursesView = 'courses.view';
    case CoursesCreate = 'courses.create';
    case CoursesUpdate = 'courses.update';
    case CoursesPublish = 'courses.publish';
    case CoursesArchive = 'courses.archive';
    case BatchesView = 'batches.view';
    case BatchesManage = 'batches.manage';
    case BookingsView = 'bookings.view';
    case BookingsManage = 'bookings.manage';
    case BookingsConfirm = 'bookings.confirm';
    case BookingsCancel = 'bookings.cancel';
    case EnrollmentsView = 'enrollments.view';
    case EnrollmentsManage = 'enrollments.manage';
    case SubscriptionsView = 'subscriptions.view';
    case SubscriptionsManage = 'subscriptions.manage';
    case PromotionsView = 'promotions.view';
    case PromotionsManage = 'promotions.manage';
    case AnalyticsView = 'analytics.view';
    case AuditView = 'audit.view';
    case AttendanceView = 'attendance.view';
    case AttendanceManage = 'attendance.manage';
    case GuardiansView = 'guardians.view';
    case GuardiansManage = 'guardians.manage';
    case ReportsExport = 'reports.export';
}
