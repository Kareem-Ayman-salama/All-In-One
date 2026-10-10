import 'package:ain_mobile/src/core/cache/offline_cache_policy.dart';
import 'package:ain_mobile/src/features/notifications/data/notification_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationInboxProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) {
  return ref.watch(notificationRepositoryProvider).listNotifications();
});

final notificationPreferencesProvider = FutureProvider.autoDispose
    .family<NotificationPreferences, String?>((ref, organizationId) {
  return ref.watch(notificationRepositoryProvider).getPreferences(
        organizationId: organizationId,
      );
});

final notificationCacheStatusProvider =
    FutureProvider.autoDispose<NotificationCacheStatus>((ref) async {
  final policy = await ref.watch(offlineCachePolicyProvider.future);
  final inboxPolicy = policy.datasets['notifications.inbox'];
  final markReadPolicy = policy.writeOperations['notifications.mark_read'];

  return NotificationCacheStatus(
    ttlSeconds: inboxPolicy?.ttlSeconds ?? 0,
    storage: inboxPolicy?.storage ?? 'memory_only',
    staleWhileRevalidate: inboxPolicy?.staleWhileRevalidate ?? false,
    offlineReadable: inboxPolicy?.offlineReadable ?? false,
    cacheFallbackEnabled: inboxPolicy?.offlineReadable == true,
    markReadIsOptimistic: markReadPolicy?.requiresServerConfirmation == false &&
        markReadPolicy?.offlineBehavior == 'optimistic_reversible',
  );
});

class NotificationCacheStatus {
  const NotificationCacheStatus({
    required this.ttlSeconds,
    required this.storage,
    required this.staleWhileRevalidate,
    required this.offlineReadable,
    required this.cacheFallbackEnabled,
    required this.markReadIsOptimistic,
  });

  final int ttlSeconds;
  final String storage;
  final bool staleWhileRevalidate;
  final bool offlineReadable;
  final bool cacheFallbackEnabled;
  final bool markReadIsOptimistic;

  int get ttlMinutes => (ttlSeconds / 60).round();
}

final notificationPreferenceActionsProvider =
    Provider<NotificationPreferenceActions>((ref) {
  return NotificationPreferenceActions(ref);
});

class NotificationPreferenceActions {
  const NotificationPreferenceActions(this._ref);

  final Ref _ref;

  Future<NotificationPreferences> update({
    required UpdateNotificationPreferencesCommand command,
  }) async {
    final preferences =
        await _ref.read(notificationRepositoryProvider).updatePreferences(
              command: command,
            );
    _ref.invalidate(
      notificationPreferencesProvider(command.organizationId),
    );

    return preferences;
  }
}
