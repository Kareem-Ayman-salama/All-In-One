import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/platform/application/platform_promotion_moderation_controller.dart';
import 'package:ain_mobile/src/features/platform/data/platform_promotion_moderation_repository.dart';
import 'package:ain_mobile/src/features/profile/application/profile_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformPromotionApprovalsPage extends ConsumerStatefulWidget {
  const PlatformPromotionApprovalsPage({super.key});

  static const routePath = '/platform/promotion-approvals';

  @override
  ConsumerState<PlatformPromotionApprovalsPage> createState() {
    return _PlatformPromotionApprovalsPageState();
  }
}

class _PlatformPromotionApprovalsPageState
    extends ConsumerState<PlatformPromotionApprovalsPage> {
  String _status = 'pending_approval';

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final profile = ref.watch(currentUserProfileProvider);

    return Scaffold(
      appBar: AppBar(title: Text(strings.promotionApprovals)),
      body: SafeArea(
        child: profile.when(
          data: (profile) {
            if (!_hasPlatformRole(profile.user.platformRole)) {
              return _AccessRequired(strings: strings);
            }

            final promotions = ref.watch(
              platformPromotionModerationProvider(_status),
            );

            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  platformPromotionModerationProvider(_status).future,
                );
              },
              child: promotions.when(
                data: (items) => _PromotionApprovalList(
                  promotions: items,
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
                    ref.invalidate(
                      platformPromotionModerationProvider(_status),
                    );
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

class _PromotionApprovalList extends StatelessWidget {
  const _PromotionApprovalList({
    required this.promotions,
    required this.status,
    required this.onStatusChanged,
  });

  final List<PlatformPromotionModerationSummary> promotions;
  final String status;
  final ValueChanged<String> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          strings.promotionApprovals,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(strings.promotionApprovalsHint),
        const SizedBox(height: 12),
        SegmentedButton<String>(
          segments: [
            ButtonSegment<String>(
              value: 'pending_approval',
              label: Text(strings.pendingApproval),
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
        for (final promotion in promotions)
          _PromotionApprovalCard(promotion: promotion),
        if (promotions.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(strings.noPromotionApprovals),
            ),
          ),
      ],
    );
  }
}

class _PromotionApprovalCard extends ConsumerWidget {
  const _PromotionApprovalCard({required this.promotion});

  final PlatformPromotionModerationSummary promotion;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final canModerate = promotion.status == 'pending_approval';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.campaign),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        promotion.courseTitle ?? promotion.type,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(promotion.organizationName),
                    ],
                  ),
                ),
                Chip(label: Text(promotion.status.replaceAll('_', ' '))),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text(promotion.type)),
                Chip(label: Text(promotion.placement)),
                Chip(label: Text(promotion.paymentStatus)),
                if (_hasText(promotion.startDate) &&
                    _hasText(promotion.endDate))
                  Chip(
                    label: Text(
                      '${promotion.startDate} - ${promotion.endDate}',
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _MiniMetric(
                  label: strings.impressions,
                  value: promotion.impressions.toString(),
                ),
                _MiniMetric(
                  label: strings.clicks,
                  value: promotion.clicks.toString(),
                ),
                _MiniMetric(
                  label: strings.bookingConversions,
                  value: promotion.bookingConversions.toString(),
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
                      label: Text(strings.approvePromotion),
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
    await ref.read(platformPromotionModerationActionsProvider).approve(
          PlatformPromotionModerationCommand(promotionId: promotion.id),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.promotionApproved)),
    );
  }

  Future<void> _reject(BuildContext context, WidgetRef ref) async {
    final note = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _RejectionSheet(promotion: promotion),
    );
    if (!context.mounted) {
      return;
    }
    if (!_hasText(note)) {
      return;
    }

    final strings = AppStrings.of(context);
    await ref.read(platformPromotionModerationActionsProvider).reject(
          PlatformPromotionModerationCommand(
            promotionId: promotion.id,
            note: note,
          ),
        );
    if (!context.mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(strings.promotionRejected)),
    );
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: Theme.of(context).textTheme.titleMedium),
          Text(label),
        ],
      ),
    );
  }
}

class _RejectionSheet extends StatefulWidget {
  const _RejectionSheet({required this.promotion});

  final PlatformPromotionModerationSummary promotion;

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
            Text(widget.promotion.courseTitle ?? widget.promotion.type),
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
