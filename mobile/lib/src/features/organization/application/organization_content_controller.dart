import 'package:ain_mobile/src/features/content/data/content_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationContentProvider = FutureProvider.autoDispose
    .family<List<ContentItemSummary>, String>((ref, organizationId) {
  return ref
      .watch(contentRepositoryProvider)
      .listContent(organizationId: organizationId);
});

final organizationContentActionsProvider = Provider<OrganizationContentActions>(
  OrganizationContentActions.new,
);

class OrganizationContentActions {
  const OrganizationContentActions(this._ref);

  final Ref _ref;

  Future<ContentItemSummary> createLink({
    required String organizationId,
    required CreateLinkContentCommand command,
  }) async {
    final result = await _ref.read(contentRepositoryProvider).createLinkContent(
          organizationId: organizationId,
          command: command,
        );
    _ref.invalidate(organizationContentProvider(organizationId));
    return result;
  }

  Future<void> delete({
    required String organizationId,
    required String contentId,
  }) async {
    await _ref.read(contentRepositoryProvider).deleteContent(
          organizationId: organizationId,
          contentId: contentId,
        );
    _ref.invalidate(organizationContentProvider(organizationId));
  }
}
