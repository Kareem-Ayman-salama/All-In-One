import 'package:ain_mobile/src/features/organization/data/organization_invitation_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationInvitationsProvider = FutureProvider.autoDispose
    .family<List<OrganizationInvitationSummary>, String>((ref, organizationId) {
      return ref
          .watch(organizationInvitationRepositoryProvider)
          .listInvitations(organizationId: organizationId);
    });

final organizationInvitationActionsProvider =
    Provider<OrganizationInvitationActions>((ref) {
      return OrganizationInvitationActions(ref);
    });

class OrganizationInvitationActions {
  const OrganizationInvitationActions(this._ref);

  final Ref _ref;

  Future<OrganizationInvitationCommandResult> create({
    required String organizationId,
    required CreateOrganizationInvitationCommand command,
  }) async {
    final result = await _ref
        .read(organizationInvitationRepositoryProvider)
        .createInvitation(organizationId: organizationId, command: command);
    _ref.invalidate(organizationInvitationsProvider(organizationId));
    return result;
  }

  Future<OrganizationInvitationCommandResult> resend({
    required String organizationId,
    required String invitationId,
  }) async {
    final result = await _ref
        .read(organizationInvitationRepositoryProvider)
        .resendInvitation(
          organizationId: organizationId,
          invitationId: invitationId,
        );
    _ref.invalidate(organizationInvitationsProvider(organizationId));
    return result;
  }

  Future<void> cancel({
    required String organizationId,
    required String invitationId,
  }) async {
    await _ref
        .read(organizationInvitationRepositoryProvider)
        .cancelInvitation(
          organizationId: organizationId,
          invitationId: invitationId,
        );
    _ref.invalidate(organizationInvitationsProvider(organizationId));
  }
}
