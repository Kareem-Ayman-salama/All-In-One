import 'package:ain_mobile/src/features/organization/data/organization_event_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationEventsProvider = FutureProvider.autoDispose
    .family<List<OrganizationEventSummary>, String>((ref, organizationId) {
  return ref
      .watch(organizationEventRepositoryProvider)
      .listEvents(organizationId: organizationId);
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
    _ref.invalidate(organizationEventsProvider(organizationId));
    return result;
  }

  Future<void> delete({
    required String organizationId,
    required String eventId,
  }) async {
    await _ref
        .read(organizationEventRepositoryProvider)
        .deleteEvent(organizationId: organizationId, eventId: eventId);
    _ref.invalidate(organizationEventsProvider(organizationId));
  }
}
