import {
  ArrowRight, Award, BookOpen, Building2, CalendarClock, Check, CheckCircle2, CircleDashed, Clock3,
  FileText, GraduationCap, Layers3, ListTodo, Megaphone, Play, Plus, Sparkles, Users, Video, X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { useLearning } from "../contexts/LearningContext";
import { useAuth } from "../contexts/AuthContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useBilingualText } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";

function titleFor(item, tx) {
  return tx(item.titleAr || item.title, item.title);
}

function PageHead({ title, description, action }) {
  return <div className="stitch-page-head learning-page-head"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function EmptyState({ icon: Icon, title, description }) {
  return <div className="learning-empty"><Icon size={30} /><strong>{title}</strong><p>{description}</p></div>;
}

function Capacity({ batch }) {
  const value = Math.min(100, Math.round((batch.confirmedSeats / batch.capacity) * 100));
  return <div className="learning-capacity"><div><span>{batch.confirmedSeats}/{batch.capacity}</span><small>{value}%</small></div><progress max="100" value={value} /></div>;
}

function deliveryName(type, tx) {
  const map = {
    online: tx("أونلاين", "Online"),
    onsite: tx("حضوري", "On-site"),
    offline: tx("حضوري", "On-site"),
    hybrid: tx("مدمج", "Hybrid"),
    recorded: tx("مسجل", "Recorded")
  };
  return map[type] || type;
}

export function CourseManagementPage() {
  const { courses, createCourse } = useLearning();
  const { activeOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const tx = useBilingualText();
  const isCompany = activeOrganization?.type === "company";
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createCourse({ title: form.get("title"), titleAr: form.get("titleAr"), category: form.get("category"), instructor: form.get("instructor"), deliveryType: form.get("deliveryType"), visibility: isCompany ? "organization" : form.get("visibility"), price: Number(form.get("price") || 0), status: "published", roomName: tx("غرفة جديدة", "New room") });
    setOpen(false);
  };
  return <>
    <PageHead title={isCompany ? tx("برامج التدريب", "Training programs") : tx("إدارة الكورسات", "Course management")} description={isCompany ? tx("أنشئ برامج داخلية واربطها بالموظفين والغرف والمهام.", "Create internal programs linked to employees, rooms, and tasks.") : tx("أنشئ الكورسات وانشرها واربطها بالدفعات والغرف.", "Create, publish, and connect courses to batches and rooms.")} action={<Button onClick={() => setOpen(true)}><Plus size={18} />{tx("إضافة برنامج", "Add course")}</Button>} />
    <section className="learning-card-grid">
      {courses.map((course) => <article className="learning-course-card" key={course.id} style={{ "--course-color": course.color }}>
        <div className="learning-card-icon"><BookOpen size={23} /></div>
        <div className="learning-card-badges"><Badge tone={course.status === "published" ? "success" : "neutral"}>{course.status === "published" ? tx("منشور", "Published") : tx("مسودة", "Draft")}</Badge><Badge tone="neutral">{course.visibility === "public" ? tx("عام", "Public") : tx("داخلي", "Internal")}</Badge></div>
        <h2>{titleFor(course, tx)}</h2><p>{course.category}</p>
        <div className="learning-meta"><span><Users size={16} />{course.students} {isCompany ? tx("موظف", "employees") : tx("طالب", "students")}</span><span><GraduationCap size={16} />{course.instructor}</span></div>
        <footer><span>{deliveryName(course.deliveryType, tx)}</span><strong>{course.price ? `${course.price.toLocaleString()} EGP` : tx("مضمّن بالخطة", "Included")}</strong></footer>
      </article>)}
    </section>
    <Modal title={tx("إنشاء برنامج جديد", "Create a new course")} open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}>
      <div className="learning-form-grid"><FormField label={tx("الاسم بالإنجليزية", "English title")}><input name="title" required /></FormField><FormField label={tx("الاسم بالعربية", "Arabic title")}><input name="titleAr" required /></FormField><FormField label={tx("التصنيف", "Category")}><input name="category" required /></FormField><FormField label={tx("المدرب أو الفريق", "Instructor or team")}><input name="instructor" required /></FormField><FormField label={tx("طريقة التقديم", "Delivery")}><select name="deliveryType"><option value="online">{tx("أونلاين", "Online")}</option><option value="onsite">{tx("حضوري", "On-site")}</option><option value="hybrid">{tx("مدمج", "Hybrid")}</option></select></FormField>{!isCompany && <FormField label={tx("الظهور", "Visibility")}><select name="visibility"><option value="public">{tx("عام", "Public")}</option><option value="organization">{tx("داخلي", "Internal")}</option></select></FormField>}<FormField label={tx("السعر", "Price")}><input name="price" type="number" min="0" defaultValue="0" /></FormField></div>
      <div className="learning-form-actions"><Button variant="ghost" onClick={() => setOpen(false)}>{tx("إلغاء", "Cancel")}</Button><Button type="submit">{tx("إنشاء ونشر", "Create and publish")}</Button></div>
    </form></Modal>
  </>;
}

export function BatchManagementPage() {
  const { batches, courses, createBatch } = useLearning();
  const [open, setOpen] = useState(false);
  const tx = useBilingualText();
  const submit = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const course = courses.find((item) => item.id === form.get("courseId")); createBatch({ courseId: course.id, title: form.get("title"), titleAr: form.get("titleAr"), startDate: form.get("startDate"), endDate: form.get("endDate"), capacity: Number(form.get("capacity")), deliveryType: course.deliveryType, roomId: course.roomId, roomName: course.roomName }); setOpen(false); };
  return <><PageHead title={tx("الدفعات والمجموعات", "Batches and cohorts")} description={tx("نظّم المواعيد والسعة واربط كل دفعة بغرفتها.", "Control schedules, capacity, and linked rooms.")} action={<Button onClick={() => setOpen(true)}><Plus size={18} />{tx("دفعة جديدة", "New batch")}</Button>} />
    <section className="learning-list">{batches.map((batch) => <article className="learning-batch-row" key={batch.id}><div className="learning-card-icon"><Layers3 size={22} /></div><div><Badge tone={batch.status === "full" ? "danger" : "success"}>{batch.status === "full" ? tx("مكتملة", "Full") : tx("متاحة", "Open")}</Badge><h2>{titleFor(batch, tx)}</h2><p>{batch.roomName} · {batch.startDate} → {batch.endDate}</p></div><Capacity batch={batch} /></article>)}</section>
    <Modal title={tx("إنشاء دفعة", "Create batch")} open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><FormField label={tx("الكورس", "Course")}><select name="courseId" required>{courses.map((course) => <option value={course.id} key={course.id}>{titleFor(course, tx)}</option>)}</select></FormField><div className="learning-form-grid"><FormField label={tx("اسم الدفعة", "Batch name")}><input name="title" required /></FormField><FormField label={tx("الاسم بالعربية", "Arabic name")}><input name="titleAr" required /></FormField><FormField label={tx("تاريخ البداية", "Start date")}><input name="startDate" type="date" required /></FormField><FormField label={tx("تاريخ النهاية", "End date")}><input name="endDate" type="date" required /></FormField><FormField label={tx("السعة", "Capacity")}><input name="capacity" type="number" min="1" defaultValue="25" required /></FormField></div><div className="learning-form-actions"><Button variant="ghost" onClick={() => setOpen(false)}>{tx("إلغاء", "Cancel")}</Button><Button type="submit">{tx("إنشاء الدفعة", "Create batch")}</Button></div></form></Modal>
  </>;
}

