import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_booking_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_content_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_course_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_event_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_member_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_task_controller.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_analytics_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_attendance_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_bookings_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_content_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_courses_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_events_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_instructors_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_invitations_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_members_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_profile_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_promotions_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_rooms_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_tasks_page.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/subscription_status_banner.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationOverviewPage extends ConsumerWidget {
  const OrganizationOverviewPage({super.key});

  static const routePath = '/organization/overview';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationOverview)),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            return RefreshIndicator(
              onRefresh: () async {
                await ref
                    .read(activeWorkspaceControllerProvider.notifier)
                    .refreshContext();
                ref.invalidate(
                  organizationCoursesOverviewProvider(
                    workspace.organizationId,
                  ),
                );
                ref.invalidate(
                  organizationBookingsProvider(workspace.organizationId),
                );
                ref.invalidate(
                  organizationMembersProvider(workspace.organizationId),
                );
                ref.invalidate(
                  organizationContentProvider(workspace.organizationId),
                );
                ref.invalidate(
                  organizationEventsProvider(
                    OrganizationEventsRequest(
                      organizationId: workspace.organizationId,
                    ),
                  ),
                );
                ref.invalidate(
                  organizationTasksProvider(workspace.organizationId),
                );
              },
              child: _OverviewBody(workspace: workspace),
            );
          },
          error: (error, stackTrace) => ListView(
            padding: const EdgeInsets.all(AinSpacing.lg),
            children: [
              AinEmptyState(
                icon: Icons.cloud_off_outlined,
                title: error.toString(),
              ),
            ],
          ),
          loading: () => Center(
            child: Semantics(
              label: strings.loading,
              child: const CircularProgressIndicator(),
            ),
          ),
        ),
      ),
    );
  }
}

class _OverviewBody extends ConsumerWidget {
  const _OverviewBody({required this.workspace});

  final ActiveWorkspace workspace;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final organizationId = workspace.organizationId;
    final courses = ref.watch(
      organizationCoursesOverviewProvider(organizationId),
    );
    final bookings = ref.watch(organizationBookingsProvider(organizationId));
    final members = ref.watch(organizationMembersProvider(organizationId));
    final content = ref.watch(organizationContentProvider(organizationId));
    final events = ref.watch(
      organizationEventsProvider(
        OrganizationEventsRequest(organizationId: organizationId),
      ),
    );
    final tasks = ref.watch(organizationTasksProvider(organizationId));

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _OrganizationHero(
          title: workspace.name,
          subtitle: strings.organizationOverviewHint,
          role: strings.organizationRoleLabel(workspace.role),
          organizationId: workspace.organizationId,
        ),
        const SizedBox(height: AinSpacing.lg),
        SubscriptionStatusBanner(subscription: workspace.subscription),
        const SizedBox(height: AinSpacing.lg),
        _MetricGrid(
          metrics: [
            _MetricConfig(
              icon: Icons.school,
              label: strings.organizationCourses,
              value: courses.whenData((value) => value.courses.length),
            ),
            _MetricConfig(
              icon: Icons.event_seat,
              label: strings.openBatches,
              value: courses.whenData((value) => value.openBatchCount),
            ),
            _MetricConfig(
              icon: Icons.receipt_long,
              label: strings.pendingBookings,
              value: bookings.whenData(
                (value) => value
                    .where(
                      (booking) => booking.status == 'pending_confirmation',
                    )
                    .length,
              ),
            ),
            _MetricConfig(
              icon: Icons.groups,
              label: strings.activeMembers,
              value: members.whenData(
                (value) => value.where((member) => member.isActive).length,
              ),
            ),
            _MetricConfig(
              icon: Icons.folder_copy,
              label: strings.contentItems,
              value: content.whenData((value) => value.length),
            ),
            _MetricConfig(
              icon: Icons.event_available,
              label: strings.scheduledEvents,
              value: events.whenData(
                (value) =>
                    value.where((event) => event.status == 'scheduled').length,
              ),
            ),
            _MetricConfig(
              icon: Icons.task_alt,
              label: strings.openTasks,
              value: tasks.whenData(
                (value) => value
                    .where(
                      (task) =>
                          task.status != 'done' && task.status != 'cancelled',
                    )
                    .length,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(
          title: strings.quickActions,
          subtitle: strings.organizationOverviewHint,
        ),
        const SizedBox(height: AinSpacing.md),
        _ActionTile(
          icon: Icons.settings,
          title: strings.organizationProfile,
          subtitle: strings.organizationProfileHint,
          routePath: OrganizationProfilePage.routePath,
        ),
        _ActionTile(
          icon: Icons.dashboard_customize,
          title: strings.organizationCourses,
          subtitle: strings.organizationCoursesHint,
          routePath: OrganizationCoursesPage.routePath,
        ),
        _ActionTile(
          icon: Icons.school,
          title: strings.organizationInstructors,
          subtitle: strings.organizationInstructorsHint,
          routePath: OrganizationInstructorsPage.routePath,
        ),
        _ActionTile(
          icon: Icons.receipt_long,
          title: strings.organizationBookings,
          subtitle: strings.organizationBookingsHint,
          routePath: OrganizationBookingsPage.routePath,
        ),
        _ActionTile(
          icon: Icons.groups,
          title: strings.organizationMembers,
          subtitle: strings.organizationMembersHint,
          routePath: OrganizationMembersPage.routePath,
        ),
        _ActionTile(
          icon: Icons.folder_copy,
          title: strings.organizationContent,
          subtitle: strings.organizationContentHint,
          routePath: OrganizationContentPage.routePath,
        ),
        _ActionTile(
          icon: Icons.meeting_room,
          title: strings.organizationRooms,
          subtitle: strings.organizationRoomsHint,
          routePath: OrganizationRoomsPage.routePath,
        ),
        _ActionTile(
          icon: Icons.event_available,
          title: strings.organizationEvents,
          subtitle: strings.organizationEventsHint,
          routePath: OrganizationEventsPage.routePath,
        ),
        _ActionTile(
          icon: Icons.fact_check,
          title: strings.organizationAttendance,
          subtitle: strings.organizationAttendanceHint,
          routePath: OrganizationAttendancePage.routePath,
        ),
        _ActionTile(
          icon: Icons.campaign,
          title: strings.organizationPromotions,
          subtitle: strings.organizationPromotionsHint,
          routePath: OrganizationPromotionsPage.routePath,
        ),
        _ActionTile(
          icon: Icons.analytics,
          title: strings.organizationAnalytics,
          subtitle: strings.organizationAnalyticsHint,
          routePath: OrganizationAnalyticsPage.routePath,
        ),
        _ActionTile(
          icon: Icons.task_alt,
          title: strings.organizationTasks,
          subtitle: strings.organizationTasksHint,
          routePath: OrganizationTasksPage.routePath,
        ),
        _ActionTile(
          icon: Icons.group_add,
          title: strings.organizationInvitations,
          subtitle: strings.organizationInvitationsHint,
          routePath: OrganizationInvitationsPage.routePath,
        ),
      ],
    );
  }
}

class _MetricGrid extends StatelessWidget {
  const _MetricGrid({required this.metrics});

