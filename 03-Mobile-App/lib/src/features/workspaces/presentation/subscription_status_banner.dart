import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/workspaces/data/workspace_repository.dart';
import 'package:flutter/material.dart';

class SubscriptionStatusBanner extends StatelessWidget {
  const SubscriptionStatusBanner({
    required this.subscription,
    this.compact = false,
    super.key,
  });

  final WorkspaceSubscriptionSummary? subscription;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final theme = Theme.of(context);
    final subscription = this.subscription;
    final needsAttention = subscription?.needsAttention ?? true;
    final foreground = needsAttention
        ? theme.colorScheme.onErrorContainer
        : theme.colorScheme.onSecondaryContainer;
    final background = needsAttention
        ? theme.colorScheme.errorContainer
        : theme.colorScheme.secondaryContainer;
    final icon = needsAttention ? Icons.warning_amber : Icons.verified;

    return Card(
      color: background,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: foreground),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _title(strings, subscription),
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: foreground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _subtitle(strings, subscription),
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: foreground,
                    ),
                  ),
                  if (!compact && subscription != null) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(
                          avatar: const Icon(Icons.workspace_premium),
                          label: Text(subscription.plan.name),
                        ),
                        Chip(
                          avatar: const Icon(Icons.event),
                          label: Text(
                            _periodLabel(strings, subscription),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _title(
  AppStrings strings,
  WorkspaceSubscriptionSummary? subscription,
) {
  if (subscription == null) {
    return strings.noActiveSubscription;
  }

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

String _subtitle(
  AppStrings strings,
  WorkspaceSubscriptionSummary? subscription,
) {
  if (subscription == null) {
    return strings.manageSubscriptionOnWeb;
  }

  if (!subscription.isActiveLike) {
    return strings.subscriptionStatusNeedsAttention;
  }

  final days = subscription.daysRemaining;
  if (days != null && days <= 7) {
    return strings.subscriptionEndsInDays(days);
  }

  return strings.subscriptionOk;
}

String _periodLabel(
  AppStrings strings,
  WorkspaceSubscriptionSummary subscription,
) {
  final periodEnd = subscription.currentPeriodEndsAt;
  if (periodEnd == null) {
    return subscription.billingInterval;
  }

  final date = periodEnd.toIso8601String().split('T').first;
  if (subscription.isExpired) {
    return strings.subscriptionEndedOn(date);
  }

  return strings.subscriptionEndsInDays(subscription.daysRemaining ?? 0);
}
