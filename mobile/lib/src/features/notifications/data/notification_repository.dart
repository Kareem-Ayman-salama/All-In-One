import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(dio: ref.watch(dioProvider));
});

class NotificationRepository {
  const NotificationRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<AppNotification>> listNotifications() async {
    final response = await _dio.get<Object?>(
      '/notifications',
      queryParameters: const <String, Object?>{'perPage': 100},
    );
    final envelope = ApiEnvelope<List<AppNotification>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(AppNotification.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<void> markRead(String notificationId) async {
    await _dio.post<Object?>('/notifications/$notificationId/read');
  }

  Future<void> markAllRead() async {
    await _dio.post<Object?>('/notifications/read-all');
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.read,
    this.type,
    this.targetType,
    this.targetId,
    this.data = const <String, Object?>{},
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, Object?> json) {
    final status = _readString(json, 'status');
    final readAt = _readNullableString(json, 'readAt', snakeKey: 'read_at');

    return AppNotification(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      body: _readString(json, 'body'),
      read: (json['read'] as bool?) ?? status == 'read' || readAt != null,
      type: _readNullableString(json, 'type'),
      targetType: _readNullableString(
        json,
        'targetType',
        snakeKey: 'target_type',
      ),
      targetId: _readNullableString(json, 'targetId', snakeKey: 'target_id'),
      data: _readJsonObjectOrEmpty(json['data']),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String title;
  final String body;
  final bool read;
  final String? type;
  final String? targetType;
  final String? targetId;
  final Map<String, Object?> data;
  final String? createdAt;

  String? get route {
    return data['route'] as String?;
  }
}

Map<String, Object?> _readJsonObjectOrEmpty(Object? value) {
  if (value == null) {
    return const <String, Object?>{};
  }
  return readJsonObject(value);
}

String _readString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  String fallback = '',
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))
          ?.toString() ??
      fallback;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))?.toString();
}
