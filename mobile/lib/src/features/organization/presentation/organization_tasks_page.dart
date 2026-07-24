import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_task_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_task_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationTasksPage extends ConsumerWidget {
  const OrganizationTasksPage({super.key});

  static const routePath = '/organization/tasks';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationTasks)),
      floatingActionButton: workspaceState.valueOrNull == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspaceState.valueOrNull!.organizationId,
              ),
              icon: const Icon(Icons.add_task),
              label: Text(strings.createTask),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final tasks = ref.watch(
              organizationTasksProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationTasksProvider(workspace.organizationId).future,
                );
              },
              child: tasks.when(
                data: (items) => _TasksBody(
                  tasks: items,
                  organizationId: workspace.organizationId,
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    const Icon(Icons.cloud_off, size: 48),
                    const SizedBox(height: 12),
                    Text(error.toString(), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () {
                        ref.invalidate(
                          organizationTasksProvider(workspace.organizationId),
                        );
                      },
                      icon: const Icon(Icons.refresh),
                      label: Text(strings.retry),
                    ),
                  ],
                ),
                loading: () => Center(
                  child: Semantics(
                    label: strings.loading,
                    child: const CircularProgressIndicator(),
                  ),
                ),
              ),
            );
          },
          error: (error, stackTrace) => Center(child: Text(error.toString())),
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

  Future<void> _showCreateSheet(BuildContext context, String organizationId) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CreateTaskSheet(organizationId: organizationId),
    );
  }
}

class _NoWorkspace extends StatelessWidget {
  const _NoWorkspace({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.business, size: 56),
        const SizedBox(height: 12),
        Text(
          strings.chooseWorkspace,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () => context.go(WorkspaceSelectionPage.routePath),
          child: Text(strings.chooseWorkspace),
        ),
      ],
    );
  }
}

class _TasksBody extends StatelessWidget {
  const _TasksBody({required this.tasks, required this.organizationId});

  final List<OrganizationTaskSummary> tasks;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final openCount = tasks.where((task) => !task.isDone).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationTasks,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationTasksHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.list_alt,
                label: strings.tasks,
                value: tasks.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.pending_actions,
                label: strings.openTasks,
                value: openCount.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (tasks.isEmpty)
          Text(strings.noTasksYet)
        else
          for (final task in tasks)
            _TaskCard(task: task, organizationId: organizationId),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            Text(label),
          ],
        ),
      ),
    );
  }
}

class _TaskCard extends ConsumerWidget {
  const _TaskCard({required this.task, required this.organizationId});

  final OrganizationTaskSummary task;
  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final metadata = <String>[
      strings.taskPriorityLabel(task.priority),
      strings.taskStatusLabel(task.status),
      '${task.progress}%',
      if (task.dueAt != null) task.dueAt!,
      if (task.assigneeName != null) task.assigneeName!,
    ];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.task_alt),
              title: Text(task.title),
              subtitle: Text(metadata.join(' | ')),
              trailing: IconButton(
                tooltip: strings.deleteTask,
                onPressed: () async {
                  await ref
                      .read(organizationTaskActionsProvider)
                      .delete(organizationId: organizationId, taskId: task.id);
                },
                icon: const Icon(Icons.delete_outline),
              ),
            ),
            DropdownButtonFormField<String>(
              value: task.status,
              decoration: InputDecoration(
                labelText: strings.taskStatus,
                border: const OutlineInputBorder(),
              ),
              items: [
                DropdownMenuItem(
                  value: 'todo',
                  child: Text(strings.taskStatusLabel('todo')),
                ),
                DropdownMenuItem(
                  value: 'in_progress',
                  child: Text(strings.taskStatusLabel('in_progress')),
                ),
                DropdownMenuItem(
                  value: 'done',
                  child: Text(strings.taskStatusLabel('done')),
                ),
                DropdownMenuItem(
                  value: 'cancelled',
                  child: Text(strings.taskStatusLabel('cancelled')),
                ),
              ],
              onChanged: (value) async {
                if (value == null || value == task.status) {
                  return;
                }
                await ref.read(organizationTaskActionsProvider).update(
                      organizationId: organizationId,
                      taskId: task.id,
                      command: UpdateOrganizationTaskCommand(
                        status: value,
                        progress: value == 'done'
                            ? 100
                            : value == 'in_progress'
                                ? 25
                                : 0,
                      ),
                    );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _CreateTaskSheet extends ConsumerStatefulWidget {
  const _CreateTaskSheet({required this.organizationId});

  final String organizationId;

  @override
  ConsumerState<_CreateTaskSheet> createState() => _CreateTaskSheetState();
}

class _CreateTaskSheetState extends ConsumerState<_CreateTaskSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _dueAtController = TextEditingController();
  String _priority = 'medium';
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _dueAtController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                strings.createTask,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: strings.taskTitle,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) {
                  final length = value?.trim().length ?? 0;
                  return length >= 2 ? null : strings.taskTitleRequired;
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _priority,
                decoration: InputDecoration(
                  labelText: strings.taskPriority,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(
                    value: 'low',
                    child: Text(strings.taskPriorityLabel('low')),
                  ),
                  DropdownMenuItem(
                    value: 'medium',
                    child: Text(strings.taskPriorityLabel('medium')),
                  ),
                  DropdownMenuItem(
                    value: 'high',
                    child: Text(strings.taskPriorityLabel('high')),
                  ),
                  DropdownMenuItem(
                    value: 'urgent',
                    child: Text(strings.taskPriorityLabel('urgent')),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _priority = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _dueAtController,
                decoration: InputDecoration(
                  labelText: strings.dueAt,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) {
                  if ((value ?? '').trim().isEmpty) {
                    return null;
                  }
                  return DateTime.tryParse(value!.trim()) == null
                      ? strings.validIsoDateRequired
                      : null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: InputDecoration(
                  labelText: strings.description,
                  border: const OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.add),
                label: Text(strings.createTask),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(organizationTaskActionsProvider).create(
            organizationId: widget.organizationId,
            command: CreateOrganizationTaskCommand(
              title: _titleController.text,
              description: _descriptionController.text,
              dueAt: _dueAtController.text,
              priority: _priority,
            ),
          );
      if (mounted) {
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}
