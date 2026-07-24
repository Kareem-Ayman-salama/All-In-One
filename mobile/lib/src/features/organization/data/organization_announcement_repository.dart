import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationAnnouncementRepositoryProvider =
    Provider<OrganizationAnnouncementRepository>((ref) {
  return OrganizationAnnouncementRepository(dio: ref.watch(dioProvider));
});

class OrganizationAnnouncementRepository {
  const OrganizationAnnouncementRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationAnnouncementSummary>> listAnnouncements({
    required String organizationId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/announcements',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope =
        ApiEnvelope<List<OrganizationAnnouncementSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(OrganizationAnnouncementSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationAnnouncementSummary> createAnnouncement({
    required String organizationId,
    required CreateOrganizationAnnouncementCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/announcements',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationAnnouncementSummary>.fromJson(
      readJsonObject(response.data),
      (value) =>
          OrganizationAnnouncementSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class CreateOrganizationAnnouncementCommand {
  const CreateOrganizationAnnouncementCommand({
    required this.title,
    required this.body,
    this.titleAr,
    this.bodyAr,
    this.roomId,
    this.audience = 'organization',
    this.pinned = false,
    this.publishedAt,
  });

  final String title;
  final String body;
  final String? titleAr;
  final String? bodyAr;
  final String? roomId;
  final String audience;
  final bool pinned;
  final String? publishedAt;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'title': title.trim(),
      'body': body.trim(),
      'audience': audience,
      'pinned': pinned,
      if (_hasText(titleAr)) 'titleAr': titleAr!.trim(),
      if (_hasText(bodyAr)) 'bodyAr': bodyAr!.trim(),
      if (_hasText(roomId)) 'roomId': roomId!.trim(),
      if (_hasText(publishedAt)) 'publishedAt': publishedAt!.trim(),
    };
  }
}

class OrganizationAnnouncementSummary {
  const OrganizationAnnouncementSummary({
    required this.id,
    required this.title,
    required this.body,
    required this.audience,
    required this.pinned,
    this.titleAr,
    this.bodyAr,
    this.roomId,
    this.publishedAt,
    this.createdAt,
  });

  factory OrganizationAnnouncementSummary.fromJson(Map<String, Object?> json) {
    return OrganizationAnnouncementSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      body: _readString(json, 'body'),
      bodyAr: _readNullableString(json, 'bodyAr', snakeKey: 'body_ar'),
      roomId: _readNullableString(json, 'roomId', snakeKey: 'room_id'),
      audience: _readString(json, 'audience', fallback: 'organization'),
      pinned: _readBool(json, 'pinned'),
      publishedAt: _readNullableString(
        json,
        'publishedAt',
        snakeKey: 'published_at',
      ),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String title;
  final String body;
  final String? titleAr;
  final String? bodyAr;
  final String? roomId;
  final String audience;
  final bool pinned;
  final String? publishedAt;
  final String? createdAt;

  bool get isRoomAnnouncement => roomId != null && roomId!.isNotEmpty;
}

String _readString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  String fallback = '',
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value == null) {
    return fallback;
  }

  return value.toString();
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  return value?.toString();
}

bool _readBool(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }

  return value?.toString().toLowerCase() == 'true';
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
