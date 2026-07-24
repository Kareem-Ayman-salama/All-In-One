import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const routes = read("backend/routes/api.php");
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
const mobileDeviceRepository = read("mobile/lib/src/features/devices/data/device_repository.dart");
const mobileMetadataRepository = read("mobile/lib/src/features/metadata/data/metadata_repository.dart");
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
const mobileOrganizationContentController = read(
  "mobile/lib/src/features/organization/application/organization_content_controller.dart"
);
const mobileOrganizationContentPage = read(
  "mobile/lib/src/features/organization/presentation/organization_content_page.dart"
);
const mobileOrganizationProfilePage = read(
  "mobile/lib/src/features/organization/presentation/organization_profile_page.dart"
);
const mobileStudentLearningRepository = read("mobile/lib/src/features/learning/data/student_learning_repository.dart");
const mobileStudentLearningController = read("mobile/lib/src/features/learning/application/student_learning_controller.dart");
const mobileMyCoursesPage = read("mobile/lib/src/features/learning/presentation/my_courses_page.dart");
const mobileCourseWorkspacePage = read("mobile/lib/src/features/learning/presentation/course_workspace_page.dart");
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
const mobileEnvExample = read("mobile/.env.example");
const mobileApp = read("mobile/lib/src/app/app.dart");
const mobileAppRouter = read("mobile/lib/src/app/router/app_router.dart");
const mobileAppStrings = read("mobile/lib/src/app/localization/app_strings.dart");
const mobileLoginPage = read("mobile/lib/src/features/auth/presentation/login_page.dart");
const mobileAuthFlowPages = read("mobile/lib/src/features/auth/presentation/auth_flow_pages.dart");
const mobileWorkspacePage = read("mobile/lib/src/features/workspaces/presentation/workspace_selection_page.dart");
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

assert.equal(frontendRailway.deploy.startCommand, "npm start");
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

