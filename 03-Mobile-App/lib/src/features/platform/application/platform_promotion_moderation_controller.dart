import 'package:ain_mobile/src/features/platform/data/platform_promotion_moderation_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformPromotionModerationProvider = FutureProvider.autoDispose
    .family<List<PlatformPromotionModerationSummary>, String>((ref, status) {
  return ref
      .watch(platformPromotionModerationRepositoryProvider)
      .listPromotions(status: status);
});

final platformPromotionModerationActionsProvider =
    Provider<PlatformPromotionModerationActions>((ref) {
  return PlatformPromotionModerationActions(ref);
});

class PlatformPromotionModerationActions {
  const PlatformPromotionModerationActions(this._ref);

  final Ref _ref;

  Future<void> approve(PlatformPromotionModerationCommand command) async {
    await _ref
        .read(platformPromotionModerationRepositoryProvider)
        .approvePromotion(
          promotionId: command.promotionId,
          note: command.note,
        );
    _ref.invalidate(platformPromotionModerationProvider);
  }

  Future<void> reject(PlatformPromotionModerationCommand command) async {
    await _ref
        .read(platformPromotionModerationRepositoryProvider)
        .rejectPromotion(
          promotionId: command.promotionId,
          note: command.note ?? '',
        );
    _ref.invalidate(platformPromotionModerationProvider);
  }
}
