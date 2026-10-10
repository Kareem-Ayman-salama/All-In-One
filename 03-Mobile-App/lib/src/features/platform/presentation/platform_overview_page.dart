import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/platform/application/platform_overview_controller.dart';
import 'package:ain_mobile/src/features/platform/data/platform_overview_repository.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformOverviewPage extends ConsumerWidget {
  const PlatformOverviewPage({super.key});

  static const routePath = '/platform/overview';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final profile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.platformOverview)),
      body: SafeArea(
        child: profile.when(
          data: (profile) {
            if (!_hasPlatformRole(profile.user.platformRole)) {
              return _AccessRequired(strings: strings);
            }

            final overview = ref.watch(platformOverviewProvider);

            return RefreshIndicator(
              onRefresh: () => ref.refresh(platformOverviewProvider.future),
              child: overview.when(
                data: (data) => _PlatformOverviewBody(overview: data),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(platformOverviewProvider),
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
            onRetry: () => ref.invalidate(currentUserProfileProvider),
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

class _PlatformOverviewBody extends StatelessWidget {
  const _PlatformOverviewBody({required this.overview});

  final PlatformOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final metrics = overview.analytics.metrics;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.platformOverview,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(strings.platformOverviewHint),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          childAspectRatio: 1.2,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _MetricTile(
              icon: Icons.business,
              label: strings.activeOrganizations,
              value: '${metrics.activeOrganizations}/${metrics.organizations}',
            ),
            _MetricTile(
              icon: Icons.payments,
              label: strings.confirmedRevenue,
              value:
                  '${(metrics.confirmedRevenueMinor / 100).toStringAsFixed(0)} EGP',
            ),
            _MetricTile(
              icon: Icons.event_busy,
              label: strings.expiringSubscriptions,
              value: metrics.expiringOrganizationSubscriptions.toString(),
            ),
            _MetricTile(
              icon: Icons.groups,
              label: strings.members,
              value: metrics.memberships.toString(),
            ),
            _MetricTile(
              icon: Icons.receipt_long,
              label: strings.confirmedBookings,
              value: '${metrics.confirmedBookings}/${metrics.bookings}',
            ),
            _MetricTile(
              icon: Icons.school,
              label: strings.publishedCourses,
              value: metrics.publishedCourses.toString(),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          strings.latestTenants,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        for (final organization in overview.organizations)
          _OrganizationTile(organization: organization),
        if (overview.organizations.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(strings.noOrganizationsYet),
            ),
          ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const Spacer(),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class _OrganizationTile extends StatelessWidget {
  const _OrganizationTile({required this.organization});

  final PlatformOrganizationSummary organization;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final subscription = organization.subscription;

    return Card(
      child: ListTile(
        leading: CircleAvatar(
          child: Text(_initials(organization.name)),
        ),
        title: Text(organization.name),
        subtitle: Text(
          '${subscription?.planName ?? strings.noActiveSubscription} - '
          '${subscription?.status ?? organization.status}',
        ),
        trailing: Text(
          '${organization.membershipsCount} ${strings.members}',
          textAlign: TextAlign.end,
        ),
      ),
    );
  }
}

class _AccessRequired extends StatelessWidget {
  const _AccessRequired({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.admin_panel_settings, size: 56),
        const SizedBox(height: 16),
        Text(
          strings.platformAccessRequired,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
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
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.cloud_off, size: 48),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: Text(strings.retry),
        ),
      ],
    );
  }
}

bool _hasPlatformRole(String? role) {
  return const <String>{
    'super_admin',
    'platform_support',
    'platform_moderator',
  }.contains(role);
}

String _initials(String name) {
  final words = name.trim().split(RegExp(r'\s+'));
  if (words.isEmpty || words.first.isEmpty) {
    return '?';
  }
  if (words.length == 1) {
    final end = words.first.length < 2 ? words.first.length : 2;

    return words.first.substring(0, end).toUpperCase();
  }

  return '${words[0][0]}${words[1][0]}'.toUpperCase();
}
