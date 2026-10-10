import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_member_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_task_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_task_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
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
    final workspace = workspaceState.valueOrNull;
    final canManage = workspace?.canUseFeature(
          requiredPermissions: {'events.manage'},
          requiredModule: 'calendar',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationTasks)),
      floatingActionButton: !canManage
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
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
                  canManage: canManage,
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  children: [
                    AinEmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: error.toString(),
                      action: AinPrimaryButton(
                        onPressed: () {
                          ref.invalidate(
                            organizationTasksProvider(workspace.organizationId),
                          );
                        },
                        icon: Icons.refresh,
                        label: strings.retry,
                      ),
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
          error: (error, stackTrace) => ListView(
            padding: const EdgeInsets.all(AinSpacing.lg),
            children: [
              AinEmptyState(
                icon: Icons.cloud_off_outlined,
                title: error.toString(),
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
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.business_outlined,
          title: strings.chooseWorkspace,
          action: AinPrimaryButton(
            onPressed: () => context.go(WorkspaceSelectionPage.routePath),
            label: strings.chooseWorkspace,
            icon: Icons.business_center_outlined,
          ),
        ),
      ],
    );
  }
}

class _TasksBody extends StatelessWidget {
  const _TasksBody({
    required this.tasks,
    required this.organizationId,
    required this.canManage,
  });

  final List<OrganizationTaskSummary> tasks;
  final String organizationId;
  final bool canManage;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final openCount = tasks.where((task) => !task.isDone).length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _TasksHero(
          title: strings.organizationTasks,
          subtitle: strings.organizationTasksHint,
          totalCount: tasks.length,
          openCount: openCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.list_alt,
                label: strings.tasks,
                value: tasks.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.pending_actions,
                label: strings.openTasks,
                value: openCount.toString(),
                color: AinColors.warning,
                backgroundColor: AinColors.warningSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationTasks),
        const SizedBox(height: AinSpacing.md),
        if (tasks.isEmpty)
          AinEmptyState(
            icon: Icons.task_alt_outlined,
            title: strings.noTasksYet,
          )
        else
          for (final task in tasks)
            _TaskCard(
              task: task,
              organizationId: organizationId,
              canManage: canManage,
            ),
      ],
    );
  }
}

class _TasksHero extends StatelessWidget {
  const _TasksHero({
    required this.title,
    required this.subtitle,
    required this.totalCount,
    required this.openCount,
  });

  final String title;
  final String subtitle;
  final int totalCount;
  final int openCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AinColors.brand, AinColors.brandDark],
        ),
        borderRadius: BorderRadius.circular(AinRadii.lg),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AinIconBadge(
              icon: Icons.task_alt_outlined,
              backgroundColor: Color(0x29FFFFFF),
              foregroundColor: Colors.white,
            ),
            const SizedBox(height: AinSpacing.lg),
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AinSpacing.sm),
            Text(
              subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.86),
                height: 1.35,
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.list_alt_outlined,
                  label: totalCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.pending_actions,
                  label: openCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TaskCard extends ConsumerWidget {
  const _TaskCard({
    required this.task,
    required this.organizationId,
    required this.canManage,
  });

  final OrganizationTaskSummary task;
  final String organizationId;
  final bool canManage;

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

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AinIconBadge(
                  icon: task.isDone
                      ? Icons.check_circle_outline
                      : Icons.task_alt_outlined,
                  backgroundColor: task.isDone
                      ? AinColors.successSoft
                      : AinColors.warningSoft,
                  foregroundColor:
                      task.isDone ? AinColors.success : AinColors.warning,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        task.title,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        metadata.join(' | '),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.muted,
                              height: 1.35,
                            ),
                      ),
                    ],
                  ),
                ),
                if (canManage)
                  IconButton(
                    tooltip: strings.deleteTask,
                    onPressed: () async {
                      await ref.read(organizationTaskActionsProvider).delete(
                            organizationId: organizationId,
                            taskId: task.id,
                          );
                    },
                    icon: const Icon(Icons.delete_outline),
                  ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            DropdownButtonFormField<String>(
              initialValue: task.status,
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
              onChanged: canManage
                  ? (value) async {
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
                    }
                  : null,
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
  String? _roomId;
  String? _assignedTo;
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
    final rooms = ref.watch(organizationRoomsProvider(widget.organizationId));
    final members = ref.watch(
      organizationMembersProvider(widget.organizationId),
    );

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
                initialValue: _priority,
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
              rooms.when(
                data: (items) => DropdownButtonFormField<String>(
                  initialValue: _roomId ?? '',
                  decoration: InputDecoration(
                    labelText: strings.chooseRoom,
                    border: const OutlineInputBorder(),
                  ),
                  items: [
                    DropdownMenuItem(value: '', child: Text(strings.noRoom)),
                    for (final room in items)
                      DropdownMenuItem(
                        value: room.id,
                        child: Text(room.name),
                      ),
                  ],
                  onChanged: (value) {
                    setState(() => _roomId = value == '' ? null : value);
                  },
                ),
                error: (error, stackTrace) => Text(error.toString()),
                loading: () => const Center(child: CircularProgressIndicator()),
              ),
              const SizedBox(height: 12),
              members.when(
                data: (items) => DropdownButtonFormField<String>(
                  initialValue: _assignedTo ?? '',
                  decoration: InputDecoration(
                    labelText: strings.assignedTo,
                    border: const OutlineInputBorder(),
                  ),
                  items: [
                    DropdownMenuItem(
                      value: '',
                      child: Text(strings.unassigned),
                    ),
                    for (final member in items.where(
                      (member) => member.isActive,
                    ))
                      DropdownMenuItem(
                        value: member.userId,
                        child: Text(
                          member.name.isEmpty ? member.email : member.name,
                        ),
                      ),
                  ],
                  onChanged: (value) {
                    setState(() => _assignedTo = value == '' ? null : value);
                  },
                ),
                error: (error, stackTrace) => Text(error.toString()),
                loading: () => const Center(child: CircularProgressIndicator()),
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
              roomId: _roomId,
              assignedTo: _assignedTo,
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
