import {
  Bell,
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
    [tx("بدء استخدام AIO", "Getting started with AIO"), tx("إعداد الحساب ومساحة العمل والدعوات", "Account, workspace, and invitations")],
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
  const { rooms, members, events } = useWorkspace();
  const tx = useBilingualText();
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem("ain-onboarding-dismissed") === "1");
  const items = [
    { title: tx("أكمل بيانات الحساب", "Complete your profile"), done: Boolean(user.name && user.email), target: `${roleBase(user.role)}/settings` },
    { title: tx("أنشئ أول غرفة", "Create your first room"), done: rooms.some((room) => String(room.id).startsWith("room-")), target: "/tenant-admin/rooms?create=1" },
    { title: tx("ادعُ عضوًا للفريق", "Invite a team member"), done: members.some((member) => String(member.id).startsWith("member-")), target: "/tenant-admin/members" },
    { title: tx("أضف موعدًا للتقويم", "Schedule a room event"), done: events.some((event) => String(event.roomId).startsWith("room-")), target: "/tenant-admin/calendar" }
  ];
  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);
  if (dismissed) return null;
  return (
    <section className="onboarding-card">
      <div className="onboarding-progress"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="17" /><circle cx="21" cy="21" r="17" style={{ strokeDashoffset: 107 - (107 * progress / 100) }} /></svg><strong>{progress}%</strong></div>
      <div className="onboarding-copy"><span><Sparkles size={16} /> {tx("إعداد مساحة العمل", "Workspace setup")}</span><h2>{tx("خطوات قليلة لتجربة أفضل", "A few steps to get the most from AIO")}</h2><p>{tx(`${completed} من ${items.length} خطوات مكتملة`, `${completed} of ${items.length} steps completed`)}</p></div>
      <div className="onboarding-steps">{items.map((item) => <a className={item.done ? "done" : ""} href={item.target} key={item.title}>{item.done ? <CheckCircle2 size={18} /> : <span />}{item.title}</a>)}</div>
      {progress === 100 && <button className="onboarding-dismiss" type="button" onClick={() => { window.localStorage.setItem("ain-onboarding-dismissed", "1"); setDismissed(true); }}><X size={18} /></button>}
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
  const endDate = subscription?.currentPeriodEndsAt
    ? new Intl.DateTimeFormat(document.documentElement.lang || "en", { dateStyle: "long" }).format(new Date(subscription.currentPeriodEndsAt))
    : null;
  return (
    <>
      <div className="stitch-page-head"><div><h1>{tx("الاشتراك والفواتير", "Subscription & billing")}</h1><p>{tx("تابع الباقة الحالية والاستخدام والحدود وسجل الفواتير.", "Track your plan, usage, limits, and billing history.")}</p></div><Button disabled title={tx("يتاح بعد تفعيل بوابة الدفع", "Available after payment gateway activation")}><CreditCard size={17} /> {tx("إدارة وسيلة الدفع", "Manage payment method")}</Button></div>
      {subscription ? <section className="billing-hero"><div><Badge tone={subscription.status === "active" || subscription.status === "trial" ? "success" : "warning"}>{subscription.status}</Badge><span>{tx("الباقة الحالية", "Current plan")}</span><h2>{plan?.name || plan?.code}</h2><p>{endDate ? `${tx("تنتهي الفترة الحالية في", "Current period ends")} ${endDate}` : tx("لا يوجد تاريخ تجديد مسجل", "No renewal date available")}</p></div><div className="billing-price"><strong>{priceMinor == null ? "—" : new Intl.NumberFormat().format(priceMinor / 100)}</strong><span>{plan?.currency || "EGP"} / {cycle === "monthly" ? tx("شهر", "month") : tx("سنة", "year")}</span><div className="stitch-period-toggle"><button className={cycle === "monthly" ? "active" : ""} onClick={() => setCycle("monthly")} type="button">{tx("شهري", "Monthly")}</button><button className={cycle === "yearly" ? "active" : ""} onClick={() => setCycle("yearly")} type="button">{tx("سنوي", "Yearly")}</button></div></div></section> : <EmptyState title={tx("لا يوجد اشتراك", "No subscription")} message={tx("لم يتم ربط مساحة العمل بباقة حتى الآن.", "This workspace is not connected to a plan yet.")} />}
      <section className="usage-grid">{usage.map(([label, used, limit, Icon]) => { const storage = label === tx("التخزين", "Storage"); const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0; return <article key={label}><div><span><Icon size={18} /></span><strong>{label}</strong><small>{formatValue(used, storage ? "Storage" : "")} / {limit == null ? tx("غير محدود", "Unlimited") : formatValue(limit, storage ? "Storage" : "")}</small></div><div className="usage-bar"><i style={{ width: `${percent}%` }} /></div><small>{limit == null ? tx("بدون حد", "No limit") : `${percent}% ${tx("مستخدم", "used")}`}</small></article>; })}</section>
      <div className="invoice-card"><div className="section-header"><div><h2>{tx("سجل الفواتير", "Invoice history")}</h2><p>{tx("ستظهر الفواتير الحقيقية هنا بعد تفعيل بوابة الدفع.", "Real invoices will appear here after the payment gateway is enabled.")}</p></div></div><EmptyState title={tx("لا توجد فواتير", "No invoices yet")} message={tx("لم تُسجل أي فاتورة لهذه المؤسسة.", "No invoice has been recorded for this organization.")} /></div>
    </>
  );
}

