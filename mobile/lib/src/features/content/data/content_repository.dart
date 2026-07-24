import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final contentRepositoryProvider = Provider<ContentRepository>((ref) {
  return ContentRepository(dio: ref.watch(dioProvider));
});

class ContentRepository {
  const ContentRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  Future<List<ContentItemSummary>> listContent({
    required String organizationId,
    String? roomId,
    int perPage = 100,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/content',
      queryParameters: <String, Object?>{
        'perPage': perPage,
        if (_hasText(roomId)) 'roomId': roomId,
      },
    );
    final envelope = ApiEnvelope<List<ContentItemSummary>>.fromJson(
      readJsonObject(response.data),
      (value) => readJsonObjectList(
        value,
      ).map(ContentItemSummary.fromJson).toList(growable: false),
    );

    return envelope.data;
  }

  Future<ContentItemSummary> createLinkContent({
    required String organizationId,
    required CreateLinkContentCommand command,
  }) async {
    final response = await _dio.post<Object?>(
      '/organizations/$organizationId/content',
      data: command.toJson(),
    );
    final envelope = ApiEnvelope<ContentItemSummary>.fromJson(
      readJsonObject(response.data),
      (value) => ContentItemSummary.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> deleteContent({
    required String organizationId,
    required String contentId,
  }) async {
    await _dio.delete<Object?>(
      '/organizations/$organizationId/content/$contentId',
    );
  }

  Future<ContentViewSession> getViewSession({
    required String organizationId,
    required String contentId,
  }) async {
    final response = await _dio.get<Object?>(
      '/organizations/$organizationId/content/$contentId/view-session',
    );
    final envelope = ApiEnvelope<ContentViewSession>.fromJson(
      readJsonObject(response.data),
      (value) => ContentViewSession.fromJson(readJsonObject(value)),
    );

    return envelope.data;
  }

  Future<void> recordViewerAudit({
    required String organizationId,
    required String contentId,
    required ContentViewerAuditEvent event,
  }) async {
    await _dio.post<Object?>(
      '/organizations/$organizationId/content/$contentId/viewer-audit',
      data: event.toJson(),
    );
  }
}

class CreateLinkContentCommand {
  const CreateLinkContentCommand({
    required this.roomId,
    required this.title,
    required this.externalUrl,
    this.description,
    this.downloadAllowed = false,
    this.watermarkEnabled = true,
    this.availableFrom,
    this.availableUntil,
    this.status = 'published',
  });

  final String roomId;
  final String title;
  final String externalUrl;
  final String? description;
  final bool downloadAllowed;
  final bool watermarkEnabled;
  final String? availableFrom;
  final String? availableUntil;
  final String status;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'roomId': roomId.trim(),
      'title': title.trim(),
      'type': 'link',
      'externalUrl': externalUrl.trim(),
      'downloadAllowed': downloadAllowed,
      'watermarkEnabled': watermarkEnabled,
      'status': status,
      if (_hasText(description)) 'description': description!.trim(),
      if (_hasText(availableFrom)) 'availableFrom': availableFrom!.trim(),
      if (_hasText(availableUntil)) 'availableUntil': availableUntil!.trim(),
    };
  }
}

class ContentItemSummary {
  const ContentItemSummary({
    required this.id,
    required this.organizationId,
    required this.roomId,
    required this.title,
    required this.type,
    required this.status,
    required this.downloadAllowed,
    required this.watermarkEnabled,
    this.description,
    this.externalUrl,
    this.fileAsset,
    this.createdAt,
  });

  factory ContentItemSummary.fromJson(Map<String, Object?> json) {
    return ContentItemSummary(
      id: _readString(json, 'id'),
      organizationId: _readString(
        json,
        'organizationId',
        snakeKey: 'organization_id',
      ),
      roomId: _readString(json, 'roomId', snakeKey: 'room_id'),
      title: _readString(json, 'title'),
      description: _readNullableString(json, 'description'),
      externalUrl: _readNullableString(
        json,
        'externalUrl',
        snakeKey: 'external_url',
      ),
      type: _readString(json, 'type'),
      status: _readString(json, 'status', fallback: 'published'),
      downloadAllowed: _readBool(
        json,
        'downloadAllowed',
        snakeKey: 'download_allowed',
      ),
      watermarkEnabled: _readBool(
        json,
        'watermarkEnabled',
        snakeKey: 'watermark_enabled',
      ),
      fileAsset: ContentFileAssetSummary.fromNullableJson(
        json['fileAsset'] ?? json['file_asset'],
      ),
      createdAt: _readNullableString(json, 'createdAt', snakeKey: 'created_at'),
    );
  }

