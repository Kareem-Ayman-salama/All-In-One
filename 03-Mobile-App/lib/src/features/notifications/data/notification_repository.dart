import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:ain_mobile/src/core/cache/offline_cache_store.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(
    dio: ref.watch(dioProvider),
    cacheStore: ref.watch(offlineCacheStoreProvider),
  );
});

class NotificationRepository {
  const NotificationRepository({
    required Dio dio,
    required OfflineCacheStore cacheStore,
  })  : _dio = dio,
        _cacheStore = cacheStore;

  final Dio _dio;
  final OfflineCacheStore _cacheStore;

  Future<List<AppNotification>> listNotifications() async {
    try {
      final response = await _dio.get<Object?>(
        '/notifications',
        queryParameters: const <String, Object?>{'perPage': 100},
      );
      final responseJson = readJsonObject(response.data);
      final data = readJsonObjectList(responseJson['data']);
      final envelope = ApiEnvelope<List<AppNotification>>.fromJson(
        responseJson,
        (value) => readJsonObjectList(
          value,
        ).map(AppNotification.fromJson).toList(growable: false),
      );

      await _cacheStore.writeJsonList(
        dataset: 'notifications.inbox',
        items: data,
      );

      return envelope.data;
    } on DioException {
      final cached = await _cacheStore.readJsonList(
        dataset: 'notifications.inbox',
      );
      if (cached != null) {
        return cached.items.map(AppNotification.fromJson).toList(
              growable: false,
            );
      }
      rethrow;
    }
  }

  Future<void> markRead(String notificationId) async {
    await _dio.post<Object?>('/notifications/$notificationId/read');
  }

  Future<void> markAllRead() async {
    await _dio.post<Object?>('/notifications/read-all');
  }

  Future<NotificationPreferences> getPreferences({
    String? organizationId,
  }) async {
    final response = await _dio.get<Object?>(
      '/notification-preferences',
      queryParameters: <String, Object?>{
        if (_hasText(organizationId)) 'organizationId': organizationId,
      },
    );
    final envelope = ApiEnvelope<NotificationPreferences>.fromJson(
      readJsonObject(response.data),
      (value) => NotificationPreferences.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<NotificationPreferences> updatePreferences({
    required UpdateNotificationPreferencesCommand command,
  }) async {
    final response = await _dio.put<Object?>(
      '/notification-preferences',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<NotificationPreferences>.fromJson(
      readJsonObject(response.data),
      (value) => NotificationPreferences.fromJson(readJsonObject(value)),
    );

    return envelope.data;
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

class UpdateNotificationPreferencesCommand {
  const UpdateNotificationPreferencesCommand({
    required this.inAppEnabled,
    required this.emailEnabled,
    required this.pushEnabled,
    required this.bookingUpdates,
    required this.announcements,
    required this.subscriptionReminders,
    this.organizationId,
  });

  factory UpdateNotificationPreferencesCommand.fromPreferences(
    NotificationPreferences preferences, {
    bool? inAppEnabled,
    bool? emailEnabled,
    bool? pushEnabled,
    bool? bookingUpdates,
    bool? announcements,
    bool? subscriptionReminders,
  }) {
    return UpdateNotificationPreferencesCommand(
      organizationId: preferences.organizationId,
      inAppEnabled: inAppEnabled ?? preferences.inAppEnabled,
      emailEnabled: emailEnabled ?? preferences.emailEnabled,
      pushEnabled: pushEnabled ?? preferences.pushEnabled,
      bookingUpdates: bookingUpdates ?? preferences.bookingUpdates,
      announcements: announcements ?? preferences.announcements,
      subscriptionReminders:
          subscriptionReminders ?? preferences.subscriptionReminders,
    );
  }

  final String? organizationId;
  final bool inAppEnabled;
  final bool emailEnabled;
  final bool pushEnabled;
  final bool bookingUpdates;
  final bool announcements;
  final bool subscriptionReminders;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'organizationId': organizationId,
      'inAppEnabled': inAppEnabled,
      'emailEnabled': emailEnabled,
      'pushEnabled': pushEnabled,
      'bookingUpdates': bookingUpdates,
      'announcements': announcements,
      'subscriptionReminders': subscriptionReminders,
    };
  }
}

class NotificationPreferences {
  const NotificationPreferences({
    required this.id,
    required this.inAppEnabled,
    required this.emailEnabled,
    required this.pushEnabled,
    required this.bookingUpdates,
    required this.announcements,
    required this.subscriptionReminders,
    this.organizationId,
  });

  factory NotificationPreferences.fromJson(Map<String, Object?> json) {
    return NotificationPreferences(
      id: _readString(json, 'id'),
      organizationId: _readNullableString(
        json,
        'organizationId',
        snakeKey: 'organization_id',
      ),
      inAppEnabled: _readBool(
        json,
        'inAppEnabled',
        snakeKey: 'in_app_enabled',
        fallback: true,
      ),
      emailEnabled: _readBool(
        json,
        'emailEnabled',
        snakeKey: 'email_enabled',
        fallback: true,
      ),
      pushEnabled: _readBool(
        json,
        'pushEnabled',
        snakeKey: 'push_enabled',
        fallback: true,
      ),
      bookingUpdates: _readBool(
        json,
        'bookingUpdates',
        snakeKey: 'booking_updates',
        fallback: true,
      ),
      announcements: _readBool(
        json,
        'announcements',
        fallback: true,
      ),
      subscriptionReminders: _readBool(
        json,
        'subscriptionReminders',
        snakeKey: 'subscription_reminders',
        fallback: true,
      ),
    );
  }

  final String id;
  final String? organizationId;
  final bool inAppEnabled;
  final bool emailEnabled;
  final bool pushEnabled;
  final bool bookingUpdates;
  final bool announcements;
  final bool subscriptionReminders;
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

bool _readBool(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  bool fallback = false,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    return value == 'true' || value == '1';
  }

  return fallback;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
