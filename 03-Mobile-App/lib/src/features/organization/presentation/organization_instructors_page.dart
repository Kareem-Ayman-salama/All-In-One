import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_instructor_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_instructor_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationInstructorsPage extends ConsumerWidget {
  const OrganizationInstructorsPage({super.key});

  static const routePath = '/organization/instructors';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canCreate = workspace?.canUseFeature(
          requiredPermissions: {'courses.create'},
          requiredModule: 'courses',
        ) ??
        false;
    final canUpdate = workspace?.canUseFeature(
          requiredPermissions: {'courses.update'},
          requiredModule: 'courses',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationInstructors)),
      floatingActionButton: !canCreate
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showInstructorSheet(
                context,
                workspace!.organizationId,
              ),
              icon: const Icon(Icons.person_add),
              label: Text(strings.createInstructor),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final overview = ref.watch(
              organizationInstructorsOverviewProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationInstructorsOverviewProvider(
                    workspace.organizationId,
                  ).future,
                );
              },
              child: overview.when(
                data: (value) => _InstructorsBody(
                  organizationId: workspace.organizationId,
                  overview: value,
                  canCreate: canCreate,
                  canUpdate: canUpdate,
                ),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(
                      organizationInstructorsOverviewProvider(
                        workspace.organizationId,
                      ),
                    );
                  },
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
          error: (error, stackTrace) => _ErrorList(
            message: error.toString(),
            onRetry: () => ref.invalidate(activeWorkspaceControllerProvider),
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

  Future<void> _showInstructorSheet(
    BuildContext context,
    String organizationId,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) =>
          _InstructorFormSheet(organizationId: organizationId),
    );
  }
}

class _InstructorsBody extends StatelessWidget {
  const _InstructorsBody({
    required this.organizationId,
    required this.overview,
    required this.canCreate,
    required this.canUpdate,
  });

  final String organizationId;
  final OrganizationInstructorsOverview overview;
  final bool canCreate;
  final bool canUpdate;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _InstructorsHero(
          title: strings.organizationInstructors,
          subtitle: strings.organizationInstructorsHint,
          activeCount: overview.activeInstructorCount,
          openSlotCount: overview.openSlotCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.school,
                label: strings.activeInstructors,
                value: overview.activeInstructorCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.event_available,
                label: strings.openSlots,
                value: overview.openSlotCount.toString(),
              ),
            ),
          ],
        ),
        if (canUpdate && overview.instructors.isNotEmpty) ...[
          const SizedBox(height: AinSpacing.md),
          AinSecondaryButton(
            onPressed: () => _showSlotSheet(context),
            icon: Icons.add_alarm,
            label: strings.createInstructorSlot,
          ),
        ],
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationInstructors),
        const SizedBox(height: AinSpacing.md),
        if (overview.instructors.isEmpty)
          AinEmptyState(
            icon: Icons.person_search_outlined,
            title: strings.noInstructorsYet,
          )
        else
          for (final instructor in overview.instructors)
            _InstructorCard(
              organizationId: organizationId,
              instructor: instructor,
              slots: overview.slotsForInstructor(instructor.id),
              canUpdate: canUpdate,
            ),
      ],
    );
  }

  Future<void> _showSlotSheet(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _SlotFormSheet(
        organizationId: organizationId,
        instructors: overview.instructors
            .where((instructor) => instructor.isActive)
            .toList(growable: false),
      ),
    );
  }
}

class _InstructorsHero extends StatelessWidget {
  const _InstructorsHero({
    required this.title,
    required this.subtitle,
    required this.activeCount,
    required this.openSlotCount,
  });

  final String title;
  final String subtitle;
  final int activeCount;
  final int openSlotCount;

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
              icon: Icons.co_present_outlined,
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
                  icon: Icons.school_outlined,
                  label: activeCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.event_available_outlined,
                  label: openSlotCount.toString(),
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

class _InstructorCard extends StatelessWidget {
  const _InstructorCard({
    required this.organizationId,
    required this.instructor,
    required this.slots,
    required this.canUpdate,
  });

