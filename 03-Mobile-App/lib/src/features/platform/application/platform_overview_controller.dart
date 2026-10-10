import 'package:ain_mobile/src/features/platform/data/platform_overview_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformOverviewProvider =
    FutureProvider.autoDispose<PlatformOverview>((ref) async {
  final repository = ref.watch(platformOverviewRepositoryProvider);
  final results = await Future.wait<Object>([
    repository.getAnalyticsOverview(),
    repository.listOrganizations(perPage: 8),
  ]);

  return PlatformOverview(
    analytics: results[0] as PlatformAnalyticsOverview,
    organizations: results[1] as List<PlatformOrganizationSummary>,
  );
});

class PlatformOverview {
  const PlatformOverview({
    required this.analytics,
    required this.organizations,
  });

  final PlatformAnalyticsOverview analytics;
  final List<PlatformOrganizationSummary> organizations;
}
