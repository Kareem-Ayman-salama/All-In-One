import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/learning/application/attendance_controller.dart';
import 'package:ain_mobile/src/features/learning/data/attendance_repository.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AttendancePage extends ConsumerWidget {
  const AttendancePage({super.key});

  static const routePath = '/attendance';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            strings.attendance,
            style: const TextStyle(fontWeight: FontWeight.w900),
          ),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(56),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AinSpacing.lg,
                vertical: AinSpacing.xs,
              ),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AinColors.surfaceSubtle,
                  borderRadius: BorderRadius.circular(AinRadii.full),
                  border: Border.all(color: const Color(0x0F16458F)),
                ),
                child: TabBar(
                  indicatorSize: TabBarIndicatorSize.tab,
                  indicator: BoxDecoration(
                    gradient: AinGradients.button,
                    borderRadius: BorderRadius.circular(AinRadii.full),
                    boxShadow: AinShadows.button,
                  ),
                  labelColor: Colors.white,
                  unselectedLabelColor: AinColors.textSecondary,
                  dividerColor: Colors.transparent,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                  tabs: [
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.person_outline, size: 18),
                          const SizedBox(width: 6),
                          Text(strings.studentAttendance),
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.family_restroom_outlined, size: 18),
                          const SizedBox(width: 6),
                          Text(strings.guardianAttendance),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        body: SafeArea(
          child: TabBarView(
            children: [
              _StudentAttendanceTab(),
              _GuardianAttendanceTab(),
            ],
          ),
        ),
      ),
    );
  }
}

class _StudentAttendanceTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final attendance = ref.watch(studentAttendanceProvider);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(studentAttendanceProvider.future),
      child: attendance.when(
        data: (overview) => _AttendanceList(
          summary: overview.summary,
          records: overview.records,
          emptyText: strings.noAttendanceRecords,
        ),
        error: (error, stackTrace) => _ErrorList(
          message: error.toString(),
          onRetry: () => ref.invalidate(studentAttendanceProvider),
        ),
        loading: () => Center(
          child: Semantics(
            label: strings.loading,
            child: const CircularProgressIndicator(),
          ),
        ),
      ),
    );
  }
}

class _GuardianAttendanceTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final attendance = ref.watch(guardianAttendanceProvider);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(guardianAttendanceProvider.future),
      child: attendance.when(
        data: (overview) {
          if (overview.students.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(AinSpacing.lg),
              children: [
                AinEmptyState(
                  icon: Icons.family_restroom_outlined,
                  title: strings.noGuardianStudents,
                ),
              ],
            );
          }

          return ListView(
            padding: const EdgeInsets.all(AinSpacing.lg),
            children: [
              _GuardianHeroBanner(studentCount: overview.students.length),
              const SizedBox(height: AinSpacing.lg),
              for (final studentAttendance in overview.attendance)
                _GuardianStudentSection(attendance: studentAttendance),
            ],
          );
        },
        error: (error, stackTrace) => _ErrorList(
          message: error.toString(),
          onRetry: () => ref.invalidate(guardianAttendanceProvider),
        ),
        loading: () => Center(
          child: Semantics(
            label: strings.loading,
            child: const CircularProgressIndicator(),
          ),
        ),
      ),
    );
  }
}

class _GuardianHeroBanner extends StatelessWidget {
  const _GuardianHeroBanner({required this.studentCount});

  final int studentCount;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: AinGradients.hero,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        boxShadow: AinShadows.card,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Row(
          children: [
            const AinIconBadge(
              icon: Icons.family_restroom_outlined,
              backgroundColor: Color(0x29FFFFFF),
              foregroundColor: Colors.white,
            ),
            const SizedBox(width: AinSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    strings.isArabic ? 'بوابة ولي الأمر' : 'Guardian Portal',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    strings.isArabic
                        ? 'متابعة مباشرة لـ $studentCount من الأبناء المعتمدين'
                        : 'Real-time tracking for $studentCount linked student(s)',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const AinStatusPill(
              icon: Icons.verified,
              label: 'موثق 🔒',
              color: Colors.white,
              backgroundColor: Color(0x2EFFFFFF),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuardianStudentSection extends StatelessWidget {
  const _GuardianStudentSection({required this.attendance});

  final GuardianStudentAttendance attendance;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final rate = attendance.summary.attendanceRate;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.xl),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AinColors.brandSoft,
                  child: Text(
                    attendance.student.name.isNotEmpty
                        ? attendance.student.name[0].toUpperCase()
                        : 'S',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AinColors.brand,
                    ),
                  ),
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        attendance.student.name,
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        strings.isArabic
                            ? 'سجل الحضور الأكاديمي والغياب'
                            : 'Academic attendance & absence sheet',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.muted,
                            ),
                      ),
                    ],
                  ),
                ),
                AinStatusPill(
                  icon: rate >= 85 ? Icons.check_circle : Icons.warning_amber,
                  label:
                      '$rate% ${rate >= 85 ? (strings.isArabic ? "ملتزم" : "Good") : (strings.isArabic ? "تنبيه" : "Alert")}',
                  color: rate >= 85 ? AinColors.success : AinColors.rose,
                  backgroundColor:
                      rate >= 85 ? AinColors.successSoft : AinColors.roseSoft,
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.lg),
            _AttendanceSummaryGrid(summary: attendance.summary),
            const SizedBox(height: AinSpacing.lg),
            if (attendance.records.isEmpty)
              AinEmptyState(
                icon: Icons.fact_check_outlined,
                title: strings.noAttendanceRecords,
              )
            else ...[
              AinSectionHeader(
                title:
                    strings.isArabic ? 'آخر الحصص والجلسات' : 'Recent Sessions',
              ),
              const SizedBox(height: AinSpacing.sm),
              for (final record in attendance.records.take(5))
                _AttendanceRecordTile(record: record),
            ],
          ],
        ),
      ),
    );
  }
}

