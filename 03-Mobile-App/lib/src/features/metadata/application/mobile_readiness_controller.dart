import 'package:ain_mobile/src/core/cache/offline_cache_policy.dart';
import 'package:ain_mobile/src/features/metadata/data/metadata_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final mobileReadinessProvider =
    FutureProvider.autoDispose<MobileReadinessSummary>((ref) async {
  final policy = await ref.watch(offlineCachePolicyProvider.future);
  final metadataRepository = ref.watch(metadataRepositoryProvider);
  final devicePolicy = await metadataRepository.getDevicePolicy();
  final deepLinks = await metadataRepository.getDeepLinks();

  return MobileReadinessSummary.fromPolicy(
    cachePolicy: policy,
    devicePolicy: devicePolicy,
    deepLinks: deepLinks,
  );
});

class MobileReadinessSummary {
  const MobileReadinessSummary({
    required this.cachePolicyVersion,
    required this.devicePolicyVersion,
    required this.persistableDatasetCount,
    required this.memoryOnlyDatasetCount,
    required this.serverConfirmedWriteCount,
    required this.optimisticWriteCount,
    required this.deepLinkVersion,
    required this.deepLinkRouteCount,
    required this.authRequiredDeepLinkCount,
    required this.purgeTriggers,
    required this.disallowedPractices,
    required this.signedContentIsMemoryOnly,
    required this.maxActiveSessions,
  });

  factory MobileReadinessSummary.fromPolicy({
    required OfflineCachePolicy cachePolicy,
    required Map<String, Object?> devicePolicy,
    required Map<String, Object?> deepLinks,
  }) {
    final persistableDatasetCount = cachePolicy.datasets.entries
        .where((entry) => cachePolicy.shouldPersistDataset(entry.key))
        .length;
    final memoryOnlyDatasetCount = cachePolicy.datasets.values
        .where((policy) => policy.storage == 'memory_only')
        .length;
    final optimisticWriteCount = cachePolicy.writeOperations.values
        .where((policy) => !policy.requiresServerConfirmation)
        .length;
    final routes = _readObject(deepLinks['routes']);
    final authRequiredDeepLinkCount = routes.values
        .map(_readObject)
        .where((route) => route['requiresAuth'] == true)
        .length;

    return MobileReadinessSummary(
      cachePolicyVersion: cachePolicy.version,
      devicePolicyVersion: devicePolicy['version']?.toString() ?? '',
      persistableDatasetCount: persistableDatasetCount,
      memoryOnlyDatasetCount: memoryOnlyDatasetCount,
      serverConfirmedWriteCount:
          cachePolicy.writeOperations.length - optimisticWriteCount,
      optimisticWriteCount: optimisticWriteCount,
      deepLinkVersion: deepLinks['version']?.toString() ?? '',
      deepLinkRouteCount: routes.length,
      authRequiredDeepLinkCount: authRequiredDeepLinkCount,
      purgeTriggers: cachePolicy.purgeOn,
      disallowedPractices: _readStringList(
        devicePolicy['disallowed_practices'],
      ),
      signedContentIsMemoryOnly: cachePolicy
                  .datasets['content.view_session']?.storage ==
              'memory_only' &&
          cachePolicy.datasets['content.view_session']?.neverPersist == true,
      maxActiveSessions: _readInt(devicePolicy['max_active_sessions_per_user']),
    );
  }

  final String cachePolicyVersion;
  final String devicePolicyVersion;
  final int persistableDatasetCount;
  final int memoryOnlyDatasetCount;
  final int serverConfirmedWriteCount;
  final int optimisticWriteCount;
  final String deepLinkVersion;
  final int deepLinkRouteCount;
  final int authRequiredDeepLinkCount;
  final List<String> purgeTriggers;
  final List<String> disallowedPractices;
  final bool signedContentIsMemoryOnly;
  final int maxActiveSessions;
}

List<String> _readStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }

  return value.map((entry) => entry.toString()).toList(growable: false);
}

int _readInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

Map<String, Object?> _readObject(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return value.map((key, entry) => MapEntry(key.toString(), entry));
  }

  return const <String, Object?>{};
}
