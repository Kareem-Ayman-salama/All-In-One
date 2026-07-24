import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/content/application/content_viewer_controller.dart';
import 'package:ain_mobile/src/features/content/application/course_content_controller.dart';
import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:ain_mobile/src/features/learning/application/student_learning_controller.dart';
import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CourseWorkspacePage extends ConsumerWidget {
  const CourseWorkspacePage({
    required this.enrollmentId,
    super.key,
  });

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
            padding: const EdgeInsets.all(24),
            children: [
              const Icon(Icons.lock_outline, size: 48),
              const SizedBox(height: 12),
              Text(error.toString(), textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () {
                  ref.invalidate(studentEnrollmentDetailProvider(enrollmentId));
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
    );
  }
}

class _CourseWorkspaceBody extends StatelessWidget {
  const _CourseWorkspaceBody({
    required this.detail,
  });

  final StudentEnrollmentDetail detail;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final enrollment = detail.enrollment;
    final course = enrollment.course;
    final batch = enrollment.batch;
    final academy = course?.academy;
    final instructor = course?.instructor;

    if (!detail.access.allowed) {
      return _LockedCourseState(detail: detail);
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Chip(
                  avatar: const Icon(Icons.verified_user, size: 16),
                  label: Text(strings.activeAccess),
                ),
                const SizedBox(height: 12),
                Text(
                  course?.localizedTitle(strings.isArabic) ?? strings.course,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  [
                    academy?.localizedName(strings.isArabic),
                    instructor?.localizedName(strings.isArabic),
                  ].whereType<String>().join(' - '),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (batch?.schedule != null)
                      Chip(
                        avatar: const Icon(Icons.calendar_month, size: 16),
                        label: Text(batch!.schedule!),
                      ),
                    if (batch?.room != null)
                      Chip(
                        avatar: const Icon(Icons.meeting_room, size: 16),
                        label: Text(batch!.room!.name),
                      ),
                    if (enrollment.accessEndsAt != null)
                      Chip(
                        avatar: const Icon(Icons.schedule, size: 16),
                        label: Text(strings.accessUntil(enrollment.accessEndsAt!)),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        _WorkspaceSection(
          icon: Icons.play_lesson,
          title: strings.nextSession,
          body: batch?.schedule ?? strings.schedulePending,
        ),
        _CourseContentSection(
          organizationId: enrollment.organizationId,
          roomId: batch?.room?.id,
        ),
        _WorkspaceSection(
          icon: Icons.campaign,
          title: strings.latestAnnouncement,
          body: strings.noAnnouncementsYet,
        ),
      ],
    );
  }
}

class _CourseContentSection extends ConsumerWidget {
  const _CourseContentSection({
    required this.organizationId,
    this.roomId,
  });

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

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.folder_open),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    strings.courseContent,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            content.when(
              data: (items) {
                if (items.isEmpty) {
                  return Text(strings.courseContentPending);
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
                  const SizedBox(height: 8),
                  TextButton.icon(
                    onPressed: () => ref.invalidate(
                      courseContentListProvider(query),
                    ),
                    icon: const Icon(Icons.refresh),
                    label: Text(strings.retry),
                  ),
                ],
              ),
              loading: () => Semantics(
                label: strings.loading,
                child: const LinearProgressIndicator(),
              ),
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(strings.contentFileUnavailable)),
      );
      return;
    }

    await ref.read(contentViewerControllerProvider.notifier).open(
          organizationId: organizationId,
          contentId: item.id,
        );
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

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        item.type == 'video' ? Icons.play_circle_outline : Icons.description,
      ),
      title: Text(item.title),
      subtitle: Text(
        [
          file?.mimeType,
          if (item.watermarkEnabled) strings.watermarkProtected,
          if (!item.downloadAllowed) strings.downloadDisabled,
        ].whereType<String>().join(' - '),
      ),
      trailing: TextButton.icon(
        onPressed: opening ? null : onOpen,
        icon: const Icon(Icons.visibility),
        label: Text(strings.openSecureViewer),
      ),
    );
  }
}

class _SecureViewerState extends ConsumerWidget {
  const _SecureViewerState({
    required this.state,
  });

  final ContentViewerState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final session = state.session;

    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            strings.secureViewerOpen,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text('${session.mimeType} - ${session.status}'),
          if (session.watermark.enabled)
            Text(strings.watermarkRenderedFor(session.watermark.userName)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
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
    );
  }
}

class _LockedCourseState extends StatelessWidget {
  const _LockedCourseState({
    required this.detail,
  });

  final StudentEnrollmentDetail detail;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.lock_outline, size: 56),
        const SizedBox(height: 12),
        Text(
          strings.courseAccessLocked,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(
          strings.courseAccessLockedHint(detail.access.reason),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () => context.go(MyCoursesPage.routePath),
          icon: const Icon(Icons.arrow_back),
          label: Text(strings.backToMyCourses),
        ),
      ],
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
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(body),
      ),
    );
  }
}
