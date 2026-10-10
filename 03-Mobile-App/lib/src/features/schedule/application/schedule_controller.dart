import 'package:ain_mobile/src/features/learning/application/student_learning_controller.dart';
import 'package:ain_mobile/src/features/learning/data/student_learning_repository.dart';
import 'package:ain_mobile/src/features/organization/application/organization_event_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_event_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final mobileScheduleProvider =
    FutureProvider.autoDispose<MobileScheduleOverview>((ref) async {
  final learning = await ref.watch(studentLearningOverviewProvider.future);
  final workspace = await ref.watch(activeWorkspaceControllerProvider.future);
  final organizationEvents = workspace == null
      ? const <OrganizationEventSummary>[]
      : await ref.watch(
          organizationEventsProvider(
            OrganizationEventsRequest(organizationId: workspace.organizationId),
          ).future,
        );

  return MobileScheduleOverview.fromSources(
    learning: learning,
    organizationEvents: organizationEvents,
  );
});

class MobileScheduleOverview {
  const MobileScheduleOverview({
    required this.studentItems,
    required this.organizationItems,
  });

  factory MobileScheduleOverview.fromSources({
    required StudentLearningOverview learning,
    required List<OrganizationEventSummary> organizationEvents,
  }) {
    final studentItems = learning.enrollments
        .where((enrollment) => enrollment.isActive)
        .map(ScheduleItem.fromEnrollment)
        .where((item) => item.hasTiming)
        .toList(growable: false);
    final eventItems = organizationEvents
        .where((event) => event.isScheduled)
        .map(ScheduleItem.fromOrganizationEvent)
        .toList(growable: false);

    return MobileScheduleOverview(
      studentItems: _sortItems(studentItems),
      organizationItems: _sortItems(eventItems),
    );
  }

  final List<ScheduleItem> studentItems;
  final List<ScheduleItem> organizationItems;

  bool get isEmpty => studentItems.isEmpty && organizationItems.isEmpty;
}

class ScheduleItem {
  const ScheduleItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.sourceLabel,
    required this.kind,
    this.startsAt,
    this.endsAt,
  });

  factory ScheduleItem.fromEnrollment(StudentEnrollmentSummary enrollment) {
    final course = enrollment.course;
    final batch = enrollment.batch;
    final title = course?.title ?? batch?.title ?? enrollment.id;
    final subtitleParts = <String>[
      if (batch != null && batch.title.isNotEmpty) batch.title,
      if (batch?.schedule != null) batch!.schedule!,
      if (batch?.room != null) batch!.room!.name,
    ];

    return ScheduleItem(
      id: enrollment.id,
      title: title,
      subtitle: subtitleParts.join(' - '),
      sourceLabel: course?.academy?.name ?? '',
      kind: ScheduleItemKind.studentCourse,
      startsAt: batch?.startDate ?? enrollment.accessStartsAt,
      endsAt: enrollment.accessEndsAt,
    );
  }

  factory ScheduleItem.fromOrganizationEvent(OrganizationEventSummary event) {
    final subtitleParts = <String>[
      event.type,
      if (event.location != null) event.location!,
      if (event.meetingProvider != null) event.meetingProvider!,
    ];

    return ScheduleItem(
      id: event.id,
      title: event.title,
      subtitle: subtitleParts.join(' - '),
      sourceLabel: event.status,
      kind: ScheduleItemKind.organizationEvent,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    );
  }

  final String id;
  final String title;
  final String subtitle;
  final String sourceLabel;
  final ScheduleItemKind kind;
  final String? startsAt;
  final String? endsAt;

  bool get hasTiming {
    return (startsAt != null && startsAt!.trim().isNotEmpty) ||
        subtitle.trim().isNotEmpty;
  }
}

enum ScheduleItemKind { studentCourse, organizationEvent }

List<ScheduleItem> _sortItems(List<ScheduleItem> items) {
  final sorted = [...items];
  sorted.sort((left, right) {
    final leftDate = DateTime.tryParse(left.startsAt ?? '');
    final rightDate = DateTime.tryParse(right.startsAt ?? '');
    if (leftDate == null && rightDate == null) {
      return left.title.compareTo(right.title);
    }
    if (leftDate == null) {
      return 1;
    }
    if (rightDate == null) {
      return -1;
    }
    return leftDate.compareTo(rightDate);
  });

  return sorted;
}
