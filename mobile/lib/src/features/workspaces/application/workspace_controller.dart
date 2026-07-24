import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final workspaceListProvider = FutureProvider<List<WorkspaceSummary>>((ref) {
  return ref.watch(workspaceRepositoryProvider).listWorkspaces();
});