export function WorkspaceCalendarPage({ allowCreate = false }) {
  const { events } = useWorkspace();
  const tx = useBilingualText();
  const today = new Date();
  const initialDate = events[0]?.date || today.toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date(`${initialDate}T12:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = new Date(year, month, 1).getDay();
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
  const dayEvents = events.filter((event) => event.date === selectedDate);
  const changeMonth = (offset) => setVisibleMonth(new Date(year, month + offset, 1));
  const goToday = () => {
    setSelectedDate(todayKey);
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };
  return (
    <>
      <div className="stitch-page-head"><div><h1>{tx("تقويم مساحة العمل", "Workspace calendar")}</h1><p>{tx("أي موعد يُحدد داخل غرفة يظهر هنا ولدى الأعضاء المدعوين.", "Every room schedule appears here and on invited members' calendars.")}</p></div>{allowCreate && <Button as="a" href="/tenant-admin/rooms?create=1"><Plus size={17} /> {tx("غرفة وموعد جديد", "New room event")}</Button>}</div>
      <section className="calendar-layout"><div className="calendar-surface"><header><div><strong>{monthLabel}</strong><span>{events.filter((event) => event.date?.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length} {tx("مواعيد", "events")}</span></div><div className="calendar-nav"><button type="button" onClick={() => changeMonth(-1)} aria-label={tx("الشهر السابق", "Previous month")}><ChevronLeft size={17} /></button><button type="button" onClick={goToday}>{tx("اليوم", "Today")}</button><button type="button" onClick={() => changeMonth(1)} aria-label={tx("الشهر التالي", "Next month")}><ChevronRight size={17} /></button></div></header><div className="calendar-weekdays">{tx(["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"], ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day) => <span key={day}>{day}</span>)}</div><div className="calendar-days">{monthDays.map((item) => { if (!item.date) return <span className="calendar-empty-day" key={item.key} />; const items = events.filter((event) => event.date === item.date); return <button className={`${item.date === selectedDate ? "selected" : ""} ${item.date === todayKey ? "today" : ""}`} onClick={() => setSelectedDate(item.date)} type="button" key={item.key}><span>{item.day}</span>{items.slice(0, 2).map((event) => <i key={event.id}>{event.time} {tx(event.titleAr, event.title)}</i>)}{items.length > 2 && <small>+{items.length - 2}</small>}</button>; })}</div></div><aside className="calendar-agenda"><header><span>{tx("جدول اليوم", "Day agenda")}</span><strong>{selectedDate}</strong></header>{dayEvents.map((event) => <article key={event.id}><span>{event.time}<small>{event.duration} min</small></span><div><Badge tone="primary">{event.roomName}</Badge><h3>{tx(event.titleAr, event.title)}</h3><p>{event.description || tx("موعد مرتبط بالغرفة", "Scheduled room event")}</p><small><Users size={14} /> {event.attendees} {tx("مشاركين", "attendees")}</small></div></article>)}{!dayEvents.length && <div className="agenda-empty"><CalendarDays size={34} /><strong>{tx("لا توجد مواعيد", "No events scheduled")}</strong><span>{tx("اختر يومًا آخر أو أنشئ موعدًا من الغرف.", "Choose another day or schedule one from Rooms.")}</span></div>}</aside></section>
    </>
  );
}

export function ConfirmActionDialog({ open, title, description, confirmLabel, onConfirm, onClose, danger = true }) {
  const tx = useBilingualText();
  return <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="ghost" onClick={onClose}>{tx("إلغاء", "Cancel")}</Button><Button className={danger ? "btn-danger" : ""} onClick={onConfirm}>{confirmLabel}</Button></>}><div className="confirm-action"><span><Trash2 size={23} /></span><p>{description}</p></div></Modal>;
}
