import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, Maximize2, Minimize2, PictureInPicture2, Play, Shield, Video } from "lucide-react";
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
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { AppLayout } from "../layouts/AppLayout";
import { StudentBookingPage } from "./StudentBookingPage";
import { StudentCourseWorkspace, StudentMarketplaceCourses } from "../components/StudentMarketplaceOperations";
import { StudentAttendancePage } from "../components/AttendanceOperations";
import { StudentAssignmentsWorkspaceTab, StudentQuizzesWorkspaceTab } from "../components/AssignmentsQuizzesOperations";
import { CertificatesHub } from "../components/CertificatesOperations";
import { InvoicesOperations } from "../components/InvoicesOperations";
import { LiveMeetingScheduler } from "../components/LiveMeetingScheduler";
import { InternalChatHub } from "../components/InternalChatHub";
import { SecureContentProtectionWrapper } from "../components/SecureContentProtectionWrapper";
import { api } from "../services/api";
import { CONTENT_VIEWER_EVENTS, viewerAuditPayload } from "../services/contentViewerAudit";

const nav = [
  { id: "home", label: "Dashboard", icon: "dashboard", path: "/end-user/home", primary: true },
  { id: "courses", label: "My learning", icon: "courses", path: "/end-user/courses", module: "courses", primary: true },
  { id: "calendar", label: "Calendar", icon: "calendar", path: "/end-user/calendar", primary: true },
  { id: "invoices", label: "Invoices & Receipts", icon: "subscription", path: "/end-user/invoices", primary: true },
  { id: "messages", label: "Internal chat", icon: "messages", path: "/end-user/messages", primary: true },
  { id: "settings", label: "Settings", icon: "settings", path: "/end-user/settings", primary: true },
  { id: "guardianAttendance", label: "Family & Guardian Portal", icon: "guardians", path: "/end-user/guardianAttendance", roles: ["guardian"], primary: true },
  { id: "bookings", label: "Book a teacher", icon: "bookings", path: "/end-user/bookings", roles: ["student"] },
  { id: "assignments", label: "Assignments", icon: "tasks", path: "/end-user/assignments", module: "courses" },
  { id: "quizzes", label: "Quizzes", icon: "courses", path: "/end-user/quizzes", module: "courses" },
  { id: "certificates", label: "Certificates", icon: "courses", path: "/end-user/certificates", module: "courses" },
  { id: "attendance", label: "My attendance", icon: "attendance", path: "/end-user/attendance", module: "attendance", roles: ["student"] },
  { id: "meetings", label: "Live Meetings", icon: "meetings", path: "/end-user/meetings" },
  { id: "announcements", label: "Announcements", icon: "announcements", path: "/end-user/announcements", module: "announcements" },
  { id: "tasks", label: "Tasks", icon: "tasks", path: "/end-user/tasks", module: "tasks" },
  { id: "files", label: "Protected Files", icon: "files", path: "/end-user/files" },
  { id: "notifications", label: "Notifications", icon: "notifications", path: "/end-user/notifications" }
];