  final String id;
  final String organizationId;
  final String roomId;
  final String title;
  final String? description;
  final String? externalUrl;
  final String type;
  final String status;
  final bool downloadAllowed;
  final bool watermarkEnabled;
  final ContentFileAssetSummary? fileAsset;
  final String? createdAt;
}

class ContentFileAssetSummary {
  const ContentFileAssetSummary({
    required this.id,
    required this.originalName,
    required this.mimeType,
    required this.sizeBytes,
    required this.status,
  });

  factory ContentFileAssetSummary.fromJson(Map<String, Object?> json) {
    return ContentFileAssetSummary(
      id: _readString(json, 'id'),
      originalName: _readString(
        json,
        'originalName',
        snakeKey: 'original_name',
      ),
      mimeType: _readString(json, 'mimeType', snakeKey: 'mime_type'),
      sizeBytes: _readInt(json, 'sizeBytes', snakeKey: 'size_bytes'),
      status: _readString(json, 'status'),
    );
  }

  static ContentFileAssetSummary? fromNullableJson(Object? value) {
    if (value == null) {
      return null;
    }
    return ContentFileAssetSummary.fromJson(readJsonObject(value));
  }

  final String id;
  final String originalName;
  final String mimeType;
  final int sizeBytes;
  final String status;
}

class ContentViewSession {
  const ContentViewSession({
    required this.url,
    required this.expiresAt,
    required this.mimeType,
    required this.sizeBytes,
    required this.downloadAllowed,
    required this.status,
    required this.watermark,
  });

  factory ContentViewSession.fromJson(Map<String, Object?> json) {
    return ContentViewSession(
      url: Uri.parse(json['url'] as String? ?? ''),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      mimeType: json['mimeType'] as String? ?? '',
      sizeBytes: json['sizeBytes'] as int? ?? 0,
      downloadAllowed: json['downloadAllowed'] as bool? ?? false,
      status: json['status'] as String? ?? '',
      watermark: Watermark.fromJson(readJsonObject(json['watermark'])),
    );
  }

  final Uri url;
  final DateTime expiresAt;
  final String mimeType;
  final int sizeBytes;
  final bool downloadAllowed;
  final String status;
  final Watermark watermark;
}

class Watermark {
  const Watermark({
    required this.enabled,
    this.userId,
    this.userName,
    this.organizationId,
    this.contentId,
  });

  factory Watermark.fromJson(Map<String, Object?> json) {
    return Watermark(
      enabled: json['enabled'] as bool? ?? false,
      userId: json['userId']?.toString(),
      userName: json['userName'] as String?,
      organizationId: json['organizationId']?.toString(),
      contentId: json['contentId']?.toString(),
    );
  }

  final bool enabled;
  final String? userId;
  final String? userName;
  final String? organizationId;
  final String? contentId;
}

class ContentViewerAuditEvent {
  const ContentViewerAuditEvent({
    required this.event,
    this.result,
    this.viewerSessionId,
    this.page,
    this.positionSeconds,
    this.message,
  });

  final String event;
  final String? result;
  final String? viewerSessionId;
  final int? page;
  final int? positionSeconds;
  final String? message;

  Map<String, Object?> toJson() {
    return <String, Object?>{
      'event': event,
      if (result != null) 'result': result,
      if (viewerSessionId != null) 'viewerSessionId': viewerSessionId,
      if (page != null) 'page': page,
      if (positionSeconds != null) 'positionSeconds': positionSeconds,
      if (message != null) 'message': message,
    };
  }
}

class ContentViewerEvents {
  const ContentViewerEvents._();

  static const opened = 'opened';
  static const closed = 'closed';
  static const failed = 'failed';
  static const screenshotWarning = 'screenshot_warning';
  static const screenCaptureStarted = 'screen_capture_started';
  static const screenCaptureStopped = 'screen_capture_stopped';
  static const downloadBlocked = 'download_blocked';
  static const watermarkRendered = 'watermark_rendered';
}

class ContentViewerResults {
  const ContentViewerResults._();

  static const allowed = 'allowed';
  static const blocked = 'blocked';
  static const failed = 'failed';
  static const warning = 'warning';
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}

String _readString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  String fallback = '',
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))
          ?.toString() ??
      fallback;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
}) {
  return (json[key] ?? (snakeKey == null ? null : json[snakeKey]))?.toString();
}

int _readInt(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  int fallback = 0,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  if (value is String) {
    return int.tryParse(value) ?? fallback;
  }
  return fallback;
}

bool _readBool(
  Map<String, Object?> json,
  String key, {
  String? snakeKey,
  bool fallback = false,
}) {
  final value = json[key] ?? (snakeKey == null ? null : json[snakeKey]);
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    return value == 'true' || value == '1';
  }
  return fallback;
}
