import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loading } from "./components/Loading";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage, useBilingualText } from "./contexts/LanguageContext";
import { WorkspaceProvider } from "./contexts/WorkspaceContext";
import { useOrganization } from "./contexts/OrganizationContext";
import { LearningProvider } from "./contexts/LearningContext";
import { CreateAccountPage, ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from "./pages/AuthCyclePages";
import { LoginPage } from "./pages/LoginPage";
import { RolePicker } from "./pages/RolePicker";
import { WorkspaceSelectionPage } from "./pages/WorkspaceSelectionPage";
import { api } from "./services/api";

const EndUserApp = lazy(() => import("./pages/EndUserApp").then((m) => ({ default: m.EndUserApp })));
const SuperAdminApp = lazy(() => import("./pages/SuperAdminApp").then((m) => ({ default: m.SuperAdminApp })));
const TenantAdminApp = lazy(() => import("./pages/TenantAdminApp").then((m) => ({ default: m.TenantAdminApp })));

const CoursesMarketplacePage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.CoursesMarketplacePage })));
const CourseSellerPage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.CourseSellerPage })));
const CourseDetailsPage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.CourseDetailsPage })));
const AcademiesPage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.AcademiesPage })));
const AcademyProfilePage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.AcademyProfilePage })));
const PublicBookingPage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.PublicBookingPage })));
const BookingSuccessPage = lazy(() => import("./pages/MarketplacePages").then((m) => ({ default: m.BookingSuccessPage })));

const CompanyOnboardingPage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.CompanyOnboardingPage })));
const InviteAcceptPage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.InviteAcceptPage })));
const JoinWorkspacePage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.JoinWorkspacePage })));
const LegalPage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.LegalPage })));
const NoWorkspacePage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.NoWorkspacePage })));
const NotFoundPage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.NotFoundPage })));
const RegisterCompanyPage = lazy(() => import("./pages/WorkspaceFlowPages").then((m) => ({ default: m.RegisterCompanyPage })));
const AttendanceCheckInPage = lazy(() => import("./components/AttendanceOperations").then((m) => ({ default: m.AttendanceCheckInPage })));

