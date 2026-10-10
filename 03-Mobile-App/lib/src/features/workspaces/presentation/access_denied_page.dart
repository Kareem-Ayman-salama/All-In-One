import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/home/presentation/home_page.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/subscription_status_banner.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AccessDeniedPage extends ConsumerWidget {
  const AccessDeniedPage({required this.reason, super.key});

  static const routePath = '/access-denied';

  final String reason;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final workspace = ref.watch(activeWorkspaceControllerProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(title: Text(strings.accessUnavailable)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Icon(
              Icons.lock_outline,
              size: 56,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              strings.accessUnavailable,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _message(strings, reason),
              textAlign: TextAlign.center,
            ),
            if (workspace?.subscription != null) ...[
              const SizedBox(height: 16),
              SubscriptionStatusBanner(
                subscription: workspace?.subscription,
                compact: true,
              ),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.go(HomePage.routePath),
              icon: const Icon(Icons.home),
              label: Text(strings.backToHome),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => context.go(WorkspaceSelectionPage.routePath),
              icon: const Icon(Icons.swap_horiz),
              label: Text(strings.chooseAnotherWorkspace),
            ),
          ],
        ),
      ),
    );
  }
}

String _message(AppStrings strings, String reason) {
  return switch (reason) {
    'module' => strings.moduleUnavailable,
    'permission' => strings.permissionUnavailable,
    _ => strings.subscriptionStatusNeedsAttention,
  };
}
