import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_member_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_member_repository.dart';
import 'package:ain_mobile/src/features/organization/data/organization_room_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
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
    final workspace = workspaceState.valueOrNull;
    final canCreate = workspace?.canUseFeature(
          requiredPermissions: {'rooms.create'},
          requiredModule: 'rooms',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationRooms)),
      floatingActionButton: !canCreate
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
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
                data: (items) => _RoomsBody(
                  organizationId: workspace.organizationId,
                  workspace: workspace,
                  rooms: items,
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
                            organizationRoomsProvider(workspace.organizationId),
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

class _RoomsBody extends StatelessWidget {
  const _RoomsBody({
    required this.organizationId,
    required this.workspace,
    required this.rooms,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final List<OrganizationRoomSummary> rooms;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final activeCount = rooms.where((room) => room.isActive).length;
    final memberCount = rooms.fold<int>(
      0,
      (total, room) => total + room.membershipsCount,
    );

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _RoomsHero(
          title: strings.organizationRooms,
          subtitle: strings.organizationRoomsHint,
          activeCount: activeCount,
          memberCount: memberCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.meeting_room,
                label: strings.activeRooms,
                value: activeCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.groups,
                label: strings.roomMembers,
                value: memberCount.toString(),
                color: AinColors.teal,
                backgroundColor: AinColors.tealSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationRooms),
        const SizedBox(height: AinSpacing.md),
        if (rooms.isEmpty)
          AinEmptyState(
            icon: Icons.meeting_room_outlined,
            title: strings.noRoomsYet,
          )
        else
          for (final room in rooms)
            _RoomCard(
              organizationId: organizationId,
              workspace: workspace,
              room: room,
            ),
      ],
    );
  }
}

class _RoomsHero extends StatelessWidget {
  const _RoomsHero({
    required this.title,
    required this.subtitle,
    required this.activeCount,
    required this.memberCount,
  });

  final String title;
  final String subtitle;
  final int activeCount;
  final int memberCount;

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
              icon: Icons.meeting_room_outlined,
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
                  icon: Icons.meeting_room_outlined,
                  label: activeCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.groups_outlined,
                  label: memberCount.toString(),
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

class _RoomCard extends ConsumerWidget {
  const _RoomCard({
    required this.organizationId,
    required this.workspace,
    required this.room,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final OrganizationRoomSummary room;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canUpdate = workspace.canUseFeature(
      requiredPermissions: {'rooms.update'},
      requiredModule: 'rooms',
    );
    final canDelete = workspace.canUseFeature(
      requiredPermissions: {'rooms.delete'},
      requiredModule: 'rooms',
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(
              icon: Icons.meeting_room_outlined,
              backgroundColor:
                  room.isActive ? AinColors.successSoft : AinColors.roseSoft,
              foregroundColor:
                  room.isActive ? AinColors.success : AinColors.rose,
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    room.name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    [
                      strings.courseStatusLabel(room.status),
                      room.accessType.replaceAll('_', ' '),
                      strings.membersCount(room.membershipsCount),
                    ].join(' | '),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AinColors.muted,
                          height: 1.3,
                        ),
                  ),
                ],
              ),
            ),
            if (canUpdate || canDelete)
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'members') {
                    _showMembersSheet(context);
                  }
                  if (value == 'edit') {
                    _showEditSheet(context);
                  }
                  if (value == 'delete') {
                    _confirmDelete(context, ref);
                  }
                },
                itemBuilder: (context) => [
                  if (canUpdate)
                    PopupMenuItem(
                      value: 'members',
                      child: Text(strings.manageRoomMembers),
                    ),
                  if (canUpdate)
                    PopupMenuItem(
                      value: 'edit',
                      child: Text(strings.editRoom),
                    ),
                  if (canDelete)
                    PopupMenuItem(
                      value: 'delete',
                      child: Text(strings.deleteRoom),
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _showEditSheet(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CreateRoomSheet(
        organizationId: organizationId,
        room: room,
      ),
    );
  }

  Future<void> _showMembersSheet(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _RoomMembersSheet(
        organizationId: organizationId,
        room: room,
        canUpdateMembers: workspace.canUseFeature(
          requiredPermissions: {'rooms.update'},
          requiredModule: 'rooms',
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(strings.confirmDelete),
        content: Text(strings.deleteRoomPrompt),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(strings.back),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(strings.deleteRoom),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }

    try {
      await ref.read(organizationRoomActionsProvider).delete(
            organizationId: organizationId,
            roomId: room.id,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.roomDeleted)),
        );
      }
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}

