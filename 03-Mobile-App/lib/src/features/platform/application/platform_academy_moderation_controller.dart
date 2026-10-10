import 'package:ain_mobile/src/features/platform/data/platform_academy_moderation_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformAcademyModerationProvider = FutureProvider.autoDispose
    .family<List<PlatformAcademyModerationSummary>, String>((ref, status) {
  return ref
      .watch(platformAcademyModerationRepositoryProvider)
      .listAcademies(status: status);
});

final platformAcademyModerationActionsProvider =
    Provider<PlatformAcademyModerationActions>((ref) {
  return PlatformAcademyModerationActions(ref);
});

class PlatformAcademyModerationActions {
  const PlatformAcademyModerationActions(this._ref);

  final Ref _ref;

  Future<void> verify(PlatformAcademyModerationCommand command) async {
    await _ref.read(platformAcademyModerationRepositoryProvider).verifyAcademy(
          academyId: command.academyId,
          note: command.note,
        );
    _ref.invalidate(platformAcademyModerationProvider);
  }

  Future<void> reject(PlatformAcademyModerationCommand command) async {
    await _ref.read(platformAcademyModerationRepositoryProvider).rejectAcademy(
          academyId: command.academyId,
          note: command.note ?? '',
        );
    _ref.invalidate(platformAcademyModerationProvider);
  }
}