export function BookingManagementPage() {
  const { bookings, courses, batches, updateBookingStatus } = useLearning();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const courseMap = useMemo(() => Object.fromEntries(courses.map((x) => [x.id, x])), [courses]);
  const batchMap = useMemo(() => Object.fromEntries(batches.map((x) => [x.id, x])), [batches]);
  const update = (id, status) => { const result = updateBookingStatus(id, status); if (!result.ok) showToast(tx("لا توجد أماكن متاحة في هذه الدفعة", "This batch has no available seats"), "error"); else showToast(status === "confirmed" ? tx("تم تأكيد الحجز وإضافة الطالب للغرفة", "Booking confirmed and room access granted") : tx("تم رفض الطلب", "Request rejected"), "success"); };
  return <><PageHead title={tx("طلبات الحجز", "Booking requests")} description={tx("راجع الطلبات وأكد المقاعد قبل منح الوصول للغرفة.", "Review requests and confirm seats before granting room access.")} />
    <div className="stitch-table-card learning-table"><table><thead><tr><th>{tx("المتقدم", "Applicant")}</th><th>{tx("الكورس والدفعة", "Course and batch")}</th><th>{tx("الدفع", "Payment")}</th><th>{tx("الحالة", "Status")}</th><th>{tx("الإجراء", "Action")}</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.studentName}</strong><small>{booking.email}</small></td><td><strong>{titleFor(courseMap[booking.courseId] || {}, tx)}</strong><small>{titleFor(batchMap[booking.batchId] || {}, tx)}</small></td><td><Badge tone={booking.paymentStatus === "paid" ? "success" : "warning"}>{booking.paymentStatus.replace("_", " ")}</Badge></td><td><Badge tone={booking.status === "confirmed" ? "success" : booking.status === "rejected" ? "danger" : "warning"}>{booking.status.replace("_", " ")}</Badge></td><td>{booking.status === "pending_confirmation" ? <div className="learning-actions"><Button onClick={() => update(booking.id, "confirmed")}><Check size={16} />{tx("قبول", "Approve")}</Button><Button variant="ghost" onClick={() => update(booking.id, "rejected")}><X size={16} />{tx("رفض", "Reject")}</Button></div> : <span className="learning-muted">{tx("لا يوجد إجراء", "No action")}</span>}</td></tr>)}</tbody></table></div>
  </>;
}

