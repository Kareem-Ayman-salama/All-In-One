import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationEventRepositoryProvider =
    Provider<OrganizationEventRepository>((ref) {
  return OrganizationEventRepository(dio: ref.watch(dioProvider));
});

class OrganizationEventRepository {
  const OrganizationEventRepository({
    required Dio dio,
  }) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationEventSummary>> listEvents({
    required String organizationId,
    String? from,
    String? to,
    String? roomId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/events',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(from)) 'from': from,
        if (_hasText(to)) 'to': to,
        if (_hasText(roomId)) 'roomId': roomId,
      },
    );
    final envelope = ApiEnvelope<List<OrganizationEventSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(value)
          .map(OrganizationEventSummary.fromJson)
          .toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationEventSummary> createEvent({
    required String organizationId,
    required CreateOrganizationEventCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/events',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationEventSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationEventSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> deleteEvent({
    required String organizationId,
    required String eventId,
  }) async {
    await _dio.delete<Object?>('/organizations/$organizationId/events/$eventId');
  }
}

class CreateOrganizationEventCommand {
  const CreateOrganizationEventCommand({
    required this.title,
    required this.startsAt,
    required this.endsAt,
    this.titleAr,
    this.description,
    this.roomId,
    this.type = 'meeting',
    this.location,
    this.meetingProvider,
    this.meetingReference,
    this.status = 'scheduled',
  });

  final String title;
  final String startsAt;
  final String endsAt;
  final String? titleAr;
  final String? description;
  final String? roomId;
  final String type;
  final String? location;
  final String? meetingProvider;
  final String? meetingReference;
  final String status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'title': title.trim(),
      'startsAt': startsAt.trim(),
      'endsAt': endsAt.trim(),
      'type': type,
      'status': status,
      if (_hasText(titleAr)) 'titleAr': titleAr!.trim(),
      if (_hasText(description)) 'description': description!.trim(),
      if (_hasText(roomId)) 'roomId': roomId!.trim(),
      if (_hasText(location)) 'location': location!.trim(),
      if (_hasText(meetingProvider)) 'meetingProvider': meetingProvider,
      if (_hasText(meetingReference)) 'meetingReference': meetingReference,
    };
  }
}

class OrganizationEventSummary {
  const OrganizationEventSummary({
    required this.id,
    required this.title,
    required this.type,
    required this.startsAt,
    required this.endsAt,
    required this.status,
    this.titleAr,
    this.description,
    this.roomId,
    this.location,
    this.meetingProvider,
    this.createdAt,
  });

  factory OrganizationEventSummary.fromJson(Map<String, Object?> json) {
    return OrganizationEventSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      description: _readNullableString(json, 'description'),
      roomId: _readNullableString(json, 'roomId', snakeKey: 'room_id'),
      type: _readString(json, 'type', fallback: 'event'),
      startsAt: _readString(json, 'startsAt', snakeKey: 'starts_at'),
      endsAt: _readString(json, 'endsAt', snakeKey: 'ends_at'),
      location: _readNullableString(json, 'location'),
      meetingProvider: _readNullableString(
        json,
        'meetingProvider',
        snakeKey: 'meeting_provider',
      ),
      status: _readString(json, 'status', fallback: 'scheduled'),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String title;
  final String type;
  final String startsAt;
  final String endsAt;
  final String status;
  final String? titleAr;
  final String? description;
  final String? roomId;
  final String? location;
  final String? meetingProvider;
  final String? createdAt;

  bool get isScheduled => status == 'scheduled';
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
