import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/presentation/auth_flow_pages.dart';
import 'package:ain_mobile/src/features/auth/presentation/login_page.dart';
import 'package:ain_mobile/src/features/home/presentation/home_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/attendance_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/course_workspace_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/lesson_bookings_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/booking_success_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_detail_page.dart';
import 'package:ain_mobile/src/features/notifications/presentation/notification_inbox_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_analytics_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_announcements_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_attendance_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_bookings_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_content_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_courses_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_events_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_instructors_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_invitations_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_members_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_overview_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_profile_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_promotions_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_rooms_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_tasks_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_academy_approvals_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_categories_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_course_approvals_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_overview_page.dart';
import 'package:ain_mobile/src/features/platform/presentation/platform_promotion_approvals_page.dart';
import 'package:ain_mobile/src/features/profile/presentation/profile_page.dart';
import 'package:ain_mobile/src/features/schedule/presentation/schedule_page.dart';
import 'package:ain_mobile/src/features/splash/presentation/splash_page.dart';
import 'package:ain_mobile/src/features/workspaces/application/active_workspace_controller.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/access_denied_page.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(Ref ref) {
    ref.listen<AuthState>(
      authControllerProvider,
      (_, __) => notifyListeners(),
    );
  }
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final refreshNotifier = _RouterRefreshNotifier(ref);
  ref.onDispose(refreshNotifier.dispose);

  return GoRouter(
    initialLocation: SplashPage.routePath,
    refreshListenable: refreshNotifier,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isAuthRoute = <String>{
        LoginPage.routePath,
        RegisterPage.routePath,
        VerifyEmailPage.routePath,
        ForgotPasswordPage.routePath,
        ResetPasswordPage.routePath,
      }.contains(state.matchedLocation);
      final isPublicRoute = state.uri.path == CourseCatalogPage.routePath ||
          state.uri.path.startsWith('/explore/course/') ||
          state.uri.path.startsWith('/invite/') ||
          state.uri.path == BookingSuccessPage.routePath;

      if (authState.isRestoring) {
        return state.matchedLocation == SplashPage.routePath
            ? null
            : SplashPage.routePath;
      }

      if (!authState.isAuthenticated && !isAuthRoute && !isPublicRoute) {
        return LoginPage.routePath;
      }

      if (authState.isAuthenticated && isAuthRoute) {
        return WorkspaceSelectionPage.routePath;
      }

      final requiredPermissions =
          _organizationRoutePermissions[state.matchedLocation];
      if (requiredPermissions != null) {
        final requiredModule = _organizationRouteModules[state.matchedLocation];
        final workspaceState = ref.read(activeWorkspaceControllerProvider);
        if (workspaceState.isLoading) {
          return null;
        }
        final workspace = workspaceState.valueOrNull;
        if (workspace == null) {
          return WorkspaceSelectionPage.routePath;
        }
        if (!workspace.canUseFeature(
          requiredPermissions: requiredPermissions,
          requiredModule: requiredModule,
        )) {
          final reason = requiredModule != null &&
                  !workspace.hasEnabledModule(requiredModule)
              ? 'module'
              : 'permission';

          return Uri(
            path: AccessDeniedPage.routePath,
            queryParameters: <String, String>{
              'reason': reason,
              'from': state.uri.path,
            },
          ).toString();
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: SplashPage.routePath,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: LoginPage.routePath,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: RegisterPage.routePath,
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: VerifyEmailPage.routePath,
        builder: (context, state) => VerifyEmailPage(
          initialEmail: state.uri.queryParameters['email'] ?? '',
          initialDebugCode: state.uri.queryParameters['debugCode'],
        ),
      ),
      GoRoute(
        path: ForgotPasswordPage.routePath,
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: ResetPasswordPage.routePath,
        builder: (context, state) => ResetPasswordPage(
          initialEmail: state.uri.queryParameters['email'] ?? '',
          initialDebugCode: state.uri.queryParameters['debugCode'],
        ),
      ),
      GoRoute(
        path: InvitationPage.routePath,
        builder: (context, state) =>
            InvitationPage(token: state.pathParameters['token'] ?? ''),
      ),
      GoRoute(
        path: WorkspaceSelectionPage.routePath,
        builder: (context, state) => const WorkspaceSelectionPage(),
      ),
      GoRoute(
        path: AccessDeniedPage.routePath,
        builder: (context, state) => AccessDeniedPage(
          reason: state.uri.queryParameters['reason'] ?? 'unknown',
        ),
      ),
      GoRoute(
        path: HomePage.routePath,
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: CourseCatalogPage.routePath,
        builder: (context, state) => const CourseCatalogPage(),
      ),
      GoRoute(
        path: CourseDetailPage.routePath,
        builder: (context, state) => CourseDetailPage(
          courseSlug: state.pathParameters['courseSlug'] ?? '',
        ),
      ),
      GoRoute(
        path: BookingSuccessPage.routePath,
        builder: (context, state) => BookingSuccessPage(
          bookingId: state.uri.queryParameters['bookingId'] ?? '',
          courseTitle: state.uri.queryParameters['course'],
          batchTitle: state.uri.queryParameters['batch'],
          paymentUrl: state.uri.queryParameters['paymentUrl'],
          status: state.uri.queryParameters['status'],
        ),
      ),
      GoRoute(
        path: MyCoursesPage.routePath,
        builder: (context, state) => const MyCoursesPage(),
      ),
      GoRoute(
        path: LessonBookingsPage.routePath,
        builder: (context, state) => const LessonBookingsPage(),
      ),
      GoRoute(
        path: AttendancePage.routePath,
        builder: (context, state) => const AttendancePage(),
      ),
      GoRoute(
        path: NotificationInboxPage.routePath,
        builder: (context, state) => NotificationInboxPage(
          highlightNotificationId: state.uri.queryParameters['notificationId'],
        ),
      ),
      GoRoute(
        path: OrganizationOverviewPage.routePath,
        builder: (context, state) => const OrganizationOverviewPage(),
      ),
      GoRoute(
        path: OrganizationAnnouncementsPage.routePath,
        builder: (context, state) => const OrganizationAnnouncementsPage(),
      ),
      GoRoute(
        path: OrganizationAnalyticsPage.routePath,
        builder: (context, state) => const OrganizationAnalyticsPage(),
      ),
      GoRoute(
        path: OrganizationAttendancePage.routePath,
        builder: (context, state) => const OrganizationAttendancePage(),
      ),
      GoRoute(
        path: OrganizationBookingsPage.routePath,
        builder: (context, state) => const OrganizationBookingsPage(),
      ),
      GoRoute(
        path: OrganizationContentPage.routePath,
        builder: (context, state) => const OrganizationContentPage(),
      ),
      GoRoute(
        path: OrganizationCoursesPage.routePath,
        builder: (context, state) => const OrganizationCoursesPage(),
      ),
      GoRoute(
        path: OrganizationEventsPage.routePath,
        builder: (context, state) => const OrganizationEventsPage(),
      ),
      GoRoute(
        path: OrganizationInvitationsPage.routePath,
        builder: (context, state) => const OrganizationInvitationsPage(),
      ),
      GoRoute(
        path: OrganizationInstructorsPage.routePath,
        builder: (context, state) => const OrganizationInstructorsPage(),
      ),
      GoRoute(
        path: OrganizationMembersPage.routePath,
        builder: (context, state) => const OrganizationMembersPage(),
      ),
      GoRoute(
        path: OrganizationProfilePage.routePath,
        builder: (context, state) => const OrganizationProfilePage(),
      ),
      GoRoute(
        path: OrganizationPromotionsPage.routePath,
        builder: (context, state) => const OrganizationPromotionsPage(),
      ),
      GoRoute(
        path: OrganizationRoomsPage.routePath,
        builder: (context, state) => const OrganizationRoomsPage(),
      ),
      GoRoute(
        path: OrganizationTasksPage.routePath,
        builder: (context, state) => const OrganizationTasksPage(),
      ),
      GoRoute(
        path: CourseWorkspacePage.routePath,
        builder: (context, state) => CourseWorkspacePage(
          enrollmentId: state.pathParameters['enrollmentId'] ?? '',
        ),
      ),
      GoRoute(
        path: SchedulePage.routePath,
        builder: (context, state) => const SchedulePage(),
      ),
      GoRoute(
        path: ProfilePage.routePath,
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: PlatformOverviewPage.routePath,
        builder: (context, state) => const PlatformOverviewPage(),
      ),
      GoRoute(
        path: PlatformAcademyApprovalsPage.routePath,
        builder: (context, state) => const PlatformAcademyApprovalsPage(),
      ),
      GoRoute(
        path: PlatformCategoriesPage.routePath,
        builder: (context, state) => const PlatformCategoriesPage(),
      ),
      GoRoute(
        path: PlatformCourseApprovalsPage.routePath,
        builder: (context, state) => const PlatformCourseApprovalsPage(),
      ),
      GoRoute(
        path: PlatformPromotionApprovalsPage.routePath,
        builder: (context, state) => const PlatformPromotionApprovalsPage(),
      ),
    ],
  );
});

