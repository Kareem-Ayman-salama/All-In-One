import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/notifications/application/notification_controller.dart';
import 'package:ain_mobile/src/features/notifications/application/notification_tap_router.dart';
import 'package:ain_mobile/src/features/notifications/data/notification_repository.dart';
import 'package:ain_mobile/src/shared/presentation/ui/ain_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class NotificationInboxPage extends ConsumerWidget {
  const NotificationInboxPage({this.highlightNotificationId, super.key});

  static const routePath = '/notifications';

  final String? highlightNotificationId;

  static String location({String? notificationId}) {
    return Uri(
      path: routePath,
      queryParameters: <String, String>{
        if (_hasText(notificationId)) 'notificationId': notificationId!.trim(),
      },
    ).toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppStrings.of(context);
    final notifications = ref.watch(notificationInboxProvider);
    final cacheStatus = ref.watch(notificationCacheStatusProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(strings.notifications),
        actions: [
          IconButton(
            tooltip: strings.markAllRead,
            onPressed: () => _markAllRead(ref),
            icon: const Icon(Icons.done_all),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(notificationInboxProvider.future),
          child: notifications.when(
            data: (items) {
              if (items.isEmpty) {
                return ListView(
                  padding: const EdgeInsets.all(AinSpacing.lg),
                  children: [
                    _NotificationCacheBanner(cacheStatus: cacheStatus),
                    const SizedBox(height: AinSpacing.lg),
                    AinEmptyState(
                      icon: Icons.notifications_none,
                      title: strings.noNotifications,
                    ),
                  ],
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(AinSpacing.lg),
                itemCount: items.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _NotificationCacheBanner(
                        cacheStatus: cacheStatus,
                      ),
                    );
                  }
                  final item = items[index - 1];
                  return _NotificationTile(
                    notification: item,
                    highlighted: item.id == highlightNotificationId,
                    onTap: () => _openNotification(context, ref, item),
                  );
                },
              );
            },
            error: (error, stackTrace) => ListView(
              padding: const EdgeInsets.all(AinSpacing.lg),
              children: [
                AinEmptyState(
                  icon: Icons.cloud_off_outlined,
                  title: strings.retry,
                  subtitle: error.toString(),
                  action: FilledButton.icon(
                    onPressed: () => ref.invalidate(notificationInboxProvider),
                    icon: const Icon(Icons.refresh),
                    label: Text(strings.retry),
                  ),
                ),
              ],
            ),
            loading: () => Center(
              child: Semantics(
                label: strings.loading,
                child: const CircularProgressIndicator(),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _markAllRead(WidgetRef ref) async {
    await ref.read(notificationRepositoryProvider).markAllRead();
    ref.invalidate(notificationInboxProvider);
  }

  Future<void> _openNotification(
    BuildContext context,
    WidgetRef ref,
    AppNotification notification,
  ) async {
    if (!notification.read) {
      await ref.read(notificationRepositoryProvider).markRead(notification.id);
      ref.invalidate(notificationInboxProvider);
    }
    final location =
        await ref.read(notificationTapRouterProvider).resolve(notification);
    if (context.mounted) {
      context.go(location);
    }
  }
}

class _NotificationCacheBanner extends StatelessWidget {
  const _NotificationCacheBanner({required this.cacheStatus});

  final AsyncValue<NotificationCacheStatus> cacheStatus;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return AinSurface(
      color: AinColors.brandSoft,
      borderColor: const Color(0xFFD9DCFA),
      child: cacheStatus.when(
        data: (status) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const AinIconBadge(icon: Icons.offline_pin_outlined),
                const SizedBox(width: AinSpacing.md),
                Expanded(
                  child: Text(
                    strings.notificationOfflineStatus,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AinSpacing.md),
            Text(
              strings.notificationOfflineStatusHint(
                status.ttlMinutes,
                status.storage,
              ),
            ),
            const SizedBox(height: AinSpacing.md),
            Wrap(
              spacing: AinSpacing.sm,
              runSpacing: AinSpacing.sm,
              children: [
                if (status.offlineReadable)
                  AinStatusPill(
                    icon: Icons.wifi_off_outlined,
                    label: strings.offlineReadable,
                  ),
                if (status.cacheFallbackEnabled)
                  AinStatusPill(
                    icon: Icons.cached_outlined,
                    label: strings.cacheFallbackEnabled,
                    color: AinColors.teal,
                    backgroundColor: AinColors.tealSoft,
                  ),
                if (status.staleWhileRevalidate)
                  AinStatusPill(
                    icon: Icons.sync_outlined,
                    label: strings.staleWhileRevalidate,
                  ),
                if (status.markReadIsOptimistic)
                  AinStatusPill(
                    icon: Icons.done_all_outlined,
                    label: strings.optimisticReadState,
                    color: AinColors.success,
                    backgroundColor: AinColors.successSoft,
                  ),
              ],
            ),
          ],
        ),
        error: (error, stackTrace) => Row(
          children: [
            const Icon(Icons.cloud_off),
            const SizedBox(width: AinSpacing.sm),
            Expanded(child: Text(strings.offlinePolicyUnavailable)),
          ],
        ),
        loading: () => Row(
          children: [
            const SizedBox.square(
              dimension: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: AinSpacing.sm),
            Text(strings.notificationOfflineStatus),
          ],
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.highlighted,
    required this.onTap,
  });

  final AppNotification notification;
  final bool highlighted;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: AinSpacing.md),
      child: InkWell(
        borderRadius: BorderRadius.circular(AinRadii.lg),
        onTap: onTap,
        child: AinSurface(
          color: highlighted ? AinColors.brandSoft : AinColors.surface,
          borderColor: highlighted ? AinColors.brand : AinColors.line,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AinIconBadge(
                icon: notification.read
                    ? Icons.notifications_none
                    : Icons.notifications_active_outlined,
                backgroundColor:
                    notification.read ? AinColors.canvas : AinColors.brandSoft,
                foregroundColor:
                    notification.read ? AinColors.muted : AinColors.brand,
              ),
              const SizedBox(width: AinSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: AinSpacing.xs),
                    Text(
                      [
                        notification.body,
                        if (notification.createdAt != null)
                          notification.createdAt,
                      ].whereType<String>().join(' - '),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AinColors.muted,
                            height: 1.3,
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AinSpacing.sm),
              AinStatusPill(
                icon: notification.read
                    ? Icons.mark_email_read_outlined
                    : Icons.mark_email_unread_outlined,
                label: notification.read ? strings.read : strings.unread,
                color: notification.read ? AinColors.muted : AinColors.brand,
                backgroundColor:
                    notification.read ? AinColors.canvas : AinColors.brandSoft,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
