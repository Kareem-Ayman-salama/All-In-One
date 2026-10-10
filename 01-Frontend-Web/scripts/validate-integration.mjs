import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(root, "..");

function read(relativePath) {
  if (relativePath.startsWith("backend/")) {
    return fs.readFileSync(
      path.join(workspaceRoot, "02-Backend-API", relativePath.slice("backend/".length)),
      "utf8",
    );
  }

  if (relativePath.startsWith("mobile/")) {
    return fs.readFileSync(
      path.join(workspaceRoot, "03-Mobile-App", relativePath.slice("mobile/".length)),
      "utf8",
    );
  }

  if (relativePath.startsWith(".github/")) {
    return fs.readFileSync(
      path.join(workspaceRoot, relativePath),
      "utf8",
    );
  }

  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const routes = read("backend/routes/api.php");
const permissionNames = read("backend/app/Domain/Authorization/Enums/PermissionName.php");
const authorizationSeeder = read("backend/database/seeders/AuthorizationSeeder.php");
const updateAnnouncementRequest = read("backend/app/Http/Requests/Announcements/UpdateAnnouncementRequest.php");
const announcementController = read("backend/app/Http/Controllers/Api/V1/AnnouncementController.php");
const updateBatchRequest = read("backend/app/Http/Requests/Batches/UpdateBatchRequest.php");
const courseBatchController = read("backend/app/Http/Controllers/Api/V1/CourseBatchController.php");
const storeRoomMembershipRequest = read("backend/app/Http/Requests/Rooms/StoreRoomMembershipRequest.php");
const updateRoomMembershipRequest = read("backend/app/Http/Requests/Rooms/UpdateRoomMembershipRequest.php");
const roomMembershipController = read("backend/app/Http/Controllers/Api/V1/RoomMembershipController.php");
const workspaceOperationsTest = read("backend/tests/Feature/WorkspaceOperationsTest.php");
const auth = read("src/services/authService.js");
const http = read("src/services/httpClient.js");
const api = read("src/services/api.js");
const authService = read("src/services/authService.js");
const marketplace = read("src/services/marketplaceRepository.js");
const organization = read("src/services/organizationRepository.js");
const deployment = read("backend/DEPLOYMENT.md");
const appServiceProvider = read("backend/app/Providers/AppServiceProvider.php");
const offlineCachePolicy = read("src/services/offlineCachePolicy.js");
const contentViewerAudit = read("src/services/contentViewerAudit.js");
const mobileOpenApi = readJson("docs/mobile-openapi.json");
const mobileFeatureMapping = read("mobile/WEB_MOBILE_FEATURE_MAPPING.md");
const mobileRequirements = read("mobile/MOBILE_REQUIREMENTS.md");
const mobileApiIntegrationMap = read("mobile/API_INTEGRATION_MAP.md");
const mobileImplementationPlan = read("mobile/MOBILE_IMPLEMENTATION_PLAN.md");
const mobilePubspec = read("mobile/pubspec.yaml");
const mobileAnalysisOptions = read("mobile/analysis_options.yaml");
const mobileEnvironment = read("mobile/lib/src/app/configuration/app_environment.dart");
const mobileApiClient = read("mobile/lib/src/core/api/api_client.dart");
const mobileRequestId = read("mobile/lib/src/core/api/request_id.dart");
const mobileApiError = read("mobile/lib/src/core/api/api_error.dart");
const mobileApiErrorMapper = read("mobile/lib/src/core/errors/api_error_mapper.dart");
const mobileTokenRefreshCoordinator = read("mobile/lib/src/core/auth/token_refresh_coordinator.dart");
const mobileSecureTokenStore = read("mobile/lib/src/core/auth/secure_token_store.dart");
const mobilePrivacyRedactor = read("mobile/lib/src/core/privacy/privacy_redactor.dart");
const mobileTelemetryService = read("mobile/lib/src/core/telemetry/telemetry_service.dart");
const mobileCrashReportingSink = read("mobile/lib/src/core/telemetry/crash_reporting_sink.dart");
const mobileReadme = read("mobile/README.md");
const mobileMakefile = read("mobile/Makefile");
const mobileCiWorkflow = read(".github/workflows/mobile-ci.yml");
const mobileFlavorsDoc = read("mobile/FLAVORS.md");
const mobileReleaseGuide = read("mobile/RELEASE_GUIDE.md");
const mobileStoreChecklist = read("mobile/STORE_CHECKLIST.md");
const mobileAuthController = read("mobile/lib/src/features/auth/application/auth_controller.dart");
const mobileAuthRepository = read("mobile/lib/src/features/auth/data/auth_repository.dart");
const mobileWorkspaceRepository = read("mobile/lib/src/features/workspaces/data/workspace_repository.dart");
const mobileActiveWorkspaceController = read("mobile/lib/src/features/workspaces/application/active_workspace_controller.dart");
const mobileSubscriptionStatusBanner = read(
  "mobile/lib/src/features/workspaces/presentation/subscription_status_banner.dart"
);
const mobileDeviceRepository = read("mobile/lib/src/features/devices/data/device_repository.dart");
const mobileMetadataRepository = read("mobile/lib/src/features/metadata/data/metadata_repository.dart");
const mobileReadinessController = read(
  "mobile/lib/src/features/metadata/application/mobile_readiness_controller.dart"
);
const mobileContentRepository = read("mobile/lib/src/features/content/data/content_repository.dart");
const mobileContentViewerController = read("mobile/lib/src/features/content/application/content_viewer_controller.dart");
const mobileCourseContentController = read("mobile/lib/src/features/content/application/course_content_controller.dart");
const mobileNotificationRepository = read("mobile/lib/src/features/notifications/data/notification_repository.dart");
const mobileNotificationController = read("mobile/lib/src/features/notifications/application/notification_controller.dart");
const mobileNotificationTapRouter = read("mobile/lib/src/features/notifications/application/notification_tap_router.dart");
const mobileNotificationInboxPage = read("mobile/lib/src/features/notifications/presentation/notification_inbox_page.dart");
const mobileOrganizationBookingRepository = read(
  "mobile/lib/src/features/organization/data/organization_booking_repository.dart"
);
const mobileOrganizationBookingController = read(
  "mobile/lib/src/features/organization/application/organization_booking_controller.dart"
);
const mobileOrganizationBookingsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_bookings_page.dart"
);
const mobileOrganizationCourseRepository = read(
  "mobile/lib/src/features/organization/data/organization_course_repository.dart"
);
const mobileOrganizationCourseController = read(
  "mobile/lib/src/features/organization/application/organization_course_controller.dart"
);
const mobileOrganizationCoursesPage = read(
  "mobile/lib/src/features/organization/presentation/organization_courses_page.dart"
);
const mobileOrganizationInstructorRepository = read(
  "mobile/lib/src/features/organization/data/organization_instructor_repository.dart"
);
const mobileOrganizationInstructorController = read(
  "mobile/lib/src/features/organization/application/organization_instructor_controller.dart"
);
const mobileOrganizationInstructorsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_instructors_page.dart"
);
const mobileOrganizationInvitationRepository = read(
  "mobile/lib/src/features/organization/data/organization_invitation_repository.dart"
);
const mobileOrganizationInvitationController = read(
  "mobile/lib/src/features/organization/application/organization_invitation_controller.dart"
);
const mobileOrganizationInvitationsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_invitations_page.dart"
);
const mobileOrganizationRoomRepository = read(
  "mobile/lib/src/features/organization/data/organization_room_repository.dart"
);
const mobileOrganizationRoomController = read(
  "mobile/lib/src/features/organization/application/organization_room_controller.dart"
);
const mobileOrganizationRoomsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_rooms_page.dart"
);
const mobileOrganizationAnnouncementRepository = read(
  "mobile/lib/src/features/organization/data/organization_announcement_repository.dart"
);
const mobileOrganizationAnnouncementController = read(
  "mobile/lib/src/features/organization/application/organization_announcement_controller.dart"
);
const mobileOrganizationAnnouncementsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_announcements_page.dart"
);
const mobileOrganizationAttendanceRepository = read(
  "mobile/lib/src/features/organization/data/organization_attendance_repository.dart"
);
const mobileOrganizationAttendanceController = read(
  "mobile/lib/src/features/organization/application/organization_attendance_controller.dart"
);
const mobileOrganizationAttendancePage = read(
  "mobile/lib/src/features/organization/presentation/organization_attendance_page.dart"
);
const mobileOrganizationPromotionRepository = read(
  "mobile/lib/src/features/organization/data/organization_promotion_repository.dart"
);
const mobileOrganizationPromotionController = read(
  "mobile/lib/src/features/organization/application/organization_promotion_controller.dart"
);
const mobileOrganizationPromotionsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_promotions_page.dart"
);
const mobileOrganizationAnalyticsRepository = read(
  "mobile/lib/src/features/organization/data/organization_analytics_repository.dart"
);
const mobileOrganizationAnalyticsController = read(
  "mobile/lib/src/features/organization/application/organization_analytics_controller.dart"
);
const mobileOrganizationAnalyticsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_analytics_page.dart"
);
const mobileOrganizationEventRepository = read(
  "mobile/lib/src/features/organization/data/organization_event_repository.dart"
);
const mobileOrganizationEventController = read(
  "mobile/lib/src/features/organization/application/organization_event_controller.dart"
);
const mobileOrganizationEventsPage = read(
  "mobile/lib/src/features/organization/presentation/organization_events_page.dart"
);
const mobileOrganizationTaskRepository = read(
  "mobile/lib/src/features/organization/data/organization_task_repository.dart"
);
const mobileOrganizationTaskController = read(
  "mobile/lib/src/features/organization/application/organization_task_controller.dart"
);
const mobileOrganizationTasksPage = read(
  "mobile/lib/src/features/organization/presentation/organization_tasks_page.dart"
);
const mobileOrganizationMemberRepository = read(
  "mobile/lib/src/features/organization/data/organization_member_repository.dart"
);
const mobileOrganizationMemberController = read(
  "mobile/lib/src/features/organization/application/organization_member_controller.dart"
);
const mobileOrganizationMembersPage = read(
  "mobile/lib/src/features/organization/presentation/organization_members_page.dart"
);
const mobileOrganizationOverviewPage = read(
  "mobile/lib/src/features/organization/presentation/organization_overview_page.dart"
);
const mobileOrganizationContentController = read(
  "mobile/lib/src/features/organization/application/organization_content_controller.dart"
);
const mobileOrganizationContentPage = read(
  "mobile/lib/src/features/organization/presentation/organization_content_page.dart"
);
const mobileOrganizationProfilePage = read(
  "mobile/lib/src/features/organization/presentation/organization_profile_page.dart"
);
const mobilePlatformOverviewRepository = read(
  "mobile/lib/src/features/platform/data/platform_overview_repository.dart"
);
const mobilePlatformOverviewController = read(
  "mobile/lib/src/features/platform/application/platform_overview_controller.dart"
);
const mobilePlatformOverviewPage = read(
  "mobile/lib/src/features/platform/presentation/platform_overview_page.dart"
);
const mobilePlatformAcademyModerationRepository = read(
  "mobile/lib/src/features/platform/data/platform_academy_moderation_repository.dart"
);
const mobilePlatformAcademyModerationController = read(
  "mobile/lib/src/features/platform/application/platform_academy_moderation_controller.dart"
);
const mobilePlatformAcademyApprovalsPage = read(
  "mobile/lib/src/features/platform/presentation/platform_academy_approvals_page.dart"
);
const mobilePlatformCategoryRepository = read(
  "mobile/lib/src/features/platform/data/platform_category_repository.dart"
);
const mobilePlatformCategoryController = read(
  "mobile/lib/src/features/platform/application/platform_category_controller.dart"
);
const mobilePlatformCategoriesPage = read(
  "mobile/lib/src/features/platform/presentation/platform_categories_page.dart"
);
const mobilePlatformCourseModerationRepository = read(
  "mobile/lib/src/features/platform/data/platform_course_moderation_repository.dart"
);
const mobilePlatformCourseModerationController = read(
  "mobile/lib/src/features/platform/application/platform_course_moderation_controller.dart"
);
const mobilePlatformCourseApprovalsPage = read(
  "mobile/lib/src/features/platform/presentation/platform_course_approvals_page.dart"
);
const mobilePlatformPromotionModerationRepository = read(
  "mobile/lib/src/features/platform/data/platform_promotion_moderation_repository.dart"
);
const mobilePlatformPromotionModerationController = read(
  "mobile/lib/src/features/platform/application/platform_promotion_moderation_controller.dart"
);
const mobilePlatformPromotionApprovalsPage = read(
  "mobile/lib/src/features/platform/presentation/platform_promotion_approvals_page.dart"
);
const mobileStudentLearningRepository = read("mobile/lib/src/features/learning/data/student_learning_repository.dart");
const mobileStudentLearningController = read("mobile/lib/src/features/learning/application/student_learning_controller.dart");
const mobileLessonBookingRepository = read("mobile/lib/src/features/learning/data/lesson_booking_repository.dart");
const mobileLessonBookingController = read("mobile/lib/src/features/learning/application/lesson_booking_controller.dart");
const mobileLessonBookingsPage = read("mobile/lib/src/features/learning/presentation/lesson_bookings_page.dart");
const mobileAttendanceRepository = read("mobile/lib/src/features/learning/data/attendance_repository.dart");
const mobileAttendanceController = read("mobile/lib/src/features/learning/application/attendance_controller.dart");
const mobileAttendancePage = read("mobile/lib/src/features/learning/presentation/attendance_page.dart");
const mobileMyCoursesPage = read("mobile/lib/src/features/learning/presentation/my_courses_page.dart");
const mobileCourseWorkspacePage = read("mobile/lib/src/features/learning/presentation/course_workspace_page.dart");
const mobileScheduleController = read("mobile/lib/src/features/schedule/application/schedule_controller.dart");
const mobileSchedulePage = read("mobile/lib/src/features/schedule/presentation/schedule_page.dart");
const mobileProfileController = read("mobile/lib/src/features/profile/application/profile_controller.dart");
const mobileProfilePage = read("mobile/lib/src/features/profile/presentation/profile_page.dart");
const mobilePublicCourseRepository = read("mobile/lib/src/features/marketplace/data/public_course_repository.dart");
const mobilePublicCourseCatalogController = read(
  "mobile/lib/src/features/marketplace/application/public_course_catalog_controller.dart"
);
const mobileCourseCatalogPage = read("mobile/lib/src/features/marketplace/presentation/course_catalog_page.dart");
const mobileCourseDetailPage = read("mobile/lib/src/features/marketplace/presentation/course_detail_page.dart");
const mobileBookingSuccessPage = read("mobile/lib/src/features/marketplace/presentation/booking_success_page.dart");
const mobileInstallationIdStore = read("mobile/lib/src/core/device/installation_id_store.dart");
const mobileDeepLinkService = read("mobile/lib/src/core/deep_links/deep_link_service.dart");
const mobileOfflineCachePolicy = read("mobile/lib/src/core/cache/offline_cache_policy.dart");
const mobileOfflineCacheStore = read("mobile/lib/src/core/cache/offline_cache_store.dart");
const mobileTenantCacheScope = read("mobile/lib/src/core/cache/tenant_cache_scope.dart");
const mobilePushRegistrationService = read("mobile/lib/src/core/notifications/push_registration_service.dart");
const mobileDeepLinksDoc = read("mobile/DEEP_LINKS.md");
const mobileOfflineStrategyDoc = read("mobile/OFFLINE_STRATEGY.md");
const mobilePushNotificationsDoc = read("mobile/PUSH_NOTIFICATIONS.md");
const mobileContentViewerDoc = read("mobile/CONTENT_VIEWER.md");
const mobileSecurityDoc = read("mobile/SECURITY.md");
const mobileThreatModelDoc = read("mobile/MOBILE_THREAT_MODEL.md");
const mobileSecurityChecklistDoc = read("mobile/MOBILE_SECURITY_CHECKLIST.md");
const mobileErrorHandlingDoc = read("mobile/ERROR_HANDLING.md");
const mobilePerformanceDoc = read("mobile/MOBILE_PERFORMANCE.md");
const mobileAnalyticsDoc = read("mobile/MOBILE_ANALYTICS.md");
const mobileCrashReportingDoc = read("mobile/CRASH_REPORTING.md");
const mobilePrivacyDataMap = read("mobile/PRIVACY_DATA_MAP.md");
const mobileTestingDoc = read("mobile/TESTING.md");
const mobileTestReport = read("mobile/MOBILE_TEST_REPORT.md");
const mobileIntegrationTestReport = read("mobile/INTEGRATION_TEST_REPORT.md");
const mobileLocalizationDoc = read("mobile/LOCALIZATION.md");
const mobileAccessibilityReport = read("mobile/ACCESSIBILITY_REPORT.md");
const mobileNavigationDoc = read("mobile/NAVIGATION.md");
const mobilePlayStoreReleaseDoc = read("mobile/PLAY_STORE_RELEASE.md");
const mobileAppStoreReleaseDoc = read("mobile/APP_STORE_RELEASE.md");
const mobileKnownLimitationsDoc = read("mobile/KNOWN_LIMITATIONS.md");
const mobileFinalAuditDoc = read("mobile/FINAL_MOBILE_AUDIT.md");
const mobileFinalTestReport = read("mobile/FINAL_MOBILE_TEST_REPORT.md");
const mobileSecurityReport = read("mobile/MOBILE_SECURITY_REPORT.md");
const mobileReleaseReadinessDoc = read("mobile/RELEASE_READINESS.md");
const mobileNativeReleaseReadinessDoc = read("mobile/NATIVE_RELEASE_READINESS.md");
const mobileEnvExample = read("mobile/.env.example");
const mobileApp = read("mobile/lib/src/app/app.dart");
const mobileAppRouter = read("mobile/lib/src/app/router/app_router.dart");
const mobileAppStrings = read("mobile/lib/src/app/localization/app_strings.dart");
const mobileLoginPage = read("mobile/lib/src/features/auth/presentation/login_page.dart");
const mobileAuthFlowPages = read("mobile/lib/src/features/auth/presentation/auth_flow_pages.dart");
const mobileWorkspacePage = read("mobile/lib/src/features/workspaces/presentation/workspace_selection_page.dart");
const mobileAccessDeniedPage = read("mobile/lib/src/features/workspaces/presentation/access_denied_page.dart");
const mobileHomePage = read("mobile/lib/src/features/home/presentation/home_page.dart");
const mobilePlaceholderPage = read("mobile/lib/src/shared/presentation/placeholder_page.dart");
const backendRailway = JSON.parse(read("backend/railway.json"));
const frontendRailway = JSON.parse(read("railway.json"));

const contracts = [
  [auth, '"/auth/login"', routes, "Route::post('/login'"],
  [auth, '"/auth/register"', routes, "Route::post('/register'"],
  [http, '"/auth/refresh"', routes, "Route::post('/refresh'"],
  [organization, '"/workspaces"', routes, "Route::get('/workspaces'"],
  [marketplace, '"/public/courses?perPage=48"', routes, "Route::get('/public/courses'"],
  [marketplace, '"/public/academies?perPage=48"', routes, "Route::get('/public/academies'"],
  [marketplace, '"/public/bookings"', routes, "Route::post('/public/bookings'"],
  [api, '"/meta/error-catalog"', routes, "Route::get('/meta/error-catalog'"],
  [api, '"/meta/deep-links"', routes, "Route::get('/meta/deep-links'"],
  [api, '"/meta/offline-cache-policy"', routes, "Route::get('/meta/offline-cache-policy'"],
  [api, '"/meta/device-policy"', routes, "Route::get('/meta/device-policy'"],
  [api, 'viewer-audit', routes, "Route::post('/content/{content}/viewer-audit'"],
  [api, '"/notifications/read-all"', routes, "Route::post('/notifications/read-all'"],
  [auth, '"/auth/register"', routes, "Route::post('/register'"],
  [auth, '"/auth/verify-email"', routes, "Route::post('/verify-email'"],
  [auth, '"/auth/forgot-password"', routes, "Route::post('/forgot-password'"],
  [auth, '"/auth/reset-password"', routes, "Route::post('/reset-password'"],
  [auth, '"/invitations/accept"', routes, "Route::post('/invitations/accept'"],
  [marketplace, '"/student/enrollments?perPage=100"', routes, "Route::get('/student/enrollments'"],
  [marketplace, '"/admin/categories"', routes, "Route::get('/categories'"]
];

for (const [client, clientMarker, server, serverMarker] of contracts) {
  assert.ok(client.includes(clientMarker), `Frontend contract missing ${clientMarker}`);
  assert.ok(server.includes(serverMarker), `Backend contract missing ${serverMarker}`);
}

