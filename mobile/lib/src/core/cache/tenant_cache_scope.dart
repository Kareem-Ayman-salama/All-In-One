import 'package:ain_mobile/src/core/cache/offline_cache_policy.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final tenantCacheKeyFactoryProvider = Provider<TenantCacheKeyFactory>((ref) {
  return const TenantCacheKeyFactory();
});

final tenantCacheScopeControllerProvider =
    NotifierProvider<TenantCacheScopeController, TenantCacheScope>(
  TenantCacheScopeController.new,
);

class TenantCacheScopeController extends Notifier<TenantCacheScope> {
  @override
  TenantCacheScope build() {
    return const TenantCacheScope.empty();
  }

  void activateUser({required String userId}) {
    state = state.copyWith(userId: userId);
  }

  void activateOrganization({required String organizationId}) {
    state = state.copyWith(organizationId: organizationId);
    ref.invalidate(offlineCachePolicyProvider);
  }

  void clearOrganization() {
    state = TenantCacheScope(userId: state.userId);
  }

  void clearAll() {
    state = const TenantCacheScope.empty();
  }
}

class TenantCacheScope {
  const TenantCacheScope({this.userId, this.organizationId});

  const TenantCacheScope.empty()
      : userId = null,
        organizationId = null;

  final String? userId;
  final String? organizationId;

  TenantCacheScope copyWith({String? userId, String? organizationId}) {
    return TenantCacheScope(
      userId: userId ?? this.userId,
      organizationId: organizationId ?? this.organizationId,
    );
  }
}

class TenantCacheKeyFactory {
  const TenantCacheKeyFactory();

  String datasetKey({
    required OfflineDatasetPolicy policy,
    required String dataset,
    required TenantCacheScope scope,
    Map<String, String> parameters = const <String, String>{},
  }) {
    final scopeSegment = switch (policy.scope) {
      'public' => 'public',
      'user' => 'user:${_required(scope.userId, 'userId')}',
      'organization' =>
        'organization:${_required(scope.organizationId, 'organizationId')}',
      _ => 'unknown',
    };
    final parameterSegment = parameters.entries
        .map((entry) => '${entry.key}:${entry.value}')
        .join('|');

    return [
      scopeSegment,
      dataset,
      if (parameterSegment.isNotEmpty) parameterSegment,
    ].join('::');
  }

  String _required(String? value, String name) {
    if (value == null || value.isEmpty) {
      throw StateError('$name is required for this cache scope.');
    }

    return value;
  }
}
