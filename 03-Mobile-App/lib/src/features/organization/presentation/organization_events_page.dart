import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_event_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_event_repository.dart';
import 'package:ain_mobile/src/features/organization/data/organization_room_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationEventsPage extends ConsumerStatefulWidget {
  const OrganizationEventsPage({super.key});

  static const routePath = '/organization/events';

  @override
  ConsumerState<OrganizationEventsPage> createState() {
    return _OrganizationEventsPageState();
  }
}

class _OrganizationEventsPageState
    extends ConsumerState<OrganizationEventsPage> {
  String? _roomId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canManage = workspace?.canUseFeature(
          requiredPermissions: {'events.manage'},
          requiredModule: 'calendar',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationEvents)),
      floatingActionButton: !canManage
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
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

            final request = OrganizationEventsRequest(
              organizationId: workspace.organizationId,
              roomId: _roomId,
            );
            final events = ref.watch(
              organizationEventsProvider(request),
            );
            final rooms = ref.watch(
              organizationRoomsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationEventsProvider(request).future,
                );
              },
              child: events.when(
                data: (items) => _EventsBody(
                  events: items,
                  organizationId: workspace.organizationId,
                  canManage: canManage,
                  roomId: _roomId,
                  rooms: rooms,
                  onRoomChanged: (value) {
                    setState(() => _roomId = value == '' ? null : value);
                  },
                ),
                error: (error, stackTrace) => ListView(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  children: [
                    AinEmptyState(
                      icon: Icons.cloud_off_outlined,
                      title: error.toString(),
                      action: AinPrimaryButton(
                        onPressed: () {
                          ref.invalidate(organizationEventsProvider(request));
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

class _EventsBody extends StatelessWidget {
  const _EventsBody({
    required this.events,
    required this.organizationId,
    required this.canManage,
    required this.roomId,
    required this.rooms,
    required this.onRoomChanged,
  });

  final List<OrganizationEventSummary> events;
  final String organizationId;
  final bool canManage;
  final String? roomId;
  final AsyncValue<List<OrganizationRoomSummary>> rooms;
  final ValueChanged<String?> onRoomChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final scheduledCount = events.where((event) => event.isScheduled).length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _EventsHero(
          title: strings.organizationEvents,
          subtitle: strings.organizationEventsHint,
          totalCount: events.length,
          scheduledCount: scheduledCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        rooms.when(
          data: (items) => DropdownButtonFormField<String>(
            initialValue: roomId ?? '',
            decoration: InputDecoration(
              labelText: strings.chooseRoom,
              border: const OutlineInputBorder(),
            ),
            items: [
              DropdownMenuItem(value: '', child: Text(strings.allRooms)),
              for (final room in items)
                DropdownMenuItem(value: room.id, child: Text(room.name)),
            ],
            onChanged: onRoomChanged,
          ),
          error: (error, stackTrace) => Text(error.toString()),
          loading: () => const LinearProgressIndicator(),
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.event,
                label: strings.events,
                value: events.length.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.schedule,
                label: strings.scheduledEvents,
                value: scheduledCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationEvents),
        const SizedBox(height: AinSpacing.md),
        if (events.isEmpty)
          AinEmptyState(
            icon: Icons.event_busy_outlined,
            title: strings.noEventsYet,
          )
        else
          for (final event in events)
            _EventCard(
              event: event,
              organizationId: organizationId,
              canManage: canManage,
            ),
      ],
    );
  }
}

class _EventsHero extends StatelessWidget {
  const _EventsHero({
    required this.title,
    required this.subtitle,
    required this.totalCount,
    required this.scheduledCount,
  });

  final String title;
  final String subtitle;
  final int totalCount;
  final int scheduledCount;

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
              icon: Icons.event_available_outlined,
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
                  icon: Icons.event_outlined,
                  label: totalCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.schedule_outlined,
                  label: scheduledCount.toString(),
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

class _EventCard extends ConsumerWidget {
  const _EventCard({
    required this.event,
    required this.organizationId,
    required this.canManage,
  });

  final OrganizationEventSummary event;
  final String organizationId;
  final bool canManage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final metadata = <String>[
      strings.eventTypeLabel(event.type),
      strings.eventStatusLabel(event.status),
      event.startsAt,
      if (event.location != null) event.location!,
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(
              icon: Icons.event_outlined,
              backgroundColor:
                  event.isScheduled ? AinColors.successSoft : AinColors.canvas,
              foregroundColor:
                  event.isScheduled ? AinColors.success : AinColors.muted,
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
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
            if (canManage)
              IconButton(
                tooltip: strings.deleteEvent,
                onPressed: () async {
                  await ref.read(organizationEventActionsProvider).delete(
                        organizationId: organizationId,
                        eventId: event.id,
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
  String? _roomId;
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
    final rooms = ref.watch(organizationRoomsProvider(widget.organizationId));

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
                initialValue: _type,
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
              TextFormField(
                controller: _startsAtController,
                decoration: InputDecoration(
                  labelText: strings.startsAt,
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    onPressed: () => _pickDateTime(_startsAtController),
                    icon: const Icon(Icons.calendar_month),
                  ),
                ),
                readOnly: true,
                validator: _validateDate,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _endsAtController,
                decoration: InputDecoration(
                  labelText: strings.endsAt,
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    onPressed: () => _pickDateTime(_endsAtController),
                    icon: const Icon(Icons.calendar_month),
                  ),
                ),
                readOnly: true,
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
      await ref.read(organizationEventActionsProvider).create(
            organizationId: widget.organizationId,
            command: CreateOrganizationEventCommand(
              title: _titleController.text,
              description: _descriptionController.text,
              type: _type,
              startsAt: _startsAtController.text,
              endsAt: _endsAtController.text,
              location: _locationController.text,
              roomId: _roomId,
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

  Future<void> _pickDateTime(TextEditingController controller) async {
    final initial = DateTime.tryParse(controller.text) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 3)),
    );
    if (date == null || !mounted) {
      return;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null || !mounted) {
      return;
    }
    final value = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() => controller.text = value.toIso8601String());
  }
}
