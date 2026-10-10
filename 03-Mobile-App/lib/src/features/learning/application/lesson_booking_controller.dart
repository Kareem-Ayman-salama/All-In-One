import 'package:ain_mobile/src/features/learning/data/lesson_booking_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final lessonBookingCatalogProvider =
    FutureProvider.autoDispose<LessonBookingCatalog>((ref) {
  return ref.watch(lessonBookingRepositoryProvider).getCatalog();
});

final lessonBookingActionsProvider = Provider<LessonBookingActions>((ref) {
  return LessonBookingActions(ref);
});

class LessonBookingActions {
  const LessonBookingActions(this._ref);

  final Ref _ref;

  Future<LessonBookingSummary> reserve({
    required ReserveLessonBookingCommand command,
  }) async {
    final repository = _ref.read(lessonBookingRepositoryProvider);
    final booking = await repository.reserveLesson(
      command: command,
    );
    _ref.invalidate(lessonBookingCatalogProvider);

    return booking;
  }

  Future<LessonBookingSummary> cancel(String bookingId) async {
    final repository = _ref.read(lessonBookingRepositoryProvider);
    final booking = await repository.cancelLesson(
      bookingId,
    );
    _ref.invalidate(lessonBookingCatalogProvider);

    return booking;
  }
}
