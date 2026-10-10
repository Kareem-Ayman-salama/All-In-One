import 'package:ain_mobile/src/features/platform/data/platform_course_moderation_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformCourseModerationProvider = FutureProvider.autoDispose
    .family<List<PlatformCourseModerationSummary>, String>((ref, status) {
  return ref
      .watch(platformCourseModerationRepositoryProvider)
      .listCourses(status: status);
});

final platformCourseModerationActionsProvider =
    Provider<PlatformCourseModerationActions>((ref) {
  return PlatformCourseModerationActions(ref);
});

class PlatformCourseModerationActions {
  const PlatformCourseModerationActions(this._ref);

  final Ref _ref;

  Future<void> approve(PlatformCourseModerationCommand command) async {
    await _ref.read(platformCourseModerationRepositoryProvider).approveCourse(
          courseId: command.courseId,
          note: command.note,
        );
    _ref.invalidate(platformCourseModerationProvider);
  }

  Future<void> reject(PlatformCourseModerationCommand command) async {
    await _ref.read(platformCourseModerationRepositoryProvider).rejectCourse(
          courseId: command.courseId,
          note: command.note ?? '',
        );
    _ref.invalidate(platformCourseModerationProvider);
  }
}
