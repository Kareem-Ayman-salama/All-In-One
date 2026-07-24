import 'package:ain_mobile/src/features/organization/data/organization_task_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationTasksProvider = FutureProvider.autoDispose
    .family<List<OrganizationTaskSummary>, String>((ref, organizationId) {
      return ref
          .watch(organizationTaskRepositoryProvider)
          .listTasks(organizationId: organizationId);
    });

final organizationTaskActionsProvider = Provider<OrganizationTaskActions>(
  OrganizationTaskActions.new,
);

class OrganizationTaskActions {
  const OrganizationTaskActions(this._ref);

  final Ref _ref;

  Future<OrganizationTaskSummary> create({
    required String organizationId,
    required CreateOrganizationTaskCommand command,
  }) async {
    final result = await _ref
        .read(organizationTaskRepositoryProvider)
        .createTask(organizationId: organizationId, command: command);
    _ref.invalidate(organizationTasksProvider(organizationId));
    return result;
  }

  Future<OrganizationTaskSummary> update({
    required String organizationId,
    required String taskId,
    required UpdateOrganizationTaskCommand command,
  }) async {
    final result = await _ref
        .read(organizationTaskRepositoryProvider)
        .updateTask(
          organizationId: organizationId,
          taskId: taskId,
          command: command,
        );
    _ref.invalidate(organizationTasksProvider(organizationId));
    return result;
  }

  Future<void> delete({
    required String organizationId,
    required String taskId,
  }) async {
    await _ref
        .read(organizationTaskRepositoryProvider)
        .deleteTask(organizationId: organizationId, taskId: taskId);
    _ref.invalidate(organizationTasksProvider(organizationId));
  }
}
