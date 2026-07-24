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
    this.subscriptionState,
  });

  factory WorkspaceSummary.fromJson(Map<String, Object?> json) {
    final organization = readJsonObject(json['organization']);

    return WorkspaceSummary(
      organizationId: organization['id'].toString(),
      name: organization['name'] as String? ?? '',
      role: json['role'] as String? ?? '',
      subscriptionState: json['subscriptionState'] as String?,
    );
  }

  final String organizationId;
  final String name;
  final String role;
  final String? subscriptionState;
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

String? _emptyToNull(String? value) {
  final trimmed = value?.trim();
  return trimmed == null || trimmed.isEmpty ? null : trimmed;
}
