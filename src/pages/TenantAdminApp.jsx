import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
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
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  Rocket,
  Search,
  Send,
  Shield,
  Smartphone,
  Trash2,
  Upload,
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

const educationOnlyNav = new Set([
  "courses",
  "batches",
  "bookingRequests",
  "attendance",
  "guardians",
  "reports",
  "academyProfile",
  "instructors",
  "promotions"
]);

function isEducationOrganization(organization) {
  return ["academy", "training_center", "educational_institution"].includes(organization?.type);
}

export function TenantAdminApp({ data, user }) {
  const { page = "dashboard" } = useParams();
  const tx = useBilingualText();
  const { isModuleEnabled, can, activeOrganization } = useOrganization();
  const appUser = { ...user, roleLabel: tx("مدير الشركة", "Tenant Admin") };
  const workspace = useWorkspace();
  const appData = { ...data, rooms: workspace.rooms, files: workspace.files, members: workspace.members, notifications: workspace.notifications };
  const visibleNav = nav.filter((item) => isEducationOrganization(activeOrganization) || !educationOnlyNav.has(item.id));
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
      {page === "security" && <SecurityPageLive />}
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
  const { activity, events } = useWorkspace();
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
  const educationWorkspace = isEducationOrganization(activeOrganization);
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
  const companySteps = [
    {
      title: tx("أنشئ أول روم للموظفين", "Create your first employee room"),
      description: tx("استخدم الروم للسياسات والملفات والرسائل والمواعيد الداخلية.", "Use rooms for policies, files, messages, and internal schedules."),
      href: "/tenant-admin/rooms",
      done: Boolean(data.rooms?.length)
    },
    {
      title: tx("ادعُ موظفًا", "Invite an employee"),
      description: tx("أضف الموظفين للغرف المناسبة بدون ربطهم بكورسات أو دفعات.", "Add employees to the right rooms without courses or batches."),
      href: "/tenant-admin/members",
      done: Boolean(data.members?.length)
    },
    {
      title: tx("ارفع ملفات الشركة", "Upload company material"),
      description: tx("سياسات، مستندات HR، ملفات تدريب داخلي، أو محتوى محمي.", "Policies, HR documents, internal training files, or protected content."),
      href: "/tenant-admin/files",
      done: Boolean(data.files?.length)
    },
    {
      title: tx("حدد اجتماعًا أو مهمة", "Schedule a meeting or task"),
      description: tx("اربط المواعيد بالروم عشان الموظفين يلاقوا كل حاجة في مكان واحد.", "Attach schedules to rooms so employees find everything in one place."),
      href: "/tenant-admin/calendar",
      done: events.some((event) => event.roomId)
    }
  ];
  const launchSteps = educationWorkspace ? academySteps : companySteps;
  const launchProgress = Math.round((launchSteps.filter((item) => item.done).length / launchSteps.length) * 100);

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
          <span>{educationWorkspace ? <GraduationCap size={21} /> : <Building2 size={21} />}</span>
          <div>
            <small>{educationWorkspace ? tx("تشغيل الأكاديمية", "Academy launch") : tx("تشغيل الشركة", "Company workspace setup")}</small>
            <h2>{educationWorkspace ? tx("أضف المدرسين والكورسات من هنا بالترتيب", "Add instructors and courses in the right order") : tx("جهز مساحة الشركة للموظفين بدون كورسات أو دفعات", "Set up the company workspace for employees without courses or batches")}</h2>
          </div>
          <div className="academy-launch-progress" aria-label={`${launchProgress}%`}>
            <strong>{launchProgress}%</strong>
            <progress max="100" value={launchProgress} />
          </div>
        </header>
        <div className="academy-launch-steps">
          {launchSteps.map((step, index) => (
            <a className={step.done ? "done" : ""} href={step.href} key={step.href}>
              <span>{step.done ? <CheckCircle2 size={19} /> : index + 1}</span>
              <div><strong>{step.title}</strong><small>{step.description}</small></div>
            </a>
          ))}
        </div>
      </section>

      <section className="stitch-stat-grid five">
        <StatCard title={tx("الغرف النشطة", "Active rooms")} value={String(data.rooms?.length || 0)} hint={tx("مساحات العمل", "Workspaces")} icon={<Building2 />} tone="primary" />
        <StatCard title={educationWorkspace ? tx("الكورسات المنشورة", "Published courses") : tx("الموظفون", "Employees")} value={educationWorkspace ? String(publishedCourses) : String(data.members?.length || 0)} hint={educationWorkspace ? `${activeBatches} ${tx("دفعات نشطة", "active batches")}` : tx("أعضاء مساحة العمل", "Workspace members")} icon={educationWorkspace ? <BookOpen /> : <Users />} tone="success" />
        <StatCard title={educationWorkspace ? tx("الحجوزات المعلقة", "Pending bookings") : tx("مواعيد الروم", "Room events")} value={educationWorkspace ? String(pendingBookings) : String(events.filter((event) => event.roomId).length)} hint={educationWorkspace ? tx("تحتاج إجراء", "Need action") : tx("مرتبطة بالغرف", "Linked to rooms")} icon={<AlertTriangle />} tone="warning" />
        <StatCard title={educationWorkspace ? tx("الطلاب النشطون", "Active students") : tx("صلاحيات الموظفين", "Employee access")} value={educationWorkspace ? String(activeEnrollments) : tx("مفصولة", "Separated")} hint={educationWorkspace ? tx("وصول مؤكد", "Confirmed access") : tx("بدون كورسات أو دفعات", "No courses or batches")} icon={<Users />} tone="primary" />
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
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [uploadRoom, setUploadRoom] = useState(null);
  const [inviteRoom, setInviteRoom] = useState(null);
  const [scheduleRoom, setScheduleRoom] = useState(null);
  const location = useLocation();
  const { events, files, members, removeItem } = useWorkspace();
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
                <button type="button" title={tx("حماية الغرفة", "Room security")}><Lock size={20} /></button>
                <button type="button" onClick={() => setSelectedRoom(room)} title={tx("فتح الغرفة", "Open room")}>Open</button>
                <button type="button">↪</button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <CreateRoomModal open={open} onClose={() => setOpen(false)} />
      <RoomWorkspaceModal
        room={selectedRoom}
        files={files}
        members={members}
        events={events}
        onClose={() => setSelectedRoom(null)}
        onInvite={(room) => setInviteRoom(room)}
        onUpload={(room) => setUploadRoom(room)}
        onSchedule={(room) => setScheduleRoom(room)}
      />
      <InviteMemberModal open={Boolean(inviteRoom)} initialRoom={inviteRoom} onClose={() => setInviteRoom(null)} />
      <UploadFileModal open={Boolean(uploadRoom)} initialRoom={uploadRoom} onClose={() => setUploadRoom(null)} />
      <ScheduleRoomEventModal open={Boolean(scheduleRoom)} room={scheduleRoom} onClose={() => setScheduleRoom(null)} />
      <ConfirmActionDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} title={tx("حذف الغرفة؟", "Delete this room?")} description={tx("سيتم حذف الغرفة ومواعيدها المرتبطة من التقويم. يمكنك التراجع مباشرة لاستعادتها معًا.", "The room and its linked calendar events will be removed. You can immediately undo to restore them together.")} confirmLabel={tx("حذف الغرفة", "Delete room")} />
    </>
  );
}

