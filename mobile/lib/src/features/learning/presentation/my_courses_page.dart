import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/learning/application/student_learning_controller.dart';
import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:ain_mobile/src/features/learning/presentation/course_workspace_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
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
              padding: const EdgeInsets.all(24),
              children: [
                const Icon(Icons.cloud_off, size: 48),
                const SizedBox(height: 12),
                Text(error.toString(), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () {
                    ref.invalidate(studentLearningOverviewProvider);
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
        ),
      ),
    );
  }
}

class _MyCoursesBody extends StatelessWidget {
  const _MyCoursesBody({
    required this.overview,
  });

  final StudentLearningOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.myLearningTitle,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.myLearningSubtitle),
        const SizedBox(height: 16),
        _LearningStats(overview: overview),
        const SizedBox(height: 16),
        if (overview.bookings.isEmpty && overview.enrollments.isEmpty)
          _EmptyLearningState()
        else ...[
          _SectionTitle(title: strings.activeCourses),
          const SizedBox(height: 8),
          if (overview.enrollments.isEmpty)
            Text(strings.noActiveCourses)
          else
            for (final enrollment in overview.enrollments)
              _EnrollmentCard(enrollment: enrollment),
          const SizedBox(height: 16),
          _SectionTitle(title: strings.bookingRequests),
          const SizedBox(height: 8),
          if (overview.bookings.isEmpty)
            Text(strings.noBookingRequests)
          else
            for (final booking in overview.bookings)
              _BookingCard(booking: booking),
        ],
      ],
    );
  }
}

class _LearningStats extends StatelessWidget {
  const _LearningStats({
    required this.overview,
  });

  final StudentLearningOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.hourglass_top,
            label: strings.pendingBookings,
            value: overview.pendingBookingCount.toString(),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(
            icon: Icons.school,
            label: strings.activeCourses,
            value: overview.activeEnrollmentCount.toString(),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
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
            Text(label),
            const SizedBox(height: 4),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _EnrollmentCard extends StatelessWidget {
  const _EnrollmentCard({
    required this.enrollment,
  });

  final StudentEnrollmentSummary enrollment;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final course = enrollment.course;
    final batch = enrollment.batch;
    final subscription = enrollment.subscription;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: const Icon(Icons.play_circle_outline),
        title: Text(
          course?.localizedTitle(strings.isArabic) ?? strings.course,
        ),
        subtitle: Text(
          [
            course?.academy?.localizedName(strings.isArabic),
            batch?.localizedTitle(strings.isArabic),
            if (subscription?.endsAt != null)
              strings.accessUntil(subscription!.endsAt!),
          ].whereType<String>().join(' - '),
        ),
        trailing: FilledButton(
          onPressed: enrollment.isActive
              ? () => context.go(CourseWorkspacePage.location(enrollment.id))
              : null,
          child: Text(strings.openCourseSpace),
        ),
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  const _BookingCard({
    required this.booking,
  });

  final StudentBookingSummary booking;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final course = booking.course;
    final batch = booking.batch;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(
          booking.isPending ? Icons.pending_actions : Icons.task_alt,
        ),
        title: Text(
          course?.localizedTitle(strings.isArabic) ?? strings.course,
        ),
        subtitle: Text(
          [
            batch?.localizedTitle(strings.isArabic),
            strings.bookingStatusLabel(booking.status),
            strings.priceFromMinor(booking.amountMinor, booking.currency),
          ].whereType<String>().join(' - '),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
  });

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: Theme.of(context).textTheme.titleLarge,
    );
  }
}

class _EmptyLearningState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Icon(Icons.menu_book, size: 48),
            const SizedBox(height: 12),
            Text(
              strings.noLearningYet,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              strings.noLearningYetHint,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.go(CourseCatalogPage.routePath),
              icon: const Icon(Icons.search),
              label: Text(strings.exploreCourses),
            ),
          ],
        ),
      ),
    );
  }
}
