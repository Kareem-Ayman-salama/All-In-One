import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/organization/application/organization_course_controller.dart';
import 'package:ain_mobile/src/features/organization/application/organization_promotion_controller.dart';
import 'package:ain_mobile/src/features/organization/data/organization_promotion_repository.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class OrganizationPromotionsPage extends ConsumerWidget {
  const OrganizationPromotionsPage({super.key});

  static const routePath = '/organization/promotions';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspaceState = ref.watch(activeWorkspaceControllerProvider);
    final workspace = workspaceState.valueOrNull;
    final canManage = workspace?.canUseFeature(
          requiredPermissions: {'promotions.manage'},
          requiredModule: 'promotions',
        ) ??
        false;

    return Scaffold(
      appBar: AppBar(title: Text(strings.organizationPromotions)),
      floatingActionButton: !canManage
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _showCreateSheet(
                context,
                workspace!.organizationId,
              ),
              icon: const Icon(Icons.campaign),
              label: Text(strings.createPromotion),
            ),
      body: SafeArea(
        child: workspaceState.when(
          data: (workspace) {
            if (workspace == null) {
              return _NoWorkspace(strings: strings);
            }

            final promotions = ref.watch(
              organizationPromotionsProvider(workspace.organizationId),
            );
            return RefreshIndicator(
              onRefresh: () {
                return ref.refresh(
                  organizationPromotionsProvider(
                    workspace.organizationId,
                  ).future,
                );
              },
              child: promotions.when(
                data: (items) => _PromotionsBody(promotions: items),
                error: (error, stackTrace) => _ErrorList(
                  message: error.toString(),
                  onRetry: () {
                    ref.invalidate(
                      organizationPromotionsProvider(workspace.organizationId),
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
            onRetry: () => ref.invalidate(activeWorkspaceControllerProvider),
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

  Future<void> _showCreateSheet(
    BuildContext context,
    String organizationId,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _CreatePromotionSheet(
        organizationId: organizationId,
      ),
    );
  }
}

class _PromotionsBody extends StatelessWidget {
  const _PromotionsBody({required this.promotions});

  final List<OrganizationPromotionSummary> promotions;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final pendingCount = promotions
        .where((promotion) => promotion.status == 'pending_approval')
        .length;
    final approvedCount =
        promotions.where((promotion) => promotion.status == 'approved').length;

    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        _PromotionsHero(
          title: strings.organizationPromotions,
          subtitle: strings.organizationPromotionsHint,
          pendingCount: pendingCount,
          approvedCount: approvedCount,
        ),
        const SizedBox(height: AinSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AinMetricCard(
                icon: Icons.hourglass_top,
                label: strings.pendingPromotions,
                value: pendingCount.toString(),
                color: AinColors.warning,
                backgroundColor: AinColors.warningSoft,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AinMetricCard(
                icon: Icons.verified,
                label: strings.approvedPromotions,
                value: approvedCount.toString(),
                color: AinColors.success,
                backgroundColor: AinColors.successSoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: AinSpacing.xl),
        AinSectionHeader(title: strings.organizationPromotions),
        const SizedBox(height: AinSpacing.md),
        if (promotions.isEmpty)
          AinEmptyState(
            icon: Icons.campaign_outlined,
            title: strings.noPromotionsYet,
          )
        else
          for (final promotion in promotions)
            _PromotionCard(promotion: promotion),
      ],
    );
  }
}

class _PromotionsHero extends StatelessWidget {
  const _PromotionsHero({
    required this.title,
    required this.subtitle,
    required this.pendingCount,
    required this.approvedCount,
  });

  final String title;
  final String subtitle;
  final int pendingCount;
  final int approvedCount;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AinColors.brand, AinColors.brandDark],
        ),
        borderRadius: BorderRadius.circular(AinRadii.lg),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AinIconBadge(
              icon: Icons.campaign_outlined,
              backgroundColor: Color(0x29FFFFFF),
              foregroundColor: Colors.white,
            ),
            const SizedBox(height: AinSpacing.lg),
            Text(
              title,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: AinSpacing.sm),
            Text(
              subtitle,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: 0.86),
                height: 1.35,
              ),
            ),
            const SizedBox(height: AinSpacing.lg),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.hourglass_top,
                  label: pendingCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
                AinStatusPill(
                  icon: Icons.verified_outlined,
                  label: approvedCount.toString(),
                  color: Colors.white,
                  backgroundColor: Colors.white.withValues(alpha: 0.16),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PromotionCard extends StatelessWidget {
  const _PromotionCard({required this.promotion});

  final OrganizationPromotionSummary promotion;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final course = promotion.course;

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: AinSurface(
        padding: const EdgeInsets.all(AinSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AinIconBadge(
                  icon: Icons.campaign_outlined,
                  backgroundColor: _promotionStatusBackground(promotion.status),
                  foregroundColor: _promotionStatusColor(promotion.status),
                ),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        course?.localizedTitle(strings.isArabic) ??
                            strings.promotionTypeLabel(promotion.type),
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AinSpacing.xs),
                      Text(
                        [
                          strings.promotionTypeLabel(promotion.type),
                          strings.promotionPlacementLabel(promotion.placement),
                        ].join(' - '),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AinColors.muted,
                            ),
                      ),
                    ],
                  ),
                ),
                AinStatusPill(
                  icon: Icons.flag_outlined,
                  label: strings.promotionStatus(promotion.status),
                  color: _promotionStatusColor(promotion.status),
                  backgroundColor: _promotionStatusBackground(promotion.status),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                AinStatusPill(
                  icon: Icons.visibility_outlined,
                  label: '${promotion.impressions} impressions',
                ),
                AinStatusPill(
                  icon: Icons.touch_app_outlined,
                  label: '${promotion.clicks} clicks',
                  color: AinColors.cyan,
                  backgroundColor: AinColors.cyanSoft,
                ),
                AinStatusPill(
                  icon: Icons.event_seat_outlined,
                  label: '${promotion.bookingConversions} bookings',
                  color: AinColors.teal,
                  backgroundColor: AinColors.tealSoft,
                ),
                AinStatusPill(
                  icon: Icons.payments_outlined,
                  label: promotion.paymentStatus,
                ),
              ],
            ),
            if (promotion.startDate != null || promotion.endDate != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${promotion.startDate ?? ''} - ${promotion.endDate ?? ''}',
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CreatePromotionSheet extends ConsumerStatefulWidget {
  const _CreatePromotionSheet({required this.organizationId});

  final String organizationId;

  @override
  ConsumerState<_CreatePromotionSheet> createState() {
    return _CreatePromotionSheetState();
  }
}

class _CreatePromotionSheetState extends ConsumerState<_CreatePromotionSheet> {
  final _formKey = GlobalKey<FormState>();
  final _destinationController = TextEditingController();
  String? _courseId;
  String _type = 'featured_course';
  String _placement = 'homepage';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _submitting = false;

  @override
  void dispose() {
    _destinationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final courses = ref.watch(
      organizationCoursesOverviewProvider(widget.organizationId),
    );

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 24, 24, bottomInset + 24),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                strings.createPromotion,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              courses.when(
                data: (overview) {
                  final published = overview.courses
                      .where((course) => course.status == 'published')
                      .toList(growable: false);
                  _courseId ??= published.isEmpty ? null : published.first.id;

                  return DropdownButtonFormField<String>(
                    initialValue: _courseId,
                    decoration: InputDecoration(
                      labelText: strings.course,
                      border: const OutlineInputBorder(),
                    ),
                    items: [
                      for (final course in published)
                        DropdownMenuItem(
                          value: course.id,
                          child: Text(course.title),
                        ),
                    ],
                    onChanged: (value) => setState(() => _courseId = value),
                  );
                },
                error: (error, stackTrace) => Text(error.toString()),
                loading: () => const LinearProgressIndicator(),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: InputDecoration(
                  labelText: strings.promotionType,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  for (final type in _promotionTypes)
                    DropdownMenuItem(
                      value: type,
                      child: Text(strings.promotionTypeLabel(type)),
                    ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _type = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _placement,
                decoration: InputDecoration(
                  labelText: strings.promotionPlacement,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  for (final placement in _promotionPlacements)
                    DropdownMenuItem(
                      value: placement,
                      child: Text(strings.promotionPlacementLabel(placement)),
                    ),
                ],
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _placement = value);
                  }
                },
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _pickDate(isStart: true),
                icon: const Icon(Icons.calendar_today),
                label: Text(_dateText(_startDate, strings.startDate)),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _pickDate(isStart: false),
                icon: const Icon(Icons.calendar_today),
                label: Text(_dateText(_endDate, strings.endDate)),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _destinationController,
                decoration: InputDecoration(
                  labelText: strings.destinationUrl,
                  border: const OutlineInputBorder(),
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send),
                label: Text(strings.submitForReview),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart
        ? (_startDate ?? DateTime.now())
        : (_endDate ?? _startDate ?? DateTime.now());
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null) {
      return;
    }
    setState(() {
      if (isStart) {
        _startDate = date;
        _endDate ??= date.add(const Duration(days: 7));
      } else {
        _endDate = date;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() ||
        _startDate == null ||
        _endDate == null) {
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(organizationPromotionActionsProvider).create(
            organizationId: widget.organizationId,
            command: CreateOrganizationPromotionCommand(
              courseId: _courseId,
              type: _type,
              placement: _placement,
              startDate: _dateText(_startDate, ''),
              endDate: _dateText(_endDate, ''),
              destinationUrl: _destinationController.text,
            ),
          );
      if (mounted) {
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _NoWorkspace extends StatelessWidget {
  const _NoWorkspace({required this.strings});

  final AppStrings strings;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.business_outlined,
          title: strings.chooseWorkspace,
          action: AinPrimaryButton(
            onPressed: () => context.go(WorkspaceSelectionPage.routePath),
            label: strings.chooseWorkspace,
            icon: Icons.business_center_outlined,
          ),
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
      padding: const EdgeInsets.all(AinSpacing.lg),
      children: [
        AinEmptyState(
          icon: Icons.cloud_off_outlined,
          title: message,
          action: AinPrimaryButton(
            onPressed: onRetry,
            icon: Icons.refresh,
            label: strings.retry,
          ),
        ),
      ],
    );
  }
}

Color _promotionStatusColor(String status) {
  return switch (status) {
    'approved' => AinColors.success,
    'pending_approval' || 'pending' => AinColors.warning,
    'rejected' || 'cancelled' || 'canceled' => AinColors.rose,
    _ => AinColors.brand,
  };
}

Color _promotionStatusBackground(String status) {
  return switch (status) {
    'approved' => AinColors.successSoft,
    'pending_approval' || 'pending' => AinColors.warningSoft,
    'rejected' || 'cancelled' || 'canceled' => AinColors.roseSoft,
    _ => AinColors.brandSoft,
  };
}

String _dateText(DateTime? date, String fallback) {
  if (date == null) {
    return fallback;
  }

  return date.toIso8601String().split('T').first;
}

const _promotionTypes = <String>[
  'featured_course',
  'featured_academy',
  'homepage_banner',
  'category_banner',
  'search_boost',
];

const _promotionPlacements = <String>[
  'homepage',
  'courses',
  'academies',
  'category',
  'search',
];
