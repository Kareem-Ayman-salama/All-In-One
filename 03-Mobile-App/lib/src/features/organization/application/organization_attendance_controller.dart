import 'package:ain_mobile/src/features/organization/data/organization_attendance_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationAttendanceSessionsProvider = FutureProvider.autoDispose
    .family<List<OrganizationLearningSessionSummary>, String>((
  ref,
  organizationId,
) {
  return ref
      .watch(organizationAttendanceRepositoryProvider)
      .listSessions(organizationId: organizationId);
});

final organizationAttendanceSheetProvider = FutureProvider.autoDispose
    .family<OrganizationAttendanceSheet, OrganizationAttendanceSheetRequest>((
  ref,
  request,
) {
  return ref.watch(organizationAttendanceRepositoryProvider).getAttendance(
        organizationId: request.organizationId,
        sessionId: request.sessionId,
      );
});

final organizationAttendanceActionsProvider =
    Provider<OrganizationAttendanceActions>(OrganizationAttendanceActions.new);

class OrganizationAttendanceActions {
  const OrganizationAttendanceActions(this._ref);

  final Ref _ref;

  Future<void> mark({
    required OrganizationAttendanceSheetRequest request,
    required OrganizationAttendanceMarkRecord record,
  }) async {
    await _ref.read(organizationAttendanceRepositoryProvider).markAttendance(
      organizationId: request.organizationId,
      sessionId: request.sessionId,
      records: <OrganizationAttendanceMarkRecord>[record],
    );
    _invalidate(request);
  }

  Future<OrganizationLearningSessionSummary> lock({
    required OrganizationAttendanceSheetRequest request,
  }) async {
    final result = await _ref
        .read(organizationAttendanceRepositoryProvider)
        .lockAttendance(
          organizationId: request.organizationId,
          sessionId: request.sessionId,
        );
    _invalidate(request);

    return result;
  }

  Future<OrganizationAttendanceQrCode> generateQr({
    required OrganizationAttendanceSheetRequest request,
  }) async {
    return _ref.read(organizationAttendanceRepositoryProvider).generateQr(
          organizationId: request.organizationId,
          sessionId: request.sessionId,
        );
  }

  void _invalidate(OrganizationAttendanceSheetRequest request) {
    _ref.invalidate(
      organizationAttendanceSessionsProvider(
        request.organizationId,
      ),
    );
    _ref.invalidate(organizationAttendanceSheetProvider(request));
  }
}

class OrganizationAttendanceSheetRequest {
  const OrganizationAttendanceSheetRequest({
    required this.organizationId,
    required this.sessionId,
  });

  final String organizationId;
  final String sessionId;

  @override
  bool operator ==(Object other) {
    return other is OrganizationAttendanceSheetRequest &&
        other.organizationId == organizationId &&
        other.sessionId == sessionId;
  }

  @override
  int get hashCode => Object.hash(organizationId, sessionId);
}
