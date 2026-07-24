import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationMemberRepositoryProvider =
    Provider<OrganizationMemberRepository>((ref) {
  return OrganizationMemberRepository(dio: ref.watch(dioProvider));
});

class OrganizationMemberRepository {
  const OrganizationMemberRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationMemberSummary>> listMembers({
    required String organizationId,
    String? status,
    String? search,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/members',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(status)) 'status': status,
        if (_hasText(search)) 'search': search,
      },
    );
    final envelope = ApiEnvelope<List<OrganizationMemberSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(OrganizationMemberSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationMemberSummary> updateMember({
    required String organizationId,
    required String membershipId,
    required UpdateOrganizationMemberCommand command,
  }) async {
    final response = await _dio.patch<Object?>(
      '/organizations/$organizationId/members/$membershipId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationMemberSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationMemberSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> removeMember({
    required String organizationId,
    required String membershipId,
  }) async {
    await _dio.delete<Object?>(
      '/organizations/$organizationId/members/$membershipId',
    );
  }
}

class UpdateOrganizationMemberCommand {
  const UpdateOrganizationMemberCommand({
    this.role,
    this.status,
  });

  final String? role;
  final String? status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(role)) 'role': role,
      if (_hasText(status)) 'status': status,
    };
  }
}

class OrganizationMemberSummary {
  const OrganizationMemberSummary({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    this.avatarPath,
    this.joinedAt,
    this.suspendedAt,
    this.createdAt,
  });

  factory OrganizationMemberSummary.fromJson(Map<String, Object?> json) {
    final user = _readObject(json, 'user');
    final role = _readObject(json, 'role');

    return OrganizationMemberSummary(
      id: _readString(json, 'id'),
      userId: _readString(json, 'userId', snakeKey: 'user_id'),
      name: _readString(user, 'name'),
      email: _readString(user, 'email'),
      role: _readString(role, 'name', fallback: _readString(json, 'role')),
      status: _readString(json, 'status', fallback: 'active'),
      avatarPath: _readNullableString(
        user,
        'avatarPath',
        snakeKey: 'avatar_path',
      ),
      joinedAt: _readNullableString(json, 'joinedAt', snakeKey: 'joined_at'),
      suspendedAt: _readNullableString(
        json,
        'suspendedAt',
        snakeKey: 'suspended_at',
      ),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String userId;
  final String name;
  final String email;
  final String role;
  final String status;
  final String? avatarPath;
  final String? joinedAt;
  final String? suspendedAt;
  final String? createdAt;

  bool get isActive => status == 'active';
}

Map<String, Object?> _readObject(Map<String, Object?> json, String key) {
  final value = json[key];
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

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
