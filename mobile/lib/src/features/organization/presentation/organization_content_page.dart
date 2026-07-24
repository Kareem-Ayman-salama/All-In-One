import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:ain_mobile/src/features/organization/application/organization_content_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
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

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationContent)),
      floatingActionButton: workspaceState.valueOrNull == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspaceState.valueOrNull!.organizationId,
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
                          organizationContentProvider(
                            workspace.organizationId,
                          ),
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

  Future<void> _showCreateSheet(
    BuildContext context,
    String organizationId,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CreateContentLinkSheet(
        organizationId: organizationId,
      ),
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

class _ContentBody extends StatelessWidget {
  const _ContentBody({
    required this.items,
    required this.organizationId,
  });

  final List<ContentItemSummary> items;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final publishedCount = items.where((item) => item.status == 'published').length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationContent,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationContentHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.folder_copy,
                label: strings.contentItems,
                value: items.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.public,
                label: strings.publishedContent,
                value: publishedCount.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          Text(strings.noContentYet)
        else
          for (final item in items)
            _ContentCard(item: item, organizationId: organizationId),
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

class _ContentCard extends ConsumerWidget {
  const _ContentCard({
    required this.item,
    required this.organizationId,
  });

  final ContentItemSummary item;
  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final metadata = <String>[
      strings.contentTypeLabel(item.type),
      strings.courseStatusLabel(item.status),
      if (item.fileAsset != null) item.fileAsset!.originalName,
      if (item.externalUrl != null) item.externalUrl!,
    ];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(item.type == 'link' ? Icons.link : Icons.description),
        title: Text(item.title),
        subtitle: Text(metadata.join(' | ')),
        trailing: IconButton(
          tooltip: strings.deleteContent,
          onPressed: () async {
            await ref.read(organizationContentActionsProvider).delete(
                  organizationId: organizationId,
                  contentId: item.id,
                );
          },
          icon: const Icon(Icons.delete_outline),
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
                    strings.addContentLink,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _roomId,
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
                              (uri.scheme == 'http' || uri.scheme == 'https') &&
                              uri.host.isNotEmpty
                          ? null
                          : strings.validUrlRequired;
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
                        : const Icon(Icons.add_link),
                    label: Text(strings.addContentLink),
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
    setState(() => _submitting = true);
    try {
      await ref.read(organizationContentActionsProvider).createLink(
            organizationId: widget.organizationId,
            command: CreateLinkContentCommand(
              roomId: _roomId!,
              title: _titleController.text,
              externalUrl: _urlController.text,
              description: _descriptionController.text,
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
