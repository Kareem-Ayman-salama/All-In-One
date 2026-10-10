import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationAnalyticsRepositoryProvider =
    Provider<OrganizationAnalyticsRepository>((ref) {
  return OrganizationAnalyticsRepository(dio: ref.watch(dioProvider));
});

class OrganizationAnalyticsRepository {
  const OrganizationAnalyticsRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<OrganizationAnalyticsOverview> getOverview({
    required String organizationId,
    String? from,
    String? to,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/analytics/overview',
      queryParameters: <String, Object?>{
        if (_hasText(from)) 'from': from,
        if (_hasText(to)) 'to': to,
      },
    );
    final envelope = ApiEnvelope<OrganizationAnalyticsOverview>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationAnalyticsOverview.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class OrganizationAnalyticsOverview {
  const OrganizationAnalyticsOverview({
    required this.range,
    required this.metrics,
  });

  factory OrganizationAnalyticsOverview.fromJson(Map<String, Object?> json) {
    return OrganizationAnalyticsOverview(
      range: OrganizationAnalyticsRange.fromJson(_readObject(json['range'])),
      metrics: OrganizationAnalyticsMetrics.fromJson(
        _readObject(json['metrics']),
      ),
    );
  }

  final OrganizationAnalyticsRange range;
  final OrganizationAnalyticsMetrics metrics;
}

class OrganizationAnalyticsRange {
  const OrganizationAnalyticsRange({this.from, this.to});

  factory OrganizationAnalyticsRange.fromJson(Map<String, Object?> json) {
    return OrganizationAnalyticsRange(
      from: _readNullableString(json, 'from'),
      to: _readNullableString(json, 'to'),
    );
  }

  final String? from;
  final String? to;
}

class OrganizationAnalyticsMetrics {
  const OrganizationAnalyticsMetrics({
    required this.rooms,
    required this.members,
    required this.publishedCourses,
    required this.activeBatches,
    required this.bookings,
    required this.confirmedBookings,
    required this.bookingConversionRate,
    required this.activeEnrollments,
    required this.expiringSubscriptions,
    required this.confirmedRevenueMinor,
  });

  factory OrganizationAnalyticsMetrics.fromJson(Map<String, Object?> json) {
    return OrganizationAnalyticsMetrics(
      rooms: _readInt(json, 'rooms'),
      members: _readInt(json, 'members'),
      publishedCourses: _readInt(json, 'publishedCourses'),
      activeBatches: _readInt(json, 'activeBatches'),
      bookings: _readInt(json, 'bookings'),
      confirmedBookings: _readInt(json, 'confirmedBookings'),
      bookingConversionRate: _readDouble(json, 'bookingConversionRate'),
      activeEnrollments: _readInt(json, 'activeEnrollments'),
      expiringSubscriptions: _readInt(json, 'expiringSubscriptions'),
      confirmedRevenueMinor: _readInt(json, 'confirmedRevenueMinor'),
    );
  }

  final int rooms;
  final int members;
  final int publishedCourses;
  final int activeBatches;
  final int bookings;
  final int confirmedBookings;
  final double bookingConversionRate;
  final int activeEnrollments;
  final int expiringSubscriptions;
  final int confirmedRevenueMinor;
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

String? _readNullableString(Map<String, Object?> json, String key) {
  return json[key]?.toString();
}

int _readInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _readDouble(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
