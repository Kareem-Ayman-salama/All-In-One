import 'package:ain_mobile/src/core/deep_links/deep_link_service.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/booking_success_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_detail_page.dart';
import 'package:ain_mobile/src/features/notifications/data/notification_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _notificationInboxRoutePath = '/notifications';

final notificationTapRouterProvider = Provider<NotificationTapRouter>((ref) {
  return NotificationTapRouter(
    deepLinkService: ref.watch(deepLinkServiceProvider),
  );
});

class NotificationTapRouter {
  const NotificationTapRouter({required DeepLinkService deepLinkService})
      : _deepLinkService = deepLinkService;

  final DeepLinkService _deepLinkService;

  Future<String> resolve(AppNotification notification) async {
    final route = notification.route;
    if (_hasText(route)) {
      final resolved = await _deepLinkService.resolve(Uri.parse(route!));
      if (resolved != null) {
        return _locationForDeepLink(resolved);
      }
    }

    return _locationForTarget(notification);
  }

  String _locationForDeepLink(ResolvedDeepLink link) {
    return switch (link.mobileScreen) {
      'marketplace.courseDetails' => CourseDetailPage.location(
          link.parameters['courseSlug'] ?? link.query['courseSlug'] ?? '',
        ),
      'marketplace.booking' => CourseDetailPage.location(
          link.parameters['courseId'] ?? link.query['courseId'] ?? '',
        ),
      'student.bookingStatus' => BookingSuccessPage.location(
          bookingId: link.query['bookingId'] ?? '',
          courseTitle: link.query['courseTitle'],
          batchTitle: link.query['batchTitle'],
        ),
      'notifications.inbox' => _notificationInboxLocation(
          notificationId: link.query['notificationId'],
        ),
      'content.library' => MyCoursesPage.routePath,
      'student.lessonBookings' => MyCoursesPage.routePath,
      _ => link.requiresAuth
          ? MyCoursesPage.routePath
          : CourseCatalogPage.routePath,
    };
  }

  String _locationForTarget(AppNotification notification) {
    return switch (notification.targetType) {
      'course' => notification.targetId == null
          ? CourseCatalogPage.routePath
          : CourseDetailPage.location(notification.targetId!),
      'booking' => BookingSuccessPage.location(
          bookingId: notification.targetId ?? '',
        ),
      'content_item' => MyCoursesPage.routePath,
      'student_subscription' => MyCoursesPage.routePath,
      'announcement' => _notificationInboxLocation(
          notificationId: notification.id,
        ),
      _ => _notificationInboxLocation(notificationId: notification.id),
    };
  }
}

String _notificationInboxLocation({String? notificationId}) {
  return Uri(
    path: _notificationInboxRoutePath,
    queryParameters: <String, String>{
      if (_hasText(notificationId)) 'notificationId': notificationId!.trim(),
    },
  ).toString();
}

bool _hasText(String? value) {
  return value != null && value.trim().isNotEmpty;
}
