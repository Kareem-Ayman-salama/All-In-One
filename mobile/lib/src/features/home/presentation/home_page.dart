import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:ain_mobile/src/features/notifications/presentation/notification_inbox_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_announcements_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_bookings_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_content_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_courses_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_events_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_invitations_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_members_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_profile_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_rooms_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_tasks_page.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  static const routePath = '/home';

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(strings.appName)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              strings.today,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                title: Text(strings.mobileFoundationReady),
                subtitle: Text(strings.repositoryWiringNext),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.business),
                title: Text(strings.organizationProfile),
                subtitle: Text(strings.organizationProfileHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationProfilePage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.school),
                title: Text(strings.exploreCourses),
                subtitle: Text(strings.findCoursesHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(CourseCatalogPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.notifications),
                title: Text(strings.notifications),
                subtitle: Text(strings.notificationsHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(NotificationInboxPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.campaign),
                title: Text(strings.organizationAnnouncements),
                subtitle: Text(strings.organizationAnnouncementsHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () =>
                    context.go(OrganizationAnnouncementsPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.receipt_long),
                title: Text(strings.organizationBookings),
                subtitle: Text(strings.organizationBookingsHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationBookingsPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.folder_copy),
                title: Text(strings.organizationContent),
                subtitle: Text(strings.organizationContentHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationContentPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.dashboard_customize),
                title: Text(strings.organizationCourses),
                subtitle: Text(strings.organizationCoursesHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationCoursesPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.event_available),
                title: Text(strings.organizationEvents),
                subtitle: Text(strings.organizationEventsHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationEventsPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.groups),
                title: Text(strings.organizationMembers),
                subtitle: Text(strings.organizationMembersHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationMembersPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.group_add),
                title: Text(strings.organizationInvitations),
                subtitle: Text(strings.organizationInvitationsHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationInvitationsPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.task_alt),
                title: Text(strings.organizationTasks),
                subtitle: Text(strings.organizationTasksHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationTasksPage.routePath),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.meeting_room),
                title: Text(strings.organizationRooms),
                subtitle: Text(strings.organizationRoomsHint),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go(OrganizationRoomsPage.routePath),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
