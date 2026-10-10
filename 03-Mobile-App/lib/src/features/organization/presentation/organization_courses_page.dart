import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_course_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_room_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_course_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationCoursesPage extends ConsumerWidget {
  const OrganizationCoursesPage({super.key});

  static const routePath = '/organization/courses';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canCreateCourse = workspace?.canUseFeature(
          requiredPermissions: {'courses.create'},
          requiredModule: 'courses',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationCourses)),
      floatingActionButton: !canCreateCourse
          ? null
          : FloatingActionButton.extended(
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                builder: (context) => _CreateCourseSheet(
                  organizationId: workspace!.organizationId,
                ),
              ),
              icon: const Icon(Icons.add),
              label: Text(strings.createCourse),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final overview = ref.watch(
              organizationCoursesOverviewProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationCoursesOverviewProvider(
                    workspace.organizationId,
                  ).future,
                );
              },
              child: overview.when(
                data: (data) => _CoursesBody(
                  organizationId: workspace.organizationId,
                  workspace: workspace,
                  overview: data,
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
                            organizationCoursesOverviewProvider(
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

class _CoursesBody extends StatelessWidget {
  const _CoursesBody({
    required this.organizationId,
    required this.workspace,
    required this.overview,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final OrganizationCoursesOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _CoursesHero(
          title: strings.organizationCourses,
          subtitle: strings.organizationCoursesHint,
          publishedCount: overview.publishedCourseCount,
          openBatchCount: overview.openBatchCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.school,
                label: strings.publishedCourses,
                value: overview.publishedCourseCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.event_available,
                label: strings.openBatches,
                value: overview.openBatchCount.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationCourses),
        const SizedBox(height: AinSpacing.md),
        if (overview.courses.isEmpty)
          AinEmptyState(
            icon: Icons.school_outlined,
            title: strings.noOrganizationCourses,
          )
        else
          for (final course in overview.courses)
            _CourseCard(
              organizationId: organizationId,
              workspace: workspace,
              course: course,
              batches: overview.batchesForCourse(course.id),
            ),
      ],
    );
  }
}

class _CoursesHero extends StatelessWidget {
  const _CoursesHero({
    required this.title,
    required this.subtitle,
    required this.publishedCount,
    required this.openBatchCount,
  });

  final String title;
  final String subtitle;
  final int publishedCount;
  final int openBatchCount;

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
              icon: Icons.dashboard_customize_outlined,
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
                  label: publishedCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.event_available_outlined,
                  label: openBatchCount.toString(),
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

class _CourseCard extends ConsumerWidget {
  const _CourseCard({
    required this.organizationId,
    required this.workspace,
    required this.course,
    required this.batches,
  });

  final String organizationId;
  final ActiveWorkspace workspace;
  final OrganizationCourseSummary course;
  final List<OrganizationBatchSummary> batches;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canUpdateCourse = workspace.canUseFeature(
      requiredPermissions: {'courses.update'},
      requiredModule: 'courses',
    );
    final canPublishCourse = workspace.canUseFeature(
      requiredPermissions: {'courses.publish'},
      requiredModule: 'courses',
    );
    final canManageBatches = workspace.canUseFeature(
      requiredPermissions: {'batches.manage'},
      requiredModule: 'courses',
    );

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
                  icon: Icons.school_outlined,
                  backgroundColor: _statusBackground(course.status),
                  foregroundColor: _statusColor(course.status),
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course.title,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (course.shortDescription != null) ...[
                        const SizedBox(height: AinSpacing.xs),
                        Text(
                          course.shortDescription!,
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: AinColors.muted, height: 1.35),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.flag_outlined,
                  label: strings.courseStatusLabel(course.status),
                  color: _statusColor(course.status),
                  backgroundColor: _statusBackground(course.status),
                ),
                AinStatusPill(
                  icon: Icons.cast_for_education_outlined,
                  label: course.deliveryType,
                  color: AinColors.cyan,
                  backgroundColor: AinColors.cyanSoft,
                ),
                AinStatusPill(
                  icon: Icons.payments_outlined,
                  label: strings.priceFromMinor(
                    course.priceMinor,
                    course.currency,
                  ),
                  color: AinColors.teal,
                  backgroundColor: AinColors.tealSoft,
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            AinSectionHeader(
              title: strings.batchesCount(batches.length),
            ),
            const SizedBox(height: AinSpacing.sm),
            if (batches.isEmpty)
              AinEmptyState(
                icon: Icons.event_busy_outlined,
                title: strings.noBatchesYet,
              )
            else
              for (final batch in batches.take(3))
                _BatchTile(
                  organizationId: organizationId,
                  course: course,
                  batch: batch,
                  canManageBatches: canManageBatches,
                ),
            const SizedBox(height: AinSpacing.sm),
            if (canUpdateCourse || canPublishCourse)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (canUpdateCourse)
                    OutlinedButton.icon(
                      onPressed: () => showModalBottomSheet<void>(
                        context: context,
                        isScrollControlled: true,
                        builder: (context) => _CreateCourseSheet(
                          organizationId: organizationId,
                          course: course,
                        ),
                      ),
                      icon: const Icon(Icons.edit),
                      label: Text(strings.editCourse),
                    ),
                  if (canPublishCourse)
                    OutlinedButton.icon(
                      onPressed: () => _submitForReview(context, ref),
                      icon: const Icon(Icons.fact_check),
                      label: Text(strings.submitForReview),
                    ),
                ],
              ),
            if (canManageBatches) ...[
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => _CreateBatchSheet(
                    organizationId: organizationId,
                    course: course,
                  ),
                ),
                icon: const Icon(Icons.add),
                label: Text(strings.createBatch),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _submitForReview(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    try {
      await ref.read(organizationCourseActionsProvider).submitCourseForReview(
            organizationId: organizationId,
            courseId: course.id,
          );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(strings.courseSubmittedForReview)),
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

class _CreateCourseSheet extends ConsumerStatefulWidget {
  const _CreateCourseSheet({
    required this.organizationId,
    this.course,
  });

  final String organizationId;
  final OrganizationCourseSummary? course;

  @override
  ConsumerState<_CreateCourseSheet> createState() => _CreateCourseSheetState();
}

class _CreateCourseSheetState extends ConsumerState<_CreateCourseSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _fullDescriptionController = TextEditingController();
  final _subjectController = TextEditingController();
  final _priceController = TextEditingController(text: '0');
  String _deliveryType = 'offline';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final course = widget.course;
    if (course != null) {
      _titleController.text = course.title;
      _descriptionController.text = course.shortDescription ?? '';
      _fullDescriptionController.text = course.description ?? '';
      _subjectController.text = course.subject ?? '';
      _priceController.text = course.priceMinor.toString();
      _deliveryType = course.deliveryType;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _fullDescriptionController.dispose();
    _subjectController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Form(
        key: _formKey,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              widget.course == null ? strings.createCourse : strings.editCourse,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(labelText: strings.courseTitle),
              validator: (value) => value == null || value.trim().length < 3
                  ? strings.courseTitleRequired
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              maxLines: 2,
              decoration: InputDecoration(labelText: strings.shortDescription),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _fullDescriptionController,
              maxLines: 4,
              decoration: InputDecoration(labelText: strings.description),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _subjectController,
              decoration: InputDecoration(labelText: strings.subject),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _deliveryType,
              decoration: InputDecoration(labelText: strings.deliveryType),
              items: _deliveryTypes
                  .map(
                    (type) => DropdownMenuItem(
                      value: type,
                      child: Text(type),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) {
                  setState(() => _deliveryType = value);
                }
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: strings.priceMinor),
              validator: (value) {
                final price = int.tryParse(value?.trim() ?? '');
                return price == null || price < 0
                    ? strings.priceMinorRequired
                    : null;
              },
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _submitting ? null : _submit,
              icon: _submitting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.check),
              label: Text(
                widget.course == null
                    ? strings.createCourse
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

    setState(() => _submitting = true);
    final strings = AppStrings.of(context);
    try {
      final command = CreateOrganizationCourseCommand(
        title: _titleController.text,
        shortDescription: _descriptionController.text,
        description: _fullDescriptionController.text,
        subject: _subjectController.text,
        deliveryType: _deliveryType,
        priceMinor: int.parse(_priceController.text.trim()),
      );
      if (widget.course == null) {
        await ref.read(organizationCourseActionsProvider).createCourse(
              organizationId: widget.organizationId,
              command: command,
            );
      } else {
        await ref.read(organizationCourseActionsProvider).updateCourse(
              organizationId: widget.organizationId,
              courseId: widget.course!.id,
              command: command,
            );
      }
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.course == null
                  ? strings.courseCreated
                  : strings.courseUpdated,
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

class _CreateBatchSheet extends ConsumerStatefulWidget {
  const _CreateBatchSheet({
    required this.organizationId,
    required this.course,
    this.batch,
  });

  final String organizationId;
  final OrganizationCourseSummary course;
  final OrganizationBatchSummary? batch;

  @override
  ConsumerState<_CreateBatchSheet> createState() => _CreateBatchSheetState();
}

class _CreateBatchSheetState extends ConsumerState<_CreateBatchSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _capacityController = TextEditingController(text: '20');
  final _startDateController = TextEditingController();
  final _endDateController = TextEditingController();
  final _dayController = TextEditingController(text: 'Sunday');
  final _startTimeController = TextEditingController(text: '10:00');
  final _endTimeController = TextEditingController(text: '11:00');
  String? _roomId;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final batch = widget.batch;
    if (batch != null) {
      _titleController.text = batch.title;
      _capacityController.text = batch.capacity.toString();
      _startDateController.text = batch.startDate ?? '';
      _endDateController.text = batch.endDate ?? '';
      _roomId = batch.roomId.isEmpty ? null : batch.roomId;
      final slot = batch.schedule.isEmpty ? null : batch.schedule.first;
      if (slot != null) {
        _dayController.text = slot.day;
        _startTimeController.text = slot.startTime;
        _endTimeController.text = slot.endTime;
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _capacityController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    _dayController.dispose();
    _startTimeController.dispose();
    _endTimeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final rooms = ref.watch(organizationRoomsProvider(widget.organizationId));

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: rooms.when(
        data: (items) {
          if (items.isEmpty) {
            return ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  strings.noRoomsForBatch,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            );
          }
          _roomId ??= items.any((room) => room.id == widget.batch?.roomId)
              ? widget.batch!.roomId
              : items.first.id;

          return Form(
            key: _formKey,
            child: ListView(
              shrinkWrap: true,
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  widget.batch == null
                      ? strings.createBatch
                      : strings.editBatch,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 12),
                Text(widget.course.title),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _roomId,
                  decoration: InputDecoration(labelText: strings.chooseRoom),
                  items: [
                    for (final room in items)
                      DropdownMenuItem(
                        value: room.id,
                        child: Text(room.name),
                      ),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _roomId = value);
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(labelText: strings.batchTitle),
                  validator: (value) => value == null || value.trim().isEmpty
                      ? strings.batchTitleRequired
                      : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _capacityController,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(labelText: strings.capacity),
                  validator: (value) {
                    final capacity = int.tryParse(value?.trim() ?? '');
                    return capacity == null || capacity < 1
                        ? strings.capacityRequired
                        : null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _startDateController,
                  decoration: InputDecoration(labelText: strings.startDate),
                  validator: _requiredText,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _endDateController,
                  decoration: InputDecoration(labelText: strings.endDate),
                  validator: _requiredText,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _dayController,
                  decoration: InputDecoration(labelText: strings.scheduleDay),
                  validator: _requiredText,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _startTimeController,
                        decoration: InputDecoration(
                          labelText: strings.startTime,
                        ),
                        validator: _requiredText,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _endTimeController,
                        decoration: InputDecoration(labelText: strings.endTime),
                        validator: _requiredText,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _submitting ? null : _submit,
                  icon: _submitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.check),
                  label: Text(
                    widget.batch == null
                        ? strings.createBatch
                        : strings.saveChanges,
                  ),
                ),
              ],
            ),
          );
        },
        error: (error, stackTrace) => ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.all(16),
          children: [Text(error.toString())],
        ),
        loading: () => const Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }

  String? _requiredText(String? value) {
    final strings = AppStrings.of(context);
    return value == null || value.trim().isEmpty
        ? strings.batchTitleRequired
        : null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _roomId == null) {
      return;
    }

    setState(() => _submitting = true);
    final strings = AppStrings.of(context);
    try {
      final command = CreateOrganizationBatchCommand(
        courseId: widget.course.id,
        roomId: _roomId!,
        title: _titleController.text,
        startDate: _startDateController.text,
        endDate: _endDateController.text,
        deliveryType: widget.course.deliveryType,
        capacity: int.parse(_capacityController.text.trim()),
        status: widget.batch?.status ?? 'open',
        schedule: [
          OrganizationBatchScheduleSlot(
            day: _dayController.text,
            startTime: _startTimeController.text,
            endTime: _endTimeController.text,
          ),
        ],
      );
      if (widget.batch == null) {
        await ref.read(organizationCourseActionsProvider).createBatch(
              organizationId: widget.organizationId,
              command: command,
            );
      } else {
        await ref.read(organizationCourseActionsProvider).updateBatch(
              organizationId: widget.organizationId,
              batchId: widget.batch!.id,
              command: command,
            );
      }
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.batch == null
                  ? strings.batchCreated
                  : strings.batchUpdated,
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

const _deliveryTypes = <String>['offline', 'online', 'hybrid', 'recorded'];

class _BatchTile extends StatelessWidget {
  const _BatchTile({
    required this.organizationId,
    required this.course,
    required this.batch,
    required this.canManageBatches,
  });

  final String organizationId;
  final OrganizationCourseSummary course;
  final OrganizationBatchSummary batch;
  final bool canManageBatches;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.sm),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.md),
        color: AinColors.canvas,
        child: Row(
          children: [
            AinIconBadge(
              icon: Icons.event_note_outlined,
              backgroundColor: _statusBackground(batch.status),
              foregroundColor: _statusColor(batch.status),
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    batch.title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    [
                      strings.courseStatusLabel(batch.status),
                      if (batch.startDate != null) batch.startDate,
                      strings.seatsLeft(batch.remainingSeats),
                    ].whereType<String>().join(' | '),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AinColors.muted,
                          height: 1.3,
                        ),
                  ),
                ],
              ),
            ),
            if (canManageBatches)
              IconButton(
                onPressed: () => showModalBottomSheet<void>(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => _CreateBatchSheet(
                    organizationId: organizationId,
                    course: course,
                    batch: batch,
                  ),
                ),
                icon: const Icon(Icons.edit),
                tooltip: strings.editBatch,
              ),
          ],
        ),
      ),
    );
  }
}

Color _statusColor(String status) {
  return switch (status) {
    'published' || 'active' || 'open' => AinColors.success,
    'draft' || 'pending_review' => AinColors.warning,
    'rejected' || 'closed' || 'archived' => AinColors.rose,
    _ => AinColors.brand,
  };
}

Color _statusBackground(String status) {
  return switch (status) {
    'published' || 'active' || 'open' => AinColors.successSoft,
    'draft' || 'pending_review' => AinColors.warningSoft,
    'rejected' || 'closed' || 'archived' => AinColors.roseSoft,
    _ => AinColors.brandSoft,
  };
}
