import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationInvitationRepositoryProvider =
    Provider<OrganizationInvitationRepository>((ref) {
      return OrganizationInvitationRepository(dio: ref.watch(dioProvider));
    });

class OrganizationInvitationRepository {
  const OrganizationInvitationRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationInvitationSummary>> listInvitations({
    required String organizationId,
    String? status,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/invitations',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(status)) 'status': status,
      },
    );
    final envelope = ApiEnvelope<List<OrganizationInvitationSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationInvitationSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationInvitationCommandResult> createInvitation({
    required String organizationId,
    required CreateOrganizationInvitationCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/invitations',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationInvitationCommandResult>.fromJson(
      readJsonObject(response.data),
      (value) =>
          OrganizationInvitationCommandResult.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationInvitationCommandResult> resendInvitation({
    required String organizationId,
    required String invitationId,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/invitations/$invitationId/resend',
      data: const <String, Object?>{},
    );
    final envelope = ApiEnvelope<OrganizationInvitationCommandResult>.fromJson(
      readJsonObject(response.data),
      (value) =>
          OrganizationInvitationCommandResult.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationInvitationSummary> cancelInvitation({
    required String organizationId,
    required String invitationId,
  }) async {
    final response = await _dio.delete<Object?>(
      '/organizations/$organizationId/invitations/$invitationId',
    );
    final envelope = ApiEnvelope<OrganizationInvitationSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationInvitationSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }
}

class CreateOrganizationInvitationCommand {
  const CreateOrganizationInvitationCommand({
    required this.email,
    required this.role,
    this.phone,
    this.roomIds = const <String>[],
    this.note,
    this.expiresInDays = 7,
  });

  final String email;
  final String role;
  final String? phone;
  final List<String> roomIds;
  final String? note;
  final int expiresInDays;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'email': email.trim().toLowerCase(),
      'role': role,
      'roomIds': roomIds,
      'expiresInDays': expiresInDays,
      if (_hasText(phone)) 'phone': phone!.trim(),
      if (_hasText(note)) 'note': note!.trim(),
    };
  }
}

class OrganizationInvitationCommandResult {
  const OrganizationInvitationCommandResult({
    required this.invitation,
    required this.acceptUrl,
    this.token,
  });

  factory OrganizationInvitationCommandResult.fromJson(
    Map<String, Object?> json,
  ) {
    return OrganizationInvitationCommandResult(
      invitation: OrganizationInvitationSummary.fromJson(
        readJsonObject(json['invitation']),
      ),
      acceptUrl: _readString(json, 'acceptUrl'),
      token: _readNullableString(json, 'token'),
    );
  }

  final OrganizationInvitationSummary invitation;
  final String acceptUrl;
  final String? token;
}

class OrganizationInvitationSummary {
  const OrganizationInvitationSummary({
    required this.id,
    required this.email,
    required this.status,
    this.phone,
    this.note,
    this.expiresAt,
    this.acceptedAt,
    this.createdAt,
    this.roomIds = const <String>[],
  });

  factory OrganizationInvitationSummary.fromJson(Map<String, Object?> json) {
    return OrganizationInvitationSummary(
      id: _readString(json, 'id'),
      email: _readString(json, 'email'),
      phone: _readNullableString(json, 'phone'),
      note: _readNullableString(json, 'note'),
      status: _readString(json, 'status', fallback: 'pending'),
      expiresAt: _readNullableString(json, 'expiresAt', snakeKey: 'expires_at'),
      acceptedAt: _readNullableString(
        json,
        'acceptedAt',
        snakeKey: 'accepted_at',
      ),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
      roomIds: _readStringList(json['roomIds'] ?? json['room_ids']),
    );
  }

  final String id;
  final String email;
  final String status;
  final String? phone;
  final String? note;
  final String? expiresAt;
  final String? acceptedAt;
  final String? createdAt;
  final List<String> roomIds;

  bool get isPending => status == 'pending';
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

List<String> _readStringList(Object? value) {
  if (value is! List) {
    return const <String>[];
  }

  return value.map((item) => item.toString()).toList(growable: false);
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
