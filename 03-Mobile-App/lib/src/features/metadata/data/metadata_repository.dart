import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final metadataRepositoryProvider = Provider<MetadataRepository>((ref) {
  return MetadataRepository(dio: ref.watch(dioProvider));
});

class MetadataRepository {
  const MetadataRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<Map<String, Object?>> getErrorCatalog() {
    return _getMap('/meta/error-catalog');
  }

  Future<Map<String, Object?>> getDeepLinks() {
    return _getMap('/meta/deep-links');
  }

  Future<Map<String, Object?>> getOfflineCachePolicy() {
    return _getMap('/meta/offline-cache-policy');
  }

  Future<Map<String, Object?>> getDevicePolicy() {
    return _getMap('/meta/device-policy');
  }

  Future<Map<String, Object?>> _getMap(String path) async {
    final response = await _dio.get<Object?>(path);
    final envelope = ApiEnvelope<Map<String, Object?>>.fromJson(
      readJsonObject(response.data),
      readJsonObject,
    );

    return envelope.data;
  }
}