function RoomWorkspaceModal({ room, files, members, events, onClose, onInvite, onUpload, onSchedule }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [message, setMessage] = useState("");
  const [serverMessages, setServerMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const tx = useBilingualText();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const { roomMessages, sendRoomMessage } = useWorkspace();

  useEffect(() => {
    if (!room || !activeOrganization?.id) {
      setServerMessages([]);
      return;
    }
    let active = true;
    setMessagesLoading(true);
    api.getRoomMessages(activeOrganization.id, room.id)
      .then((items) => {
        if (active) setServerMessages(items);
      })
      .catch(() => {
        if (active) setServerMessages([]);
      })
      .finally(() => {
        if (active) setMessagesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeOrganization?.id, room]);

  if (!room) return null;

  const roomFiles = files.filter((file) => file.roomId === room.id || file.room === room.name);
  const roomEvents = events.filter((event) => event.roomId === room.id || event.roomName === room.name);
  const roomMembers = members.filter((member) => member.roomId === room.id || member.room === room.name || member.roomName === room.name);
  const visibleMembers = roomMembers.length ? roomMembers : members.slice(0, Math.max(Number(room.members || 0), 0));
  const localMessages = roomMessages.filter((item) => item.roomId === room.id || item.roomName === room.name);
  const messages = serverMessages.length ? serverMessages : localMessages;
  const tabs = [
    { id: "chat", label: tx("الرسائل", "Messages"), icon: MessageSquare, count: messages.length },
    { id: "material", label: tx("الماتريال", "Material"), icon: Paperclip, count: roomFiles.length },
    { id: "members", label: tx("الأعضاء", "Members"), icon: Users, count: visibleMembers.length },
    { id: "schedule", label: tx("المواعيد", "Schedule"), icon: CalendarDays, count: roomEvents.length }
  ];

  const submitMessage = async (event) => {
    event.preventDefault();
    const body = message.trim();
    if (!body) return;
    setMessage("");
    try {
      const saved = await api.sendRoomMessage(activeOrganization.id, room.id, { body });
      setServerMessages((current) => [...current, saved]);
      sendRoomMessage({ roomId: room.id, roomName: room.name, body, author: saved.author });
    } catch (error) {
      sendRoomMessage({ roomId: room.id, roomName: room.name, body });
      showToast(error.message || tx("تم حفظ الرسالة محليًا مؤقتًا", "Message saved locally for now"), "warning");
    }
  };

  return (
    <Modal
      title={room.name}
      open={Boolean(room)}
      onClose={onClose}
      footer={<div className="room-workspace-footer"><Button variant="ghost" onClick={() => onUpload(room)}><Upload size={16} /> {tx("رفع ماتريال", "Upload material")}</Button><Button variant="ghost" onClick={() => onSchedule(room)}><CalendarDays size={16} /> {tx("تحديد موعد", "Schedule")}</Button><Button onClick={() => onInvite(room)}><UserPlus size={16} /> {tx("إضافة عضو أو طالب", "Add member or student")}</Button></div>}
    >
      <section className="room-detail-modal room-workspace-modal">
        <header className="room-workspace-hero">
          <div>
            <Badge tone={room.status === "Private" ? "neutral" : "success"}>{room.status || tx("نشطة", "Active")}</Badge>
            <p>{room.description || tx("كل حاجة تخص الروم في مكان واحد: رسائل، ماتريال، أعضاء، ومواعيد.", "Everything for this room in one place: messages, material, members, and schedule.")}</p>
          </div>
          <div className="room-workspace-actions">
            <Button onClick={() => onInvite(room)}><UserPlus size={16} /> {tx("إضافة عضو", "Add member")}</Button>
            <Button variant="ghost" onClick={() => onUpload(room)}><Upload size={16} /> {tx("رفع ملف", "Upload")}</Button>
            <Button variant="ghost" onClick={() => onSchedule(room)}><CalendarDays size={16} /> {tx("موعد", "Event")}</Button>
          </div>
        </header>
        <div className="room-detail-stats">
          <span><Users size={17} /><strong>{visibleMembers.length || room.members || 0}</strong>{tx("أعضاء", "Members")}</span>
          <span><FileText size={17} /><strong>{roomFiles.length || room.files || 0}</strong>{tx("ملفات", "Files")}</span>
          <span><CalendarDays size={17} /><strong>{roomEvents.length}</strong>{tx("مواعيد", "Events")}</span>
        </div>
        <nav className="room-workspace-tabs" aria-label={tx("أقسام الروم", "Room sections")}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button className={activeTab === tab.id ? "active" : ""} type="button" onClick={() => setActiveTab(tab.id)} key={tab.id}>
                <Icon size={17} />
                <span>{tab.label}</span>
                <small>{tab.count}</small>
              </button>
            );
          })}
        </nav>

        {activeTab === "chat" && (
          <article className="room-chat-panel">
            <div className="room-chat-list">
              {messagesLoading && <div className="room-chat-empty"><MessageSquare size={34} /><strong>{tx("جاري تحميل الرسائل...", "Loading messages...")}</strong></div>}
              {!messagesLoading && messages.length === 0 && <div className="room-chat-empty"><MessageSquare size={34} /><strong>{tx("ابدأ المحادثة", "Start the conversation")}</strong><span>{tx("اكتب رسالة أو تحديث سريع لكل أعضاء الروم.", "Post a quick update for everyone in this room.")}</span></div>}
              {messages.map((item) => (
                <div className="room-message" key={item.id}>
                  <i>{item.author?.slice(0, 2).toUpperCase() || "AI"}</i>
                  <div><strong>{item.author}</strong><p>{item.body}</p><small>{item.time}</small></div>
                </div>
              ))}
            </div>
            <form className="room-message-box" onSubmit={submitMessage}>
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={tx("اكتب رسالة للروم...", "Write a message to the room...")} />
              <Button type="submit" disabled={!message.trim()}><Send size={16} /> {tx("إرسال", "Send")}</Button>
            </form>
          </article>
        )}

        {activeTab === "material" && (
          <article className="room-section-panel">
            <div className="room-section-head"><h3>{tx("الماتريال والملفات", "Material and files")}</h3><Button variant="ghost" onClick={() => onUpload(room)}><Upload size={16} /> {tx("رفع", "Upload")}</Button></div>
            {roomFiles.length === 0 && <p>{tx("لا توجد ملفات داخل الروم بعد.", "No files in this room yet.")}</p>}
            {roomFiles.slice(0, 8).map((file) => (
              <div className="room-detail-row" key={file.id}>
                <FileText size={17} />
                <span>{file.name}<small>{file.size || file.type || ""}</small></span>
              </div>
            ))}
          </article>
        )}

        {activeTab === "members" && (
          <article className="room-section-panel">
            <div className="room-section-head"><div><h3>{tx("الأعضاء والصلاحيات", "Members and access")}</h3><p>{tx("ادعُ طالب أو موظف بالبريد، وحدد له الروم والدور المناسب.", "Invite a student or team member by email and assign the right room access.")}</p></div><Button onClick={() => onInvite(room)}><UserPlus size={16} /> {tx("إضافة عضو", "Add member")}</Button></div>
            {visibleMembers.length === 0 && <div className="room-empty-action"><Users size={34} /><strong>{tx("لا يوجد أعضاء داخل الروم بعد", "No members in this room yet")}</strong><span>{tx("اضغط إضافة عضو لإرسال دعوة وربط الشخص بهذا الروم مباشرة.", "Use Add member to send an invite and attach the person to this room.")}</span><Button onClick={() => onInvite(room)}><UserPlus size={16} /> {tx("إضافة أول عضو", "Add first member")}</Button></div>}
            {visibleMembers.map((member) => (
              <div className="room-detail-row" key={member.id}>
                <Users size={17} />
                <span>{member.name || member.email}<small>{member.email || member.role || ""}</small></span>
                <Badge tone={member.status === "Active" || member.status === "active" ? "success" : "warning"}>{member.status || tx("دعوة معلقة", "Pending invite")}</Badge>
              </div>
            ))}
          </article>
        )}

        {activeTab === "schedule" && (
          <article className="room-section-panel">
            <div className="room-section-head"><h3>{tx("المواعيد والجلسات", "Schedule and sessions")}</h3><Button variant="ghost" onClick={() => onSchedule(room)}><CalendarDays size={16} /> {tx("إضافة موعد", "Add event")}</Button></div>
            {roomEvents.length === 0 && <p>{tx("لا توجد مواعيد مرتبطة.", "No linked events yet.")}</p>}
            {roomEvents.slice(0, 8).map((event) => (
              <div className="room-detail-row" key={event.id}>
                <Bell size={17} />
                <span>{event.title}<small>{event.date} {event.time}</small></span>
              </div>
            ))}
          </article>
        )}
      </section>
    </Modal>
  );
}

