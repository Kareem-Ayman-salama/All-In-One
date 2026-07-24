import 'package:ain_mobile/src/app/localization/app_strings.dart';
import 'package:ain_mobile/src/features/notifications/application/notification_controller.dart';
import 'package:ain_mobile/src/features/notifications/application/notification_tap_router.dart';
import 'package:ain_mobile/src/features/notifications/data/notification_repository.dart';
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
                  padding: const EdgeInsets.all(24),
                  children: [
                    const Icon(Icons.notifications_none, size: 56),
                    const SizedBox(height: 12),
                    Text(
                      strings.noNotifications,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ],
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return _NotificationTile(
                    notification: item,
                    highlighted: item.id == highlightNotificationId,
                    onTap: () => _openNotification(context, ref, item),
                  );
                },
              );
            },
            error: (error, stackTrace) => ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const Icon(Icons.cloud_off, size: 48),
                const SizedBox(height: 12),
                Text(error.toString(), textAlign: TextAlign.center),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => ref.invalidate(notificationInboxProvider),
                  icon: const Icon(Icons.refresh),
                  label: Text(strings.retry),
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
    final location = await ref
        .read(notificationTapRouterProvider)
        .resolve(notification);
    if (context.mounted) {
      context.go(location);
    }
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

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: highlighted
          ? Theme.of(context).colorScheme.primaryContainer
          : null,
      child: ListTile(
        leading: Icon(
          notification.read
              ? Icons.notifications_none
              : Icons.notifications_active,
        ),
        title: Text(notification.title),
        subtitle: Text(
          [
            notification.body,
            if (notification.createdAt != null) notification.createdAt,
          ].whereType<String>().join(' - '),
        ),
        trailing: Text(
          notification.read ? strings.read : strings.unread,
          style: Theme.of(context).textTheme.labelMedium,
        ),
        onTap: onTap,
      ),
    );
  }
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
