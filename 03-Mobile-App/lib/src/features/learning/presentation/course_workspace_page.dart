import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/content/application/content_viewer_controller.dart';
import 'package:ain_mobile/src/features/content/application/course_content_controller.dart';
import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:ain_mobile/src/features/learning/application/student_learning_controller.dart';
import 'package:ain_mobile/src/features/learning/application/video_progress_controller.dart';
import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/organization/application/organization_announcement_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_announcement_repository.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CourseWorkspacePage extends ConsumerWidget {
  const CourseWorkspacePage({required this.enrollmentId, super.key});

  static const routePath = '/my-courses/enrollments/:enrollmentId';

  final String enrollmentId;

  static String location(String enrollmentId) {
    return '/my-courses/enrollments/$enrollmentId';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final detail = ref.watch(studentEnrollmentDetailProvider(enrollmentId));

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.courseSpace),
        leading: IconButton(
          tooltip: strings.back,
          onPressed: () => context.go(MyCoursesPage.routePath),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SafeArea(
        child: detail.when(
          data: (data) => _CourseWorkspaceBody(detail: data),
          error: (error, stackTrace) => ListView(
            padding: const EdgeInsets.all(AinSpacing.lg),
            children: [
              AinEmptyState(
                icon: Icons.lock_outline,
                title: strings.courseAccessLocked,
                subtitle: error.toString(),
                action: FilledButton.icon(
                  onPressed: () {
                    ref.invalidate(
                      studentEnrollmentDetailProvider(enrollmentId),
                    );
                  },
                  icon: const Icon(Icons.refresh),
                  label: Text(strings.retry),
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
      ),
    );
  }
}

class _CourseWorkspaceBody extends StatefulWidget {
  const _CourseWorkspaceBody({required this.detail});

  final StudentEnrollmentDetail detail;

  @override
  State<_CourseWorkspaceBody> createState() => _CourseWorkspaceBodyState();
}

class _CourseWorkspaceBodyState extends State<_CourseWorkspaceBody> {
  int _selectedTab = 0;

  /// Formats [seconds] as mm:ss (e.g. 185 → "3:05").
  String _formatSeconds(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  String _nextSessionText(StudentBatchSummary? batch) {
    if (batch == null || batch.startDate == null) {
      return '';
    }
    final nextSession = batch.startDate!;
    return nextSession;
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final enrollment = widget.detail.enrollment;
    final course = enrollment.course;
    final batch = enrollment.batch;
    final nextSession = _nextSessionText(batch);
    final academy = course?.academy;
    final instructor = course?.instructor;

    if (!widget.detail.access.allowed) {
      return _LockedCourseState(detail: widget.detail);
    }

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(AinRadii.xl),
          child: Stack(
            children: [
              Container(
                height: 210,
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: AinGradients.darkCard,
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.12),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AinColors.brand.withValues(alpha: 0.3),
                              blurRadius: 24,
                              spreadRadius: -4,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.play_arrow_rounded,
                          size: 36,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: AinSpacing.sm),
                      Text(
                        nextSession.isNotEmpty
                            ? '${course?.localizedTitle(strings.isArabic) ?? strings.course} • $nextSession'
                            : (course?.localizedTitle(strings.isArabic) ??
                                strings.course),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned.fill(
                child: AinWatermarkOverlay(
                  email: 'student@ain.platform',
                  userName: null,
                  ipOrDeviceId: enrollment.id,
                  child: const SizedBox.expand(),
                ),
              ),
              PositionedDirectional(
                top: AinSpacing.sm,
                start: AinSpacing.sm,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AinColors.brand.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(AinRadii.pill),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.15),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.shield_outlined,
                        size: 12,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        strings.drmContentProtection,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Column(
                  children: [
                    // Thin progress bar
                    Container(
                      height: 3,
                      margin:
                          const EdgeInsets.symmetric(horizontal: AinSpacing.md),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(2),
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                      alignment: AlignmentDirectional.centerStart,
                      child: FractionallySizedBox(
                        widthFactor: 0.08,
                        child: Container(
                          height: 3,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(2),
                            gradient: AinGradients.button,
                          ),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withValues(alpha: 0.6),
                            Colors.black.withValues(alpha: 0.3),
                          ],
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(
                            Icons.play_arrow_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                          SizedBox(width: 8),
                          Text(
                            '0:03 / 6:18',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Spacer(),
                          Icon(
                            Icons.volume_up_rounded,
                            color: Colors.white70,
                            size: 18,
                          ),
                          SizedBox(width: 12),
                          Icon(
                            Icons.settings_rounded,
                            color: Colors.white70,
                            size: 18,
                          ),
                          SizedBox(width: 12),
                          Icon(
                            Icons.fullscreen_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AinSpacing.md),
        _WorkspaceHero(
          title: course?.localizedTitle(strings.isArabic) ?? strings.course,
          subtitle: [
            academy?.localizedName(strings.isArabic),
            instructor?.localizedName(strings.isArabic),
          ].whereType<String>().join(' - '),
          accessLabel: strings.activeAccess,
        ),
        const SizedBox(height: AinSpacing.md),
        _LiveMeetingCard(
          title: strings.isArabic
              ? 'جلسة بث مباشر قادمة (Zoom Live)'
              : 'Upcoming Live Session on Zoom',
          startsAt:
              strings.isArabic ? 'اليوم في تمام 07:00 م' : 'Today at 07:00 PM',
          meetingUrl: 'https://zoom.us/j/9128374615?pwd=masterclass',
          meetingId: '912 837 4615',
          passcode: 'learn2026',
          isArabic: strings.isArabic,
        ),
        const SizedBox(height: AinSpacing.md),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _WorkspaceTab(
                label: strings.tabLessons,
                selected: _selectedTab == 0,
                onTap: () => setState(() => _selectedTab = 0),
              ),
              const SizedBox(width: AinSpacing.xs),
              _WorkspaceTab(
                label: strings.tabResources,
                selected: _selectedTab == 1,
                onTap: () => setState(() => _selectedTab = 1),
              ),
              const SizedBox(width: AinSpacing.xs),
              _WorkspaceTab(
                label: strings.tabAssignments,
                selected: _selectedTab == 2,
                onTap: () => setState(() => _selectedTab = 2),
              ),
              const SizedBox(width: AinSpacing.xs),
              _WorkspaceTab(
                label: strings.tabQuizzes,
                selected: _selectedTab == 3,
                onTap: () => setState(() => _selectedTab = 3),
              ),
              const SizedBox(width: AinSpacing.xs),
              _WorkspaceTab(
                label: strings.tabSmartNotes,
                selected: _selectedTab == 4,
                onTap: () => setState(() => _selectedTab = 4),
              ),
              const SizedBox(width: AinSpacing.xs),
              _WorkspaceTab(
                label: strings.tabDiscussion,
                selected: _selectedTab == 5,
                onTap: () => setState(() => _selectedTab = 5),
              ),
            ],
          ),
        ),
        const SizedBox(height: AinSpacing.lg),
        if (_selectedTab == 0) ...[
          // ─── Video Progress Resume Banner ────────────────────────────────
          Consumer(
            builder: (context, ref, _) {
              final contentItems = ref.watch(
                courseContentListProvider(
                  CourseContentQuery(
                    organizationId: enrollment.organizationId,
                    roomId: enrollment.batch?.room?.id,
                  ),
                ),
              );
              final firstContent = contentItems.valueOrNull?.firstOrNull;
              if (firstContent == null) return const SizedBox.shrink();

              final progress =
                  ref.watch(videoProgressProvider(firstContent.id));
              return progress.when(
                data: (p) {
                  if (p.lastPositionSeconds == 0) {
                    return const SizedBox.shrink();
                  }
                  return Container(
                    margin: const EdgeInsets.only(bottom: AinSpacing.sm),
                    padding: const EdgeInsets.symmetric(
                      horizontal: AinSpacing.md,
                      vertical: AinSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      color: AinColors.brandSoft,
                      borderRadius: BorderRadius.circular(AinRadii.md),
                      border: Border.all(color: AinColors.brand, width: 1),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.history,
                          color: AinColors.brand,
                          size: 18,
                        ),
                        const SizedBox(width: AinSpacing.xs),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                strings.isArabic
                                    ? 'استأنف من حيث توقفت'
                                    : 'Resume from where you left off',
                                style: const TextStyle(
                                  color: AinColors.brand,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: p.completionPercentage / 100,
                                backgroundColor: AinColors.line,
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  AinColors.brand,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${p.completionPercentage}% ${strings.isArabic ? 'مكتمل' : 'complete'}',
                                style: const TextStyle(
                                  color: AinColors.muted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: AinSpacing.sm),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: AinColors.brand,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            minimumSize: Size.zero,
                          ),
                          onPressed: () {
                            // Seeks player to p.lastPositionSeconds
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  strings.isArabic
                                      ? 'تم استئناف التشغيل من ${_formatSeconds(p.lastPositionSeconds)}'
                                      : 'Resumed from ${_formatSeconds(p.lastPositionSeconds)}',
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.play_arrow, size: 14),
                          label: Text(
                            strings.isArabic ? 'استأنف' : 'Resume',
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                error: (_, __) => const SizedBox.shrink(),
                loading: () => const SizedBox.shrink(),
              );
            },
          ),
          // ─── Lesson Tiles ────────────────────────────────────────────────
          _LessonTile(
            number: 1,
            title: strings.isArabic
                ? 'مقدمة في الذكاء الاصطناعي'
                : 'Introduction to AI',
            status: _LessonStatus.completed,
          ),
          _LessonTile(
            number: 2,
            title: strings.isArabic
                ? 'التعلّم الآلي والبيانات'
                : 'Machine Learning & Data',
            status: _LessonStatus.completed,
          ),
          _LessonTile(
            number: 3,
            title: strings.isArabic
                ? 'محاضرة ٠٣: خوارزميات التعلّم العميق'
                : 'Lecture 03: Deep Learning Algorithms',
            status: _LessonStatus.playing,
          ),
          _LessonTile(
            number: 4,
            title: strings.isArabic
                ? 'تطبيقات الشبكات العصبية'
                : 'Neural Network Applications',
            status: _LessonStatus.locked,
          ),
          const SizedBox(height: AinSpacing.md),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: AinColors.brand),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AinRadii.pill),
              ),
            ),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    strings.isArabic
                        ? 'تم بدء تحميل المحتوى للمشاهدة بدون إنترنت.'
                        : 'Offline download started.',
                  ),
                ),
              );
            },
            icon: const Icon(
              Icons.download_for_offline_outlined,
              color: AinColors.brand,
            ),
            label: Text(
              strings.downloadForOffline,
              style: const TextStyle(
                color: AinColors.brand,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ] else if (_selectedTab == 1) ...[
          _CourseContentSection(
            organizationId: enrollment.organizationId,
            roomId: batch?.room?.id,
          ),
        ] else if (_selectedTab == 2) ...[
          _AssignmentsSection(
            isArabic: strings.isArabic,
            courseName: course?.localizedTitle(strings.isArabic) ?? '',
          ),
        ] else if (_selectedTab == 3) ...[
          _QuizzesSection(
            isArabic: strings.isArabic,
            courseName: course?.localizedTitle(strings.isArabic) ?? '',
          ),
        ] else if (_selectedTab == 4) ...[
          AinSurface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.tabSmartNotes,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: AinSpacing.sm),
                Text(
                  strings.isArabic
                      ? 'يمكنك تدوين ملاحظاتك أثناء تشغيل المحاضرة وسيتم مزامنتها مع حسابك.'
                      : 'Take smart notes during playback to sync with your student account.',
                  style: const TextStyle(color: AinColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ] else if (_selectedTab == 5) ...[
          _RoomDiscussionsSection(isArabic: strings.isArabic),
        ] else ...[
          _CourseAnnouncementSection(
            organizationId: enrollment.organizationId,
            roomId: batch?.room?.id,
          ),
        ],
      ],
    );
  }
}

enum _LessonStatus { completed, playing, locked }

class _WorkspaceTab extends StatelessWidget {
  const _WorkspaceTab({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AinRadii.pill),
      onTap: onTap,
      child: AnimatedContainer(
        duration: AinDurations.fast,
        curve: AinCurves.standard,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          gradient: selected ? AinGradients.button : null,
          color: selected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(AinRadii.pill),
          border: selected ? null : Border.all(color: AinColors.line, width: 1),
          boxShadow: selected ? AinShadows.button : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AinColors.textPrimary,
            fontSize: 12.5,
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            letterSpacing: selected ? -0.1 : 0,
          ),
        ),
      ),
    );
  }
}

class _LessonTile extends StatelessWidget {
  const _LessonTile({
    required this.number,
    required this.title,
    required this.status,
  });

  final int number;
  final String title;
  final _LessonStatus status;

  @override
  Widget build(BuildContext context) {
    final isPlaying = status == _LessonStatus.playing;
    final isCompleted = status == _LessonStatus.completed;

    return Container(
      margin: const EdgeInsets.only(bottom: AinSpacing.sm + 2),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: isPlaying ? AinColors.brandSoft : AinColors.surface,
        borderRadius: BorderRadius.circular(AinRadii.lg),
        border: Border.all(
          color: isPlaying
              ? AinColors.brand.withValues(alpha: 0.4)
              : AinColors.line.withValues(alpha: 0.6),
          width: isPlaying ? 1.5 : 1,
        ),
        boxShadow: isPlaying ? AinShadows.card : null,
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            if (isPlaying)
              Container(
                width: 3.5,
                decoration: const BoxDecoration(
                  gradient: AinGradients.button,
                  borderRadius: BorderRadiusDirectional.only(
                    topStart: Radius.circular(AinRadii.lg),
                    bottomStart: Radius.circular(AinRadii.lg),
                  ),
                ),
              ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(AinSpacing.md),
                child: Row(
                  children: [
                    // Numbered circle badge
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCompleted
                            ? AinColors.successSoft
                            : isPlaying
                                ? AinColors.brand
                                : AinColors.canvas,
                        border: Border.all(
                          color: isCompleted
                              ? AinColors.success.withValues(alpha: 0.3)
                              : isPlaying
                                  ? AinColors.brand
                                  : AinColors.line,
                          width: 1.5,
                        ),
                      ),
                      child: isCompleted
                          ? const Icon(
                              Icons.check_rounded,
                              color: AinColors.success,
                              size: 18,
                            )
                          : Center(
                              child: Text(
                                '$number',
                                style: TextStyle(
                                  color: isPlaying
                                      ? Colors.white
                                      : AinColors.muted,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                    ),
                    const SizedBox(width: AinSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              fontWeight:
                                  isPlaying ? FontWeight.w800 : FontWeight.w600,
                              fontSize: 13.5,
                              color: isPlaying
                                  ? AinColors.brand
                                  : AinColors.textPrimary,
                              letterSpacing: -0.1,
                            ),
                          ),
                          if (isPlaying) ...[
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: const LinearProgressIndicator(
                                value: 0.35,
                                minHeight: 3,
                                backgroundColor: Color(0x2016458F),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  AinColors.brand,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (isPlaying)
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          gradient: AinGradients.button,
                          shape: BoxShape.circle,
                          boxShadow: AinShadows.button,
                        ),
                        child: const Icon(
                          Icons.pause_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      )
                    else if (status == _LessonStatus.locked)
                      Icon(
                        Icons.lock_outline_rounded,
                        color: AinColors.muted.withValues(alpha: 0.5),
                        size: 18,
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkspaceHero extends StatelessWidget {
  const _WorkspaceHero({
    required this.title,
    required this.subtitle,
    required this.accessLabel,
  });

  final String title;
  final String subtitle;
  final String accessLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: AinGradients.heroShimmer,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        boxShadow: AinShadows.float,
      ),
      child: Stack(
        children: [
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.06),
                    Colors.white.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AinSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AinStatusPill(
                  icon: Icons.verified_user_outlined,
                  label: accessLabel,
                  color: const Color(0xFF34D399),
                  backgroundColor: const Color(0x2E10B981),
                ),
                const SizedBox(height: AinSpacing.lg),
                Text(
                  title,
                  style: theme.textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: AinSpacing.sm),
                  Text(
                    subtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: 0.72),
                      height: 1.35,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CourseAnnouncementSection extends ConsumerWidget {
  const _CourseAnnouncementSection({
    required this.organizationId,
    this.roomId,
  });

  final String organizationId;
  final String? roomId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    if (organizationId.isEmpty) {
      return _WorkspaceSection(
        icon: Icons.campaign,
        title: strings.latestAnnouncement,
        body: strings.noAnnouncementsYet,
      );
    }

    final announcements = ref.watch(
      organizationAnnouncementsProvider(organizationId),
    );

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinSectionHeader(
              title: strings.latestAnnouncement,
              action: const AinIconBadge(icon: Icons.campaign_outlined),
            ),
            const SizedBox(height: AinSpacing.md),
            announcements.when(
              data: (items) {
                final visibleItems = items
                    .where((announcement) {
                      return !announcement.isRoomAnnouncement ||
                          announcement.roomId == roomId;
                    })
                    .take(3)
                    .toList(growable: false);
                if (visibleItems.isEmpty) {
                  return AinEmptyState(
                    icon: Icons.campaign_outlined,
                    title: strings.noAnnouncementsYet,
                  );
                }

                return Column(
                  children: [
                    for (final announcement in visibleItems)
                      _AnnouncementTile(announcement: announcement),
                  ],
                );
              },
              error: (error, stackTrace) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(error.toString()),
                  const SizedBox(height: AinSpacing.sm),
                  TextButton.icon(
                    onPressed: () => ref.invalidate(
                      organizationAnnouncementsProvider(organizationId),
                    ),
                    icon: const Icon(Icons.refresh),
                    label: Text(strings.retry),
                  ),
                ],
              ),
              loading: () => _InlineLoading(label: strings.loading),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  const _AnnouncementTile({required this.announcement});

  final OrganizationAnnouncementSummary announcement;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AinIconBadge(
            icon: announcement.isRoomAnnouncement
                ? Icons.meeting_room_outlined
                : Icons.business_outlined,
          ),
          const SizedBox(width: AinSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  announcement.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: AinSpacing.xs),
                Text(
                  [
                    strings.announcementAudienceLabel(announcement.audience),
                    if (announcement.publishedAt != null)
                      announcement.publishedAt!,
                  ].join(' - '),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AinColors.muted,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CourseContentSection extends ConsumerWidget {
  const _CourseContentSection({required this.organizationId, this.roomId});

  final String organizationId;
  final String? roomId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    if (organizationId.isEmpty || roomId == null || roomId!.isEmpty) {
      return _WorkspaceSection(
        icon: Icons.folder_open,
        title: strings.courseContent,
        body: strings.courseContentPending,
      );
    }

    final query = CourseContentQuery(
      organizationId: organizationId,
      roomId: roomId,
    );
    final content = ref.watch(courseContentListProvider(query));
    final viewer = ref.watch(contentViewerControllerProvider);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinSectionHeader(
              title: strings.courseContent,
              action: const AinIconBadge(icon: Icons.folder_open_outlined),
            ),
            const SizedBox(height: AinSpacing.md),
            content.when(
              data: (items) {
                if (items.isEmpty) {
                  return AinEmptyState(
                    icon: Icons.folder_open_outlined,
                    title: strings.courseContentPending,
                  );
                }
                return Column(
                  children: [
                    for (final item in items)
                      _ContentTile(
                        item: item,
                        opening: viewer.isLoading,
                        onOpen: () => _openContent(
                          context: context,
                          ref: ref,
                          item: item,
                        ),
                      ),
                  ],
                );
              },
              error: (error, stackTrace) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(error.toString()),
                  const SizedBox(height: AinSpacing.sm),
                  TextButton.icon(
                    onPressed: () =>
                        ref.invalidate(courseContentListProvider(query)),
                    icon: const Icon(Icons.refresh),
                    label: Text(strings.retry),
                  ),
                ],
              ),
              loading: () => _InlineLoading(label: strings.loading),
            ),
            viewer.when(
              data: (state) {
                if (state == null) {
                  return const SizedBox.shrink();
                }
                return _SecureViewerState(state: state);
              },
              error: (error, stackTrace) => Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(error.toString()),
              ),
              loading: () => const Padding(
                padding: EdgeInsets.only(top: 8),
                child: LinearProgressIndicator(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openContent({
    required BuildContext context,
    required WidgetRef ref,
    required ContentItemSummary item,
  }) async {
    final strings = AppStrings.of(context);
    if (item.fileAsset == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(strings.contentFileUnavailable)));
      return;
    }

    await ref
        .read(contentViewerControllerProvider.notifier)
        .open(organizationId: organizationId, contentId: item.id);
  }
}

class _ContentTile extends StatelessWidget {
  const _ContentTile({
    required this.item,
    required this.opening,
    required this.onOpen,
  });

  final ContentItemSummary item;
  final bool opening;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final file = item.fileAsset;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AinIconBadge(
            icon: item.type == 'video'
                ? Icons.play_circle_outline
                : Icons.description_outlined,
          ),
          const SizedBox(width: AinSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: AinSpacing.xs),
                Text(
                  [
                    file?.mimeType,
                    if (item.watermarkEnabled) strings.watermarkProtected,
                    if (!item.downloadAllowed) strings.downloadDisabled,
                  ].whereType<String>().join(' - '),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AinColors.muted,
                        height: 1.3,
                      ),
                ),
                const SizedBox(height: AinSpacing.sm),
                TextButton.icon(
                  onPressed: opening ? null : onOpen,
                  icon: const Icon(Icons.visibility_outlined),
                  label: Text(strings.openSecureViewer),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SecureViewerState extends ConsumerWidget {
  const _SecureViewerState({required this.state});

  final ContentViewerState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final session = state.session;

    return Padding(
      padding: const EdgeInsets.only(top: AinSpacing.md),
      child: AinSurface(
        color: AinColors.brandSoft,
        borderColor: const Color(0xFFD9DCFA),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.secureViewerOpen,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
            ),
            const SizedBox(height: AinSpacing.sm),
            Text('${session.mimeType} - ${session.status}'),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: state.isExpired
                      ? Icons.timer_off_outlined
                      : Icons.timer_outlined,
                  label: state.isExpired
                      ? strings.viewerSessionExpired
                      : strings.viewerSessionExpiresIn(
                          state.minutesUntilExpiry,
                        ),
                ),
                if (state.signedUrlIsMemoryOnly)
                  AinStatusPill(
                    icon: Icons.lock_outline,
                    label: strings.signedUrlMemoryOnly,
                    color: AinColors.success,
                    backgroundColor: AinColors.successSoft,
                  ),
                if (!session.downloadAllowed)
                  AinStatusPill(
                    icon: Icons.file_download_off_outlined,
                    label: strings.downloadDisabled,
                    color: AinColors.warning,
                    backgroundColor: AinColors.warningSoft,
                  ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Text(strings.secureViewerMemoryOnlyHint),
            if (session.watermark.enabled) ...[
              const SizedBox(height: AinSpacing.sm),
              ClipRRect(
                borderRadius: BorderRadius.circular(AinRadii.md),
                child: AinWatermarkOverlay(
                  email: session.watermark.maskedEmail ??
                      session.watermark.userId ??
                      'student@ain.platform',
                  userName: session.watermark.userName,
                  ipOrDeviceId: session.watermark.viewerSessionId,
                  child: Container(
                    height: 150,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(AinRadii.md),
                    ),
                    alignment: Alignment.center,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.lock_clock_outlined,
                          size: 38,
                          color: Colors.white70,
                        ),
                        const SizedBox(height: AinSpacing.xs),
                        Text(
                          strings.watermarkRenderedFor(
                            session.watermark.userName,
                          ),
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            Wrap(
              spacing: AinSpacing.sm,
              children: [
                if (state.isExpired)
                  TextButton.icon(
                    onPressed: () {
                      ref.read(contentViewerControllerProvider.notifier).open(
                            organizationId: state.organizationId,
                            contentId: state.contentId,
                          );
                    },
                    icon: const Icon(Icons.refresh),
                    label: Text(strings.refreshViewerSession),
                  ),
                TextButton.icon(
                  onPressed: () {
                    ref
                        .read(contentViewerControllerProvider.notifier)
                        .recordDownloadBlocked();
                  },
                  icon: const Icon(Icons.file_download_off),
                  label: Text(strings.reportDownloadBlocked),
                ),
                TextButton.icon(
                  onPressed: () {
                    ref.read(contentViewerControllerProvider.notifier).close();
                  },
                  icon: const Icon(Icons.close),
                  label: Text(strings.closeViewer),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _LockedCourseState extends StatelessWidget {
  const _LockedCourseState({required this.detail});

  final StudentEnrollmentDetail detail;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.lock_outline,
          title: strings.courseAccessLocked,
          subtitle: strings.courseAccessLockedHint(detail.access.reason),
          action: FilledButton.icon(
            onPressed: () => context.go(MyCoursesPage.routePath),
            icon: const Icon(Icons.arrow_back),
            label: Text(strings.backToMyCourses),
          ),
        ),
      ],
    );
  }
}

class _InlineLoading extends StatelessWidget {
  const _InlineLoading({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: const LinearProgressIndicator(),
    );
  }
}

class _WorkspaceSection extends StatelessWidget {
  const _WorkspaceSection({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(icon: icon),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    body,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AinColors.muted,
                          height: 1.3,
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

class _AssignmentsSection extends StatefulWidget {
  const _AssignmentsSection({
    required this.isArabic,
    required this.courseName,
  });

  final bool isArabic;
  final String courseName;

  @override
  State<_AssignmentsSection> createState() => _AssignmentsSectionState();
}

class _AssignmentsSectionState extends State<_AssignmentsSection> {
  late List<_MockAssignment> _assignments;

  @override
  void initState() {
    super.initState();
    _assignments = [
      _MockAssignment(
        id: 'assign-1',
        titleAr: 'مشروع التصميم والتطبيق العملي',
        titleEn: 'System Design & Implementation Project',
        descriptionAr:
            'قم بإعداد توثيق شامل لمعمارية المنصة وخطة عزل المستأجرين مع رفع ملف المشروع.',
        descriptionEn:
            'Submit comprehensive documentation for multi-tenant isolation and project architecture.',
        dueDate: '2026-09-28',
        maxPoints: 100,
        isSubmitted: true,
        score: 95,
        feedbackAr: 'تصميم متميز ومدروس للموديولات مع مراعاة العزل التام.',
        feedbackEn: 'Excellent modular design with complete data scoping.',
      ),
      _MockAssignment(
        id: 'assign-2',
        titleAr: 'المهمة الأسبوعية: تحليل الأداء وقواعد البيانات',
        titleEn: 'Weekly Assignment: Database Performance Analysis',
        descriptionAr:
            'حل تدريبات تحسين الاستعلامات وفهرسة الجداول مع بيان أثر التقسيم على سرعة الاستجابة.',
        descriptionEn:
            'Solve query optimization problems and index design scenarios.',
        dueDate: '2026-10-04',
        maxPoints: 50,
        isSubmitted: false,
      ),
    ];
  }

  void _showSubmitSheet(_MockAssignment assignment) {
    final textController = TextEditingController();
    final linkController = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bottomSheetContext) {
        return Container(
          padding: EdgeInsets.only(
            left: AinSpacing.lg,
            right: AinSpacing.lg,
            top: AinSpacing.lg,
            bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom +
                AinSpacing.lg,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(AinRadii.xl)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: AinSpacing.md),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                widget.isArabic ? 'تسليم حل الواجب' : 'Submit Assignment',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: AinSpacing.xs),
              Text(
                widget.isArabic ? assignment.titleAr : assignment.titleEn,
                style: const TextStyle(color: AinColors.muted, fontSize: 13),
              ),
              const SizedBox(height: AinSpacing.md),
              TextField(
                controller: textController,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: widget.isArabic
                      ? 'ملاحظات أو نص الإجابة'
                      : 'Answer Notes',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AinRadii.md),
                  ),
                ),
              ),
              const SizedBox(height: AinSpacing.sm),
              TextField(
                controller: linkController,
                decoration: InputDecoration(
                  labelText: widget.isArabic
                      ? 'رابط الملف (Google Drive / GitHub)'
                      : 'File / Repository URL',
                  prefixIcon: const Icon(Icons.link),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AinRadii.md),
                  ),
                ),
              ),
              const SizedBox(height: AinSpacing.lg),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: AinColors.brand,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AinRadii.pill),
                  ),
                ),
                onPressed: () {
                  setState(() {
                    assignment.isSubmitted = true;
                    assignment.submissionText = textController.text;
                    assignment.attachmentUrl = linkController.text;
                  });
                  Navigator.pop(bottomSheetContext);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        widget.isArabic
                            ? 'تم تسليم الواجب بنجاح وإرساله للمراجعة!'
                            : 'Assignment submitted successfully for review!',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.send_rounded),
                label: Text(widget.isArabic ? 'تأكيد التسليم' : 'Submit Now'),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AinSectionHeader(
          title: widget.isArabic
              ? 'الواجبات والتكليفات'
              : 'Assignments & Projects',
          subtitle: widget.isArabic
              ? 'سلّم المهام وتابع تقييمات المدرس أولاً بأول.'
              : 'Submit homework and track instructor reviews.',
        ),
        const SizedBox(height: AinSpacing.md),
        ..._assignments.map((assignment) {
          return Padding(
            padding: const EdgeInsets.only(bottom: AinSpacing.md),
            child: AinSurface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AinStatusPill(
                        icon: assignment.isSubmitted
                            ? Icons.check_circle
                            : Icons.schedule,
                        label: assignment.isSubmitted
                            ? (assignment.score != null
                                ? '${widget.isArabic ? "الدرجة:" : "Score:"} ${assignment.score}/${assignment.maxPoints}'
                                : (widget.isArabic
                                    ? 'تم التسليم'
                                    : 'Submitted'))
                            : '${assignment.maxPoints} ${widget.isArabic ? "درجة" : "pts"}',
                        color: assignment.isSubmitted
                            ? AinColors.success
                            : AinColors.brand,
                        backgroundColor: assignment.isSubmitted
                            ? AinColors.successSoft
                            : AinColors.brandSoft,
                      ),
                      Text(
                        '${widget.isArabic ? "تاريخ الاستحقاق:" : "Due:"} ${assignment.dueDate}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AinColors.muted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AinSpacing.sm),
                  Text(
                    widget.isArabic ? assignment.titleAr : assignment.titleEn,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    widget.isArabic
                        ? assignment.descriptionAr
                        : assignment.descriptionEn,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AinColors.muted,
                      height: 1.35,
                    ),
                  ),
                  if (assignment.feedbackAr != null &&
                      assignment.isSubmitted) ...[
                    const SizedBox(height: AinSpacing.sm),
                    Container(
                      padding: const EdgeInsets.all(AinSpacing.sm),
                      decoration: BoxDecoration(
                        color: AinColors.successSoft,
                        borderRadius: BorderRadius.circular(AinRadii.sm),
                        border: Border.all(
                          color: AinColors.success.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.rate_review_outlined,
                            size: 16,
                            color: AinColors.success,
                          ),
                          const SizedBox(width: AinSpacing.xs),
                          Expanded(
                            child: Text(
                              '${widget.isArabic ? "ملاحظات المدرس:" : "Feedback:"} ${widget.isArabic ? assignment.feedbackAr : assignment.feedbackEn}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AinColors.success,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: AinSpacing.md),
                  if (!assignment.isSubmitted)
                    Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: AinColors.brand,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AinRadii.pill),
                          ),
                        ),
                        onPressed: () => _showSubmitSheet(assignment),
                        icon: const Icon(Icons.upload_file, size: 16),
                        label: Text(
                          widget.isArabic ? 'تسليم الحل' : 'Submit Work',
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _MockAssignment {
  _MockAssignment({
    required this.id,
    required this.titleAr,
    required this.titleEn,
    required this.descriptionAr,
    required this.descriptionEn,
    required this.dueDate,
    required this.maxPoints,
    required this.isSubmitted,
    this.score,
    this.feedbackAr,
    this.feedbackEn,
  });

  final String id;
  final String titleAr;
  final String titleEn;
  final String descriptionAr;
  final String descriptionEn;
  final String dueDate;
  final int maxPoints;
  bool isSubmitted;
  int? score;
  String? feedbackAr;
  String? feedbackEn;
  String? submissionText;
  String? attachmentUrl;
}

class _QuizzesSection extends StatefulWidget {
  const _QuizzesSection({
    required this.isArabic,
    required this.courseName,
  });

  final bool isArabic;
  final String courseName;

  @override
  State<_QuizzesSection> createState() => _QuizzesSectionState();
}

class _QuizzesSectionState extends State<_QuizzesSection> {
  late List<_MockQuiz> _quizzes;

  @override
  void initState() {
    super.initState();
    _quizzes = [
      _MockQuiz(
        id: 'quiz-1',
        titleAr: 'اختبار المفاهيم والمعمارية المتقدمة',
        titleEn: 'Advanced Concepts & Architecture Quiz',
        durationMinutes: 15,
        passingScore: 70,
        maxAttempts: 3,
        attemptsCount: 1,
        bestPercentage: 100,
        isPassed: true,
        questions: [
          _MockQuestion(
            questionAr:
                'ما هي الفائدة الأساسية للعزل متعدد المستأجرين (Multi-Tenancy)؟',
            questionEn: 'What is the primary benefit of multi-tenancy?',
            optionsAr: [
              'مشاركة الموارد بأمان مع ضمان العزل التام لبيانات كل مستأجر',
              'تخصيص خوادم مادية مستقلة تماماً لكل مستأجر',
              'إلغاء الحاجة لقواعد البيانات التقليدية',
            ],
            optionsEn: [
              'Safe resource sharing with complete tenant data isolation',
              'Completely separate physical hardware for each tenant',
              'No database required',
            ],
            correctIndex: 0,
          ),
          _MockQuestion(
            questionAr:
                'يتم تطبيق علامة مائية أمنية ديناميكية على فيديوهات ومستندات المنصة لحماية المحتوى.',
            questionEn:
                'Dynamic security watermarking protects platform video and document assets.',
            optionsAr: ['صحيح (True)', 'خطأ (False)'],
            optionsEn: ['True', 'False'],
            correctIndex: 0,
          ),
        ],
      ),
      _MockQuiz(
        id: 'quiz-2',
        titleAr: 'التقييم السريع: الأداء وقواعد البيانات',
        titleEn: 'Fast Quiz: Performance & Database Design',
        durationMinutes: 10,
        passingScore: 60,
        maxAttempts: 2,
        attemptsCount: 0,
        questions: [
          _MockQuestion(
            questionAr:
                'أفضل استراتيجية لمنع بطء استعلامات البحث في الجداول الكبيرة هي:',
            questionEn:
                'The best strategy to prevent slow queries on large tables is:',
            optionsAr: [
              'إنشاء فهارس مركبة مناسبة (Composite Indexes)',
              'إلغاء كل القيود المفتاحية',
              'مسح البيانات القديمة تلقائياً',
            ],
            optionsEn: [
              'Create appropriate composite indexes',
              'Drop all foreign keys',
              'Delete older records automatically',
            ],
            correctIndex: 0,
          ),
        ],
      ),
    ];
  }

  void _openQuizDialog(_MockQuiz quiz) {
    final selectedAnswers = <int, int>{};

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AinRadii.xl),
              ),
              child: Padding(
                padding: const EdgeInsets.all(AinSpacing.lg),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              widget.isArabic ? quiz.titleAr : quiz.titleEn,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(dialogContext),
                          ),
                        ],
                      ),
                      Container(
                        margin:
                            const EdgeInsets.symmetric(vertical: AinSpacing.sm),
                        padding: const EdgeInsets.symmetric(
                          horizontal: AinSpacing.md,
                          vertical: AinSpacing.xs,
                        ),
                        decoration: BoxDecoration(
                          color: AinColors.brandSoft,
                          borderRadius: BorderRadius.circular(AinRadii.pill),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.timer_outlined,
                              size: 15,
                              color: AinColors.brand,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${quiz.durationMinutes} ${widget.isArabic ? "دقيقة" : "min"} · ${widget.isArabic ? "النجاح:" : "Pass:"} ${quiz.passingScore}%',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AinColors.brand,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: AinSpacing.md),
                      ...List.generate(quiz.questions.length, (qIdx) {
                        final question = quiz.questions[qIdx];
                        final options = widget.isArabic
                            ? question.optionsAr
                            : question.optionsEn;

                        return Container(
                          margin: const EdgeInsets.only(bottom: AinSpacing.md),
                          padding: const EdgeInsets.all(AinSpacing.md),
                          decoration: BoxDecoration(
                            color: AinColors.surface,
                            border: Border.all(color: AinColors.line),
                            borderRadius: BorderRadius.circular(AinRadii.lg),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${qIdx + 1}. ${widget.isArabic ? question.questionAr : question.questionEn}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: AinSpacing.xs),
                              ...List.generate(options.length, (optIdx) {
                                final isSelected =
                                    selectedAnswers[qIdx] == optIdx;
                                return InkWell(
                                  onTap: () {
                                    setModalState(() {
                                      selectedAnswers[qIdx] = optIdx;
                                    });
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(
                                      top: AinSpacing.xs,
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AinSpacing.sm,
                                      vertical: AinSpacing.xs,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? AinColors.brandSoft
                                          : Colors.transparent,
                                      borderRadius:
                                          BorderRadius.circular(AinRadii.sm),
                                      border: Border.all(
                                        color: isSelected
                                            ? AinColors.brand
                                            : Colors.grey.shade300,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(
                                          isSelected
                                              ? Icons.radio_button_checked
                                              : Icons.radio_button_off,
                                          size: 16,
                                          color: isSelected
                                              ? AinColors.brand
                                              : Colors.grey,
                                        ),
                                        const SizedBox(width: AinSpacing.xs),
                                        Expanded(
                                          child: Text(
                                            options[optIdx],
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: isSelected
                                                  ? AinColors.brand
                                                  : Colors.black87,
                                              fontWeight: isSelected
                                                  ? FontWeight.w700
                                                  : FontWeight.normal,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: AinSpacing.md),
                      FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: AinColors.brand,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AinRadii.pill),
                          ),
                        ),
                        onPressed: selectedAnswers.length <
                                quiz.questions.length
                            ? null
                            : () {
                                int correct = 0;
                                for (var i = 0;
                                    i < quiz.questions.length;
                                    i++) {
                                  if (selectedAnswers[i] ==
                                      quiz.questions[i].correctIndex) {
                                    correct++;
                                  }
                                }
                                final percentage =
                                    ((correct / quiz.questions.length) * 100)
                                        .round();
                                final passed = percentage >= quiz.passingScore;

                                setState(() {
                                  quiz.attemptsCount++;
                                  quiz.bestPercentage = percentage;
                                  quiz.isPassed = passed;
                                });

                                Navigator.pop(dialogContext);
                                _showQuizResultDialog(percentage, passed, quiz);
                              },
                        child: Text(
                          widget.isArabic
                              ? 'إنهاء وتسليم الإجابات'
                              : 'Submit Answers',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showQuizResultDialog(int percentage, bool passed, _MockQuiz quiz) {
    showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AinRadii.xl),
          ),
          title: Center(
            child: Icon(
              passed ? Icons.check_circle : Icons.warning_amber_rounded,
              size: 50,
              color: passed ? AinColors.success : AinColors.brand,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                passed
                    ? (widget.isArabic
                        ? 'تهانينا! تم اجتياز الاختبار'
                        : 'Congratulations! Passed')
                    : (widget.isArabic
                        ? 'لم تجتز درجة النجاح المطلوبة'
                        : 'Quiz Not Passed'),
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AinSpacing.sm),
              Text(
                '${widget.isArabic ? "درجتك النهائية:" : "Final score:"} $percentage%',
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: AinSpacing.xs),
              Text(
                passed
                    ? (widget.isArabic
                        ? 'تم تسجيل النتيجة واعتماد إنجازك بنجاح.'
                        : 'Score recorded successfully.')
                    : (widget.isArabic
                        ? 'يمكنك مراجعة المحتوى وإعادة المحاولة.'
                        : 'Review materials and try again.'),
                style: const TextStyle(fontSize: 12, color: AinColors.muted),
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(widget.isArabic ? 'إغلاق' : 'Close'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AinSectionHeader(
          title: widget.isArabic
              ? 'الاختبارات والتقييمات'
              : 'Quizzes & Assessments',
          subtitle: widget.isArabic
              ? 'اختبارات تفاعلية بتصحيح آلي فوري.'
              : 'Interactive tests with instant auto-grading.',
        ),
        const SizedBox(height: AinSpacing.md),
        ..._quizzes.map((quiz) {
          return Padding(
            padding: const EdgeInsets.only(bottom: AinSpacing.md),
            child: AinSurface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AinStatusPill(
                        icon: quiz.isPassed
                            ? Icons.verified
                            : Icons.timer_outlined,
                        label: quiz.isPassed
                            ? '${widget.isArabic ? "ناجح:" : "Passed:"} ${quiz.bestPercentage}%'
                            : '${quiz.durationMinutes} ${widget.isArabic ? "دقيقة" : "min"}',
                        color:
                            quiz.isPassed ? AinColors.success : AinColors.brand,
                        backgroundColor: quiz.isPassed
                            ? AinColors.successSoft
                            : AinColors.brandSoft,
                      ),
                      Text(
                        '${widget.isArabic ? "المحاولات:" : "Attempts:"} ${quiz.attemptsCount}/${quiz.maxAttempts}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AinColors.muted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AinSpacing.sm),
                  Text(
                    widget.isArabic ? quiz.titleAr : quiz.titleEn,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    '${widget.isArabic ? "درجة النجاح:" : "Passing score:"} ${quiz.passingScore}% · ${quiz.questions.length} ${widget.isArabic ? "أسئلة" : "questions"}',
                    style:
                        const TextStyle(fontSize: 13, color: AinColors.muted),
                  ),
                  const SizedBox(height: AinSpacing.md),
                  Align(
                    alignment: AlignmentDirectional.centerEnd,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: AinColors.brand,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AinRadii.pill),
                        ),
                      ),
                      onPressed: quiz.attemptsCount >= quiz.maxAttempts
                          ? null
                          : () => _openQuizDialog(quiz),
                      icon: const Icon(Icons.play_arrow, size: 16),
                      label: Text(
                        quiz.attemptsCount > 0
                            ? (widget.isArabic
                                ? 'إعادة المحاولة'
                                : 'Retake Quiz')
                            : (widget.isArabic ? 'بدء الاختبار' : 'Start Quiz'),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class _MockQuiz {
  _MockQuiz({
    required this.id,
    required this.titleAr,
    required this.titleEn,
    required this.durationMinutes,
    required this.passingScore,
    required this.maxAttempts,
    required this.attemptsCount,
    required this.questions,
    this.bestPercentage,
    this.isPassed = false,
  });

  final String id;
  final String titleAr;
  final String titleEn;
  final int durationMinutes;
  final int passingScore;
  final int maxAttempts;
  int attemptsCount;
  final List<_MockQuestion> questions;
  int? bestPercentage;
  bool isPassed;
}

class _MockQuestion {
  _MockQuestion({
    required this.questionAr,
    required this.questionEn,
    required this.optionsAr,
    required this.optionsEn,
    required this.correctIndex,
  });

  final String questionAr;
  final String questionEn;
  final List<String> optionsAr;
  final List<String> optionsEn;
  final int correctIndex;
}

class _LiveMeetingCard extends StatelessWidget {
  const _LiveMeetingCard({
    required this.title,
    required this.startsAt,
    required this.meetingUrl,
    required this.meetingId,
    required this.passcode,
    required this.isArabic,
  });

  final String title;
  final String startsAt;
  final String meetingUrl;
  final String meetingId;
  final String passcode;
  final bool isArabic;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AinSpacing.md),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(AinRadii.md),
        border: Border.all(color: Colors.blueAccent.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.blueAccent.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(AinRadii.xs),
                ),
                child: const Text(
                  'Zoom LIVE',
                  style: TextStyle(
                    color: Colors.blueAccent,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                startsAt,
                style: const TextStyle(color: AinColors.muted, fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.xs),
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 13,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: AinSpacing.xs),
          Row(
            children: [
              Text(
                'ID: $meetingId',
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 11,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Pass: $passcode',
                style: const TextStyle(
                  color: Colors.amberAccent,
                  fontSize: 11,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          const SizedBox(height: AinSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AinRadii.sm),
                ),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      isArabic
                          ? 'جاري فتح جلسة البث المباشر...'
                          : 'Opening Zoom session...',
                    ),
                  ),
                );
              },
              icon: const Icon(Icons.video_call, size: 18),
              label: Text(
                isArabic ? 'انضم إلى الحصة المباشرة الآن' : 'Join Live Meeting',
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoomDiscussionsSection extends StatefulWidget {
  const _RoomDiscussionsSection({required this.isArabic});
  final bool isArabic;

  @override
  State<_RoomDiscussionsSection> createState() =>
      _RoomDiscussionsSectionState();
}

class _RoomDiscussionsSectionState extends State<_RoomDiscussionsSection> {
  final _commentController = TextEditingController();

  final List<Map<String, dynamic>> _discussions = [
    {
      'id': 'd1',
      'title': 'استفسار حول طريقة تسليم المشروع النهائي',
      'author': 'عمر خالد (طالب)',
      'time': 'منذ ساعتين',
      'isPinned': true,
      'body':
          'هل يشترط رفع المشروع على GitHub أم يمكن تسليم ملف ZIP مباشرة في التكليف؟',
      'replies': [
        {
          'author': 'م. طارق علي (المعلم المعتمد)',
          'isInstructor': true,
          'body':
              'يفضل وضع رابط GitHub ومعه ملف مضغوط في تسليم الواجب لتوثيق المشروع بالكامل.',
        },
      ],
    },
  ];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              widget.isArabic ? 'مجتمع ونقاشات الغرفة' : 'Room Discussions',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: () => _showNewDiscussionSheet(context),
              icon: const Icon(Icons.add_comment_outlined, size: 16),
              label: Text(widget.isArabic ? 'طرح سؤال' : 'Ask Question'),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.sm),
        for (final disc in _discussions)
          Container(
            margin: const EdgeInsets.only(bottom: AinSpacing.md),
            padding: const EdgeInsets.all(AinSpacing.md),
            decoration: BoxDecoration(
              color: AinColors.surface,
              borderRadius: BorderRadius.circular(AinRadii.md),
              border: Border.all(
                color: disc['isPinned'] == true
                    ? Colors.amber.withValues(alpha: 0.5)
                    : AinColors.line,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: AinColors.brandSoft,
                      child: Text(
                        (disc['author'] as String).substring(0, 1),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AinColors.brand,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            disc['author'] as String,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            disc['time'] as String,
                            style: const TextStyle(
                              color: AinColors.muted,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (disc['isPinned'] == true)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.amber.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(AinRadii.xs),
                        ),
                        child: Text(
                          widget.isArabic ? 'مثبت' : 'Pinned',
                          style: const TextStyle(
                            color: Colors.amber,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: AinSpacing.sm),
                Text(
                  disc['title'] as String,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  disc['body'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white70,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: AinSpacing.sm),
                const Divider(height: 1, color: AinColors.line),
                const SizedBox(height: AinSpacing.sm),
                for (final reply
                    in (disc['replies'] as List<Map<String, dynamic>>))
                  Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: reply['isInstructor'] == true
                          ? AinColors.brandSoft.withValues(alpha: 0.3)
                          : Colors.black26,
                      borderRadius: BorderRadius.circular(AinRadii.sm),
                      border: Border.all(
                        color: reply['isInstructor'] == true
                            ? AinColors.brand
                            : AinColors.line,
                        width: 0.8,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          reply['author'] as String,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: reply['isInstructor'] == true
                                ? AinColors.brand
                                : Colors.white,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          reply['body'] as String,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _commentController,
                        style: const TextStyle(fontSize: 11),
                        decoration: InputDecoration(
                          hintText: widget.isArabic
                              ? 'اكتب تعقيبك أو استفسارك...'
                              : 'Add a reply...',
                          hintStyle: const TextStyle(
                            fontSize: 11,
                            color: AinColors.muted,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          isDense: true,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AinRadii.sm),
                            borderSide: const BorderSide(color: AinColors.line),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    IconButton(
                      icon: const Icon(
                        Icons.send,
                        size: 16,
                        color: AinColors.brand,
                      ),
                      onPressed: () {
                        if (_commentController.text.trim().isNotEmpty) {
                          setState(() {
                            (disc['replies'] as List<Map<String, dynamic>>)
                                .add({
                              'author': 'أنا (طالب)',
                              'isInstructor': false,
                              'body': _commentController.text.trim(),
                            });
                            _commentController.clear();
                          });
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }

  void _showNewDiscussionSheet(BuildContext context) {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AinRadii.lg)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: AinSpacing.md,
          right: AinSpacing.md,
          top: AinSpacing.md,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + AinSpacing.md,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.isArabic ? 'طرح سؤال أو موضوع جديد' : 'New Question',
              style: Theme.of(ctx)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: AinSpacing.md),
            TextField(
              controller: titleCtrl,
              decoration: InputDecoration(
                labelText: widget.isArabic ? 'عنوان الاستفسار' : 'Title',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AinSpacing.sm),
            TextField(
              controller: bodyCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: widget.isArabic ? 'تفاصيل السؤال' : 'Details',
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: AinSpacing.md),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (titleCtrl.text.trim().isNotEmpty &&
                      bodyCtrl.text.trim().isNotEmpty) {
                    setState(() {
                      _discussions.insert(0, {
                        'id': 'd_${DateTime.now().millisecondsSinceEpoch}',
                        'title': titleCtrl.text.trim(),
                        'author': 'أنا (طالب)',
                        'time': widget.isArabic ? 'الآن' : 'Just now',
                        'isPinned': false,
                        'body': bodyCtrl.text.trim(),
                        'replies': <Map<String, dynamic>>[],
                      });
                    });
                    Navigator.pop(ctx);
                  }
                },
                child: Text(widget.isArabic ? 'نشر الآن' : 'Post Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