function RoomDetailsModal({ room, files, members, events, onClose }) {
  const tx = useBilingualText();
  if (!room) return null;

  const roomFiles = files.filter((file) => file.roomId === room.id || file.room === room.name);
  const roomEvents = events.filter((event) => event.roomId === room.id || event.roomName === room.name);
  const visibleMembers = members.slice(0, Math.max(Number(room.members || 0), 3));

  return (
    <Modal title={room.name} open={Boolean(room)} onClose={onClose}>
      <section className="room-detail-modal">
        <header>
          <Badge tone={room.status === "Private" ? "neutral" : "success"}>{room.status || tx("نشطة", "Active")}</Badge>
          <p>{room.description || tx("مساحة آمنة للمحتوى والأعضاء والمواعيد المرتبطة.", "A secure space for linked content, members, and schedule.")}</p>
        </header>
        <div className="room-detail-stats">
          <span><strong>{room.members || visibleMembers.length || 0}</strong>{tx("أعضاء", "Members")}</span>
          <span><strong>{room.files || roomFiles.length || 0}</strong>{tx("ملفات", "Files")}</span>
          <span><strong>{roomEvents.length}</strong>{tx("مواعيد", "Events")}</span>
        </div>
        <div className="room-detail-grid">
          <article>
            <h3>{tx("المحتوى", "Content")}</h3>
            {roomFiles.length === 0 && <p>{tx("لا توجد ملفات داخل الغرفة بعد.", "No files in this room yet.")}</p>}
            {roomFiles.slice(0, 5).map((file) => (
              <div className="room-detail-row" key={file.id}>
                <FileText size={17} />
                <span>{file.name}<small>{file.size || file.type || ""}</small></span>
              </div>
            ))}
          </article>
          <article>
            <h3>{tx("الأعضاء", "Members")}</h3>
            {visibleMembers.length === 0 && <p>{tx("لم تتم إضافة أعضاء بعد.", "No members have been added yet.")}</p>}
            {visibleMembers.map((member) => (
              <div className="room-detail-row" key={member.id}>
                <Users size={17} />
                <span>{member.name}<small>{member.role || member.email || ""}</small></span>
              </div>
            ))}
          </article>
          <article>
            <h3>{tx("المواعيد", "Schedule")}</h3>
            {roomEvents.length === 0 && <p>{tx("لا توجد مواعيد مرتبطة.", "No linked events yet.")}</p>}
            {roomEvents.slice(0, 5).map((event) => (
              <div className="room-detail-row" key={event.id}>
                <Bell size={17} />
                <span>{event.title}<small>{event.date} {event.time}</small></span>
              </div>
            ))}
          </article>
        </div>
      </section>
    </Modal>
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

function SecurityPageLive() {
  const tx = useBilingualText();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [deviceLoading, setDeviceLoading] = useState(false);

  useEffect(() => {
    if (!activeOrganization?.id) {
      return;
    }

    setLoading(true);
    api.getSecurityEvents(activeOrganization.id, filter === "all" ? {} : { result: filter })
      .then(setLogs)
      .catch((error) => showToast(error.message, "danger"))
      .finally(() => setLoading(false));
  }, [activeOrganization?.id, filter, showToast]);

  useEffect(() => {
    if (!activeOrganization?.id) {
      return;
    }

    setSessionLoading(true);
    api.getMemberSessions(activeOrganization.id)
      .then(setSessions)
      .catch((error) => showToast(error.message, "danger"))
      .finally(() => setSessionLoading(false));
  }, [activeOrganization?.id, showToast]);

  useEffect(() => {
    if (!activeOrganization?.id) {
      return;
    }

    setDeviceLoading(true);
    api.getMemberDevices(activeOrganization.id)
      .then(setDevices)
      .catch((error) => showToast(error.message, "danger"))
      .finally(() => setDeviceLoading(false));
  }, [activeOrganization?.id, showToast]);

  const blocked = logs.filter((item) => ["denied", "warning", "failed"].includes(item.result)).length;
  const denied = logs.filter((item) => item.result === "denied").length;
  const allowed = logs.filter((item) => item.result === "allowed").length;
  const formatTime = (value) => value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "—";
  const resultTone = (result) => {
    if (result === "allowed") return "success";
    if (result === "denied" || result === "failed") return "danger";
    return "warning";
  };
  const revokeMember = async (memberId) => {
    if (!activeOrganization?.id || !memberId) {
      return;
    }

    try {
      const result = await api.revokeMemberSessions(activeOrganization.id, memberId);
      setSessions((current) => current.filter((item) => item.user?.id !== memberId));
      showToast(tx("تم إلغاء جلسات العضو.", "Member sessions revoked."), "success");
      if (result.revokedSessions === 0) {
        showToast(tx("لا توجد جلسات نشطة لهذا العضو.", "No active sessions were found for this member."), "info");
      }
    } catch (error) {
      showToast(error.message, "danger");
    }
  };
  const updateDevice = async (memberId, deviceId, action) => {
    if (!activeOrganization?.id || !memberId || !deviceId) {
      return;
    }

    const methods = {
      approve: api.approveMemberDevice,
      block: api.blockMemberDevice,
      revoke: api.revokeMemberDevice
    };

    try {
      const updated = await methods[action](activeOrganization.id, memberId, deviceId);
      setDevices((current) => current.map((item) => item.id === deviceId ? updated : item));
      if (action === "block" || action === "revoke") {
        setSessions((current) => current.filter((item) => item.user?.id !== memberId));
      }
      showToast(tx("Device policy updated.", "Device policy updated."), "success");
    } catch (error) {
      showToast(error.message, "danger");
    }
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("الأمان", "Security")}</h1>
          <p>{tx("مراقبة الوصول للمحتوى ومحاولات الحظر والتنزيل داخل المؤسسة.", "Monitor content access, blocked actions, and download attempts inside the organization.")}</p>
        </div>
        <Button variant="ghost"><Download size={17} /> {tx("تصدير CSV", "Export CSV")}</Button>
      </div>

      <section className="stitch-stat-grid three">
        <StatCard title={tx("محاولات محظورة", "Blocked attempts")} value={String(blocked)} hint={tx("تحذير أو رفض", "Warnings or denials")} icon={<AlertTriangle />} tone={blocked ? "warning" : "success"} />
        <StatCard title={tx("تنزيلات مرفوضة", "Denied downloads")} value={String(denied)} hint={tx("سياسة الحماية فعالة", "Protection policy active")} icon={<Lock />} tone={denied ? "danger" : "success"} />
        <StatCard title={tx("جلسات مسموحة", "Allowed sessions")} value={String(allowed)} hint={tx("مشاهدات مصرح بها", "Authorized views")} icon={<Shield />} tone="primary" />
      </section>

      <SavedViewToolbar
        storageId="tenant-security-logs"
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { value: "all", label: tx("كل الأحداث", "All events") },
          { value: "warning", label: tx("تحذيرات", "Warnings") },
          { value: "denied", label: tx("مرفوض", "Denied") },
          { value: "allowed", label: tx("مسموح", "Allowed") }
        ]}
      />

      <div className="audit-table">
        <div className="audit-head">
          <span>{tx("الإجراء", "Action")}</span>
          <span>{tx("المستخدم", "User")}</span>
          <span>{tx("المحتوى", "Content")}</span>
          <span>{tx("IP", "IP")}</span>
          <span>{tx("الوقت", "Time")}</span>
        </div>
        {loading && <div className="audit-row"><span>{tx("جاري التحميل...", "Loading...")}</span><span /><span /><span /><span /></div>}
        {!loading && logs.length === 0 && <div className="audit-row"><span>{tx("لا توجد أحداث بعد", "No events yet")}</span><span /><span /><span /><span /></div>}
        {!loading && logs.map((item) => (
          <div className="audit-row" key={item.id}>
            <span className={`audit-event ${resultTone(item.result)}`}><i />{item.event || item.action}</span>
            <strong>{item.user?.name || item.user?.email || "—"}</strong>
            <span>{item.contentItem?.title || item.contentItemId || "—"}</span>
            <span>{item.ipAddress || "—"}</span>
            <small>{formatTime(item.createdAt)}</small>
          </div>
        ))}
      </div>
      <MemberSessionsBlock
        sessions={sessions}
        sessionLoading={sessionLoading}
        formatTime={formatTime}
        revokeMember={revokeMember}
      />
      <MemberDevicesBlock
        devices={devices}
        deviceLoading={deviceLoading}
        formatTime={formatTime}
        updateDevice={updateDevice}
      />
    </>
  );
}

