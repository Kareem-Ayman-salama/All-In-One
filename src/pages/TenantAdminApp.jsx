import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Download,
  Eye,
  FileText,
  Filter,
  Grid2X2,
  GraduationCap,
  Lock,
  MoreVertical,
  Plus,
  Rocket,
  Search,
  Shield,
  Smartphone,
  Trash2,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AccountSettings } from "../components/AccountSettings";
import {
  AttendanceManagementPage,
  GuardianManagementPage,
  ReportsExportPage
} from "../components/AttendanceOperations";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { AppLayout } from "../layouts/AppLayout";
import { useBilingualText } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { PERMISSIONS } from "../domain/organization";
import { api } from "../services/api";
import {
  AnnouncementsPage,
  MeetingsPage,
  TasksPage
} from "../components/LearningOperations";
import {
  AcademyProfileSettingsPage,
  CourseWizardPage,
  InstructorsManagementPage,
  InvitationsManagementPage,
  LockedModulePage,
  MarketplaceBatchesPage,
  MarketplaceBookingsPage,
  PromotionsManagementPage
} from "../components/MarketplaceAdminOperations";
import {
  ActivityAuditPage,
  BillingSubscriptionPage,
  ConfirmActionDialog,
  NotificationCenterPage,
  OnboardingChecklist,
  SavedViewToolbar,
  WorkspaceCalendarPage
} from "../components/WorkspaceOperations";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/tenant-admin/dashboard" },
  { id: "rooms", label: "Rooms", icon: "rooms", path: "/tenant-admin/rooms" },
  { id: "files", label: "Content Library", icon: "files", path: "/tenant-admin/files" },
  { id: "members", label: "Members", icon: "members", path: "/tenant-admin/members" },
  { id: "courses", label: "Courses", icon: "courses", path: "/tenant-admin/courses", module: "courses" },
  { id: "batches", label: "Batches", icon: "batches", path: "/tenant-admin/batches", module: "batches" },
  { id: "bookingRequests", label: "Booking requests", icon: "bookingRequests", path: "/tenant-admin/bookingRequests", module: "bookings" },
  { id: "attendance", label: "Attendance", icon: "attendance", path: "/tenant-admin/attendance", module: "attendance" },
  { id: "guardians", label: "Guardians", icon: "guardians", path: "/tenant-admin/guardians", module: "attendance" },
  { id: "reports", label: "Reports & exports", icon: "reports", path: "/tenant-admin/reports", module: "bookings" },
  { id: "academyProfile", label: "Academy profile", icon: "settings", path: "/tenant-admin/academyProfile", module: "courses" },
  { id: "instructors", label: "Instructors", icon: "members", path: "/tenant-admin/instructors", module: "courses" },
  { id: "invitations", label: "Invitations", icon: "members", path: "/tenant-admin/invitations" },
  { id: "promotions", label: "Promotions", icon: "announcements", path: "/tenant-admin/promotions", module: "promotions" },
  { id: "announcements", label: "Announcements", icon: "announcements", path: "/tenant-admin/announcements", module: "announcements" },
  { id: "meetings", label: "Meetings", icon: "meetings", path: "/tenant-admin/meetings", module: "meetings" },
  { id: "tasks", label: "Tasks", icon: "tasks", path: "/tenant-admin/tasks", module: "tasks" },
  { id: "notifications", label: "Notifications", icon: "notifications", path: "/tenant-admin/notifications" },
  { id: "calendar", label: "Calendar", icon: "calendar", path: "/tenant-admin/calendar" },
  { id: "analytics", label: "Analytics", icon: "analytics", path: "/tenant-admin/analytics" },
  { id: "security", label: "Security", icon: "security", path: "/tenant-admin/security" },
  { id: "subscription", label: "Subscriptions", icon: "subscription", path: "/tenant-admin/subscription" },
  { id: "activity", label: "Activity Log", icon: "activity", path: "/tenant-admin/activity" },
  { id: "settings", label: "Settings", icon: "settings", path: "/tenant-admin/settings" }
];

