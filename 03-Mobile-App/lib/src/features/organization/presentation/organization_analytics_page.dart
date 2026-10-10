import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_analytics_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_analytics_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationAnalyticsPage extends ConsumerStatefulWidget {
  const OrganizationAnalyticsPage({super.key});

  static const routePath = '/organization/analytics';

  @override
  ConsumerState<OrganizationAnalyticsPage> createState() {
    return _OrganizationAnalyticsPageState();
  }
}

class _OrganizationAnalyticsPageState
    extends ConsumerState<OrganizationAnalyticsPage> {
  DateTime? _from;
  DateTime? _to;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationAnalytics)),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final request = OrganizationAnalyticsRequest(
              organizationId: workspace.organizationId,
              from: _dateText(_from),
              to: _dateText(_to),
            );
            final analytics = ref.watch(organizationAnalyticsProvider(request));
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationAnalyticsProvider(request).future,
                );
              },
              child: analytics.when(
                data: (overview) => _AnalyticsBody(
                  overview: overview,
                  from: _from,
                  to: _to,
                  onPickRange: _pickRange,
                ),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(organizationAnalyticsProvider(request));
                  },
                ),
                loading: () => Center(
                  child: Semantics(
                    label: strings.loading,
                    child: const CircularProgressIndicator(),
                  ),
                ),
              ),
            );
          },
          error: (error, stackTrace) => _ErrorList(
            message: error.toString(),
            onRetry: () => ref.invalidate(activeWorkspaceControllerProvider),
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

  Future<void> _pickRange() async {
    final now = DateTime.now();
    final initial = DateTimeRange(
      start: _from ?? now.subtract(const Duration(days: 30)),
      end: _to ?? now,
    );
    final range = await showDateRangePicker(
      context: context,
      firstDate: now.subtract(const Duration(days: 365)),
      lastDate: now.add(const Duration(days: 1)),
      initialDateRange: initial,
    );
    if (range == null) {
      return;
    }
    setState(() {
      _from = range.start;
      _to = range.end;
    });
  }
}

class _AnalyticsBody extends StatelessWidget {
  const _AnalyticsBody({
    required this.overview,
    required this.from,
    required this.to,
    required this.onPickRange,
  });

  final OrganizationAnalyticsOverview overview;
  final DateTime? from;
  final DateTime? to;
  final VoidCallback onPickRange;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final metrics = overview.metrics;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _AnalyticsHero(
          title: strings.organizationAnalytics,
          subtitle: strings.organizationAnalyticsHint,
          conversionRate: metrics.bookingConversionRate,
          revenue: (metrics.confirmedRevenueMinor / 100).toStringAsFixed(0),
        ),
        const SizedBox(height: AinSpacing.lg),
        AinSecondaryButton(
          onPressed: onPickRange,
          icon: Icons.date_range,
          label: _rangeLabel(strings, from, to, overview.range),
        ),
        const SizedBox(height: AinSpacing.lg),
        GridView.count(
          crossAxisCount: 2,
          childAspectRatio: 1.18,
          mainAxisSpacing: AinSpacing.sm,
          crossAxisSpacing: AinSpacing.sm,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            AinMetricCard(
              icon: Icons.meeting_room,
              label: strings.rooms,
              value: metrics.rooms.toString(),
            ),
            AinMetricCard(
              icon: Icons.groups,
              label: strings.members,
              value: metrics.members.toString(),
              color: AinColors.teal,
              backgroundColor: AinColors.tealSoft,
            ),
            AinMetricCard(
              icon: Icons.school,
              label: strings.publishedCourses,
              value: metrics.publishedCourses.toString(),
              color: AinColors.cyan,
              backgroundColor: AinColors.cyanSoft,
            ),
            AinMetricCard(
              icon: Icons.calendar_view_week,
              label: strings.activeBatches,
              value: metrics.activeBatches.toString(),
            ),
            AinMetricCard(
              icon: Icons.receipt_long,
              label: strings.bookings,
              value: metrics.bookings.toString(),
              color: AinColors.warning,
              backgroundColor: AinColors.warningSoft,
            ),
            AinMetricCard(
              icon: Icons.verified,
              label: strings.confirmedBookings,
              value: metrics.confirmedBookings.toString(),
              color: AinColors.success,
              backgroundColor: AinColors.successSoft,
            ),
            AinMetricCard(
              icon: Icons.trending_up,
              label: strings.bookingConversionRate,
              value: '${metrics.bookingConversionRate}%',
              color: AinColors.teal,
              backgroundColor: AinColors.tealSoft,
            ),
            AinMetricCard(
              icon: Icons.person_pin,
              label: strings.activeEnrollments,
              value: metrics.activeEnrollments.toString(),
            ),
            AinMetricCard(
              icon: Icons.warning_amber,
              label: strings.expiringSubscriptions,
              value: metrics.expiringSubscriptions.toString(),
              color: AinColors.rose,
              backgroundColor: AinColors.roseSoft,
            ),
            AinMetricCard(
              icon: Icons.payments,
              label: strings.confirmedRevenue,
              value:
                  '${(metrics.confirmedRevenueMinor / 100).toStringAsFixed(0)} EGP',
            ),
          ],
        ),
      ],
    );
  }
}

class _AnalyticsHero extends StatelessWidget {
  const _AnalyticsHero({
    required this.title,
    required this.subtitle,
    required this.conversionRate,
    required this.revenue,
  });

  final String title;
  final String subtitle;
  final double conversionRate;
  final String revenue;

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
              icon: Icons.analytics_outlined,
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
                  icon: Icons.trending_up,
                  label: '$conversionRate%',
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.payments_outlined,
                  label: '$revenue EGP',
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

class _ErrorList extends StatelessWidget {
  const _ErrorList({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.cloud_off_outlined,
          title: message,
          action: AinPrimaryButton(
            onPressed: onRetry,
            icon: Icons.refresh,
            label: strings.retry,
          ),
        ),
      ],
    );
  }
}

String _rangeLabel(
  AppStrings strings,
  DateTime? from,
  DateTime? to,
  OrganizationAnalyticsRange backendRange,
) {
  final start = _dateText(from) ?? backendRange.from ?? '';
  final end = _dateText(to) ?? backendRange.to ?? '';
  if (start.isEmpty && end.isEmpty) {
    return strings.analyticsRange;
  }

  return '$start - $end';
}

String? _dateText(DateTime? date) {
  return date?.toIso8601String().split('T').first;
}
