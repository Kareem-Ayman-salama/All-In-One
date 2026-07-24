import 'package:ain_mobile/src/features/auth/application/auth_controller.dart';
import 'package:ain_mobile/src/features/auth/presentation/auth_flow_pages.dart';
import 'package:ain_mobile/src/features/auth/presentation/login_page.dart';
import 'package:ain_mobile/src/features/home/presentation/home_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/course_workspace_page.dart';
import 'package:ain_mobile/src/features/learning/presentation/my_courses_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/booking_success_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_detail_page.dart';
import 'package:ain_mobile/src/features/marketplace/presentation/course_catalog_page.dart';
import 'package:ain_mobile/src/features/notifications/presentation/notification_inbox_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_announcements_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_bookings_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_content_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_courses_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_events_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_invitations_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_members_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_profile_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_rooms_page.dart';
import 'package:ain_mobile/src/features/organization/presentation/organization_tasks_page.dart';
import 'package:ain_mobile/src/features/splash/presentation/splash_page.dart';
import 'package:ain_mobile/src/features/workspaces/presentation/workspace_selection_page.dart';
import 'package:ain_mobile/src/shared/presentation/placeholder_page.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: SplashPage.routePath,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isAuthRoute = <String>{
        LoginPage.routePath,
        RegisterPage.routePath,
        VerifyEmailPage.routePath,
        ForgotPasswordPage.routePath,
        ResetPasswordPage.routePath,
      }.contains(state.matchedLocation);
      final isPublicRoute =
          state.uri.path == CourseCatalogPage.routePath ||
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
        ),
      ),
      GoRoute(
        path: MyCoursesPage.routePath,
        builder: (context, state) => const MyCoursesPage(),
      ),
      GoRoute(
        path: NotificationInboxPage.routePath,
        builder: (context, state) => NotificationInboxPage(
          highlightNotificationId: state.uri.queryParameters['notificationId'],
        ),
      ),
      GoRoute(
        path: OrganizationAnnouncementsPage.routePath,
        builder: (context, state) => const OrganizationAnnouncementsPage(),
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
        path: OrganizationMembersPage.routePath,
        builder: (context, state) => const OrganizationMembersPage(),
      ),
      GoRoute(
        path: OrganizationProfilePage.routePath,
        builder: (context, state) => const OrganizationProfilePage(),
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
        path: '/schedule',
        builder: (context, state) =>
            const PlaceholderPage(titleKey: PlaceholderTitleKey.schedule),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) =>
            const PlaceholderPage(titleKey: PlaceholderTitleKey.profile),
      ),
    ],
  );
});
