import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/home/presentation/home_page.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/application/workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class WorkspaceSelectionPage extends ConsumerWidget {
  const WorkspaceSelectionPage({super.key});

  static const routePath = '/workspaces';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaces = ref.watch(workspaceListProvider);
    final activeWorkspace = ref.watch(activeWorkspaceControllerProvider);
    final strings = AppStrings.of(context);

    return Scaffold(
      backgroundColor: AinColors.background,
      appBar: AppBar(
        title: Text(
          strings.workspaces,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AinColors.textPrimary,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AinColors.muted),
            tooltip: strings.signOut,
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).signOut();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: SafeArea(
        child: workspaces.when(
          data: (items) => activeWorkspace.when(
            data: (_) => ListView(
              padding: const EdgeInsets.all(AinSpacing.lg),
              children: [
                if (items.isEmpty) ...[
                  // Student / Learner Card
                  Container(
                    padding: const EdgeInsets.all(AinSpacing.xl),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AinRadii.xl),
                      border: Border.all(color: AinColors.border),
                      boxShadow: AinShadows.soft,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Center(
                          child: Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: AinColors.accent.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.school,
                              size: 32,
                              color: AinColors.brand,
                            ),
                          ),
                        ),
                        const SizedBox(height: AinSpacing.lg),
                        Text(
                          strings.studentWorkspaceTitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AinColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: AinSpacing.sm),
                        Text(
                          strings.studentWorkspaceSubtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AinColors.textSecondary,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: AinSpacing.xl),
                        AinPrimaryButton(
                          label: strings.enterLearningPlatform,
                          icon: Icons.arrow_forward,
                          onPressed: () => context.go(HomePage.routePath),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  Text(
                    strings.isArabic
                        ? 'ابدأ من المساحة المناسبة'
                        : 'Choose where you want to start',
                    style: const TextStyle(
                      color: AinColors.brand,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    strings.chooseWorkspace,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AinColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AinSpacing.xs),
                  Text(
                    strings.isArabic
                        ? 'يمكنك تغيير المساحة لاحقاً من قائمة الحساب.'
                        : 'You can switch workspace later from your account menu.',
                    style: const TextStyle(
                      color: AinColors.textSecondary,
                      fontSize: 12.5,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: AinSpacing.md),
                  for (final workspace in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AinSpacing.md),
                      child: Material(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(AinRadii.lg),
                        elevation: 1,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(AinRadii.lg),
                          onTap: () => _selectWorkspace(
                            context: context,
                            ref: ref,
                            workspace: workspace,
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(AinSpacing.lg),
                            child: Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color:
                                        AinColors.brand.withValues(alpha: 0.08),
                                    borderRadius:
                                        BorderRadius.circular(AinRadii.md),
                                  ),
                                  child: const Icon(
                                    Icons.business,
                                    color: AinColors.brand,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: AinSpacing.md),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        workspace.name,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: AinColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _workspaceSubtitle(strings, workspace),
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: AinColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  color: AinColors.muted,
                                  size: 17,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  const SizedBox(height: AinSpacing.lg),
                  Center(
                    child: TextButton.icon(
                      onPressed: () => context.go(HomePage.routePath),
                      icon: const Icon(
                        Icons.person_outline,
                        size: 18,
                        color: AinColors.brand,
                      ),
                      label: Text(
                        strings.continueAsStudent,
                        style: const TextStyle(
                          color: AinColors.brand,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
            error: (_, __) => _WorkspaceErrorState(
              onRetry: () {
                ref.invalidate(activeWorkspaceControllerProvider);
              },
            ),
            loading: () => const _WorkspaceLoadingState(),
          ),
          error: (_, __) => _WorkspaceErrorState(
            onRetry: () {
              ref.invalidate(workspaceListProvider);
            },
          ),
          loading: () => const _WorkspaceLoadingState(),
        ),
      ),
    );
  }

  Future<void> _selectWorkspace({
    required BuildContext context,
    required WidgetRef ref,
    required WorkspaceSummary workspace,
  }) async {
    final selected = await ref
        .read(activeWorkspaceControllerProvider.notifier)
        .selectWorkspace(workspace);
    if (selected && context.mounted) {
      context.go(HomePage.routePath);
    }
  }
}

class _WorkspaceLoadingState extends StatelessWidget {
  const _WorkspaceLoadingState();

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return Semantics(
      label: strings.loading,
      child: ListView.separated(
        padding: const EdgeInsets.all(AinSpacing.lg),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: AinSpacing.md),
        itemBuilder: (_, __) => Container(
          height: 88,
          decoration: BoxDecoration(
            color: AinColors.surface,
            borderRadius: BorderRadius.circular(AinRadii.lg),
            border: Border.all(color: AinColors.line),
          ),
        ),
      ),
    );
  }
}

class _WorkspaceErrorState extends StatelessWidget {
  const _WorkspaceErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AinSpacing.xl),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: AinSurface(
            padding: const EdgeInsets.all(AinSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const AinIconBadge(
                  icon: Icons.cloud_off_outlined,
                  backgroundColor: AinColors.roseSoft,
                  foregroundColor: AinColors.rose,
                ),
                const SizedBox(height: AinSpacing.md),
                Text(
                  strings.isArabic
                      ? 'تعذّر تحميل مساحات العمل'
                      : 'Could not load workspaces',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AinColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: AinSpacing.xs),
                Text(
                  strings.isArabic
                      ? 'تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.'
                      : 'Check your connection and try again.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AinColors.textSecondary,
                    fontSize: 12.5,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: AinSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  child: AinPrimaryButton(
                    label: strings.isArabic ? 'إعادة المحاولة' : 'Try again',
                    icon: Icons.refresh,
                    onPressed: onRetry,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

String _workspaceSubtitle(
  AppStrings strings,
  WorkspaceSummary workspace,
) {
  final subscription = workspace.subscription;
  if (subscription == null) {
    return '${workspace.role} • ${strings.noActiveSubscription}';
  }

  return '${workspace.role} • ${subscription.plan.name} • '
      '${_subscriptionLabel(strings, subscription)}';
}

String _subscriptionLabel(
  AppStrings strings,
  WorkspaceSubscriptionSummary subscription,
) {
  if (subscription.isExpired) {
    return strings.subscriptionExpired;
  }

  return switch (subscription.status) {
    'active' => strings.activeSubscription,
    'trial' => strings.trialSubscription,
    'grace' => strings.graceSubscription,
    'past_due' => strings.subscriptionPastDue,
    _ => strings.noActiveSubscription,
  };
}
