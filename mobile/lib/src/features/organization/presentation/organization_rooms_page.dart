import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_room_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationRoomsPage extends ConsumerWidget {
  const OrganizationRoomsPage({super.key});

  static const routePath = '/organization/rooms';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationRooms)),
      floatingActionButton: workspaceState.valueOrNull == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspaceState.valueOrNull!.organizationId,
              ),
              icon: const Icon(Icons.add_home_work),
              label: Text(strings.createRoom),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final rooms = ref.watch(
              organizationRoomsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationRoomsProvider(workspace.organizationId).future,
                );
              },
              child: rooms.when(
                data: (items) => _RoomsBody(rooms: items),
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
                          organizationRoomsProvider(workspace.organizationId),
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
      builder: (context) => _CreateRoomSheet(organizationId: organizationId),
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

class _RoomsBody extends StatelessWidget {
  const _RoomsBody({required this.rooms});

  final List<OrganizationRoomSummary> rooms;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final activeCount = rooms.where((room) => room.isActive).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationRooms,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationRoomsHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.meeting_room,
                label: strings.activeRooms,
                value: activeCount.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.groups,
                label: strings.roomMembers,
                value: rooms
                    .fold<int>(
                      0,
                      (total, room) => total + room.membershipsCount,
                    )
                    .toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (rooms.isEmpty)
          Text(strings.noRoomsYet)
        else
          for (final room in rooms) _RoomCard(room: room),
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

class _RoomCard extends StatelessWidget {
  const _RoomCard({required this.room});

  final OrganizationRoomSummary room;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: const Icon(Icons.meeting_room),
        title: Text(room.name),
        subtitle: Text(
          [
            strings.courseStatusLabel(room.status),
            room.accessType.replaceAll('_', ' '),
            strings.membersCount(room.membershipsCount),
          ].join(' | '),
        ),
      ),
    );
  }
}

class _CreateRoomSheet extends ConsumerStatefulWidget {
  const _CreateRoomSheet({required this.organizationId});

  final String organizationId;

  @override
  ConsumerState<_CreateRoomSheet> createState() => _CreateRoomSheetState();
}

class _CreateRoomSheetState extends ConsumerState<_CreateRoomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _accessType = 'read_only';
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              strings.createRoom,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                labelText: strings.roomName,
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                return (value?.trim().length ?? 0) >= 2
                    ? null
                    : strings.roomNameRequired;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _accessType,
              decoration: InputDecoration(
                labelText: strings.accessType,
                border: const OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'read_only', child: Text('Read only')),
                DropdownMenuItem(
                  value: 'collaborative',
                  child: Text('Collaborative'),
                ),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() => _accessType = value);
                }
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
              label: Text(strings.createRoom),
            ),
          ],
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
      await ref.read(organizationRoomActionsProvider).create(
            organizationId: widget.organizationId,
            command: CreateOrganizationRoomCommand(
              name: _nameController.text,
              description: _descriptionController.text,
              accessType: _accessType,
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
