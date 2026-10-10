import 'dart:convert';

import 'package:ain_mobile/src/core/cache/offline_cache_policy.dart';
import 'package:ain_mobile/src/core/cache/tenant_cache_scope.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final offlineCacheStoreProvider = Provider<OfflineCacheStore>((ref) {
  return OfflineCacheStore(
    ref: ref,
    storage: const FlutterSecureStorage(),
  );
});

class OfflineCacheStore {
  const OfflineCacheStore({
    required Ref ref,
    required FlutterSecureStorage storage,
  })  : _ref = ref,
        _storage = storage;

  static const _prefix = 'ain.cache';

  final Ref _ref;
  final FlutterSecureStorage _storage;

  Future<CachedJsonList?> readJsonList({
    required String dataset,
    Map<String, String> parameters = const <String, String>{},
  }) async {
    final cacheKey = await _cacheKey(dataset: dataset, parameters: parameters);
    if (cacheKey == null) {
      return null;
    }

    final raw = await _storage.read(key: cacheKey);
    if (raw == null || raw.isEmpty) {
      return null;
    }

    final record = OfflineCacheRecord.fromJson(
      jsonDecode(raw) as Map<String, Object?>,
    );

    final items = record.payload.whereType<Map<Object?, Object?>>().map((item) {
      return item.map((key, value) => MapEntry(key.toString(), value));
    }).toList(growable: false);

    return CachedJsonList(
      items: items,
      storedAt: record.storedAt,
      expiresAt: record.expiresAt,
    );
  }

  Future<void> writeJsonList({
    required String dataset,
    required List<Map<String, Object?>> items,
    Map<String, String> parameters = const <String, String>{},
  }) async {
    final policy = await _ref.read(offlineCachePolicyProvider.future);
    final datasetPolicy = policy.datasets[dataset];
    if (datasetPolicy == null || !policy.shouldPersistDataset(dataset)) {
      return;
    }

    final cacheKey = await _cacheKey(
      dataset: dataset,
      parameters: parameters,
      datasetPolicy: datasetPolicy,
    );
    if (cacheKey == null) {
      return;
    }

    final now = DateTime.now().toUtc();
    final record = OfflineCacheRecord(
      storedAt: now,
      expiresAt: now.add(Duration(seconds: datasetPolicy.ttlSeconds)),
      payload: items,
    );

    await _storage.write(key: cacheKey, value: jsonEncode(record.toJson()));
  }

  Future<void> clearDataset({
    required String dataset,
    Map<String, String> parameters = const <String, String>{},
  }) async {
    final cacheKey = await _cacheKey(dataset: dataset, parameters: parameters);
    if (cacheKey == null) {
      return;
    }

    await _storage.delete(key: cacheKey);
  }

  Future<String?> _cacheKey({
    required String dataset,
    required Map<String, String> parameters,
    OfflineDatasetPolicy? datasetPolicy,
  }) async {
    final policy = await _ref.read(offlineCachePolicyProvider.future);
    final resolvedPolicy = datasetPolicy ?? policy.datasets[dataset];
    if (resolvedPolicy == null || !policy.shouldPersistDataset(dataset)) {
      return null;
    }

    final scope = _ref.read(tenantCacheScopeControllerProvider);
    final factory = _ref.read(tenantCacheKeyFactoryProvider);
    final String scopedKey;
    try {
      scopedKey = factory.datasetKey(
        policy: resolvedPolicy,
        dataset: dataset,
        scope: scope,
        parameters: parameters,
      );
    } on StateError {
      return null;
    }

    return '$_prefix::$scopedKey';
  }
}

class CachedJsonList {
  const CachedJsonList({
    required this.items,
    required this.storedAt,
    required this.expiresAt,
  });

  final List<Map<String, Object?>> items;
  final DateTime storedAt;
  final DateTime expiresAt;

  bool get isStale => DateTime.now().toUtc().isAfter(expiresAt);
}

class OfflineCacheRecord {
  const OfflineCacheRecord({
    required this.storedAt,
    required this.expiresAt,
    required this.payload,
  });

  factory OfflineCacheRecord.fromJson(Map<String, Object?> json) {
    return OfflineCacheRecord(
      storedAt: DateTime.parse(json['storedAt']?.toString() ?? ''),
      expiresAt: DateTime.parse(json['expiresAt']?.toString() ?? ''),
      payload: (json['payload'] as List? ?? const <Object?>[]).cast<Object?>(),
    );
  }

  final DateTime storedAt;
  final DateTime expiresAt;
  final List<Object?> payload;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'storedAt': storedAt.toIso8601String(),
      'expiresAt': expiresAt.toIso8601String(),
      'payload': payload,
    };
  }
}