function MemberDevicesBlock({ devices, deviceLoading, formatTime, updateDevice }) {
  const tx = useBilingualText();
  const pending = devices.filter((device) => device.status === "pending").length;
  const tone = (status) => {
    if (status === "approved") return "success";
    if (status === "blocked" || status === "revoked") return "danger";
    return "warning";
  };

  return (
    <>
      <div className="stitch-page-head compact">
        <div>
          <h2>{tx("Member devices", "Member devices")}</h2>
          <p>{tx("Approve the first trusted device, block suspicious devices, and revoke access when account sharing appears.", "Approve the first trusted device, block suspicious devices, and revoke access when account sharing appears.")}</p>
        </div>
        <Badge tone={pending ? "warning" : "success"}>{pending} {tx("pending", "pending")}</Badge>
      </div>
      <div className="audit-table">
        <div className="audit-head">
          <span>{tx("Member", "Member")}</span>
          <span>{tx("Device", "Device")}</span>
          <span>{tx("Status", "Status")}</span>
          <span>{tx("Last seen", "Last seen")}</span>
          <span>{tx("Action", "Action")}</span>
        </div>
        {deviceLoading && <div className="audit-row"><span>{tx("Loading...", "Loading...")}</span><span /><span /><span /><span /></div>}
        {!deviceLoading && devices.length === 0 && <div className="audit-row"><span>{tx("No registered devices yet", "No registered devices yet")}</span><span /><span /><span /><span /></div>}
        {!deviceLoading && devices.map((device) => (
          <div className="audit-row" key={device.id}>
            <strong>{device.user?.name || device.user?.email || "-"}</strong>
            <span>{device.deviceName || device.platform || device.browser || "-"}</span>
            <span><Badge tone={tone(device.status)}>{device.status}</Badge></span>
            <small>{formatTime(device.lastSeenAt)}</small>
            <span className="inline-actions">
              {device.status !== "approved" && (
                <Button variant="ghost" onClick={() => updateDevice(device.userId, device.id, "approve")}><CheckCircle2 size={15} /> {tx("Approve", "Approve")}</Button>
              )}
              {device.status !== "blocked" && (
                <Button variant="ghost" onClick={() => updateDevice(device.userId, device.id, "block")}><Lock size={15} /> {tx("Block", "Block")}</Button>
              )}
              {device.status !== "revoked" && (
                <Button variant="ghost" onClick={() => updateDevice(device.userId, device.id, "revoke")}><Trash2 size={15} /> {tx("Revoke", "Revoke")}</Button>
              )}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function MemberSessionsBlock({ sessions, sessionLoading, formatTime, revokeMember }) {
  const tx = useBilingualText();
  return (
    <>
      <div className="stitch-page-head compact">
        <div>
          <h2>{tx("الجلسات النشطة", "Active member sessions")}</h2>
          <p>{tx("راجع الأجهزة المفتوحة وألغ جلسات أي عضو عند الاشتباه في مشاركة الحساب.", "Review open devices and revoke a member's sessions when account sharing is suspected.")}</p>
        </div>
        <Badge tone={sessions.length ? "warning" : "success"}>{sessions.length} {tx("جلسة", "sessions")}</Badge>
      </div>
      <div className="audit-table">
        <div className="audit-head">
          <span>{tx("العضو", "Member")}</span>
          <span>{tx("الجهاز", "Device")}</span>
          <span>{tx("المنصة", "Platform")}</span>
          <span>{tx("آخر استخدام", "Last used")}</span>
          <span>{tx("إجراء", "Action")}</span>
        </div>
        {sessionLoading && <div className="audit-row"><span>{tx("جاري التحميل...", "Loading...")}</span><span /><span /><span /><span /></div>}
        {!sessionLoading && sessions.length === 0 && <div className="audit-row"><span>{tx("لا توجد جلسات نشطة", "No active sessions")}</span><span /><span /><span /><span /></div>}
        {!sessionLoading && sessions.map((session) => (
          <div className="audit-row" key={session.id}>
            <strong>{session.user?.name || session.user?.email || "-"}</strong>
            <span>{session.name || session.installationId || "-"}</span>
            <span>{session.platform || session.appVersion || "web"}</span>
            <small>{formatTime(session.lastUsedAt)}</small>
            <Button variant="ghost" onClick={() => revokeMember(session.user?.id)}><Lock size={15} /> {tx("إلغاء الجلسات", "Revoke")}</Button>
          </div>
        ))}
      </div>
    </>
  );
}

function SubscriptionPage() {
  const tx = useBilingualText();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeOrganization?.id) {
      return;
    }

    setLoading(true);
    api.getPlanUsage(activeOrganization.id)
      .then(setUsage)
      .catch((error) => showToast(error.message, "danger"))
      .finally(() => setLoading(false));
  }, [activeOrganization?.id, showToast]);

  const subscription = usage?.subscription;
  const metrics = usage?.usage || [];
  const metricLabel = (metric) => ({
    rooms: tx("Rooms", "Rooms"),
    members: tx("Members", "Members"),
    pendingMembers: tx("Pending invites", "Pending invites"),
    admins: tx("Admins", "Admins"),
    courses: tx("Courses", "Courses"),
    content: tx("Content items", "Content items"),
    videos: tx("Videos", "Videos"),
    storageBytes: tx("Storage", "Storage")
  }[metric] || metric);
  const metricValue = (metric, value) => {
    if (metric === "storageBytes") {
      return `${(Number(value || 0) / 1024 / 1024).toFixed(1)} MB`;
    }
    return String(value ?? 0);
  };
  const percent = (item) => item.limit ? Math.min(100, Math.round((item.current / item.limit) * 100)) : 0;

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("الاشتراكات", "Subscriptions")}</h1>
          <p>{tx("تابع الخطة والحدود ومتبقي التجربة المجانية.", "Track the plan, limits, and remaining free trial time.")}</p>
        </div>
        <Badge tone={subscription?.status === "trial" ? "warning" : "success"}>{subscription?.status || tx("No plan", "No plan")}</Badge>
      </div>

      <section className="billing-hero">
        <div>
          <Badge tone="primary">{subscription?.plan?.code || "trial"}</Badge>
          <h2>{subscription?.plan?.name || tx("لا توجد خطة نشطة", "No active plan")}</h2>
          <p>{subscription?.daysRemaining != null ? tx(`${subscription.daysRemaining} يوم متبقي`, `${subscription.daysRemaining} days remaining`) : tx("لا توجد بيانات اشتراك", "No subscription data")}</p>
        </div>
        <div className="billing-price">
          <strong>{subscription?.plan ? `${(subscription.plan.monthlyPriceMinor / 100).toLocaleString()} ${subscription.plan.currency}` : "0"}</strong>
          <span>{tx("شهرياً بعد التجربة", "Monthly after trial")}</span>
        </div>
      </section>

      <section className="plan-usage-grid">
        {loading && <div className="stitch-empty-panel"><Cloud size={32} /><strong>{tx("جاري تحميل الاستهلاك...", "Loading usage...")}</strong></div>}
        {!loading && metrics.map((item) => (
          <article className="plan-usage-card" key={item.metric}>
            <header>
              <strong>{metricLabel(item.metric)}</strong>
              <Badge tone={item.limit && item.current >= item.limit ? "danger" : "success"}>
                {item.limit ? `${metricValue(item.metric, item.remaining)} ${tx("متبقي", "left")}` : tx("غير محدود", "Unlimited")}
              </Badge>
            </header>
            <div className="usage-meter"><span style={{ width: `${percent(item)}%` }} /></div>
            <footer>
              <span>{metricValue(item.metric, item.current)}</span>
              <small>{item.limit ? metricValue(item.metric, item.limit) : tx("غير محدود", "Unlimited")}</small>
            </footer>
          </article>
        ))}
      </section>
    </>
  );
}

