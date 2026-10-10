import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformOverviewRepositoryProvider =
    Provider<PlatformOverviewRepository>((ref) {
  return PlatformOverviewRepository(dio: ref.watch(dioProvider));
});

class PlatformOverviewRepository {
  const PlatformOverviewRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<PlatformAnalyticsOverview> getAnalyticsOverview() async {
    final response = await _dio.get<Object?>('/admin/analytics/overview');
    final envelope = ApiEnvelope<PlatformAnalyticsOverview>.fromJson(
      readJsonObject(response.data),
      (value) => PlatformAnalyticsOverview.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<List<PlatformOrganizationSummary>> listOrganizations({
    String? status,
    int perPage = 10,
  }) async {
    final response = await _dio.get<Object?>(
      '/admin/organizations',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(status)) 'status': status,
      },
    );
    final envelope = ApiEnvelope<List<PlatformOrganizationSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(PlatformOrganizationSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }
}

class PlatformAnalyticsOverview {
  const PlatformAnalyticsOverview({required this.metrics});

  factory PlatformAnalyticsOverview.fromJson(Map<String, Object?> json) {
    return PlatformAnalyticsOverview(
      metrics: PlatformAnalyticsMetrics.fromJson(
        _readObject(json['metrics']),
      ),
    );
  }

  final PlatformAnalyticsMetrics metrics;
}

class PlatformAnalyticsMetrics {
  const PlatformAnalyticsMetrics({
    required this.organizations,
    required this.activeOrganizations,
    required this.memberships,
    required this.publishedCourses,
    required this.bookings,
    required this.confirmedBookings,
    required this.confirmedRevenueMinor,
    required this.expiringOrganizationSubscriptions,
    required this.activeEnrollments,
  });

  factory PlatformAnalyticsMetrics.fromJson(Map<String, Object?> json) {
    return PlatformAnalyticsMetrics(
      organizations: _readInt(json, 'organizations'),
      activeOrganizations: _readInt(json, 'activeOrganizations'),
      memberships: _readInt(json, 'memberships'),
      publishedCourses: _readInt(json, 'publishedCourses'),
      bookings: _readInt(json, 'bookings'),
      confirmedBookings: _readInt(json, 'confirmedBookings'),
      confirmedRevenueMinor: _readInt(json, 'confirmedRevenueMinor'),
      expiringOrganizationSubscriptions: _readInt(
        json,
        'expiringOrganizationSubscriptions',
      ),
      activeEnrollments: _readInt(json, 'activeEnrollments'),
    );
  }

  final int organizations;
  final int activeOrganizations;
  final int memberships;
  final int publishedCourses;
  final int bookings;
  final int confirmedBookings;
  final int confirmedRevenueMinor;
  final int expiringOrganizationSubscriptions;
  final int activeEnrollments;
}

class PlatformOrganizationSummary {
  const PlatformOrganizationSummary({
    required this.id,
    required this.name,
    required this.slug,
    required this.type,
    required this.status,
    required this.membershipsCount,
    required this.roomsCount,
    required this.coursesCount,
    this.subscription,
  });

  factory PlatformOrganizationSummary.fromJson(Map<String, Object?> json) {
    return PlatformOrganizationSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name'),
      slug: _readString(json, 'slug'),
      type: _readString(json, 'type'),
      status: _readString(json, 'status', fallback: 'active'),
      membershipsCount:
          _readInt(json, 'membershipsCount', snakeKey: 'memberships_count'),
      roomsCount: _readInt(json, 'roomsCount', snakeKey: 'rooms_count'),
      coursesCount: _readInt(json, 'coursesCount', snakeKey: 'courses_count'),
      subscription: PlatformOrganizationSubscription.fromNullableJson(
        _readFirstListObject(json['subscriptions']),
      ),
    );
  }

  final String id;
  final String name;
  final String slug;
  final String type;
  final String status;
  final int membershipsCount;
  final int roomsCount;
  final int coursesCount;
  final PlatformOrganizationSubscription? subscription;
}

class PlatformOrganizationSubscription {
  const PlatformOrganizationSubscription({
    required this.status,
    required this.billingInterval,
    this.currentPeriodEndsAt,
    this.planName,
  });

  factory PlatformOrganizationSubscription.fromJson(
    Map<String, Object?> json,
  ) {
    final plan = _readObject(json['plan']);

    return PlatformOrganizationSubscription(
      status: _readString(json, 'status', fallback: 'none'),
      billingInterval: _readString(
        json,
        'billingInterval',
        snakeKey: 'billing_interval',
        fallback: 'monthly',
      ),
      currentPeriodEndsAt: _readNullableString(
        json,
        'currentPeriodEndsAt',
        snakeKey: 'current_period_ends_at',
      ),
      planName: _readNullableString(plan, 'name'),
    );
  }

  static PlatformOrganizationSubscription? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return PlatformOrganizationSubscription.fromJson(readJsonObject(value));
  }

  final String status;
  final String billingInterval;
  final String? currentPeriodEndsAt;
  final String? planName;
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

Map<String, Object?>? _readFirstListObject(Object? value) {
  if (value is! List || value.isEmpty) {
    return null;
  }

  return readJsonObject(value.first);
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
