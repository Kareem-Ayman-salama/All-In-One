import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:ain_mobile/src/features/organization/application/organization_content_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationContentPage extends ConsumerWidget {
  const OrganizationContentPage({super.key});

  static const routePath = '/organization/content';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canCreateContent = workspace?.canUseFeature(
          requiredPermissions: {'content.create'},
          requiredModule: 'content',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationContent)),
      floatingActionButton: !canCreateContent
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
              ),
              icon: const Icon(Icons.add_link),
              label: Text(strings.addContentLink),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final content = ref.watch(
              organizationContentProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationContentProvider(workspace.organizationId).future,
                );
              },
              child: content.when(
                data: (items) => _ContentBody(
                  items: items,
                  workspace: workspace,
                  organizationId: workspace.organizationId,
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
                            organizationContentProvider(
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
          _CreateContentLinkSheet(organizationId: organizationId),
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

class _ContentBody extends StatelessWidget {
  const _ContentBody({
    required this.items,
    required this.workspace,
    required this.organizationId,
  });

  final List<ContentItemSummary> items;
  final ActiveWorkspace workspace;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final publishedCount =
        items.where((item) => item.status == 'published').length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _ContentHero(
          title: strings.organizationContent,
          subtitle: strings.organizationContentHint,
          totalCount: items.length,
          publishedCount: publishedCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.folder_copy,
                label: strings.contentItems,
                value: items.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.public,
                label: strings.publishedContent,
                value: publishedCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationContent),
        const SizedBox(height: AinSpacing.md),
        if (items.isEmpty)
          AinEmptyState(
            icon: Icons.folder_copy_outlined,
            title: strings.noContentYet,
          )
        else
          for (final item in items)
            _ContentCard(
              item: item,
              workspace: workspace,
              organizationId: organizationId,
            ),
      ],
    );
  }
}

class _ContentHero extends StatelessWidget {
  const _ContentHero({
    required this.title,
    required this.subtitle,
    required this.totalCount,
    required this.publishedCount,
  });

  final String title;
  final String subtitle;
  final int totalCount;
  final int publishedCount;

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
              icon: Icons.folder_copy_outlined,
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
                  icon: Icons.folder_copy_outlined,
                  label: totalCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.public_outlined,
                  label: publishedCount.toString(),
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

class _ContentCard extends ConsumerWidget {
  const _ContentCard({
    required this.item,
    required this.workspace,
    required this.organizationId,
  });

  final ContentItemSummary item;
  final ActiveWorkspace workspace;
  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canDelete = workspace.canUseFeature(
      requiredPermissions: {'content.delete'},
      requiredModule: 'content',
    );
    final metadata = <String>[
      strings.contentTypeLabel(item.type),
      strings.courseStatusLabel(item.status),
      if (item.fileAsset != null) item.fileAsset!.originalName,
      if (item.externalUrl != null) item.externalUrl!,
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(
              icon: item.type == 'link'
                  ? Icons.link_outlined
                  : Icons.description_outlined,
              backgroundColor: item.status == 'published'
                  ? AinColors.successSoft
                  : AinColors.warningSoft,
              foregroundColor: item.status == 'published'
                  ? AinColors.success
                  : AinColors.warning,
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
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
            if (canDelete)
              IconButton(
                tooltip: strings.deleteContent,
                onPressed: () async {
                  await ref.read(organizationContentActionsProvider).delete(
                        organizationId: organizationId,
                        contentId: item.id,
                      );
                },
                icon: const Icon(Icons.delete_outline),
              ),
          ],
        ),
      ),
    );
  }
}

class _CreateContentLinkSheet extends ConsumerStatefulWidget {
  const _CreateContentLinkSheet({required this.organizationId});

  final String organizationId;

  @override
  ConsumerState<_CreateContentLinkSheet> createState() {
    return _CreateContentLinkSheetState();
  }
}