assert.equal(frontendRailway.deploy.startCommand, "pnpm start");
assert.ok(
  frontendRailway.build.buildCommand.includes("pnpm install --frozen-lockfile"),
  "Frontend deployment must install the locked pnpm dependency graph"
);
assert.equal(backendRailway.deploy.healthcheckPath, "/api/v1/health/ready");
assert.ok(
  backendRailway.deploy.startCommand.includes("AIO_DEPLOYMENT_MODE"),
  "Backend deployment mode guard is missing"
);
assert.ok(
  deployment.includes("--queue=notifications,outbox,default"),
  "Backend worker must process notification push jobs"
);
assert.ok(
  appServiceProvider.includes("PushNotificationProvider::class"),
  "Push notification provider binding is missing"
);
assert.ok(
  offlineCachePolicy.includes('"content.view_session"')
    && offlineCachePolicy.includes('storage: "memory_only"')
    && offlineCachePolicy.includes("shouldPersistDataset"),
  "Offline cache policy must prevent signed content URLs from being persisted"
);
assert.ok(
  authService.includes("buildDeviceLoginPayload"),
  "Login requests must include application-generated installation metadata"
);
assert.ok(
  contentViewerAudit.includes("download_blocked")
    && contentViewerAudit.includes("screen_capture_started")
    && contentViewerAudit.includes("watermark_rendered"),
  "Content viewer audit helper must expose mobile security events"
);
assert.ok(
  permissionNames.includes("AnnouncementsUpdate")
    && permissionNames.includes("AnnouncementsDelete")
    && authorizationSeeder.includes("'announcements.update'")
    && authorizationSeeder.includes("'announcements.delete'")
    && updateAnnouncementRequest.includes("class UpdateAnnouncementRequest")
    && updateAnnouncementRequest.includes("'sometimes'")
    && announcementController.includes("public function update(")
    && announcementController.includes("public function destroy(")
    && announcementController.includes("'announcement.updated'")
    && announcementController.includes("'announcement.deleted'")
    && announcementController.includes("Announcement not found."),
  "Backend announcements must expose update/delete routes with permissions and audit records"
);
assert.ok(
  updateBatchRequest.includes("class UpdateBatchRequest")
    && updateBatchRequest.includes("Rule::exists('courses', 'id')")
    && updateBatchRequest.includes("Rule::exists('rooms', 'id')")
    && courseBatchController.includes("public function update(")
    && courseBatchController.includes("'batch.updated'")
    && courseBatchController.includes("Batch not found.")
    && workspaceOperationsTest.includes("test_owner_can_update_course_batches"),
  "Backend batches must expose scoped update validation, audit records, and feature coverage"
);

const mobileOpenApiRouteContracts = [
  ["/public/courses", "Route::get('/public/courses'"],
  ["/public/courses/{course}", "Route::get('/public/courses/{course}'"],
  ["/public/bookings", "Route::post('/public/bookings'"],
  ["/student/bookings", "Route::get('/student/bookings'"],
  ["/public/instructors", "Route::get('/public/instructors'"],
  ["/student/lesson-bookings", "Route::get('/student/lesson-bookings'"],
  ["/student/lesson-bookings", "Route::post('/student/lesson-bookings'"],
  ["/student/lesson-bookings/{booking}/cancel", "Route::post('/student/lesson-bookings/{booking}/cancel'"],
  ["/student/attendance", "Route::get('/student/attendance'"],
  ["/guardian/students", "Route::get('/guardian/students'"],
  ["/guardian/students/{student}/attendance", "Route::get('/guardian/students/{student}/attendance'"],
  ["/student/enrollments", "Route::get('/student/enrollments'"],
  ["/student/enrollments/{enrollment}", "Route::get('/student/enrollments/{enrollment}'"],
  ["/organizations/{organizationId}/content", "Route::get('/content'"],
  ["/organizations/{organizationId}/content/{contentId}", "Route::delete('/content/{content}'"],
  ["/organizations/{organizationId}", "Route::patch('/'"],
  ["/notifications", "Route::get('/notifications'"],
  ["/notifications/{notification}/read", "Route::post('/notifications/{notification}/read'"],
  ["/notifications/read-all", "Route::post('/notifications/read-all'"],
  ["/notification-preferences", "Route::get('/notification-preferences'"],
  ["/notification-preferences", "Route::put('/notification-preferences'"],
  ["/auth/login", "Route::post('/login'"],
  ["/auth/register", "Route::post('/register'"],
  ["/auth/verify-email", "Route::post('/verify-email'"],
  ["/auth/resend-verification", "Route::post('/resend-verification'"],
  ["/auth/forgot-password", "Route::post('/forgot-password'"],
  ["/auth/reset-password", "Route::post('/reset-password'"],
  ["/auth/refresh", "Route::post('/refresh'"],
  ["/auth/me", "Route::get('/me'"],
  ["/auth/me", "Route::patch('/me'"],
  ["/auth/sessions", "Route::get('/sessions'"],
  ["/auth/sessions/others", "Route::delete('/sessions/others'"],
  ["/auth/sessions/{session}", "Route::delete('/sessions/{session}'"],
  ["/public/invitations/{token}", "Route::get('/public/invitations/{token}'"],
  ["/invitations/accept", "Route::post('/invitations/accept'"],
  ["/organizations/{organizationId}/courses", "Route::get('/courses'"],
  ["/organizations/{organizationId}/courses", "Route::post('/courses'"],
  ["/organizations/{organizationId}/courses/{courseId}", "Route::put('/courses/{course}'"],
  ["/organizations/{organizationId}/courses/{courseId}/submit-review", "Route::post('/courses/{course}/submit-review'"],
  ["/organizations/{organizationId}/batches", "Route::get('/batches'"],
  ["/organizations/{organizationId}/batches", "Route::post('/batches'"],
  ["/organizations/{organizationId}/batches/{batchId}", "Route::patch('/batches/{batch}'"],
  ["/organizations/{organizationId}/instructors", "Route::get('/instructors'"],
  ["/organizations/{organizationId}/instructors", "Route::post('/instructors'"],
  ["/organizations/{organizationId}/instructors/{instructorId}", "Route::put('/instructors/{instructor}'"],
  ["/organizations/{organizationId}/instructor-slots", "Route::get('/instructor-slots'"],
  ["/organizations/{organizationId}/instructor-slots", "Route::post('/instructor-slots'"],
  ["/organizations/{organizationId}/rooms", "Route::get('/rooms'"],
  ["/organizations/{organizationId}/rooms", "Route::post('/rooms'"],
  ["/organizations/{organizationId}/rooms/{roomId}", "Route::patch('/rooms/{room}'"],
  ["/organizations/{organizationId}/rooms/{roomId}", "Route::delete('/rooms/{room}'"],
  ["/organizations/{organizationId}/rooms/{roomId}/members", "Route::get('/rooms/{room}/members'"],
  ["/organizations/{organizationId}/rooms/{roomId}/members", "Route::post('/rooms/{room}/members'"],
  ["/organizations/{organizationId}/rooms/{roomId}/members/{roomMembershipId}", "Route::patch('/rooms/{room}/members/{roomMembership}'"],
  ["/organizations/{organizationId}/rooms/{roomId}/members/{roomMembershipId}", "Route::delete('/rooms/{room}/members/{roomMembership}'"],
  ["/organizations/{organizationId}/announcements", "Route::get('/announcements'"],
  ["/organizations/{organizationId}/announcements", "Route::post('/announcements'"],
  ["/organizations/{organizationId}/announcements/{announcementId}", "Route::patch('/announcements/{announcement}'"],
  ["/organizations/{organizationId}/announcements/{announcementId}", "Route::delete('/announcements/{announcement}'"],
  ["/organizations/{organizationId}/learning-sessions", "Route::get('/learning-sessions'"],
  ["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance", "Route::get('/learning-sessions/{session}/attendance'"],
  ["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance", "Route::put('/learning-sessions/{session}/attendance'"],
  ["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance/lock", "Route::post('/learning-sessions/{session}/attendance/lock'"],
  ["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance/qr", "Route::post('/learning-sessions/{session}/attendance/qr'"],
  ["/organizations/{organizationId}/promotions", "Route::get('/promotions'"],
  ["/organizations/{organizationId}/promotions", "Route::post('/promotions'"],
  ["/organizations/{organizationId}/analytics/overview", "Route::get('/analytics/overview'"],
  ["/organizations/{organizationId}/events", "Route::get('/events'"],
  ["/organizations/{organizationId}/events/{eventId}", "Route::delete('/events/{event}'"],
  ["/organizations/{organizationId}/tasks", "Route::get('/tasks'"],
  ["/organizations/{organizationId}/tasks/{taskId}", "Route::patch('/tasks/{task}'"],
  ["/organizations/{organizationId}/members", "Route::get('/members'"],
  ["/organizations/{organizationId}/members/{membershipId}", "Route::patch('/members/{membership}'"],
  ["/organizations/{organizationId}/bookings", "Route::get('/bookings'"],
  ["/organizations/{organizationId}/invitations", "Route::get('/invitations'"],
  ["/organizations/{organizationId}/invitations/{invitationId}/resend", "Route::post('/invitations/{invitation}/resend'"],
  ["/organizations/{organizationId}/invitations/{invitationId}", "Route::delete('/invitations/{invitation}'"],
  ["/organizations/{organizationId}/bookings/{bookingId}/confirm", "Route::post('/bookings/{booking}/confirm'"],
  ["/organizations/{organizationId}/bookings/{bookingId}/reject", "Route::post('/bookings/{booking}/reject'"],
  ["/organizations/{organizationId}/bookings/{bookingId}/cancel", "Route::post('/bookings/{booking}/cancel'"],
  ["/devices/push-tokens", "Route::post('/devices/push-tokens'"],
  ["/meta/error-catalog", "Route::get('/meta/error-catalog'"],
  ["/meta/deep-links", "Route::get('/meta/deep-links'"],
  ["/meta/offline-cache-policy", "Route::get('/meta/offline-cache-policy'"],
  ["/meta/device-policy", "Route::get('/meta/device-policy'"],
  ["/admin/analytics/overview", "Route::get('/analytics/overview'"],
  ["/admin/organizations", "Route::get('/organizations'"],
  ["/admin/academies", "Route::get('/academies'"],
  ["/admin/academies/{academyId}/verify", "Route::post('/academies/{academy}/verify'"],
  ["/admin/academies/{academyId}/reject", "Route::post('/academies/{academy}/reject'"],
  ["/admin/categories", "Route::get('/categories'"],
  ["/admin/categories", "Route::post('/categories'"],
  ["/admin/categories/{categoryId}", "Route::put('/categories/{category}'"],
  ["/admin/categories/{categoryId}", "Route::delete('/categories/{category}'"],
  ["/admin/courses", "Route::get('/courses'"],
  ["/admin/courses/{courseId}/approve", "Route::post('/courses/{course}/approve'"],
  ["/admin/courses/{courseId}/reject", "Route::post('/courses/{course}/reject'"],
  ["/admin/promotions", "Route::get('/promotions'"],
  ["/admin/promotions/{promotionId}/approve", "Route::post('/promotions/{promotion}/approve'"],
  ["/admin/promotions/{promotionId}/reject", "Route::post('/promotions/{promotion}/reject'"],
  [
    "/organizations/{organizationId}/content/{contentId}/view-session",
    "Route::get('/content/{content}/view-session'"
  ],
  [
    "/organizations/{organizationId}/content/{contentId}/viewer-audit",
    "Route::post('/content/{content}/viewer-audit'"
  ]
];

for (const [openApiPath, serverMarker] of mobileOpenApiRouteContracts) {
  assert.ok(mobileOpenApi.paths[openApiPath], `Mobile OpenAPI missing ${openApiPath}`);
  assert.ok(routes.includes(serverMarker), `Backend route missing ${serverMarker}`);
}

