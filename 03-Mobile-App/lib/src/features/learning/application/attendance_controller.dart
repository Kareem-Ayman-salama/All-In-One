import 'package:ain_mobile/src/features/learning/data/attendance_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final studentAttendanceProvider =
    FutureProvider.autoDispose<StudentAttendanceOverview>((ref) {
  return ref.watch(attendanceRepositoryProvider).getStudentAttendance();
});

final guardianAttendanceProvider =
    FutureProvider.autoDispose<GuardianAttendanceOverview>((ref) {
  return ref.watch(attendanceRepositoryProvider).getGuardianAttendance();
});
