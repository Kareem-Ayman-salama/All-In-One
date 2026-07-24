import { FileText, Play, Shield, Video } from "lucide-react";
import { Navigate, useParams } from "react-router-dom";
import { AccountSettings } from "../components/AccountSettings";
import { Button } from "../components/Button";
import {
  AnnouncementsPage,
  MemberDashboard,
  MeetingsPage,
  StudentCoursesPage,
  TasksPage
} from "../components/LearningOperations";
import { NotificationCenterPage, WorkspaceCalendarPage } from "../components/WorkspaceOperations";
import { useBilingualText } from "../contexts/LanguageContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { AppLayout } from "../layouts/AppLayout";
import { StudentBookingPage } from "./StudentBookingPage";
import { StudentCourseWorkspace, StudentMarketplaceCourses } from "../components/StudentMarketplaceOperations";

const nav = [
  { id: "home", label: "Dashboard", icon: "dashboard", path: "/end-user/home" },
  { id: "bookings", label: "Book a teacher", icon: "bookings", path: "/end-user/bookings", roles: ["student"] },
  { id: "courses", label: "My learning", icon: "courses", path: "/end-user/courses", module: "courses" },
  { id: "announcements", label: "Announcements", icon: "announcements", path: "/end-user/announcements", module: "announcements" },
  { id: "meetings", label: "Meetings", icon: "meetings", path: "/end-user/meetings", module: "meetings" },
  { id: "tasks", label: "Tasks", icon: "tasks", path: "/end-user/tasks", module: "tasks" },
  { id: "files", label: "Protected Files", icon: "files", path: "/end-user/files" },
  { id: "calendar", label: "Calendar", icon: "calendar", path: "/end-user/calendar" },
  { id: "notifications", label: "Notifications", icon: "notifications", path: "/end-user/notifications" },
  { id: "settings", label: "Settings", icon: "settings", path: "/end-user/settings" }
];

export function EndUserApp({ data, user }) {
  const { page = "home" } = useParams();
  const tx = useBilingualText();
  const workspace = useWorkspace();
  const { isModuleEnabled, activeMembership } = useOrganization();
  const appUser = {
    ...user,
    roleLabel: activeMembership?.role === "student" ? tx("طالب", "Student") : tx("موظف", "Employee")
  };
  const appData = {
    ...data,
    files: workspace.files,
    rooms: workspace.rooms,
    notifications: workspace.notifications
  };
  const visibleNav = nav.filter((item) => {
    const hasModule = !item.module || isModuleEnabled(item.module);
    const hasRole = !item.roles || item.roles.includes(activeMembership?.role);
    return hasModule && hasRole;
  });

  if (!visibleNav.some((item) => item.id === page) && page !== "course") {
    return <Navigate to="/end-user/home" replace />;
  }

  return (
    <AppLayout appTitle="End User" user={appUser} nav={visibleNav}>
      {page === "home" && <MemberDashboard data={appData} user={user} />}
      {page === "bookings" && <StudentBookingPage user={user} />}
      {page === "courses" && <StudentMarketplaceCourses user={user} />}
      {page === "course" && <StudentCourseWorkspace user={user} />}
      {page === "announcements" && <AnnouncementsPage />}
      {page === "meetings" && <MeetingsPage />}
      {page === "tasks" && <TasksPage />}
      {page === "files" && <ProtectedFiles data={appData} user={user} />}
      {page === "calendar" && <WorkspaceCalendarPage />}
      {page === "notifications" && <NotificationCenterPage user={user} />}
      {page === "settings" && <AccountSettings user={user} workspaceLabel="End User workspace" />}
    </AppLayout>
  );
}

function ProtectedFiles({ data, user }) {
  const tx = useBilingualText();
  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("عارض الملفات المحمي", "Protected file viewer")}</h1>
          <p>{tx("عرض آمن للملفات والفيديوهات مع علامة مائية وتحكم كامل في المشاهدة.", "Secure PDF and video viewing with watermarking and controlled access.")}</p>
        </div>
      </div>
      <section className="stitch-viewer-screen">
        <div className="stitch-viewer-toolbar">
          <Button variant="ghost">{tx("إغلاق العارض", "Close viewer")}</Button>
          <span>{tx("1 من 24", "1 of 24")}</span>
          <strong>100%</strong>
          <span>{tx("تقرير الميزانية السنوي.pdf", "annual-budget-report.pdf")}</span>
        </div>
        <div className="stitch-document-stage">
          <div className="watermark">{user.email} / AIO / 192.168.1.42</div>
          <div className="doc-line short" />
          <div className="doc-line" />
          <div className="doc-line mid" />
          <div className="doc-boxes"><span /><span /><span /></div>
          <div className="doc-line" /><div className="doc-line" /><div className="doc-line mid" />
          <strong>PROTECTED</strong>
        </div>
        <aside className="stitch-viewer-side">
          <h2>{tx("ملفات الغرفة الآمنة", "Secure room files")}</h2>
          {data.files.map((file, index) => (
            <button className={index === 0 ? "active" : ""} type="button" key={file.id}>
              <FileText size={20} />
              <span>{file.name}<small>{file.size}</small></span>
            </button>
          ))}
          <div className="stitch-security-note"><Shield size={18} /> {tx("الوصول مراقب ومشفر بالكامل", "Access is monitored and fully encrypted")}</div>
        </aside>
      </section>
      <section className="stitch-video-panel">
        <Video size={36} />
        <strong>{tx("بث فيديو آمن", "Secure video streaming")}</strong>
        <span>{tx("تطبق نفس سياسة الحماية على الفيديوهات مع العلامة المائية وتعطيل التحميل.", "The same protection policy applies to video, including watermarking and download blocking.")}</span>
        <Button variant="ghost"><Play size={16} /> {tx("معاينة", "Preview")}</Button>
      </section>
    </>
  );
}
