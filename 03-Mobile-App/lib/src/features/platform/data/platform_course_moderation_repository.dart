import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformCourseModerationRepositoryProvider =
    Provider<PlatformCourseModerationRepository>((ref) {
  return PlatformCourseModerationRepository(dio: ref.watch(dioProvider));
});

class PlatformCourseModerationRepository {
  const PlatformCourseModerationRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<PlatformCourseModerationSummary>> listCourses({
    String status = 'pending_review',
    int perPage = 30,
  }) async {
    final response = await _dio.get<Object?>(
      '/admin/courses',
      queryParameters: <String, Object?>{
        'status': status,
        'perPage': perPage,
      },
    );
    final envelope =
        ApiEnvelope<List<PlatformCourseModerationSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(PlatformCourseModerationSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<PlatformCourseModerationSummary> approveCourse({
    required String courseId,
    String? note,
  }) {
    return _moderate(
      path: '/admin/courses/$courseId/approve',
      note: note,
    );
  }

  Future<PlatformCourseModerationSummary> rejectCourse({
    required String courseId,
    required String note,
  }) {
    return _moderate(
      path: '/admin/courses/$courseId/reject',
      note: note,
    );
  }

  Future<PlatformCourseModerationSummary> _moderate({
    required String path,
    String? note,
  }) async {
    final response = await _dio.post<Object?>(
      path,
      data: <String, Object?>{
        if (_hasText(note)) 'note': note!.trim(),
      },
    );
    final envelope = ApiEnvelope<PlatformCourseModerationSummary>.fromJson(
      readJsonObject(response.data),
      (value) => PlatformCourseModerationSummary.fromJson(
        readJsonObject(value),
      ),
    );

    return envelope.data;
  }
}

class PlatformCourseModerationSummary {
  const PlatformCourseModerationSummary({
    required this.id,
    required this.title,
    required this.status,
    required this.organizationName,
    this.shortDescription,
    this.subject,
    this.deliveryType,
    this.priceMinor,
    this.currency,
    this.sessions,
    this.moderationNote,
  });

  factory PlatformCourseModerationSummary.fromJson(
    Map<String, Object?> json,
  ) {
    final organization = _readObject(json['organization']);

    return PlatformCourseModerationSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title', fallback: _readString(json, 'name')),
      status: _readString(json, 'status', fallback: 'pending_review'),
      organizationName: _readString(organization, 'name'),
      shortDescription: _readNullableString(
        json,
        'shortDescription',
        snakeKey: 'short_description',
      ),
      subject: _readNullableString(json, 'subject'),
      deliveryType: _readNullableString(
        json,
        'deliveryType',
        snakeKey: 'delivery_type',
      ),
      priceMinor: _readNullableInt(
        json,
        'priceMinor',
        snakeKey: 'price_minor',
      ),
      currency: _readNullableString(json, 'currency'),
      sessions: _readNullableInt(json, 'sessions'),
      moderationNote: _readNullableString(
        json,
        'moderationNote',
        snakeKey: 'moderation_note',
      ),
    );
  }

  final String id;
  final String title;
  final String status;
  final String organizationName;
  final String? shortDescription;
  final String? subject;
  final String? deliveryType;
  final int? priceMinor;
  final String? currency;
  final int? sessions;
  final String? moderationNote;
}

class PlatformCourseModerationCommand {
  const PlatformCourseModerationCommand({
    required this.courseId,
    this.note,
  });

  final String courseId;
  final String? note;
}

Map<String, Object?> _readObject(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return const <String, Object?>{};
}

String _readString(
  Map<String, Object?> json,
  String key, {
  String fallback = '',
}) {
  return json[key]?.toString() ?? fallback;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);

  return value?.toString();
}

int? _readNullableInt(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '');
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