export function TenantAdminApp({ data, user }) {
  const { page = "dashboard" } = useParams();
  const tx = useBilingualText();
  const { isModuleEnabled, can } = useOrganization();
  const appUser = { ...user, roleLabel: tx("مدير الشركة", "Tenant Admin") };
  const workspace = useWorkspace();
  const appData = { ...data, rooms: workspace.rooms, files: workspace.files, members: workspace.members, notifications: workspace.notifications };
  const visibleNav = nav;
  const currentItem = nav.find((item) => item.id === page);
  const moduleLocked = currentItem?.module && !isModuleEnabled(currentItem.module);

  if (!visibleNav.some((item) => item.id === page)) {
    return <Navigate to="/tenant-admin/dashboard" replace />;
  }

  return (
    <AppLayout appTitle="Tenant Admin" user={appUser} nav={visibleNav}>
      {moduleLocked && <LockedModulePage title={`${currentItem.label} غير متاح في باقتك`} />}
      {!moduleLocked && page === "dashboard" && <Dashboard data={appData} user={user} />}
      {page === "rooms" && <RoomsPage rooms={appData.rooms} />}
      {page === "files" && <ContentLibrary files={appData.files} />}
      {page === "members" && <MembersPage members={appData.members} />}
      {!moduleLocked && page === "courses" && <CourseWizardPage />}
      {!moduleLocked && page === "batches" && <MarketplaceBatchesPage />}
      {!moduleLocked && page === "bookingRequests" && <MarketplaceBookingsPage />}
      {!moduleLocked && page === "attendance" && <AttendanceManagementPage />}
      {!moduleLocked && page === "guardians" && <GuardianManagementPage />}
      {!moduleLocked && page === "reports" && <ReportsExportPage />}
      {!moduleLocked && page === "academyProfile" && <AcademyProfileSettingsPage />}
      {!moduleLocked && page === "instructors" && <InstructorsManagementPage />}
      {page === "invitations" && <InvitationsManagementPage />}
      {!moduleLocked && page === "promotions" && <PromotionsManagementPage />}
      {!moduleLocked && page === "announcements" && <AnnouncementsPage canCreate={can(PERMISSIONS.announcementsCreate)} />}
      {!moduleLocked && page === "meetings" && <MeetingsPage canCreate={can(PERMISSIONS.eventsManage)} />}
      {!moduleLocked && page === "tasks" && <TasksPage canCreate={can(PERMISSIONS.eventsManage)} />}
      {page === "notifications" && <NotificationCenterPage user={user} />}
      {page === "calendar" && <WorkspaceCalendarPage allowCreate />}
      {page === "analytics" && <AnalyticsPage />}
      {page === "security" && <SecurityPage />}
      {page === "subscription" && <BillingSubscriptionPage />}
      {page === "activity" && <ActivityAuditPage />}
      {page === "settings" && <AccountSettings user={user} workspaceLabel="Tenant Admin workspace" />}
    </AppLayout>
  );
}

