import 'package:ain_mobile/src/features/organization/data/organization_room_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationRoomsProvider = FutureProvider.autoDispose
    .family<List<OrganizationRoomSummary>, String>((ref, organizationId) {
  return ref
      .watch(organizationRoomRepositoryProvider)
      .listRooms(organizationId: organizationId);
});

final organizationRoomMembersProvider = FutureProvider.autoDispose
    .family<List<OrganizationRoomMemberSummary>, RoomMembersRequest>((
  ref,
  request,
) {
  return ref.watch(organizationRoomRepositoryProvider).listRoomMembers(
        organizationId: request.organizationId,
        roomId: request.roomId,
      );
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

  Future<OrganizationRoomSummary> update({
    required String organizationId,
    required String roomId,
    required UpdateOrganizationRoomCommand command,
  }) async {
    final result =
        await _ref.read(organizationRoomRepositoryProvider).updateRoom(
              organizationId: organizationId,
              roomId: roomId,
              command: command,
            );
    _ref.invalidate(organizationRoomsProvider(organizationId));
    return result;
  }

  Future<void> delete({
    required String organizationId,
    required String roomId,
  }) async {
    await _ref.read(organizationRoomRepositoryProvider).deleteRoom(
          organizationId: organizationId,
          roomId: roomId,
        );
    _ref.invalidate(organizationRoomsProvider(organizationId));
  }

  Future<OrganizationRoomMemberSummary> addMember({
    required String organizationId,
    required String roomId,
    required CreateRoomMemberCommand command,
  }) async {
    final result =
        await _ref.read(organizationRoomRepositoryProvider).addRoomMember(
              organizationId: organizationId,
              roomId: roomId,
              command: command,
            );
    _invalidateRoomMembers(organizationId: organizationId, roomId: roomId);
    _ref.invalidate(organizationRoomsProvider(organizationId));
    return result;
  }

  Future<OrganizationRoomMemberSummary> updateMember({
    required String organizationId,
    required String roomId,
    required String roomMembershipId,
    required UpdateRoomMemberCommand command,
  }) async {
    final result =
        await _ref.read(organizationRoomRepositoryProvider).updateRoomMember(
              organizationId: organizationId,
              roomId: roomId,
              roomMembershipId: roomMembershipId,
              command: command,
            );
    _invalidateRoomMembers(organizationId: organizationId, roomId: roomId);
    _ref.invalidate(organizationRoomsProvider(organizationId));
    return result;
  }

  Future<void> removeMember({
    required String organizationId,
    required String roomId,
    required String roomMembershipId,
  }) async {
    await _ref.read(organizationRoomRepositoryProvider).removeRoomMember(
          organizationId: organizationId,
          roomId: roomId,
          roomMembershipId: roomMembershipId,
        );
    _invalidateRoomMembers(organizationId: organizationId, roomId: roomId);
    _ref.invalidate(organizationRoomsProvider(organizationId));
  }

  void _invalidateRoomMembers({
    required String organizationId,
    required String roomId,
  }) {
    _ref.invalidate(
      organizationRoomMembersProvider(
        RoomMembersRequest(organizationId: organizationId, roomId: roomId),
      ),
    );
  }
}

class RoomMembersRequest {
  const RoomMembersRequest({
    required this.organizationId,
    required this.roomId,
  });

  final String organizationId;
  final String roomId;

  @override
  bool operator ==(Object other) {
    return other is RoomMembersRequest &&
        other.organizationId == organizationId &&
        other.roomId == roomId;
  }

  @override
  int get hashCode => Object.hash(organizationId, roomId);
}
