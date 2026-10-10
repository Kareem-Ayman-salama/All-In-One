import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/learning/application/student_learning_controller.dart';
import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:ain_mobile/src/features/learning/presentation/course_workspace_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class MyCoursesPage extends ConsumerWidget {
  const MyCoursesPage({super.key});

  static const routePath = '/my-courses';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final overview = ref.watch(studentLearningOverviewProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.myCourses)),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () {
            return ref.refresh(studentLearningOverviewProvider.future);
          },
          child: overview.when(
            data: (data) => _MyCoursesBody(overview: data),
            error: (error, stackTrace) => ListView(
              padding: const EdgeInsets.all(AinSpacing.lg),
              children: [
                AinEmptyState(
                  icon: Icons.cloud_off_outlined,
                  title: strings.retry,
                  subtitle: error.toString(),
                  action: FilledButton.icon(
                    onPressed: () {
                      ref.invalidate(studentLearningOverviewProvider);
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
      ),
    );
  }
}

class _MyCoursesBody extends StatelessWidget {
  const _MyCoursesBody({required this.overview});

  final StudentLearningOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _LearningHero(
          title: strings.myLearningTitle,
          subtitle: strings.myLearningSubtitle,
          overview: overview,
        ),
        const SizedBox(height: AinSpacing.xl),
        if (overview.bookings.isEmpty && overview.enrollments.isEmpty)
          _EmptyLearningState()
        else ...[
          AinSectionHeader(title: strings.activeCourses),
          const SizedBox(height: AinSpacing.md),
          if (overview.enrollments.isEmpty)
            AinEmptyState(
              icon: Icons.school_outlined,
              title: strings.noActiveCourses,
            )
          else
            for (final enrollment in overview.enrollments)
              _EnrollmentCard(enrollment: enrollment),
          const SizedBox(height: AinSpacing.xl),
          AinSectionHeader(title: strings.bookingRequests),
          const SizedBox(height: AinSpacing.md),
          if (overview.bookings.isEmpty)
            AinEmptyState(
              icon: Icons.pending_actions_outlined,
              title: strings.noBookingRequests,
            )
          else
            for (final booking in overview.bookings)
              _BookingCard(booking: booking),
        ],
      ],
    );
  }
}

class _LearningHero extends StatelessWidget {
  const _LearningHero({
    required this.title,
    required this.subtitle,
    required this.overview,
  });

  final String title;
  final String subtitle;
  final StudentLearningOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Container(
      decoration: BoxDecoration(
        gradient: AinGradients.heroShimmer,
        borderRadius: BorderRadius.circular(AinRadii.xl),
        boxShadow: AinShadows.float,
      ),
      padding: const EdgeInsets.all(AinSpacing.xl),
      child: Stack(
        children: [
          Positioned(
            top: -24,
            right: -24,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            left: -20,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AinColors.gold.withValues(alpha: 0.08),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(AinRadii.md),
                      border: Border.all(
                        color: AinColors.gold.withValues(alpha: 0.45),
                      ),
                    ),
                    child: const Icon(
                      Icons.school_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: AinSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 19,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.82),
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AinSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: _HeroMetric(
                      label: strings.pendingBookings,
                      value: overview.pendingBookingCount.toString(),
                      icon: Icons.pending_actions_outlined,
                    ),
                  ),
                  const SizedBox(width: AinSpacing.sm),
                  Expanded(
                    child: _HeroMetric(
                      label: strings.activeCourses,
                      value: overview.activeEnrollmentCount.toString(),
                      icon: Icons.play_circle_outline,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroMetric extends StatelessWidget {
  const _HeroMetric({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AinRadii.md),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.16),
        ),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AinSpacing.md,
        vertical: AinSpacing.md,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AinColors.gold, size: 16),
          ),
          const SizedBox(width: AinSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 17,
                  ),
                ),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
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

class _EnrollmentCard extends StatelessWidget {
  const _EnrollmentCard({required this.enrollment});

  final StudentEnrollmentSummary enrollment;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final course = enrollment.course;
    final batch = enrollment.batch;
    final subscription = enrollment.subscription;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          color: AinColors.surface,
          borderRadius: BorderRadius.circular(AinRadii.xl),
          border: Border.all(color: const Color(0x0F16458F)),
          boxShadow: AinShadows.card,
        ),
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const AinIconBadge(
                  icon: Icons.play_circle_outline,
                  backgroundColor: AinColors.brandSoft,
                  foregroundColor: AinColors.brand,
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course?.localizedTitle(strings.isArabic) ??
                            strings.course,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w900,
                          color: AinColors.ink,
                          height: 1.35,
                        ),
                      ),
                      if (course?.academy != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          course!.academy!.localizedName(strings.isArabic),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AinColors.muted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  strings.isArabic ? 'نسبة التقدم' : 'Progress',
                  style: const TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: AinColors.muted,
                  ),
                ),
                const Text(
                  '65%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    color: AinColors.brand,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(AinRadii.pill),
              child: const LinearProgressIndicator(
                value: 0.65,
                minHeight: 6,
                backgroundColor: AinColors.canvas,
                valueColor: AlwaysStoppedAnimation<Color>(AinColors.brand),
              ),
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                if (batch != null)
                  AinStatusPill(
                    icon: Icons.event_note_outlined,
                    label: batch.localizedTitle(strings.isArabic),
                    color: AinColors.teal,
                    backgroundColor: AinColors.tealSoft,
                  ),
                if (subscription?.endsAt != null)
                  AinStatusPill(
                    icon: Icons.schedule_outlined,
                    label: strings.accessUntil(subscription!.endsAt!),
                    color: AinColors.warning,
                    backgroundColor: AinColors.warningSoft,
                  ),
              ],
            ),
            const SizedBox(height: AinSpacing.lg),
            AinPrimaryButton(
              label: strings.openCourseSpace,
              icon: Icons.play_arrow_rounded,
              onPressed: enrollment.isActive
                  ? () =>
                      context.go(CourseWorkspacePage.location(enrollment.id))
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({required this.booking});

  final StudentBookingSummary booking;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final course = booking.course;
    final batch = booking.batch;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AinIconBadge(
              icon: booking.isPending
                  ? Icons.pending_actions_outlined
                  : Icons.task_alt_outlined,
              backgroundColor: booking.isPending
                  ? AinColors.warningSoft
                  : AinColors.successSoft,
              foregroundColor:
                  booking.isPending ? AinColors.warning : AinColors.success,
            ),
            const SizedBox(width: AinSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    course?.localizedTitle(strings.isArabic) ?? strings.course,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    [
                      batch?.localizedTitle(strings.isArabic),
                      strings.bookingStatusLabel(booking.status),
                      strings.priceFromMinor(
                        booking.amountMinor,
                        booking.currency,
                      ),
                    ].whereType<String>().join(' - '),
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

class _EmptyLearningState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return AinEmptyState(
      icon: Icons.menu_book_outlined,
      title: strings.noLearningYet,
      subtitle: strings.noLearningYetHint,
      action: FilledButton.icon(
        onPressed: () => context.go(CourseCatalogPage.routePath),
        icon: const Icon(Icons.search),
        label: Text(strings.exploreCourses),
      ),
    );
  }
}
