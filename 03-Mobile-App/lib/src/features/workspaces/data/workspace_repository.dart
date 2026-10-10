import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final workspaceRepositoryProvider = Provider<WorkspaceRepository>((ref) {
  return WorkspaceRepository(dio: ref.watch(dioProvider));
});

class WorkspaceRepository {
  const WorkspaceRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<WorkspaceSummary>> listWorkspaces() async {
    final response = await _dio.get<Object?>('/workspaces');
    final envelope = ApiEnvelope<List<WorkspaceSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(WorkspaceSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<Map<String, Object?>> getContext(String organizationId) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/context',
    );
    final envelope = ApiEnvelope<Map<String, Object?>>.fromJson(
      readJsonObject(response.data),
      readJsonObject,
    );

    return envelope.data;
  }

  Future<Map<String, Object?>> updateOrganization({
    required String organizationId,
    required UpdateOrganizationCommand command,
  }) async {
    final response = await _dio.patch<Object?>(
      '/organizations/$organizationId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<Map<String, Object?>>.fromJson(
      readJsonObject(response.data),
      readJsonObject,
    );

    return envelope.data;
  }
}

class UpdateOrganizationCommand {
  const UpdateOrganizationCommand({
    this.name,
    this.bio,
    this.brandColor,
    this.locale,
    this.timezone,
  });

  final String? name;
  final String? bio;
  final String? brandColor;
  final String? locale;
  final String? timezone;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(name)) 'name': name!.trim(),
      if (bio != null) 'bio': _emptyToNull(bio),
      if (brandColor != null) 'brandColor': _emptyToNull(brandColor),
      if (_hasText(locale)) 'locale': locale,
      if (_hasText(timezone)) 'timezone': timezone!.trim(),
    };
  }
}

class WorkspaceSummary {
  const WorkspaceSummary({
    required this.organizationId,
    required this.name,
    required this.role,
    this.subscription,
  });

  factory WorkspaceSummary.fromJson(Map<String, Object?> json) {
    final organization = readJsonObject(json['organization']);

    return WorkspaceSummary(
      organizationId: organization['id'].toString(),
      name: organization['name'] as String? ?? '',
      role: json['role'] as String? ?? '',
      subscription: WorkspaceSubscriptionSummary.fromNullableJson(
        json['subscription'],
      ),
    );
  }

  final String organizationId;
  final String name;
  final String role;
  final WorkspaceSubscriptionSummary? subscription;
}

class WorkspaceSubscriptionSummary {
  const WorkspaceSubscriptionSummary({
    required this.id,
    required this.status,
    required this.billingInterval,
    required this.plan,
    this.currentPeriodEndsAt,
  });

  factory WorkspaceSubscriptionSummary.fromJson(Map<String, Object?> json) {
    return WorkspaceSubscriptionSummary(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? 'none',
      billingInterval: json['billingInterval']?.toString() ?? 'monthly',
      currentPeriodEndsAt: DateTime.tryParse(
        json['currentPeriodEndsAt']?.toString() ?? '',
      ),
      plan: WorkspacePlanSummary.fromJson(readJsonObject(json['plan'])),
    );
  }

  static WorkspaceSubscriptionSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }

    return WorkspaceSubscriptionSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String status;
  final String billingInterval;
  final DateTime? currentPeriodEndsAt;
  final WorkspacePlanSummary plan;

  bool get isActiveLike {
    if (!const <String>{'active', 'trial', 'grace'}.contains(status)) {
      return false;
    }
    final periodEnd = currentPeriodEndsAt;
    if (periodEnd == null) {
      return true;
    }

    return !periodEnd.isBefore(DateTime.now());
  }

  bool get isExpired {
    final periodEnd = currentPeriodEndsAt;

    return periodEnd != null && periodEnd.isBefore(DateTime.now());
  }

  int? get daysRemaining {
    final periodEnd = currentPeriodEndsAt;
    if (periodEnd == null) {
      return null;
    }

    return periodEnd.difference(DateTime.now()).inDays.clamp(0, 9999).toInt();
  }

  bool get needsAttention {
    final remaining = daysRemaining;

    return !isActiveLike || isExpired || (remaining != null && remaining <= 7);
  }
}

class WorkspacePlanSummary {
  const WorkspacePlanSummary({
    required this.code,
    required this.name,
    required this.currency,
    required this.modules,
    this.monthlyPriceMinor,
    this.yearlyPriceMinor,
  });

  factory WorkspacePlanSummary.fromJson(Map<String, Object?> json) {
    final modules = json['modules'];

    return WorkspacePlanSummary(
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      monthlyPriceMinor: _readNullableInt(json['monthlyPriceMinor']),
      yearlyPriceMinor: _readNullableInt(json['yearlyPriceMinor']),
      currency: json['currency']?.toString() ?? '',
      modules: modules is List
          ? modules
              .whereType<Map<String, Object?>>()
              .map(
                (module) => WorkspacePlanModuleSummary.fromJson(
                  module,
                ),
              )
              .toList(growable: false)
          : const <WorkspacePlanModuleSummary>[],
    );
  }

  final String code;
  final String name;
  final int? monthlyPriceMinor;
  final int? yearlyPriceMinor;
  final String currency;
  final List<WorkspacePlanModuleSummary> modules;
}

class WorkspacePlanModuleSummary {
  const WorkspacePlanModuleSummary({
    required this.module,
    required this.enabled,
    this.limit,
  });

  factory WorkspacePlanModuleSummary.fromJson(Map<String, Object?> json) {
    return WorkspacePlanModuleSummary(
      module: json['module']?.toString() ?? '',
      enabled: json['enabled'] != false,
      limit: _readNullableInt(json['limit']),
    );
  }

  final String module;
  final bool enabled;
  final int? limit;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

String? _emptyToNull(String? value) {
  final trimmed = value?.trim();
  return trimmed == null || trimmed.isEmpty ? null : trimmed;
}

int? _readNullableInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '');
}
