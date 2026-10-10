import 'package:ain_mobile/src/features/organization/data/organization_course_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationCoursesOverviewProvider = FutureProvider.autoDispose
    .family<OrganizationCoursesOverview, String>((ref, organizationId) {
  return ref
      .watch(organizationCourseRepositoryProvider)
      .getOverview(organizationId: organizationId);
});

final organizationCourseActionsProvider = Provider<OrganizationCourseActions>((
  ref,
) {
  return OrganizationCourseActions(ref);
});

class OrganizationCourseActions {
  const OrganizationCourseActions(this._ref);

  final Ref _ref;

  Future<OrganizationCourseSummary> createCourse({
    required String organizationId,
    required CreateOrganizationCourseCommand command,
  }) async {
    final result = await _ref
        .read(organizationCourseRepositoryProvider)
        .createCourse(organizationId: organizationId, command: command);
    _ref.invalidate(organizationCoursesOverviewProvider(organizationId));

    return result;
  }

  Future<OrganizationCourseSummary> updateCourse({
    required String organizationId,
    required String courseId,
    required CreateOrganizationCourseCommand command,
  }) async {
    final result =
        await _ref.read(organizationCourseRepositoryProvider).updateCourse(
              organizationId: organizationId,
              courseId: courseId,
              command: command,
            );
    _ref.invalidate(organizationCoursesOverviewProvider(organizationId));

    return result;
  }

  Future<OrganizationCourseSummary> submitCourseForReview({
    required String organizationId,
    required String courseId,
  }) async {
    final result = await _ref
        .read(organizationCourseRepositoryProvider)
        .submitCourseForReview(
          organizationId: organizationId,
          courseId: courseId,
        );
    _ref.invalidate(organizationCoursesOverviewProvider(organizationId));

    return result;
  }

  Future<OrganizationBatchSummary> createBatch({
    required String organizationId,
    required CreateOrganizationBatchCommand command,
  }) async {
    final result = await _ref
        .read(organizationCourseRepositoryProvider)
        .createBatch(organizationId: organizationId, command: command);
    _ref.invalidate(organizationCoursesOverviewProvider(organizationId));

    return result;
  }

  Future<OrganizationBatchSummary> updateBatch({
    required String organizationId,
    required String batchId,
    required CreateOrganizationBatchCommand command,
  }) async {
    final result =
        await _ref.read(organizationCourseRepositoryProvider).updateBatch(
              organizationId: organizationId,
              batchId: batchId,
              command: command,
            );
    _ref.invalidate(organizationCoursesOverviewProvider(organizationId));

    return result;
  }
}