const _organizationRoutePermissions = <String, Set<String>>{
  OrganizationOverviewPage.routePath: {'organization.view'},
  OrganizationProfilePage.routePath: {'organization.update'},
  OrganizationPromotionsPage.routePath: {'promotions.view'},
  OrganizationAnnouncementsPage.routePath: {'announcements.view'},
  OrganizationAnalyticsPage.routePath: {'analytics.view'},
  OrganizationAttendancePage.routePath: {'attendance.view'},
  OrganizationBookingsPage.routePath: {'bookings.view'},
  OrganizationContentPage.routePath: {'content.view'},
  OrganizationCoursesPage.routePath: {'courses.view'},
  OrganizationEventsPage.routePath: {'events.view'},
  OrganizationInvitationsPage.routePath: {'members.view', 'members.invite'},
  OrganizationInstructorsPage.routePath: {'courses.view'},
  OrganizationMembersPage.routePath: {'members.view'},
  OrganizationRoomsPage.routePath: {'rooms.view'},
  OrganizationTasksPage.routePath: {'events.view', 'events.manage'},
};

const _organizationRouteModules = <String, String>{
  OrganizationAnnouncementsPage.routePath: 'announcements',
  OrganizationAnalyticsPage.routePath: 'analytics',
  OrganizationAttendancePage.routePath: 'attendance',
  OrganizationBookingsPage.routePath: 'bookings',
  OrganizationContentPage.routePath: 'content',
  OrganizationCoursesPage.routePath: 'courses',
  OrganizationEventsPage.routePath: 'calendar',
  OrganizationInvitationsPage.routePath: 'members',
  OrganizationInstructorsPage.routePath: 'courses',
  OrganizationPromotionsPage.routePath: 'promotions',
  OrganizationMembersPage.routePath: 'members',
  OrganizationRoomsPage.routePath: 'rooms',
  OrganizationTasksPage.routePath: 'calendar',
};