class _CreateContentLinkSheetState
    extends ConsumerState<_CreateContentLinkSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _urlController = TextEditingController();
  final _descriptionController = TextEditingController();
  String? _roomId;
  String _source = 'link';
  PlatformFile? _selectedFile;
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _urlController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final rooms = ref.watch(organizationRoomsProvider(widget.organizationId));

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: rooms.when(
        data: (items) {
          _roomId ??= items.isEmpty ? null : items.first.id;

          return Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    _source == 'link'
                        ? strings.addContentLink
                        : strings.addContentFile,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(
                        value: 'link',
                        label: Text(strings.contentTypeLabel('link')),
                        icon: const Icon(Icons.link),
                      ),
                      ButtonSegment(
                        value: 'file',
                        label: Text(strings.contentTypeLabel('file')),
                        icon: const Icon(Icons.upload_file),
                      ),
                    ],
                    selected: {_source},
                    onSelectionChanged: (value) {
                      setState(() => _source = value.first);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _roomId,
                    decoration: InputDecoration(
                      labelText: strings.organizationRooms,
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
                      return value == null ? strings.roomRequired : null;
                    },
                    onChanged: (value) => setState(() => _roomId = value),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _titleController,
                    decoration: InputDecoration(
                      labelText: strings.contentTitle,
                      border: const OutlineInputBorder(),
                    ),
                    validator: (value) {
                      final length = value?.trim().length ?? 0;
                      return length >= 2 ? null : strings.contentTitleRequired;
                    },
                  ),
                  const SizedBox(height: 12),
                  if (_source == 'link')
                    TextFormField(
                      controller: _urlController,
                      decoration: InputDecoration(
                        labelText: strings.externalUrl,
                        border: const OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.url,
                      validator: (value) {
                        final uri = Uri.tryParse(value?.trim() ?? '');
                        return uri != null &&
                                (uri.scheme == 'http' ||
                                    uri.scheme == 'https') &&
                                uri.host.isNotEmpty
                            ? null
                            : strings.validUrlRequired;
                      },
                    )
                  else
                    OutlinedButton.icon(
                      onPressed: _pickFile,
                      icon: const Icon(Icons.upload_file),
                      label: Text(
                        _selectedFile == null
                            ? strings.chooseFile
                            : '${strings.selectedFile}: '
                                '${_selectedFile!.name}',
                      ),
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
                        : Icon(
                            _source == 'link'
                                ? Icons.add_link
                                : Icons.upload_file,
                          ),
                    label: Text(
                      _source == 'link'
                          ? strings.addContentLink
                          : strings.addContentFile,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
        error: (error, stackTrace) => Text(error.toString()),
        loading: () => Center(
          child: Semantics(
            label: strings.loading,
            child: const CircularProgressIndicator(),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final strings = AppStrings.of(context);
    if (_source == 'file') {
      if (_selectedFile?.bytes == null || _selectedFile!.bytes!.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.fileRequired)),
        );
        return;
      }
    }
    setState(() => _submitting = true);
    try {
      if (_source == 'link') {
        await ref.read(organizationContentActionsProvider).createLink(
              organizationId: widget.organizationId,
              command: CreateLinkContentCommand(
                roomId: _roomId!,
                title: _titleController.text,
                externalUrl: _urlController.text,
                description: _descriptionController.text,
              ),
            );
      } else {
        await ref.read(organizationContentActionsProvider).createFile(
              organizationId: widget.organizationId,
              command: CreateFileContentCommand(
                roomId: _roomId!,
                title: _titleController.text,
                fileName: _selectedFile!.name,
                fileBytes: _selectedFile!.bytes!,
                type: _contentTypeFor(_selectedFile!.extension),
                description: _descriptionController.text,
              ),
            );
      }
      if (mounted) {
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(withData: true);
    if (result == null || result.files.isEmpty || !mounted) {
      return;
    }
    setState(() => _selectedFile = result.files.single);
  }

  String _contentTypeFor(String? extension) {
    return switch (extension?.toLowerCase()) {
      'pdf' => 'pdf',
      'png' || 'jpg' || 'jpeg' || 'gif' || 'webp' => 'image',
      'mp4' || 'mov' || 'avi' || 'webm' => 'video',
      _ => 'file',
    };
  }
}
