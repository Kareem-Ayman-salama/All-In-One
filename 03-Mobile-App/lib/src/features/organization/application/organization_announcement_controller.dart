import 'package:ain_mobile/src/features/organization/data/organization_announcement_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationAnnouncementsProvider = FutureProvider.autoDispose
    .family<List<OrganizationAnnouncementSummary>, String>((
  ref,
  organizationId,
) {
  return ref
      .watch(organizationAnnouncementRepositoryProvider)
      .listAnnouncements(organizationId: organizationId);
});

final organizationAnnouncementActionsProvider =
    Provider<OrganizationAnnouncementActions>((ref) {
  return OrganizationAnnouncementActions(ref);
});

class OrganizationAnnouncementActions {
  const OrganizationAnnouncementActions(this._ref);

  final Ref _ref;

  Future<OrganizationAnnouncementSummary> create({
    required String organizationId,
    required CreateOrganizationAnnouncementCommand command,
  }) async {
    final result = await _ref
        .read(organizationAnnouncementRepositoryProvider)
        .createAnnouncement(organizationId: organizationId, command: command);
    _ref.invalidate(organizationAnnouncementsProvider(organizationId));
    return result;
  }

  Future<OrganizationAnnouncementSummary> update({
    required String organizationId,
    required String announcementId,
    required UpdateOrganizationAnnouncementCommand command,
  }) async {
    final result = await _ref
        .read(organizationAnnouncementRepositoryProvider)
        .updateAnnouncement(
          organizationId: organizationId,
          announcementId: announcementId,
          command: command,
        );
    _ref.invalidate(organizationAnnouncementsProvider(organizationId));
    return result;
  }

  Future<void> delete({
    required String organizationId,
    required String announcementId,
  }) async {
    await _ref
        .read(organizationAnnouncementRepositoryProvider)
        .deleteAnnouncement(
          organizationId: organizationId,
          announcementId: announcementId,
        );
    _ref.invalidate(organizationAnnouncementsProvider(organizationId));
  }
}
