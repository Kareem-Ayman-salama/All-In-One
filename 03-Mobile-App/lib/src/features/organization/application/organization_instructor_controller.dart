import 'package:ain_mobile/src/features/organization/data/organization_instructor_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationInstructorsOverviewProvider = FutureProvider.autoDispose
    .family<OrganizationInstructorsOverview, String>((ref, organizationId) {
  return ref
      .watch(organizationInstructorRepositoryProvider)
      .getOverview(organizationId: organizationId);
});

final organizationInstructorActionsProvider =
    Provider<OrganizationInstructorActions>(OrganizationInstructorActions.new);

class OrganizationInstructorActions {
  const OrganizationInstructorActions(this._ref);

  final Ref _ref;

  Future<OrganizationInstructorSummary> createInstructor({
    required String organizationId,
    required CreateOrganizationInstructorCommand command,
  }) async {
    final result = await _ref
        .read(organizationInstructorRepositoryProvider)
        .createInstructor(organizationId: organizationId, command: command);
    _ref.invalidate(organizationInstructorsOverviewProvider(organizationId));

    return result;
  }

  Future<OrganizationInstructorSummary> updateInstructor({
    required String organizationId,
    required String instructorId,
    required CreateOrganizationInstructorCommand command,
  }) async {
    final result = await _ref
        .read(organizationInstructorRepositoryProvider)
        .updateInstructor(
          organizationId: organizationId,
          instructorId: instructorId,
          command: command,
        );
    _ref.invalidate(organizationInstructorsOverviewProvider(organizationId));

    return result;
  }

  Future<OrganizationInstructorSlotSummary> createSlot({
    required String organizationId,
    required CreateOrganizationInstructorSlotCommand command,
  }) async {
    final result = await _ref
        .read(organizationInstructorRepositoryProvider)
        .createSlot(organizationId: organizationId, command: command);
    _ref.invalidate(organizationInstructorsOverviewProvider(organizationId));

    return result;
  }
}
