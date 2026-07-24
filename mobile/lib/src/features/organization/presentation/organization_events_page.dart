import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_event_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_event_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationEventsPage extends ConsumerWidget {
  const OrganizationEventsPage({super.key});

  static const routePath = '/organization/events';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationEvents)),
      floatingActionButton: workspaceState.valueOrNull == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspaceState.valueOrNull!.organizationId,
              ),
              icon: const Icon(Icons.event_available),
              label: Text(strings.createEvent),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final events = ref.watch(
              organizationEventsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationEventsProvider(workspace.organizationId).future,
                );
              },
              child: events.when(
                data: (items) => _EventsBody(
                  events: items,
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
                          organizationEventsProvider(workspace.organizationId),
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
      builder: (context) => _CreateEventSheet(organizationId: organizationId),
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

class _EventsBody extends StatelessWidget {
  const _EventsBody({required this.events, required this.organizationId});

  final List<OrganizationEventSummary> events;
  final String organizationId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final scheduledCount = events.where((event) => event.isScheduled).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationEvents,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationEventsHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.event,
                label: strings.events,
                value: events.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.schedule,
                label: strings.scheduledEvents,
                value: scheduledCount.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (events.isEmpty)
          Text(strings.noEventsYet)
        else
          for (final event in events)
            _EventCard(event: event, organizationId: organizationId),
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

class _EventCard extends ConsumerWidget {
  const _EventCard({required this.event, required this.organizationId});

  final OrganizationEventSummary event;
  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final metadata = <String>[
      strings.eventTypeLabel(event.type),
      strings.eventStatusLabel(event.status),
      event.startsAt,
      if (event.location != null) event.location!,
    ];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: const Icon(Icons.event),
        title: Text(event.title),
        subtitle: Text(metadata.join(' | ')),
        trailing: IconButton(
          tooltip: strings.deleteEvent,
          onPressed: () async {
            await ref
                .read(organizationEventActionsProvider)
                .delete(organizationId: organizationId, eventId: event.id);
          },
          icon: const Icon(Icons.delete_outline),
        ),
      ),
    );
  }
}

class _CreateEventSheet extends ConsumerStatefulWidget {
  const _CreateEventSheet({required this.organizationId});

  final String organizationId;

  @override
  ConsumerState<_CreateEventSheet> createState() => _CreateEventSheetState();
}

class _CreateEventSheetState extends ConsumerState<_CreateEventSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _startsAtController = TextEditingController();
  final _endsAtController = TextEditingController();
  final _locationController = TextEditingController();
  String _type = 'meeting';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final start = DateTime.now().add(const Duration(days: 1));
    final end = start.add(const Duration(hours: 1));
    _startsAtController.text = start.toIso8601String();
    _endsAtController.text = end.toIso8601String();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _startsAtController.dispose();
    _endsAtController.dispose();
    _locationController.dispose();
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
                strings.createEvent,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(
                  labelText: strings.eventTitle,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) {
                  final length = value?.trim().length ?? 0;
                  return length >= 3 ? null : strings.eventTitleRequired;
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _type,
                decoration: InputDecoration(
                  labelText: strings.eventType,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(
                    value: 'event',
                    child: Text(strings.eventTypeLabel('event')),
                  ),
                  DropdownMenuItem(
                    value: 'class',
                    child: Text(strings.eventTypeLabel('class')),
                  ),
                  DropdownMenuItem(
                    value: 'exam',
                    child: Text(strings.eventTypeLabel('exam')),
                  ),
                  DropdownMenuItem(
                    value: 'meeting',
                    child: Text(strings.eventTypeLabel('meeting')),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _type = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _startsAtController,
                decoration: InputDecoration(
                  labelText: strings.startsAt,
                  border: const OutlineInputBorder(),
                ),
                validator: _validateDate,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _endsAtController,
                decoration: InputDecoration(
                  labelText: strings.endsAt,
                  border: const OutlineInputBorder(),
                ),
                validator: _validateDate,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: strings.location,
                  border: const OutlineInputBorder(),
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
                    : const Icon(Icons.add),
                label: Text(strings.createEvent),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _validateDate(String? value) {
    if (DateTime.tryParse(value?.trim() ?? '') == null) {
      return AppStrings.of(context).validIsoDateRequired;
    }

    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref
          .read(organizationEventActionsProvider)
          .create(
            organizationId: widget.organizationId,
            command: CreateOrganizationEventCommand(
              title: _titleController.text,
              description: _descriptionController.text,
              type: _type,
              startsAt: _startsAtController.text,
              endsAt: _endsAtController.text,
              location: _locationController.text,
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
