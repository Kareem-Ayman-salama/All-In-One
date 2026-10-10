import 'package:ain_mobile/src/core/api/api_client.dart';
import 'package:ain_mobile/src/core/api/api_envelope.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ─── Provider ─────────────────────────────────────────────────────────────────

final videoProgressRepositoryProvider =
    Provider<VideoProgressRepository>((ref) {
  return VideoProgressRepository(dio: ref.watch(dioProvider));
});

// ─── Models ───────────────────────────────────────────────────────────────────

@immutable
class VideoProgressState {
  const VideoProgressState({
    required this.contentId,
    required this.lastPositionSeconds,
    required this.completionPercentage,
    required this.isCompleted,
    this.watchedSeconds = 0,
    this.totalDurationSeconds = 0,
  });

  final String contentId;
  final int lastPositionSeconds;
  final int completionPercentage;
  final bool isCompleted;
  final int watchedSeconds;
  final int totalDurationSeconds;

  factory VideoProgressState.fromJson(Map<String, Object?> json) {
    return VideoProgressState(
      contentId: json['contentId'] as String? ?? '',
      lastPositionSeconds: json['lastPositionSeconds'] as int? ?? 0,
      completionPercentage: json['completionPercentage'] as int? ?? 0,
      isCompleted: json['isCompleted'] as bool? ?? false,
      watchedSeconds: json['watchedSeconds'] as int? ?? 0,
      totalDurationSeconds: json['totalDurationSeconds'] as int? ?? 0,
    );
  }

  /// Returns a zero-state for an unknown content item.
  factory VideoProgressState.empty(String contentId) {
    return VideoProgressState(
      contentId: contentId,
      lastPositionSeconds: 0,
      completionPercentage: 0,
      isCompleted: false,
    );
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

/// Handles heartbeat saves and discrete lifecycle event logging for video
/// content.  All methods are fire-and-forget safe — they swallow network
/// errors so they never interrupt playback.
class VideoProgressRepository {
  const VideoProgressRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  // ── Fetch resume position ──────────────────────────────────────────────────

  /// Returns the saved progress for [contentId], or an empty state if none
  /// exists yet.
  Future<VideoProgressState> getProgress(String contentId) async {
    try {
      final response = await _dio.get<Object?>('/video-progress/$contentId');
      final envelope = ApiEnvelope<VideoProgressState>.fromJson(
        readJsonObject(response.data),
        (value) => VideoProgressState.fromJson(readJsonObject(value)),
      );
      return envelope.data;
    } catch (_) {
      return VideoProgressState.empty(contentId);
    }
  }

  // ── Heartbeat save (called every ~10-15 s during playback) ────────────────

  /// Saves the current playback position and accumulates watched seconds.
  /// Returns the updated [VideoProgressState].
  Future<VideoProgressState> saveProgress({
    required String contentId,
    required int watchedSeconds,
    required int totalDurationSeconds,
    required int lastPositionSeconds,
    String? organizationId,
    String? roomId,
    String? courseId,
  }) async {
    try {
      final response = await _dio.post<Object?>(
        '/video-progress',
        data: <String, Object?>{
          'contentId': contentId,
          'watchedSeconds': watchedSeconds,
          'totalDurationSeconds': totalDurationSeconds,
          'lastPositionSeconds': lastPositionSeconds,
          if (organizationId != null) 'organizationId': organizationId,
          if (roomId != null) 'roomId': roomId,
          if (courseId != null) 'courseId': courseId,
        },
      );
      final envelope = ApiEnvelope<VideoProgressState>.fromJson(
        readJsonObject(response.data),
        (value) => VideoProgressState.fromJson(readJsonObject(value)),
      );
      return envelope.data;
    } catch (_) {
      // Never fail playback — return a local estimate.
      final pct = totalDurationSeconds > 0
          ? (watchedSeconds / totalDurationSeconds * 100).round().clamp(0, 100)
          : 0;
      return VideoProgressState(
        contentId: contentId,
        lastPositionSeconds: lastPositionSeconds,
        completionPercentage: pct,
        isCompleted: pct >= 85,
        watchedSeconds: watchedSeconds,
        totalDurationSeconds: totalDurationSeconds,
      );
    }
  }

  // ── Discrete lifecycle events ──────────────────────────────────────────────

  /// Logs a `video_started` event when the student begins playback.
  Future<void> logVideoStarted({
    required String contentId,
    String? organizationId,
    String? roomId,
    String? courseId,
  }) async {
    await _logEvent(
      contentId: contentId,
      event: 'video_started',
      organizationId: organizationId,
      roomId: roomId,
      courseId: courseId,
    );
  }

  /// Logs a `video_completed` event when the student reaches ≥85 % watch
  /// time.
  Future<void> logVideoCompleted({
    required String contentId,
    String? organizationId,
    String? roomId,
    String? courseId,
  }) async {
    await _logEvent(
      contentId: contentId,
      event: 'video_completed',
      organizationId: organizationId,
      roomId: roomId,
      courseId: courseId,
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  Future<void> _logEvent({
    required String contentId,
    required String event,
    String? organizationId,
    String? roomId,
    String? courseId,
  }) async {
    try {
      await _dio.post<Object?>(
        '/video-events',
        data: <String, Object?>{
          'contentId': contentId,
          'event': event,
          if (organizationId != null) 'organizationId': organizationId,
          if (roomId != null) 'roomId': roomId,
          if (courseId != null) 'courseId': courseId,
        },
      );
    } catch (_) {
      // Fire-and-forget: never fail playback due to logging.
    }
  }
}
