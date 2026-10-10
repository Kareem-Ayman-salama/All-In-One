import 'package:ain_mobile/src/features/platform/data/platform_category_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformCategoriesProvider =
    FutureProvider.autoDispose<List<PlatformCategorySummary>>((ref) {
  return ref.watch(platformCategoryRepositoryProvider).listCategories();
});

final platformCategoryActionsProvider =
    Provider<PlatformCategoryActions>((ref) {
  return PlatformCategoryActions(ref);
});

class PlatformCategoryActions {
  const PlatformCategoryActions(this._ref);

  final Ref _ref;

  Future<void> create(PlatformCategoryCommand command) async {
    await _ref.read(platformCategoryRepositoryProvider).createCategory(command);
    _ref.invalidate(platformCategoriesProvider);
  }

  Future<void> update(PlatformCategoryCommand command) async {
    await _ref.read(platformCategoryRepositoryProvider).updateCategory(command);
    _ref.invalidate(platformCategoriesProvider);
  }

  Future<void> delete(String categoryId) async {
    await _ref.read(platformCategoryRepositoryProvider).deleteCategory(
          categoryId,
        );
    _ref.invalidate(platformCategoriesProvider);
  }
}