const mobileOpenApiRouteContracts = [
  ["/public/courses", "Route::get('/public/courses'"],
  ["/public/courses/{course}", "Route::get('/public/courses/{course}'"],
  ["/public/bookings", "Route::post('/public/bookings'"],
  ["/student/bookings", "Route::get('/student/bookings'"],
  ["/student/enrollments", "Route::get('/student/enrollments'"],
  ["/student/enrollments/{enrollment}", "Route::get('/student/enrollments/{enrollment}'"],
  ["/organizations/{organizationId}/content", "Route::get('/content'"],
  ["/organizations/{organizationId}/content/{contentId}", "Route::delete('/content/{content}'"],
  ["/organizations/{organizationId}", "Route::patch('/'"],
  ["/notifications", "Route::get('/notifications'"],
  ["/notifications/{notification}/read", "Route::post('/notifications/{notification}/read'"],
  ["/notifications/read-all", "Route::post('/notifications/read-all'"],
  ["/auth/login", "Route::post('/login'"],
  ["/auth/register", "Route::post('/register'"],
  ["/auth/verify-email", "Route::post('/verify-email'"],
  ["/auth/resend-verification", "Route::post('/resend-verification'"],
  ["/auth/forgot-password", "Route::post('/forgot-password'"],
  ["/auth/reset-password", "Route::post('/reset-password'"],
  ["/auth/refresh", "Route::post('/refresh'"],
  ["/auth/sessions", "Route::get('/sessions'"],
  ["/public/invitations/{token}", "Route::get('/public/invitations/{token}'"],
  ["/invitations/accept", "Route::post('/invitations/accept'"],
  ["/organizations/{organizationId}/courses", "Route::get('/courses'"],
  ["/organizations/{organizationId}/batches", "Route::get('/batches'"],
  ["/organizations/{organizationId}/rooms", "Route::get('/rooms'"],
  ["/organizations/{organizationId}/announcements", "Route::get('/announcements'"],
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
  mobileOpenApi.components.schemas.ContentItemSummary
    && mobileOpenApi.components.schemas.ContentFileAssetSummary
    && mobileOpenApi.components.schemas.CreateOrganizationContentLinkRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/content"]?.post
    && mobileOpenApi.paths["/organizations/{organizationId}/content/{contentId}"],
  "Mobile OpenAPI must include organization content list, link create, and delete contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.AppNotification
    && mobileOpenApi.paths["/notifications"]
    && mobileOpenApi.paths["/notifications/{notification}/read"]
    && mobileOpenApi.paths["/notifications/read-all"],
  "Mobile OpenAPI must include notification inbox and read-state contracts"
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
    && mobileOpenApi.paths["/organizations/{organizationId}/courses"]
    && mobileOpenApi.paths["/organizations/{organizationId}/batches"],
  "Mobile OpenAPI must include organization course and batch list contracts"
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
    && mobileOpenApi.paths["/organizations/{organizationId}/rooms"],
  "Mobile OpenAPI must include organization room list and create contracts"
);
assert.ok(
  mobileOpenApi.components.schemas.OrganizationAnnouncementSummary
    && mobileOpenApi.components.schemas.CreateOrganizationAnnouncementRequest
    && mobileOpenApi.paths["/organizations/{organizationId}/announcements"],
  "Mobile OpenAPI must include organization announcement list and create contracts"
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
    && mobileOpenApi.components.schemas.InvitationPreview
    && mobileOpenApi.components.schemas.InvitationAcceptance,
  "Mobile OpenAPI must include mobile auth completion and invitation contracts"
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
    && mobileApiIntegrationMap.includes("GET /api/v1/public/invitations/:token")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/bookings/:bookingId/confirm")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/courses")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/batches")
    && mobileApiIntegrationMap.includes("POST /api/v1/organizations/:id/invitations")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/rooms")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/announcements")
    && mobileApiIntegrationMap.includes("GET /api/v1/organizations/:id/events")
    && mobileApiIntegrationMap.includes("DELETE /api/v1/organizations/:id/events/:eventId")
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
    && mobileApiIntegrationMap.includes("organization_event_repository.dart")
    && mobileApiIntegrationMap.includes("organization_events_page.dart")
    && mobileApiIntegrationMap.includes("organization_task_repository.dart")
    && mobileApiIntegrationMap.includes("organization_tasks_page.dart")
    && mobileApiIntegrationMap.includes("organization_member_repository.dart")
    && mobileApiIntegrationMap.includes("organization_members_page.dart")
    && mobileApiIntegrationMap.includes("organization_content_controller.dart")
    && mobileApiIntegrationMap.includes("organization_content_page.dart")
    && mobileApiIntegrationMap.includes("organization_profile_page.dart")
    && mobileApiIntegrationMap.includes("organization_invitation_repository.dart")
    && mobileApiIntegrationMap.includes("organization_invitations_page.dart")
    && mobileApiIntegrationMap.includes("organization_booking_repository.dart")
    && mobileApiIntegrationMap.includes("organization_bookings_page.dart")
    && mobileApiIntegrationMap.includes("organization_course_repository.dart")
    && mobileApiIntegrationMap.includes("organization_courses_page.dart")
    && mobileApiIntegrationMap.includes("viewer-audit")
    && mobileApiIntegrationMap.includes("public_course_repository.dart")
    && mobileApiIntegrationMap.includes("course_detail_page.dart")
    && mobileApiIntegrationMap.includes("booking_success_page.dart")
    && mobileApiIntegrationMap.includes("student_learning_repository.dart")
    && mobileApiIntegrationMap.includes("my_courses_page.dart")
    && mobileApiIntegrationMap.includes("course_workspace_page.dart")
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
    && mobileImplementationPlan.includes("started with mobile booking review")
    && mobileImplementationPlan.includes("Booking confirm, reject, and cancel actions")
    && mobileImplementationPlan.includes("Courses and batches list review is wired")
    && mobileImplementationPlan.includes("Course/batch create and edit steppers remain pending")
    && mobileImplementationPlan.includes("Invitation list, create, resend, and cancel are wired")
    && mobileImplementationPlan.includes("Room list and create are wired")
    && mobileImplementationPlan.includes("room edit/delete/member")
    && mobileImplementationPlan.includes("Public course catalog is wired")
    && mobileImplementationPlan.includes("Public booking submit is wired")
    && mobileImplementationPlan.includes("Booking success is routed")
    && mobileImplementationPlan.includes("My courses/enrollments is wired")
    && mobileImplementationPlan.includes("Course workspace entry is wired")
    && mobileImplementationPlan.includes("Protected course content is wired")
    && mobileImplementationPlan.includes("avoids displaying or persisting the signed URL")
    && mobileImplementationPlan.includes("Notification inbox and tap routing")
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
    && mobileReadme.includes("make -C mobile ci")
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
  mobileCiWorkflow.includes('"mobile/**"')
    && mobileCiWorkflow.includes("subosito/flutter-action@v2")
    && mobileCiWorkflow.includes("channel: stable")
    && mobileCiWorkflow.includes("flutter pub get")
    && mobileCiWorkflow.includes("dart run build_runner build --delete-conflicting-outputs")
    && mobileCiWorkflow.includes("dart format --set-exit-if-changed lib")
    && mobileCiWorkflow.includes("flutter analyze")
    && mobileCiWorkflow.includes("flutter test")
    && mobileCiWorkflow.includes("flutter build apk")
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
    && mobileReleaseGuide.includes("make -C mobile build-production-appbundle")
    && mobileReleaseGuide.includes("make -C mobile build-production-ipa"),
  "Mobile release guide must require approvals and internal testing before store rollout"
);
assert.ok(
  mobileStoreChecklist.includes("flutter build appbundle --flavor production")
    && mobileStoreChecklist.includes("flutter build ipa --flavor production")
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
    && mobileNavigationDoc.includes("/organization/courses")
    && mobileNavigationDoc.includes("/organization/bookings")
    && mobileNavigationDoc.includes("/organization/content")
    && mobileNavigationDoc.includes("/organization/profile")
    && mobileNavigationDoc.includes("/organization/invitations")
    && mobileNavigationDoc.includes("/organization/rooms")
    && mobileNavigationDoc.includes("/organization/announcements")
    && mobileNavigationDoc.includes("/organization/events")
    && mobileNavigationDoc.includes("/organization/tasks")
    && mobileNavigationDoc.includes("/organization/members")
    && mobileNavigationDoc.includes("/my-courses/enrollments/:enrollmentId")
    && mobileNavigationDoc.includes("Permission-level route guards still need to be extended"),
  "Mobile navigation documentation must describe current routes and remaining permission guard work"
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
    && mobileKnownLimitationsDoc.includes("Permission-level route guards"),
  "Mobile known limitations must state current build, native, and guard gaps"
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
    && mobileOrganizationBookingsPage.includes("confirmBooking")
    && mobileOrganizationBookingsPage.includes("rejectBooking")
    && mobileOrganizationBookingsPage.includes("cancelBooking")
    && mobileAppRouter.includes("OrganizationBookingsPage.routePath")
    && mobileHomePage.includes("OrganizationBookingsPage.routePath"),
  "Mobile organization booking page must be routed and expose backend decision actions"
);
assert.ok(
  mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/courses'")
    && mobileOrganizationCourseRepository.includes("'/organizations/$organizationId/batches'")
    && mobileOrganizationCourseRepository.includes("Future.wait")
    && mobileOrganizationCourseRepository.includes("OrganizationCoursesOverview")
    && mobileOrganizationCourseRepository.includes("OrganizationCourseSummary")
    && mobileOrganizationCourseRepository.includes("OrganizationBatchSummary")
    && mobileOrganizationCourseRepository.includes("remainingSeats"),
  "Mobile organization course repository must load real course and batch lists"
);
assert.ok(
  mobileOrganizationCourseController.includes("organizationCoursesOverviewProvider")
    && mobileOrganizationCourseController.includes("FutureProvider.autoDispose")
    && mobileOrganizationCourseController.includes("getOverview(organizationId: organizationId)"),
  "Mobile organization course controller must expose a courses overview provider"
);
assert.ok(
  mobileOrganizationCoursesPage.includes("OrganizationCoursesPage")
    && mobileOrganizationCoursesPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationCoursesPage.includes("organizationCoursesOverviewProvider")
    && mobileOrganizationCoursesPage.includes("batchesForCourse(course.id)")
    && mobileOrganizationCoursesPage.includes("courseStatusLabel")
    && mobileAppRouter.includes("OrganizationCoursesPage.routePath")
    && mobileHomePage.includes("OrganizationCoursesPage.routePath"),
  "Mobile organization courses page must be routed and render backend course/batch state"
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
    && mobileOrganizationInvitationsPage.includes("showModalBottomSheet")
    && mobileOrganizationInvitationsPage.includes("CreateOrganizationInvitationCommand")
    && mobileOrganizationInvitationsPage.includes("resend(")
    && mobileOrganizationInvitationsPage.includes("cancel(")
    && mobileAppRouter.includes("OrganizationInvitationsPage.routePath")
    && mobileHomePage.includes("OrganizationInvitationsPage.routePath"),
  "Mobile organization invitations page must be routed and expose invite/resend/cancel actions"
);
assert.ok(
  mobileOrganizationRoomRepository.includes("'/organizations/$organizationId/rooms'")
    && mobileOrganizationRoomRepository.includes("listRooms")
    && mobileOrganizationRoomRepository.includes("createRoom")
    && mobileOrganizationRoomRepository.includes("CreateOrganizationRoomCommand")
    && mobileOrganizationRoomRepository.includes("OrganizationRoomSummary")
    && mobileOrganizationRoomRepository.includes("membershipsCount"),
  "Mobile organization room repository must call real room list and create endpoints"
);
assert.ok(
  mobileOrganizationRoomController.includes("organizationRoomsProvider")
    && mobileOrganizationRoomController.includes("FutureProvider.autoDispose")
    && mobileOrganizationRoomController.includes("OrganizationRoomActions")
    && mobileOrganizationRoomController.includes("organizationRoomsProvider(organizationId)"),
  "Mobile organization room controller must expose list and create providers"
);
assert.ok(
  mobileOrganizationRoomsPage.includes("OrganizationRoomsPage")
    && mobileOrganizationRoomsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationRoomsPage.includes("organizationRoomsProvider")
    && mobileOrganizationRoomsPage.includes("showModalBottomSheet")
    && mobileOrganizationRoomsPage.includes("CreateOrganizationRoomCommand")
    && mobileOrganizationRoomsPage.includes("createRoom")
    && mobileAppRouter.includes("OrganizationRoomsPage.routePath")
    && mobileHomePage.includes("OrganizationRoomsPage.routePath"),
  "Mobile organization rooms page must be routed and expose room list/create actions"
);
assert.ok(
  mobileOrganizationAnnouncementRepository.includes(
    "'/organizations/$organizationId/announcements'"
  )
    && mobileOrganizationAnnouncementRepository.includes("listAnnouncements")
    && mobileOrganizationAnnouncementRepository.includes("createAnnouncement")
    && mobileOrganizationAnnouncementRepository.includes(
      "CreateOrganizationAnnouncementCommand"
    )
    && mobileOrganizationAnnouncementRepository.includes(
      "OrganizationAnnouncementSummary"
    )
    && mobileOrganizationAnnouncementRepository.includes("publishedAt"),
  "Mobile organization announcement repository must call real announcement list and create endpoints"
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
    && mobileOrganizationAnnouncementController.includes(
      "organizationAnnouncementsProvider(organizationId)"
    ),
  "Mobile organization announcement controller must expose list and create providers"
);
assert.ok(
  mobileOrganizationAnnouncementsPage.includes("OrganizationAnnouncementsPage")
    && mobileOrganizationAnnouncementsPage.includes(
      "activeWorkspaceControllerProvider"
    )
    && mobileOrganizationAnnouncementsPage.includes(
      "organizationAnnouncementsProvider"
    )
    && mobileOrganizationAnnouncementsPage.includes("showModalBottomSheet")
    && mobileOrganizationAnnouncementsPage.includes(
      "CreateOrganizationAnnouncementCommand"
    )
    && mobileOrganizationAnnouncementsPage.includes("pinAnnouncement")
    && mobileAppRouter.includes("OrganizationAnnouncementsPage.routePath")
    && mobileHomePage.includes("OrganizationAnnouncementsPage.routePath"),
  "Mobile organization announcements page must be routed and expose announcement list/create actions"
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
    && mobileOrganizationEventRepository.includes("meetingProvider"),
  "Mobile organization event repository must call real event list, create, and delete endpoints"
);
assert.ok(
  mobileOrganizationEventController.includes("organizationEventsProvider")
    && mobileOrganizationEventController.includes("FutureProvider.autoDispose")
    && mobileOrganizationEventController.includes("OrganizationEventActions")
    && mobileOrganizationEventController.includes(
      "organizationEventsProvider(organizationId)"
    ),
  "Mobile organization event controller must expose list, create, and delete providers"
);
assert.ok(
  mobileOrganizationEventsPage.includes("OrganizationEventsPage")
    && mobileOrganizationEventsPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationEventsPage.includes("organizationEventsProvider")
    && mobileOrganizationEventsPage.includes("showModalBottomSheet")
    && mobileOrganizationEventsPage.includes("CreateOrganizationEventCommand")
    && mobileOrganizationEventsPage.includes("deleteEvent")
    && mobileOrganizationEventsPage.includes("DateTime.tryParse")
    && mobileAppRouter.includes("OrganizationEventsPage.routePath")
    && mobileHomePage.includes("OrganizationEventsPage.routePath"),
  "Mobile organization events page must be routed and expose event list/create/delete actions"
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
    && mobileOrganizationTasksPage.includes("showModalBottomSheet")
    && mobileOrganizationTasksPage.includes("CreateOrganizationTaskCommand")
    && mobileOrganizationTasksPage.includes("UpdateOrganizationTaskCommand")
    && mobileOrganizationTasksPage.includes("DropdownButtonFormField<String>")
    && mobileOrganizationTasksPage.includes("deleteTask")
    && mobileAppRouter.includes("OrganizationTasksPage.routePath")
    && mobileHomePage.includes("OrganizationTasksPage.routePath"),
  "Mobile organization tasks page must be routed and expose task list/create/update/delete actions"
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
    && mobileOrganizationMembersPage.includes("UpdateOrganizationMemberCommand")
    && mobileOrganizationMembersPage.includes("DropdownButtonFormField<String>")
    && mobileOrganizationMembersPage.includes("removeMember")
    && mobileOrganizationMembersPage.includes("organizationRoleLabel")
    && mobileAppRouter.includes("OrganizationMembersPage.routePath")
    && mobileHomePage.includes("OrganizationMembersPage.routePath"),
  "Mobile organization members page must be routed and expose member list/update/remove actions"
);
assert.ok(
  mobileContentRepository.includes("createLinkContent")
    && mobileContentRepository.includes("deleteContent")
    && mobileContentRepository.includes("CreateLinkContentCommand")
    && mobileContentRepository.includes("externalUrl")
    && mobileContentRepository.includes("'type': 'link'"),
  "Mobile content repository must support link content creation and deletion"
);
assert.ok(
  mobileOrganizationContentController.includes("organizationContentProvider")
    && mobileOrganizationContentController.includes("FutureProvider.autoDispose")
    && mobileOrganizationContentController.includes("OrganizationContentActions")
    && mobileOrganizationContentController.includes(
      "organizationContentProvider(organizationId)"
    ),
  "Mobile organization content controller must expose content list/create/delete providers"
);
assert.ok(
  mobileOrganizationContentPage.includes("OrganizationContentPage")
    && mobileOrganizationContentPage.includes("activeWorkspaceControllerProvider")
    && mobileOrganizationContentPage.includes("organizationContentProvider")
    && mobileOrganizationContentPage.includes("organizationRoomsProvider")
    && mobileOrganizationContentPage.includes("CreateLinkContentCommand")
    && mobileOrganizationContentPage.includes("Uri.tryParse")
    && mobileOrganizationContentPage.includes("deleteContent")
    && mobileAppRouter.includes("OrganizationContentPage.routePath")
    && mobileHomePage.includes("OrganizationContentPage.routePath"),
  "Mobile organization content page must be routed and expose content list/link-create/delete actions"
);
assert.ok(
  mobileWorkspaceRepository.includes("'/workspaces'")
    && mobileWorkspaceRepository.includes("'/organizations/$organizationId/context'")
    && mobileWorkspaceRepository.includes("updateOrganization")
    && mobileWorkspaceRepository.includes("UpdateOrganizationCommand")
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
    && mobileContentViewerController.includes("state = const AsyncData(null)"),
  "Mobile content viewer controller must manage lifecycle audit and clear signed URL state"
);
assert.ok(
  mobileNotificationRepository.includes("'/notifications'")
    && mobileNotificationRepository.includes("'/notifications/read-all'"),
  "Mobile notification repository must implement inbox read state endpoints"
);
assert.ok(
  mobileNotificationRepository.includes("queryParameters: const <String, Object?>{'perPage': 100}")
    && mobileNotificationRepository.includes("'/notifications/$notificationId/read'")
    && mobileNotificationRepository.includes("target_type")
    && mobileNotificationRepository.includes("read_at")
    && mobileNotificationRepository.includes("data['route']")
    && mobileNotificationRepository.includes("_readJsonObjectOrEmpty"),
  "Mobile notification repository must parse backend notification targets, data routes, and read state"
);
assert.ok(
  mobileNotificationController.includes("notificationInboxProvider")
    && mobileNotificationController.includes("FutureProvider.autoDispose")
    && mobileNotificationController.includes("listNotifications()"),
  "Mobile notification controller must expose an inbox provider"
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
    && mobileNotificationTapRouter.includes("targetType")
    && mobileNotificationTapRouter.includes("CourseDetailPage.location")
    && mobileNotificationTapRouter.includes("MyCoursesPage.routePath"),
  "Mobile notification tap router must resolve manifest and target-based notification destinations"
);
assert.ok(
  mobileNotificationInboxPage.includes("NotificationInboxPage")
    && mobileNotificationInboxPage.includes("notificationInboxProvider")
    && mobileNotificationInboxPage.includes("markRead(notification.id)")
    && mobileNotificationInboxPage.includes("markAllRead")
    && mobileNotificationInboxPage.includes("notificationTapRouterProvider")
    && mobileNotificationInboxPage.includes("context.go(location)")
    && mobileNotificationInboxPage.includes("highlightNotificationId")
    && mobileNotificationInboxPage.includes("RefreshIndicator"),
  "Mobile notification inbox page must list notifications, mark read, and route taps"
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
    && mobileCourseWorkspacePage.includes("close()")
    && mobileCourseWorkspacePage.includes("detail.access.allowed")
    && mobileCourseWorkspacePage.includes("_LockedCourseState")
    && mobileCourseWorkspacePage.includes("activeAccess")
    && mobileCourseWorkspacePage.includes("nextSession")
    && mobileCourseWorkspacePage.includes("courseContentPending")
    && mobileCourseWorkspacePage.includes("noAnnouncementsYet")
    && mobileCourseWorkspacePage.includes("MyCoursesPage.routePath"),
  "Mobile course workspace page must validate enrollment access and open protected room content"
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
    && mobileBookingSuccessPage.includes("pendingAcademyConfirmation")
    && mobileBookingSuccessPage.includes("CourseCatalogPage.routePath"),
  "Mobile booking success page must show public booking confirmation and return to catalog"
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
    && mobileDeepLinksDoc.includes("fallbackPath"),
  "Mobile deep-link documentation must describe manifest-based routing"
);
assert.ok(
  mobileOfflineStrategyDoc.includes("content.view_session")
    && mobileOfflineStrategyDoc.includes("memory-only")
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
    && mobileReleaseReadinessDoc.includes("Next Release Milestone"),
  "Mobile release readiness must provide the current release decision and next milestone"
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
    && mobileAppStrings.includes("استكشف الكورسات")
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
    && mobileAppStrings.includes("Download disabled")
    && mobileAppStrings.includes("Watermark protected")
    && mobileAppStrings.includes("Notifications")
    && mobileAppStrings.includes("Mark all read")
    && mobileAppStrings.includes("Unread"),
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
    && mobileAppRouter.includes("CourseWorkspacePage.routePath")
    && mobileAppRouter.includes("NotificationInboxPage.routePath")
    && mobileHomePage.includes("CourseCatalogPage.routePath")
    && mobileHomePage.includes("NotificationInboxPage.routePath")
    && mobileHomePage.includes("strings.exploreCourses"),
  "Mobile router and home page must link real public marketplace routes"
);
for (const [fileName, fileContent] of [
  ["login_page.dart", mobileLoginPage],
  ["workspace_selection_page.dart", mobileWorkspacePage],
  ["home_page.dart", mobileHomePage],
  ["my_courses_page.dart", mobileMyCoursesPage],
  ["course_workspace_page.dart", mobileCourseWorkspacePage],
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