export function EndUserApp({ data, user }) {
  const { page = "home" } = useParams();
  const tx = useBilingualText();
  const workspace = useWorkspace();
  const { isModuleEnabled, activeMembership } = useOrganization();
  const appUser = {
    ...user,
    roleLabel: activeMembership?.role === "student"
      ? tx("طالب", "Student")
      : activeMembership?.role === "guardian"
        ? tx("ولي أمر", "Guardian")
        : tx("موظف", "Employee")
  };
  const appData = {
    ...data,
    files: workspace.files,
    rooms: workspace.rooms,
    notifications: workspace.notifications
  };
  const allowedPages = nav.filter((item) => {
    const hasModule = !item.module || isModuleEnabled(item.module);
    const hasRole = !item.roles || item.roles.includes(activeMembership?.role);
    return hasModule && hasRole;
  });
  const sidebarNav = allowedPages.filter((item) => item.primary);

  if (!allowedPages.some((item) => item.id === page) && page !== "course") {
    return <Navigate to="/end-user/home" replace />;
  }

  return (
    <AppLayout appTitle="End User" user={appUser} nav={sidebarNav}>
      {page === "home" && <MemberDashboard data={appData} user={user} />}
      {page === "bookings" && <StudentBookingPage user={user} />}
      {page === "courses" && <StudentMarketplaceCourses user={user} />}
      {page === "assignments" && <section style={{ padding: "24px" }}><header className="stitch-page-head"><div><h1>{tx("واجباتي الدراسية", "My Assignments")}</h1><p>{tx("قم برفع الحلول ومتابعة تقييم المدرس والدرجات.", "Submit work and check instructor feedback.")}</p></div></header><StudentAssignmentsWorkspaceTab /></section>}
      {page === "quizzes" && <section style={{ padding: "24px" }}><header className="stitch-page-head"><div><h1>{tx("الاختبارات والتقييمات", "Quizzes & Assessments")}</h1><p>{tx("اختبر معلوماتك مع التصحيح الفوري.", "Test your knowledge with auto-grading.")}</p></div></header><StudentQuizzesWorkspaceTab /></section>}
      {page === "certificates" && <section style={{ padding: "24px" }}><CertificatesHub /></section>}
      {page === "invoices" && <section style={{ padding: "24px" }}><InvoicesOperations /></section>}
      {page === "course" && <SecureContentProtectionWrapper><StudentCourseWorkspace user={user} /></SecureContentProtectionWrapper>}
      {page === "attendance" && <StudentAttendancePage />}
      {page === "guardianAttendance" && <StudentAttendancePage guardian />}
      {page === "announcements" && <AnnouncementsPage />}
      {page === "meetings" && <section style={{ padding: "24px" }}><LiveMeetingScheduler isInstructor={false} /></section>}
      {page === "messages" && <InternalChatHub />}
      {page === "tasks" && <TasksPage />}
      {page === "files" && <ProtectedFilesSecure data={appData} user={user} />}
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
          <div className="watermark">{user.email} / AIN / 192.168.1.42</div>
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

function ProtectedFilesSecure({ data, user }) {
  const tx = useBilingualText();
  const { showToast } = useToast();
  const { activeOrganization } = useOrganization();
  const [selectedFileId, setSelectedFileId] = useState(data.files[0]?.id);
  const [session, setSession] = useState(null);
  const [viewerError, setViewerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [watermarkIndex, setWatermarkIndex] = useState(0);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [floatingMode, setFloatingMode] = useState(false);
  const [fileQuery, setFileQuery] = useState("");
  const [fileType, setFileType] = useState("all");
  const visibleFiles = useMemo(() => data.files.filter((file) => {
    const matchesQuery = [file.name, file.room, file.organizationName].join(" ").toLowerCase().includes(fileQuery.toLowerCase());
    const matchesType = fileType === "all" || (fileType === "video" ? ["video", "youtube"].includes(String(file.type).toLowerCase()) : !["video", "youtube"].includes(String(file.type).toLowerCase()));
    return matchesQuery && matchesType;
  }), [data.files, fileQuery, fileType]);
  const selectedFile = visibleFiles.find((file) => file.id === selectedFileId) || visibleFiles[0];
  const watermarkPositions = ["top-left", "top-right", "center", "bottom-left", "bottom-right"];
  const watermarkText = session?.watermark?.text || `${user.email} / AIN`;

  useEffect(() => {
    if (!activeOrganization?.id || !selectedFile?.id) {
      return undefined;
    }

    let isMounted = true;
    setIsLoading(true);
    setViewerError("");

    api.getContentViewSession(activeOrganization.id, selectedFile.id)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setSession(response);
        api.recordContentViewerAudit(
          activeOrganization.id,
          selectedFile.id,
          viewerAuditPayload(CONTENT_VIEWER_EVENTS.opened, {
            viewerSessionId: response.viewerSessionId,
            message: "Web content viewer opened."
          })
        ).catch(() => {});
        api.recordContentViewerAudit(
          activeOrganization.id,
          selectedFile.id,
          viewerAuditPayload(CONTENT_VIEWER_EVENTS.watermarkRendered, {
            viewerSessionId: response.viewerSessionId,
            message: "Web moving watermark rendered."
          })
        ).catch(() => {});
      })
      .catch((error) => {
        if (isMounted) {
          setSession(null);
          setViewerError(error.message || "Content cannot be opened right now.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeOrganization?.id, selectedFile?.id]);

  useEffect(() => {
    if (!session?.watermark?.enabled) {
      return undefined;
    }

    const intervalMs = Math.max(Number(session.watermark.moveEverySeconds || 8), 3) * 1000;
    const timer = window.setInterval(() => {
      setWatermarkIndex((current) => (current + 1) % watermarkPositions.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [session?.watermark?.enabled, session?.watermark?.moveEverySeconds, watermarkPositions.length]);

  const auditBlockedAction = (event, message) => {
    showToast(tx("تم منع الإجراء لحماية المحتوى.", "Action blocked to protect the content."), "warning");

    if (!activeOrganization?.id || !selectedFile?.id) {
      return;
    }

    api.recordContentViewerAudit(
      activeOrganization.id,
      selectedFile.id,
      viewerAuditPayload(event, {
        viewerSessionId: session?.viewerSessionId,
        message,
        result: "warning"
      })
    ).catch(() => {});
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
    auditBlockedAction(
      CONTENT_VIEWER_EVENTS.rightClickBlocked,
      "Right click blocked in web content viewer."
    );
  };

  const handleKeyDown = (event) => {
    const key = event.key.toLowerCase();
    const isBlockedShortcut = event.key === "F12"
      || ((event.ctrlKey || event.metaKey) && ["s", "u", "p"].includes(key))
      || ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key));

    if (!isBlockedShortcut) {
      return;
    }

    event.preventDefault();
    auditBlockedAction(
      CONTENT_VIEWER_EVENTS.shortcutBlocked,
      `Blocked shortcut: ${event.key}`
    );
  };

  const renderViewer = () => {
    if (!selectedFile) {
      return (
        <div className="viewer-state">
          <FileText size={36} />
          <strong>{tx("لا توجد ملفات متاحة", "No protected files yet")}</strong>
        </div>
      );
    }

    if (isLoading) {
      return <div className="viewer-state">{tx("جاري تجهيز جلسة العرض...", "Preparing secure viewer session...")}</div>;
    }

    if (viewerError) {
      return (
        <div className="viewer-state danger">
          <AlertTriangle size={36} />
          <strong>{tx("تعذر فتح المحتوى", "Content cannot be opened")}</strong>
          <span>{viewerError}</span>
        </div>
      );
    }

    if (session?.playbackType === "youtube" && session.embedUrl) {
      return (
        <iframe
          title={selectedFile.name}
          src={session.embedUrl}
          allow={session.allowFullscreen ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" : "autoplay; encrypted-media"}
          allowFullScreen={Boolean(session.allowFullscreen)}
        />
      );
    }

    if (session?.playbackType === "file" && session.url) {
      return <iframe title={selectedFile.name} src={session.url} />;
    }

    return (
      <div className="viewer-state">
        <Video size={36} />
        <strong>{tx("محتوى آمن", "Protected content")}</strong>
      </div>
    );
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("عارض الملفات المحمي", "Protected file viewer")}</h1>
          <p>{tx("عرض آمن للملفات والفيديوهات مع علامة مائية وتحكم كامل في المشاهدة.", "Secure PDF and video viewing with watermarking and controlled access.")}</p>
        </div>
      </div>
      <section className="student-file-toolbar">
        <label><span>{tx("ابحث في كل الأكاديميات", "Search across academies")}</span><input value={fileQuery} onChange={(event) => setFileQuery(event.target.value)} placeholder={tx("اسم الملف أو الغرفة أو الأكاديمية", "File, room, or academy")} /></label>
        <div><button className={fileType === "all" ? "active" : ""} type="button" onClick={() => setFileType("all")}>{tx("الكل", "All")} <small>{data.files.length}</small></button><button className={fileType === "document" ? "active" : ""} type="button" onClick={() => setFileType("document")}>{tx("ملفات", "Documents")}</button><button className={fileType === "video" ? "active" : ""} type="button" onClick={() => setFileType("video")}>{tx("فيديو", "Video")}</button></div>
      </section>
      {floatingMode && (
        <div className="floating-viewer-placeholder">
          <div className="placeholder-info">
            <div className="placeholder-badge">
              <PictureInPicture2 size={16} />
              <span>{tx("مشغل الفيديو يعمل في نافذة عائمة", "Mini-Player active")}</span>
            </div>
            <h3>{selectedFile?.name || tx("الفيديو الآمن", "Protected video")}</h3>
            <p>{tx("الفيديو يعمل حالياً في الركن السفلي مع استمرار الحماية المائية النشطة. يمكنك تصفح الملفات والمهام بحرية دون توقف الشرح.", "The video is playing in the bottom corner with dynamic watermark protection active. You can browse files and tasks freely.")}</p>
          </div>
          <Button variant="primary" onClick={() => setFloatingMode(false)}>
            <Maximize2 size={16} />
            {tx("إعادة العارض للوضع الكامل", "Restore full viewer")}
          </Button>
        </div>
      )}
      <section
        className={`stitch-viewer-screen protected-viewer-shell ${cinemaMode ? "cinema-mode" : ""} ${floatingMode ? "floating-mode" : ""}`}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="stitch-viewer-toolbar">
          <Button variant="ghost" type="button" onClick={() => setSelectedFileId(null)}>{tx("إغلاق العارض", "Close viewer")}</Button>
          <span>{session?.expiresAt ? tx("جلسة مؤقتة", "Short-lived session") : tx("عرض آمن", "Secure viewer")}</span>
          <strong>{session?.downloadAllowed ? tx("تنزيل متاح", "Download allowed") : tx("تنزيل مغلق", "Download blocked")}</strong>
          <span>{selectedFile?.name || tx("ملف آمن", "Protected file")}</span>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setFloatingMode((curr) => !curr);
              if (cinemaMode) setCinemaMode(false);
            }}
            title={floatingMode ? tx("إعادة للوضع الطبيعي", "Restore full view") : tx("مشغل مصغر عائم (PiP)", "Mini floating player")}
          >
            <PictureInPicture2 size={16} />
            <span>{floatingMode ? tx("إعادة العارض", "Restore") : tx("نافذة عائمة", "Mini player")}</span>
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setCinemaMode((curr) => !curr);
              if (floatingMode) setFloatingMode(false);
            }}
            title={cinemaMode ? tx("الخروج من وضع السينما", "Exit Cinema Mode") : tx("وضع السينما", "Cinema Mode")}
          >
            {cinemaMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{cinemaMode ? tx("عرض عادي", "Normal view") : tx("وضع السينما", "Cinema mode")}</span>
          </Button>
        </div>
        <div className="stitch-document-stage">
          {renderViewer()}
          {session?.watermark?.enabled && (
            <div className={`watermark moving ${watermarkPositions[watermarkIndex]}`}>
              {watermarkText}
            </div>
          )}
          <div className="protected-viewer-blocker" aria-hidden="true" />
        </div>
        <aside className="stitch-viewer-side">
          <h2>{tx("ملفات الغرفة الآمنة", "Secure room files")}</h2>
          {visibleFiles.map((file, index) => (
            <button
              className={file.id === selectedFile?.id || (!selectedFile && index === 0) ? "active" : ""}
              type="button"
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              draggable="false"
            >
              {file.type === "youtube" ? <Video size={20} /> : <FileText size={20} />}
              <span>{file.name}<small>{file.organizationName || file.room} · {file.size}</small></span>
            </button>
          ))}
          {!visibleFiles.length && <div className="file-sidebar-empty">{tx("لا توجد ملفات مطابقة للبحث", "No matching files")}</div>}
          <div className="stitch-security-note"><Shield size={18} /> {tx("الوصول مراقب ومشفر بالكامل", "Access is monitored and fully encrypted")}</div>
        </aside>
      </section>
      <section className="stitch-video-panel">
        <Video size={36} />
        <strong>{tx("بث فيديو آمن", "Secure video streaming")}</strong>
        <span>{tx("تطبق نفس سياسة الحماية على الفيديوهات مع العلامة المائية وتعطيل التنزيل.", "The same protection policy applies to video, including watermarking and download blocking.")}</span>
        <Button variant="ghost"><Play size={16} /> {tx("معاينة", "Preview")}</Button>
      </section>
    </>
  );
}
