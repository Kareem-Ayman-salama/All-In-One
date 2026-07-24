import 'package:ain_mobile/src/features/organization/data/organization_course_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationCoursesOverviewProvider = FutureProvider.autoDispose
    .family<OrganizationCoursesOverview, String>((ref, organizationId) {
  return ref
      .watch(organizationCourseRepositoryProvider)
      .getOverview(organizationId: organizationId);
});