  final String organizationId;
  final OrganizationInstructorSummary instructor;
  final List<OrganizationInstructorSlotSummary> slots;
  final bool canUpdate;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AinIconBadge(
                  icon: Icons.person_outline,
                  backgroundColor: instructor.isActive
                      ? AinColors.successSoft
                      : AinColors.roseSoft,
                  foregroundColor:
                      instructor.isActive ? AinColors.success : AinColors.rose,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        instructor.localizedName(strings.isArabic),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        instructor.specialties.isEmpty
                            ? strings.instructor
                            : instructor.specialties.join(', '),
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AinColors.muted),
                      ),
                    ],
                  ),
                ),
                if (canUpdate)
                  IconButton(
                    tooltip: strings.editInstructor,
                    onPressed: () => _showEditSheet(context),
                    icon: const Icon(Icons.edit),
                  ),
              ],
            ),
            if (instructor.bio != null) ...[
              const SizedBox(height: AinSpacing.md),
              Text(
                instructor.bio!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AinColors.muted,
                      height: 1.35,
                    ),
              ),
            ],
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.flag_outlined,
                  label: strings.instructorStatus(instructor.status),
                  color:
                      instructor.isActive ? AinColors.success : AinColors.rose,
                  backgroundColor: instructor.isActive
                      ? AinColors.successSoft
                      : AinColors.roseSoft,
                ),
                AinStatusPill(
                  icon: Icons.school_outlined,
                  label: '${instructor.coursesCount} ${strings.courses}',
                ),
                AinStatusPill(
                  icon: Icons.schedule_outlined,
                  label: '${slots.length} ${strings.openSlots}',
                  color: AinColors.teal,
                  backgroundColor: AinColors.tealSoft,
                ),
              ],
            ),
            if (slots.isNotEmpty) ...[
              const SizedBox(height: AinSpacing.md),
              for (final slot in slots.take(3))
                Padding(
                  padding: const EdgeInsets.only(bottom: AinSpacing.sm),
                  child: AinSurface(
                    padding: const EdgeInsets.all(AinSpacing.md),
                    color: AinColors.canvas,
                    child: Row(
                      children: [
                        const AinIconBadge(
                          icon: Icons.schedule_outlined,
                          backgroundColor: AinColors.tealSoft,
                          foregroundColor: AinColors.teal,
                        ),
                        const SizedBox(width: AinSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${slot.startsAt} - ${slot.endsAt}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(fontWeight: FontWeight.w800),
                              ),
                              Text(
                                slot.location ?? slot.deliveryType,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: AinColors.muted),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '${(slot.priceMinor / 100).toStringAsFixed(0)} ${slot.currency}',
                          style: Theme.of(context).textTheme.labelMedium,
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _showEditSheet(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _InstructorFormSheet(
        organizationId: organizationId,
        instructor: instructor,
      ),
    );
  }
}

class _InstructorFormSheet extends ConsumerStatefulWidget {
  const _InstructorFormSheet({
    required this.organizationId,
    this.instructor,
  });

  final String organizationId;
  final OrganizationInstructorSummary? instructor;

  @override
  ConsumerState<_InstructorFormSheet> createState() {
    return _InstructorFormSheetState();
  }
}

class _InstructorFormSheetState extends ConsumerState<_InstructorFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _nameArController;
  late final TextEditingController _bioController;
  late final TextEditingController _bioArController;
  late final TextEditingController _specialtiesController;
  late final TextEditingController _socialLinksController;
  String _status = 'active';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final instructor = widget.instructor;
    _nameController = TextEditingController(text: instructor?.name);
    _nameArController = TextEditingController(text: instructor?.nameAr);
    _bioController = TextEditingController(text: instructor?.bio);
    _bioArController = TextEditingController(text: instructor?.bioAr);
    _specialtiesController = TextEditingController(
      text: instructor?.specialties.join(', '),
    );
    _socialLinksController = TextEditingController(
      text: instructor?.socialLinks.join(', '),
    );
    _status = instructor?.status ?? 'active';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nameArController.dispose();
    _bioController.dispose();
    _bioArController.dispose();
    _specialtiesController.dispose();
    _socialLinksController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final editing = widget.instructor != null;

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
                editing ? strings.editInstructor : strings.createInstructor,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: strings.instructorName,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) {
                  return (value?.trim().isEmpty ?? true)
                      ? strings.requiredField
                      : null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _nameArController,
                decoration: InputDecoration(
                  labelText: strings.arabicName,
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _specialtiesController,
                decoration: InputDecoration(
                  labelText: strings.specialties,
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _status,
                decoration: InputDecoration(
                  labelText: strings.instructorStatusLabel,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(
                    value: 'active',
                    child: Text(strings.instructorStatus('active')),
                  ),
                  DropdownMenuItem(
                    value: 'inactive',
                    child: Text(strings.instructorStatus('inactive')),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _status = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _bioController,
                decoration: InputDecoration(
                  labelText: strings.bio,
                  border: const OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _bioArController,
                decoration: InputDecoration(
                  labelText: strings.arabicBio,
                  border: const OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _socialLinksController,
                decoration: InputDecoration(
                  labelText: strings.socialLinks,
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save),
                label: Text(strings.saveChanges),
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
      final command = CreateOrganizationInstructorCommand(
        name: _nameController.text,
        nameAr: _nameArController.text,
        bio: _bioController.text,
        bioAr: _bioArController.text,
        specialties: _splitCsv(_specialtiesController.text),
        socialLinks: _splitCsv(_socialLinksController.text),
        status: _status,
      );
      final actions = ref.read(organizationInstructorActionsProvider);
      final instructor = widget.instructor;
      if (instructor == null) {
        await actions.createInstructor(
          organizationId: widget.organizationId,
          command: command,
        );
      } else {
        await actions.updateInstructor(
          organizationId: widget.organizationId,
          instructorId: instructor.id,
          command: command,
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
}

class _SlotFormSheet extends ConsumerStatefulWidget {
  const _SlotFormSheet({
    required this.organizationId,
    required this.instructors,
  });

  final String organizationId;
  final List<OrganizationInstructorSummary> instructors;

  @override
  ConsumerState<_SlotFormSheet> createState() => _SlotFormSheetState();
}

class _SlotFormSheetState extends ConsumerState<_SlotFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _locationController = TextEditingController();
  final _priceController = TextEditingController(text: '0');
  String? _instructorId;
  String _deliveryType = 'online';
  DateTime? _startsAt;
  DateTime? _endsAt;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _instructorId =
        widget.instructors.isEmpty ? null : widget.instructors.first.id;
  }

  @override
  void dispose() {
    _locationController.dispose();
    _priceController.dispose();
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
                strings.createInstructorSlot,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _instructorId,
                decoration: InputDecoration(
                  labelText: strings.instructor,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  for (final instructor in widget.instructors)
                    DropdownMenuItem(
                      value: instructor.id,
                      child: Text(instructor.localizedName(strings.isArabic)),
                    ),
                ],
                validator: (value) {
                  return value == null ? strings.requiredField : null;
                },
                onChanged: (value) => setState(() => _instructorId = value),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _pickDateTime(isStart: true),
                icon: const Icon(Icons.schedule),
                label: Text(_startsAt?.toIso8601String() ?? strings.startsAt),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _pickDateTime(isStart: false),
                icon: const Icon(Icons.schedule),
                label: Text(_endsAt?.toIso8601String() ?? strings.endsAt),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _deliveryType,
                decoration: InputDecoration(
                  labelText: strings.deliveryType,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(
                    value: 'online',
                    child: Text(strings.online),
                  ),
                  DropdownMenuItem(
                    value: 'onsite',
                    child: Text(strings.onsite),
                  ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _deliveryType = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _priceController,
                decoration: InputDecoration(
                  labelText: strings.priceMinor,
                  border: const OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: strings.location,
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save),
                label: Text(strings.saveChanges),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDateTime({required bool isStart}) async {
    final initial = isStart
        ? (_startsAt ?? DateTime.now().add(const Duration(days: 1)))
        : (_endsAt ?? DateTime.now().add(const Duration(days: 1, hours: 1)));
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) {
      return;
    }
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) {
      return;
    }
    final next = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() {
      if (isStart) {
        _startsAt = next;
        _endsAt ??= next.add(const Duration(hours: 1));
      } else {
        _endsAt = next;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() ||
        _startsAt == null ||
        _endsAt == null ||
        _instructorId == null) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(organizationInstructorActionsProvider).createSlot(
            organizationId: widget.organizationId,
            command: CreateOrganizationInstructorSlotCommand(
              instructorId: _instructorId!,
              startsAt: _startsAt!.toIso8601String(),
              endsAt: _endsAt!.toIso8601String(),
              deliveryType: _deliveryType,
              priceMinor: int.tryParse(_priceController.text.trim()) ?? 0,
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

class _ErrorList extends StatelessWidget {
  const _ErrorList({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.cloud_off_outlined,
          title: message,
          action: AinPrimaryButton(
            onPressed: onRetry,
            icon: Icons.refresh,
            label: strings.retry,
          ),
        ),
      ],
    );
  }
}

List<String> _splitCsv(String value) {
  return value
      .split(',')
      .map((item) => item.trim())
      .where((item) => item.isNotEmpty)
      .toList(growable: false);
}
