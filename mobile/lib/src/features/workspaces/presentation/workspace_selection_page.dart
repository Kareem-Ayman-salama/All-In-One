import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/home/presentation/home_page.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/application/workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class WorkspaceSelectionPage extends ConsumerWidget {
  const WorkspaceSelectionPage({super.key});

  static const routePath = '/workspaces';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaces = ref.watch(workspaceListProvider);
    final activeWorkspace = ref.watch(activeWorkspaceControllerProvider);
    final strings = AppStrings.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(strings.workspaces)),
      body: SafeArea(
        child: workspaces.when(
          data: (items) => activeWorkspace.when(
            data: (_) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  strings.chooseWorkspace,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 12),
                for (final workspace in items)
                  Card(
                    child: Semantics(
                      button: true,
                      label: '${strings.openWorkspace}: ${workspace.name}',
                      child: ListTile(
                        title: Text(workspace.name),
                        subtitle: Text(workspace.role),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => _selectWorkspace(
                          context: context,
                          ref: ref,
                          workspace: workspace,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            error: (error, stackTrace) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(error.toString()),
              ),
            ),
            loading: () => Center(
              child: Semantics(
                label: strings.loading,
                child: const CircularProgressIndicator(),
              ),
            ),
          ),
          error: (error, stackTrace) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Text(error.toString()),
            ),
          ),
          loading: () => Center(
            child: Semantics(
              label: strings.loading,
              child: const CircularProgressIndicator(),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _selectWorkspace({
    required BuildContext context,
    required WidgetRef ref,
    required WorkspaceSummary workspace,
  }) async {
    final selected = await ref
        .read(activeWorkspaceControllerProvider.notifier)
        .selectWorkspace(workspace);
    if (selected && context.mounted) {
      context.go(HomePage.routePath);
    }
  }
}