class _AttendanceList extends StatelessWidget {
  const _AttendanceList({
    required this.summary,
    required this.records,
    required this.emptyText,
  });

  final AttendanceSummary summary;
  final List<AttendanceRecordSummary> records;
  final String emptyText;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _AttendanceHero(summary: summary),
        const SizedBox(height: AinSpacing.lg),
        _AttendanceSummaryGrid(summary: summary),
        const SizedBox(height: AinSpacing.lg),
        if (records.isEmpty)
          AinEmptyState(icon: Icons.fact_check_outlined, title: emptyText)
        else
          for (final record in records) _AttendanceRecordTile(record: record),
      ],
    );
  }
}

class _AttendanceSummaryGrid extends StatelessWidget {
  const _AttendanceSummaryGrid({required this.summary});

  final AttendanceSummary summary;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 1.85,
      mainAxisSpacing: AinSpacing.sm,
      crossAxisSpacing: AinSpacing.sm,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        AinMetricCard(
          icon: Icons.insights_outlined,
          label: strings.attendanceRate,
          value: '${summary.attendanceRate}%',
        ),
        AinMetricCard(
          icon: Icons.check_circle_outline,
          label: strings.present,
          value: summary.present.toString(),
          color: AinColors.success,
          backgroundColor: AinColors.successSoft,
        ),
        AinMetricCard(
          icon: Icons.cancel_outlined,
          label: strings.absent,
          value: summary.absent.toString(),
          color: AinColors.rose,
          backgroundColor: AinColors.roseSoft,
        ),
        AinMetricCard(
          icon: Icons.schedule,
          label: strings.late,
          value: summary.late.toString(),
          color: AinColors.warning,
          backgroundColor: AinColors.warningSoft,
        ),
      ],
    );
  }
}

class _AttendanceHero extends StatelessWidget {
  const _AttendanceHero({required this.summary});

  final AttendanceSummary summary;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: AinGradients.hero,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        boxShadow: AinShadows.card,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const AinIconBadge(
                  icon: Icons.fact_check_outlined,
                  backgroundColor: Color(0x29FFFFFF),
                  foregroundColor: Colors.white,
                ),
                AinStatusPill(
                  icon: Icons.insights_outlined,
                  label: '${summary.attendanceRate}%',
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.18),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.lg),
            Text(
              strings.attendance,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AinSpacing.xs),
            Text(
              strings.attendanceHint,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.86),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AttendanceRecordTile extends StatelessWidget {
  const _AttendanceRecordTile({required this.record});

  final AttendanceRecordSummary record;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final session = record.session;
    final details = <String>[
      strings.attendanceStatusLabel(record.status),
      if (record.markedAt != null) record.markedAt!,
      if (session?.startsAt != null) session!.startsAt!,
      if (session?.batch?.course != null)
        session!.batch!.course!.localizedTitle(strings.isArabic),
      if (session?.instructor != null)
        session!.instructor!.localizedName(strings.isArabic),
      if (record.instructorNote != null) record.instructorNote!,
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(
              icon: _statusIcon(record.status),
              backgroundColor: _statusBackground(record.status),
              foregroundColor: _statusColor(record.status),
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    session?.localizedTitle(strings.isArabic) ??
                        session?.batch?.localizedTitle(strings.isArabic) ??
                        strings.attendance,
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    details.join(' | '),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AinColors.muted,
                          height: 1.35,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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

IconData _statusIcon(String status) {
  return switch (status) {
    'absent' => Icons.cancel_outlined,
    'late' => Icons.schedule,
    'excused' => Icons.event_available,
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
