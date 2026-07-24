import 'package:ain_mobile/src/core/cache/tenant_cache_scope.dart';
import 'package:ain_mobile/src/core/telemetry/telemetry_service.dart';
import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final activeWorkspaceControllerProvider =
    AsyncNotifierProvider<ActiveWorkspaceController, ActiveWorkspace?>(
  ActiveWorkspaceController.new,
);

class ActiveWorkspaceController extends AsyncNotifier<ActiveWorkspace?> {
  @override
  Future<ActiveWorkspace?> build() async {
    return null;
  }

  Future<bool> selectWorkspace(WorkspaceSummary workspace) async {
    state = const AsyncLoading();
    final nextState = await AsyncValue.guard(() async {
      final context = await ref
          .read(workspaceRepositoryProvider)
          .getContext(workspace.organizationId);

      ref
          .read(tenantCacheScopeControllerProvider.notifier)
          .activateOrganization(organizationId: workspace.organizationId);
      await ref.read(telemetryServiceProvider).track(
        TelemetryEvent.workspaceSelected,
        properties: <String, Object?>{
          'organizationId': workspace.organizationId,
          'role': workspace.role,
        },
      );

      return ActiveWorkspace(
        organizationId: workspace.organizationId,
        name: workspace.name,
        role: workspace.role,
        context: context,
      );
    });
    state = nextState;

    return nextState.hasValue && nextState.value != null;
  }

  Future<void> refreshContext() async {
    final current = state.valueOrNull;
    if (current == null) {
      return;
    }
    final context = await ref
        .read(workspaceRepositoryProvider)
        .getContext(current.organizationId);
    final organization = _readObject(context, 'organization');
    state = AsyncData(
      current.copyWith(
        name: organization['name']?.toString() ?? current.name,
        context: context,
      ),
    );
  }

  Future<ActiveWorkspace> updateOrganization({
    required UpdateOrganizationCommand command,
  }) async {
    final current = state.valueOrNull;
    if (current == null) {
      throw StateError('No active workspace is selected.');
    }
    final updatedOrganization =
        await ref.read(workspaceRepositoryProvider).updateOrganization(
              organizationId: current.organizationId,
              command: command,
            );
    final nextContext = Map<String, Object?>.from(current.context);
    nextContext['organization'] = updatedOrganization;
    final next = current.copyWith(
      name: updatedOrganization['name']?.toString() ?? current.name,
      context: nextContext,
    );
    state = AsyncData(next);

    return next;
  }

  void clearWorkspace() {
    ref.read(tenantCacheScopeControllerProvider.notifier).clearOrganization();
    state = const AsyncData(null);
  }
}

class ActiveWorkspace {
  const ActiveWorkspace({
    required this.organizationId,
    required this.name,
    required this.role,
    required this.context,
  });

  final String organizationId;
  final String name;
  final String role;
  final Map<String, Object?> context;

  ActiveWorkspace copyWith({String? name, Map<String, Object?>? context}) {
    return ActiveWorkspace(
      organizationId: organizationId,
      name: name ?? this.name,
      role: role,
      context: context ?? this.context,
    );
  }
}

Map<String, Object?> _readObject(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is Map<String, Object?>) {
    return value;
  }
  if (value is Map) {
    return Map<String, Object?>.from(value);
  }

  return const <String, Object?>{};
}