function LegacySubscriptionPage() {
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

function ScheduleRoomEventModal({ open, room, onClose }) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ title: "", date: tomorrow, time: "10:00", duration: 60, description: "" });
  const { addRoomEvent } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();

  useEffect(() => {
    if (open) {
      setForm((current) => ({
        ...current,
        title: room?.name ? `${room.name} session` : current.title
      }));
    }
  }, [open, room]);

  const submit = async (event) => {
    event.preventDefault();
    if (!room) return;
    const startsAt = new Date(`${form.date}T${form.time}:00`);
    const endsAt = new Date(startsAt.getTime() + Number(form.duration) * 60000);
    const payload = {
      roomId: room.id,
      title: form.title.trim(),
      description: form.description || null,
      type: "meeting",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: "scheduled"
    };
    await api.createEvent(activeOrganization.id, payload);
    addRoomEvent({
      ...form,
      roomId: room.id,
      roomName: room.name,
      attendees: room.members || 0,
      status: "scheduled"
    });
    showToast(tx("تم إضافة الموعد داخل الروم والتقويم", "Event added to the room and calendar"));
    setForm({ title: "", date: tomorrow, time: "10:00", duration: 60, description: "" });
    onClose();
  };

  return (
    <Modal title={tx("تحديد موعد للروم", "Schedule room event")} open={open} onClose={onClose} footer={<Button form="schedule-room-event-form">{tx("حفظ الموعد", "Save event")}</Button>}>
      <form id="schedule-room-event-form" className="form-grid" onSubmit={submit}>
        <FormField label={tx("الروم", "Room")}><input value={room?.name || ""} readOnly /></FormField>
        <FormField label={tx("عنوان الموعد", "Event title")}><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></FormField>
        <div className="form-grid two">
          <FormField label={tx("التاريخ", "Date")}><input required min={new Date().toISOString().slice(0, 10)} type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></FormField>
          <FormField label={tx("الوقت", "Time")}><input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} /></FormField>
        </div>
        <FormField label={tx("المدة بالدقائق", "Duration in minutes")}><input min="15" step="15" type="number" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></FormField>
        <FormField label={tx("وصف مختصر", "Short description")}><textarea className="workspace-textarea" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField>
      </form>
    </Modal>
  );
}

