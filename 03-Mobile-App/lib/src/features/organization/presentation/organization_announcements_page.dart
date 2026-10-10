import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_announcement_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_announcement_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationAnnouncementsPage extends ConsumerWidget {
  const OrganizationAnnouncementsPage({super.key});

  static const routePath = '/organization/announcements';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canCreate = workspace?.canUseFeature(
          requiredPermissions: {'announcements.create'},
          requiredModule: 'announcements',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationAnnouncements)),
      floatingActionButton: !canCreate
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
              ),
              icon: const Icon(Icons.campaign),
              label: Text(strings.createAnnouncement),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final announcements = ref.watch(
              organizationAnnouncementsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationAnnouncementsProvider(
                    workspace.organizationId,
                  ).future,
                );
              },
              child: announcements.when(
                data: (items) => _AnnouncementsBody(
                  organizationId: workspace.organizationId,
                  workspace: workspace,
                  announcements: items,
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
                            organizationAnnouncementsProvider(
                              workspace.organizationId,
                            ),
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
      builder: (context) =>
          _CreateAnnouncementSheet(organizationId: organizationId),
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

class _AnnouncementsBody extends StatelessWidget {
  const _AnnouncementsBody({
    required this.organizationId,
    required this.workspace,
    required this.announcements,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final List<OrganizationAnnouncementSummary> announcements;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final pinnedCount = announcements.where((item) => item.pinned).length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _AnnouncementsHero(
          title: strings.organizationAnnouncements,
          subtitle: strings.organizationAnnouncementsHint,
          totalCount: announcements.length,
          pinnedCount: pinnedCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.campaign,
                label: strings.announcements,
                value: announcements.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.push_pin,
                label: strings.pinnedAnnouncements,
                value: pinnedCount.toString(),
                color: AinColors.warning,
                backgroundColor: AinColors.warningSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationAnnouncements),
        const SizedBox(height: AinSpacing.md),
        if (announcements.isEmpty)
          AinEmptyState(
            icon: Icons.campaign_outlined,
            title: strings.noAnnouncementsYet,
          )
        else
          for (final announcement in announcements)
            _AnnouncementCard(
              organizationId: organizationId,
              workspace: workspace,
              announcement: announcement,
            ),
      ],
    );
  }
}

class _AnnouncementsHero extends StatelessWidget {
  const _AnnouncementsHero({
    required this.title,
    required this.subtitle,
    required this.totalCount,
    required this.pinnedCount,
  });

  final String title;
  final String subtitle;
  final int totalCount;
  final int pinnedCount;

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
              icon: Icons.campaign_outlined,
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
                  icon: Icons.campaign_outlined,
                  label: totalCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.push_pin_outlined,
                  label: pinnedCount.toString(),
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

class _AnnouncementCard extends ConsumerWidget {
  const _AnnouncementCard({
    required this.organizationId,
    required this.workspace,
    required this.announcement,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final OrganizationAnnouncementSummary announcement;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canUpdate = workspace.canUseFeature(
      requiredPermissions: {'announcements.update'},
      requiredModule: 'announcements',
    );
    final canDelete = workspace.canUseFeature(
      requiredPermissions: {'announcements.delete'},
      requiredModule: 'announcements',
    );
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
                  icon: announcement.pinned
                      ? Icons.push_pin_outlined
                      : Icons.campaign_outlined,
                  backgroundColor: announcement.pinned
                      ? AinColors.warningSoft
                      : AinColors.brandSoft,
                  foregroundColor:
                      announcement.pinned ? AinColors.warning : AinColors.brand,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Text(
                    announcement.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                ),
                if (canUpdate || canDelete)
                  PopupMenuButton<String>(
                    onSelected: (value) {
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
                          value: 'edit',
                          child: Text(strings.editAnnouncement),
                        ),
                      if (canDelete)
                        PopupMenuItem(
                          value: 'delete',
                          child: Text(strings.deleteAnnouncement),
                        ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Text(
              announcement.body,
              maxLines: 4,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AinColors.muted,
                    height: 1.35,
                  ),
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: announcement.isRoomAnnouncement
                      ? Icons.meeting_room_outlined
                      : Icons.business_outlined,
                  label: strings.announcementAudienceLabel(
                    announcement.audience,
                  ),
                ),
                if (announcement.pinned)
                  AinStatusPill(
                    icon: Icons.push_pin_outlined,
                    label: strings.pinned,
                    color: AinColors.warning,
                    backgroundColor: AinColors.warningSoft,
                  ),
                if (announcement.publishedAt != null)
                  AinStatusPill(
                    icon: Icons.schedule_outlined,
                    label: announcement.publishedAt!,
                    color: AinColors.teal,
                    backgroundColor: AinColors.tealSoft,
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
      builder: (context) => _CreateAnnouncementSheet(
        organizationId: organizationId,
        announcement: announcement,
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(strings.confirmDelete),
        content: Text(strings.deleteAnnouncementPrompt),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(strings.back),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(strings.deleteAnnouncement),
          ),
        ],
      ),
    );
    if (confirmed != true) {
      return;
    }

    try {
      await ref.read(organizationAnnouncementActionsProvider).delete(
            organizationId: organizationId,
            announcementId: announcement.id,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.announcementDeleted)),
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

class _CreateAnnouncementSheet extends ConsumerStatefulWidget {
  const _CreateAnnouncementSheet({
    required this.organizationId,
    this.announcement,
  });

  final String organizationId;
  final OrganizationAnnouncementSummary? announcement;

  @override
  ConsumerState<_CreateAnnouncementSheet> createState() {
    return _CreateAnnouncementSheetState();
  }
}

class _CreateAnnouncementSheetState
    extends ConsumerState<_CreateAnnouncementSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _bodyController = TextEditingController();
  String _audience = 'organization';
  String? _roomId;
  bool _pinned = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final announcement = widget.announcement;
    if (announcement != null) {
      _titleController.text = announcement.title;
      _bodyController.text = announcement.body;
      _audience = announcement.isRoomAnnouncement ? 'room' : 'organization';
      _roomId = announcement.roomId;
      _pinned = announcement.pinned;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _bodyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final rooms = ref.watch(organizationRoomsProvider(widget.organizationId));

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          children: [
            Text(
              widget.announcement == null
                  ? strings.createAnnouncement
                  : strings.editAnnouncement,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: strings.announcementTitle,
                border: const OutlineInputBorder(),
              ),
              validator: (value) {
                final length = value?.trim().length ?? 0;
                return length >= 3 ? null : strings.announcementTitleRequired;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _bodyController,
              decoration: InputDecoration(
                labelText: strings.announcementBody,
                border: const OutlineInputBorder(),
              ),
              maxLines: 5,
              validator: (value) {
                final length = value?.trim().length ?? 0;
                return length >= 3 ? null : strings.announcementBodyRequired;
              },
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(
                  value: 'organization',
                  label: Text(strings.organizationWide),
                  icon: const Icon(Icons.business),
                ),
                ButtonSegment(
                  value: 'room',
                  label: Text(strings.targetRoom),
                  icon: const Icon(Icons.meeting_room),
                ),
              ],
              selected: {_audience},
              onSelectionChanged: (value) {
                setState(() {
                  _audience = value.first;
                  if (_audience == 'organization') {
                    _roomId = null;
                  }
                });
              },
            ),
            const SizedBox(height: 12),
            if (_audience == 'room')
              rooms.when(
                data: (items) {
                  _roomId ??= items.isEmpty ? null : items.first.id;

                  return DropdownButtonFormField<String>(
                    initialValue: items.any((room) => room.id == _roomId)
                        ? _roomId
                        : null,
                    decoration: InputDecoration(
                      labelText: strings.chooseRoom,
                      border: const OutlineInputBorder(),
                    ),
                    items: [
                      for (final room in items)
                        DropdownMenuItem(
                          value: room.id,
                          child: Text(room.name),
                        ),
                    ],
                    validator: (value) {
                      return _audience == 'room' && value == null
                          ? strings.roomRequiredForAnnouncement
                          : null;
                    },
                    onChanged: (value) => setState(() => _roomId = value),
                  );
                },
                error: (error, stackTrace) => Text(error.toString()),
                loading: () => const Center(child: CircularProgressIndicator()),
              ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(strings.pinAnnouncement),
              value: _pinned,
              onChanged: (value) => setState(() => _pinned = value),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send),
              label: Text(
                widget.announcement == null
                    ? strings.createAnnouncement
                    : strings.saveChanges,
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
    final strings = AppStrings.of(context);
    if (_audience == 'room' && _roomId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.roomRequiredForAnnouncement)),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      if (widget.announcement == null) {
        await ref.read(organizationAnnouncementActionsProvider).create(
              organizationId: widget.organizationId,
              command: CreateOrganizationAnnouncementCommand(
                title: _titleController.text,
                body: _bodyController.text,
                roomId: _audience == 'room' ? _roomId : null,
                audience: _audience,
                pinned: _pinned,
              ),
            );
      } else {
        await ref.read(organizationAnnouncementActionsProvider).update(
              organizationId: widget.organizationId,
              announcementId: widget.announcement!.id,
              command: UpdateOrganizationAnnouncementCommand(
                title: _titleController.text,
                body: _bodyController.text,
                roomId: _audience == 'room' ? _roomId : null,
                audience: _audience,
                pinned: _pinned,
                publishedAt: widget.announcement!.publishedAt,
              ),
            );
      }
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.announcement == null
                  ? strings.createAnnouncement
                  : strings.announcementUpdated,
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
