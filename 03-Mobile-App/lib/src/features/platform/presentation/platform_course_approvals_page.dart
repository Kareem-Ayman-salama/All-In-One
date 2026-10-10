import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/platform/application/platform_course_moderation_controller.dart';
import 'package:ain_mobile/src/features/platform/data/platform_course_moderation_repository.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformCourseApprovalsPage extends ConsumerStatefulWidget {
  const PlatformCourseApprovalsPage({super.key});

  static const routePath = '/platform/course-approvals';

  @override
  ConsumerState<PlatformCourseApprovalsPage> createState() {
    return _PlatformCourseApprovalsPageState();
  }
}

class _PlatformCourseApprovalsPageState
    extends ConsumerState<PlatformCourseApprovalsPage> {
  String _status = 'pending_review';

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final profile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.courseApprovals)),
      body: SafeArea(
        child: profile.when(
          data: (profile) {
            if (!_hasPlatformRole(profile.user.platformRole)) {
              return _AccessRequired(strings: strings);
            }

            final courses = ref.watch(
              platformCourseModerationProvider(_status),
            );

            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  platformCourseModerationProvider(_status).future,
                );
              },
              child: courses.when(
                data: (items) => _CourseApprovalList(
                  courses: items,
                  status: _status,
                  onStatusChanged: (value) {
                    setState(() {
                      _status = value;
                    });
                  },
                ),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(platformCourseModerationProvider(_status));
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
            onRetry: () => ref.invalidate(currentUserProfileProvider),
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

class _CourseApprovalList extends StatelessWidget {
  const _CourseApprovalList({
    required this.courses,
    required this.status,
    required this.onStatusChanged,
  });

  final List<PlatformCourseModerationSummary> courses;
  final String status;
  final ValueChanged<String> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.courseApprovals,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(strings.courseApprovalsHint),
        const SizedBox(height: 12),
        SegmentedButton<String>(
          segments: [
            ButtonSegment<String>(
              value: 'pending_review',
              label: Text(strings.pendingReview),
              icon: const Icon(Icons.rate_review),
            ),
            ButtonSegment<String>(
              value: 'rejected',
              label: Text(strings.rejected),
              icon: const Icon(Icons.block),
            ),
          ],
          selected: {status},
          onSelectionChanged: (values) => onStatusChanged(values.first),
        ),
        const SizedBox(height: 12),
        for (final course in courses) _CourseApprovalCard(course: course),
        if (courses.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(strings.noCourseApprovals),
            ),
          ),
      ],
    );
  }
}

class _CourseApprovalCard extends ConsumerWidget {
  const _CourseApprovalCard({required this.course});

  final PlatformCourseModerationSummary course;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canModerate = course.status == 'pending_review';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.menu_book),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course.title,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(course.organizationName),
                    ],
                  ),
                ),
                Chip(label: Text(course.status.replaceAll('_', ' '))),
              ],
            ),
            if (_hasText(course.shortDescription)) ...[
              const SizedBox(height: 8),
              Text(course.shortDescription!),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (_hasText(course.subject))
                  Chip(label: Text(course.subject!)),
                if (_hasText(course.deliveryType))
                  Chip(label: Text(course.deliveryType!)),
                if (course.sessions != null)
                  Chip(label: Text('${course.sessions} ${strings.sessions}')),
                if (course.priceMinor != null)
                  Chip(
                    label: Text(
                      '${(course.priceMinor! / 100).toStringAsFixed(0)} '
                      '${course.currency ?? 'EGP'}',
                    ),
                  ),
              ],
            ),
            if (canModerate) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _approve(context, ref),
                      icon: const Icon(Icons.check),
                      label: Text(strings.approveAndPublish),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _reject(context, ref),
                      icon: const Icon(Icons.close),
                      label: Text(strings.rejectWithNote),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _approve(BuildContext context, WidgetRef ref) async {
    final strings = AppStrings.of(context);
    await ref.read(platformCourseModerationActionsProvider).approve(
          PlatformCourseModerationCommand(courseId: course.id),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.courseApproved)),
    );
  }

  Future<void> _reject(BuildContext context, WidgetRef ref) async {
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _RejectionSheet(course: course),
    );
    if (!context.mounted) {
      return;
    }
    if (!_hasText(note)) {
      return;
    }

    final strings = AppStrings.of(context);
    await ref.read(platformCourseModerationActionsProvider).reject(
          PlatformCourseModerationCommand(courseId: course.id, note: note),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.courseRejected)),
    );
  }
}

class _RejectionSheet extends StatefulWidget {
  const _RejectionSheet({required this.course});

  final PlatformCourseModerationSummary course;

  @override
  State<_RejectionSheet> createState() => _RejectionSheetState();
}

class _RejectionSheetState extends State<_RejectionSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.rejectWithNote,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(widget.course.title),
            const SizedBox(height: 12),
            TextField(
              controller: _controller,
              minLines: 3,
              maxLines: 5,
              decoration: InputDecoration(
                labelText: strings.moderationNote,
                border: const OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () {
                final note = _controller.text.trim();
                if (note.isEmpty) {
                  return;
                }
                Navigator.of(context).pop(note);
              },
              icon: const Icon(Icons.close),
              label: Text(strings.rejectWithNote),
            ),
          ],
        ),
      ),
    );
  }
}

class _AccessRequired extends StatelessWidget {
  const _AccessRequired({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.admin_panel_settings, size: 56),
        const SizedBox(height: 16),
        Text(
          strings.platformAccessRequired,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
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
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.cloud_off, size: 48),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: Text(strings.retry),
        ),
      ],
    );
  }
}

bool _hasPlatformRole(String? role) {
  return const <String>{
    'super_admin',
    'platform_support',
    'platform_moderator',
  }.contains(role);
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
