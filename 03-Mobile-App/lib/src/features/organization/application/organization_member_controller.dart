import 'package:ain_mobile/src/features/organization/data/organization_member_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationMembersProvider = FutureProvider.autoDispose
    .family<List<OrganizationMemberSummary>, String>((ref, organizationId) {
  return ref
      .watch(organizationMemberRepositoryProvider)
      .listMembers(organizationId: organizationId);
});

final organizationMemberActionsProvider = Provider<OrganizationMemberActions>(
  OrganizationMemberActions.new,
);

class OrganizationMemberActions {
  const OrganizationMemberActions(this._ref);

  final Ref _ref;

  Future<OrganizationMemberSummary> update({
    required String organizationId,
    required String membershipId,
    required UpdateOrganizationMemberCommand command,
  }) async {
    final result =
        await _ref.read(organizationMemberRepositoryProvider).updateMember(
              organizationId: organizationId,
              membershipId: membershipId,
              command: command,
            );
    _ref.invalidate(organizationMembersProvider(organizationId));
    return result;
  }

  Future<void> remove({
    required String organizationId,
    required String membershipId,
  }) async {
    await _ref.read(organizationMemberRepositoryProvider).removeMember(
          organizationId: organizationId,
          membershipId: membershipId,
        );
    _ref.invalidate(organizationMembersProvider(organizationId));
  }
}