function InviteMemberModal({ open, onClose, initialRoom = null }) {
  const [form, setForm] = useState({ name: "", email: "", role: "member", room: initialRoom?.name || "HR & Policies" });
  const { inviteMember: inviteWorkspaceMember, rooms } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const roleOptions = activeOrganization?.type === "company"
    ? [
      { value: "member", label: tx("موظف / عضو", "Employee / member") },
      { value: "staff", label: tx("مشرف", "Staff") },
      { value: "organization_admin", label: tx("أدمن شركة", "Company admin") }
    ]
    : [
      { value: "student", label: tx("طالب", "Student") },
      { value: "instructor", label: tx("مدرس", "Instructor") },
      { value: "staff", label: tx("مشرف", "Staff") },
      { value: "member", label: tx("عضو", "Member") }
    ];
  useEffect(() => {
    if (open && initialRoom?.name) {
      setForm((current) => ({ ...current, room: initialRoom.name }));
    }
  }, [initialRoom, open]);
  const submit = async (event) => {
    event.preventDefault();
    const selectedRoom = rooms.find((item) => item.name === form.room) || initialRoom;
    await api.inviteMember(activeOrganization.id, {
      email: form.email,
      role: form.role,
      roomIds: selectedRoom?.id ? [selectedRoom.id] : [],
      note: form.name ? `Invitation for ${form.name}` : null,
      expiresInDays: 7
    });
    inviteWorkspaceMember(form);
    showToast(tx("تم إرسال الدعوة وإضافتها للسجل", "Invitation sent and added to the audit log"));
    setForm({ name: "", email: "", role: "member", room: rooms[0]?.name || "HR & Policies" });
    onClose();
  };

  return (
    <Modal title={tx("إضافة عضو للروم", "Add member to room")} open={open} onClose={onClose} footer={<Button form="invite-member-form"><UserPlus size={16} /> {tx("إرسال الدعوة", "Send invitation")}</Button>}>
      <form id="invite-member-form" className="form-grid" onSubmit={submit}>
        {initialRoom && <div className="invite-room-summary"><span>{initialRoom.logo || initialRoom.name?.slice(0, 2).toUpperCase()}</span><div><strong>{initialRoom.name}</strong><small>{tx("سيتم ربط الدعوة بهذا الروم مباشرة", "The invite will be attached to this room.")}</small></div></div>}
        <FormField label={tx("الاسم", "Name")}><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
        <FormField label={tx("البريد الإلكتروني", "Email address")}><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FormField>
        <div className="form-grid two">
          <FormField label={tx("الدور", "Role")}><select required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roleOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></FormField>
          <FormField label={tx("الغرفة", "Room")}><select required value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })}>{rooms.map((room) => <option value={room.name} key={room.id}>{room.name}</option>)}</select></FormField>
        </div>
        <div className="invite-flow-note"><CheckCircle2 size={17} /><span>{tx("بعد الإرسال سيظهر العضو Pending لحد ما يقبل الدعوة، وبعدها يدخل الرسائل والملفات والمواعيد الخاصة بالروم.", "After sending, the member appears as Pending until they accept, then they can access this room's messages, files, and schedule.")}</span></div>
      </form>
    </Modal>
  );
}

function UploadFileModal({ open, onClose, initialRoom = null }) {
  const [mode, setMode] = useState("file");
  const [file, setFile] = useState(null);
  const [room, setRoom] = useState(initialRoom?.name || "HR & Policies");
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [allowFullscreen, setAllowFullscreen] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const { uploadFile, rooms } = useWorkspace();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();
  useEffect(() => {
    if (open && initialRoom?.name) {
      setRoom(initialRoom.name);
    }
  }, [initialRoom, open]);
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
      uploadFile({ name: title.trim(), room: selectedRoom.name, roomId: selectedRoom.id, type: "Video", size: "YouTube", protected: true });
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
    uploadFile({ name: file.name, room: selectedRoom.name, roomId: selectedRoom.id, type: extension, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, protected: true });
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