class _CreateRoomSheet extends ConsumerStatefulWidget {
  const _CreateRoomSheet({
    required this.organizationId,
    this.room,
  });

  final String organizationId;
  final OrganizationRoomSummary? room;

  @override
  ConsumerState<_CreateRoomSheet> createState() => _CreateRoomSheetState();
}

class _CreateRoomSheetState extends ConsumerState<_CreateRoomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _accessType = 'read_only';
  String _status = 'active';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final room = widget.room;
    if (room != null) {
      _nameController.text = room.name;
      _descriptionController.text = room.description ?? '';
      _accessType = room.accessType;
      _status = room.status;
    }
  }

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
              widget.room == null ? strings.createRoom : strings.editRoom,
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
              initialValue: _accessType,
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
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: InputDecoration(
                labelText: strings.courseStatusLabel(_status),
                border: const OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'active', child: Text('Active')),
                DropdownMenuItem(value: 'archived', child: Text('Archived')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() => _status = value);
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
              label: Text(
                widget.room == null ? strings.createRoom : strings.saveChanges,
              ),
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
    final strings = AppStrings.of(context);
    try {
      if (widget.room == null) {
        await ref.read(organizationRoomActionsProvider).create(
              organizationId: widget.organizationId,
              command: CreateOrganizationRoomCommand(
                name: _nameController.text,
                description: _descriptionController.text,
                accessType: _accessType,
                status: _status,
              ),
            );
      } else {
        await ref.read(organizationRoomActionsProvider).update(
              organizationId: widget.organizationId,
              roomId: widget.room!.id,
              command: UpdateOrganizationRoomCommand(
                name: _nameController.text,
                description: _descriptionController.text,
                accessType: _accessType,
                status: _status,
              ),
            );
      }
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.room == null ? strings.createRoom : strings.roomUpdated,
            ),
          ),
        );
      }
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _RoomMembersSheet extends ConsumerStatefulWidget {
  const _RoomMembersSheet({
    required this.organizationId,
    required this.room,
    required this.canUpdateMembers,
  });

  final String organizationId;
  final OrganizationRoomSummary room;
  final bool canUpdateMembers;

  @override
  ConsumerState<_RoomMembersSheet> createState() => _RoomMembersSheetState();
}

class _RoomMembersSheetState extends ConsumerState<_RoomMembersSheet> {
  String? _selectedUserId;
  String _selectedRole = 'member';
  bool _submitting = false;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final request = RoomMembersRequest(
      organizationId: widget.organizationId,
      roomId: widget.room.id,
    );
    final roomMembers = ref.watch(organizationRoomMembersProvider(request));
    final organizationMembers = widget.canUpdateMembers
        ? ref.watch(organizationMembersProvider(widget.organizationId))
        : null;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, bottomInset + 16),
      child: ListView(
        shrinkWrap: true,
        children: [
          Text(
            strings.manageRoomMembers,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 4),
          Text(widget.room.name),
          const SizedBox(height: 16),
          if (widget.canUpdateMembers) ...[
            organizationMembers!.when(
              data: (members) => _AddRoomMemberForm(
                members: members.where((member) => member.isActive).toList(),
                selectedUserId: _selectedUserId,
                selectedRole: _selectedRole,
                submitting: _submitting,
                onUserChanged: (value) {
                  setState(() => _selectedUserId = value);
                },
                onRoleChanged: (value) => setState(() => _selectedRole = value),
                onSubmit: _addMember,
              ),
              error: (error, stackTrace) => Text(error.toString()),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
            const SizedBox(height: 16),
          ],
          roomMembers.when(
            data: (members) {
              if (members.isEmpty) {
                return AinEmptyState(
                  icon: Icons.groups_outlined,
                  title: strings.noRoomMembersYet,
                );
              }

              return Column(
                children: [
                  for (final member in members)
                    _RoomMemberTile(
                      organizationId: widget.organizationId,
                      roomId: widget.room.id,
                      canUpdateMembers: widget.canUpdateMembers,
                      member: member,
                    ),
                ],
              );
            },
            error: (error, stackTrace) => Text(error.toString()),
            loading: () => const Center(child: CircularProgressIndicator()),
          ),
        ],
      ),
    );
  }

  Future<void> _addMember() async {
    if (_selectedUserId == null) {
      return;
    }
    setState(() => _submitting = true);
    final strings = AppStrings.of(context);
    try {
      await ref.read(organizationRoomActionsProvider).addMember(
            organizationId: widget.organizationId,
            roomId: widget.room.id,
            command: CreateRoomMemberCommand(
              userId: _selectedUserId!,
              role: _selectedRole,
            ),
          );
      if (mounted) {
        setState(() => _selectedUserId = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.roomMemberAdded)),
        );
      }
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _AddRoomMemberForm extends StatelessWidget {
  const _AddRoomMemberForm({
    required this.members,
    required this.selectedUserId,
    required this.selectedRole,
    required this.submitting,
    required this.onUserChanged,
    required this.onRoleChanged,
    required this.onSubmit,
  });

  final List<OrganizationMemberSummary> members;
  final String? selectedUserId;
  final String selectedRole;
  final bool submitting;
  final ValueChanged<String?> onUserChanged;
  final ValueChanged<String> onRoleChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DropdownButtonFormField<String>(
          initialValue: members.any((member) => member.userId == selectedUserId)
              ? selectedUserId
              : null,
          decoration: InputDecoration(
            labelText: strings.chooseMember,
            border: const OutlineInputBorder(),
          ),
          items: [
            for (final member in members)
              DropdownMenuItem(
                value: member.userId,
                child: Text(member.name.isEmpty ? member.email : member.name),
              ),
          ],
          onChanged: submitting ? null : onUserChanged,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: selectedRole,
          decoration: InputDecoration(
            labelText: strings.role,
            border: const OutlineInputBorder(),
          ),
          items: const [
            DropdownMenuItem(value: 'member', child: Text('Member')),
            DropdownMenuItem(value: 'assistant', child: Text('Assistant')),
            DropdownMenuItem(value: 'instructor', child: Text('Instructor')),
          ],
          onChanged: submitting || members.isEmpty
              ? null
              : (value) {
                  if (value != null) {
                    onRoleChanged(value);
                  }
                },
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: submitting || selectedUserId == null ? null : onSubmit,
          icon: submitting
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.person_add),
          label: Text(strings.addRoomMember),
        ),
      ],
    );
  }
}