export function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-account" element={<CreateAccountPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/workspace" element={<LandingRedirect />} />
          <Route path="/choose" element={<LandingRedirect />} />
          <Route path="/" element={<MarketingLandingRedirect />} />
          <Route path="/register-company" element={<RegisterCompanyPage />} />
          <Route path="/company-onboarding" element={<CompanyOnboardingPage />} />
          <Route path="/join" element={<JoinWorkspacePage />} />
          <Route path="/no-workspace" element={<NoWorkspacePage />} />
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/support" element={<LegalPage type="support" />} />
          <Route path="/courses" element={<CoursesMarketplacePage />} />
          <Route path="/sell-courses" element={<CourseSellerPage />} />
          <Route path="/courses/:courseSlug" element={<CourseDetailsPage />} />
          <Route path="/academies" element={<AcademiesPage />} />
          <Route path="/academies/:academySlug" element={<AcademyProfilePage />} />
          <Route path="/booking/:courseId" element={<PublicBookingPage />} />
          <Route path="/booking/success" element={<BookingSuccessPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/workspaces" element={<WorkspaceSelectionPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["end-user"]} />}>
            <Route path="/attendance/check-in" element={<AttendanceCheckInPage />} />
            <Route path="/end-user" element={<Navigate to="/end-user/home" replace />} />
            <Route path="/end-user/:page" element={<DataGate app="endUser" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["tenant-admin"]} />}>
            <Route path="/tenant-admin" element={<Navigate to="/tenant-admin/dashboard" replace />} />
            <Route path="/tenant-admin/:page" element={<DataGate app="tenant" />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["super-admin"]} />}>
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="/super-admin/:page" element={<DataGate app="platform" />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

function LandingRedirect() {
  return <RolePicker />;
}

function MarketingLandingRedirect() {
  window.location.replace("/landing/index.html");
  return <Loading />;
}

function normalizeCalendarEvent(event) {
  const startsAt = event.startsAt || null;
  const startDate = startsAt ? new Date(startsAt) : null;
  const validStart = startDate && !Number.isNaN(startDate.getTime());
  return {
    ...event,
    date: event.date || (startsAt ? startsAt.slice(0, 10) : ""),
    time: event.time || (validStart
      ? startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      : ""),
    roomName: event.roomName || (event.isPrivate ? "Personal" : "Academy"),
    private: event.private ?? event.isPrivate ?? false
  };
}

function DataGate({ app }) {
  const { user } = useAuth();
  const { loading: organizationLoading, activeOrganization, memberships } = useOrganization();
  const { direction } = useLanguage();
  const bt = useBilingualText();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setData(null);
    setLoadError(null);
    const load = async () => {
      try {
        const organizationId = activeOrganization?.id;
        if (app === "platform") {
          const [tenants, platformAnalytics] = await Promise.all([
            api.getTenants(true),
            api.getAnalytics("platform")
          ]);
          if (mounted) setData({
            rooms: [], files: [], members: [], notifications: [],
            endAnalytics: [], tenantAnalytics: [], tenants, platformAnalytics
          });
          return;
        }

        if (app === "endUser" && memberships.length > 1) {
          const [workspaces, personalReminders] = await Promise.all([
            Promise.all(memberships.map(async (membership) => {
            const organizationId = membership.organizationId;
            const [rooms, files, notifications, events] = await Promise.all([
              api.getRooms(organizationId),
              api.getFiles(organizationId),
              api.getNotifications(organizationId),
              api.getEvents(organizationId)
            ]);
            const organizationName = membership.organization?.nameAr || membership.organization?.name;
            const decorate = (items) => items.map((item) => ({
              ...item,
              organizationId,
              organizationName
            }));
            return {
              rooms: decorate(rooms),
              files: decorate(files),
              notifications: decorate(notifications),
              events: decorate(events).map(normalizeCalendarEvent)
            };
            })),
            api.getPersonalReminders()
          ]);
          const uniqueById = (items) => Array.from(new Map(items.map((item) => [item.id, item])).values());
          const organizationNames = new Map(memberships.map((membership) => [
            membership.organizationId,
            membership.organization?.nameAr || membership.organization?.name
          ]));
          const reminders = personalReminders.map((event) => normalizeCalendarEvent({
            ...event,
            organizationName: organizationNames.get(event.organizationId)
          }));
          if (mounted) setData({
            rooms: uniqueById(workspaces.flatMap((item) => item.rooms)),
            files: uniqueById(workspaces.flatMap((item) => item.files)),
            notifications: uniqueById(workspaces.flatMap((item) => item.notifications)),
            events: uniqueById([...workspaces.flatMap((item) => item.events), ...reminders]),
            members: [], tenants: [], endAnalytics: [], tenantAnalytics: [], platformAnalytics: []
          });
          return;
        }

        const common = [
          api.getRooms(organizationId),
          api.getFiles(organizationId),
          api.getNotifications(organizationId),
          api.getEvents(organizationId)
        ];
        if (app === "tenant") {
          const [rooms, files, notifications, events, members, tenantAnalytics] = await Promise.all([
            ...common,
            api.getMembers(organizationId),
            api.getAnalytics("tenant", organizationId)
          ]);
          if (mounted) setData({
            rooms, files, members, notifications,
            events: events.map(normalizeCalendarEvent),
            tenantAnalytics,
            tenants: [], endAnalytics: [], platformAnalytics: []
          });
          return;
        }

        const [rooms, files, notifications, events, personalReminders] = await Promise.all([
          ...common,
          api.getPersonalReminders()
        ]);
        if (mounted) setData({
          rooms, files, notifications,
          events: [...events, ...personalReminders].map(normalizeCalendarEvent),
          members: [], tenants: [],
          endAnalytics: [], tenantAnalytics: [], platformAnalytics: []
        });
      } catch (error) {
        if (mounted) setLoadError(error);
      }
    };
    if (!organizationLoading) load();
    return () => {
      mounted = false;
    };
  }, [activeOrganization?.id, app, memberships, organizationLoading]);

  const appData = useMemo(() => {
    if (!data) return null;
    return {
      endUser: { rooms: data.rooms, files: data.files, notifications: data.notifications, analytics: data.endAnalytics },
      tenant: { rooms: data.rooms, files: data.files, members: data.members, notifications: data.notifications, analytics: data.tenantAnalytics },
      platform: { tenants: data.tenants, analytics: data.platformAnalytics }
    };
  }, [data]);

  if (loadError) {
    return (
      <main className="error-page" dir={direction}>
        <section className="card error-card">
          <h1>{bt("تعذر تحميل مساحة العمل", "Failed to load workspace")}</h1>
          <p>{loadError.message}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            {bt("إعادة المحاولة", "Try again")}
          </button>
        </section>
      </main>
    );
  }
  if (!appData || organizationLoading) return <Loading />;
  if (user.role !== "super-admin" && !activeOrganization) return <Navigate to="/workspaces" replace />;
  const content = app === "endUser"
    ? <EndUserApp data={appData.endUser} user={user} />
    : app === "tenant"
      ? <TenantAdminApp data={appData.tenant} user={user} />
      : <SuperAdminApp data={appData.platform} user={user} />;

  return (
    <WorkspaceProvider key={activeOrganization?.id || "platform"} initialData={data}>
      <LearningProvider>{content}</LearningProvider>
    </WorkspaceProvider>
  );
}
