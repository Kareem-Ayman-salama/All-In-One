import 'dart:math';

import 'package:ain_mobile/src/core/telemetry/telemetry_service.dart';
import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final contentViewerControllerProvider =
    AsyncNotifierProvider<ContentViewerController, ContentViewerState?>(
  ContentViewerController.new,
);

class ContentViewerController extends AsyncNotifier<ContentViewerState?> {
  @override
  Future<ContentViewerState?> build() async {
    return null;
  }

  Future<void> open({
    required String organizationId,
    required String contentId,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repository = ref.read(contentRepositoryProvider);
      final session = await repository.getViewSession(
        organizationId: organizationId,
        contentId: contentId,
      );
      final viewerSessionId = _viewerSessionId();

      await repository.recordViewerAudit(
        organizationId: organizationId,
        contentId: contentId,
        event: ContentViewerAuditEvent(
          event: ContentViewerEvents.opened,
          viewerSessionId: viewerSessionId,
        ),
      );

      if (session.watermark.enabled) {
        await repository.recordViewerAudit(
          organizationId: organizationId,
          contentId: contentId,
          event: ContentViewerAuditEvent(
            event: ContentViewerEvents.watermarkRendered,
            viewerSessionId: viewerSessionId,
          ),
        );
      }
      await ref.read(telemetryServiceProvider).track(
        TelemetryEvent.contentOpened,
        properties: <String, Object?>{
          'organizationId': organizationId,
          'contentId': contentId,
          'mimeType': session.mimeType,
          'downloadAllowed': session.downloadAllowed,
        },
      );

      return ContentViewerState(
        organizationId: organizationId,
        contentId: contentId,
        viewerSessionId: viewerSessionId,
        session: session,
      );
    });
  }

  Future<void> close({int? page, int? positionSeconds}) async {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    await _record(
      current,
      ContentViewerAuditEvent(
        event: ContentViewerEvents.closed,
        viewerSessionId: current.viewerSessionId,
        page: page,
        positionSeconds: positionSeconds,
      ),
    );
    state = const AsyncData(null);
  }

  Future<void> recordFailure(String message) async {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    await _record(
      current,
      ContentViewerAuditEvent(
        event: ContentViewerEvents.failed,
        result: ContentViewerResults.failed,
        viewerSessionId: current.viewerSessionId,
        message: message,
      ),
    );
  }

  Future<void> recordScreenshotWarning() {
    return _recordWarning(ContentViewerEvents.screenshotWarning);
  }

  Future<void> recordScreenCaptureStarted() {
    return _recordWarning(ContentViewerEvents.screenCaptureStarted);
  }

  Future<void> recordScreenCaptureStopped() {
    return _recordAllowed(ContentViewerEvents.screenCaptureStopped);
  }

  Future<void> recordDownloadBlocked() {
    return _recordWarning(ContentViewerEvents.downloadBlocked);
  }

  Future<void> _recordWarning(String event) async {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    await _record(
      current,
      ContentViewerAuditEvent(
        event: event,
        result: ContentViewerResults.warning,
        viewerSessionId: current.viewerSessionId,
      ),
    );
  }

  Future<void> _recordAllowed(String event) async {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }

    await _record(
      current,
      ContentViewerAuditEvent(
        event: event,
        result: ContentViewerResults.allowed,
        viewerSessionId: current.viewerSessionId,
      ),
    );
  }

  Future<void> _record(
    ContentViewerState current,
    ContentViewerAuditEvent event,
  ) {
    return ref.read(contentRepositoryProvider).recordViewerAudit(
          organizationId: current.organizationId,
          contentId: current.contentId,
          event: event,
        );
  }

  String _viewerSessionId() {
    final random = Random.secure();
    return List<int>.generate(
      16,
      (_) => random.nextInt(256),
      growable: false,
    ).map((value) => value.toRadixString(16).padLeft(2, '0')).join();
  }
}

class ContentViewerState {
  const ContentViewerState({
    required this.organizationId,
    required this.contentId,
    required this.viewerSessionId,
    required this.session,
  });

  final String organizationId;
  final String contentId;
  final String viewerSessionId;
  final ContentViewSession session;
}