class _RoomMemberTile extends ConsumerWidget {
  const _RoomMemberTile({
    required this.organizationId,
    required this.roomId,
    required this.canUpdateMembers,
    required this.member,
  });

  final String organizationId;
  final String roomId;
  final bool canUpdateMembers;
  final OrganizationRoomMemberSummary member;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.sm),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.md),
        child: Row(
          children: [
            AinIconBadge(
              icon: Icons.person_outline,
              backgroundColor: member.status == 'active'
                  ? AinColors.successSoft
                  : AinColors.warningSoft,
              foregroundColor: member.status == 'active'
                  ? AinColors.success
                  : AinColors.warning,
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    member.name.isEmpty ? member.email : member.name,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  Text(
                    '${member.role} | ${member.status}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AinColors.muted,
                        ),
                  ),
                ],
              ),
            ),
            if (canUpdateMembers)
              PopupMenuButton<String>(
                onSelected: (value) {
                  if (value == 'remove') {
                    _remove(context, ref);
                    return;
                  }
                  _update(context, ref, value);
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'member', child: Text('Member')),
                  const PopupMenuItem(
                    value: 'assistant',
                    child: Text('Assistant'),
                  ),
                  const PopupMenuItem(
                    value: 'instructor',
                    child: Text('Instructor'),
                  ),
                  const PopupMenuDivider(),
                  PopupMenuItem(
                    value: 'active',
                    child: Text(strings.memberStatusLabel('active')),
                  ),
                  PopupMenuItem(
                    value: 'suspended',
                    child: Text(strings.memberStatusLabel('suspended')),
                  ),
                  const PopupMenuDivider(),
                  PopupMenuItem(
                    value: 'remove',
                    child: Text(strings.removeMember),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _update(
    BuildContext context,
    WidgetRef ref,
    String value,
  ) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(organizationRoomActionsProvider).updateMember(
            organizationId: organizationId,
            roomId: roomId,
            roomMembershipId: member.id,
            command: value == 'active' || value == 'suspended'
                ? UpdateRoomMemberCommand(status: value)
                : UpdateRoomMemberCommand(role: value),
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.roomMemberUpdated)),
        );
      }
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }

  Future<void> _remove(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(organizationRoomActionsProvider).removeMember(
            organizationId: organizationId,
            roomId: roomId,
            roomMembershipId: member.id,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.roomMemberRemoved)),
        );
      }
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString())),
        );
      }
    }
  }
}
