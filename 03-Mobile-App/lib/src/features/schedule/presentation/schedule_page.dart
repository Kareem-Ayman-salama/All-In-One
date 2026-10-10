import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_events_page.dart';
import 'package:ain_mobile/src/features/schedule/application/schedule_controller.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SchedulePage extends ConsumerWidget {
  const SchedulePage({super.key});

  static const routePath = '/schedule';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final schedule = ref.watch(mobileScheduleProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.schedule)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(mobileScheduleProvider.future),
          child: schedule.when(
            data: (overview) => _ScheduleBody(overview: overview),
            error: (error, stackTrace) => ListView(
              padding: const EdgeInsets.all(AinSpacing.lg),
              children: [
                AinEmptyState(
                  icon: Icons.cloud_off_outlined,
                  title: strings.retry,
                  subtitle: error.toString(),
                  action: FilledButton.icon(
                    onPressed: () => ref.invalidate(mobileScheduleProvider),
                    icon: const Icon(Icons.refresh),
                    label: Text(strings.retry),
                  ),
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
      ),
    );
  }
}

class _ScheduleBody extends StatelessWidget {
  const _ScheduleBody({required this.overview});

  final MobileScheduleOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _ScheduleHero(
          title: strings.scheduleTitle,
          subtitle: strings.scheduleSubtitle,
          total:
              overview.studentItems.length + overview.organizationItems.length,
        ),
        const SizedBox(height: AinSpacing.xl),
        if (overview.isEmpty)
          _EmptySchedule()
        else ...[
          _ScheduleSection(
            title: strings.studentCourseSchedules,
            emptyText: strings.noStudentSchedule,
            items: overview.studentItems,
            actionLabel: strings.openMyCourses,
            actionRoute: MyCoursesPage.routePath,
          ),
          const SizedBox(height: AinSpacing.xl),
          _ScheduleSection(
            title: strings.organizationCalendar,
            emptyText: strings.noOrganizationEvents,
            items: overview.organizationItems,
            actionLabel: strings.openOrganizationEvents,
            actionRoute: OrganizationEventsPage.routePath,
          ),
        ],
      ],
    );
  }
}

class _ScheduleHero extends StatelessWidget {
  const _ScheduleHero({
    required this.title,
    required this.subtitle,
    required this.total,
  });

  final String title;
  final String subtitle;
  final int total;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AinColors.brand, AinColors.brandDark],
          begin: AlignmentDirectional.topStart,
          end: AlignmentDirectional.bottomEnd,
        ),
        borderRadius: BorderRadius.circular(AinRadii.lg),
        boxShadow: AinShadows.soft,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinStatusPill(
              icon: Icons.calendar_today_outlined,
              label: '$total',
              color: Colors.white,
              backgroundColor: Colors.white.withValues(alpha: 0.16),
            ),
            const SizedBox(height: AinSpacing.xl),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: AinSpacing.sm),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: 0.78),
                    height: 1.35,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ScheduleSection extends StatelessWidget {
  const _ScheduleSection({
    required this.title,
    required this.emptyText,
    required this.items,
    required this.actionLabel,
    required this.actionRoute,
  });

  final String title;
  final String emptyText;
  final List<ScheduleItem> items;
  final String actionLabel;
  final String actionRoute;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AinSectionHeader(
          title: title,
          action: TextButton(
            onPressed: () => context.go(actionRoute),
            child: Text(actionLabel),
          ),
        ),
        const SizedBox(height: AinSpacing.md),
        if (items.isEmpty)
          AinEmptyState(
            icon: Icons.event_busy_outlined,
            title: emptyText,
          )
        else
          for (final item in items) _ScheduleCard(item: item),
      ],
    );
  }
}

class _ScheduleCard extends StatelessWidget {
  const _ScheduleCard({required this.item});

  final ScheduleItem item;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final icon = item.kind == ScheduleItemKind.studentCourse
        ? Icons.school
        : Icons.event_available;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(icon: icon),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    [
                      if (item.startsAt != null)
                        strings.scheduleStarts(item.startsAt!),
                      if (item.endsAt != null)
                        strings.scheduleEnds(item.endsAt!),
                      if (item.subtitle.isNotEmpty) item.subtitle,
                      if (item.sourceLabel.isNotEmpty) item.sourceLabel,
                    ].join('\n'),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AinColors.muted,
                          height: 1.3,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptySchedule extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return AinEmptyState(
      icon: Icons.event_busy_outlined,
      title: strings.noScheduleItems,
      subtitle: strings.noScheduleItemsHint,
      action: FilledButton.icon(
        onPressed: () => context.go(MyCoursesPage.routePath),
        icon: const Icon(Icons.school),
        label: Text(strings.openMyCourses),
      ),
    );
  }
}