export function AnnouncementsPage({ canCreate = false }) {
  const { announcements, createAnnouncement } = useLearning();
  const [open, setOpen] = useState(false);
  const tx = useBilingualText();
  const submit = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createAnnouncement({ title: form.get("title"), titleAr: form.get("titleAr"), body: form.get("body"), bodyAr: form.get("bodyAr"), audience: form.get("audience"), roomName: form.get("roomName"), author: tx("الإدارة", "Management"), pinned: form.get("pinned") === "on" }); setOpen(false); };
  return <><PageHead title={tx("لوحة الإعلانات", "Announcements")} description={tx("تحديثات واضحة تصل للفريق أو الطلاب داخل سياق الغرفة.", "Focused updates for employees or students inside each room.")} action={canCreate && <Button onClick={() => setOpen(true)}><Plus size={18} />{tx("إعلان جديد", "New announcement")}</Button>} />
    <section className="announcement-feed">{announcements.length ? announcements.map((item) => <article key={item.id} className={item.pinned ? "announcement-item pinned" : "announcement-item"}><div className="learning-card-icon"><Megaphone size={21} /></div><div>{item.pinned && <Badge tone="primary">{tx("مثبت", "Pinned")}</Badge>}<h2>{titleFor(item, tx)}</h2><p>{tx(item.bodyAr || item.body, item.body)}</p><footer><span>{item.author}</span><span>{item.audience}</span><span>{item.roomName}</span><small>{item.publishedAt}</small></footer></div></article>) : <EmptyState icon={Megaphone} title={tx("لا توجد إعلانات", "No announcements")} description={tx("ستظهر التحديثات المهمة هنا.", "Important updates will appear here.")} />}</section>
    <Modal title={tx("نشر إعلان", "Publish announcement")} open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><div className="learning-form-grid"><FormField label={tx("العنوان بالإنجليزية", "English title")}><input name="title" required /></FormField><FormField label={tx("العنوان بالعربية", "Arabic title")}><input name="titleAr" required /></FormField><FormField label={tx("الجمهور", "Audience")}><input name="audience" required /></FormField><FormField label={tx("الغرفة", "Room")}><input name="roomName" required /></FormField></div><FormField label={tx("النص بالإنجليزية", "English message")}><textarea name="body" required /></FormField><FormField label={tx("النص بالعربية", "Arabic message")}><textarea name="bodyAr" required /></FormField><label className="learning-check"><input name="pinned" type="checkbox" />{tx("تثبيت الإعلان", "Pin announcement")}</label><div className="learning-form-actions"><Button type="submit">{tx("نشر", "Publish")}</Button></div></form></Modal>
  </>;
}

