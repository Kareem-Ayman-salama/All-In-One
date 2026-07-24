import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/features/metadata/data/metadata_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final offlineCachePolicyProvider = FutureProvider<OfflineCachePolicy>((ref) async {
  final manifest = await ref.watch(metadataRepositoryProvider).getOfflineCachePolicy();
  return OfflineCachePolicy.fromJson(manifest);
});

class OfflineCachePolicy {
  const OfflineCachePolicy({
    required this.version,
    required this.defaultWritePolicy,
    required this.purgeOn,
    required this.datasets,
    required this.writeOperations,
  });

  factory OfflineCachePolicy.fromJson(Map<String, Object?> json) {
    final datasets = readJsonObject(json['datasets']).map(
      (key, value) => MapEntry(
        key,
        OfflineDatasetPolicy.fromJson(readJsonObject(value)),
      ),
    );
    final writeOperations = readJsonObject(json['writeOperations']).map(
      (key, value) => MapEntry(
        key,
        OfflineWritePolicy.fromJson(readJsonObject(value)),
      ),
    );

    return OfflineCachePolicy(
      version: json['version'] as String? ?? '',
      defaultWritePolicy: json['defaultWritePolicy'] as String? ?? '',
      purgeOn: _readStringList(json['purgeOn']),
      datasets: datasets,
      writeOperations: writeOperations,
    );
  }

  final String version;
  final String defaultWritePolicy;
  final List<String> purgeOn;
  final Map<String, OfflineDatasetPolicy> datasets;
  final Map<String, OfflineWritePolicy> writeOperations;

  bool shouldPersistDataset(String datasetKey) {
    final dataset = datasets[datasetKey];
    if (dataset == null) {
      return false;
    }

    return dataset.offlineReadable
        && dataset.storage != 'memory_only'
        && !dataset.neverPersist;
  }

  bool requiresServerConfirmation(String operationKey) {
    final operation = writeOperations[operationKey];
    return operation?.requiresServerConfirmation ?? true;
  }
}

class OfflineDatasetPolicy {
  const OfflineDatasetPolicy({
    required this.endpoint,
    required this.scope,
    required this.ttlSeconds,
    required this.storage,
    required this.sensitivity,
    required this.offlineReadable,
    required this.staleWhileRevalidate,
    required this.purgeOnLogout,
    required this.neverPersist,
    this.neverCacheFields = const <String>[],
  });

  factory OfflineDatasetPolicy.fromJson(Map<String, Object?> json) {
    return OfflineDatasetPolicy(
      endpoint: json['endpoint'] as String? ?? '',
      scope: json['scope'] as String? ?? '',
      ttlSeconds: json['ttlSeconds'] as int? ?? 0,
      storage: json['storage'] as String? ?? 'memory_only',
      sensitivity: json['sensitivity'] as String? ?? 'unknown',
      offlineReadable: json['offlineReadable'] as bool? ?? false,
      staleWhileRevalidate: json['staleWhileRevalidate'] as bool? ?? false,
      purgeOnLogout: json['purgeOnLogout'] as bool? ?? true,
      neverPersist: json['neverPersist'] as bool? ?? false,
      neverCacheFields: _readStringList(json['neverCacheFields']),
    );
  }

  final String endpoint;
  final String scope;
  final int ttlSeconds;
  final String storage;
  final String sensitivity;
  final bool offlineReadable;
  final bool staleWhileRevalidate;
  final bool purgeOnLogout;
  final bool neverPersist;
  final List<String> neverCacheFields;
}

class OfflineWritePolicy {
  const OfflineWritePolicy({
    required this.endpoint,
    required this.offlineBehavior,
    required this.requiresServerConfirmation,
  });

  factory OfflineWritePolicy.fromJson(Map<String, Object?> json) {
    return OfflineWritePolicy(
      endpoint: json['endpoint'] as String? ?? '',
      offlineBehavior: json['offlineBehavior'] as String? ?? 'block_with_retry',
      requiresServerConfirmation:
          json['requiresServerConfirmation'] as bool? ?? true,
    );
  }

  final String endpoint;
  final String offlineBehavior;
  final bool requiresServerConfirmation;
}

List<String> _readStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }

  return value.map((entry) => entry.toString()).toList(growable: false);
}

