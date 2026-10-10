import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationPromotionRepositoryProvider =
    Provider<OrganizationPromotionRepository>((ref) {
  return OrganizationPromotionRepository(dio: ref.watch(dioProvider));
});

class OrganizationPromotionRepository {
  const OrganizationPromotionRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationPromotionSummary>> listPromotions({
    required String organizationId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/promotions',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope = ApiEnvelope<List<OrganizationPromotionSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(OrganizationPromotionSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationPromotionSummary> createPromotion({
    required String organizationId,
    required CreateOrganizationPromotionCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/promotions',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationPromotionSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationPromotionSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class CreateOrganizationPromotionCommand {
  const CreateOrganizationPromotionCommand({
    required this.type,
    required this.placement,
    required this.startDate,
    required this.endDate,
    this.courseId,
    this.destinationUrl,
  });

  final String type;
  final String placement;
  final String startDate;
  final String endDate;
  final String? courseId;
  final String? destinationUrl;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'type': type,
      'placement': placement,
      'startDate': startDate,
      'endDate': endDate,
      if (_hasText(courseId)) 'courseId': courseId,
      if (_hasText(destinationUrl)) 'destinationUrl': destinationUrl!.trim(),
    };
  }
}

class OrganizationPromotionSummary {
  const OrganizationPromotionSummary({
    required this.id,
    required this.type,
    required this.placement,
    required this.status,
    required this.paymentStatus,
    required this.priceMinor,
    required this.currency,
    required this.impressions,
    required this.clicks,
    required this.bookingConversions,
    this.courseId,
    this.startDate,
    this.endDate,
    this.destinationUrl,
    this.course,
  });

  factory OrganizationPromotionSummary.fromJson(Map<String, Object?> json) {
    final course = _readOptionalObject(json['course']);

    return OrganizationPromotionSummary(
      id: _readString(json, 'id'),
      courseId: _readNullableString(json, 'courseId', snakeKey: 'course_id'),
      type: _readString(json, 'type', fallback: 'featured_course'),
      placement: _readString(json, 'placement', fallback: 'homepage'),
      startDate: _readNullableString(json, 'startDate', snakeKey: 'start_date'),
      endDate: _readNullableString(json, 'endDate', snakeKey: 'end_date'),
      destinationUrl: _readNullableString(
        json,
        'destinationUrl',
        snakeKey: 'destination_url',
      ),
      status: _readString(json, 'status', fallback: 'pending_approval'),
      paymentStatus: _readString(
        json,
        'paymentStatus',
        snakeKey: 'payment_status',
        fallback: 'unpaid',
      ),
      priceMinor: _readInt(json, 'priceMinor', snakeKey: 'price_minor'),
      currency: _readString(json, 'currency', fallback: 'EGP'),
      impressions: _readInt(json, 'impressions'),
      clicks: _readInt(json, 'clicks'),
      bookingConversions: _readInt(
        json,
        'bookingConversions',
        snakeKey: 'booking_conversions',
      ),
      course: PromotionCourseSummary.fromNullableJson(course),
    );
  }

  final String id;
  final String? courseId;
  final String type;
  final String placement;
  final String? startDate;
  final String? endDate;
  final String? destinationUrl;
  final String status;
  final String paymentStatus;
  final int priceMinor;
  final String currency;
  final int impressions;
  final int clicks;
  final int bookingConversions;
  final PromotionCourseSummary? course;
}

class PromotionCourseSummary {
  const PromotionCourseSummary({
    required this.id,
    required this.title,
    this.titleAr,
    this.slug,
  });

  factory PromotionCourseSummary.fromJson(Map<String, Object?> json) {
    return PromotionCourseSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      slug: _readNullableString(json, 'slug'),
    );
  }

  static PromotionCourseSummary? fromNullableJson(Object? value) {
    final json = _readNullableObject(value);
    return json == null ? null : PromotionCourseSummary.fromJson(json);
  }

  final String id;
  final String title;
  final String? titleAr;
  final String? slug;

  String localizedTitle(bool isArabic) {
    return isArabic && _hasText(titleAr) ? titleAr! : title;
  }
}

Map<String, Object?> _readOptionalObject(Object? value) {
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return const <String, Object?>{};
}

Map<String, Object?>? _readNullableObject(Object? value) {
  if (value == null) {
    return null;
  }
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return null;
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

int _readInt(Map<String, Object?> json, String key, {String? snakeKey}) {
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