function Dashboard({ data, user }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const tx = useBilingualText();
  const { activeOrganization, activeMembership } = useOrganization();
  const { activity } = useWorkspace();
  const { academies, instructors, courses, batches, bookings, enrollments } = useMarketplace();
  const organizationId = activeOrganization?.id;
  const publishedCourses = courses.filter((item) => item.organizationId === organizationId && item.status === "published").length;
  const activeBatches = batches.filter((item) => item.organizationId === organizationId && ["open", "in_progress"].includes(item.status)).length;
  const pendingBookings = bookings.filter((item) => item.organizationId === organizationId && item.status === "pending_confirmation").length;
  const activeEnrollments = enrollments.filter((item) => item.organizationId === organizationId && item.status === "active").length;
  const subscriptionEnd = activeMembership?.subscription?.currentPeriodEndsAt;
  const subscriptionDays = subscriptionEnd
    ? Math.max(0, Math.ceil((new Date(subscriptionEnd) - new Date()) / 86400000))
    : null;
  const planName = activeOrganization?.planName || activeOrganization?.plan || tx("بدون باقة", "No plan");
  const academy = academies.find((item) => item.organizationId === organizationId);
  const academySteps = [
    {
      title: tx("أكمل ملف الأكاديمية", "Complete academy profile"),
      description: tx("الاسم والوصف وبيانات التواصل التي يراها الطلاب.", "Add the public name, description, and contact details."),
      href: "/tenant-admin/academyProfile",
      done: Boolean(academy?.name && academy?.description)
    },
    {
      title: tx("أضف المدرسين", "Add instructors"),
      description: tx("أنشئ ملفًا لكل مدرس ثم أضف مواعيد الحجز.", "Create instructor profiles and available booking slots."),
      href: "/tenant-admin/instructors",
      done: instructors.some((item) => item.organizationId === organizationId)
    },
    {
      title: tx("أنشئ روم للمحتوى", "Create a content room"),
      description: tx("الروم هي مساحة الطلاب الخاصة بالملفات والإعلانات.", "Rooms hold the private files and announcements for students."),
      href: "/tenant-admin/rooms",
      done: Boolean(data.rooms?.length)
    },
    {
      title: tx("أنشئ أول كورس", "Create your first course"),
      description: tx("أدخل المادة والمدرس والسعر ثم أرسله للمراجعة.", "Add the subject, instructor, and price, then submit for review."),
      href: "/tenant-admin/courses",
      done: courses.some((item) => item.organizationId === organizationId)
    },
    {
      title: tx("أضف الدفعة والمواعيد", "Add a batch and schedule"),
      description: tx("اربط الكورس بروم وحدد السعة وأيام الدراسة.", "Connect the course to a room and define capacity and schedule."),
      href: "/tenant-admin/batches",
      done: batches.some((item) => item.organizationId === organizationId)
    }
  ];
  const academyProgress = Math.round((academySteps.filter((item) => item.done).length / academySteps.length) * 100);

  return (
    <>
      <OnboardingChecklist user={user} />
      <div className="stitch-page-head">
        <div>
          <h1>{tx(`مرحباً، ${activeOrganization?.name || ""}`, `Welcome, ${activeOrganization?.name || ""}`)}</h1>
          <p>{tx("إليك ملخص أداء منظومتك لهذا اليوم.", "Here is your workspace performance summary for today.")}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}><Plus size={18} /> {tx("إجراء سريع", "Quick action")}</Button>
      </div>

      <section className="academy-launch-guide">
        <header>
          <span><GraduationCap size={21} /></span>
          <div>
            <small>{tx("تشغيل الأكاديمية", "Academy launch")}</small>
            <h2>{tx("أضف المدرسين والكورسات من هنا بالترتيب", "Add instructors and courses in the right order")}</h2>
          </div>
          <div className="academy-launch-progress" aria-label={`${academyProgress}%`}>
            <strong>{academyProgress}%</strong>
            <progress max="100" value={academyProgress} />
          </div>
        </header>
        <div className="academy-launch-steps">
          {academySteps.map((step, index) => (
            <a className={step.done ? "done" : ""} href={step.href} key={step.href}>
              <span>{step.done ? <CheckCircle2 size={19} /> : index + 1}</span>
              <div><strong>{step.title}</strong><small>{step.description}</small></div>
            </a>
          ))}
        </div>
      </section>

      <section className="stitch-stat-grid five">
        <StatCard title={tx("الغرف النشطة", "Active rooms")} value={String(data.rooms?.length || 0)} hint={tx("مساحات العمل", "Workspaces")} icon={<Building2 />} tone="primary" />
        <StatCard title={tx("الكورسات المنشورة", "Published courses")} value={String(publishedCourses)} hint={`${activeBatches} ${tx("دفعات نشطة", "active batches")}`} icon={<BookOpen />} tone="success" />
        <StatCard title={tx("الحجوزات المعلقة", "Pending bookings")} value={String(pendingBookings)} hint={tx("تحتاج إجراء", "Need action")} icon={<AlertTriangle />} tone="warning" />
        <StatCard title={tx("الطلاب النشطون", "Active students")} value={String(activeEnrollments)} hint={tx("وصول مؤكد", "Confirmed access")} icon={<Users />} tone="primary" />
        <StatCard title={tx("الملفات المحمية", "Protected files")} value={String(data.files?.length || 0)} hint={tx("محتوى مؤمّن", "Secured content")} icon={<Shield />} tone="success" />
      </section>

      <section className="stitch-dashboard-grid">
        <div className="stitch-activity-card">
          <h2>{tx("آخر النشاطات", "Recent activity")}</h2>
          {activity.length
            ? activity.slice(0, 3).map((item) => <ActivityItem key={item.id} tone={item.tone || "primary"} title={item.action} body={`${item.actor || ""} ${item.target || ""}`.trim()} time={item.time || ""} />)
            : <p className="learning-muted">{tx("لا توجد نشاطات مسجلة بعد.", "No activity has been recorded yet.")}</p>}
        </div>

        <div className="stitch-performance-card">
          <div className="stitch-card-head">
            <h2>{tx("أداء الغرف النشطة", "Active room performance")}</h2>
            <a href="/tenant-admin/rooms">{tx("عرض الكل", "View all")}</a>
          </div>
          {data.rooms?.length ? data.rooms.slice(0, 3).map((room) => (
            <RoomMini
              key={room.id}
              title={room.name}
              status={`${room.members || 0} ${tx("عضو", "members")} · ${room.files || 0} ${tx("ملف", "files")}`}
              dot={room.status === "Active" ? "success" : "warning"}
            />
          )) : <p className="learning-muted">{tx("أنشئ أول غرفة لتظهر بيانات الأداء هنا.", "Create your first room to see performance data here.")}</p>}
        </div>

        <div className="stitch-quick-card">
          <h2>{tx("إجراءات سريعة", "Quick actions")}</h2>
          <a href="/tenant-admin/rooms"><Plus size={20} /> {tx("إنشاء غرفة جديدة", "Create a room")}</a>
          <a href="/tenant-admin/files"><CloudUpload size={20} /> {tx("رفع محتوى جديد", "Upload content")}</a>
          <button onClick={() => setInviteOpen(true)} type="button"><UserPlus size={20} /> {tx("دعوة عضو", "Invite member")}</button>
        </div>

        <div className="stitch-subscription-card">
          <h2>{tx("حالة الاشتراك", "Subscription status")}</h2>
          <Badge tone={activeOrganization?.subscriptionStatus === "active" ? "success" : "warning"}>{planName}</Badge>
          <p>{subscriptionDays === null ? tx("لا يوجد اشتراك نشط.", "No active subscription.") : tx(`ينتهي الاشتراك خلال ${subscriptionDays} يومًا`, `Subscription expires in ${subscriptionDays} days`)}</p>
          <Button as="a" href="/tenant-admin/subscription">{tx("تجديد الاشتراك", "Renew subscription")}</Button>
        </div>
      </section>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}

