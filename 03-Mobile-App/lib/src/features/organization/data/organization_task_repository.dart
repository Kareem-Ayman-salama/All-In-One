import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationTaskRepositoryProvider = Provider<OrganizationTaskRepository>(
  (ref) {
    return OrganizationTaskRepository(dio: ref.watch(dioProvider));
  },
);

class OrganizationTaskRepository {
  const OrganizationTaskRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<OrganizationTaskSummary>> listTasks({
    required String organizationId,
    String? status,
    bool mine = false,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/tasks',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(status)) 'status': status,
        if (mine) 'mine': true,
      },
    );
    final envelope = ApiEnvelope<List<OrganizationTaskSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(OrganizationTaskSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<OrganizationTaskSummary> createTask({
    required String organizationId,
    required CreateOrganizationTaskCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/tasks',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationTaskSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationTaskSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<OrganizationTaskSummary> updateTask({
    required String organizationId,
    required String taskId,
    required UpdateOrganizationTaskCommand command,
  }) async {
    final response = await _dio.patch<Object?>(
      '/organizations/$organizationId/tasks/$taskId',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<OrganizationTaskSummary>.fromJson(
      readJsonObject(response.data),
      (value) => OrganizationTaskSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> deleteTask({
    required String organizationId,
    required String taskId,
  }) async {
    await _dio.delete<Object?>('/organizations/$organizationId/tasks/$taskId');
  }
}

class CreateOrganizationTaskCommand {
  const CreateOrganizationTaskCommand({
    required this.title,
    this.titleAr,
    this.description,
    this.roomId,
    this.assignedTo,
    this.dueAt,
    this.priority = 'medium',
    this.status = 'todo',
    this.progress = 0,
  });

  final String title;
  final String? titleAr;
  final String? description;
  final String? roomId;
  final String? assignedTo;
  final String? dueAt;
  final String priority;
  final String status;
  final int progress;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'title': title.trim(),
      'priority': priority,
      'status': status,
      'progress': progress,
      if (_hasText(titleAr)) 'titleAr': titleAr!.trim(),
      if (_hasText(description)) 'description': description!.trim(),
      if (_hasText(roomId)) 'roomId': roomId!.trim(),
      if (_hasText(assignedTo)) 'assignedTo': assignedTo!.trim(),
      if (_hasText(dueAt)) 'dueAt': dueAt!.trim(),
    };
  }
}

class UpdateOrganizationTaskCommand {
  const UpdateOrganizationTaskCommand({
    this.title,
    this.titleAr,
    this.description,
    this.roomId,
    this.assignedTo,
    this.dueAt,
    this.priority,
    this.status,
    this.progress,
  });

  final String? title;
  final String? titleAr;
  final String? description;
  final String? roomId;
  final String? assignedTo;
  final String? dueAt;
  final String? priority;
  final String? status;
  final int? progress;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      if (_hasText(title)) 'title': title!.trim(),
      if (_hasText(titleAr)) 'titleAr': titleAr!.trim(),
      if (_hasText(description)) 'description': description!.trim(),
      if (_hasText(roomId)) 'roomId': roomId!.trim(),
      if (_hasText(assignedTo)) 'assignedTo': assignedTo!.trim(),
      if (_hasText(dueAt)) 'dueAt': dueAt!.trim(),
      if (_hasText(priority)) 'priority': priority,
      if (_hasText(status)) 'status': status,
      if (progress != null) 'progress': progress,
    };
  }
}

class OrganizationTaskSummary {
  const OrganizationTaskSummary({
    required this.id,
    required this.title,
    required this.priority,
    required this.status,
    required this.progress,
    this.titleAr,
    this.description,
    this.roomId,
    this.assignedTo,
    this.dueAt,
    this.roomName,
    this.assigneeName,
    this.createdAt,
  });

  factory OrganizationTaskSummary.fromJson(Map<String, Object?> json) {
    final room = _readObject(json, 'room');
    final assignee = _readObject(json, 'assignee');

    return OrganizationTaskSummary(
      id: _readString(json, 'id'),
      title: _readString(json, 'title'),
      titleAr: _readNullableString(json, 'titleAr', snakeKey: 'title_ar'),
      description: _readNullableString(json, 'description'),
      roomId: _readNullableString(json, 'roomId', snakeKey: 'room_id'),
      assignedTo: _readNullableString(
        json,
        'assignedTo',
        snakeKey: 'assigned_to',
      ),
      dueAt: _readNullableString(json, 'dueAt', snakeKey: 'due_at'),
      priority: _readString(json, 'priority', fallback: 'medium'),
      status: _readString(json, 'status', fallback: 'todo'),
      progress: _readInt(json, 'progress'),
      roomName: _readNullableString(room, 'name'),
      assigneeName: _readNullableString(assignee, 'name'),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String title;
  final String priority;
  final String status;
  final int progress;
  final String? titleAr;
  final String? description;
  final String? roomId;
  final String? assignedTo;
  final String? dueAt;
  final String? roomName;
  final String? assigneeName;
  final String? createdAt;

  bool get isDone => status == 'done';
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

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