assert.ok(
  mobileOpenApi.components.schemas.ContentViewerAuditRequest.properties.event.enum.includes("download_blocked"),
  "Mobile OpenAPI must include content viewer audit security events"
);
assert.ok(
  mobileOpenApi.paths["/student/attendance"]?.get
    && mobileOpenApi.paths["/guardian/students"]?.get
    && mobileOpenApi.paths["/guardian/students/{student}/attendance"]?.get
    && mobileOpenApi.components.schemas.AttendanceSummary
    && mobileOpenApi.components.schemas.AttendanceRecordSummary
    && mobileOpenApi.components.schemas.GuardianStudentLinkSummary,
  "Mobile OpenAPI must include student and guardian attendance contracts"
);
assert.ok(
  mobileOpenApi.paths["/organizations/{organizationId}/learning-sessions"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance"]?.put
    && mobileOpenApi.paths["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance/lock"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/learning-sessions/{sessionId}/attendance/qr"]?.post
    && mobileOpenApi.components.schemas.OrganizationLearningSessionSummary
    && mobileOpenApi.components.schemas.OrganizationAttendanceSheet
    && mobileOpenApi.components.schemas.OrganizationAttendanceMarkRequest
    && mobileOpenApi.components.schemas.OrganizationAttendanceQrCode,
  "Mobile OpenAPI must include organization attendance session, mark, lock, and QR contracts"
);
assert.ok(
  mobileOpenApi.paths["/organizations/{organizationId}/promotions"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/promotions"]?.post
    && mobileOpenApi.components.schemas.OrganizationPromotionSummary
    && mobileOpenApi.components.schemas.CreateOrganizationPromotionRequest,
  "Mobile OpenAPI must include organization promotion list and create contracts"
);
assert.ok(
  mobileOpenApi.paths["/organizations/{organizationId}/analytics/overview"]?.get
    && mobileOpenApi.components.schemas.OrganizationAnalyticsOverview
    && mobileOpenApi.components.schemas.OrganizationAnalyticsRange
    && mobileOpenApi.components.schemas.OrganizationAnalyticsMetrics,
  "Mobile OpenAPI must include organization analytics overview contracts"
);
assert.ok(
  mobileOpenApi.paths["/admin/analytics/overview"]?.get
    && mobileOpenApi.paths["/admin/organizations"]?.get
    && mobileOpenApi.components.schemas.PlatformAnalyticsOverview
    && mobileOpenApi.components.schemas.PlatformAnalyticsMetrics
    && mobileOpenApi.components.schemas.PlatformOrganizationSummary,
  "Mobile OpenAPI must include platform overview analytics and organization contracts"
);
assert.ok(
  mobileOpenApi.paths["/admin/academies"]?.get
    && mobileOpenApi.paths["/admin/academies/{academyId}/verify"]?.post
    && mobileOpenApi.paths["/admin/academies/{academyId}/reject"]?.post
    && mobileOpenApi.components.schemas.PlatformAcademyModerationSummary
    && mobileOpenApi.components.schemas.ModerationDecisionRequest,
  "Mobile OpenAPI must include platform academy moderation contracts"
);
assert.ok(
  mobileOpenApi.paths["/admin/categories"]?.get
    && mobileOpenApi.paths["/admin/categories"]?.post
    && mobileOpenApi.paths["/admin/categories/{categoryId}"]?.put
    && mobileOpenApi.paths["/admin/categories/{categoryId}"]?.delete
    && mobileOpenApi.components.schemas.PlatformCategorySummary
    && mobileOpenApi.components.schemas.PlatformCategoryRequest,
  "Mobile OpenAPI must include platform category management contracts"
);
assert.ok(
  mobileOpenApi.paths["/admin/courses"]?.get
    && mobileOpenApi.paths["/admin/courses/{courseId}/approve"]?.post
    && mobileOpenApi.paths["/admin/courses/{courseId}/reject"]?.post
    && mobileOpenApi.components.schemas.PlatformCourseModerationSummary
    && mobileOpenApi.components.schemas.ModerationDecisionRequest,
  "Mobile OpenAPI must include platform course moderation contracts"
);
assert.ok(
  mobileOpenApi.paths["/admin/promotions"]?.get
    && mobileOpenApi.paths["/admin/promotions/{promotionId}/approve"]?.post
    && mobileOpenApi.paths["/admin/promotions/{promotionId}/reject"]?.post
    && mobileOpenApi.components.schemas.PlatformPromotionModerationSummary
    && mobileOpenApi.components.schemas.ModerationDecisionRequest,
  "Mobile OpenAPI must include platform promotion moderation contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.PublicCourseSummary
    && mobileOpenApi.components.schemas.PublicBookingRequest.required.includes("termsAccepted")
    && mobileOpenApi.components.schemas.PublicBookingRequest.properties.idempotencyKey,
  "Mobile OpenAPI must include marketplace course and public booking contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.StudentBookingSummary
    && mobileOpenApi.components.schemas.StudentEnrollmentSummary
    && mobileOpenApi.components.schemas.StudentEnrollmentDetail,
  "Mobile OpenAPI must include student booking and enrollment contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.LessonInstructorSummary
    && mobileOpenApi.components.schemas.LessonAvailabilitySlot
    && mobileOpenApi.components.schemas.LessonBookingSummary
    && mobileOpenApi.components.schemas.ReserveLessonBookingRequest
    && mobileOpenApi.components.schemas.ReserveLessonBookingRequest.required.includes("studentPhone")
    && mobileOpenApi.paths["/public/instructors"]?.get
    && mobileOpenApi.paths["/student/lesson-bookings"]?.get
    && mobileOpenApi.paths["/student/lesson-bookings"]?.post
    && mobileOpenApi.paths["/student/lesson-bookings/{booking}/cancel"]?.post,
  "Mobile OpenAPI must include public instructor and student lesson booking contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.ContentItemSummary
    && mobileOpenApi.components.schemas.ContentFileAssetSummary
    && mobileOpenApi.components.schemas.CreateOrganizationContentLinkRequest
    && mobileOpenApi.components.schemas.CreateOrganizationContentFileRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/content"]?.post
      ?.requestBody?.content?.["multipart/form-data"]
    && mobileOpenApi.paths["/organizations/{organizationId}/content/{contentId}"],
  "Mobile OpenAPI must include organization content list, link/file create, and delete contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.AppNotification
    && mobileOpenApi.paths["/notifications"]
    && mobileOpenApi.paths["/notifications/{notification}/read"]
    && mobileOpenApi.paths["/notifications/read-all"]
    && mobileOpenApi.paths["/notification-preferences"]?.get
    && mobileOpenApi.paths["/notification-preferences"]?.put
    && mobileOpenApi.components.schemas.NotificationPreferences
    && mobileOpenApi.components.schemas.UpdateNotificationPreferencesRequest,
  "Mobile OpenAPI must include notification inbox, read-state, and preference contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationBookingSummary
    && mobileOpenApi.components.schemas.OrganizationBookingDecisionRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/bookings"]
    && mobileOpenApi.paths["/organizations/{organizationId}/bookings/{bookingId}/confirm"]
    && mobileOpenApi.paths["/organizations/{organizationId}/bookings/{bookingId}/reject"]
    && mobileOpenApi.paths["/organizations/{organizationId}/bookings/{bookingId}/cancel"],
  "Mobile OpenAPI must include organization booking review and decision contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationCourseSummary
    && mobileOpenApi.components.schemas.OrganizationBatchSummary
    && mobileOpenApi.components.schemas.CreateOrganizationCourseRequest
    && mobileOpenApi.components.schemas.CreateOrganizationBatchRequest
    && mobileOpenApi.components.schemas.UpdateOrganizationBatchRequest
    && mobileOpenApi.components.schemas.OrganizationBatchScheduleSlot
    && mobileOpenApi.paths["/organizations/{organizationId}/courses"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/courses"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/courses/{courseId}"]?.put
    && mobileOpenApi.paths["/organizations/{organizationId}/courses/{courseId}/submit-review"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/batches"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/batches"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/batches/{batchId}"]?.patch,
  "Mobile OpenAPI must include organization course list/create/update/review and batch list/create/update contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationInstructorSummary
    && mobileOpenApi.components.schemas.OrganizationInstructorRequest
    && mobileOpenApi.components.schemas.OrganizationInstructorSlotSummary
    && mobileOpenApi.components.schemas.OrganizationInstructorSlotRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/instructors"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/instructors"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/instructors/{instructorId}"]?.put
    && mobileOpenApi.paths["/organizations/{organizationId}/instructor-slots"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/instructor-slots"]?.post,
  "Mobile OpenAPI must include organization instructor and availability slot contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationInvitationSummary
    && mobileOpenApi.components.schemas.CreateOrganizationInvitationRequest
    && mobileOpenApi.components.schemas.OrganizationInvitationCommandResult
    && mobileOpenApi.paths["/organizations/{organizationId}/invitations"]
    && mobileOpenApi.paths["/organizations/{organizationId}/invitations/{invitationId}/resend"]
    && mobileOpenApi.paths["/organizations/{organizationId}/invitations/{invitationId}"],
  "Mobile OpenAPI must include organization invitation list and action contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationRoomSummary
    && mobileOpenApi.components.schemas.CreateOrganizationRoomRequest
    && mobileOpenApi.components.schemas.UpdateOrganizationRoomRequest
    && mobileOpenApi.components.schemas.OrganizationRoomMemberSummary
    && mobileOpenApi.components.schemas.CreateRoomMemberRequest
    && mobileOpenApi.components.schemas.UpdateRoomMemberRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms/{roomId}"]?.patch
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms/{roomId}"]?.delete
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms/{roomId}/members"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms/{roomId}/members"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms/{roomId}/members/{roomMembershipId}"]?.patch
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms/{roomId}/members/{roomMembershipId}"]?.delete,
  "Mobile OpenAPI must include organization room and room-member contracts"
);
assert.ok(
  storeRoomMembershipRequest.includes("class StoreRoomMembershipRequest")
    && storeRoomMembershipRequest.includes("organization_memberships")
    && updateRoomMembershipRequest.includes("class UpdateRoomMembershipRequest")
    && roomMembershipController.includes("public function index(")
    && roomMembershipController.includes("public function store(")
    && roomMembershipController.includes("public function update(")
    && roomMembershipController.includes("public function destroy(")
    && roomMembershipController.includes("'room_member.added'")
    && roomMembershipController.includes("'room_member.updated'")
    && roomMembershipController.includes("'room_member.removed'")
    && workspaceOperationsTest.includes("test_owner_can_manage_room_members"),
  "Backend room members must expose scoped list/add/update/remove endpoints"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationAnnouncementSummary
    && mobileOpenApi.components.schemas.CreateOrganizationAnnouncementRequest
    && mobileOpenApi.components.schemas.UpdateOrganizationAnnouncementRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/announcements"]?.get
    && mobileOpenApi.paths["/organizations/{organizationId}/announcements"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/announcements/{announcementId}"]?.patch
    && mobileOpenApi.paths["/organizations/{organizationId}/announcements/{announcementId}"]?.delete,
  "Mobile OpenAPI must include organization announcement list/create/update/delete contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationEventSummary
    && mobileOpenApi.components.schemas.CreateOrganizationEventRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/events"]
    && mobileOpenApi.paths["/organizations/{organizationId}/events/{eventId}"],
  "Mobile OpenAPI must include organization event list, create, and delete contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationTaskSummary
    && mobileOpenApi.components.schemas.CreateOrganizationTaskRequest
    && mobileOpenApi.components.schemas.UpdateOrganizationTaskRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/tasks"]
    && mobileOpenApi.paths["/organizations/{organizationId}/tasks/{taskId}"],
  "Mobile OpenAPI must include organization task list, create, update, and delete contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationMemberSummary
    && mobileOpenApi.components.schemas.OrganizationMemberUserSummary
    && mobileOpenApi.components.schemas.OrganizationMemberRoleSummary
    && mobileOpenApi.components.schemas.UpdateOrganizationMemberRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/members"]
    && mobileOpenApi.paths["/organizations/{organizationId}/members/{membershipId}"],
  "Mobile OpenAPI must include organization member list, update, and remove contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationProfile
    && mobileOpenApi.components.schemas.UpdateOrganizationProfileRequest
    && mobileOpenApi.paths["/organizations/{organizationId}"]?.patch,
  "Mobile OpenAPI must include organization profile update contract"
);
assert.ok(
  mobileOpenApi.components.schemas.LoginRequest.properties.installationId,
  "Mobile OpenAPI login request must include installation metadata"
);
assert.ok(
  mobileOpenApi.components.schemas.AuthSession.required.includes("refreshToken")
    && mobileOpenApi.components.schemas.RegisterRequest
    && mobileOpenApi.components.schemas.EmailCodeRequest
    && mobileOpenApi.components.schemas.ResetPasswordRequest
    && mobileOpenApi.components.schemas.CurrentUserProfile
    && mobileOpenApi.components.schemas.UpdateUserProfileRequest
    && mobileOpenApi.components.schemas.AuthUserProfile
    && mobileOpenApi.components.schemas.UserSession
    && mobileOpenApi.components.schemas.UserSession.properties.lastUsedAt
    && mobileOpenApi.components.schemas.RevokeSessionResult
    && mobileOpenApi.paths["/auth/me"]?.patch
    && mobileOpenApi.paths["/auth/sessions/others"]?.delete
    && mobileOpenApi.paths["/auth/sessions/{session}"]?.delete
    && mobileOpenApi.components.schemas.InvitationPreview
    && mobileOpenApi.components.schemas.InvitationAcceptance,
  "Mobile OpenAPI must include mobile auth completion, profile, and invitation contracts"
);
assert.ok(
  mobileFeatureMapping.includes("/end-user/:page")
    && mobileFeatureMapping.includes("/tenant-admin/:page")
    && mobileFeatureMapping.includes("docs/mobile-openapi.json"),
  "Mobile feature mapping must reference web shells and the OpenAPI seed"
);
assert.ok(
  mobileRequirements.includes("secure storage")
    && mobileRequirements.includes("tenant cache")
    && mobileRequirements.includes("Flutter stable"),
  "Mobile requirements must capture security, tenancy, and Flutter foundation requirements"
);
assert.ok(
  mobileApiIntegrationMap.includes("GET /api/v1/meta/deep-links")
    && mobileApiIntegrationMap.includes("POST /api/v1/devices/push-tokens")
    && mobileApiIntegrationMap.includes("POST /api/v1/auth/register")
    && mobileApiIntegrationMap.includes("POST /api/v1/auth/verify-email")
    && mobileApiIntegrationMap.includes("PATCH /api/v1/auth/me")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/auth/sessions/:session")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/auth/sessions/others")
    && mobileApiIntegrationMap.includes("GET /api/v1/public/invitations/:token")
    && mobileApiIntegrationMap.includes("GET /api/v1/public/instructors")
    && mobileApiIntegrationMap.includes("POST /api/v1/student/lesson-bookings")
    && mobileApiIntegrationMap.includes("POST /api/v1/student/lesson-bookings/:bookingId/cancel")
    && mobileApiIntegrationMap.includes("GET /api/v1/student/attendance")
    && mobileApiIntegrationMap.includes("GET /api/v1/guardian/students")
    && mobileApiIntegrationMap.includes("GET /api/v1/guardian/students/:studentId/attendance")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/bookings/:bookingId/confirm")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/courses")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/courses")
    && mobileApiIntegrationMap.includes("PUT /api/v1/organizations/:id/courses/:courseId")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/courses/:courseId/submit-review")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/batches")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/batches")
    && mobileApiIntegrationMap.includes("GET/POST /api/v1/organizations/:id/instructors")
    && mobileApiIntegrationMap.includes("PUT /api/v1/organizations/:id/instructors/:instructorId")
    && mobileApiIntegrationMap.includes("GET/POST /api/v1/organizations/:id/instructor-slots")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/invitations")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/rooms")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/rooms")
    && mobileApiIntegrationMap.includes("PATCH /api/v1/organizations/:id/rooms/:roomId")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/organizations/:id/rooms/:roomId")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/announcements")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/announcements")
    && mobileApiIntegrationMap.includes("PATCH /api/v1/organizations/:id/announcements/:announcementId")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/organizations/:id/announcements/:announcementId")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/learning-sessions")
    && mobileApiIntegrationMap.includes("GET/PUT /api/v1/organizations/:id/learning-sessions/:sessionId/attendance")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/learning-sessions/:sessionId/attendance/lock")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/learning-sessions/:sessionId/attendance/qr")
    && mobileApiIntegrationMap.includes("GET/POST /api/v1/organizations/:id/promotions")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/analytics/overview")
    && mobileApiIntegrationMap.includes("GET /api/v1/admin/analytics/overview")
    && mobileApiIntegrationMap.includes("GET /api/v1/admin/organizations")
    && mobileApiIntegrationMap.includes("GET /api/v1/admin/academies")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/academies/:academyId/verify")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/academies/:academyId/reject")
    && mobileApiIntegrationMap.includes("GET /api/v1/admin/categories")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/categories")
    && mobileApiIntegrationMap.includes("PUT /api/v1/admin/categories/:categoryId")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/admin/categories/:categoryId")
    && mobileApiIntegrationMap.includes("GET /api/v1/admin/courses")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/courses/:courseId/approve")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/courses/:courseId/reject")
    && mobileApiIntegrationMap.includes("GET /api/v1/admin/promotions")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/promotions/:promotionId/approve")
    && mobileApiIntegrationMap.includes("POST /api/v1/admin/promotions/:promotionId/reject")
    && mobileApiIntegrationMap.includes("Mobile readiness")
    && mobileApiIntegrationMap.includes("deep-link manifest coverage")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/events")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/organizations/:id/events/:eventId")
    && mobileApiIntegrationMap.includes("PUT /api/v1/notification-preferences")
    && mobileApiIntegrationMap.includes("stale-while-revalidate")
    && mobileApiIntegrationMap.includes("fall back to cached notifications")
    && mobileApiIntegrationMap.includes("optimistic read-state")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/tasks")
    && mobileApiIntegrationMap.includes("PATCH /api/v1/organizations/:id/tasks/:taskId")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/members")
    && mobileApiIntegrationMap.includes("PATCH /api/v1/organizations/:id/members/:membershipId")
    && mobileApiIntegrationMap.includes("PATCH /api/v1/organizations/:id")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/content")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/organizations/:id/content/:contentId")
    && mobileApiIntegrationMap.includes("organization_room_repository.dart")
    && mobileApiIntegrationMap.includes("organization_rooms_page.dart")
    && mobileApiIntegrationMap.includes("organization_announcement_repository.dart")
    && mobileApiIntegrationMap.includes("organization_announcements_page.dart")
    && mobileApiIntegrationMap.includes("organization_attendance_repository.dart")
    && mobileApiIntegrationMap.includes("organization_attendance_controller.dart")
    && mobileApiIntegrationMap.includes("organization_attendance_page.dart")
    && mobileApiIntegrationMap.includes("organization_promotion_repository.dart")
    && mobileApiIntegrationMap.includes("organization_promotion_controller.dart")
    && mobileApiIntegrationMap.includes("organization_promotions_page.dart")
    && mobileApiIntegrationMap.includes("organization_analytics_repository.dart")
    && mobileApiIntegrationMap.includes("organization_analytics_controller.dart")
    && mobileApiIntegrationMap.includes("organization_analytics_page.dart")
    && mobileApiIntegrationMap.includes("organization_event_repository.dart")
    && mobileApiIntegrationMap.includes("organization_events_page.dart")
    && mobileApiIntegrationMap.includes("organization_task_repository.dart")
    && mobileApiIntegrationMap.includes("organization_tasks_page.dart")
    && mobileApiIntegrationMap.includes("organization_member_repository.dart")
    && mobileApiIntegrationMap.includes("organization_members_page.dart")
    && mobileApiIntegrationMap.includes("organization_content_controller.dart")
    && mobileApiIntegrationMap.includes("organization_content_page.dart")
    && mobileApiIntegrationMap.includes("organization_profile_page.dart")
    && mobileApiIntegrationMap.includes("organization_overview_page.dart")
    && mobileApiIntegrationMap.includes("platform_overview_repository.dart")
    && mobileApiIntegrationMap.includes("platform_overview_controller.dart")
    && mobileApiIntegrationMap.includes("platform_overview_page.dart")
    && mobileApiIntegrationMap.includes("platform_academy_moderation_repository.dart")
    && mobileApiIntegrationMap.includes("platform_academy_moderation_controller.dart")
    && mobileApiIntegrationMap.includes("platform_academy_approvals_page.dart")
    && mobileApiIntegrationMap.includes("platform_category_repository.dart")
    && mobileApiIntegrationMap.includes("platform_category_controller.dart")
    && mobileApiIntegrationMap.includes("platform_categories_page.dart")
    && mobileApiIntegrationMap.includes("platform_course_moderation_repository.dart")
    && mobileApiIntegrationMap.includes("platform_course_moderation_controller.dart")
    && mobileApiIntegrationMap.includes("platform_course_approvals_page.dart")
    && mobileApiIntegrationMap.includes("platform_promotion_moderation_repository.dart")
    && mobileApiIntegrationMap.includes("platform_promotion_moderation_controller.dart")
    && mobileApiIntegrationMap.includes("platform_promotion_approvals_page.dart")
    && mobileApiIntegrationMap.includes("organization_invitation_repository.dart")
    && mobileApiIntegrationMap.includes("organization_invitations_page.dart")
    && mobileApiIntegrationMap.includes("organization_booking_repository.dart")
    && mobileApiIntegrationMap.includes("organization_bookings_page.dart")
    && mobileApiIntegrationMap.includes("organization_course_repository.dart")
    && mobileApiIntegrationMap.includes("organization_courses_page.dart")
    && mobileApiIntegrationMap.includes("organization_instructor_repository.dart")
    && mobileApiIntegrationMap.includes("organization_instructor_controller.dart")
    && mobileApiIntegrationMap.includes("organization_instructors_page.dart")
    && mobileApiIntegrationMap.includes("viewer-audit")
    && mobileApiIntegrationMap.includes("mobile_readiness_controller.dart")
    && mobileApiIntegrationMap.includes("public_course_repository.dart")
    && mobileApiIntegrationMap.includes("course_detail_page.dart")
    && mobileApiIntegrationMap.includes("booking_success_page.dart")
    && mobileApiIntegrationMap.includes("student_learning_repository.dart")
    && mobileApiIntegrationMap.includes("lesson_booking_repository.dart")
    && mobileApiIntegrationMap.includes("lesson_booking_controller.dart")
    && mobileApiIntegrationMap.includes("lesson_bookings_page.dart")
    && mobileApiIntegrationMap.includes("attendance_repository.dart")
    && mobileApiIntegrationMap.includes("attendance_controller.dart")
    && mobileApiIntegrationMap.includes("attendance_page.dart")
    && mobileApiIntegrationMap.includes("my_courses_page.dart")
    && mobileApiIntegrationMap.includes("course_workspace_page.dart")
    && mobileApiIntegrationMap.includes("schedule_controller.dart")
    && mobileApiIntegrationMap.includes("schedule_page.dart")
    && mobileApiIntegrationMap.includes("profile_controller.dart")
    && mobileApiIntegrationMap.includes("profile_page.dart")
    && mobileApiIntegrationMap.includes("course_content_controller.dart")
    && mobileApiIntegrationMap.includes("auth_flow_pages.dart")
    && mobileApiIntegrationMap.includes("content?roomId")
    && mobileApiIntegrationMap.includes("notification_tap_router.dart")
    && mobileApiIntegrationMap.includes("notification_inbox_page.dart"),
  "Mobile API integration map must cover metadata, push, protected content, marketplace, and student learning"
);
assert.ok(
  mobileImplementationPlan.includes("Phase 1 - Flutter Foundation")
    && mobileImplementationPlan.includes("Current Blockers")
    && mobileImplementationPlan.includes("Register, email verification")
    && mobileImplementationPlan.includes("invitation preview")
    && mobileImplementationPlan.includes("screens are routed in GoRouter")
    && mobileImplementationPlan.includes("Profile settings are wired")
    && mobileImplementationPlan.includes("Session list and revocation are wired")
    && mobileImplementationPlan.includes("started with mobile booking review")
    && mobileImplementationPlan.includes("Organization overview dashboard is implemented")
    && mobileImplementationPlan.includes("Booking confirm, reject, and cancel actions")
    && mobileImplementationPlan.includes("Courses and batches list review is wired")
    && mobileImplementationPlan.includes("Course create/edit/submit-review and batch create/edit forms are wired")
    && mobileImplementationPlan.includes("Instructor profiles and bookable availability slots are wired")
    && mobileImplementationPlan.includes("Invitation list, create, resend, and cancel are wired")
    && mobileImplementationPlan.includes("Room list, create, edit, delete, and room member management are wired")
    && mobileImplementationPlan.includes("Announcement list, organization-wide and room-targeted create/edit")
    && mobileImplementationPlan.includes("Organization attendance is wired at `/organization/attendance`")
    && mobileImplementationPlan.includes("Organization promotion list/create is wired at `/organization/promotions`")
    && mobileImplementationPlan.includes("Organization analytics is wired at `/organization/analytics`")
    && mobileImplementationPlan.includes("Platform overview is wired at `/platform/overview`")
    && mobileImplementationPlan.includes("Platform academy approvals are wired at `/platform/academy-approvals`")
    && mobileImplementationPlan.includes("Platform category management is wired at `/platform/categories`")
    && mobileImplementationPlan.includes("Platform course approvals are wired at `/platform/course-approvals`")
    && mobileImplementationPlan.includes("Platform promotion approvals are wired at `/platform/promotion-approvals`")
    && mobileImplementationPlan.includes("Calendar event list with room filter")
    && mobileImplementationPlan.includes("Task list, create with room/member assignment pickers")
    && mobileImplementationPlan.includes("file picker upload")
    && mobileImplementationPlan.includes("Public course catalog is wired")
    && mobileImplementationPlan.includes("Public booking submit is wired")
    && mobileImplementationPlan.includes("Booking success is routed")
    && mobileImplementationPlan.includes("My courses/enrollments is wired")
    && mobileImplementationPlan.includes("Lesson booking explore/reserve/cancel is wired")
    && mobileImplementationPlan.includes("Course workspace entry is wired")
    && mobileImplementationPlan.includes("Schedule is wired at `/schedule`")
    && mobileImplementationPlan.includes("Organization subscription status is surfaced")
    && mobileImplementationPlan.includes("Protected course content is wired")
    && mobileImplementationPlan.includes("avoids displaying or persisting the signed URL")
    && mobileImplementationPlan.includes("Notification inbox and tap routing")
    && mobileImplementationPlan.includes("surfaces the `notifications.inbox` offline cache policy")
    && mobileImplementationPlan.includes("OfflineCacheStore")
    && mobileImplementationPlan.includes("falls back to cached notifications")
    && mobileImplementationPlan.includes("Notification preferences are wired")
    && mobileImplementationPlan.includes("Offline/device readiness is surfaced in Profile")
    && mobileImplementationPlan.includes("Profile readiness surfaces")
    && mobileImplementationPlan.includes("resolve `data.route`"),
  "Mobile implementation plan must describe Flutter foundation, marketplace progress, and blockers"
);
assert.ok(
  mobilePubspec.includes("flutter_riverpod")
    && mobilePubspec.includes("go_router")
    && mobilePubspec.includes("dio")
    && mobilePubspec.includes("flutter_secure_storage")
    && mobilePubspec.includes("flutter_localizations")
    && mobilePubspec.includes("firebase_messaging"),
  "Mobile pubspec must include the required foundation dependencies"
);
assert.ok(
  !mobilePubspec.includes("firebase_analytics"),
  "Mobile analytics package must not be enabled before privacy approval"
);
assert.ok(
  mobileAnalysisOptions.includes("strict-casts: true")
    && mobileAnalysisOptions.includes("avoid_print: true"),
  "Mobile analysis options must enable strict analysis and logging hygiene"
);
assert.ok(
  mobileEnvironment.includes("Production builds must use HTTPS API URLs")
    && mobileEnvironment.includes("Production builds cannot enable mock data"),
  "Mobile environment guard must reject unsafe production configuration"
);
assert.ok(
  mobileApiClient.includes("Authorization")
    && mobileApiClient.includes("redactSensitiveDioError"),
  "Mobile API client must attach tokens and redact sensitive request data"
);
assert.ok(
  mobileApiClient.includes("X-Request-ID")
    && mobileApiClient.includes("X-AIN-Platform")
    && mobileApiClient.includes("X-AIN-App-Version"),
  "Mobile API client must attach request, platform, and app-version headers"
);
assert.ok(
  mobileApiClient.includes("TokenRefreshCoordinator")
    && mobileApiClient.includes("shouldAttemptRefresh")
    && mobileApiClient.includes("dio.fetch")
    && mobileApiClient.includes("retriedAfterRefresh"),
  "Mobile API client must coordinate refresh and retry failed authenticated requests once"
);
assert.ok(
  mobileRequestId.includes("Random.secure")
    && mobileRequestId.includes("RequestIdFactory"),
  "Mobile request IDs must be generated locally with secure randomness"
);
assert.ok(
  mobileApiError.includes("requestId")
    && mobileApiError.includes("category")
    && mobileApiError.includes("retryable"),
  "Mobile ApiError must preserve request ID, category, and retryability"
);
assert.ok(
  mobileApiErrorMapper.includes("apiErrorMapperProvider")
    && mobileApiErrorMapper.includes("catalog")
    && mobileApiErrorMapper.includes("requestId")
    && mobileApiErrorMapper.includes("messageAr")
    && mobileApiErrorMapper.includes("X-Request-ID"),
  "Mobile API error mapper must parse backend error catalogs and request IDs"
);
assert.ok(
  mobilePrivacyRedactor.includes("PrivacyRedactor")
    && mobilePrivacyRedactor.includes("accessToken")
    && mobilePrivacyRedactor.includes("refreshToken")
    && mobilePrivacyRedactor.includes("signedUrl")
    && mobilePrivacyRedactor.includes("/content-view/")
    && mobilePrivacyRedactor.includes("[REDACTED]"),
  "Mobile privacy redactor must redact tokens and signed content URLs"
);
assert.ok(
  mobileTelemetryService.includes("TelemetryService")
    && mobileTelemetryService.includes("PrivacyRedactor")
    && mobileTelemetryService.includes("TelemetrySink")
    && mobileTelemetryService.includes("loginSuccess")
    && mobileTelemetryService.includes("contentOpened"),
  "Mobile telemetry service must centralize redacted event tracking"
);
assert.ok(
  mobileCrashReportingSink.includes("FirebaseCrashlytics")
    && mobileCrashReportingSink.includes("recordError")
    && mobileCrashReportingSink.includes("setCustomKey"),
  "Mobile crash reporting sink must adapt redacted telemetry to Crashlytics"
);
assert.ok(
  mobileTokenRefreshCoordinator.includes("Future<String?>? _inFlightRefresh")
    && mobileTokenRefreshCoordinator.includes("skipAuthRefresh")
    && mobileTokenRefreshCoordinator.includes("retriedAfterRefresh")
    && mobileTokenRefreshCoordinator.includes("'/auth/refresh'")
    && mobileTokenRefreshCoordinator.includes("clearSession"),
  "Mobile token refresh coordinator must enforce single-flight refresh and clear failed sessions"
);
assert.ok(
  mobileSecureTokenStore.includes("FlutterSecureStorage")
    && mobileSecureTokenStore.includes("clearSession"),
  "Mobile secure token store must use secure storage and support session clearing"
);
assert.ok(
  mobileReadme.includes("flutter analyze")
    && mobileReadme.includes("flutter build appbundle --flavor production")
    && mobileReadme.includes("flutter build ipa --flavor production")
    && mobileReadme.includes("make -C 03-Mobile-App ci")
    && mobileReadme.includes("must not automatically release"),
  "Mobile README must document the required analysis and release build commands"
);
assert.ok(
  mobileMakefile.includes("flutter pub get")
    && mobileMakefile.includes("dart run build_runner build --delete-conflicting-outputs")
    && mobileMakefile.includes("dart format --set-exit-if-changed .")
    && mobileMakefile.includes("flutter analyze")
    && mobileMakefile.includes("flutter test")
    && mobileMakefile.includes("flutter build appbundle --flavor production")
    && mobileMakefile.includes("flutter build ipa --flavor production")
    && mobileMakefile.includes("AIN_ALLOW_MOCK_DATA=false"),
  "Mobile Makefile must expose CI and production build commands with mock data disabled"
);
assert.ok(
  mobileCiWorkflow.includes('"03-Mobile-App/**"')
    && mobileCiWorkflow.includes("subosito/flutter-action@v2")
    && mobileCiWorkflow.includes("channel: stable")
    && mobileCiWorkflow.includes("flutter pub get")
    && mobileCiWorkflow.includes("dart run build_runner build --delete-conflicting-outputs")
    && mobileCiWorkflow.includes("dart format --set-exit-if-changed lib test")
    && mobileCiWorkflow.includes("flutter analyze")
    && mobileCiWorkflow.includes("flutter test")
    && !mobileCiWorkflow.includes("flutter build apk")
    && !mobileCiWorkflow.includes("flutter build appbundle --flavor production")
    && !mobileCiWorkflow.includes("flutter build ipa --flavor production"),
  "Mobile CI workflow must validate mobile changes without performing production release builds"
);
assert.ok(
  mobileFlavorsDoc.includes("build-production-appbundle")
    && mobileFlavorsDoc.includes("build-production-ipa")
    && mobileFlavorsDoc.includes("release approval gate"),
  "Mobile flavors documentation must reference production build targets and approvals"
);
assert.ok(
  mobileReleaseGuide.includes("must not automatically release")
    && mobileReleaseGuide.includes("mobile-production-approval")
    && mobileReleaseGuide.includes("Play Console internal testing")
    && mobileReleaseGuide.includes("TestFlight")
    && mobileReleaseGuide.includes("make -C 03-Mobile-App build-production-appbundle")
    && mobileReleaseGuide.includes("make -C 03-Mobile-App build-production-ipa"),
  "Mobile release guide must require approvals and internal testing before store rollout"
);
assert.ok(
  mobileStoreChecklist.includes("flutter build appbundle --flavor production")
    && mobileStoreChecklist.includes("flutter build ipa --flavor production")
    && mobileStoreChecklist.includes("03-Mobile-App/android")
    && mobileStoreChecklist.includes("03-Mobile-App/ios")
    && mobileStoreChecklist.includes("03-Mobile-App/NATIVE_RELEASE_READINESS.md")
    && mobileStoreChecklist.includes("PrivacyRedactor")
    && mobileStoreChecklist.includes("Play internal testing")
    && mobileStoreChecklist.includes("TestFlight")
    && mobileStoreChecklist.includes("do not automatically release production builds"),
  "Mobile store checklist must cover build, privacy, QA, and manual release gates"
);
assert.ok(
  mobileEnvExample.includes("AIN_FLAVOR=development")
    && mobileEnvExample.includes("AIN_API_BASE_URL=http://localhost:8000/api/v1")
    && mobileEnvExample.includes("AIN_ALLOW_MOCK_DATA=false")
    && mobileEnvExample.includes("AIN_FLAVOR=production"),
  "Mobile environment example must document development, staging, and production defines without secrets"
);
assert.ok(
  mobileNavigationDoc.includes("Public Routes")
    && mobileNavigationDoc.includes("Authenticated Routes")
    && mobileNavigationDoc.includes("/register")
    && mobileNavigationDoc.includes("/invite/:token")
    && mobileNavigationDoc.includes("/organization/overview")
    && mobileNavigationDoc.includes("/organization/courses")
    && mobileNavigationDoc.includes("/organization/bookings")
    && mobileNavigationDoc.includes("/organization/content")
    && mobileNavigationDoc.includes("/organization/profile")
    && mobileNavigationDoc.includes("/organization/invitations")
    && mobileNavigationDoc.includes("/organization/rooms")
    && mobileNavigationDoc.includes("/organization/announcements")
    && mobileNavigationDoc.includes("/organization/attendance")
    && mobileNavigationDoc.includes("/organization/events")
    && mobileNavigationDoc.includes("/organization/instructors")
    && mobileNavigationDoc.includes("/organization/promotions")
    && mobileNavigationDoc.includes("/organization/analytics")
    && mobileNavigationDoc.includes("/organization/tasks")
    && mobileNavigationDoc.includes("/organization/members")
    && mobileNavigationDoc.includes("/my-courses/enrollments/:enrollmentId")
    && mobileNavigationDoc.includes("/attendance")
    && mobileNavigationDoc.includes("/profile")
    && mobileNavigationDoc.includes("/access-denied")
    && mobileNavigationDoc.includes("/platform/overview")
    && mobileNavigationDoc.includes("/platform/academy-approvals")
    && mobileNavigationDoc.includes("/platform/categories")
    && mobileNavigationDoc.includes("/platform/course-approvals")
    && mobileNavigationDoc.includes("/platform/promotion-approvals")
    && mobileNavigationDoc.includes("permission or module explanation")
    && mobileNavigationDoc.includes("Shows the current user from `/auth/me`")
    && mobileNavigationDoc.includes("Combines active student course schedules")
    && mobileNavigationDoc.includes("membership.permissions")
    && mobileNavigationDoc.includes("subscription.plan.modules")
    && mobileAppRouter.includes("_organizationRoutePermissions")
    && mobileAppRouter.includes("_organizationRouteModules")
    && mobileAppRouter.includes("activeWorkspaceControllerProvider")
    && mobileAppRouter.includes("AccessDeniedPage.routePath")
    && mobileAppRouter.includes("'reason': reason")
    && mobileAppRouter.includes("canUseFeature")
    && mobileActiveWorkspaceController.includes("List<String> get permissions")
    && mobileActiveWorkspaceController.includes("Set<String> get enabledModules")
    && mobileActiveWorkspaceController.includes("WorkspaceSubscriptionSummary? get subscription")
    && mobileActiveWorkspaceController.includes("hasEnabledModule")
    && mobileActiveWorkspaceController.includes("canUseFeature"),
  "Mobile navigation documentation and router must describe and enforce organization route guards"
);
assert.ok(
  mobilePlayStoreReleaseDoc.includes("Do not upload to production without explicit approval")
    && mobilePlayStoreReleaseDoc.includes("Disable cleartext traffic for production")
    && mobilePlayStoreReleaseDoc.includes("Configure verified app links"),
  "Play Store release documentation must include approval, network, and app-link requirements"
);
assert.ok(
  mobileAppStoreReleaseDoc.includes("Do not release to App Store production without explicit approval")
    && mobileAppStoreReleaseDoc.includes("associated domains")
    && mobileAppStoreReleaseDoc.includes("Keychain storage and file protection"),
  "App Store release documentation must include approval, universal-link, and storage requirements"
);
assert.ok(
  mobileKnownLimitationsDoc.includes("Flutter SDK")
    && mobileKnownLimitationsDoc.includes("Native `android/` and `ios/` folders")
    && mobileKnownLimitationsDoc.includes("Route and Home navigation guards")
    && mobileKnownLimitationsDoc.includes("Course, batch, room")
    && mobileKnownLimitationsDoc.includes("Remaining detailed organization action"),
  "Mobile known limitations must state current build, native, and action guard gaps"
);
assert.ok(
  mobileAuthController.includes("authRepositoryProvider")
    && mobileAuthController.includes("installationIdProvider")
    && mobileAuthController.includes("apiErrorMapperProvider")
    && mobileAuthController.includes("TelemetryEvent.loginSuccess")
    && mobileAuthController.includes("register({")
    && mobileAuthController.includes("verifyEmail({")
    && mobileAuthController.includes("requestPasswordReset")
    && mobileAuthController.includes("acceptInvitation")
    && !mobileAuthController.includes("markAuthenticated"),
  "Mobile auth controller must use the backend auth repository without fake sign-in"
);
assert.ok(
  mobileAuthRepository.includes("'/auth/login'")
    && mobileAuthRepository.includes("'/auth/register'")
    && mobileAuthRepository.includes("'/auth/verify-email'")
    && mobileAuthRepository.includes("'/auth/forgot-password'")
    && mobileAuthRepository.includes("'/auth/reset-password'")
    && mobileAuthRepository.includes("'/auth/me'")
    && mobileAuthRepository.includes("currentUser()")
    && mobileAuthRepository.includes("updateProfile(")
    && mobileAuthRepository.includes("CurrentUserProfile")
    && mobileAuthRepository.includes("UpdateUserProfileCommand")
    && mobileAuthRepository.includes("AuthUserWorkspace")
    && mobileAuthRepository.includes("listSessions()")
    && mobileAuthRepository.includes("revokeSession(String sessionId)")
    && mobileAuthRepository.includes("revokeOtherSessions()")
    && mobileAuthRepository.includes("UserSessionSummary")
    && mobileAuthRepository.includes("'/auth/sessions/others'")
    && mobileAuthRepository.includes("'/public/invitations/")
    && mobileAuthRepository.includes("'/invitations/accept'")
    && mobileAuthRepository.includes("'/auth/refresh'")
    && mobileAuthRepository.includes("refreshToken")
    && mobileAuthRepository.includes("writeTokens")
    && mobileAuthRepository.includes("skipRefreshExtraKey")
    && mobileAuthRepository.includes("installationId"),
  "Mobile auth repository must call real auth completion endpoints and persist tokens securely"
);
assert.ok(
  mobileProfileController.includes("currentUserProfileProvider")
    && mobileProfileController.includes("authRepositoryProvider")
    && mobileProfileController.includes("currentUser()")
    && mobileProfileController.includes("userSessionsProvider")
    && mobileProfileController.includes("listSessions()")
    && mobileProfileController.includes("ProfileActions")
    && mobileProfileController.includes("UpdateUserProfileCommand")
    && mobileProfileController.includes("revokeSession(String sessionId)")
    && mobileProfileController.includes("revokeOtherSessions()")
    && mobileProfileController.includes("currentUserProfileProvider"),
  "Mobile profile controller must expose current user and update actions"
);
assert.ok(
  mobileProfilePage.includes("ProfilePage")
    && mobileProfilePage.includes("static const routePath = '/profile'")
    && mobileProfilePage.includes("currentUserProfileProvider")
    && mobileProfilePage.includes("UpdateUserProfileCommand")
    && mobileProfilePage.includes("DropdownButtonFormField<String>")
    && mobileProfilePage.includes("WorkspaceSelectionPage.routePath")
    && mobileProfilePage.includes("notificationPreferencesProvider")
    && mobileProfilePage.includes("UpdateNotificationPreferencesCommand.fromPreferences")
    && mobileProfilePage.includes("SwitchListTile")
    && mobileProfilePage.includes("notificationPreferenceActionsProvider")
    && mobileProfilePage.includes("userSessionsProvider")
    && mobileProfilePage.includes("activeSessions")
    && mobileProfilePage.includes("revokeOtherSessions()")
    && mobileProfilePage.includes("revokeSession(session.id)")
    && mobileProfilePage.includes("authControllerProvider.notifier")
    && mobileProfilePage.includes("signOut()")
    && mobileAppRouter.includes("ProfilePage.routePath")
    && mobileHomePage.includes("ProfilePage.routePath"),
  "Mobile profile page must be routed and update /auth/me profile settings"
);
assert.ok(
  mobileAuthFlowPages.includes("class RegisterPage")
    && mobileAuthFlowPages.includes("class VerifyEmailPage")
    && mobileAuthFlowPages.includes("class ForgotPasswordPage")
    && mobileAuthFlowPages.includes("class ResetPasswordPage")
    && mobileAuthFlowPages.includes("class InvitationPage")
    && mobileAuthFlowPages.includes("authControllerProvider.notifier")
    && mobileAuthFlowPages.includes("previewInvitation(token)")
    && mobileAuthFlowPages.includes("acceptInvitation(token)")
    && mobileAuthFlowPages.includes("_loginRoutePath"),
  "Mobile auth flow pages must expose backend-connected registration, reset, and invitation screens"
);
assert.ok(
  mobileLoginPage.includes("ForgotPasswordPage.routePath")
    && mobileLoginPage.includes("RegisterPage.routePath")
    && mobileAppRouter.includes("RegisterPage.routePath")
    && mobileAppRouter.includes("VerifyEmailPage.routePath")
    && mobileAppRouter.includes("ForgotPasswordPage.routePath")
    && mobileAppRouter.includes("ResetPasswordPage.routePath")
    && mobileAppRouter.includes("InvitationPage.routePath")
    && mobileAppRouter.includes("state.uri.path.startsWith('/invite/')"),
  "Mobile router and login page must expose auth completion and invitation routes"
);
assert.ok(
  mobileOrganizationBookingRepository.includes("'/organizations/$organizationId/bookings'")
    && mobileOrganizationBookingRepository.includes("confirmBooking")
    && mobileOrganizationBookingRepository.includes("rejectBooking")
    && mobileOrganizationBookingRepository.includes("cancelBooking")
    && mobileOrganizationBookingRepository.includes("OrganizationBookingSummary")
    && mobileOrganizationBookingRepository.includes("markAsPaid"),
  "Mobile organization booking repository must call real list and decision endpoints"
);
assert.ok(
  mobileOrganizationBookingController.includes("organizationBookingsProvider")
    && mobileOrganizationBookingController.includes("FutureProvider.autoDispose")
    && mobileOrganizationBookingController.includes("OrganizationBookingActions")
    && mobileOrganizationBookingController.includes("ref.invalidate(organizationBookingsProvider(organizationId))"),
  "Mobile organization booking controller must expose list and action providers"
);
assert.ok(
  mobileOrganizationBookingsPage.includes("OrganizationBookingsPage")
    && mobileOrganizationBookingsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationBookingsPage.includes("organizationBookingsProvider")
    && mobileOrganizationBookingsPage.includes("workspace.hasAnyPermission({'bookings.confirm'})")
    && mobileOrganizationBookingsPage.includes("workspace.hasAnyPermission({'bookings.manage'})")
    && mobileOrganizationBookingsPage.includes("workspace.hasAnyPermission({'bookings.cancel'})")
    && mobileOrganizationBookingsPage.includes("confirmBooking")
    && mobileOrganizationBookingsPage.includes("rejectBooking")
    && mobileOrganizationBookingsPage.includes("cancelBooking")
    && mobileAppRouter.includes("OrganizationBookingsPage.routePath")
    && mobileHomePage.includes("OrganizationBookingsPage.routePath"),
  "Mobile organization booking page must be routed and permission-guard backend decision actions"
);
assert.ok(
  mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/courses'")
    && mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/batches'")
    && mobileOrganizationCourseRepository.includes("Future.wait")
    && mobileOrganizationCourseRepository.includes("createCourse({")
    && mobileOrganizationCourseRepository.includes("updateCourse({")
    && mobileOrganizationCourseRepository.includes("submitCourseForReview({")
    && mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/courses/$courseId'")
    && mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/courses/$courseId/submit-review'")
    && mobileOrganizationCourseRepository.includes("createBatch({")
    && mobileOrganizationCourseRepository.includes("updateBatch({")
    && mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/batches/$batchId'")
    && mobileOrganizationCourseRepository.includes("CreateOrganizationCourseCommand")
    && mobileOrganizationCourseRepository.includes("description")
    && mobileOrganizationCourseRepository.includes("CreateOrganizationBatchCommand")
    && mobileOrganizationCourseRepository.includes("OrganizationBatchScheduleSlot")
    && mobileOrganizationCourseRepository.includes("OrganizationBatchScheduleSlot.fromJson")
    && mobileOrganizationCourseRepository.includes("roomId")
    && mobileOrganizationCourseRepository.includes("OrganizationCoursesOverview")
    && mobileOrganizationCourseRepository.includes("OrganizationCourseSummary")
    && mobileOrganizationCourseRepository.includes("OrganizationBatchSummary")
    && mobileOrganizationCourseRepository.includes("remainingSeats"),
  "Mobile organization course repository must load, create, update, and submit real courses and create/update batches"
);
assert.ok(
  mobileOrganizationCourseController.includes("organizationCoursesOverviewProvider")
    && mobileOrganizationCourseController.includes("FutureProvider.autoDispose")
    && mobileOrganizationCourseController.includes("getOverview(organizationId: organizationId)")
    && mobileOrganizationCourseController.includes("organizationCourseActionsProvider")
    && mobileOrganizationCourseController.includes("createCourse({")
    && mobileOrganizationCourseController.includes("updateCourse({")
    && mobileOrganizationCourseController.includes("submitCourseForReview({")
    && mobileOrganizationCourseController.includes("createBatch({")
    && mobileOrganizationCourseController.includes("updateBatch({")
    && mobileOrganizationCourseController.includes("_ref.invalidate(organizationCoursesOverviewProvider(organizationId))"),
  "Mobile organization course controller must expose courses overview and course/batch mutation providers"
);
assert.ok(
  mobileOrganizationCoursesPage.includes("OrganizationCoursesPage")
    && mobileOrganizationCoursesPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationCoursesPage.includes("organizationCoursesOverviewProvider")
    && mobileOrganizationCoursesPage.includes("requiredPermissions: {'courses.create'}")
    && mobileOrganizationCoursesPage.includes("requiredPermissions: {'courses.update'}")
    && mobileOrganizationCoursesPage.includes("requiredPermissions: {'courses.publish'}")
    && mobileOrganizationCoursesPage.includes("requiredPermissions: {'batches.manage'}")
    && mobileOrganizationCoursesPage.includes("requiredModule: 'courses'")
    && mobileOrganizationCoursesPage.includes("canManageBatches")
    && mobileOrganizationCoursesPage.includes("FloatingActionButton.extended")
    && mobileOrganizationCoursesPage.includes("_CreateCourseSheet")
    && mobileOrganizationCoursesPage.includes("_CreateBatchSheet")
    && mobileOrganizationCoursesPage.includes("organizationRoomsProvider")
    && mobileOrganizationCoursesPage.includes("CreateOrganizationCourseCommand")
    && mobileOrganizationCoursesPage.includes("submitCourseForReview")
    && mobileOrganizationCoursesPage.includes("strings.editCourse")
    && mobileOrganizationCoursesPage.includes("strings.submitForReview")
    && mobileOrganizationCoursesPage.includes("strings.editBatch")
    && mobileOrganizationCoursesPage.includes("strings.batchUpdated")
    && mobileOrganizationCoursesPage.includes("_fullDescriptionController")
    && mobileOrganizationCoursesPage.includes("CreateOrganizationBatchCommand")
    && mobileOrganizationCoursesPage.includes("OrganizationBatchScheduleSlot")
    && mobileOrganizationCoursesPage.includes("batch: batch")
    && mobileOrganizationCoursesPage.includes("updateBatch")
    && mobileOrganizationCoursesPage.includes("batchesForCourse(course.id)")
    && mobileOrganizationCoursesPage.includes("courseStatusLabel")
    && mobileAppRouter.includes("OrganizationCoursesPage.routePath")
    && mobileHomePage.includes("OrganizationCoursesPage.routePath"),
  "Mobile organization courses page must be routed and permission-guard course list/create/update/review and batch create/update actions"
);
assert.ok(
  mobileOrganizationInstructorRepository.includes(
    "'/organizations/$organizationId/instructors'"
  )
    && mobileOrganizationInstructorRepository.includes(
      "'/organizations/$organizationId/instructor-slots'"
    )
    && mobileOrganizationInstructorRepository.includes(
      "'/organizations/$organizationId/instructors/$instructorId'"
    )
    && mobileOrganizationInstructorRepository.includes("Future.wait")
    && mobileOrganizationInstructorRepository.includes("createInstructor({")
    && mobileOrganizationInstructorRepository.includes("updateInstructor({")
    && mobileOrganizationInstructorRepository.includes("createSlot({")
    && mobileOrganizationInstructorRepository.includes(
      "CreateOrganizationInstructorCommand"
    )
    && mobileOrganizationInstructorRepository.includes(
      "CreateOrganizationInstructorSlotCommand"
    )
    && mobileOrganizationInstructorRepository.includes(
      "OrganizationInstructorsOverview"
    )
    && mobileOrganizationInstructorRepository.includes(
      "OrganizationInstructorSlotSummary"
    ),
  "Mobile organization instructor repository must load and mutate instructor profiles and slots"
);
assert.ok(
  mobileOrganizationInstructorController.includes(
    "organizationInstructorsOverviewProvider"
  )
    && mobileOrganizationInstructorController.includes("FutureProvider.autoDispose")
    && mobileOrganizationInstructorController.includes(
      "organizationInstructorActionsProvider"
    )
    && mobileOrganizationInstructorController.includes("createInstructor({")
    && mobileOrganizationInstructorController.includes("updateInstructor({")
    && mobileOrganizationInstructorController.includes("createSlot({")
    && mobileOrganizationInstructorController.includes(
      "organizationInstructorsOverviewProvider(organizationId)"
    ),
  "Mobile organization instructor controller must expose overview and mutation providers"
);
assert.ok(
  mobileOrganizationInstructorsPage.includes("OrganizationInstructorsPage")
    && mobileOrganizationInstructorsPage.includes(
      "static const routePath = '/organization/instructors'"
    )
    && mobileOrganizationInstructorsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationInstructorsPage.includes(
      "organizationInstructorsOverviewProvider"
    )
    && mobileOrganizationInstructorsPage.includes(
      "requiredPermissions: {'courses.create'}"
    )
    && mobileOrganizationInstructorsPage.includes(
      "requiredPermissions: {'courses.update'}"
    )
    && mobileOrganizationInstructorsPage.includes("requiredModule: 'courses'")
    && mobileOrganizationInstructorsPage.includes("showModalBottomSheet")
    && mobileOrganizationInstructorsPage.includes(
      "CreateOrganizationInstructorCommand"
    )
    && mobileOrganizationInstructorsPage.includes(
      "CreateOrganizationInstructorSlotCommand"
    )
    && mobileOrganizationInstructorsPage.includes("showDatePicker")
    && mobileOrganizationInstructorsPage.includes("showTimePicker")
    && mobileAppRouter.includes("OrganizationInstructorsPage.routePath")
    && mobileHomePage.includes("OrganizationInstructorsPage.routePath"),
  "Mobile organization instructors page must be routed and permission-guard instructor profile and slot actions"
);
assert.ok(
  mobileOrganizationInvitationRepository.includes("'/organizations/$organizationId/invitations'")
    && mobileOrganizationInvitationRepository.includes("createInvitation")
    && mobileOrganizationInvitationRepository.includes("resendInvitation")
    && mobileOrganizationInvitationRepository.includes("cancelInvitation")
    && mobileOrganizationInvitationRepository.includes("CreateOrganizationInvitationCommand")
    && mobileOrganizationInvitationRepository.includes("OrganizationInvitationCommandResult"),
  "Mobile organization invitation repository must call real invitation list and action endpoints"
);
assert.ok(
  mobileOrganizationInvitationController.includes("organizationInvitationsProvider")
    && mobileOrganizationInvitationController.includes("FutureProvider.autoDispose")
    && mobileOrganizationInvitationController.includes("OrganizationInvitationActions")
    && mobileOrganizationInvitationController.includes("organizationInvitationsProvider(organizationId)"),
  "Mobile organization invitation controller must expose list and action providers"
);
assert.ok(
  mobileOrganizationInvitationsPage.includes("OrganizationInvitationsPage")
    && mobileOrganizationInvitationsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationInvitationsPage.includes("organizationInvitationsProvider")
    && mobileOrganizationInvitationsPage.includes("requiredPermissions: {'members.invite'}")
    && mobileOrganizationInvitationsPage.includes("requiredModule: 'members'")
    && mobileOrganizationInvitationsPage.includes("canInvite")
    && mobileOrganizationInvitationsPage.includes("showModalBottomSheet")
    && mobileOrganizationInvitationsPage.includes("CreateOrganizationInvitationCommand")
    && mobileOrganizationInvitationsPage.includes("resend(")
    && mobileOrganizationInvitationsPage.includes("cancel(")
    && mobileAppRouter.includes("OrganizationInvitationsPage.routePath")
    && mobileHomePage.includes("OrganizationInvitationsPage.routePath"),
  "Mobile organization invitations page must be routed and permission-guard invite/resend/cancel actions"
);
assert.ok(
  mobileOrganizationRoomRepository.includes("'/organizations/$organizationId/rooms'")
    && mobileOrganizationRoomRepository.includes("listRooms")
    && mobileOrganizationRoomRepository.includes("createRoom")
    && mobileOrganizationRoomRepository.includes("updateRoom")
    && mobileOrganizationRoomRepository.includes("deleteRoom")
    && mobileOrganizationRoomRepository.includes("listRoomMembers")
    && mobileOrganizationRoomRepository.includes("addRoomMember")
    && mobileOrganizationRoomRepository.includes("updateRoomMember")
    && mobileOrganizationRoomRepository.includes("removeRoomMember")
    && mobileOrganizationRoomRepository.includes("CreateOrganizationRoomCommand")
    && mobileOrganizationRoomRepository.includes("UpdateOrganizationRoomCommand")
    && mobileOrganizationRoomRepository.includes("CreateRoomMemberCommand")
    && mobileOrganizationRoomRepository.includes("UpdateRoomMemberCommand")
    && mobileOrganizationRoomRepository.includes("OrganizationRoomSummary")
    && mobileOrganizationRoomRepository.includes("OrganizationRoomMemberSummary")
    && mobileOrganizationRoomRepository.includes("membershipsCount"),
  "Mobile organization room repository must call real room and room-member endpoints"
);
assert.ok(
  mobileOrganizationRoomController.includes("organizationRoomsProvider")
    && mobileOrganizationRoomController.includes("organizationRoomMembersProvider")
    && mobileOrganizationRoomController.includes("FutureProvider.autoDispose")
    && mobileOrganizationRoomController.includes("OrganizationRoomActions")
    && mobileOrganizationRoomController.includes("update({")
    && mobileOrganizationRoomController.includes("delete({")
    && mobileOrganizationRoomController.includes("addMember({")
    && mobileOrganizationRoomController.includes("updateMember({")
    && mobileOrganizationRoomController.includes("removeMember({")
    && mobileOrganizationRoomController.includes("organizationRoomsProvider(organizationId)"),
  "Mobile organization room controller must expose room and room-member providers"
);
assert.ok(
  mobileOrganizationRoomsPage.includes("OrganizationRoomsPage")
    && mobileOrganizationRoomsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationRoomsPage.includes("organizationRoomsProvider")
    && mobileOrganizationRoomsPage.includes("requiredPermissions: {'rooms.create'}")
    && mobileOrganizationRoomsPage.includes("requiredPermissions: {'rooms.update'}")
    && mobileOrganizationRoomsPage.includes("requiredPermissions: {'rooms.delete'}")
    && mobileOrganizationRoomsPage.includes("requiredModule: 'rooms'")
    && mobileOrganizationRoomsPage.includes("canUpdateMembers")
    && mobileOrganizationRoomsPage.includes("showModalBottomSheet")
    && mobileOrganizationRoomsPage.includes("CreateOrganizationRoomCommand")
    && mobileOrganizationRoomsPage.includes("UpdateOrganizationRoomCommand")
    && mobileOrganizationRoomsPage.includes("createRoom")
    && mobileOrganizationRoomsPage.includes("editRoom")
    && mobileOrganizationRoomsPage.includes("deleteRoom")
    && mobileOrganizationRoomsPage.includes("_RoomMembersSheet")
    && mobileOrganizationRoomsPage.includes("organizationRoomMembersProvider")
    && mobileOrganizationRoomsPage.includes("addMember")
    && mobileOrganizationRoomsPage.includes("updateMember")
    && mobileOrganizationRoomsPage.includes("removeMember")
    && mobileOrganizationRoomsPage.includes("_confirmDelete")
    && mobileAppRouter.includes("OrganizationRoomsPage.routePath")
    && mobileHomePage.includes("OrganizationRoomsPage.routePath"),
  "Mobile organization rooms page must be routed and permission-guard room list/create/update/delete/member actions"
);
assert.ok(
  mobileOrganizationAnnouncementRepository.includes(
    "'/organizations/$organizationId/announcements'"
  )
    && mobileOrganizationAnnouncementRepository.includes("listAnnouncements")
    && mobileOrganizationAnnouncementRepository.includes("createAnnouncement")
    && mobileOrganizationAnnouncementRepository.includes("updateAnnouncement")
    && mobileOrganizationAnnouncementRepository.includes("deleteAnnouncement")
    && mobileOrganizationAnnouncementRepository.includes(
      "CreateOrganizationAnnouncementCommand"
    )
    && mobileOrganizationAnnouncementRepository.includes(
      "UpdateOrganizationAnnouncementCommand"
    )
    && mobileOrganizationAnnouncementRepository.includes(
      "OrganizationAnnouncementSummary"
    )
    && mobileOrganizationAnnouncementRepository.includes("roomId")
    && mobileOrganizationAnnouncementRepository.includes("audience")
    && mobileOrganizationAnnouncementRepository.includes("publishedAt"),
  "Mobile organization announcement repository must call real announcement list/create/update/delete endpoints"
);
assert.ok(
  mobileOrganizationAnnouncementController.includes(
    "organizationAnnouncementsProvider"
  )
    && mobileOrganizationAnnouncementController.includes(
      "FutureProvider.autoDispose"
    )
    && mobileOrganizationAnnouncementController.includes(
      "OrganizationAnnouncementActions"
    )
    && mobileOrganizationAnnouncementController.includes("update({")
    && mobileOrganizationAnnouncementController.includes("delete({")
    && mobileOrganizationAnnouncementController.includes(
      "organizationAnnouncementsProvider(organizationId)"
    ),
  "Mobile organization announcement controller must expose list and mutation providers"
);
assert.ok(
  mobileOrganizationAnnouncementsPage.includes("OrganizationAnnouncementsPage")
    && mobileOrganizationAnnouncementsPage.includes(
      "activeWorkspaceControllerProvider"
    )
    && mobileOrganizationAnnouncementsPage.includes(
      "organizationAnnouncementsProvider"
    )
    && mobileOrganizationAnnouncementsPage.includes("requiredPermissions: {'announcements.create'}")
    && mobileOrganizationAnnouncementsPage.includes("requiredPermissions: {'announcements.update'}")
    && mobileOrganizationAnnouncementsPage.includes("requiredPermissions: {'announcements.delete'}")
    && mobileOrganizationAnnouncementsPage.includes("requiredModule: 'announcements'")
    && mobileOrganizationAnnouncementsPage.includes("showModalBottomSheet")
    && mobileOrganizationAnnouncementsPage.includes(
      "CreateOrganizationAnnouncementCommand"
    )
    && mobileOrganizationAnnouncementsPage.includes(
      "UpdateOrganizationAnnouncementCommand"
    )
    && mobileOrganizationAnnouncementsPage.includes("editAnnouncement")
    && mobileOrganizationAnnouncementsPage.includes("deleteAnnouncement")
    && mobileOrganizationAnnouncementsPage.includes("_confirmDelete")
    && mobileOrganizationAnnouncementsPage.includes("pinAnnouncement")
    && mobileOrganizationAnnouncementsPage.includes("SegmentedButton<String>")
    && mobileOrganizationAnnouncementsPage.includes("organizationRoomsProvider")
    && mobileOrganizationAnnouncementsPage.includes("strings.targetRoom")
    && mobileOrganizationAnnouncementsPage.includes("roomRequiredForAnnouncement")
    && mobileOrganizationAnnouncementsPage.includes("_audience == 'room' ? _roomId : null")
    && mobileAppRouter.includes("OrganizationAnnouncementsPage.routePath")
    && mobileHomePage.includes("OrganizationAnnouncementsPage.routePath"),
  "Mobile organization announcements page must be routed and expose announcement list/create/update/delete/target actions"
);
assert.ok(
  mobileOrganizationAttendanceRepository.includes(
    "'/organizations/$organizationId/learning-sessions'"
  )
    && mobileOrganizationAttendanceRepository.includes(
      "'/organizations/$organizationId/learning-sessions/$sessionId/attendance'"
    )
    && mobileOrganizationAttendanceRepository.includes(
      "'/organizations/$organizationId/learning-sessions/$sessionId/attendance/lock'"
    )
    && mobileOrganizationAttendanceRepository.includes(
      "'/organizations/$organizationId/learning-sessions/$sessionId/attendance/qr'"
    )
    && mobileOrganizationAttendanceRepository.includes("OrganizationAttendanceSheet")
    && mobileOrganizationAttendanceRepository.includes(
      "OrganizationAttendanceParticipant"
    )
    && mobileOrganizationAttendanceRepository.includes(
      "OrganizationAttendanceMarkRecord"
    )
    && mobileOrganizationAttendanceRepository.includes("OrganizationAttendanceQrCode"),
  "Mobile organization attendance repository must call real session attendance endpoints"
);
assert.ok(
  mobileOrganizationAttendanceController.includes(
    "organizationAttendanceSessionsProvider"
  )
    && mobileOrganizationAttendanceController.includes(
      "organizationAttendanceSheetProvider"
    )
    && mobileOrganizationAttendanceController.includes(
      "organizationAttendanceActionsProvider"
    )
    && mobileOrganizationAttendanceController.includes("FutureProvider.autoDispose")
    && mobileOrganizationAttendanceController.includes("mark({")
    && mobileOrganizationAttendanceController.includes("lock({")
    && mobileOrganizationAttendanceController.includes("generateQr({"),
  "Mobile organization attendance controller must expose list, sheet, mark, lock, and QR providers"
);
assert.ok(
  mobileOrganizationAttendancePage.includes("OrganizationAttendancePage")
    && mobileOrganizationAttendancePage.includes(
      "static const routePath = '/organization/attendance'"
    )
    && mobileOrganizationAttendancePage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationAttendancePage.includes(
      "organizationAttendanceSessionsProvider"
    )
    && mobileOrganizationAttendancePage.includes(
      "organizationAttendanceSheetProvider"
    )
    && mobileOrganizationAttendancePage.includes(
      "requiredPermissions: {'attendance.manage'}"
    )
    && mobileOrganizationAttendancePage.includes("requiredModule: 'attendance'")
    && mobileOrganizationAttendancePage.includes("ChoiceChip")
    && mobileOrganizationAttendancePage.includes("OrganizationAttendanceMarkRecord")
    && mobileOrganizationAttendancePage.includes("generateQr")
    && mobileOrganizationAttendancePage.includes("lock(")
    && mobileOrganizationAttendancePage.includes("Clipboard.setData")
    && mobileAppRouter.includes("OrganizationAttendancePage.routePath")
    && mobileHomePage.includes("OrganizationAttendancePage.routePath"),
  "Mobile organization attendance page must be routed and permission-guard session marking, QR, and lock actions"
);
assert.ok(
  mobileOrganizationPromotionRepository.includes(
    "'/organizations/$organizationId/promotions'"
  )
    && mobileOrganizationPromotionRepository.includes("listPromotions")
    && mobileOrganizationPromotionRepository.includes("createPromotion")
    && mobileOrganizationPromotionRepository.includes(
      "CreateOrganizationPromotionCommand"
    )
    && mobileOrganizationPromotionRepository.includes(
      "OrganizationPromotionSummary"
    )
    && mobileOrganizationPromotionRepository.includes("PromotionCourseSummary")
    && mobileOrganizationPromotionRepository.includes("bookingConversions"),
  "Mobile organization promotion repository must call real promotion list and create endpoints"
);
assert.ok(
  mobileOrganizationPromotionController.includes("organizationPromotionsProvider")
    && mobileOrganizationPromotionController.includes("FutureProvider.autoDispose")
    && mobileOrganizationPromotionController.includes(
      "organizationPromotionActionsProvider"
    )
    && mobileOrganizationPromotionController.includes("create({")
    && mobileOrganizationPromotionController.includes(
      "organizationPromotionsProvider(organizationId)"
    ),
  "Mobile organization promotion controller must expose list and create providers"
);
assert.ok(
  mobileOrganizationPromotionsPage.includes("OrganizationPromotionsPage")
    && mobileOrganizationPromotionsPage.includes(
      "static const routePath = '/organization/promotions'"
    )
    && mobileOrganizationPromotionsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationPromotionsPage.includes("organizationPromotionsProvider")
    && mobileOrganizationPromotionsPage.includes(
      "organizationCoursesOverviewProvider"
    )
    && mobileOrganizationPromotionsPage.includes(
      "requiredPermissions: {'promotions.manage'}"
    )
    && mobileOrganizationPromotionsPage.includes("requiredModule: 'promotions'")
    && mobileOrganizationPromotionsPage.includes("showModalBottomSheet")
    && mobileOrganizationPromotionsPage.includes(
      "CreateOrganizationPromotionCommand"
    )
    && mobileOrganizationPromotionsPage.includes("showDatePicker")
    && mobileAppRouter.includes("OrganizationPromotionsPage.routePath")
    && mobileHomePage.includes("OrganizationPromotionsPage.routePath"),
  "Mobile organization promotions page must be routed and permission-guard promotion list/create actions"
);
assert.ok(
  mobileOrganizationAnalyticsRepository.includes(
    "'/organizations/$organizationId/analytics/overview'"
  )
    && mobileOrganizationAnalyticsRepository.includes(
      "OrganizationAnalyticsOverview"
    )
    && mobileOrganizationAnalyticsRepository.includes(
      "OrganizationAnalyticsMetrics"
    )
    && mobileOrganizationAnalyticsRepository.includes("bookingConversionRate")
    && mobileOrganizationAnalyticsRepository.includes("confirmedRevenueMinor"),
  "Mobile organization analytics repository must call the real analytics overview endpoint"
);
assert.ok(
  mobileOrganizationAnalyticsController.includes("organizationAnalyticsProvider")
    && mobileOrganizationAnalyticsController.includes(
      "FutureProvider.autoDispose"
    )
    && mobileOrganizationAnalyticsController.includes(
      "OrganizationAnalyticsRequest"
    ),
  "Mobile organization analytics controller must expose the overview provider"
);
assert.ok(
  mobileOrganizationAnalyticsPage.includes("OrganizationAnalyticsPage")
    && mobileOrganizationAnalyticsPage.includes(
      "static const routePath = '/organization/analytics'"
    )
    && mobileOrganizationAnalyticsPage.includes(
      "activeWorkspaceControllerProvider"
    )
    && mobileOrganizationAnalyticsPage.includes("organizationAnalyticsProvider")
    && mobileOrganizationAnalyticsPage.includes("showDateRangePicker")
    && mobileAppRouter.includes("OrganizationAnalyticsPage.routePath")
    && mobileAppRouter.includes("OrganizationAnalyticsPage.routePath: {'analytics.view'}")
    && mobileAppRouter.includes("OrganizationAnalyticsPage.routePath: 'analytics'")
    && mobileHomePage.includes("OrganizationAnalyticsPage.routePath")
    && (mobileHomePage.includes("requiredModule: 'analytics'")
      || mobileHomePage.includes("module: 'analytics'")),
  "Mobile organization analytics page must be routed and module-guarded"
);
assert.ok(
  mobileOrganizationEventRepository.includes(
    "'/organizations/$organizationId/events'"
  )
    && mobileOrganizationEventRepository.includes("listEvents")
    && mobileOrganizationEventRepository.includes("createEvent")
    && mobileOrganizationEventRepository.includes("deleteEvent")
    && mobileOrganizationEventRepository.includes(
      "CreateOrganizationEventCommand"
    )
    && mobileOrganizationEventRepository.includes("OrganizationEventSummary")
    && mobileOrganizationEventRepository.includes("startsAt")
    && mobileOrganizationEventRepository.includes("roomId")
    && mobileOrganizationEventRepository.includes("meetingProvider"),
  "Mobile organization event repository must call real event list, create, and delete endpoints"
);
assert.ok(
  mobileOrganizationEventController.includes("organizationEventsProvider")
    && mobileOrganizationEventController.includes("FutureProvider.autoDispose")
    && mobileOrganizationEventController.includes("OrganizationEventsRequest")
    && mobileOrganizationEventController.includes("roomId: request.roomId")
    && mobileOrganizationEventController.includes("OrganizationEventActions")
    && mobileOrganizationEventController.includes("organizationEventsProvider"),
  "Mobile organization event controller must expose list, create, and delete providers"
);
assert.ok(
  mobileOrganizationEventsPage.includes("OrganizationEventsPage")
    && mobileOrganizationEventsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationEventsPage.includes("organizationEventsProvider")
    && mobileOrganizationEventsPage.includes("requiredPermissions: {'events.manage'}")
    && mobileOrganizationEventsPage.includes("requiredModule: 'calendar'")
    && mobileOrganizationEventsPage.includes("canManage")
    && mobileOrganizationEventsPage.includes("OrganizationEventsRequest")
    && mobileOrganizationEventsPage.includes("organizationRoomsProvider")
    && mobileOrganizationEventsPage.includes("strings.allRooms")
    && mobileOrganizationEventsPage.includes("showModalBottomSheet")
    && mobileOrganizationEventsPage.includes("CreateOrganizationEventCommand")
    && mobileOrganizationEventsPage.includes("deleteEvent")
    && mobileOrganizationEventsPage.includes("showDatePicker")
    && mobileOrganizationEventsPage.includes("showTimePicker")
    && mobileOrganizationEventsPage.includes("readOnly: true")
    && mobileOrganizationEventsPage.includes("roomId: _roomId")
    && mobileOrganizationEventsPage.includes("DateTime.tryParse")
    && mobileAppRouter.includes("OrganizationEventsPage.routePath")
    && mobileHomePage.includes("OrganizationEventsPage.routePath"),
  "Mobile organization events page must be routed and expose event list/create/delete/filter actions"
);
assert.ok(
  mobileOrganizationTaskRepository.includes(
    "'/organizations/$organizationId/tasks'"
  )
    && mobileOrganizationTaskRepository.includes("listTasks")
    && mobileOrganizationTaskRepository.includes("createTask")
    && mobileOrganizationTaskRepository.includes("updateTask")
    && mobileOrganizationTaskRepository.includes("deleteTask")
    && mobileOrganizationTaskRepository.includes("CreateOrganizationTaskCommand")
    && mobileOrganizationTaskRepository.includes("UpdateOrganizationTaskCommand")
    && mobileOrganizationTaskRepository.includes("OrganizationTaskSummary")
    && mobileOrganizationTaskRepository.includes("progress"),
  "Mobile organization task repository must call real task list, create, update, and delete endpoints"
);
assert.ok(
  mobileOrganizationTaskController.includes("organizationTasksProvider")
    && mobileOrganizationTaskController.includes("FutureProvider.autoDispose")
    && mobileOrganizationTaskController.includes("OrganizationTaskActions")
    && mobileOrganizationTaskController.includes(
      "organizationTasksProvider(organizationId)"
    ),
  "Mobile organization task controller must expose list, create, update, and delete providers"
);
assert.ok(
  mobileOrganizationTasksPage.includes("OrganizationTasksPage")
    && mobileOrganizationTasksPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationTasksPage.includes("organizationTasksProvider")
    && mobileOrganizationTasksPage.includes("requiredPermissions: {'events.manage'}")
    && mobileOrganizationTasksPage.includes("requiredModule: 'calendar'")
    && mobileOrganizationTasksPage.includes("canManage")
    && mobileOrganizationTasksPage.includes("showModalBottomSheet")
    && mobileOrganizationTasksPage.includes("CreateOrganizationTaskCommand")
    && mobileOrganizationTasksPage.includes("UpdateOrganizationTaskCommand")
    && mobileOrganizationTasksPage.includes("DropdownButtonFormField<String>")
    && mobileOrganizationTasksPage.includes("organizationRoomsProvider")
    && mobileOrganizationTasksPage.includes("organizationMembersProvider")
    && mobileOrganizationTasksPage.includes("strings.assignedTo")
    && mobileOrganizationTasksPage.includes("roomId: _roomId")
    && mobileOrganizationTasksPage.includes("assignedTo: _assignedTo")
    && mobileOrganizationTasksPage.includes("deleteTask")
    && mobileAppRouter.includes("OrganizationTasksPage.routePath")
    && mobileHomePage.includes("OrganizationTasksPage.routePath"),
  "Mobile organization tasks page must be routed and expose task list/create/update/delete/assignment actions"
);
assert.ok(
  mobileOrganizationMemberRepository.includes(
    "'/organizations/$organizationId/members'"
  )
    && mobileOrganizationMemberRepository.includes("listMembers")
    && mobileOrganizationMemberRepository.includes("updateMember")
    && mobileOrganizationMemberRepository.includes("removeMember")
    && mobileOrganizationMemberRepository.includes(
      "UpdateOrganizationMemberCommand"
    )
    && mobileOrganizationMemberRepository.includes("OrganizationMemberSummary")
    && mobileOrganizationMemberRepository.includes("avatarPath"),
  "Mobile organization member repository must call real member list, update, and remove endpoints"
);
assert.ok(
  mobileOrganizationMemberController.includes("organizationMembersProvider")
    && mobileOrganizationMemberController.includes("FutureProvider.autoDispose")
    && mobileOrganizationMemberController.includes("OrganizationMemberActions")
    && mobileOrganizationMemberController.includes(
      "organizationMembersProvider(organizationId)"
    ),
  "Mobile organization member controller must expose list, update, and remove providers"
);
assert.ok(
  mobileOrganizationMembersPage.includes("OrganizationMembersPage")
    && mobileOrganizationMembersPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationMembersPage.includes("organizationMembersProvider")
    && mobileOrganizationMembersPage.includes("workspace.hasAnyPermission({'members.update'})")
    && mobileOrganizationMembersPage.includes("workspace.hasAnyPermission({'members.remove'})")
    && mobileOrganizationMembersPage.includes("UpdateOrganizationMemberCommand")
    && mobileOrganizationMembersPage.includes("DropdownButtonFormField<String>")
    && mobileOrganizationMembersPage.includes("removeMember")
    && mobileOrganizationMembersPage.includes("organizationRoleLabel")
    && mobileAppRouter.includes("OrganizationMembersPage.routePath")
    && mobileHomePage.includes("OrganizationMembersPage.routePath"),
  "Mobile organization members page must be routed and permission-guard member update/remove actions"
);
assert.ok(
  mobileOrganizationOverviewPage.includes("OrganizationOverviewPage")
    && mobileOrganizationOverviewPage.includes("static const routePath = '/organization/overview'")
    && mobileOrganizationOverviewPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationOverviewPage.includes("refreshContext")
    && mobileOrganizationOverviewPage.includes("organizationCoursesOverviewProvider")
    && mobileOrganizationOverviewPage.includes("organizationBookingsProvider")
    && mobileOrganizationOverviewPage.includes("organizationMembersProvider")
    && mobileOrganizationOverviewPage.includes("organizationContentProvider")
    && mobileOrganizationOverviewPage.includes("organizationEventsProvider")
    && mobileOrganizationOverviewPage.includes("organizationTasksProvider")
    && mobileOrganizationOverviewPage.includes("pending_confirmation")
    && mobileOrganizationOverviewPage.includes("OrganizationProfilePage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationCoursesPage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationBookingsPage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationMembersPage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationAttendancePage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationInstructorsPage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationPromotionsPage.routePath")
    && mobileOrganizationOverviewPage.includes("OrganizationAnalyticsPage.routePath")
    && mobileAppRouter.includes("OrganizationOverviewPage.routePath")
    && mobileHomePage.includes("OrganizationOverviewPage.routePath"),
  "Mobile organization overview page must aggregate routed workspace operations"
);
assert.ok(
  mobileContentRepository.includes("createLinkContent")
    && mobileContentRepository.includes("createFileContent")
    && mobileContentRepository.includes("deleteContent")
    && mobileContentRepository.includes("CreateLinkContentCommand")
    && mobileContentRepository.includes("CreateFileContentCommand")
    && mobileContentRepository.includes("FormData.fromMap")
    && mobileContentRepository.includes("MultipartFile.fromBytes")
    && mobileContentRepository.includes("externalUrl")
    && mobileContentRepository.includes("'type': 'link'"),
  "Mobile content repository must support link/file content creation and deletion"
);
assert.ok(
  mobileOrganizationContentController.includes("organizationContentProvider")
    && mobileOrganizationContentController.includes("FutureProvider.autoDispose")
    && mobileOrganizationContentController.includes("OrganizationContentActions")
    && mobileOrganizationContentController.includes("createFile")
    && mobileOrganizationContentController.includes(
      "organizationContentProvider(organizationId)"
    ),
  "Mobile organization content controller must expose content list/create/delete providers"
);
assert.ok(
  mobileOrganizationContentPage.includes("OrganizationContentPage")
    && mobileOrganizationContentPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationContentPage.includes("requiredPermissions: {'content.create'}")
    && mobileOrganizationContentPage.includes("requiredPermissions: {'content.delete'}")
    && mobileOrganizationContentPage.includes("requiredModule: 'content'")
    && mobileOrganizationContentPage.includes("organizationContentProvider")
    && mobileOrganizationContentPage.includes("organizationRoomsProvider")
    && mobileOrganizationContentPage.includes("CreateLinkContentCommand")
    && mobileOrganizationContentPage.includes("CreateFileContentCommand")
    && mobileOrganizationContentPage.includes("FilePicker.platform.pickFiles")
    && mobileOrganizationContentPage.includes("SegmentedButton<String>")
    && mobileOrganizationContentPage.includes("_contentTypeFor")
    && mobileOrganizationContentPage.includes("Uri.tryParse")
    && mobileOrganizationContentPage.includes("deleteContent")
    && mobileAppRouter.includes("OrganizationContentPage.routePath")
    && mobileHomePage.includes("OrganizationContentPage.routePath"),
  "Mobile organization content page must be routed and expose content list/link-file-create/delete actions"
);
assert.ok(
  mobileWorkspaceRepository.includes("'/workspaces'")
    && mobileWorkspaceRepository.includes("'/organizations/$organizationId/context'")
    && mobileWorkspaceRepository.includes("updateOrganization")
    && mobileWorkspaceRepository.includes("UpdateOrganizationCommand")
    && mobileWorkspaceRepository.includes("WorkspaceSubscriptionSummary")
    && mobileWorkspaceRepository.includes("WorkspacePlanSummary")
    && mobileWorkspaceRepository.includes("currentPeriodEndsAt")
    && mobileWorkspaceRepository.includes("needsAttention")
    && mobileWorkspaceRepository.includes("'/organizations/$organizationId'"),
  "Mobile workspace repository must load workspaces, context, and organization profile updates"
);
assert.ok(
  mobileActiveWorkspaceController.includes("getContext(workspace.organizationId)")
    && mobileActiveWorkspaceController.includes("activateOrganization")
    && mobileActiveWorkspaceController.includes("TelemetryEvent.workspaceSelected")
    && mobileActiveWorkspaceController.includes("updateOrganization({")
    && mobileActiveWorkspaceController.includes("refreshContext")
    && mobileActiveWorkspaceController.includes("copyWith")
    && mobileActiveWorkspaceController.includes("clearOrganization"),
  "Mobile active workspace controller must load context, update organization profile, and reset tenant scope"
);
assert.ok(
  mobileSubscriptionStatusBanner.includes("SubscriptionStatusBanner")
    && mobileSubscriptionStatusBanner.includes("WorkspaceSubscriptionSummary")
    && mobileSubscriptionStatusBanner.includes("needsAttention")
    && mobileSubscriptionStatusBanner.includes("subscriptionEndsInDays")
    && mobileSubscriptionStatusBanner.includes("manageSubscriptionOnWeb")
    && mobileHomePage.includes("SubscriptionStatusBanner")
    && mobileOrganizationOverviewPage.includes("SubscriptionStatusBanner")
    && mobileWorkspacePage.includes("_workspaceSubtitle"),
  "Mobile subscription UX must surface plan status, expiry, and renewal guidance"
);
assert.ok(
  mobileAccessDeniedPage.includes("AccessDeniedPage")
    && mobileAccessDeniedPage.includes("static const routePath = '/access-denied'")
    && mobileAccessDeniedPage.includes("activeWorkspaceControllerProvider")
    && mobileAccessDeniedPage.includes("SubscriptionStatusBanner")
    && mobileAccessDeniedPage.includes("moduleUnavailable")
    && mobileAccessDeniedPage.includes("permissionUnavailable")
    && mobileAccessDeniedPage.includes("HomePage.routePath")
    && mobileAccessDeniedPage.includes("WorkspaceSelectionPage.routePath")
    && mobileAppRouter.includes("AccessDeniedPage(")
    && mobileAppRouter.includes("hasEnabledModule(requiredModule)"),
  "Mobile access-denied UX must explain module and permission blocks"
);
assert.ok(
  mobilePlatformOverviewRepository.includes("'/admin/analytics/overview'")
    && mobilePlatformOverviewRepository.includes("'/admin/organizations'")
    && mobilePlatformOverviewRepository.includes("PlatformAnalyticsOverview")
    && mobilePlatformOverviewRepository.includes("PlatformAnalyticsMetrics")
    && mobilePlatformOverviewRepository.includes("PlatformOrganizationSummary")
    && mobilePlatformOverviewRepository.includes(
      "expiringOrganizationSubscriptions"
    ),
  "Mobile platform overview repository must call real admin analytics and organization endpoints"
);
assert.ok(
  mobilePlatformOverviewController.includes("platformOverviewProvider")
    && mobilePlatformOverviewController.includes("FutureProvider.autoDispose")
    && mobilePlatformOverviewController.includes("Future.wait")
    && mobilePlatformOverviewController.includes("getAnalyticsOverview")
    && mobilePlatformOverviewController.includes("listOrganizations"),
  "Mobile platform overview controller must combine platform metrics and latest organizations"
);
assert.ok(
  mobilePlatformOverviewPage.includes("PlatformOverviewPage")
    && mobilePlatformOverviewPage.includes(
      "static const routePath = '/platform/overview'"
    )
    && mobilePlatformOverviewPage.includes("currentUserProfileProvider")
    && mobilePlatformOverviewPage.includes("platformOverviewProvider")
    && mobilePlatformOverviewPage.includes("_hasPlatformRole")
    && mobilePlatformOverviewPage.includes("platformAccessRequired")
    && mobileAppRouter.includes("PlatformOverviewPage.routePath")
    && mobileHomePage.includes("PlatformOverviewPage.routePath")
    && mobileHomePage.includes("_canOpenPlatform"),
  "Mobile platform overview page must be routed and guarded by platform role"
);
assert.ok(
  mobilePlatformAcademyModerationRepository.includes("'/admin/academies'")
    && mobilePlatformAcademyModerationRepository.includes(
      "'/admin/academies/$academyId/verify'"
    )
    && mobilePlatformAcademyModerationRepository.includes(
      "'/admin/academies/$academyId/reject'"
    )
    && mobilePlatformAcademyModerationRepository.includes(
      "PlatformAcademyModerationSummary"
    )
    && mobilePlatformAcademyModerationRepository.includes(
      "PlatformAcademyModerationCommand"
    )
    && mobilePlatformAcademyModerationRepository.includes(
      "verificationStatus"
    ),
  "Mobile platform academy moderation repository must call list, verify, and reject endpoints"
);
assert.ok(
  mobilePlatformAcademyModerationController.includes(
    "platformAcademyModerationProvider"
  )
    && mobilePlatformAcademyModerationController.includes(
      "FutureProvider.autoDispose"
    )
    && mobilePlatformAcademyModerationController.includes(
      "platformAcademyModerationActionsProvider"
    )
    && mobilePlatformAcademyModerationController.includes("verify(")
    && mobilePlatformAcademyModerationController.includes("reject("),
  "Mobile platform academy moderation controller must expose list and decision actions"
);
assert.ok(
  mobilePlatformAcademyApprovalsPage.includes("PlatformAcademyApprovalsPage")
    && mobilePlatformAcademyApprovalsPage.includes(
      "static const routePath = '/platform/academy-approvals'"
    )
    && mobilePlatformAcademyApprovalsPage.includes("currentUserProfileProvider")
    && mobilePlatformAcademyApprovalsPage.includes(
      "platformAcademyModerationProvider"
    )
    && mobilePlatformAcademyApprovalsPage.includes(
      "platformAcademyModerationActionsProvider"
    )
    && mobilePlatformAcademyApprovalsPage.includes("SegmentedButton<String>")
    && mobilePlatformAcademyApprovalsPage.includes("showModalBottomSheet")
    && mobilePlatformAcademyApprovalsPage.includes("_hasPlatformRole")
    && mobileAppRouter.includes("PlatformAcademyApprovalsPage.routePath")
    && mobileHomePage.includes("PlatformAcademyApprovalsPage.routePath"),
  "Mobile platform academy approvals page must be routed and guarded by platform role"
);
assert.ok(
  mobilePlatformCategoryRepository.includes("'/admin/categories'")
    && mobilePlatformCategoryRepository.includes(
      "'/admin/categories/${command.categoryId}'"
    )
    && mobilePlatformCategoryRepository.includes(
      "'/admin/categories/$categoryId'"
    )
    && mobilePlatformCategoryRepository.includes("PlatformCategorySummary")
    && mobilePlatformCategoryRepository.includes("PlatformCategoryCommand")
    && mobilePlatformCategoryRepository.includes("sortOrder")
    && mobilePlatformCategoryRepository.includes("coursesCount"),
  "Mobile platform category repository must call list, create, update, and delete endpoints"
);
assert.ok(
  mobilePlatformCategoryController.includes("platformCategoriesProvider")
    && mobilePlatformCategoryController.includes("FutureProvider.autoDispose")
    && mobilePlatformCategoryController.includes(
      "platformCategoryActionsProvider"
    )
    && mobilePlatformCategoryController.includes("create(")
    && mobilePlatformCategoryController.includes("update(")
    && mobilePlatformCategoryController.includes("delete("),
  "Mobile platform category controller must expose list and mutation actions"
);
assert.ok(
  mobilePlatformCategoriesPage.includes("PlatformCategoriesPage")
    && mobilePlatformCategoriesPage.includes(
      "static const routePath = '/platform/categories'"
    )
    && mobilePlatformCategoriesPage.includes("currentUserProfileProvider")
    && mobilePlatformCategoriesPage.includes("platformCategoriesProvider")
    && mobilePlatformCategoriesPage.includes("platformCategoryActionsProvider")
    && mobilePlatformCategoriesPage.includes("DropdownButtonFormField")
    && mobilePlatformCategoriesPage.includes("SwitchListTile")
    && mobilePlatformCategoriesPage.includes("showModalBottomSheet")
    && mobilePlatformCategoriesPage.includes("_hasPlatformRole")
    && mobileAppRouter.includes("PlatformCategoriesPage.routePath")
    && mobileHomePage.includes("PlatformCategoriesPage.routePath"),
  "Mobile platform categories page must be routed, guarded, and expose category forms"
);
assert.ok(
  mobilePlatformCourseModerationRepository.includes("'/admin/courses'")
    && mobilePlatformCourseModerationRepository.includes(
      "'/admin/courses/$courseId/approve'"
    )
    && mobilePlatformCourseModerationRepository.includes(
      "'/admin/courses/$courseId/reject'"
    )
    && mobilePlatformCourseModerationRepository.includes(
      "PlatformCourseModerationSummary"
    )
    && mobilePlatformCourseModerationRepository.includes(
      "PlatformCourseModerationCommand"
    )
    && mobilePlatformCourseModerationRepository.includes("moderationNote"),
  "Mobile platform course moderation repository must call list, approve, and reject endpoints"
);
assert.ok(
  mobilePlatformCourseModerationController.includes(
    "platformCourseModerationProvider"
  )
    && mobilePlatformCourseModerationController.includes(
      "FutureProvider.autoDispose"
    )
    && mobilePlatformCourseModerationController.includes(
      "platformCourseModerationActionsProvider"
    )
    && mobilePlatformCourseModerationController.includes("approve(")
    && mobilePlatformCourseModerationController.includes("reject("),
  "Mobile platform course moderation controller must expose list and decision actions"
);
assert.ok(
  mobilePlatformCourseApprovalsPage.includes("PlatformCourseApprovalsPage")
    && mobilePlatformCourseApprovalsPage.includes(
      "static const routePath = '/platform/course-approvals'"
    )
    && mobilePlatformCourseApprovalsPage.includes("currentUserProfileProvider")
    && mobilePlatformCourseApprovalsPage.includes(
      "platformCourseModerationProvider"
    )
    && mobilePlatformCourseApprovalsPage.includes(
      "platformCourseModerationActionsProvider"
    )
    && mobilePlatformCourseApprovalsPage.includes("SegmentedButton<String>")
    && mobilePlatformCourseApprovalsPage.includes("showModalBottomSheet")
    && mobilePlatformCourseApprovalsPage.includes("_hasPlatformRole")
    && mobileAppRouter.includes("PlatformCourseApprovalsPage.routePath")
    && mobileHomePage.includes("PlatformCourseApprovalsPage.routePath"),
  "Mobile platform course approvals page must be routed and guarded by platform role"
);
assert.ok(
  mobilePlatformPromotionModerationRepository.includes("'/admin/promotions'")
    && mobilePlatformPromotionModerationRepository.includes(
      "'/admin/promotions/$promotionId/approve'"
    )
    && mobilePlatformPromotionModerationRepository.includes(
      "'/admin/promotions/$promotionId/reject'"
    )
    && mobilePlatformPromotionModerationRepository.includes(
      "PlatformPromotionModerationSummary"
    )
    && mobilePlatformPromotionModerationRepository.includes(
      "PlatformPromotionModerationCommand"
    )
    && mobilePlatformPromotionModerationRepository.includes(
      "bookingConversions"
    ),
  "Mobile platform promotion moderation repository must call list, approve, and reject endpoints"
);
assert.ok(
  mobilePlatformPromotionModerationController.includes(
    "platformPromotionModerationProvider"
  )
    && mobilePlatformPromotionModerationController.includes(
      "FutureProvider.autoDispose"
    )
    && mobilePlatformPromotionModerationController.includes(
      "platformPromotionModerationActionsProvider"
    )
    && mobilePlatformPromotionModerationController.includes("approve(")
    && mobilePlatformPromotionModerationController.includes("reject("),
  "Mobile platform promotion moderation controller must expose list and decision actions"
);
assert.ok(
  mobilePlatformPromotionApprovalsPage.includes(
    "PlatformPromotionApprovalsPage"
  )
    && mobilePlatformPromotionApprovalsPage.includes(
      "static const routePath = '/platform/promotion-approvals'"
    )
    && mobilePlatformPromotionApprovalsPage.includes(
      "currentUserProfileProvider"
    )
    && mobilePlatformPromotionApprovalsPage.includes(
      "platformPromotionModerationProvider"
    )
    && mobilePlatformPromotionApprovalsPage.includes(
      "platformPromotionModerationActionsProvider"
    )
    && mobilePlatformPromotionApprovalsPage.includes(
      "SegmentedButton<String>"
    )
    && mobilePlatformPromotionApprovalsPage.includes("showModalBottomSheet")
    && mobilePlatformPromotionApprovalsPage.includes("_hasPlatformRole")
    && mobileAppRouter.includes("PlatformPromotionApprovalsPage.routePath")
    && mobileHomePage.includes("PlatformPromotionApprovalsPage.routePath"),
  "Mobile platform promotion approvals page must be routed and guarded by platform role"
);
assert.ok(
  mobileOrganizationProfilePage.includes("OrganizationProfilePage")
    && mobileOrganizationProfilePage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationProfilePage.includes("UpdateOrganizationCommand")
    && mobileOrganizationProfilePage.includes("updateOrganization(")
    && mobileOrganizationProfilePage.includes("RegExp(r'^#[0-9A-Fa-f]{6}$')")
    && mobileOrganizationProfilePage.includes("DropdownButtonFormField<String>")
    && mobileAppRouter.includes("OrganizationProfilePage.routePath")
    && mobileHomePage.includes("OrganizationProfilePage.routePath"),
  "Mobile organization profile page must be routed and expose profile update actions"
);
assert.ok(
  mobileDeviceRepository.includes("'/devices/push-tokens'")
    && mobileDeviceRepository.includes("PushDeviceTokenCommand"),
  "Mobile device repository must implement push token registration"
);
assert.ok(
  mobileMetadataRepository.includes("'/meta/error-catalog'")
    && mobileMetadataRepository.includes("'/meta/deep-links'")
    && mobileMetadataRepository.includes("'/meta/offline-cache-policy'")
    && mobileMetadataRepository.includes("'/meta/device-policy'"),
  "Mobile metadata repository must load backend manifests"
);
assert.ok(
  mobileReadinessController.includes("mobileReadinessProvider")
    && mobileReadinessController.includes("offlineCachePolicyProvider.future")
    && mobileReadinessController.includes("getDevicePolicy")
    && mobileReadinessController.includes("getDeepLinks")
    && mobileReadinessController.includes("MobileReadinessSummary")
    && mobileReadinessController.includes("persistableDatasetCount")
    && mobileReadinessController.includes("memoryOnlyDatasetCount")
    && mobileReadinessController.includes("deepLinkRouteCount")
    && mobileReadinessController.includes("authRequiredDeepLinkCount")
    && mobileReadinessController.includes("signedContentIsMemoryOnly")
    && mobileProfilePage.includes("_OfflineReadinessSection")
    && mobileProfilePage.includes("mobileReadinessProvider")
    && mobileProfilePage.includes("deepLinkManifest")
    && mobileProfilePage.includes("deepLinkRoutesCount")
    && mobileProfilePage.includes("signedUrlsProtected"),
  "Mobile profile must surface offline/device/deep-link readiness from backend metadata policies"
);
assert.ok(
  mobileContentRepository.includes("view-session")
    && mobileContentRepository.includes("listContent")
    && mobileContentRepository.includes("'/organizations/$organizationId/content'")
    && mobileContentRepository.includes("ContentItemSummary")
    && mobileContentRepository.includes("ContentFileAssetSummary")
    && mobileContentRepository.includes("roomId")
    && mobileContentRepository.includes("viewer-audit")
    && mobileContentRepository.includes("ContentViewerAuditEvent")
    && mobileContentRepository.includes("ContentViewerEvents")
    && mobileContentRepository.includes("watermark_rendered"),
  "Mobile content repository must implement protected view sessions and audit"
);
assert.ok(
  mobileCourseContentController.includes("courseContentListProvider")
    && mobileCourseContentController.includes("CourseContentQuery")
    && mobileCourseContentController.includes("listContent")
    && mobileCourseContentController.includes("organizationId")
    && mobileCourseContentController.includes("roomId"),
  "Mobile course content controller must expose room-scoped course content"
);
assert.ok(
  mobileContentViewerController.includes("ContentViewerController")
    && mobileContentViewerController.includes("getViewSession")
    && mobileContentViewerController.includes("ContentViewerEvents.opened")
    && mobileContentViewerController.includes("ContentViewerEvents.watermarkRendered")
    && mobileContentViewerController.includes("recordDownloadBlocked")
    && mobileContentViewerController.includes("TelemetryEvent.contentOpened")
    && mobileContentViewerController.includes("minutesUntilExpiry")
    && mobileContentViewerController.includes("isExpired")
    && mobileContentViewerController.includes("signedUrlIsMemoryOnly")
    && mobileContentViewerController.includes("state = const AsyncData(null)"),
  "Mobile content viewer controller must manage lifecycle audit and clear signed URL state"
);
assert.ok(
  mobileNotificationRepository.includes("'/notifications'")
    && mobileNotificationRepository.includes("'/notifications/read-all'")
    && mobileNotificationRepository.includes("'/notification-preferences'")
    && mobileNotificationRepository.includes("getPreferences({")
    && mobileNotificationRepository.includes("updatePreferences({")
    && mobileNotificationRepository.includes("NotificationPreferences")
    && mobileNotificationRepository.includes("UpdateNotificationPreferencesCommand")
    && mobileNotificationRepository.includes("subscriptionReminders"),
  "Mobile notification repository must implement inbox read-state and preference endpoints"
);
assert.ok(
  mobileNotificationRepository.includes("queryParameters: const <String, Object?>{'perPage': 100}")
    && mobileNotificationRepository.includes("'/notifications/$notificationId/read'")
    && mobileNotificationRepository.includes("offlineCacheStoreProvider")
    && mobileNotificationRepository.includes("writeJsonList")
    && mobileNotificationRepository.includes("readJsonList")
    && mobileNotificationRepository.includes("notifications.inbox")
    && mobileNotificationRepository.includes("on DioException")
    && mobileNotificationRepository.includes("target_type")
    && mobileNotificationRepository.includes("read_at")
    && mobileNotificationRepository.includes("data['route']")
    && mobileNotificationRepository.includes("_readJsonObjectOrEmpty"),
  "Mobile notification repository must parse backend notification targets, cache inbox data, fall back offline, and read state"
);
assert.ok(
  mobileNotificationController.includes("notificationInboxProvider")
    && mobileNotificationController.includes("FutureProvider.autoDispose")
    && mobileNotificationController.includes("listNotifications()")
    && mobileNotificationController.includes("notificationCacheStatusProvider")
    && mobileNotificationController.includes("notifications.inbox")
    && mobileNotificationController.includes("notifications.mark_read")
    && mobileNotificationController.includes("staleWhileRevalidate")
    && mobileNotificationController.includes("cacheFallbackEnabled")
    && mobileNotificationController.includes("markReadIsOptimistic")
    && mobileNotificationController.includes("notificationPreferencesProvider")
    && mobileNotificationController.includes("NotificationPreferenceActions")
    && mobileNotificationController.includes("updatePreferences("),
  "Mobile notification controller must expose inbox, cache status, and preference providers"
);
assert.ok(
  mobileNotificationTapRouter.includes("notificationTapRouterProvider")
    && mobileNotificationTapRouter.includes("DeepLinkService")
    && mobileNotificationTapRouter.includes("resolve(AppNotification notification)")
    && mobileNotificationTapRouter.includes("notification.route")
    && mobileNotificationTapRouter.includes("marketplace.courseDetails")
    && mobileNotificationTapRouter.includes("student.bookingStatus")
    && mobileNotificationTapRouter.includes("notifications.inbox")
    && mobileNotificationTapRouter.includes("content.library")
    && mobileNotificationTapRouter.includes("LessonBookingsPage.routePath")
    && mobileNotificationTapRouter.includes("targetType")
    && mobileNotificationTapRouter.includes("CourseDetailPage.location")
    && mobileNotificationTapRouter.includes("MyCoursesPage.routePath"),
  "Mobile notification tap router must resolve manifest and target-based notification destinations"
);
assert.ok(
  mobileNotificationInboxPage.includes("NotificationInboxPage")
    && mobileNotificationInboxPage.includes("notificationInboxProvider")
    && mobileNotificationInboxPage.includes("notificationCacheStatusProvider")
    && mobileNotificationInboxPage.includes("_NotificationCacheBanner")
    && mobileNotificationInboxPage.includes("staleWhileRevalidate")
    && mobileNotificationInboxPage.includes("cacheFallbackEnabled")
    && mobileNotificationInboxPage.includes("optimisticReadState")
    && mobileNotificationInboxPage.includes("markRead(notification.id)")
    && mobileNotificationInboxPage.includes("markAllRead")
    && mobileNotificationInboxPage.includes("notificationTapRouterProvider")
    && mobileNotificationInboxPage.includes("context.go(location)")
    && mobileNotificationInboxPage.includes("highlightNotificationId")
    && mobileNotificationInboxPage.includes("RefreshIndicator"),
  "Mobile notification inbox page must list notifications, show cache policy, mark read, and route taps"
);
assert.ok(
  mobileStudentLearningRepository.includes("'/student/bookings'")
    && mobileStudentLearningRepository.includes("'/student/enrollments'")
    && mobileStudentLearningRepository.includes("Future.wait")
    && mobileStudentLearningRepository.includes("StudentLearningOverview")
    && mobileStudentLearningRepository.includes("getEnrollment(String enrollmentId)")
    && mobileStudentLearningRepository.includes("'/student/enrollments/$enrollmentId'")
    && mobileStudentLearningRepository.includes("StudentEnrollmentDetail")
    && mobileStudentLearningRepository.includes("StudentEnrollmentAccess")
    && mobileStudentLearningRepository.includes("pendingBookingCount")
    && mobileStudentLearningRepository.includes("activeEnrollmentCount")
    && mobileStudentLearningRepository.includes("StudentBookingSummary.fromJson")
    && mobileStudentLearningRepository.includes("StudentEnrollmentSummary.fromJson")
    && mobileStudentLearningRepository.includes("snakeKey: 'course_id'")
    && mobileStudentLearningRepository.includes("academy_profile"),
  "Mobile student learning repository must load authenticated bookings and enrollments robustly"
);
assert.ok(
  mobileStudentLearningController.includes("studentLearningOverviewProvider")
    && mobileStudentLearningController.includes("studentEnrollmentDetailProvider")
    && mobileStudentLearningController.includes("FutureProvider.autoDispose")
    && mobileStudentLearningController.includes("getOverview()")
    && mobileStudentLearningController.includes("getEnrollment(enrollmentId)"),
  "Mobile student learning controller must expose overview and enrollment detail providers"
);
assert.ok(
  mobileLessonBookingRepository.includes("'/public/instructors'")
    && mobileLessonBookingRepository.includes("'/student/lesson-bookings'")
    && mobileLessonBookingRepository.includes("'/student/lesson-bookings/$bookingId/cancel'")
    && mobileLessonBookingRepository.includes("Future.wait")
    && mobileLessonBookingRepository.includes("LessonBookingCatalog")
    && mobileLessonBookingRepository.includes("ReserveLessonBookingCommand")
    && mobileLessonBookingRepository.includes("studentPhone")
    && mobileLessonBookingRepository.includes("LessonInstructorSummary")
    && mobileLessonBookingRepository.includes("LessonAvailabilitySlot")
    && mobileLessonBookingRepository.includes("LessonBookingSummary")
    && mobileLessonBookingRepository.includes("fromNullableJson"),
  "Mobile lesson booking repository must load public instructors and manage student lesson bookings"
);
assert.ok(
  mobileLessonBookingController.includes("lessonBookingCatalogProvider")
    && mobileLessonBookingController.includes("LessonBookingActions")
    && mobileLessonBookingController.includes("reserve({")
    && mobileLessonBookingController.includes("cancel(String bookingId)")
    && mobileLessonBookingController.includes("_ref.invalidate(lessonBookingCatalogProvider)"),
  "Mobile lesson booking controller must expose catalog and mutation actions"
);
assert.ok(
  mobileLessonBookingsPage.includes("LessonBookingsPage")
    && mobileLessonBookingsPage.includes("static const routePath = '/lesson-bookings'")
    && mobileLessonBookingsPage.includes("lessonBookingCatalogProvider")
    && mobileLessonBookingsPage.includes("DefaultTabController")
    && mobileLessonBookingsPage.includes("showModalBottomSheet")
    && mobileLessonBookingsPage.includes("ReserveLessonBookingCommand")
    && mobileLessonBookingsPage.includes("cancel(booking.id)")
    && mobileLessonBookingsPage.includes("DropdownButtonFormField<String>")
    && mobileAppRouter.includes("LessonBookingsPage.routePath")
    && mobileHomePage.includes("LessonBookingsPage.routePath")
    && mobileNotificationTapRouter.includes("LessonBookingsPage.routePath"),
  "Mobile lesson bookings page must be routed and expose explore/reserve/cancel actions"
);
assert.ok(
  mobileAttendanceRepository.includes("'/student/attendance'")
    && mobileAttendanceRepository.includes("'/guardian/students'")
    && mobileAttendanceRepository.includes("'/guardian/students/$studentId/attendance'")
    && mobileAttendanceRepository.includes("StudentAttendanceOverview")
    && mobileAttendanceRepository.includes("GuardianAttendanceOverview")
    && mobileAttendanceRepository.includes("AttendanceRecordSummary")
    && mobileAttendanceRepository.includes("AttendanceSummary"),
  "Mobile attendance repository must load student and guardian attendance endpoints"
);
assert.ok(
  mobileAttendanceController.includes("studentAttendanceProvider")
    && mobileAttendanceController.includes("guardianAttendanceProvider")
    && mobileAttendanceController.includes("FutureProvider.autoDispose"),
  "Mobile attendance controller must expose student and guardian attendance providers"
);
assert.ok(
  mobileAttendancePage.includes("AttendancePage")
    && mobileAttendancePage.includes("static const routePath = '/attendance'")
    && mobileAttendancePage.includes("DefaultTabController")
    && mobileAttendancePage.includes("studentAttendanceProvider")
    && mobileAttendancePage.includes("guardianAttendanceProvider")
    && mobileAttendancePage.includes("_AttendanceSummaryGrid")
    && mobileAttendancePage.includes("attendanceStatusLabel")
    && mobileAppRouter.includes("AttendancePage.routePath")
    && mobileHomePage.includes("AttendancePage.routePath")
    && mobileNotificationTapRouter.includes("AttendancePage.routePath"),
  "Mobile attendance page must be routed and show student/guardian attendance summaries"
);
assert.ok(
  mobileMyCoursesPage.includes("MyCoursesPage")
    && mobileMyCoursesPage.includes("studentLearningOverviewProvider")
    && mobileMyCoursesPage.includes("RefreshIndicator")
    && mobileMyCoursesPage.includes("overview.pendingBookingCount")
    && mobileMyCoursesPage.includes("overview.activeEnrollmentCount")
    && mobileMyCoursesPage.includes("StudentEnrollmentSummary")
    && mobileMyCoursesPage.includes("StudentBookingSummary")
    && mobileMyCoursesPage.includes("CourseCatalogPage.routePath")
    && mobileMyCoursesPage.includes("CourseWorkspacePage.location(enrollment.id)")
    && mobileMyCoursesPage.includes("openCourseSpace"),
  "Mobile my courses page must show booking and enrollment state with a return-to-catalog action"
);
assert.ok(
  mobileCourseWorkspacePage.includes("CourseWorkspacePage")
    && mobileCourseWorkspacePage.includes("studentEnrollmentDetailProvider(enrollmentId)")
    && mobileCourseWorkspacePage.includes("courseContentListProvider(query)")
    && mobileCourseWorkspacePage.includes("contentViewerControllerProvider")
    && mobileCourseWorkspacePage.includes("ContentItemSummary")
    && mobileCourseWorkspacePage.includes("openSecureViewer")
    && mobileCourseWorkspacePage.includes("recordDownloadBlocked")
    && mobileCourseWorkspacePage.includes("viewerSessionExpiresIn")
    && mobileCourseWorkspacePage.includes("viewerSessionExpired")
    && mobileCourseWorkspacePage.includes("signedUrlMemoryOnly")
    && mobileCourseWorkspacePage.includes("secureViewerMemoryOnlyHint")
    && mobileCourseWorkspacePage.includes("refreshViewerSession")
    && mobileCourseWorkspacePage.includes("close()")
    && mobileCourseWorkspacePage.includes("detail.access.allowed")
    && mobileCourseWorkspacePage.includes("_LockedCourseState")
    && mobileCourseWorkspacePage.includes("activeAccess")
    && mobileCourseWorkspacePage.includes("nextSession")
    && mobileCourseWorkspacePage.includes("_nextSessionText")
    && mobileCourseWorkspacePage.includes("batch.startDate")
    && mobileCourseWorkspacePage.includes("courseContentPending")
    && mobileCourseWorkspacePage.includes("_CourseAnnouncementSection")
    && mobileCourseWorkspacePage.includes("organizationAnnouncementsProvider")
    && mobileCourseWorkspacePage.includes("announcement.roomId == roomId")
    && mobileCourseWorkspacePage.includes("MyCoursesPage.routePath"),
  "Mobile course workspace page must validate enrollment access and open protected room content/announcements"
);
assert.ok(
  mobileScheduleController.includes("mobileScheduleProvider")
    && mobileScheduleController.includes("studentLearningOverviewProvider.future")
    && mobileScheduleController.includes("activeWorkspaceControllerProvider.future")
    && mobileScheduleController.includes("OrganizationEventsRequest")
    && mobileScheduleController.includes("organizationId: workspace.organizationId")
    && mobileScheduleController.includes("MobileScheduleOverview.fromSources")
    && mobileScheduleController.includes("ScheduleItem.fromEnrollment")
    && mobileScheduleController.includes("ScheduleItem.fromOrganizationEvent")
    && mobileScheduleController.includes("ScheduleItemKind.studentCourse")
    && mobileScheduleController.includes("DateTime.tryParse"),
  "Mobile schedule controller must aggregate student enrollment schedules and organization events"
);
assert.ok(
  mobileSchedulePage.includes("SchedulePage")
    && mobileSchedulePage.includes("static const routePath = '/schedule'")
    && mobileSchedulePage.includes("mobileScheduleProvider")
    && mobileSchedulePage.includes("RefreshIndicator")
    && mobileSchedulePage.includes("studentCourseSchedules")
    && mobileSchedulePage.includes("organizationCalendar")
    && mobileSchedulePage.includes("MyCoursesPage.routePath")
    && mobileSchedulePage.includes("OrganizationEventsPage.routePath")
    && mobileAppRouter.includes("SchedulePage.routePath")
    && mobileHomePage.includes("SchedulePage.routePath"),
  "Mobile schedule page must be routed and render real schedule data sources"
);
assert.ok(
  mobilePublicCourseRepository.includes("'/public/courses'")
    && mobilePublicCourseRepository.includes("'/public/bookings'")
    && mobilePublicCourseRepository.includes("queryParameters: query.toQueryParameters()")
    && mobilePublicCourseRepository.includes("ApiEnvelope<List<PublicCourseSummary>>")
    && mobilePublicCourseRepository.includes("PublicCoursePagination.fromJson(envelope.meta)")
    && mobilePublicCourseRepository.includes("startingSoon('starting_soon')")
    && mobilePublicCourseRepository.includes("effectivePriceMinor")
    && mobilePublicCourseRepository.includes("nextOpenBatch")
    && mobilePublicCourseRepository.includes("PublicBookingCommand")
    && mobilePublicCourseRepository.includes("termsAccepted")
    && mobilePublicCourseRepository.includes("RequestIdFactory().create()"),
  "Mobile marketplace repository must load public courses and submit idempotent public bookings"
);
assert.ok(
  mobilePublicCourseCatalogController.includes("FutureProvider.autoDispose")
    && mobilePublicCourseCatalogController.includes("PublicCourseQuery")
    && mobilePublicCourseCatalogController.includes("listCourses(query: query)")
    && mobilePublicCourseCatalogController.includes("publicCourseDetailProvider")
    && mobilePublicCourseCatalogController.includes("getCourse(courseSlug)"),
  "Mobile marketplace controller must expose public course catalog and detail providers"
);
assert.ok(
  mobileCourseCatalogPage.includes("SearchBar")
    && mobileCourseCatalogPage.includes("SegmentedButton<PublicCourseSort>")
    && mobileCourseCatalogPage.includes("RefreshIndicator")
    && mobileCourseCatalogPage.includes("publicCourseCatalogProvider(_query)")
    && mobileCourseCatalogPage.includes("CourseDetailPage.location(course.slug)")
    && mobileCourseCatalogPage.includes("strings.matchingCourses")
    && mobileCourseCatalogPage.includes("strings.seatsLeft")
    && mobileCourseCatalogPage.includes("strings.priceFromMinor"),
  "Mobile marketplace page must provide search, sort, refresh, loading, empty, and linked course-card states"
);
assert.ok(
  mobileCourseDetailPage.includes("publicCourseDetailProvider(widget.courseSlug)")
    && mobileCourseDetailPage.includes("RadioListTile<String>")
    && mobileCourseDetailPage.includes("CheckboxListTile")
    && mobileCourseDetailPage.includes("BookingSuccessPage.location")
    && mobileCourseDetailPage.includes("PublicBookingCommand")
    && mobileCourseDetailPage.includes("createBooking")
    && mobileCourseDetailPage.includes("termsAccepted")
    && mobileCourseDetailPage.includes("noAvailableBatches"),
  "Mobile course detail page must load details, select an open batch, and submit public bookings"
);
assert.ok(
  mobileBookingSuccessPage.includes("BookingSuccessPage")
    && mobileBookingSuccessPage.includes("static const routePath = '/booking/success'")
    && mobileBookingSuccessPage.includes("queryParameters")
    && mobileBookingSuccessPage.includes("bookingId")
    && mobileBookingSuccessPage.includes("authControllerProvider")
    && mobileBookingSuccessPage.includes("authState.isAuthenticated")
    && mobileBookingSuccessPage.includes("studentLearningOverviewProvider")
    && mobileBookingSuccessPage.includes("bookingById")
    && mobileBookingSuccessPage.includes("paymentStatus")
    && mobileBookingSuccessPage.includes("MyCoursesPage.routePath")
    && mobileBookingSuccessPage.includes("pendingAcademyConfirmation")
    && mobileBookingSuccessPage.includes("CourseCatalogPage.routePath"),
  "Mobile booking success page must show public booking confirmation, hydrate authenticated booking status, and link to learning/catalog"
);
assert.ok(
  mobileInstallationIdStore.includes("Random.secure")
    && mobileInstallationIdStore.includes("writeInstallationId"),
  "Mobile installation IDs must be app-generated and stored securely"
);
assert.ok(
  mobileDeepLinkService.includes("getDeepLinks")
    && mobileDeepLinkService.includes("mobileScreen")
    && mobileDeepLinkService.includes("fallbackPath"),
  "Mobile deep-link service must resolve backend manifest routes"
);
assert.ok(
  mobileOfflineCachePolicy.includes("getOfflineCachePolicy")
    && mobileOfflineCachePolicy.includes("shouldPersistDataset")
    && mobileOfflineCachePolicy.includes("memory_only")
    && mobileOfflineCachePolicy.includes("requiresServerConfirmation"),
  "Mobile offline service must enforce backend cache and write policies"
);
assert.ok(
  mobileOfflineCacheStore.includes("OfflineCacheStore")
    && mobileOfflineCacheStore.includes("FlutterSecureStorage")
    && mobileOfflineCacheStore.includes("offlineCachePolicyProvider.future")
    && mobileOfflineCacheStore.includes("shouldPersistDataset")
    && mobileOfflineCacheStore.includes("tenantCacheScopeControllerProvider")
    && mobileOfflineCacheStore.includes("tenantCacheKeyFactoryProvider")
    && mobileOfflineCacheStore.includes("readJsonList")
    && mobileOfflineCacheStore.includes("writeJsonList")
    && mobileOfflineCacheStore.includes("expiresAt")
    && mobileOfflineCacheStore.includes("bool get isStale"),
  "Mobile offline cache store must persist only policy-approved tenant-scoped datasets with expiry metadata"
);
assert.ok(
  mobileTenantCacheScope.includes("TenantCacheKeyFactory")
    && mobileTenantCacheScope.includes("organization:${_required(scope.organizationId")
    && mobileTenantCacheScope.includes("user:${_required(scope.userId")
    && mobileTenantCacheScope.includes("throw StateError")
    && mobileTenantCacheScope.includes("ref.invalidate(offlineCachePolicyProvider)"),
  "Mobile tenant cache scope must enforce user and organization cache namespaces"
);
assert.ok(
  mobilePushRegistrationService.includes("registerFcmToken")
    && mobilePushRegistrationService.includes("revokeCurrentInstallation")
    && mobilePushRegistrationService.includes("installationIdProvider"),
  "Mobile push registration service must manage token lifecycle by installation"
);
assert.ok(
  mobileDeepLinksDoc.includes("GET /api/v1/meta/deep-links")
    && mobileDeepLinksDoc.includes("requiresAuth")
    && mobileDeepLinksDoc.includes("fallbackPath")
    && mobileDeepLinksDoc.includes("Support Visibility")
    && mobileDeepLinksDoc.includes("auth-required route count"),
  "Mobile deep-link documentation must describe manifest-based routing"
);
assert.ok(
  mobileOfflineStrategyDoc.includes("content.view_session")
    && mobileOfflineStrategyDoc.includes("memory-only")
    && mobileOfflineStrategyDoc.includes("OfflineCacheStore")
    && mobileOfflineStrategyDoc.includes("Implemented Cache Fallbacks")
    && mobileOfflineStrategyDoc.includes("notifications.inbox")
    && mobileOfflineStrategyDoc.includes("server confirmation"),
  "Mobile offline documentation must protect signed content URLs"
);
assert.ok(
  mobileOfflineStrategyDoc.includes("TenantCacheKeyFactory")
    && mobileOfflineStrategyDoc.includes("organization-scoped dataset")
    && mobileOfflineStrategyDoc.includes("User-scoped cache keys"),
  "Mobile offline documentation must describe tenant-aware cache keys"
);
assert.ok(
  mobilePushNotificationsDoc.includes("POST /api/v1/devices/push-tokens")
    && mobilePushNotificationsDoc.includes("DELETE /api/v1/devices/push-tokens")
    && mobilePushNotificationsDoc.includes("token refresh"),
  "Mobile push documentation must describe registration, refresh, and revoke"
);
assert.ok(
  mobileContentViewerDoc.includes("memory-only")
    && mobileContentViewerDoc.includes("viewerSessionId")
    && mobileContentViewerDoc.includes("Viewer shell")
    && mobileContentViewerDoc.includes("refresh for expired sessions")
    && mobileContentViewerDoc.includes("download_blocked")
    && mobileContentViewerDoc.includes("watermark_rendered")
    && mobileContentViewerDoc.includes("Do not persist"),
  "Mobile content viewer documentation must protect signed URLs and describe audit lifecycle"
);
assert.ok(
  mobileSecurityDoc.includes("FlutterSecureStorage")
    && mobileSecurityDoc.includes("Random.secure")
    && mobileSecurityDoc.includes("non-HTTPS")
    && mobileSecurityDoc.includes("ContentViewerController"),
  "Mobile security documentation must capture implemented security guards"
);
assert.ok(
  mobileSecurityDoc.includes("TelemetryService")
    && mobileSecurityDoc.includes("PrivacyRedactor")
    && mobileSecurityDoc.includes("CrashReportingSink"),
  "Mobile security documentation must include telemetry redaction controls"
);
assert.ok(
  mobileThreatModelDoc.includes("Token theft")
    && mobileThreatModelDoc.includes("Cross-tenant cached records")
    && mobileThreatModelDoc.includes("Malicious deep link")
    && mobileThreatModelDoc.includes("Signed URL leakage"),
  "Mobile threat model must cover token, tenant, deep-link, and signed URL risks"
);
assert.ok(
  mobileSecurityChecklistDoc.includes("Production API URL must be HTTPS")
    && mobileSecurityChecklistDoc.includes("Run `flutter analyze`")
    && mobileSecurityChecklistDoc.includes("Android production cleartext-traffic guard")
    && mobileSecurityChecklistDoc.includes("Release Blockers"),
  "Mobile security checklist must separate implemented controls from staging blockers"
);
assert.ok(
  mobilePerformanceDoc.includes("Cold start")
    && mobilePerformanceDoc.includes("Course catalog first page")
    && mobilePerformanceDoc.includes("Drift cache tables")
    && mobilePerformanceDoc.includes("Flutter"),
  "Mobile performance documentation must define budgets and pending measurement work"
);
assert.ok(
  mobileErrorHandlingDoc.includes("X-Request-ID")
    && mobileErrorHandlingDoc.includes("ApiErrorMapper")
    && mobileErrorHandlingDoc.includes("VALIDATION_ERROR")
    && mobileErrorHandlingDoc.includes("SESSION_EXPIRED")
    && mobileErrorHandlingDoc.includes("TokenRefreshCoordinator")
    && mobileErrorHandlingDoc.includes("skipAuthRefresh"),
  "Mobile error handling documentation must describe request IDs and backend errors"
);
assert.ok(
  mobileTestingDoc.includes("flutter analyze")
    && mobileTestingDoc.includes("ApiErrorMapper")
    && mobileTestingDoc.includes("TokenRefreshCoordinator")
    && mobileTestingDoc.includes("OfflineCachePolicy.shouldPersistDataset")
    && mobileTestingDoc.includes("DeepLinkService"),
  "Mobile testing documentation must cover core services and Flutter commands"
);
assert.ok(
  mobileTestingDoc.includes("PrivacyRedactor")
    && mobileTestingDoc.includes("TelemetryService")
    && mobileTestingDoc.includes("signed URLs"),
  "Mobile testing documentation must cover telemetry privacy checks"
);
assert.ok(
  mobileTestReport.includes("`pnpm test`")
    && mobileTestReport.includes("`git diff --check`")
    && mobileTestReport.includes("Not available in PATH")
    && mobileTestReport.includes("Mobile acceptance is not complete"),
  "Mobile test report must record executed checks and missing Flutter toolchain evidence"
);
assert.ok(
  mobileIntegrationTestReport.includes("Authentication, refresh")
    && mobileIntegrationTestReport.includes("Notification inbox")
    && mobileIntegrationTestReport.includes("Staging Flows Still Required")
    && mobileIntegrationTestReport.includes("No real-device or simulator integration test"),
  "Mobile integration test report must distinguish contract coverage from staging execution"
);
assert.ok(
  mobileAnalyticsDoc.includes("PrivacyRedactor")
    && mobileAnalyticsDoc.includes("No Firebase Analytics package is enabled yet")
    && mobileAnalyticsDoc.includes("Signed protected-content URLs"),
  "Mobile analytics documentation must keep analytics privacy-gated"
);
assert.ok(
  mobileCrashReportingDoc.includes("CrashReportingSink")
    && mobileCrashReportingDoc.includes("FirebaseCrashlytics")
    && mobileCrashReportingDoc.includes("Never send")
    && mobileCrashReportingDoc.includes("Signed content URLs"),
  "Mobile crash reporting documentation must define redacted crash context"
);
assert.ok(
  mobilePrivacyDataMap.includes("Signed content URL")
    && mobilePrivacyDataMap.includes("Memory only")
    && mobilePrivacyDataMap.includes("Never send")
    && mobilePrivacyDataMap.includes("Purge Triggers"),
  "Mobile privacy data map must classify secrets, signed URLs, and purge triggers"
);
assert.ok(
  mobileFinalAuditDoc.includes("Not ready for staging or store release")
    && mobileFinalAuditDoc.includes("Completed Foundation")
    && mobileFinalAuditDoc.includes("Not Yet Complete")
    && mobileFinalAuditDoc.includes("Release Blockers"),
  "Final mobile audit must state the current release decision and blockers"
);
assert.ok(
  mobileFinalTestReport.includes("Testing is incomplete")
    && mobileFinalTestReport.includes("Repository production validation")
    && mobileFinalTestReport.includes("flutter analyze")
    && mobileFinalTestReport.includes("Laravel `php artisan test`"),
  "Final mobile test report must list passed repository checks and missing mobile/backend commands"
);
assert.ok(
  mobileSecurityReport.includes("partially implemented but not release-ready")
    && mobileSecurityReport.includes("Implemented Controls")
    && mobileSecurityReport.includes("Open Security Work")
    && mobileSecurityReport.includes("Release Risk"),
  "Mobile security report must separate implemented controls from open security work"
);
assert.ok(
  mobileReleaseReadinessDoc.includes("Do not release")
    && mobileReleaseReadinessDoc.includes("Ready")
    && mobileReleaseReadinessDoc.includes("Not Ready")
    && mobileReleaseReadinessDoc.includes("Next Release Milestone")
    && mobileReleaseReadinessDoc.includes("03-Mobile-App/NATIVE_RELEASE_READINESS.md"),
  "Mobile release readiness must provide the current release decision and next milestone"
);
assert.ok(
  mobileNativeReleaseReadinessDoc.includes("Do not release")
    && mobileNativeReleaseReadinessDoc.includes("flutter")
    && mobileNativeReleaseReadinessDoc.includes("dart")
    && mobileNativeReleaseReadinessDoc.includes("php")
    && mobileNativeReleaseReadinessDoc.includes("composer")
    && mobileNativeReleaseReadinessDoc.includes("03-Mobile-App/android")
    && mobileNativeReleaseReadinessDoc.includes("03-Mobile-App/ios")
    && mobileNativeReleaseReadinessDoc.includes("Android Native Audit")
    && mobileNativeReleaseReadinessDoc.includes("iOS Native Audit")
    && mobileNativeReleaseReadinessDoc.includes("Store Submission Gates"),
  "Mobile native release readiness must document toolchain blockers and native/store gates"
);
assert.ok(
  mobileApp.includes("supportedLocales")
    && mobileApp.includes("GlobalMaterialLocalizations.delegate")
    && mobileApp.includes("AppStringsDelegate"),
  "Mobile app must register Arabic/English localization delegates"
);
assert.ok(
  mobileApp.includes("Locale('ar')")
    && mobileApp.includes("Locale('en')")
    && mobileAppStrings.includes("تسجيل الدخول")
    && mobileAppStrings.includes("Choose workspace")
    && (mobileAppStrings.includes("استكشف الدورات") || mobileAppStrings.includes("استكشف الكورسات"))
    && mobileAppStrings.includes("Search courses")
    && mobileAppStrings.includes("Complete booking")
    && mobileAppStrings.includes("Booking request sent successfully")
    && mobileAppStrings.includes("Booking request sent")
    && mobileAppStrings.includes("Pending academy confirmation")
    && mobileAppStrings.includes("My learning and bookings")
    && mobileAppStrings.includes("Pending bookings")
    && mobileAppStrings.includes("Open course space")
    && mobileAppStrings.includes("Course space")
    && mobileAppStrings.includes("Course access is locked")
    && mobileAppStrings.includes("Open secure viewer")
    && mobileAppStrings.includes("Viewer session expires in")
    && mobileAppStrings.includes("Viewer session expired")
    && mobileAppStrings.includes("Signed URL memory-only")
    && mobileAppStrings.includes("Download disabled")
    && mobileAppStrings.includes("Watermark protected")
    && mobileAppStrings.includes("Notifications")
    && mobileAppStrings.includes("Mark all read")
    && mobileAppStrings.includes("Unread")
    && mobileAppStrings.includes("Attendance")
    && mobileAppStrings.includes("Student attendance")
    && mobileAppStrings.includes("Guardian attendance")
    && mobileAppStrings.includes("Organization attendance")
    && mobileAppStrings.includes("Generate QR")
    && mobileAppStrings.includes("Lock attendance")
    && mobileAppStrings.includes("Organization instructors")
    && mobileAppStrings.includes("Create availability slot")
    && mobileAppStrings.includes("Organization promotions")
    && mobileAppStrings.includes("Create promotion")
    && mobileAppStrings.includes("Organization analytics")
    && mobileAppStrings.includes("Booking conversion")
    && mobileAppStrings.includes("Renew subscription")
    && mobileAppStrings.includes("Subscription ends in")
    && mobileAppStrings.includes("Access unavailable")
    && mobileAppStrings.includes("This feature is not included in the current plan")
    && mobileAppStrings.includes("Your role does not include permission")
    && mobileAppStrings.includes("Platform overview")
    && mobileAppStrings.includes("Latest tenants")
    && mobileAppStrings.includes("Academy approvals")
    && mobileAppStrings.includes("Verify academy")
    && mobileAppStrings.includes("Public profile")
    && mobileAppStrings.includes("Platform categories")
    && mobileAppStrings.includes("Create category")
    && mobileAppStrings.includes("Sort order")
    && mobileAppStrings.includes("Course approvals")
    && mobileAppStrings.includes("Approve and publish")
    && mobileAppStrings.includes("Reject with note")
    && mobileAppStrings.includes("Promotion approvals")
    && mobileAppStrings.includes("Approve promotion")
    && mobileAppStrings.includes("Impressions")
    && mobileAppStrings.includes("Offline readiness")
    && mobileAppStrings.includes("Signed content URLs")
    && mobileAppStrings.includes("Deep-link manifest")
    && mobileAppStrings.includes("Deep-link routes")
    && mobileAppStrings.includes("Cache purge triggers")
    && mobileAppStrings.includes("Disallowed device practices")
    && mobileAppStrings.includes("Notification offline status")
    && mobileAppStrings.includes("Offline readable")
    && mobileAppStrings.includes("Cache fallback enabled")
    && mobileAppStrings.includes("Stale while revalidate")
    && mobileAppStrings.includes("Optimistic read state"),
  "Mobile strings must include Arabic and English scaffold copy"
);
assert.ok(
  mobileAppRouter.includes("CourseCatalogPage.routePath")
    && mobileAppRouter.includes("const CourseCatalogPage()")
    && mobileAppRouter.includes("CourseDetailPage.routePath")
    && mobileAppRouter.includes("startsWith('/explore/course/')")
    && mobileAppRouter.includes("BookingSuccessPage.routePath")
    && mobileAppRouter.includes("MyCoursesPage.routePath")
    && mobileAppRouter.includes("const MyCoursesPage()")
    && mobileAppRouter.includes("LessonBookingsPage.routePath")
    && mobileAppRouter.includes("AttendancePage.routePath")
    && mobileAppRouter.includes("CourseWorkspacePage.routePath")
    && mobileAppRouter.includes("NotificationInboxPage.routePath")
    && mobileAppRouter.includes("OrganizationOverviewPage.routePath")
    && mobileAppRouter.includes("OrganizationAttendancePage.routePath")
    && mobileAppRouter.includes("OrganizationInstructorsPage.routePath")
    && mobileAppRouter.includes("OrganizationPromotionsPage.routePath")
    && mobileAppRouter.includes("OrganizationAnalyticsPage.routePath")
    && mobileAppRouter.includes("PlatformOverviewPage.routePath")
    && mobileAppRouter.includes("PlatformAcademyApprovalsPage.routePath")
    && mobileAppRouter.includes("PlatformCategoriesPage.routePath")
    && mobileAppRouter.includes("PlatformCourseApprovalsPage.routePath")
    && mobileAppRouter.includes("PlatformPromotionApprovalsPage.routePath")
    && mobileAppRouter.includes("SchedulePage.routePath")
    && mobileAppRouter.includes("ProfilePage.routePath")
    && mobileHomePage.includes("CourseCatalogPage.routePath")
    && mobileHomePage.includes("LessonBookingsPage.routePath")
    && mobileHomePage.includes("AttendancePage.routePath")
    && mobileHomePage.includes("NotificationInboxPage.routePath")
    && mobileHomePage.includes("OrganizationOverviewPage.routePath")
    && mobileHomePage.includes("OrganizationAttendancePage.routePath")
    && mobileHomePage.includes("OrganizationInstructorsPage.routePath")
    && mobileHomePage.includes("OrganizationPromotionsPage.routePath")
    && mobileHomePage.includes("OrganizationAnalyticsPage.routePath")
    && mobileHomePage.includes("PlatformOverviewPage.routePath")
    && mobileHomePage.includes("PlatformAcademyApprovalsPage.routePath")
    && mobileHomePage.includes("PlatformCategoriesPage.routePath")
    && mobileHomePage.includes("PlatformCourseApprovalsPage.routePath")
    && mobileHomePage.includes("PlatformPromotionApprovalsPage.routePath")
    && mobileHomePage.includes("SchedulePage.routePath")
    && mobileHomePage.includes("ProfilePage.routePath")
    && mobileHomePage.includes("activeWorkspaceControllerProvider")
    && mobileHomePage.includes("_canOpen")
    && [
      "bookings",
      "courses",
      "content",
      "calendar",
      "attendance",
      "promotions",
      "analytics",
      "members",
      "rooms",
    ].every(
      (module) =>
        mobileHomePage.includes(`requiredModule: '${module}'`)
        || mobileHomePage.includes(`module: '${module}'`),
    )
    && mobileHomePage.includes("strings.exploreCourses"),
  "Mobile router and home page must link real marketplace, learning, notification, schedule, and module-aware organization routes"
);
for (const [fileName, fileContent] of [
  ["login_page.dart", mobileLoginPage],
  ["workspace_selection_page.dart", mobileWorkspacePage],
  ["access_denied_page.dart", mobileAccessDeniedPage],
  ["home_page.dart", mobileHomePage],
  ["my_courses_page.dart", mobileMyCoursesPage],
  ["lesson_bookings_page.dart", mobileLessonBookingsPage],
  ["attendance_page.dart", mobileAttendancePage],
  ["organization_attendance_page.dart", mobileOrganizationAttendancePage],
  ["organization_instructors_page.dart", mobileOrganizationInstructorsPage],
  ["organization_promotions_page.dart", mobileOrganizationPromotionsPage],
  ["organization_analytics_page.dart", mobileOrganizationAnalyticsPage],
  ["platform_overview_page.dart", mobilePlatformOverviewPage],
  ["platform_academy_approvals_page.dart", mobilePlatformAcademyApprovalsPage],
  ["platform_categories_page.dart", mobilePlatformCategoriesPage],
  ["platform_course_approvals_page.dart", mobilePlatformCourseApprovalsPage],
  ["platform_promotion_approvals_page.dart", mobilePlatformPromotionApprovalsPage],
  ["course_workspace_page.dart", mobileCourseWorkspacePage],
  ["schedule_page.dart", mobileSchedulePage],
  ["profile_page.dart", mobileProfilePage],
  ["notification_inbox_page.dart", mobileNotificationInboxPage],
  ["course_catalog_page.dart", mobileCourseCatalogPage],
  ["course_detail_page.dart", mobileCourseDetailPage],
  ["booking_success_page.dart", mobileBookingSuccessPage],
  ["placeholder_page.dart", mobilePlaceholderPage]
]) {
  assert.ok(fileContent.includes("AppStrings.of(context)"), `${fileName} must use localized strings`);
}
assert.ok(
  mobileWorkspacePage.includes("Semantics")
    && mobileWorkspacePage.includes("strings.loading")
    && mobileWorkspacePage.includes("selectWorkspace(workspace)")
    && mobileLoginPage.includes("Semantics"),
  "Mobile scaffold screens must include initial accessibility semantics"
);
assert.ok(
  mobileLocalizationDoc.includes("Arabic-first")
    && mobileLocalizationDoc.includes("AppStrings")
    && mobileLocalizationDoc.includes("RTL"),
  "Mobile localization documentation must describe Arabic-first RTL handling"
);
assert.ok(
  mobileAccessibilityReport.includes("semantic labels")
    && mobileAccessibilityReport.includes("TalkBack")
    && mobileAccessibilityReport.includes("VoiceOver"),
  "Mobile accessibility report must document implemented semantics and remaining checks"
);

console.log("Integration validation passed: frontend endpoints and backend routes are aligned.");