  final List<_MetricConfig> metrics;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 190,
        mainAxisExtent: 118,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) {
        final metric = metrics[index];

        return DecoratedBox(
          decoration: BoxDecoration(
            color: index < 2 ? AinColors.brand : AinColors.surface,
            borderRadius: BorderRadius.circular(AinRadii.lg),
            border: Border.all(
              color: index < 2 ? AinColors.brandDark : AinColors.line,
            ),
            boxShadow: AinShadows.soft,
          ),
          child: Padding(
            padding: const EdgeInsets.all(AinSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(
                      metric.icon,
                      size: 22,
                      color: index < 2 ? Colors.white70 : _metricColor(index),
                    ),
                    metric.value.when(
                      data: (value) => Text(
                        value.toString(),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color:
                              index < 2 ? Colors.white : AinColors.textPrimary,
                        ),
                      ),
                      error: (error, stackTrace) => const Icon(
                        Icons.error_outline,
                        size: 16,
                        color: AinColors.rose,
                      ),
                      loading: () => const SizedBox.square(
                        dimension: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  ],
                ),
                Text(
                  metric.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: index < 2
                        ? Colors.white.withValues(alpha: 0.9)
                        : AinColors.muted,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _OrganizationHero extends StatelessWidget {
  const _OrganizationHero({
    required this.title,
    required this.subtitle,
    required this.role,
    required this.organizationId,
  });

  final String title;
  final String subtitle;
  final String role;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AinColors.brand, AinColors.brandDark],
        ),
        borderRadius: BorderRadius.circular(AinRadii.lg),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AinIconBadge(
              icon: Icons.business_center_outlined,
              backgroundColor: Color(0x29FFFFFF),
              foregroundColor: Colors.white,
            ),
            const SizedBox(height: AinSpacing.lg),
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AinSpacing.sm),
            Text(
              subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.86),
                height: 1.35,
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.verified_user_outlined,
                  label: role,
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.business_outlined,
                  label: organizationId,
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

Color _metricColor(int index) {
  return switch (index % 4) {
    1 => AinColors.teal,
    2 => AinColors.warning,
    3 => AinColors.cyan,
    _ => AinColors.brand,
  };
}

class _MetricConfig {
  const _MetricConfig({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final AsyncValue<int> value;
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.routePath,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String routePath;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: InkWell(
        borderRadius: BorderRadius.circular(AinRadii.lg),
        onTap: () => context.go(routePath),
        child: AinSurface(
          child: Row(
            children: [
              AinIconBadge(icon: icon),
              const SizedBox(width: AinSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: AinSpacing.xs),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AinColors.muted,
                            height: 1.3,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AinSpacing.sm),
              const Icon(Icons.chevron_right, color: AinColors.faint),
            ],
          ),
        ),
      ),
    );
  }
}

class _NoWorkspace extends StatelessWidget {
  const _NoWorkspace({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.business_outlined,
          title: strings.chooseWorkspace,
          action: AinPrimaryButton(
            onPressed: () => context.go(WorkspaceSelectionPage.routePath),
            label: strings.chooseWorkspace,
            icon: Icons.business_center_outlined,
          ),
        ),
      ],
    );
  }
}
