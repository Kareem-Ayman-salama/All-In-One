import 'package:ain_mobile/src/features/marketplace/data/public_course_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final publicCourseCatalogProvider = FutureProvider.autoDispose
    .family<PublicCoursePage, PublicCourseQuery>((ref, query) {
  return ref.watch(publicCourseRepositoryProvider).listCourses(query: query);
});

final publicCourseDetailProvider = FutureProvider.autoDispose
    .family<PublicCourseSummary, String>((ref, courseSlug) {
  return ref.watch(publicCourseRepositoryProvider).getCourse(courseSlug);
});