export function MeetingsPage({ canCreate = false }) {
  const { meetings, createMeeting } = useLearning();
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();
  const tx = useBilingualText();
  const submit = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createMeeting({ title: form.get("title"), titleAr: form.get("titleAr"), date: form.get("date"), time: form.get("time"), duration: Number(form.get("duration")), roomName: form.get("roomName"), host: form.get("host") }); setOpen(false); };
  return <><PageHead title={tx("الاجتماعات المباشرة", "Live meetings")} description={tx("جلسات مرتبطة بالغرف، جاهزة لربط مزود الفيديو في الباك إند.", "Room-linked sessions ready for backend video-provider integration.")} action={canCreate && <Button onClick={() => setOpen(true)}><Plus size={18} />{tx("جدولة اجتماع", "Schedule meeting")}</Button>} />
    <section className="learning-card-grid">{meetings.map((meeting) => <article className="meeting-product-card" key={meeting.id}><div className="meeting-date"><strong>{new Date(meeting.date).getDate()}</strong><span>{new Date(meeting.date).toLocaleString("en", { month: "short" })}</span></div><div><Badge tone="success">{tx("مجدول", "Scheduled")}</Badge><h2>{titleFor(meeting, tx)}</h2><p>{meeting.roomName} · {meeting.host}</p><div className="learning-meta"><span><Clock3 size={16} />{meeting.time} · {meeting.duration} min</span><span><Users size={16} />{meeting.participants}</span></div></div><Button onClick={() => showToast(tx("غرفة الاجتماع جاهزة لربط مزود الفيديو", "Meeting room is ready for video-provider integration"), "info")}><Video size={17} />{tx("فتح التفاصيل", "Open details")}</Button></article>)}</section>
    <Modal title={tx("جدولة اجتماع", "Schedule a meeting")} open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><div className="learning-form-grid"><FormField label={tx("العنوان بالإنجليزية", "English title")}><input name="title" required /></FormField><FormField label={tx("العنوان بالعربية", "Arabic title")}><input name="titleAr" required /></FormField><FormField label={tx("التاريخ", "Date")}><input name="date" type="date" required /></FormField><FormField label={tx("الوقت", "Time")}><input name="time" type="time" required /></FormField><FormField label={tx("المدة بالدقائق", "Duration in minutes")}><input name="duration" type="number" min="15" defaultValue="60" /></FormField><FormField label={tx("الغرفة", "Room")}><input name="roomName" required /></FormField><FormField label={tx("المضيف", "Host")}><input name="host" required /></FormField></div><div className="learning-form-actions"><Button type="submit">{tx("جدولة", "Schedule")}</Button></div></form></Modal>
  </>;
}

export function TasksPage({ canCreate = false }) {
  const { tasks, createTask, updateTaskStatus } = useLearning();
  const [open, setOpen] = useState(false);
  const tx = useBilingualText();
  const columns = [{ id: "todo", label: tx("للعمل", "To do"), icon: CircleDashed }, { id: "in_progress", label: tx("قيد التنفيذ", "In progress"), icon: Clock3 }, { id: "done", label: tx("مكتمل", "Done"), icon: CheckCircle2 }];
  const submit = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); createTask({ title: form.get("title"), titleAr: form.get("titleAr"), scope: form.get("scope"), assignee: form.get("assignee"), dueDate: form.get("dueDate"), priority: form.get("priority") }); setOpen(false); };
  return <><PageHead title={tx("المهام", "Tasks")} description={tx("تابع المطلوب داخل الغرف وبرامج التدريب من مكان واحد.", "Track room and training work from one place.")} action={canCreate && <Button onClick={() => setOpen(true)}><Plus size={18} />{tx("مهمة جديدة", "New task")}</Button>} />
    <section className="task-board">{columns.map(({ id, label, icon: Icon }) => <div className="task-column" key={id}><header><Icon size={19} /><strong>{label}</strong><span>{tasks.filter((task) => task.status === id).length}</span></header>{tasks.filter((task) => task.status === id).map((task) => <article className="task-card" key={task.id}><Badge tone={task.priority === "high" ? "danger" : "warning"}>{task.priority}</Badge><h3>{titleFor(task, tx)}</h3><p>{task.scope}</p><footer><span><CalendarClock size={15} />{task.dueDate}</span><select aria-label={tx("حالة المهمة", "Task status")} value={task.status} onChange={(event) => updateTaskStatus(task.id, event.target.value)}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></select></footer></article>)}</div>)}</section>
    <Modal title={tx("إنشاء مهمة", "Create task")} open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><div className="learning-form-grid"><FormField label={tx("العنوان بالإنجليزية", "English title")}><input name="title" required /></FormField><FormField label={tx("العنوان بالعربية", "Arabic title")}><input name="titleAr" required /></FormField><FormField label={tx("الغرفة أو النطاق", "Room or scope")}><input name="scope" required /></FormField><FormField label={tx("المسند إليه", "Assignee")}><input name="assignee" required /></FormField><FormField label={tx("تاريخ التسليم", "Due date")}><input name="dueDate" type="date" required /></FormField><FormField label={tx("الأولوية", "Priority")}><select name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="low">Low</option></select></FormField></div><div className="learning-form-actions"><Button type="submit">{tx("إنشاء", "Create")}</Button></div></form></Modal>
  </>;
}

