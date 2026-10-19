import {
  Bell,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  LayoutGrid,
  LifeBuoy,
  MessageCircleQuestion,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBilingualText } from "../contexts/LanguageContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";

function roleBase(role) {
  if (role === "super-admin") return "/super-admin";
  if (role === "tenant-admin") return "/tenant-admin";
  return "/end-user";
}

export function SearchCommandOverlay({ open, onClose, user, initialMode = "search", onHelp }) {
  const { rooms, files, members, tenants } = useWorkspace();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const tx = useBilingualText();
  const base = roleBase(user.role);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 20);
    if (!open) setQuery("");
  }, [open]);

  const commands = useMemo(() => {
    const common = [
      { id: "settings", type: "Command", title: tx("فتح إعدادات الحساب", "Open account settings"), subtitle: tx("الملف الشخصي والأمان والمظهر", "Profile, security, and appearance"), icon: ShieldCheck, target: `${base}/settings` },
      { id: "notifications", type: "Command", title: tx("فتح مركز الإشعارات", "Open notification center"), subtitle: tx("التنبيهات والإجراءات المرتبطة", "Alerts and linked actions"), icon: Bell, target: `${base}/notifications` },
      { id: "help", type: "Command", title: tx("مركز المساعدة", "Help center"), subtitle: tx("إجابات سريعة ودعم فني", "Quick answers and support"), icon: LifeBuoy, action: onHelp }
    ];
    if (user.role === "tenant-admin") {
      common.unshift(
        { id: "new-room", type: "Command", title: tx("إنشاء غرفة جديدة", "Create a new room"), subtitle: tx("إضافة مساحة وموعد إلى التقويم", "Add a workspace and calendar event"), icon: Plus, target: "/tenant-admin/rooms?create=1" },
        { id: "calendar", type: "Command", title: tx("فتح تقويم الفريق", "Open team calendar"), subtitle: tx("كل مواعيد الغرف", "All room events"), icon: CalendarDays, target: "/tenant-admin/calendar" }
      );
    }
    if (user.role === "end-user") {
      common.unshift({
        id: "book-teacher",
        type: "Command",
        title: tx("احجز مع مدرس", "Book a teacher"),
        subtitle: tx("اختر المادة والمدرس والموعد المناسب", "Choose a subject, teacher, and preferred time"),
        icon: GraduationCap,
        target: "/end-user/bookings"
      });
    }
    return common;
  }, [base, onHelp, tx, user.role]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const records = [
      ...(user.role !== "super-admin" ? rooms.map((item) => ({ id: `room-${item.id}`, type: tx("غرفة", "Room"), title: item.name, subtitle: `${item.members} ${tx("عضو", "members")} · ${item.files} ${tx("ملف", "files")}`, icon: Users, target: user.role === "end-user" ? "/end-user/home" : "/tenant-admin/rooms" })) : []),
      ...(user.role !== "super-admin" ? files.map((item) => ({ id: `file-${item.id}`, type: tx("ملف", "File"), title: item.name, subtitle: item.room, icon: FileText, target: user.role === "end-user" ? "/end-user/files" : "/tenant-admin/files" })) : []),
      ...(user.role === "tenant-admin" ? members.map((item) => ({ id: `member-${item.id}`, type: tx("عضو", "Member"), title: item.name, subtitle: item.email, icon: Users, target: "/tenant-admin/members" })) : []),
      ...(user.role === "super-admin" ? tenants.map((item) => ({ id: `tenant-${item.id}`, type: tx("شركة", "Tenant"), title: item.name, subtitle: item.plan, icon: Users, target: "/super-admin/tenants" })) : []),
      ...commands
    ];
    if (!q) return initialMode === "command" ? commands : records.slice(-commands.length);
    return records.filter((item) => `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(q)).slice(0, 10);
  }, [commands, files, initialMode, members, query, rooms, tenants, tx, user.role]);

  const choose = (item) => {
    onClose();
    if (item.action) item.action();
    else navigate(item.target);
  };

  if (!open) return null;
  return (
    <div className="operation-overlay" role="presentation" onMouseDown={onClose}>
      <section className="command-panel" role="dialog" aria-modal="true" aria-label={tx("البحث والأوامر", "Search and commands")} onMouseDown={(event) => event.stopPropagation()}>
        <label className="command-search">
          {initialMode === "command" ? <Command size={21} /> : <Search size={21} />}
          <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={initialMode === "command" ? tx("اكتب أمرًا أو ابحث...", "Type a command or search...") : tx("ابحث في مساحة العمل...", "Search your workspace...")} />
          <kbd>ESC</kbd>
        </label>
        <div className="command-results">
          <small className="command-label">{query ? tx("النتائج", "Results") : tx("إجراءات سريعة", "Quick actions")}</small>
          {results.map((item) => {
            const Icon = item.icon;
            return (
              <button type="button" onClick={() => choose(item)} key={item.id}>
                <span><Icon size={19} /></span>
                <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
                <Badge tone="neutral">{item.type}</Badge>
                <ChevronRight size={17} />
              </button>
            );
          })}
          {!results.length && <div className="command-empty"><Search size={30} /><strong>{tx("لا توجد نتائج", "No results found")}</strong><span>{tx("جرّب اسم غرفة أو ملف أو عضو.", "Try a room, file, or member name.")}</span></div>}
        </div>
        <footer><span><kbd>↵</kbd> {tx("فتح", "Open")}</span><span><kbd>Ctrl K</kbd> {tx("لوحة الأوامر", "Command palette")}</span></footer>
      </section>
    </div>
  );
}

export function NotificationDrawer({ open, onClose, user }) {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useWorkspace();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const tx = useBilingualText();
  const allowed = notifications.filter((item) => item.target?.startsWith(roleBase(user.role)));
  const visible = allowed.filter((item) => filter === "all" || (filter === "unread" ? item.unread : item.type === filter));

  if (!open) return null;
  return (
    <div className="operation-drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside className="operation-drawer notification-drawer" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="drawer-icon"><Bell size={20} /></span><div><h2>{tx("مركز الإشعارات", "Notification center")}</h2><small>{allowed.filter((item) => item.unread).length} {tx("غير مقروء", "unread")}</small></div></div>
          <button type="button" onClick={onClose} aria-label={tx("إغلاق", "Close")}><X size={20} /></button>
        </header>
        <div className="notification-toolbar">
          <div>{["all", "unread", "Booking", "Calendar", "Security"].map((value) => <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} type="button" key={value}>{value === "all" ? tx("الكل", "All") : value === "unread" ? tx("غير مقروء", "Unread") : value}</button>)}</div>
          <button className="mark-read" type="button" onClick={markAllNotificationsRead}><Check size={15} /> {tx("قراءة الكل", "Read all")}</button>
        </div>
        <div className="drawer-scroll">
          {visible.map((item) => (
            <button className={`drawer-notification ${item.unread ? "unread" : ""}`} type="button" key={item.id} onClick={() => { markNotificationRead(item.id); onClose(); navigate(item.target); }}>
              <span className={`notification-type type-${item.type?.toLowerCase()}`}><Bell size={18} /></span>
              <div><strong>{tx(item.titleAr, item.title)}</strong><p>{tx(item.bodyAr, item.body)}</p><small>{item.time}</small></div>
              {item.unread && <i />}
            </button>
          ))}
          {!visible.length && <div className="command-empty"><CheckCircle2 size={34} /><strong>{tx("لا توجد إشعارات هنا", "Nothing to review")}</strong></div>}
        </div>
        <footer><button type="button" onClick={() => { onClose(); navigate(`${roleBase(user.role)}/notifications`); }}>{tx("عرض كل الإشعارات", "View all notifications")} <ExternalLink size={15} /></button></footer>
      </aside>
    </div>
  );
}

export function NotificationCenterPage({ user }) {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useWorkspace();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const tx = useBilingualText();
  const allowed = notifications.filter((item) => item.target?.startsWith(roleBase(user.role)));
  const types = ["all", "unread", ...new Set(allowed.map((item) => item.type))];
  const visible = allowed.filter((item) => filter === "all" || (filter === "unread" ? item.unread : item.type === filter));
  return (
    <>
      <div className="stitch-page-head"><div><h1>{tx("مركز الإشعارات", "Notification center")}</h1><p>{tx("فلتر التنبيهات وافتح العنصر المرتبط لاتخاذ الإجراء الصحيح.", "Filter alerts and open the linked item to take the right action.")}</p></div><Button variant="ghost" onClick={markAllNotificationsRead}><Check size={16} /> {tx("تحديد الكل كمقروء", "Mark all as read")}</Button></div>
      <div className="notification-page-layout">
        <aside className="notification-filter-panel"><strong>{tx("التصفية", "Filters")}</strong>{types.map((type) => <button className={filter === type ? "active" : ""} onClick={() => setFilter(type)} type="button" key={type}><span>{type === "all" ? tx("الكل", "All notifications") : type === "unread" ? tx("غير مقروء", "Unread") : type}</span><small>{allowed.filter((item) => type === "all" || (type === "unread" ? item.unread : item.type === type)).length}</small></button>)}</aside>
        <section className="notification-page-list">{visible.map((item) => <button className={item.unread ? "unread" : ""} type="button" key={item.id} onClick={() => { markNotificationRead(item.id); navigate(item.target); }}><span className={`notification-type type-${item.type?.toLowerCase()}`}><Bell size={19} /></span><div><div><strong>{tx(item.titleAr, item.title)}</strong>{item.unread && <Badge tone="primary">{tx("جديد", "New")}</Badge>}</div><p>{tx(item.bodyAr, item.body)}</p><small>{item.time}</small></div><span className="notification-open">{tx("فتح", "Open")} <ChevronRight size={16} /></span></button>)}{!visible.length && <div className="command-empty"><CheckCircle2 size={36} /><strong>{tx("لا توجد إشعارات", "No notifications")}</strong></div>}</section>
      </div>
    </>
  );
}

export function HelpCenterDrawer({ open, onClose }) {
  const tx = useBilingualText();
  const [query, setQuery] = useState("");
  const topics = [
    [tx("بدء استخدام AIN", "Getting started with AIN"), tx("إعداد الحساب ومساحة العمل والدعوات", "Account, workspace, and invitations")],
    [tx("الغرف والمواعيد", "Rooms and scheduling"), tx("إنشاء غرفة وربط موعدها بالتقويم", "Create a room and add its calendar event")],
    [tx("الأمان والصلاحيات", "Security and permissions"), tx("الأدوار والأجهزة والوصول للملفات", "Roles, devices, and file access")],
    [tx("الاشتراك والفواتير", "Subscription and billing"), tx("الاستخدام والحدود والفواتير", "Usage, limits, and invoices")]
  ].filter((item) => item.join(" ").toLowerCase().includes(query.toLowerCase()));
  if (!open) return null;
  return (
    <div className="operation-drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside className="operation-drawer help-drawer" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span className="drawer-icon"><LifeBuoy size={20} /></span><div><h2>{tx("مركز المساعدة", "Help center")}</h2><small>{tx("نساعدك للوصول للحل بسرعة", "Find an answer without leaving your work")}</small></div></div><button type="button" onClick={onClose}><X size={20} /></button></header>
        <div className="help-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("ابحث عن إجابة...", "Search help articles...")} /></div>
        <div className="drawer-scroll help-topics">
          <small>{tx("موضوعات شائعة", "Popular topics")}</small>
          {topics.map(([title, description]) => <button type="button" key={title}><span><CircleHelp size={19} /></span><div><strong>{title}</strong><small>{description}</small></div><ChevronRight size={17} /></button>)}
          <section><MessageCircleQuestion size={26} /><div><strong>{tx("ما زلت بحاجة للمساعدة؟", "Still need help?")}</strong><span>{tx("أرسل طلبًا وسيرد فريق الدعم.", "Send a request to our support team.")}</span></div><Button as="a" href="/support" variant="ghost">{tx("تواصل معنا", "Contact support")}</Button></section>
        </div>
      </aside>
    </div>
  );
}

export function OnboardingChecklist({ user }) {
  const { rooms, members, files, events } = useWorkspace();
  const tx = useBilingualText();
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem("ain-onboarding-dismissed") === "1");
  const [minimized, setMinimized] = useState(() => window.localStorage.getItem("ain-onboarding-minimized") === "1");
  const [manualChecks, setManualChecks] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("ain-onboarding-checks") || "{}");
    } catch {
      return {};
    }
  });

  const toggleManualCheck = (key, e) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = { ...manualChecks, [key]: !manualChecks[key] };
    setManualChecks(updated);
    window.localStorage.setItem("ain-onboarding-checks", JSON.stringify(updated));
  };

  const isTenantAdmin = user?.role === "tenant-admin";

  const academyItems = [
    {
      key: "profile",
      title: tx("ضبط هوية وبيانات الأكاديمية", "Set up academy profile & logo"),
      done: Boolean(manualChecks.profile || user.company),
      target: "/tenant-admin/academyProfile"
    },
    {
      key: "course",
      title: tx("إنشاء الكورس الأول والمدربين", "Create your first course"),
      done: Boolean(manualChecks.course || rooms.length > 0),
      target: "/tenant-admin/courses"
    },
    {
      key: "batch",
      title: tx("إنشاء دفعة وتحديد المواعيد", "Create a batch & schedule"),
      done: Boolean(manualChecks.batch || events.length > 0),
      target: "/tenant-admin/batches"
    },
    {
      key: "content",
      title: tx("رفع محتوى محمي بالعلامة المائية", "Upload protected materials"),
      done: Boolean(manualChecks.content || files.length > 0),
      target: "/tenant-admin/files"
    },
    {
      key: "attendance",
      title: tx("تجربة تسجيل الحضور بالـ QR", "Test QR attendance check-in"),
      done: Boolean(manualChecks.attendance),
      target: "/tenant-admin/attendance"
    }
  ];

  const genericItems = [
    { key: "user", title: tx("أكمل بيانات الحساب", "Complete profile"), done: Boolean(user.name && user.email), target: "/tenant-admin/settings" },
    { key: "room", title: tx("أنشئ أول غرفة", "Create first room"), done: rooms.length > 0, target: "/tenant-admin/rooms" },
    { key: "invite", title: tx("ادعُ عضوًا للفريق", "Invite team member"), done: members.length > 1, target: "/tenant-admin/members" },
    { key: "schedule", title: tx("أضف موعدًا للتقويم", "Schedule event"), done: events.length > 0, target: "/tenant-admin/calendar" }
  ];

  const items = isTenantAdmin ? academyItems : genericItems;
  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);

  if (dismissed) return null;

  if (minimized) {
    return (
      <div className="onboarding-minimized-bar" onClick={() => { setMinimized(false); window.localStorage.setItem("ain-onboarding-minimized", "0"); }}>
        <Sparkles size={16} color="#6366F1" />
        <span>{tx(`خطوات إعداد الأكاديمية: ${completed} من ${items.length} مكتملة (${progress}%)`, `Academy Setup: ${completed} of ${items.length} completed (${progress}%)`)}</span>
        <div className="onboarding-mini-progress-track">
          <div className="onboarding-mini-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <button type="button" className="onboarding-mini-btn">{tx("متابعة الإعداد", "Continue")}</button>
      </div>
    );
  }

  return (
    <section className="onboarding-card">
      <div className="onboarding-progress">
        <svg viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="17" />
          <circle cx="21" cy="21" r="17" style={{ strokeDashoffset: 107 - (107 * progress / 100) }} />
        </svg>
        <strong>{progress}%</strong>
      </div>
      <div className="onboarding-copy">
        <span><Sparkles size={16} /> {tx("دليل إعداد الأكاديمية السريع", "Academy Quick Setup Guide")}</span>
        <h2>{progress === 100 ? tx("🎉 رائع! أكاديميتك جاهزة للتشغيل", "🎉 Great! Your academy is fully setup") : tx("خطوات قليلة لإطلاق كورساتك وحصصك", "A few steps to launch your courses & sessions")}</h2>
        <p>{tx(`${completed} من ${items.length} خطوات مكتملة — انقر على أي خطوة للذهاب إليها أو تأكيد إنجازها`, `${completed} of ${items.length} steps completed — Click to navigate or toggle`)}</p>
      </div>
      <div className="onboarding-steps">
        {items.map((item) => (
          <a
            className={item.done ? "done" : ""}
            href={item.target}
            key={item.key}
            title={tx("انقر للذهاب إلى الصفحة، أو استخدم المربع للتعليم", "Click to go to page or use checkbox")}
          >
            <span
              onClick={(e) => toggleManualCheck(item.key, e)}
              className="onboarding-step-checkbox"
              title={tx("تعليم كمنجز", "Toggle check")}
            >
              {item.done ? <CheckCircle2 size={18} color="#10B981" /> : <div className="step-circle" />}
            </span>
            <span className="step-title">{item.title}</span>
          </a>
        ))}
      </div>
      <div className="onboarding-actions-cluster">
        <button
          className="onboarding-action-btn"
          type="button"
          onClick={() => { setMinimized(true); window.localStorage.setItem("ain-onboarding-minimized", "1"); }}
          title={tx("تصغير", "Minimize")}
        >
          {tx("تصغير", "Minimize")}
        </button>
        <button
          className="onboarding-dismiss"
          type="button"
          onClick={() => { window.localStorage.setItem("ain-onboarding-dismissed", "1"); setDismissed(true); }}
          title={tx("إغلاق نهائي", "Dismiss")}
        >
          <X size={18} />
        </button>
      </div>
    </section>
  );
}

export function ActivityAuditPage() {
  const { activity } = useWorkspace();
  const tx = useBilingualText();
  const [filter, setFilter] = useState("all");
  const visible = activity.filter((item) => filter === "all" || item.tone === filter);
  return (
    <>
      <div className="stitch-page-head"><div><h1>{tx("سجل النشاط والتدقيق", "Activity & audit log")}</h1><p>{tx("سجل واضح وغير قابل للتعديل لكل العمليات المهمة داخل مساحة العمل.", "A clear, immutable record of important workspace actions.")}</p></div><Button variant="ghost"><ReceiptText size={17} /> {tx("تصدير CSV", "Export CSV")}</Button></div>
      <div className="audit-summary"><span><ShieldCheck size={21} /></span><div><strong>{tx("السجل محمي", "Audit trail protected")}</strong><small>{tx("يعرض من قام بالإجراء وماذا حدث ومتى وأين.", "Shows who did what, when, and where.")}</small></div></div>
      <div className="saved-view-toolbar"><div>{["all", "success", "danger"].map((value) => <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} type="button" key={value}>{value === "all" ? tx("كل الأنشطة", "All activity") : value === "success" ? tx("تغييرات", "Changes") : tx("مخاطر وحذف", "Risk & deletion")}</button>)}</div></div>
      <div className="audit-table"><div className="audit-head"><span>{tx("الإجراء", "Action")}</span><span>{tx("المنفذ", "Actor")}</span><span>{tx("العنصر", "Target")}</span><span>{tx("المكان", "Area")}</span><span>{tx("الوقت", "Time")}</span></div>{visible.map((item) => <div className="audit-row" key={item.id}><span className={`audit-event ${item.tone}`}><i />{item.action}</span><strong>{item.actor}</strong><span>{item.target}</span><span>{item.area}</span><small>{item.time}</small></div>)}</div>
    </>
  );
}

export function SavedViewToolbar({ storageId, filters, activeFilter, onFilterChange }) {
  const tx = useBilingualText();
  const { showToast } = useToast();
  const [views, setViews] = useState(() => JSON.parse(window.localStorage.getItem(`ain-views-${storageId}`) || "[]"));
  const [naming, setNaming] = useState(false);
  const [viewName, setViewName] = useState("");
  const save = (event) => {
    event.preventDefault();
    const name = viewName.trim();
    if (!name) return;
    const next = [...views.filter((view) => view.name !== name), { name, filter: activeFilter }];
    setViews(next);
    window.localStorage.setItem(`ain-views-${storageId}`, JSON.stringify(next));
    setViewName("");
    setNaming(false);
    showToast(tx("تم حفظ العرض", "View saved"));
  };
  return (
    <div className="saved-view-toolbar">
      <div><Filter size={17} />{filters.map((filter) => <button className={activeFilter === filter.value ? "active" : ""} onClick={() => onFilterChange(filter.value)} type="button" key={filter.value}>{filter.label}</button>)}</div>
      <div className="saved-views"><select aria-label={tx("العروض المحفوظة", "Saved views")} onChange={(event) => onFilterChange(event.target.value)} value=""><option value="">{tx("العروض المحفوظة", "Saved views")}</option>{views.map((view) => <option value={view.filter} key={view.name}>{view.name}</option>)}</select><Button variant="ghost" onClick={() => setNaming(true)}><Plus size={16} /> {tx("حفظ العرض", "Save view")}</Button>{naming && <form className="save-view-popover" onSubmit={save}><strong>{tx("حفظ العرض الحالي", "Save current view")}</strong><input autoFocus value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={tx("مثال: أعضاء بانتظار الدعوة", "e.g. Pending invitations")} /><div><button type="button" onClick={() => setNaming(false)}>{tx("إلغاء", "Cancel")}</button><button disabled={!viewName.trim()} type="submit">{tx("حفظ", "Save")}</button></div></form>}</div>
    </div>
  );
}

export function BillingSubscriptionPage() {
  const tx = useBilingualText();
  const { activeMembership } = useOrganization();
  const { rooms, members, files } = useWorkspace();
  const subscription = activeMembership?.subscription;
  const plan = subscription?.plan;
  const [cycle, setCycle] = useState(subscription?.billingInterval || "monthly");
  const limits = activeMembership?.limits || {};
  const storageBytes = files.reduce((sum, file) => sum + Number(file.fileAsset?.sizeBytes || 0), 0);
  const usage = [
    [tx("الأعضاء", "Members"), members.length, limits.members, Users],
    [tx("الغرف", "Rooms"), rooms.length, limits.rooms, CalendarDays],
    [tx("التخزين", "Storage"), storageBytes, limits.storage_bytes, FileText]
  ];
  const priceMinor = cycle === "yearly" ? plan?.yearlyPriceMinor : plan?.monthlyPriceMinor;
  const formatValue = (value, type) => type === "Storage"
    ? `${(value / 1073741824).toFixed(value ? 1 : 0)} GB`
    : new Intl.NumberFormat().format(value);
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat(document.documentElement.lang || "en", { dateStyle: "long" }).format(new Date(value))
    : null;
  const endDate = subscription?.currentPeriodEndsAt
    ? formatDate(subscription.currentPeriodEndsAt)
    : null;
  const trialEndDate = formatDate(subscription?.trialEndsAt || subscription?.trial_ends_at || subscription?.currentPeriodEndsAt);
  const isTrial = subscription?.status === "trial";
  return (
    <>
      <div className="stitch-page-head"><div><h1>{tx("الاشتراك والفواتير", "Subscription & billing")}</h1><p>{tx("تابع الباقة الحالية والاستخدام والحدود وسجل الفواتير.", "Track your plan, usage, limits, and billing history.")}</p></div><Button disabled title={tx("يتاح بعد تفعيل بوابة الدفع", "Available after payment gateway activation")}><CreditCard size={17} /> {tx("إدارة وسيلة الدفع", "Manage payment method")}</Button></div>
      {subscription ? <section className="billing-hero"><div><Badge tone={subscription.status === "active" || subscription.status === "trial" ? "success" : "warning"}>{isTrial ? tx("شهر مجاني", "Free month") : subscription.status}</Badge><span>{tx("الباقة الحالية", "Current plan")}</span><h2>{plan?.name || plan?.code}</h2><p>{isTrial ? (trialEndDate ? `${tx("أنت الآن داخل تجربة مجانية لمدة شهر. تنتهي في", "You are on a one-month free trial ending")} ${trialEndDate}` : tx("أنت الآن داخل تجربة مجانية لمدة شهر.", "You are on a one-month free trial.")) : (endDate ? `${tx("تنتهي الفترة الحالية في", "Current period ends")} ${endDate}` : tx("لا يوجد تاريخ تجديد مسجل", "No renewal date available"))}</p></div><div className="billing-price"><strong>{priceMinor == null ? "—" : new Intl.NumberFormat().format(priceMinor / 100)}</strong><span>{plan?.currency || "EGP"} / {cycle === "monthly" ? tx("شهر", "month") : tx("سنة", "year")}</span>{isTrial && <small>{tx("أول شهر مجاني، والسعر يبدأ بعد انتهاء التجربة.", "First month is free. Billing starts after the trial.")}</small>}<div className="stitch-period-toggle"><button className={cycle === "monthly" ? "active" : ""} onClick={() => setCycle("monthly")} type="button">{tx("شهري", "Monthly")}</button><button className={cycle === "yearly" ? "active" : ""} onClick={() => setCycle("yearly")} type="button">{tx("سنوي", "Yearly")}</button></div></div></section> : <EmptyState title={tx("لا يوجد اشتراك", "No subscription")} message={tx("لم يتم ربط مساحة العمل بباقة حتى الآن.", "This workspace is not connected to a plan yet.")} />}
      <section className="usage-grid">{usage.map(([label, used, limit, Icon]) => { const storage = label === tx("التخزين", "Storage"); const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0; return <article key={label}><div><span><Icon size={18} /></span><strong>{label}</strong><small>{formatValue(used, storage ? "Storage" : "")} / {limit == null ? tx("غير محدود", "Unlimited") : formatValue(limit, storage ? "Storage" : "")}</small></div><div className="usage-bar"><i style={{ width: `${percent}%` }} /></div><small>{limit == null ? tx("بدون حد", "No limit") : `${percent}% ${tx("مستخدم", "used")}`}</small></article>; })}</section>
      <div className="invoice-card"><div className="section-header"><div><h2>{tx("سجل الفواتير", "Invoice history")}</h2><p>{tx("ستظهر الفواتير الحقيقية هنا بعد تفعيل بوابة الدفع.", "Real invoices will appear here after the payment gateway is enabled.")}</p></div></div><EmptyState title={tx("لا توجد فواتير", "No invoices yet")} message={tx("لم تُسجل أي فاتورة لهذه المؤسسة.", "No invoice has been recorded for this organization.")} /></div>
    </>
  );
}

export function WorkspaceCalendarPage({ allowCreate = false }) {
  const { events, createPersonalReminder, rooms = [] } = useWorkspace();
  const tx = useBilingualText();
  const { showToast } = useToast();
  const today = useMemo(() => new Date(), []);
  const initialDate = today.toISOString().slice(0, 10);
  const [viewMode, setViewMode] = useState("weekly"); // "weekly" or "monthly"
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminder, setReminder] = useState({
    title: "",
    date: initialDate,
    time: "18:00",
    reminderMinutes: "30",
    notes: ""
  });
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date(`${initialDate}T12:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Egyptian calendars conventionally start the week on Saturday.
  const leadingDays = (new Date(year, month, 1).getDay() + 1) % 7;
  const officialHolidays = year === 2026 ? [
    ["2026-01-07", "عيد الميلاد المجيد", "Coptic Christmas"],
    ["2026-01-29", "ثورة 25 يناير وعيد الشرطة", "25 January Revolution & Police Day"],
    ...[19, 20, 21, 22, 23].map((day) => [`2026-03-${day}`, "عيد الفطر المبارك", "Eid Al-Fitr"]),
    ["2026-04-13", "عيد شم النسيم", "Sham El-Nessim"],
    ["2026-04-25", "عيد تحرير سيناء", "Sinai Liberation Day"],
    ["2026-05-07", "عيد العمال", "Labour Day"],
    ["2026-05-26", "وقفة عيد الأضحى المبارك", "Arafat Day"],
    ...[27, 28, 29, 30, 31].map((day) => [`2026-05-${day}`, "عيد الأضحى المبارك", "Eid Al-Adha"]),
    ["2026-06-18", "رأس السنة الهجرية", "Islamic New Year"],
    ["2026-07-02", "ثورة 30 يونيو", "30 June Revolution"],
    ["2026-07-23", "ثورة 23 يوليو", "23 July Revolution"],
    ["2026-08-27", "المولد النبوي الشريف", "Prophet's Birthday"],
    ["2026-10-06", "عيد القوات المسلحة", "Armed Forces Day"]
  ] : [
    [`${year}-01-07`, "عيد الميلاد المجيد", "Coptic Christmas"],
    [`${year}-04-25`, "عيد تحرير سيناء", "Sinai Liberation Day"],
    [`${year}-07-23`, "عيد الثورة", "Revolution Day"],
    [`${year}-10-06`, "عيد القوات المسلحة", "Armed Forces Day"]
  ];
  const holidayEvents = useMemo(() => officialHolidays.map(([date, titleAr, title]) => ({
    id: `holiday-${date}`,
    titleAr,
    title,
    date,
    time: tx("إجازة", "Holiday"),
    duration: 0,
    attendees: 0,
    roomName: tx("عطلة رسمية", "Official holiday"),
    type: "holiday",
    status: "published"
  })), [officialHolidays, tx]);

  const calendarEvents = useMemo(() => [...events, ...holidayEvents], [events, holidayEvents]);

  // Filtered by selected room
  const filteredEvents = useMemo(() => {
    if (selectedRoomId === "all") return calendarEvents;
    return calendarEvents.filter((ev) => ev.roomId === selectedRoomId || ev.type === "holiday");
  }, [calendarEvents, selectedRoomId]);

  // Week calculation starting Saturday
  const currentSaturday = useMemo(() => {
    const d = new Date(today);
    const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
    const daysSinceSat = (dayOfWeek + 1) % 7;
    d.setDate(d.getDate() - daysSinceSat + (weekOffset * 7));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, weekOffset]);

  const weekDays = useMemo(() => {
    const dayNamesAr = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    const dayNamesEn = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentSaturday);
      d.setDate(currentSaturday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        date: iso,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        nameAr: dayNamesAr[i],
        nameEn: dayNamesEn[i],
        isToday: iso === today.toISOString().slice(0, 10),
      };
    });
  }, [currentSaturday, today]);

  const weekRangeLabel = useMemo(() => {
    if (!weekDays.length) return "";
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.dayNum}/${first.monthNum} – ${last.dayNum}/${last.monthNum}`;
  }, [weekDays]);

  const timeSlots = [
    { id: "morning", labelAr: "09:00 - 11:00 (صباحاً)", labelEn: "09:00 - 11:00 (Morning)", defaultTime: "09:00", matchHour: (h) => h < 11 },
    { id: "midday", labelAr: "11:00 - 01:00 (ظهراً)", labelEn: "11:00 - 01:00 (Midday)", defaultTime: "11:00", matchHour: (h) => h >= 11 && h < 14 },
    { id: "afternoon", labelAr: "02:00 - 04:00 (بعد الظهر)", labelEn: "02:00 - 04:00 (Afternoon)", defaultTime: "14:00", matchHour: (h) => h >= 14 && h < 17 },
    { id: "evening", labelAr: "05:00 - 07:00 (مساءً)", labelEn: "05:00 - 07:00 (Evening)", defaultTime: "17:00", matchHour: (h) => h >= 17 && h < 19 },
    { id: "night", labelAr: "07:00 - 09:00 (ليلاً)", labelEn: "07:00 - 09:00 (Night)", defaultTime: "19:00", matchHour: (h) => h >= 19 },
  ];

  const getSlotEvents = (dayDate, slot) => {
    return filteredEvents.filter((ev) => {
      if (ev.date !== dayDate) return false;
      if (ev.type === "holiday") return slot.id === "morning";
      if (!ev.time) return slot.id === "morning";
      const h = parseInt(ev.time.split(":")[0], 10);
      if (isNaN(h)) return slot.id === "morning";
      return slot.matchHour(h);
    });
  };

  const monthDays = [
    ...Array.from({ length: leadingDays }, (_, index) => ({ key: `empty-${index}`, date: null, day: null })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return { key: date, date, day };
    })
  ];
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat(document.documentElement.lang || "en", { month: "long", year: "numeric" }).format(visibleMonth);
  const dayEvents = filteredEvents.filter((event) => event.date === selectedDate);
  const changeMonth = (offset) => setVisibleMonth(new Date(year, month + offset, 1));
  const goToday = () => {
    setSelectedDate(todayKey);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setWeekOffset(0);
  };
  const openReminder = (date = selectedDate, time = "18:00") => {
    setReminder((current) => ({ ...current, date, time }));
    setReminderOpen(true);
  };
  const saveReminder = async (event) => {
    event.preventDefault();
    setSavingReminder(true);
    try {
      await createPersonalReminder({ ...reminder, titleAr: reminder.title });
      const notificationAt = new Date(`${reminder.date}T${reminder.time}:00`).getTime()
        - Number(reminder.reminderMinutes) * 60000;
      const delay = notificationAt - Date.now();
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      if ("Notification" in window && delay > 0 && delay < 2147483647) {
        window.setTimeout(() => {
          if (Notification.permission === "granted") {
            new Notification(tx("تذكير من AIN", "AIN reminder"), { body: reminder.title });
          }
        }, delay);
      }
      showToast(tx("تم حفظ التذكير وإضافته للجدول", "Reminder saved and added to schedule"), "success");
      setSelectedDate(reminder.date);
      setReminderOpen(false);
      setReminder({ title: "", date: reminder.date, time: "18:00", reminderMinutes: "30", notes: "" });
    } catch (error) {
      showToast(error.message || tx("تعذر حفظ التذكير", "Could not save reminder"), "error");
    } finally {
      setSavingReminder(false);
    }
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("الجدول الدراسي والتقويم", "Academic Timetable & Calendar")}</h1>
          <p>{tx("الجدول الدراسي الأسبوعي للمحاضرات والحصص، مع التقويم الشهري والعطلات الرسمية والتذكيرات.", "Weekly lecture timetable, monthly calendar, official holidays, and reminders.")}</p>
        </div>
        <div className="calendar-head-actions">
          <div className="timetable-view-toggle">
            <button
              type="button"
              className={viewMode === "weekly" ? "active" : ""}
              onClick={() => setViewMode("weekly")}
            >
              <LayoutGrid size={15} />
              {tx("الجدول الأسبوعي", "Weekly Timetable")}
            </button>
            <button
              type="button"
              className={viewMode === "monthly" ? "active" : ""}
              onClick={() => setViewMode("monthly")}
            >
              <Calendar size={15} />
              {tx("التقويم الشهري", "Monthly Calendar")}
            </button>
          </div>
          <Button variant="ghost" onClick={() => openReminder()}>
            <Bell size={17} /> {tx("إضافة تذكير", "Add reminder")}
          </Button>
          {allowCreate && (
            <Button as="a" href="/tenant-admin/rooms?create=1">
              <Plus size={17} /> {tx("غرفة وموعد جديد", "New room event")}
            </Button>
          )}
        </div>
      </div>

      {viewMode === "weekly" ? (
        <section className="timetable-container">
          <div className="timetable-controls">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="calendar-nav">
                <button type="button" onClick={() => setWeekOffset((prev) => prev - 1)} aria-label={tx("الأسبوع السابق", "Previous week")}>
                  <ChevronLeft size={17} />
                </button>
                <button type="button" onClick={goToday}>
                  {tx("هذا الأسبوع", "This Week")}
                </button>
                <button type="button" onClick={() => setWeekOffset((prev) => prev + 1)} aria-label={tx("الأسبوع التالي", "Next week")}>
                  <ChevronRight size={17} />
                </button>
              </div>
              <strong style={{ fontSize: "14px", color: "var(--stitch-text, #1e293b)" }}>
                {weekRangeLabel}
              </strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--stitch-muted, #64748b)" }}>{tx("تصفية حسب القاعة:", "Filter by Room:")}</span>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                style={{ fontSize: "13px", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--stitch-border, #cbd5e1)" }}
              >
                <option value="all">{tx("جميع القاعات والدفعات", "All Rooms & Cohorts")}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="timetable-grid-wrapper">
            <div className="timetable-grid">
              {/* Header row: corner cell + 7 days */}
              <div className="timetable-header-cell" style={{ background: "#f1f5f9" }}>
                {tx("الفترة / اليوم", "Period / Day")}
              </div>
              {weekDays.map((day) => (
                <div key={day.date} className={`timetable-header-cell ${day.isToday ? "today-col" : ""}`}>
                  <div>{tx(day.nameAr, day.nameEn)}</div>
                  <small style={{ fontWeight: 400, opacity: 0.8 }}>{day.dayNum}/{day.monthNum}</small>
                </div>
              ))}

              {/* Time slot rows */}
              {timeSlots.map((slot) => (
                <div key={slot.id} style={{ display: "contents" }}>
                  <div className="timetable-time-cell">
                    <span>{tx(slot.labelAr, slot.labelEn)}</span>
                  </div>

                  {weekDays.map((day) => {
                    const slotEvents = getSlotEvents(day.date, slot);
                    return (
                      <div
                        key={`${day.date}-${slot.id}`}
                        className={`timetable-slot ${day.isToday ? "today-slot" : ""}`}
                        onClick={() => openReminder(day.date, slot.defaultTime)}
                      >
                        {slotEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={`timetable-event-card ${ev.type || "lecture"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                          >
                            <header>
                              <span>{ev.time}</span>
                              <Badge size="xs" tone={ev.type === "holiday" ? "warning" : ev.type === "personal_reminder" ? "neutral" : "primary"}>
                                {ev.roomName}
                              </Badge>
                            </header>
                            <strong>{tx(ev.titleAr, ev.title)}</strong>
                            {ev.attendees > 0 && (
                              <small style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10.5px" }}>
                                <Users size={12} /> {ev.attendees} {tx("طالب", "students")}
                              </small>
                            )}
                          </div>
                        ))}
                        {slotEvents.length === 0 && (
                          <span className="timetable-add-hint">
                            + {tx("إضافة", "Add")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="calendar-layout">
          <div className="calendar-surface">
            <header>
              <div>
                <strong>{monthLabel}</strong>
                <span>{filteredEvents.filter((event) => event.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length} {tx("مواعيد وعطلات", "events & holidays")}</span>
              </div>
              <div className="calendar-nav">
                <button type="button" onClick={() => changeMonth(-1)} aria-label={tx("الشهر السابق", "Previous month")}>
                  <ChevronLeft size={17} />
                </button>
                <button type="button" onClick={goToday}>{tx("اليوم", "Today")}</button>
                <button type="button" onClick={() => changeMonth(1)} aria-label={tx("الشهر التالي", "Next month")}>
                  <ChevronRight size={17} />
                </button>
              </div>
            </header>
            <div className="calendar-weekdays">
              {tx(["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"], ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]).map((day, index) => (
                <span className={index === 0 ? "week-start" : ""} key={day}>{day}</span>
              ))}
            </div>
            <div className="calendar-days">
              {monthDays.map((item, index) => {
                if (!item.date) return <span className={`calendar-empty-day ${index % 7 === 0 ? "week-start" : ""}`} key={item.key} />;
                const items = filteredEvents.filter((event) => event.date === item.date);
                const hasHoliday = items.some((event) => event.type === "holiday");
                return (
                  <button
                    className={`${item.date === selectedDate ? "selected" : ""} ${item.date === todayKey ? "today" : ""} ${index % 7 === 0 ? "week-start" : ""} ${hasHoliday ? "holiday" : ""}`}
                    onClick={() => setSelectedDate(item.date)}
                    onDoubleClick={() => openReminder(item.date)}
                    type="button"
                    key={item.key}
                  >
                    <span>{item.day}</span>
                    {items.slice(0, 2).map((event) => (
                      <i className={`calendar-event-${event.type || "meeting"}`} key={event.id}>
                        {event.time} {tx(event.titleAr, event.title)}
                      </i>
                    ))}
                    {items.length > 2 && <small>+{items.length - 2}</small>}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="calendar-agenda">
            <header>
              <span>{tx("جدول اليوم", "Day agenda")}</span>
              <strong>{selectedDate}</strong>
            </header>
            {dayEvents.map((event) => (
              <article
                className={`agenda-${event.type || "event"}`}
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                style={{ cursor: "pointer" }}
              >
                <span>{event.time}{event.duration > 0 && <small>{event.duration} min</small>}</span>
                <div>
                  <Badge tone={event.type === "holiday" ? "warning" : event.type === "personal_reminder" ? "success" : "primary"}>
                    {event.roomName}
                  </Badge>
                  <h3>{tx(event.titleAr, event.title)}</h3>
                  <p>{event.description || (event.type === "holiday" ? tx("عطلة رسمية ظاهرة لكل المستخدمين.", "Official holiday shown to all users.") : tx("موعد مرتبط بالغرفة", "Scheduled room event"))}</p>
                  {event.attendees > 0 && <small><Users size={14} /> {event.attendees} {tx("مشاركين", "attendees")}</small>}
                </div>
              </article>
            ))}
            {!dayEvents.length && (
              <div className="agenda-empty">
                <CalendarDays size={34} />
                <strong>{tx("لا توجد مواعيد", "No events scheduled")}</strong>
                <span>{tx("اضغط مرتين على اليوم أو أضف تذكيرًا شخصيًا.", "Double-click the day or add a personal reminder.")}</span>
                <Button variant="ghost" onClick={() => openReminder(selectedDate)}>
                  <Bell size={16} /> {tx("إضافة تذكير", "Add reminder")}
                </Button>
              </div>
            )}
          </aside>
        </section>
      )}

      {/* EVENT DETAILS MODAL */}
      <Modal
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={tx("تفاصيل الحصة / الموعد", "Session / Event Details")}
      >
        {selectedEvent && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Badge tone={selectedEvent.type === "holiday" ? "warning" : selectedEvent.type === "personal_reminder" ? "neutral" : "primary"}>
                {selectedEvent.roomName || tx("جلسة دراسية", "Study Session")}
              </Badge>
              <span style={{ fontSize: "13px", color: "var(--stitch-muted, #64748b)" }}>
                {selectedEvent.date} {selectedEvent.time ? `• ${selectedEvent.time}` : ""}
              </span>
            </div>

            <h2 style={{ fontSize: "18px", margin: "0", fontWeight: "700" }}>
              {tx(selectedEvent.titleAr, selectedEvent.title)}
            </h2>

            {selectedEvent.description && (
              <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.6", margin: "0" }}>
                {selectedEvent.description}
              </p>
            )}

            <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#f8fafc", padding: "12px", borderRadius: "8px", margin: 0 }}>
              <div>
                <dt style={{ fontSize: "11px", color: "#64748b" }}>{tx("المدة الزمنية", "Duration")}</dt>
                <dd style={{ margin: "4px 0 0", fontWeight: "600", fontSize: "13px" }}>{selectedEvent.duration ? `${selectedEvent.duration} ${tx("دقيقة", "min")}` : "—"}</dd>
              </div>
              <div>
                <dt style={{ fontSize: "11px", color: "#64748b" }}>{tx("عدد الطلاب المسجلين", "Enrolled Students")}</dt>
                <dd style={{ margin: "4px 0 0", fontWeight: "600", fontSize: "13px" }}>{selectedEvent.attendees || "—"}</dd>
              </div>
            </dl>

            <div className="learning-form-actions">
              <Button variant="ghost" onClick={() => setSelectedEvent(null)}>
                {tx("إغلاق", "Close")}
              </Button>
              {selectedEvent.roomId && (
                <Button as="a" href={`/tenant-admin/rooms`}>
                  <ExternalLink size={15} />
                  {tx("الانتقال إلى القاعة", "Go to Room")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* PERSONAL REMINDER MODAL */}
      <Modal
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        title={tx("تذكير شخصي جديد", "New personal reminder")}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setReminderOpen(false)}>
              {tx("إلغاء", "Cancel")}
            </Button>
            <Button type="submit" form="personal-reminder-form" disabled={savingReminder}>
              {savingReminder ? tx("جاري الحفظ...", "Saving...") : tx("حفظ وضبط التنبيه", "Save reminder")}
            </Button>
          </>
        }
      >
        <form id="personal-reminder-form" className="reminder-form" onSubmit={saveReminder}>
          <label>
            {tx("عنوان التذكير", "Reminder title")}
            <input
              required
              value={reminder.title}
              onChange={(event) => setReminder((current) => ({ ...current, title: event.target.value }))}
              placeholder={tx("مثال: مراجعة الفصل الثالث", "e.g. Review chapter three")}
            />
          </label>
          <div>
            <label>
              {tx("التاريخ", "Date")}
              <input
                required
                type="date"
                value={reminder.date}
                onChange={(event) => setReminder((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              {tx("الوقت", "Time")}
              <input
                required
                type="time"
                value={reminder.time}
                onChange={(event) => setReminder((current) => ({ ...current, time: event.target.value }))}
              />
            </label>
          </div>
          <label>
            {tx("نبّهني قبل الموعد", "Notify me before")}
            <select
              value={reminder.reminderMinutes}
              onChange={(event) => setReminder((current) => ({ ...current, reminderMinutes: event.target.value }))}
            >
              <option value="0">{tx("وقت الموعد", "At event time")}</option>
              <option value="15">{tx("15 دقيقة", "15 minutes")}</option>
              <option value="30">{tx("30 دقيقة", "30 minutes")}</option>
              <option value="60">{tx("ساعة", "1 hour")}</option>
              <option value="1440">{tx("يوم", "1 day")}</option>
            </select>
          </label>
          <label>
            {tx("ملاحظات", "Notes")}
            <textarea
              rows="3"
              value={reminder.notes}
              onChange={(event) => setReminder((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
        </form>
      </Modal>
    </>
  );
}

export function ConfirmActionDialog({ open, title, description, confirmLabel, onConfirm, onClose, danger = true }) {
  const tx = useBilingualText();
  return <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>{tx("إلغاء", "Cancel")}</Button><Button className={danger ? "btn-danger" : ""} onClick={onConfirm}>{confirmLabel}</Button></>}><div className="confirm-action"><span><Trash2 size={23} /></span><p>{description}</p></div></Modal>;
}
