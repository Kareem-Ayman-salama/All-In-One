import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformPromotionModerationRepositoryProvider =
    Provider<PlatformPromotionModerationRepository>((ref) {
  return PlatformPromotionModerationRepository(dio: ref.watch(dioProvider));
});

class PlatformPromotionModerationRepository {
  const PlatformPromotionModerationRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<PlatformPromotionModerationSummary>> listPromotions({
    String status = 'pending_approval',
    int perPage = 30,
  }) async {
    final response = await _dio.get<Object?>(
      '/admin/promotions',
      queryParameters: <String, Object?>{
        'status': status,
        'perPage': perPage,
      },
    );
    final envelope =
        ApiEnvelope<List<PlatformPromotionModerationSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(PlatformPromotionModerationSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<PlatformPromotionModerationSummary> approvePromotion({
    required String promotionId,
    String? note,
  }) {
    return _moderate(
      path: '/admin/promotions/$promotionId/approve',
      note: note,
    );
  }

  Future<PlatformPromotionModerationSummary> rejectPromotion({
    required String promotionId,
    required String note,
  }) {
    return _moderate(
      path: '/admin/promotions/$promotionId/reject',
      note: note,
    );
  }

  Future<PlatformPromotionModerationSummary> _moderate({
    required String path,
    String? note,
  }) async {
    final response = await _dio.post<Object?>(
      path,
      data: <String, Object?>{
        if (_hasText(note)) 'note': note!.trim(),
      },
    );
    final envelope = ApiEnvelope<PlatformPromotionModerationSummary>.fromJson(
      readJsonObject(response.data),
      (value) => PlatformPromotionModerationSummary.fromJson(
        readJsonObject(value),
      ),
    );

    return envelope.data;
  }
}

class PlatformPromotionModerationSummary {
  const PlatformPromotionModerationSummary({
    required this.id,
    required this.type,
    required this.placement,
    required this.status,
    required this.paymentStatus,
    required this.organizationName,
    required this.impressions,
    required this.clicks,
    required this.bookingConversions,
    this.courseTitle,
    this.startDate,
    this.endDate,
    this.destinationUrl,
    this.moderationNote,
  });

  factory PlatformPromotionModerationSummary.fromJson(
    Map<String, Object?> json,
  ) {
    final organization = _readObject(json['organization']);
    final course = _readObject(json['course']);

    return PlatformPromotionModerationSummary(
      id: _readString(json, 'id'),
      type: _readString(json, 'type', fallback: 'featured_course'),
      placement: _readString(json, 'placement', fallback: 'homepage'),
      status: _readString(json, 'status', fallback: 'pending_approval'),
      paymentStatus: _readString(
        json,
        'paymentStatus',
        snakeKey: 'payment_status',
        fallback: 'unpaid',
      ),
      organizationName: _readString(organization, 'name'),
      courseTitle: _readNullableString(course, 'title'),
      startDate: _readNullableString(json, 'startDate', snakeKey: 'start_date'),
      endDate: _readNullableString(json, 'endDate', snakeKey: 'end_date'),
      destinationUrl: _readNullableString(
        json,
        'destinationUrl',
        snakeKey: 'destination_url',
      ),
      impressions: _readInt(json, 'impressions'),
      clicks: _readInt(json, 'clicks'),
      bookingConversions: _readInt(
        json,
        'bookingConversions',
        snakeKey: 'booking_conversions',
      ),
      moderationNote: _readNullableString(
        json,
        'moderationNote',
        snakeKey: 'moderation_note',
      ),
    );
  }

  final String id;
  final String type;
  final String placement;
  final String status;
  final String paymentStatus;
  final String organizationName;
  final String? courseTitle;
  final String? startDate;
  final String? endDate;
  final String? destinationUrl;
  final int impressions;
  final int clicks;
  final int bookingConversions;
  final String? moderationNote;
}

class PlatformPromotionModerationCommand {
  const PlatformPromotionModerationCommand({
    required this.promotionId,
    this.note,
  });

  final String promotionId;
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
  String? snakeKey,
  String fallback = '',
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);

  return value?.toString() ?? fallback;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);

  return value?.toString();
}

int _readInt(
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

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
