import 'package:ain_mobile/src/features/organization/data/organization_promotion_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final organizationPromotionsProvider = FutureProvider.autoDispose
    .family<List<OrganizationPromotionSummary>, String>((ref, organizationId) {
  return ref
      .watch(organizationPromotionRepositoryProvider)
      .listPromotions(organizationId: organizationId);
});

final organizationPromotionActionsProvider =
    Provider<OrganizationPromotionActions>(OrganizationPromotionActions.new);

class OrganizationPromotionActions {
  const OrganizationPromotionActions(this._ref);

  final Ref _ref;

  Future<OrganizationPromotionSummary> create({
    required String organizationId,
    required CreateOrganizationPromotionCommand command,
  }) async {
    final result = await _ref
        .read(organizationPromotionRepositoryProvider)
        .createPromotion(organizationId: organizationId, command: command);
    _ref.invalidate(organizationPromotionsProvider(organizationId));

    return result;
  }
}
