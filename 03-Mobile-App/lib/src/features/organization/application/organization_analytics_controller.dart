import 'package:ain_mobile/src/features/organization/data/organization_analytics_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationAnalyticsProvider = FutureProvider.autoDispose
    .family<OrganizationAnalyticsOverview, OrganizationAnalyticsRequest>((
  ref,
  request,
) {
  return ref.watch(organizationAnalyticsRepositoryProvider).getOverview(
        organizationId: request.organizationId,
        from: request.from,
        to: request.to,
      );
});

class OrganizationAnalyticsRequest {
  const OrganizationAnalyticsRequest({
    required this.organizationId,
    this.from,
    this.to,
  });

  final String organizationId;
  final String? from;
  final String? to;

  @override
  bool operator ==(Object other) {
    return other is OrganizationAnalyticsRequest &&
        other.organizationId == organizationId &&
        other.from == from &&
        other.to == to;
  }

  @override
  int get hashCode => Object.hash(organizationId, from, to);
}