function RoomsPage({ rooms }) {
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const location = useLocation();
  const { removeItem } = useWorkspace();
  const { showToast } = useToast();
  const tx = useBilingualText();

  useEffect(() => {
    if (new URLSearchParams(location.search).get("create") === "1") setOpen(true);
  }, [location.search]);

  const confirmDelete = async () => {
    const result = await removeItem("rooms", pendingDelete.id);
    setPendingDelete(null);
    if (result) showToast(tx("تم حذف الغرفة", "Room deleted"), "success", result.undo ? { label: tx("تراجع", "Undo"), onClick: result.undo } : undefined);
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("إدارة الغرف", "Room management")}</h1>
          <p>{tx("أدر مساحات العمل، وتابع نشاط الأعضاء، وتحكم في الوصول إلى الملفات.", "Manage workspaces, monitor member activity, and control access to shared files.")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> {tx("إنشاء غرفة", "Create room")}</Button>
      </div>

      <FilterBar />

      <section className="stitch-room-grid">
        {rooms.map((room, index) => (
          <article className="stitch-room-card" key={room.id}>
            <div className="stitch-room-top">
              <div className={`stitch-square tone-${index % 3}`}><RoomIcon index={index} /></div>
              <div className="stitch-card-actions">
                <Badge tone={room.status === "Private" ? "neutral" : "success"}>{room.status === "Private" ? tx("مغلق", "Private") : tx("نشط", "Active")}</Badge>
                <button type="button" onClick={() => setPendingDelete(room)} title={tx("حذف الغرفة", "Delete room")}><Trash2 size={19} /></button>
              </div>
            </div>
            <h2>{room.name}</h2>
            <p>{room.type === "Read only" ? tx("مساحة لقراءة الملفات ومراجعة المحتوى المحمي.", "A space for reading files and reviewing protected content.") : tx("مساحة تعاونية لرفع الملفات ومشاركة التحديثات.", "A collaborative space for uploads and updates.")}</p>
            <div className="stitch-room-meta">
              <span>{room.members}+</span>
              <span>{room.files} {tx("ملف", "files")}</span>
            </div>
            <div className="stitch-room-footer">
              <span>{tx("آخر نشاط", "Last activity")}<br /><strong>{index === 0 ? tx("منذ دقيقتين", "2 minutes ago") : tx("أمس، 11:45 م", "Yesterday, 11:45 PM")}</strong></span>
              <div>
                <button type="button"><Lock size={20} /></button>
                <button type="button">↪</button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <CreateRoomModal open={open} onClose={() => setOpen(false)} />
      <ConfirmActionDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} title={tx("حذف الغرفة؟", "Delete this room?")} description={tx("سيتم حذف الغرفة ومواعيدها المرتبطة من التقويم. يمكنك التراجع مباشرة لاستعادتها معًا.", "The room and its linked calendar events will be removed. You can immediately undo to restore them together.")} confirmLabel={tx("حذف الغرفة", "Delete room")} />
    </>
  );
}

function ContentLibrary({ files }) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const { removeItem } = useWorkspace();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const visibleFiles = useMemo(() => files.filter((file) => activeFilter === "all" || (activeFilter === "protected" ? file.protected : file.type === activeFilter)), [activeFilter, files]);
  const filters = [
    { value: "all", label: tx("كل الملفات", "All files") },
    { value: "protected", label: tx("المحمية", "Protected") },
    { value: "PDF", label: "PDF" },
    { value: "Video", label: tx("فيديو", "Video") }
  ];
  const confirmDelete = async () => {
    const result = await removeItem("files", pendingDelete.id);
    setPendingDelete(null);
    if (result) showToast(tx("تم حذف الملف", "File deleted"), "success", result.undo ? { label: tx("تراجع", "Undo"), onClick: result.undo } : undefined);
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("مكتبة المحتوى", "Content library")}</h1>
          <p>{tx("إدارة وتصفح جميع الملفات والوثائق الخاصة بك.", "Manage and browse all your files and documents.")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><CloudUpload size={18} /> {tx("رفع محتوى", "Upload content")}</Button>
      </div>
      <SavedViewToolbar storageId="content-library" filters={filters} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <div className="stitch-table-card">
        <table>
          <thead>
            <tr>
              <th>{tx("الاسم", "Name")}</th>
              <th>{tx("الغرفة", "Room")}</th>
              <th>{tx("بواسطة", "Uploaded by")}</th>
              <th>{tx("تاريخ الرفع", "Uploaded")}</th>
              <th>{tx("المشاهدات", "Views")}</th>
              <th>{tx("حالة الحماية", "Protection")}</th>
              <th>{tx("إجراءات", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleFiles.map((file, index) => (
              <tr key={file.id}>
                <td><FileCell file={file} index={index} /></td>
                <td>{file.room}</td>
                <td><AvatarName initials={(file.uploadedBy || "?").split(" ").map((part) => part[0]).slice(0, 2).join("")} name={file.uploadedBy || tx("غير معروف", "Unknown")} /></td>
                <td>{file.date}</td>
                <td>{file.views.toLocaleString()}</td>
                <td><Badge tone={file.protected ? "success" : "neutral"}>{file.protected ? tx("محمي", "Protected") : tx("عام", "Public")}</Badge></td>
                <td>
                  <div className="stitch-row-actions">
                    <Eye size={19} />
                    <Download size={19} />
                    <button type="button" onClick={() => setPendingDelete(file)} title={tx("حذف الملف", "Delete file")}><Trash2 size={19} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <UploadFileModal open={open} onClose={() => setOpen(false)} />
      <ConfirmActionDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} title={tx("حذف الملف؟", "Delete this file?")} description={tx("سيختفي الملف من مكتبة المحتوى، ويمكنك التراجع بعد الحذف.", "The file will be removed from the content library, with an option to undo.")} confirmLabel={tx("حذف الملف", "Delete file")} />
    </>
  );
}

function MembersPage({ members }) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const tx = useBilingualText();
  const filters = [
    { value: "all", label: tx("كل الأعضاء", "All members") },
    { value: "Active", label: tx("نشط", "Active") },
    { value: "Pending", label: tx("معلق", "Pending") },
    { value: "Review", label: tx("يحتاج مراجعة", "Needs review") }
  ];
  const visibleMembers = useMemo(() => members.filter((member) => activeFilter === "all" || member.status === activeFilter), [activeFilter, members]);

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("إدارة الأعضاء", "Member management")}</h1>
          <p>{tx("إدارة أذونات الفريق والوصول إلى الغرف والنشاط.", "Manage team permissions, room access, and activity.")}</p>
        </div>
        <Button onClick={() => setOpen(true)}><UserPlus size={18} /> {tx("دعوة عضو", "Invite member")}</Button>
      </div>
      <section className="stitch-stat-grid four">
        <StatCard title={tx("إجمالي الأعضاء", "Total members")} value="1,284" hint={tx("+12% عن الشهر الماضي", "+12% from last month")} icon={<Users />} tone="primary" />
        <StatCard title={tx("نشط الآن", "Active now")} value="342" hint={tx("جلسات نشطة حالياً", "Current active sessions")} icon={<span />} tone="success" />
        <StatCard title={tx("طلبات معلقة", "Pending requests")} value="18" hint={tx("في انتظار الموافقة", "Waiting for approval")} icon={<UserPlus />} tone="warning" />
        <StatCard title={tx("المساحة المستخدمة", "Storage used")} value="84%" icon={<Cloud />} progress={84} />
      </section>
      <SavedViewToolbar storageId="member-management" filters={filters} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      <div className="stitch-table-card">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>{tx("الاسم", "Name")}</th>
              <th>{tx("الدور", "Role")}</th>
              <th>{tx("الغرف المعينة", "Assigned rooms")}</th>
              <th>{tx("حالة الجهاز", "Device status")}</th>
              <th>{tx("آخر ظهور", "Last seen")}</th>
              <th>{tx("الحالة", "Status")}</th>
              <th>{tx("الإجراءات", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((member, index) => {
              const memberName = member.name || member.email || tx("عضو", "Member");
              const roomName = member.room || member.roomName || tx("غير معين", "Unassigned");
              const memberInitials = memberName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
              const roomInitials = roomName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
              const status = member.status || "Active";
              const device = member.device || tx("غير مربوط", "Not linked");

              return (
                <tr key={member.id}>
                  <td><input defaultChecked={index === 1} type="checkbox" /></td>
                  <td><AvatarName initials={memberInitials} name={memberName} sub={member.email || "—"} /></td>
                  <td>{member.role || tx("عضو", "Member")}</td>
                  <td><div className="stitch-room-bubbles"><span title={roomName}>{roomInitials || "—"}</span></div></td>
                  <td><Badge tone={device === "Different device" ? "danger" : device === "Pending invite" ? "warning" : "success"}>{device}</Badge></td>
                  <td>{status === "Pending" ? tx("لم يسجل الدخول", "Never signed in") : status === "Review" ? tx("منذ أسبوع", "1 week ago") : tx("منذ ساعتين", "2 hours ago")}</td>
                  <td><Badge tone={status === "Review" ? "danger" : status === "Pending" ? "warning" : "success"}>{status}</Badge></td>
                  <td><MoreVertical size={20} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <InviteMemberModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NotificationsPage({ notifications }) {
  const tx = useBilingualText();
  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("مركز الإشعارات", "Notification center")}</h1>
          <p>{tx("كل إشعار مرتبط بالمكان الصحيح لمتابعة السبب أو تنفيذ الإجراء.", "Every notification links to the right place for context or action.")}</p>
        </div>
        <Button variant="ghost">{tx("تحديد الكل كمقروء", "Mark all as read")}</Button>
      </div>
      <div className="stitch-notification-list">
        {notifications.map((item) => (
          <a className="stitch-notification-item" href={item.target} key={item.id}>
            <Bell size={22} />
            <div>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
              <small>{item.time}</small>
            </div>
            <Badge tone={item.type === "Security" ? "danger" : "primary"}>{item.type}</Badge>
          </a>
        ))}
      </div>
    </>
  );
}

function AnalyticsPage() {
  const tx = useBilingualText();
  return <SimplePanel title={tx("التحليلات", "Analytics")} subtitle={tx("تحليلات الغرف والمشاهدات والتفاعل.", "Room, view, and engagement analytics.")} />;
}

function SecurityPage() {
  const tx = useBilingualText();
  return <SimplePanel title={tx("الأمان", "Security")} subtitle={tx("سياسات الحماية والأجهزة ومحاولات الدخول.", "Protection policies, devices, and sign-in attempts.")} />;
}

function SubscriptionPage() {
  const tx = useBilingualText();
  return <SimplePanel title={tx("الاشتراكات", "Subscriptions")} subtitle={tx("إدارة الاشتراك الشهري والسنوي وحالة التجديد.", "Manage monthly and yearly billing and renewal status.")} />;
}

function SimplePanel({ title, subtitle }) {
  const tx = useBilingualText();
  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="stitch-empty-panel">
        <BarChart3 size={42} />
        <strong>{title}</strong>
        <span>{tx("الصفحة مهيأة للربط مع واجهة الباك اند.", "This page is ready for backend API integration.")}</span>
      </div>
    </>
  );
}

function StatCard({ title, value, hint, icon, tone = "primary", progress }) {
  return (
    <article className={`stitch-stat-card ${tone}`}>
      <div>
        <span>{title}</span>
        <div className="stitch-stat-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      {progress ? <div className="stitch-progress"><i style={{ width: `${progress}%` }} /></div> : <small>{hint}</small>}
      {progress && hint && <small>{hint}</small>}
    </article>
  );
}

function FilterBar() {
  const tx = useBilingualText();
  return (
    <div className="stitch-filter-card">
      <div className="stitch-view-toggle"><button><Grid2X2 size={20} /></button><button><Filter size={20} /></button></div>
      <div className="stitch-selects">
        <button>{tx("جميع الحالات", "All statuses")} <Filter size={18} /></button>
        <button>{tx("جميع الأنواع", "All types")} <Building2 size={18} /></button>
      </div>
    </div>
  );
}

function ContentFilters() {
  const tx = useBilingualText();
  return (
    <div className="stitch-filter-card content">
      <div className="stitch-selects">
        <label>{tx("نوع الملف:", "File type:")} <button>{tx("الكل", "All")}</button></label>
        <label>{tx("الغرفة:", "Room:")} <button>{tx("كل الغرف", "All rooms")}</button></label>
        <label>{tx("التاريخ:", "Date:")} <input type="date" /></label>
      </div>
      <div className="stitch-view-toggle"><button><BookOpen size={20} /></button><button><Grid2X2 size={20} /></button></div>
    </div>
  );
}

function ActivityItem({ title, body, time, tone }) {
  return (
    <div className={`stitch-activity-item ${tone}`}>
      <i />
      <div>
        <strong>{title}</strong>
        <span>{body}</span>
        <small>{time}</small>
      </div>
    </div>
  );
}

function RoomMini({ title, status, dot = "success" }) {
  return (
    <div className="stitch-room-mini">
      <span className={dot} />
      <strong>{title}</strong>
      <small>{status}</small>
    </div>
  );
}

function RoomIcon({ index }) {
  if (index === 0) return <Rocket size={22} />;
  if (index === 1) return <Bell size={22} />;
  return <BarChart3 size={22} />;
}

function FileCell({ file, index }) {
  const colors = ["red", "blue", "amber", "indigo"];
  return (
    <div className="stitch-file-cell">
      <div className={`stitch-file-icon ${colors[index % colors.length]}`}><FileText size={20} /></div>
      <div>
        <strong>{file.name}</strong>
        <small>{file.size}</small>
      </div>
    </div>
  );
}

function AvatarName({ initials, name, sub }) {
  return (
    <div className="stitch-avatar-name">
      <i>{initials}</i>
      <div>
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function CreateRoomModal({ open, onClose }) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const emptyForm = () => ({ name: "", type: "Read only", members: 0, schedule: true, eventTitle: "", date: tomorrow, time: "10:00", duration: 60, description: "" });
  const [form, setForm] = useState(emptyForm);
  const { createRoom } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, date: form.schedule ? form.date : "", time: form.schedule ? form.time : "" };
    const room = await api.createRoom(activeOrganization.id, payload);
    createRoom({ ...payload, id: room.id });
    if (form.schedule) {
      const startsAt = new Date(`${form.date}T${form.time}:00`);
      const endsAt = new Date(startsAt.getTime() + Number(form.duration) * 60000);
      await api.createEvent(activeOrganization.id, {
        roomId: room.id,
        title: form.eventTitle,
        description: form.description || null,
        type: "meeting",
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: "scheduled"
      });
    }
    showToast(form.schedule ? tx("تم إنشاء الغرفة وإضافة الموعد للتقويم", "Room created and event added to the calendar") : tx("تم إنشاء الغرفة", "Room created"));
    setForm(emptyForm());
    onClose();
  };

  return (
    <Modal title={tx("إنشاء غرفة", "Create room")} open={open} onClose={onClose} footer={<Button form="create-room-form">{tx("إنشاء", "Create")}</Button>}>
      <form id="create-room-form" className="form-grid" onSubmit={submit}>
        <FormField label={tx("اسم الغرفة", "Room name")}><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
        <FormField label={tx("نوع الوصول", "Access type")}><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Read only</option><option>Upload + read</option></select></FormField>
        <FormField label={tx("عدد المشاركين", "Expected attendees")}><input min="0" type="number" value={form.members} onChange={(event) => setForm({ ...form, members: event.target.value })} /></FormField>
        <label className="schedule-toggle"><input type="checkbox" checked={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.checked })} /><span><strong>{tx("إضافة موعد للغرفة", "Schedule a room event")}</strong><small>{tx("سيظهر في تقويم الأدمن والأعضاء وإشعاراتهم.", "It will appear on admin and member calendars and notifications.")}</small></span></label>
        {form.schedule && <div className="room-schedule-fields">
          <FormField label={tx("عنوان الموعد", "Event title")}><input required value={form.eventTitle} onChange={(event) => setForm({ ...form, eventTitle: event.target.value })} placeholder={tx("مثال: مراجعة خطة الربع الثالث", "e.g. Q3 planning review")} /></FormField>
          <div className="form-grid two"><FormField label={tx("التاريخ", "Date")}><input required min={new Date().toISOString().slice(0, 10)} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></FormField><FormField label={tx("الوقت", "Time")}><input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></FormField></div>
          <FormField label={tx("المدة بالدقائق", "Duration in minutes")}><input min="15" step="15" type="number" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></FormField>
          <FormField label={tx("وصف مختصر", "Short description")}><textarea className="workspace-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
        </div>}
      </form>
    </Modal>
  );
}

function InviteMemberModal({ open, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", room: "HR & Policies" });
  const { inviteMember: inviteWorkspaceMember } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const submit = async (event) => {
    event.preventDefault();
    await api.inviteMember(activeOrganization.id, {
      email: form.email,
      role: "member",
      roomIds: [],
      note: form.name ? `Invitation for ${form.name}` : null,
      expiresInDays: 7
    });
    inviteWorkspaceMember(form);
    showToast(tx("تم إرسال الدعوة وإضافتها للسجل", "Invitation sent and added to the audit log"));
    setForm({ name: "", email: "", room: "HR & Policies" });
    onClose();
  };

  return (
    <Modal title={tx("دعوة عضو", "Invite member")} open={open} onClose={onClose} footer={<Button form="invite-member-form">{tx("إرسال الدعوة", "Send invitation")}</Button>}>
      <form id="invite-member-form" className="form-grid" onSubmit={submit}>
        <FormField label={tx("الاسم", "Name")}><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
        <FormField label={tx("البريد الإلكتروني", "Email address")}><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FormField>
        <FormField label={tx("الغرفة", "Room")}><input required value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} /></FormField>
      </form>
    </Modal>
  );
}

function UploadFileModal({ open, onClose }) {
  const [mode, setMode] = useState("file");
  const [file, setFile] = useState(null);
  const [room, setRoom] = useState("HR & Policies");
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [allowFullscreen, setAllowFullscreen] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const { uploadFile, rooms } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const submit = async (event) => {
    event.preventDefault();
    const selectedRoom = rooms.find((item) => item.name === room) || rooms[0];
    if (!selectedRoom) {
      showToast(tx("أنشئ غرفة أولاً قبل رفع المحتوى", "Create a room before uploading content"), "danger");
      return;
    }
    if (mode === "youtube") {
      if (!title.trim() || !youtubeUrl.trim()) return;
      await api.uploadContent(activeOrganization.id, {
        roomId: selectedRoom.id,
        title: title.trim(),
        type: "youtube",
        externalUrl: youtubeUrl.trim(),
        downloadAllowed: false,
        watermarkEnabled,
        allowFullscreen
      });
      uploadFile({ name: title.trim(), room: selectedRoom.name, type: "Video", size: "YouTube", protected: true });
      showToast(tx("تمت إضافة فيديو YouTube إلى المكتبة", "YouTube video added to the library"));
      setTitle("");
      setYoutubeUrl("");
      setAllowFullscreen(true);
      setWatermarkEnabled(true);
      onClose();
      return;
    }

    if (!file) return;
    const extension = file.name.split(".").pop()?.toUpperCase() || "File";
    const contentType = file.type === "application/pdf"
      ? "pdf"
      : file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "file";
    await api.uploadContent(activeOrganization.id, {
      roomId: selectedRoom.id,
      file,
      type: contentType,
      downloadAllowed: false,
      watermarkEnabled: true
    });
    uploadFile({ name: file.name, room: selectedRoom.name, type: extension, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, protected: true });
    showToast(tx("تمت إضافة الملف إلى المكتبة وسجل النشاط", "File added to the library and audit log"));
    setFile(null);
    onClose();
  };

  return (
    <Modal title={tx("إضافة محتوى جديد", "Add content")} open={open} onClose={onClose} footer={<Button form="upload-file-form">{mode === "youtube" ? tx("إضافة الفيديو", "Add video") : tx("بدء الرفع", "Start upload")}</Button>}>
      <form id="upload-file-form" className="form-grid" onSubmit={submit}>
        <FormField label={tx("نوع المحتوى", "Content type")}>
          <div className="stitch-period-toggle">
            <button className={mode === "file" ? "active" : ""} type="button" onClick={() => setMode("file")}>{tx("ملف", "File")}</button>
            <button className={mode === "youtube" ? "active" : ""} type="button" onClick={() => setMode("youtube")}>{tx("YouTube", "YouTube")}</button>
          </div>
        </FormField>
        <FormField label={tx("الغرفة", "Room")}>
          <select value={room} onChange={(event) => setRoom(event.target.value)} required>
            {rooms.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}
          </select>
        </FormField>
        {mode === "file" ? (
          <FormField label={tx("الملف", "File")}><input type="file" required onChange={(event) => setFile(event.target.files?.[0] || null)} /></FormField>
        ) : (
          <>
            <FormField label={tx("عنوان الفيديو", "Video title")}><input value={title} onChange={(event) => setTitle(event.target.value)} required /></FormField>
            <FormField label={tx("رابط YouTube", "YouTube link")}><input dir="ltr" type="url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} required /></FormField>
            <label className="settings-toggle"><input checked={allowFullscreen} onChange={(event) => setAllowFullscreen(event.target.checked)} type="checkbox" /> <span>{tx("السماح بملء الشاشة", "Allow fullscreen")}</span></label>
            <label className="settings-toggle"><input checked={watermarkEnabled} onChange={(event) => setWatermarkEnabled(event.target.checked)} type="checkbox" /> <span>{tx("تشغيل العلامة المائية", "Enable watermark")}</span></label>
          </>
        )}
      </form>
    </Modal>
  );
}
