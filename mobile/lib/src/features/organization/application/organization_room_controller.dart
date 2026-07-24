import 'package:ain_mobile/src/features/organization/data/organization_room_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationRoomsProvider = FutureProvider.autoDispose
    .family<List<OrganizationRoomSummary>, String>((ref, organizationId) {
      return ref
          .watch(organizationRoomRepositoryProvider)
          .listRooms(organizationId: organizationId);
    });

final organizationRoomActionsProvider = Provider<OrganizationRoomActions>((
  ref,
) {
  return OrganizationRoomActions(ref);
});

class OrganizationRoomActions {
  const OrganizationRoomActions(this._ref);

  final Ref _ref;

  Future<OrganizationRoomSummary> create({
    required String organizationId,
    required CreateOrganizationRoomCommand command,
  }) async {
    final result = await _ref
        .read(organizationRoomRepositoryProvider)
        .createRoom(organizationId: organizationId, command: command);
    _ref.invalidate(organizationRoomsProvider(organizationId));
    return result;
  }
}
