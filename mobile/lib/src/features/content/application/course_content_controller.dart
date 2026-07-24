import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final courseContentListProvider = FutureProvider.autoDispose
    .family<List<ContentItemSummary>, CourseContentQuery>((ref, query) {
  return ref.watch(contentRepositoryProvider).listContent(
        organizationId: query.organizationId,
        roomId: query.roomId,
      );
});

class CourseContentQuery {
  const CourseContentQuery({
    required this.organizationId,
    this.roomId,
  });

  final String organizationId;
  final String? roomId;

  @override
  bool operator ==(Object other) {
    return other is CourseContentQuery &&
        other.organizationId == organizationId &&
        other.roomId == roomId;
  }

  @override
  int get hashCode => Object.hash(organizationId, roomId);
}
