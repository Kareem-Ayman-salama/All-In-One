import 'package:ain_mobile/src/features/notifications/data/notification_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationInboxProvider =
    FutureProvider.autoDispose<List<AppNotification>>((ref) {
      return ref.watch(notificationRepositoryProvider).listNotifications();
    });
