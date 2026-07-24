import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final studentLearningOverviewProvider =
    FutureProvider.autoDispose<StudentLearningOverview>((ref) {
  return ref.watch(studentLearningRepositoryProvider).getOverview();
});

final studentEnrollmentDetailProvider = FutureProvider.autoDispose
    .family<StudentEnrollmentDetail, String>((ref, enrollmentId) {
  return ref
      .watch(studentLearningRepositoryProvider)
      .getEnrollment(enrollmentId);
});
