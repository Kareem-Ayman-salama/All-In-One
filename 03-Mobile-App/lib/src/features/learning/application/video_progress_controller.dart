import 'dart:async';
import 'package:ain_mobile/src/features/learning/data/video_progress_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// ─── Providers ────────────────────────────────────────────────────────────────

/// Returns the last-saved progress for a given [contentId].
/// Used to resume playback from the correct position on load.
final videoProgressProvider =
    FutureProvider.family<VideoProgressState, String>((ref, contentId) async {
  final repo = ref.watch(videoProgressRepositoryProvider);
  return repo.getProgress(contentId);
});

/// A per-content heartbeat controller.  Dispose it when the player is closed.
final videoHeartbeatControllerProvider = NotifierProvider.family<
    VideoHeartbeatController, VideoProgressState?, String>(
  VideoHeartbeatController.new,
);

// ─── Heartbeat Controller ─────────────────────────────────────────────────────

/// Manages the video progress heartbeat for a single content item.
///
/// Usage:
/// ```dart
/// // When playback starts:
/// ref.read(videoHeartbeatControllerProvider(contentId).notifier)
///    .onPlaybackStarted(organizationId: orgId, totalDuration: 380);
///
/// // Periodically (e.g., Timer.periodic every 15 s):
/// ref.read(videoHeartbeatControllerProvider(contentId).notifier)
///    .tick(currentPositionSeconds: 120);
///
/// // When player is closed or paused:
/// ref.read(videoHeartbeatControllerProvider(contentId).notifier)
///    .onPlaybackStopped();
/// ```
class VideoHeartbeatController
    extends FamilyNotifier<VideoProgressState?, String> {
  String get _contentId => arg;

  String? _organizationId;
  String? _roomId;
  String? _courseId;
  int _totalDurationSeconds = 0;
  int _watchedSeconds = 0;
  int _lastPositionSeconds = 0;
  bool _hasLoggedStart = false;
  bool _hasLoggedComplete = false;

  Timer? _heartbeatTimer;

  @override
  VideoProgressState? build(String arg) => null;

  // ── Public API ─────────────────────────────────────────────────────────────

  /// Call this when the player starts playing for the first time.
  Future<void> onPlaybackStarted({
    required int totalDuration,
    String? organizationId,
    String? roomId,
    String? courseId,
    int resumePosition = 0,
  }) async {
    _organizationId = organizationId;
    _roomId = roomId;
    _courseId = courseId;
    _totalDurationSeconds = totalDuration;
    _lastPositionSeconds = resumePosition;

    if (!_hasLoggedStart) {
      _hasLoggedStart = true;
      final repo = ref.read(videoProgressRepositoryProvider);
      await repo.logVideoStarted(
        contentId: _contentId,
        organizationId: _organizationId,
        roomId: _roomId,
        courseId: _courseId,
      );
    }

    // Start a heartbeat every 15 seconds.
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _saveHeartbeat();
    });
  }

  /// Call this every time the player position updates (e.g. onPositionChanged).
  /// Accumulates watched time and detects completion.
  void tick({required int currentPositionSeconds}) {
    if (currentPositionSeconds > _lastPositionSeconds) {
      _watchedSeconds += currentPositionSeconds - _lastPositionSeconds;
    }
    _lastPositionSeconds = currentPositionSeconds;

    // Optimistic completion check.
    if (!_hasLoggedComplete &&
        _totalDurationSeconds > 0 &&
        _watchedSeconds / _totalDurationSeconds >= 0.85) {
      _hasLoggedComplete = true;
      _logCompletion();
    }
  }

  /// Call when the player is paused or the page is disposed.
  Future<void> onPlaybackStopped() async {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
    await _saveHeartbeat();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  Future<void> _saveHeartbeat() async {
    if (_totalDurationSeconds == 0) return;
    final repo = ref.read(videoProgressRepositoryProvider);
    final updated = await repo.saveProgress(
      contentId: _contentId,
      watchedSeconds: _watchedSeconds,
      totalDurationSeconds: _totalDurationSeconds,
      lastPositionSeconds: _lastPositionSeconds,
      organizationId: _organizationId,
      roomId: _roomId,
      courseId: _courseId,
    );
    state = updated;

    // Fire completion event once the backend confirms ≥ 85 %.
    if (!_hasLoggedComplete && updated.isCompleted) {
      _hasLoggedComplete = true;
      unawaited(_logCompletion());
    }
  }

  Future<void> _logCompletion() async {
    final repo = ref.read(videoProgressRepositoryProvider);
    await repo.logVideoCompleted(
      contentId: _contentId,
      organizationId: _organizationId,
      roomId: _roomId,
      courseId: _courseId,
    );
  }
}
