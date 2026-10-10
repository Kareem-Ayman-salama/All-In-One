import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationRoomRepositoryProvider = Provider<OrganizationRoomRepository>(
  (ref) {
    return OrganizationRoomRepository(dio: ref.watch(dioProvider));
  },
);

class OrganizationRoomRepository {
  const OrganizationRoomRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationRoomSummary>> listRooms({
    required String organizationId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/rooms',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope = ApiEnvelope<List<OrganizationRoomSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationRoomSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationRoomSummary> createRoom({
    required String organizationId,
    required CreateOrganizationRoomCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/rooms',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationRoomSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationRoomSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationRoomSummary> updateRoom({
    required String organizationId,
    required String roomId,
    required UpdateOrganizationRoomCommand command,
  }) async {
    final response = await _dio.patch<Object?>(
      '/organizations/$organizationId/rooms/$roomId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationRoomSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationRoomSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> deleteRoom({
    required String organizationId,
    required String roomId,
  }) async {
    await _dio.delete<Object?>('/organizations/$organizationId/rooms/$roomId');
  }

  Future<List<OrganizationRoomMemberSummary>> listRoomMembers({
    required String organizationId,
    required String roomId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/rooms/$roomId/members',
      queryParameters: <String, Object?>{'perPage': perPage},
    );
    final envelope = ApiEnvelope<List<OrganizationRoomMemberSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationRoomMemberSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationRoomMemberSummary> addRoomMember({
    required String organizationId,
    required String roomId,
    required CreateRoomMemberCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/rooms/$roomId/members',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationRoomMemberSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationRoomMemberSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationRoomMemberSummary> updateRoomMember({
    required String organizationId,
    required String roomId,
    required String roomMembershipId,
    required UpdateRoomMemberCommand command,
  }) async {
    final response = await _dio.patch<Object?>(
      '/organizations/$organizationId/rooms/$roomId/members/$roomMembershipId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationRoomMemberSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationRoomMemberSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> removeRoomMember({
    required String organizationId,
    required String roomId,
    required String roomMembershipId,
  }) async {
    await _dio.delete<Object?>(
      '/organizations/$organizationId/rooms/$roomId/members/$roomMembershipId',
    );
  }
}

class CreateOrganizationRoomCommand {
  const CreateOrganizationRoomCommand({
    required this.name,
    this.description,
    this.accessType = 'read_only',
    this.status = 'active',
  });

  final String name;
  final String? description;
  final String accessType;
  final String status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'name': name.trim(),
      'accessType': accessType,
      'status': status,
      if (_hasText(description)) 'description': description!.trim(),
    };
  }
}

class UpdateOrganizationRoomCommand {
  const UpdateOrganizationRoomCommand({
    this.name,
    this.description,
    this.accessType,
    this.status,
  });

  final String? name;
  final String? description;
  final String? accessType;
  final String? status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(name)) 'name': name!.trim(),
      'description': description?.trim(),
      if (_hasText(accessType)) 'accessType': accessType,
      if (_hasText(status)) 'status': status,
    };
  }
}

class CreateRoomMemberCommand {
  const CreateRoomMemberCommand({required this.userId, this.role = 'member'});

  final String userId;
  final String role;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'userId': userId,
      'role': role,
    };
  }
}

class UpdateRoomMemberCommand {
  const UpdateRoomMemberCommand({this.role, this.status});

  final String? role;
  final String? status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(role)) 'role': role,
      if (_hasText(status)) 'status': status,
    };
  }
}

class OrganizationRoomSummary {
  const OrganizationRoomSummary({
    required this.id,
    required this.name,
    required this.slug,
    required this.accessType,
    required this.status,
    required this.membershipsCount,
    this.description,
    this.createdAt,
  });

  factory OrganizationRoomSummary.fromJson(Map<String, Object?> json) {
    return OrganizationRoomSummary(
      id: _readString(json, 'id'),
      name: _readString(json, 'name'),
      slug: _readString(json, 'slug'),
      description: _readNullableString(json, 'description'),
      accessType: _readString(
        json,
        'accessType',
        snakeKey: 'access_type',
        fallback: 'read_only',
      ),
      status: _readString(json, 'status', fallback: 'active'),
      membershipsCount: _readInt(
        json,
        'membershipsCount',
        snakeKey: 'memberships_count',
      ),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String name;
  final String slug;
  final String accessType;
  final String status;
  final int membershipsCount;
  final String? description;
  final String? createdAt;

  bool get isActive => status == 'active';
}

class OrganizationRoomMemberSummary {
  const OrganizationRoomMemberSummary({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    required this.role,
    required this.status,
    this.joinedAt,
  });

  factory OrganizationRoomMemberSummary.fromJson(Map<String, Object?> json) {
    final user = _readObject(json, 'user');

    return OrganizationRoomMemberSummary(
      id: _readString(json, 'id'),
      userId: _readString(json, 'userId', snakeKey: 'user_id'),
      name: _readString(user, 'name'),
      email: _readString(user, 'email'),
      role: _readString(json, 'role', fallback: 'member'),
      status: _readString(json, 'status', fallback: 'active'),
      joinedAt: _readNullableString(json, 'joinedAt', snakeKey: 'joined_at'),
    );
  }

  final String id;
  final String userId;
  final String name;
  final String email;
  final String role;
  final String status;
  final String? joinedAt;

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
