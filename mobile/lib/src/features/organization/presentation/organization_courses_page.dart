import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_course_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_course_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
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

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationCourses)),
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
                data: (data) => _CoursesBody(overview: data),
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
                          organizationCoursesOverviewProvider(
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

class _CoursesBody extends StatelessWidget {
  const _CoursesBody({required this.overview});

  final OrganizationCoursesOverview overview;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.organizationCourses,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(strings.organizationCoursesHint),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _StatTile(
                icon: Icons.school,
                label: strings.publishedCourses,
                value: overview.publishedCourseCount.toString(),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _StatTile(
                icon: Icons.event_available,
                label: strings.openBatches,
                value: overview.openBatchCount.toString(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (overview.courses.isEmpty)
          Text(strings.noOrganizationCourses)
        else
          for (final course in overview.courses)
            _CourseCard(
              course: course,
              batches: overview.batchesForCourse(course.id),
            ),
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

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course, required this.batches});

  final OrganizationCourseSummary course;
  final List<OrganizationBatchSummary> batches;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(course.title, style: Theme.of(context).textTheme.titleMedium),
            if (course.shortDescription != null) ...[
              const SizedBox(height: 4),
              Text(course.shortDescription!),
            ],
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(strings.courseStatusLabel(course.status))),
                Chip(label: Text(course.deliveryType)),
                Chip(
                  label: Text(
                    strings.priceFromMinor(course.priceMinor, course.currency),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              strings.batchesCount(batches.length),
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            if (batches.isEmpty)
              Text(strings.noBatchesYet)
            else
              for (final batch in batches.take(3)) _BatchTile(batch: batch),
          ],
        ),
      ),
    );
  }
}

class _BatchTile extends StatelessWidget {
  const _BatchTile({required this.batch});

  final OrganizationBatchSummary batch;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.event_note),
      title: Text(batch.title),
      subtitle: Text(
        [
          strings.courseStatusLabel(batch.status),
          if (batch.startDate != null) batch.startDate,
          strings.seatsLeft(batch.remainingSeats),
        ].whereType<String>().join(' | '),
      ),
    );
  }
}
