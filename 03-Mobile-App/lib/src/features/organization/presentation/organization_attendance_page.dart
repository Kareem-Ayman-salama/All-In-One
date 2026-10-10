import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_attendance_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_attendance_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationAttendancePage extends ConsumerStatefulWidget {
  const OrganizationAttendancePage({super.key});

  static const routePath = '/organization/attendance';

  @override
  ConsumerState<OrganizationAttendancePage> createState() {
    return _OrganizationAttendancePageState();
  }
}

class _OrganizationAttendancePageState
    extends ConsumerState<OrganizationAttendancePage> {
  String? _selectedSessionId;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canManage = workspace?.canUseFeature(
          requiredPermissions: {'attendance.manage'},
          requiredModule: 'attendance',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationAttendance)),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final sessions = ref.watch(
              organizationAttendanceSessionsProvider(
                workspace.organizationId,
              ),
            );
            return sessions.when(
              data: (items) {
                final selectedId = _selectedSessionId ??
                    (items.isEmpty ? null : items.first.id);

                return RefreshIndicator(
                  onRefresh: () {
                    return ref.refresh(
                      organizationAttendanceSessionsProvider(
                        workspace.organizationId,
                      ).future,
                    );
                  },
                  child: _AttendanceBody(
                    organizationId: workspace.organizationId,
                    sessions: items,
                    selectedSessionId: selectedId,
                    canManage: canManage,
                    onSessionSelected: (sessionId) {
                      setState(() => _selectedSessionId = sessionId);
                    },
                  ),
                );
              },
              error: (error, stackTrace) => _ErrorList(
                message: error.toString(),
                onRetry: () {
                  ref.invalidate(
                    organizationAttendanceSessionsProvider(
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
}

class _AttendanceBody extends ConsumerWidget {
  const _AttendanceBody({
    required this.organizationId,
    required this.sessions,
    required this.selectedSessionId,
    required this.canManage,
    required this.onSessionSelected,
  });

  final String organizationId;
  final List<OrganizationLearningSessionSummary> sessions;
  final String? selectedSessionId;
  final bool canManage;
  final ValueChanged<String> onSessionSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final selectedId = selectedSessionId;
    final request = selectedId == null
        ? null
        : OrganizationAttendanceSheetRequest(
            organizationId: organizationId,
            sessionId: selectedId,
          );
    final sheet = request == null
        ? null
        : ref.watch(organizationAttendanceSheetProvider(request));

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _AttendanceHero(
          title: strings.organizationAttendance,
          subtitle: strings.organizationAttendanceHint,
          sessionsCount: sessions.length,
          selected: selectedId == null ? '0' : '1',
        ),
        const SizedBox(height: AinSpacing.lg),
        _SessionStrip(
          sessions: sessions,
          selectedSessionId: selectedId,
          onSessionSelected: onSessionSelected,
        ),
        const SizedBox(height: AinSpacing.lg),
        if (sessions.isEmpty)
          AinEmptyState(
            icon: Icons.fact_check_outlined,
            title: strings.noLearningSessions,
          )
        else if (request != null && sheet != null)
          sheet.when(
            data: (value) => _AttendanceSheet(
              request: request,
              sheet: value,
              canManage: canManage,
            ),
            error: (error, stackTrace) => _ErrorPanel(
              message: error.toString(),
              onRetry: () {
                ref.invalidate(organizationAttendanceSheetProvider(request));
              },
            ),
            loading: () => Center(
              child: Semantics(
                label: strings.loading,
                child: const CircularProgressIndicator(),
              ),
            ),
          ),
      ],
    );
  }
}

class _AttendanceHero extends StatelessWidget {
  const _AttendanceHero({
    required this.title,
    required this.subtitle,
    required this.sessionsCount,
    required this.selected,
  });

  final String title;
  final String subtitle;
  final int sessionsCount;
  final String selected;

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
              icon: Icons.fact_check_outlined,
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
                  icon: Icons.event_available_outlined,
                  label: sessionsCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.touch_app_outlined,
                  label: selected,
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

class _SessionStrip extends StatelessWidget {
  const _SessionStrip({
    required this.sessions,
    required this.selectedSessionId,
    required this.onSessionSelected,
  });

  final List<OrganizationLearningSessionSummary> sessions;
  final String? selectedSessionId;
  final ValueChanged<String> onSessionSelected;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: sessions.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final session = sessions[index];
          final selected = session.id == selectedSessionId;
          return SizedBox(
            width: 260,
            child: InkWell(
              borderRadius: BorderRadius.circular(AinRadii.lg),
              onTap: () => onSessionSelected(session.id),
              child: AinSurface(
                color: selected ? AinColors.brandSoft : AinColors.surface,
                borderColor: selected ? AinColors.brand : AinColors.line,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AinIconBadge(
                      icon: session.isLocked
                          ? Icons.lock_outline
                          : Icons.event_note_outlined,
                      backgroundColor:
                          selected ? AinColors.brand : AinColors.canvas,
                      foregroundColor:
                          selected ? Colors.white : AinColors.muted,
                    ),
                    const SizedBox(width: AinSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session.localizedTitle(strings.isArabic),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: AinSpacing.xs),
                          Text(
                            [
                              session.startsAt,
                              strings.attendanceStatusLabel(session.status),
                              '${session.attendanceRecordsCount} ${strings.records}',
                            ].join(' | '),
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AinColors.muted),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _AttendanceSheet extends ConsumerWidget {
  const _AttendanceSheet({
    required this.request,
    required this.sheet,
    required this.canManage,
  });

  final OrganizationAttendanceSheetRequest request;
  final OrganizationAttendanceSheet sheet;
  final bool canManage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final actions = ref.read(organizationAttendanceActionsProvider);
    final locked = sheet.locked || sheet.session.isLocked;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AinSurface(
          padding: const EdgeInsets.all(AinSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                sheet.session.localizedTitle(strings.isArabic),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text('${strings.participants}: ${sheet.participants.length}'),
              if (sheet.session.batch != null)
                Text(sheet.session.batch!.localizedTitle(strings.isArabic)),
              if (sheet.session.instructor != null)
                Text(
                  sheet.session.instructor!.localizedName(strings.isArabic),
                ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  if (locked)
                    AinStatusPill(
                      icon: Icons.lock_outline,
                      label: strings.attendanceLocked,
                      color: AinColors.rose,
                      backgroundColor: AinColors.roseSoft,
                    ),
                  if (canManage && !locked)
                    FilledButton.icon(
                      onPressed: () => _generateQr(context, actions),
                      icon: const Icon(Icons.qr_code_2),
                      label: Text(strings.generateQr),
                    ),
                  if (canManage && !locked)
                    OutlinedButton.icon(
                      onPressed: () => _lock(context, actions),
                      icon: const Icon(Icons.lock),
                      label: Text(strings.lockAttendance),
                    ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: AinSpacing.md),
        if (sheet.participants.isEmpty)
          AinEmptyState(
            icon: Icons.people_outline,
            title: strings.noAttendanceRecords,
          )
        else
          for (final participant in sheet.participants)
            _ParticipantCard(
              request: request,
              participant: participant,
              canManage: canManage && !locked,
            ),
      ],
    );
  }

  Future<void> _generateQr(
    BuildContext context,
    OrganizationAttendanceActions actions,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final strings = AppStrings.of(context);
    final qr = await actions.generateQr(request: request);
    await Clipboard.setData(ClipboardData(text: qr.checkInUrl));
    messenger.showSnackBar(SnackBar(content: Text(strings.qrGenerated)));
  }

  Future<void> _lock(
    BuildContext context,
    OrganizationAttendanceActions actions,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final strings = AppStrings.of(context);
    await actions.lock(request: request);
    messenger.showSnackBar(SnackBar(content: Text(strings.attendanceLocked)));
  }
}

class _ParticipantCard extends ConsumerWidget {
  const _ParticipantCard({
    required this.request,
    required this.participant,
    required this.canManage,
  });

  final OrganizationAttendanceSheetRequest request;
  final OrganizationAttendanceParticipant participant;
  final bool canManage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final record = participant.record;
    final currentStatus = record?.exists == true ? record!.status : 'present';

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
                  icon: _statusIcon(currentStatus),
                  backgroundColor: _statusBackground(currentStatus),
                  foregroundColor: _statusColor(currentStatus),
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        participant.student.localizedName(strings.isArabic),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        participant.student.email ?? participant.student.id,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.muted,
                            ),
                      ),
                    ],
                  ),
                ),
                AinStatusPill(
                  icon: _statusIcon(currentStatus),
                  label: strings.attendanceStatusLabel(currentStatus),
                  color: _statusColor(currentStatus),
                  backgroundColor: _statusBackground(currentStatus),
                ),
              ],
            ),
            if (canManage) ...[
              const SizedBox(height: AinSpacing.md),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final status in _attendanceStatuses)
                    ChoiceChip(
                      label: Text(strings.attendanceStatusLabel(status)),
                      selected: currentStatus == status,
                      onSelected: (_) => _mark(context, ref, status),
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _mark(
    BuildContext context,
    WidgetRef ref,
    String status,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final strings = AppStrings.of(context);
    await ref.read(organizationAttendanceActionsProvider).mark(
          request: request,
          record: OrganizationAttendanceMarkRecord(
            studentId: participant.student.id,
            status: status,
            guardianVisible: participant.record?.guardianVisible ?? true,
          ),
        );
    messenger.showSnackBar(SnackBar(content: Text(strings.attendanceUpdated)));
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
    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [_ErrorPanel(message: message, onRetry: onRetry)],
    );
  }
}

class _ErrorPanel extends StatelessWidget {
  const _ErrorPanel({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return AinEmptyState(
      icon: Icons.cloud_off_outlined,
      title: message,
      action: AinPrimaryButton(
        onPressed: onRetry,
        icon: Icons.refresh,
        label: strings.retry,
      ),
    );
  }
}

IconData _statusIcon(String status) {
  return switch (status) {
    'absent' => Icons.cancel_outlined,
    'late' => Icons.schedule_outlined,
    'excused' => Icons.event_available_outlined,
    _ => Icons.check_circle_outline,
  };
}

Color _statusColor(String status) {
  return switch (status) {
    'absent' => AinColors.rose,
    'late' => AinColors.warning,
    'excused' => AinColors.cyan,
    _ => AinColors.success,
  };
}

Color _statusBackground(String status) {
  return switch (status) {
    'absent' => AinColors.roseSoft,
    'late' => AinColors.warningSoft,
    'excused' => AinColors.cyanSoft,
    _ => AinColors.successSoft,
  };
}

const _attendanceStatuses = <String>[
  'present',
  'absent',
  'late',
  'excused',
];
