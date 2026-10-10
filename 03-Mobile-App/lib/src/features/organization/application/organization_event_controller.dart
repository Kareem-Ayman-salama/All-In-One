import 'package:ain_mobile/src/features/organization/data/organization_event_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationEventsProvider = FutureProvider.autoDispose
    .family<List<OrganizationEventSummary>, OrganizationEventsRequest>((
  ref,
  request,
) {
  return ref.watch(organizationEventRepositoryProvider).listEvents(
        organizationId: request.organizationId,
        from: request.from,
        to: request.to,
        roomId: request.roomId,
      );
});

final organizationEventActionsProvider = Provider<OrganizationEventActions>(
  OrganizationEventActions.new,
);

class OrganizationEventActions {
  const OrganizationEventActions(this._ref);

  final Ref _ref;

  Future<OrganizationEventSummary> create({
    required String organizationId,
    required CreateOrganizationEventCommand command,
  }) async {
    final result = await _ref
        .read(organizationEventRepositoryProvider)
        .createEvent(organizationId: organizationId, command: command);
    _ref.invalidate(organizationEventsProvider);
    return result;
  }

  Future<void> delete({
    required String organizationId,
    required String eventId,
  }) async {
    await _ref
        .read(organizationEventRepositoryProvider)
        .deleteEvent(organizationId: organizationId, eventId: eventId);
    _ref.invalidate(organizationEventsProvider);
  }
}

class OrganizationEventsRequest {
  const OrganizationEventsRequest({
    required this.organizationId,
    this.from,
    this.to,
    this.roomId,
  });

  final String organizationId;
  final String? from;
  final String? to;
  final String? roomId;

  @override
  bool operator ==(Object other) {
    return other is OrganizationEventsRequest &&
        other.organizationId == organizationId &&
        other.from == from &&
        other.to == to &&
        other.roomId == roomId;
  }

  @override
  int get hashCode => Object.hash(organizationId, from, to, roomId);
}