export function MemberDashboard({ data, user }) {
  const { courses, announcements, meetings, tasks, bookings, assignments, quizzes } = useLearning();
  const { activeOrganization, activeMembership } = useOrganization();
  const tx = useBilingualText();
  const isCompany = activeOrganization?.type === "company";
  const activeTasks = tasks.filter((task) => task.status !== "done");
  const nextMeeting = meetings[0];
  const latestAnnouncement = announcements[0];
  const pendingBookings = bookings.filter((booking) => booking.email === user.email && booking.status === "pending_confirmation").length;
  const roleLabel = activeMembership?.role === "student" ? tx("طالب", "Student") : tx("موظف", "Employee");
  const primaryCourse = courses[0];

  return <>
    <section className="member-welcome-band">
      <div className="member-welcome-info">
        <div className="member-welcome-meta">
          <Badge tone="primary">{roleLabel} · {activeOrganization?.plan || "AIN Student"}</Badge>
          <span className="member-welcome-date">
            <Sparkles size={14} />
            {tx("رحلتك التعليمية مستمرة", "Your active learning journey")}
          </span>
        </div>
        <h1>{tx("مرحباً", "Welcome")}, {user.name} 👋</h1>
        <p>{isCompany ? tx("كل ما تحتاجه للعمل والتدريب والتواصل داخل شركتك في مكان واحد.", "Your work, training, and company updates in one focused workspace.") : tx("تابع كورساتك وحصصك المباشرة، سلّم واجباتك، واستعد للاختبارات القادمة بكل سهولة.", "Keep up with your courses, live sessions, assignments, and test preparation seamlessly.")}</p>
        <div
          className="member-quote-box"
          style={{
            margin: "12px 0 16px 0",
            padding: "10px 16px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.88rem",
            color: "rgba(255, 255, 255, 0.95)"
          }}
        >
          <Sparkles size={18} style={{ color: "#fef08a", flexShrink: 0 }} />
          <span>
            {tx(
              "💡 حكمة اليوم: «اصبر على مُرِّ الجَفَا مِن مُعَلِّمٍ.. فإنَّ رُسُوبَ العِلمِ في نَفَرَاتِهِ» — خطوتك التالية تقربك من التميز والشهادة المعتمدة 🌟",
              "💡 Daily Inspiration: \"Continuous learning is the minimum requirement for success in any field.\" — Every step brings you closer to certified excellence 🌟"
            )}
          </span>
        </div>
        <div className="member-quick-links">
          <Link to="/end-user/courses" className="quick-link-btn primary">
            <BookOpen size={16} />
            <span>{tx("كورساتي", "My courses")}</span>
          </Link>
          <Link to="/end-user/assignments" className="quick-link-btn">
            <FileText size={16} />
            <span>{tx("الواجبات", "Assignments")}</span>
          </Link>
          <Link to="/end-user/quizzes" className="quick-link-btn">
            <CheckCircle2 size={16} />
            <span>{tx("الاختبارات", "Quizzes")}</span>
          </Link>
          <Link to="/end-user/attendance" className="quick-link-btn">
            <Check size={16} />
            <span>{tx("الحضور", "Attendance")}</span>
          </Link>
        </div>
      </div>
      <div className="member-org-mark" style={{ background: activeOrganization?.color || "rgba(255,255,255,0.12)" }}>
        <Building2 size={26} />
        <span>{activeOrganization?.name || "AIN Academy"}</span>
      </div>
    </section>

    {primaryCourse && (
      <section className="member-continue-learning-card">
        <div className="continue-learning-badge">
          <Play size={14} />
          <span>{tx("استمر في التعلّم", "Continue Learning")}</span>
        </div>
        <div className="continue-learning-content">
          <div className="continue-learning-details">
            <h3>{titleFor(primaryCourse, tx)}</h3>
            <p>{primaryCourse.category} · {primaryCourse.instructor}</p>
            <div className="continue-learning-progress">
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: "68%" }} />
              </div>
              <span className="progress-label">68% {tx("مكتمل", "completed")}</span>
            </div>
          </div>
          <div className="continue-learning-action">
            <Button as={Link} to="/end-user/courses" variant="primary">
              <Play size={16} />
              {tx("متابعة الدرس", "Resume Lesson")}
            </Button>
          </div>
        </div>
      </section>
    )}

    <section className="member-stat-grid">
      <Link to="/end-user/courses" className="stat-card edu-card-blue">
        <div className="stat-icon-wrap"><GraduationCap size={22} /></div>
        <div className="stat-info">
          <span>{isCompany ? tx("برامج التدريب", "Training programs") : tx("الكورسات المسجلة", "Enrolled Courses")}</span>
          <strong>{courses.length}</strong>
        </div>
      </Link>
      <Link to="/end-user/assignments" className="stat-card edu-card-amber">
        <div className="stat-icon-wrap"><FileText size={22} /></div>
        <div className="stat-info">
          <span>{tx("الواجبات والتسليمات", "Assignments")}</span>
          <strong>{assignments?.length || 0}</strong>
        </div>
      </Link>
      <Link to="/end-user/quizzes" className="stat-card edu-card-emerald">
        <div className="stat-icon-wrap"><CheckCircle2 size={22} /></div>
        <div className="stat-info">
          <span>{tx("الاختبارات والتقييمات", "Quizzes & Tests")}</span>
          <strong>{quizzes?.length || 0}</strong>
        </div>
      </Link>
      <Link to="/end-user/meetings" className="stat-card edu-card-indigo">
        <div className="stat-icon-wrap"><Video size={22} /></div>
        <div className="stat-info">
          <span>{tx("حصص واجتماعات قادمة", "Upcoming Sessions")}</span>
          <strong>{meetings.length}</strong>
        </div>
      </Link>
      <Link to="/end-user/tasks" className="stat-card edu-card-teal">
        <div className="stat-icon-wrap"><ListTodo size={22} /></div>
        <div className="stat-info">
          <span>{tx("المهام المفتوحة", "Open Tasks")}</span>
          <strong>{activeTasks.length}</strong>
        </div>
      </Link>
      <Link to="/end-user/certificates" className="stat-card edu-card-purple">
        <div className="stat-icon-wrap"><Award size={22} /></div>
        <div className="stat-info">
          <span>{tx("الشهادات والإنجازات", "Certificates")}</span>
          <strong>{data.files?.length || 1}</strong>
        </div>
      </Link>
    </section>

    {/* STUDENT GAMIFICATION, XP & LEADERBOARD SHOWCASE */}
    <section
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        borderRadius: "18px",
        padding: "24px",
        color: "#fff",
        margin: "24px 0",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "24px",
        alignItems: "center",
        boxShadow: "0 8px 24px rgba(49, 46, 129, 0.15)"
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ background: "rgba(255,255,255,0.18)", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "bold" }}>
            🏆 {tx("المستوى الأكاديمي", "Academic Level")}
          </span>
          <span style={{ color: "#a5b4fc", fontSize: "12px" }}>
            {tx("الترتيب الحالي: #2 في دفعتك 🥈", "Current Rank: #2 in cohort 🥈")}
          </span>
        </div>

        <h3 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 10px 0", color: "#fff" }}>
          {tx("نقاط الخبرة والإنجازات (480 XP)", "Experience Points & Achievements (480 XP)")}
        </h3>

        {/* Level progress bar */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", color: "#c7d2fe" }}>
            <span>{tx("المستوى الفضي (Silver)", "Silver Tier")}</span>
            <span>480 / 600 XP ({tx("باقي 120 نقطة للذهبي", "120 XP to Gold")})</span>
          </div>
          <div style={{ width: "100%", height: "8px", borderRadius: "999px", background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
            <div style={{ width: "80%", height: "100%", background: "#fbbf24", borderRadius: "999px" }} />
          </div>
        </div>

        {/* Badges showcase */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            🌟 {tx("نجم الحضور", "Attendance Star")}
          </span>
          <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            🎯 {tx("العلامة الكاملة", "Quiz Master")}
          </span>
          <span style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            📝 {tx("بطل الواجبات", "Assignment Ace")}
          </span>
        </div>
      </div>

      {/* Cohort Leaderboard Preview */}
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "14px", padding: "16px", border: "1px solid rgba(255,255,255,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <strong style={{ fontSize: "14px", color: "#e0e7ff" }}>
            🥇 {tx("لوحة المتصدرين في دفعتك", "Cohort Leaderboard")}
          </strong>
          <small style={{ color: "#a5b4fc" }}>{tx("تحديث فوري", "Live")}</small>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "6px 8px", background: "rgba(255,255,255,0.06)", borderRadius: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong>1. 🥇</strong>
              <span>أحمد سامي</span>
            </span>
            <span style={{ fontWeight: "bold", color: "#fbbf24" }}>620 XP</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "6px 8px", background: "rgba(251, 191, 36, 0.2)", borderRadius: "8px", border: "1px solid #fbbf24" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong>2. 🥈</strong>
              <span>{user.name} ({tx("أنت", "You")})</span>
            </span>
            <span style={{ fontWeight: "bold", color: "#fbbf24" }}>480 XP</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "6px 8px", background: "rgba(255,255,255,0.06)", borderRadius: "8px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong>3. 🥉</strong>
              <span>مريم خالد</span>
            </span>
            <span style={{ fontWeight: "bold", color: "#fbbf24" }}>450 XP</span>
          </div>
        </div>
      </div>
    </section>

    <section className="member-dashboard-grid">
      <article className="member-focus-card">
        <header>
          <div>
            <small>{tx("التالي في جدولك", "Up next")}</small>
            <h2>{nextMeeting ? titleFor(nextMeeting, tx) : tx("لا توجد حصص قادمة اليوم", "No upcoming sessions today")}</h2>
          </div>
          <CalendarClock size={24} />
        </header>
        {nextMeeting ? (
          <>
            <p>{nextMeeting.roomName} · {nextMeeting.host}</p>
            <div className="member-event-time">
              <strong>{nextMeeting.date}</strong>
              <span>{nextMeeting.time} · {nextMeeting.duration} min</span>
            </div>
            <Button as="a" href="/end-user/meetings">
              <Video size={17} />{tx("دخول الحصة المباشرة", "Join live session")}
            </Button>
          </>
        ) : (
          <div className="empty-subtext">
            <p>{tx("جدولك محدث بالكامل، تابع محتوى الدروس أو راجع الواجبات المسندة إليك.", "Your schedule is all clear. Review recorded lessons or check pending assignments.")}</p>
            <Button as="a" href="/end-user/calendar" variant="ghost" style={{ marginTop: "auto" }}>
              {tx("عرض التقويم الأكاديمي", "View Academic Calendar")}
            </Button>
          </div>
        )}
      </article>

      <article className="member-list-card">
        <header>
          <h2>{tx("الواجبات والمهام المطلوبة", "Due assignments & tasks")}</h2>
          <a href="/end-user/assignments">{tx("عرض الكل", "View all")}</a>
        </header>
        {activeTasks.length > 0 ? (
          activeTasks.slice(0, 3).map((task) => (
            <a href="/end-user/tasks" key={task.id}>
              <span className={`member-priority ${task.priority}`} />
              <div>
                <strong>{titleFor(task, tx)}</strong>
                <small>{task.scope} · {task.dueDate}</small>
              </div>
              <Badge tone={task.status === "in_progress" ? "warning" : "neutral"}>{task.progress}%</Badge>
            </a>
          ))
        ) : (
          <p style={{ color: "var(--text-muted, #64748b)", margin: "16px 0", fontSize: "13px" }}>
            {tx("رائع! لا توجد مهام متأخرة حالياً.", "Great! You have no pending tasks right now.")}
          </p>
        )}
      </article>

      <article className="member-list-card announcements">
        <header>
          <h2>{tx("آخر إعلانات الأكاديمية", "Academy announcements")}</h2>
          <a href="/end-user/announcements">{tx("كل الإعلانات", "All announcements")}</a>
        </header>
        {latestAnnouncement ? (
          <div className="member-announcement">
            <div className="learning-card-icon"><Megaphone size={20} /></div>
            <div>
              <strong>{titleFor(latestAnnouncement, tx)}</strong>
              <p>{tx(latestAnnouncement.bodyAr, latestAnnouncement.body)}</p>
              <small>{latestAnnouncement.author} · {latestAnnouncement.publishedAt}</small>
            </div>
          </div>
        ) : (
          <p>{tx("لا توجد إعلانات جديدة.", "No new announcements.")}</p>
        )}
      </article>

      <article className="member-access-card">
        <CheckCircle2 size={25} />
        <div>
          <h2>{isCompany ? tx("وصول الشركة", "Company access") : tx("حالة القيد الأكاديمي", "Academic Enrollment Status")}</h2>
          <p>{pendingBookings ? tx(`لديك ${pendingBookings} طلب حجز قيد المراجعة لدى الإدارة.`, `${pendingBookings} enrollment request is currently under review.`) : tx("قيدك الأكاديمي نشط ولديك صلاحية كاملة للغرف والمواد.", "Your enrollment is fully active with complete access to rooms and course content.")}</p>
        </div>
      </article>
    </section>
  </>;
}

export function StudentCoursesPage() {
  const { courses, batches, bookings, createBooking } = useLearning();
  const { user } = useAuth();
  const { showToast } = useToast();
  const tx = useBilingualText();
  const book = (course) => { const batch = batches.find((item) => item.courseId === course.id && item.status === "open"); if (!batch) return showToast(tx("لا توجد دفعة متاحة حالياً", "No open batch is currently available"), "error"); const result = createBooking?.({ courseId: course.id, batchId: batch.id }); showToast(result?.duplicate ? tx("لديك طلب حجز بالفعل", "You already have a booking request") : tx("تم إرسال طلب الحجز للمراجعة", "Booking request sent for review"), result?.duplicate ? "info" : "success"); };
  return <><PageHead title={tx("برامجي وكورساتي", "My learning")} description={tx("استكشف البرامج المتاحة وتابع وصولك للغرف والمحتوى.", "Explore available programs and track room and content access.")} />
    <section className="learning-card-grid">{courses.filter((course) => course.status === "published").map((course) => { const booking = bookings.find((item) => item.courseId === course.id && (!user || item.email === user.email)); return <article className="learning-course-card student" key={course.id} style={{ "--course-color": course.color }}>{course.coverUrl ? <img className="learning-course-cover" src={course.coverUrl} alt="" loading="lazy" /> : <div className="learning-card-icon"><GraduationCap size={23} /></div>}<Badge tone={booking?.status === "confirmed" ? "success" : booking ? "warning" : "primary"}>{booking?.status === "confirmed" ? tx("مسجل", "Enrolled") : booking ? tx("قيد المراجعة", "Under review") : tx("متاح", "Available")}</Badge><h2>{titleFor(course, tx)}</h2><p>{course.category} · {course.instructor}</p><div className="learning-meta"><span><Users size={16} />{course.students}</span><span>{deliveryName(course.deliveryType, tx)}</span></div><footer><strong>{course.price ? `${course.price.toLocaleString()} EGP` : tx("ضمن مساحة العمل", "Included")}</strong>{!booking && <Button onClick={() => book(course)}>{tx("طلب الانضمام", "Request access")}</Button>}{booking?.status === "confirmed" && <Button as="a" href="/end-user/files"><CheckCircle2 size={17} />{tx("فتح الغرفة", "Open room")}</Button>}</footer></article>; })}</section>
  </>;
}
