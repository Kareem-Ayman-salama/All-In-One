import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  LockKeyhole,
  MapPin,
  Megaphone,
  Sparkles,
  User,
  Video
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useLearning } from "../contexts/LearningContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { StudentAssignmentsWorkspaceTab, StudentQuizzesWorkspaceTab } from "./AssignmentsQuizzesOperations";
import { RoomCommunityDiscussion } from "./RoomCommunityDiscussion";

function label(item, isArabic = true) {
  if (isArabic) {
    return item?.titleAr || item?.nameAr || item?.title || item?.name || "-";
  }
  return item?.title || item?.name || item?.titleAr || item?.nameAr || "-";
}

function bookingTone(status) {
  if (status === "confirmed") return "success";
  if (["rejected", "cancelled"].includes(status)) return "danger";
  return "warning";
}

export function StudentMarketplaceCourses({ user }) {
  const tx = useBilingualText();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const {
    bookings,
    enrollments,
    courses,
    batches,
    academies,
    subscriptions,
    notifications,
    cancelBooking
  } = useMarketplace();
  const userBookings = bookings.filter((item) => item.email === user.email);
  const active = enrollments.filter((item) => item.status === "active" && userBookings.some((booking) => booking.id === item.bookingId));
  const latestNotification = notifications.find((item) => item.email === user.email);

  const formatBookingStatus = (status) => {
    switch (status) {
      case "confirmed":
        return tx("مؤكد", "Confirmed");
      case "pending_confirmation":
        return tx("قيد التأكيد", "Pending Confirmation");
      case "rejected":
        return tx("مرفوض", "Rejected");
      case "cancelled":
        return tx("ملغي", "Cancelled");
      default:
        return status.replaceAll("_", " ");
    }
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("كورساتي وحجوزاتي", "My Courses & Bookings")}</h1>
          <p>{tx("تابع طلبات الحجز وافتح مساحات الكورسات التي تم تأكيدها.", "Track your booking requests and access confirmed course spaces.")}</p>
        </div>
        <Button as={Link} to="/courses">{tx("استكشف كورسات جديدة", "Explore new courses")}</Button>
      </div>

      {latestNotification && (
        <section className="student-marketplace-notice" aria-live="polite">
          <Megaphone />
          <div>
            <strong>{isArabic ? (latestNotification.titleAr || latestNotification.title) : (latestNotification.title || latestNotification.titleAr)}</strong>
            <p>{isArabic ? (latestNotification.bodyAr || latestNotification.body) : (latestNotification.body || latestNotification.bodyAr)}</p>
          </div>
        </section>
      )}

      <section className="student-learning-summary">
        <article><BookOpen /><span>{tx("طلبات الحجز", "Bookings")}</span><strong>{userBookings.length}</strong></article>
        <article><CheckCircle2 /><span>{tx("الكورسات النشطة", "Active Courses")}</span><strong>{active.length}</strong></article>
        <article><Clock3 /><span>{tx("قيد التأكيد", "Pending")}</span><strong>{userBookings.filter((item) => item.status === "pending_confirmation").length}</strong></article>
      </section>

      {userBookings.length === 0 ? (
        <section className="learning-empty-state">
          <BookOpen />
          <h2>{tx("لا توجد حجوزات بعد", "No bookings yet")}</h2>
          <p>{tx("استكشف الكورسات واختر الدفعة المناسبة لك.", "Explore courses and choose the batch that fits your schedule.")}</p>
          <Button as={Link} to="/courses">{tx("استكشف الكورسات", "Explore Courses")}</Button>
        </section>
      ) : (
        <section className="student-enrollment-grid">
          {userBookings.map((booking) => {
            const course = courses.find((item) => item.id === booking.courseId);
            const batch = batches.find((item) => item.id === booking.batchId);
            const academy = academies.find((item) => item.id === course?.academyId);
            const enrollment = enrollments.find((item) => item.bookingId === booking.id && item.status === "active");
            const subscription = subscriptions.find((item) => item.id === enrollment?.subscriptionId);
            return (
              <article key={booking.id}>
                <header>
                  <span style={{ background: academy?.color }}>{academy?.initials}</span>
                  <Badge tone={bookingTone(booking.status)}>{formatBookingStatus(booking.status)}</Badge>
                </header>
                <h2>{label(course, isArabic)}</h2>
                <p>{label(academy, isArabic)} · {label(batch, isArabic)}</p>
                <div>
                  <span><CalendarDays />{batch?.schedule || tx("قريباً", "Soon")}</span>
                  <span><Clock3 />{subscription ? `${tx("الوصول حتى", "Access until")} ${subscription.endDate}` : tx("بانتظار تأكيد الوصول", "Awaiting access confirmation")}</span>
                </div>
                <footer>
                  {enrollment ? (
                    <Button as={Link} to={`/end-user/course?enrollment=${enrollment.id}`}>{tx("فتح مساحة الكورس", "Open Course Space")}</Button>
                  ) : (
                    <span>{tx("ستظهر مساحة الكورس بعد تأكيد الأكاديمية.", "Course space will appear after academy confirmation.")}</span>
                  )}
                  {booking.status === "pending_confirmation" && (
                    <Button variant="ghost" onClick={() => cancelBooking(booking.id)}>{tx("إلغاء الطلب", "Cancel Request")}</Button>
                  )}
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}

export function StudentCourseWorkspace({ user }) {
  const [params] = useSearchParams();
  const tx = useBilingualText();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { enrollments, bookings, courses, batches, academies, instructors, subscriptions } = useMarketplace();
  const { files } = useWorkspace();
  const { announcements } = useLearning();
  const enrollment = enrollments.find((item) => item.id === params.get("enrollment"));
  const booking = bookings.find((item) => item.id === enrollment?.bookingId);
  const authorized = enrollment?.status === "active" && booking?.email === user.email;

  if (!authorized) {
    return (
      <div className="locked-module-state">
        <span><LockKeyhole /></span>
        <h1>{tx("لا يمكنك فتح مساحة الكورس", "Cannot open course space")}</h1>
        <p>{tx("يجب أن يكون التسجيل نشطاً والحجز تابعاً لحسابك.", "Your enrollment must be active and linked to your account.")}</p>
        <Button as={Link} to="/end-user/courses">{tx("العودة إلى كورساتي", "Back to my courses")}</Button>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState("overview");
  const course = courses.find((item) => item.id === enrollment.courseId);
  const batch = batches.find((item) => item.id === enrollment.batchId);
  const academy = academies.find((item) => item.id === course?.academyId);
  const instructor = instructors.find((item) => item.id === course?.instructorId);
  const subscription = subscriptions.find((item) => item.id === enrollment.subscriptionId);
  const materials = files.filter((item) => item.roomId === batch?.roomId);
  const courseAnnouncements = announcements.filter((item) => !item.roomId || item.roomId === batch?.roomId);
  const latestAnnouncement = courseAnnouncements[0];
  const schedule = Array.isArray(batch?.schedule)
    ? batch.schedule.map((item) => `${item.day} ${item.startTime}-${item.endTime}`).join(isArabic ? "، " : ", ")
    : batch?.schedule;

  return (
    <>
      <section className="student-course-hero">
        <div>
          <Badge tone="success">{tx("وصول نشط", "Active access")}</Badge>
          <h1>{label(course, isArabic)}</h1>
          <p>{label(academy, isArabic)} · {label(instructor, isArabic)}</p>
          <div>
            <span><CalendarDays />{schedule || tx("لم يحدد بعد", "Not scheduled yet")}</span>
            <span><Clock3 />{tx("الوصول حتى", "Access until")} {subscription?.endDate || enrollment.accessEndsAt || "—"}</span>
          </div>
        </div>
        <span style={{ background: academy?.color }}>{academy?.initials}</span>
      </section>

      <nav className="student-course-tabs" aria-label={tx("أقسام الكورس", "Course tabs")}>
        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          {tx("نظرة عامة", "Overview")}
        </button>
        <button
          type="button"
          className={activeTab === "materials" ? "active" : ""}
          onClick={() => setActiveTab("materials")}
        >
          {tx("المحتوى", "Materials")} ({materials.length})
        </button>
        <button
          type="button"
          className={activeTab === "announcements" ? "active" : ""}
          onClick={() => setActiveTab("announcements")}
        >
          {tx("الإعلانات", "Announcements")} ({courseAnnouncements.length})
        </button>
        <button
          type="button"
          className={activeTab === "schedule" ? "active" : ""}
          onClick={() => setActiveTab("schedule")}
        >
          {tx("الجدول والمواعيد", "Schedule")}
        </button>
        <button
          type="button"
          className={activeTab === "assignments" ? "active" : ""}
          onClick={() => setActiveTab("assignments")}
        >
          {tx("الواجبات والتسليمات", "Assignments")}
        </button>
        <button
          type="button"
          className={activeTab === "quizzes" ? "active" : ""}
          onClick={() => setActiveTab("quizzes")}
        >
          {tx("الاختبارات والتقييم", "Quizzes")}
        </button>
        <button
          type="button"
          className={activeTab === "discussions" ? "active" : ""}
          onClick={() => setActiveTab("discussions")}
        >
          {tx("مجتمع الغرفة والنقاشات", "Community")}
        </button>
      </nav>

      {activeTab === "overview" && (
        <section className="student-course-layout">
          <div>
            <article className="student-next-session">
              <header>
                <div>
                  <small>{tx("الحصة القادمة", "Next Session")}</small>
                  <h2>{label(batch, isArabic)}</h2>
                </div>
                <Video />
              </header>
              <p>{schedule || tx("لم يحدد بعد", "Not scheduled yet")} · {batch?.location || "Online"}</p>
              {batch?.meetingReference && (
                <Button as="a" href={batch.meetingReference} target="_blank" rel="noopener noreferrer">
                  <Video />{tx("فتح تفاصيل الحصة", "Join session")}
                </Button>
              )}
            </article>
            <article className="student-materials">
              <header>
                <h2>{tx("محتوى الكورس", "Course Content")}</h2>
                <Badge tone="primary">{materials.length} {tx("عناصر", "items")}</Badge>
              </header>
              {materials.slice(0, 5).map((item) => (
                <Button
                  as={Link}
                  to={`/end-user/files?fileId=${item.id}`}
                  variant="ghost"
                  className="student-material-tile"
                  key={item.id}
                  style={{ textAlign: isArabic ? "right" : "left", display: "flex", width: "100%", justifyContent: "flex-start", gap: "12px", padding: "10px", marginBottom: "8px" }}
                >
                  <span>{item.type === "video" || item.type === "youtube" ? <Video size={20} /> : <FileText size={20} />}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{item.name || item.title}</strong>
                    <br />
                    <small style={{ color: "var(--text-muted, #888)" }}>
                      {item.watermarkEnabled ? tx("محمي بعلامة مائية", "Watermark protected") : tx("متاح للمشاهدة", "Available for viewing")}
                    </small>
                  </div>
                </Button>
              ))}
              {materials.length > 5 && (
                <Button variant="ghost" onClick={() => setActiveTab("materials")} style={{ marginTop: "8px", width: "100%" }}>
                  {tx(`عرض جميع الملفات (${materials.length})`, `View all materials (${materials.length})`)}
                </Button>
              )}
              {!materials.length && <p className="learning-muted">{tx("لم تضف الأكاديمية محتوى لهذه الدفعة بعد.", "No content added for this batch yet.")}</p>}
            </article>
          </div>
          <aside>
            <Megaphone />
            <h2>{tx("آخر إعلان", "Latest Announcement")}</h2>
            {latestAnnouncement ? (
              <>
                <strong>{isArabic ? (latestAnnouncement.titleAr || latestAnnouncement.title) : (latestAnnouncement.title || latestAnnouncement.titleAr)}</strong>
                <p>{isArabic ? (latestAnnouncement.bodyAr || latestAnnouncement.body) : (latestAnnouncement.body || latestAnnouncement.bodyAr)}</p>
                <small>{latestAnnouncement.createdAt || latestAnnouncement.publishedAt || ""}</small>
                {courseAnnouncements.length > 1 && (
                  <Button variant="ghost" onClick={() => setActiveTab("announcements")} style={{ marginTop: "12px", padding: "4px 8px", fontSize: "12px" }}>
                    {tx(`كل الإعلانات (${courseAnnouncements.length})`, `All announcements (${courseAnnouncements.length})`)}
                  </Button>
                )}
              </>
            ) : (
              <p>{tx("لا توجد إعلانات جديدة.", "No new announcements.")}</p>
            )}
          </aside>
        </section>
      )}

      {activeTab === "materials" && (
        <section className="student-materials" style={{ padding: "24px" }}>
          <header style={{ marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>{tx("جميع ملفات ومحتوى الكورس", "All Course Materials & Resources")}</h2>
              <p style={{ color: "var(--text-muted, #888)", margin: 0, fontSize: "13px" }}>
                {tx("الملفات محمية ومخصصة لحسابك مع تشغيل العلامة المائية الآمنة.", "Protected materials linked to your account with dynamic security watermarking.")}
              </p>
            </div>
            <Badge tone="primary">{materials.length} {tx("ملف", "files")}</Badge>
          </header>

          {materials.length > 0 ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {materials.map((item) => (
                <article
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    background: "var(--panel-soft, rgba(255,255,255,0.03))",
                    border: "1px solid var(--border)",
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "8px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(22, 69, 143, 0.12)",
                      color: "var(--primary, #16458F)"
                    }}>
                      {item.type === "video" || item.type === "youtube" ? <Video size={22} /> : <FileText size={22} />}
                    </span>
                    <div>
                      <strong style={{ fontSize: "15px", display: "block" }}>{item.name || item.title}</strong>
                      <div style={{ display: "flex", gap: "10px", marginTop: "4px", fontSize: "12px", color: "var(--text-muted, #888)" }}>
                        <span>{item.type?.toUpperCase() || "FILE"}</span>
                        {item.size && <span>• {item.size}</span>}
                        {item.watermarkEnabled && (
                          <span style={{ color: "var(--success, #10b981)", display: "flex", alignItems: "center", gap: "3px" }}>
                            <Sparkles size={13} /> {tx("محمي بعلامة مائية", "Watermarked")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button as={Link} to={`/end-user/files?fileId=${item.id}`}>
                    <ExternalLink size={16} /> {tx("فتح المحتوى", "Open")}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <FileText size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3>{tx("لم تضف الأكاديمية محتوى لهذه الدفعة بعد", "No materials uploaded yet")}</h3>
              <p style={{ color: "var(--text-muted, #888)", fontSize: "14px" }}>
                {tx("سيتم إدراج المحاضرات والملفات والواجبات هنا بمجرد رفعها من المحاضر.", "Lecture notes, recorded sessions, and handouts will appear here when published.")}
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "announcements" && (
        <section className="student-announcements-tab" style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <header style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>{tx("إعلانات الكورس والدفعة", "Course Announcements")}</h2>
              <p style={{ color: "var(--text-muted, #888)", margin: 0, fontSize: "13px" }}>
                {tx("تنبيهات المدرس والأكاديمية بخصوص المواعيد والمستجدات.", "Official notices and schedule updates from instructor and academy.")}
              </p>
            </div>
            <Badge tone="primary">{courseAnnouncements.length} {tx("إعلان", "announcements")}</Badge>
          </header>

          {courseAnnouncements.length > 0 ? (
            <div style={{ display: "grid", gap: "14px" }}>
              {courseAnnouncements.map((item) => (
                <article
                  key={item.id}
                  style={{
                    padding: "18px",
                    background: item.pinned ? "rgba(22, 69, 143, 0.04)" : "var(--panel-soft, rgba(255,255,255,0.02))",
                    border: item.pinned ? "1px solid var(--primary, #16458F)" : "1px solid var(--border)",
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Megaphone size={18} style={{ color: "var(--primary, #16458F)" }} />
                      <strong style={{ fontSize: "16px" }}>
                        {isArabic ? (item.titleAr || item.title) : (item.title || item.titleAr)}
                      </strong>
                    </div>
                    {item.pinned && <Badge tone="primary">{tx("مثبت", "Pinned")}</Badge>}
                  </div>
                  <p style={{ lineHeight: "1.7", margin: "10px 0", color: "var(--text, #333)" }}>
                    {isArabic ? (item.bodyAr || item.body) : (item.body || item.bodyAr)}
                  </p>
                  <footer style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-muted, #888)", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                    {item.author && <span>{tx("الناشر:", "By:")} {item.author}</span>}
                    {(item.createdAt || item.publishedAt) && <span>{item.createdAt || item.publishedAt}</span>}
                  </footer>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <Megaphone size={40} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <h3>{tx("لا توجد إعلانات منشورة بعد", "No announcements yet")}</h3>
              <p style={{ color: "var(--text-muted, #888)", fontSize: "14px" }}>
                {tx("أي تحديث من إدارة الأكاديمية أو المحاضر سيظهر في هذه الصفحة فوراً.", "Any updates or notices from the instructor or academy will appear here.")}
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "schedule" && (
        <section className="student-schedule-tab" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "18px" }}>
          <div style={{ display: "grid", gap: "16px" }}>
            <article style={{ padding: "22px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarDays size={20} style={{ color: "var(--primary, #16458F)" }} />
                {tx("تفاصيل المواعيد والدفعة", "Batch Schedule & Details")}
              </h2>
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{tx("اسم الدفعة", "Batch Name")}</span>
                  <strong>{label(batch, isArabic)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{tx("المواعيد الأسبوعية", "Weekly Schedule")}</span>
                  <strong>{schedule || tx("لم يحدد بعد", "To be announced")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{tx("المكان / وسيلة الحضور", "Location / Mode")}</span>
                  <strong>{batch?.location || "Online (Zoom / Meet)"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{tx("تاريخ البدء", "Start Date")}</span>
                  <strong>{batch?.startDate || tx("قريباً", "Soon")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{tx("صلاحية الوصول للاشتراك", "Subscription Validity")}</span>
                  <strong>{subscription?.endDate || enrollment.accessEndsAt || tx("نشط", "Active")}</strong>
                </div>
              </div>

              {batch?.meetingReference && (
                <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
                  <Button as="a" href={batch.meetingReference} target="_blank" rel="noopener noreferrer">
                    <Video size={18} /> {tx("الانضمام للجلسة المباشرة", "Join Live Session")}
                  </Button>
                </div>
              )}
            </article>
          </div>

          <aside style={{ display: "grid", gap: "16px", alignContent: "start" }}>
            {instructor && (
              <article style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <small style={{ color: "var(--text-muted, #888)", display: "block", marginBottom: "8px" }}>{tx("المحاضر المسؤول", "Instructor")}</small>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(22, 69, 143, 0.1)", display: "grid", placeItems: "center", fontWeight: "bold" }}>
                    {instructor.initials || <User size={18} />}
                  </span>
                  <div>
                    <strong style={{ fontSize: "15px", display: "block" }}>{label(instructor, isArabic)}</strong>
                    <small style={{ color: "var(--text-muted, #888)" }}>{instructor.specialty}</small>
                  </div>
                </div>
                {instructor.bio && <p style={{ fontSize: "13px", color: "var(--text-muted, #888)", margin: 0 }}>{instructor.bio}</p>}
              </article>
            )}

            {academy && (
              <article style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <small style={{ color: "var(--text-muted, #888)", display: "block", marginBottom: "8px" }}>{tx("الأكاديمية المنظمة", "Organizing Academy")}</small>
                <strong style={{ fontSize: "15px", display: "block", marginBottom: "6px" }}>{label(academy, isArabic)}</strong>
                {academy.location && (
                  <p style={{ fontSize: "13px", color: "var(--text-muted, #888)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={15} /> {academy.location}
                  </p>
                )}
                {academy.slug && (
                  <Button as={Link} to={`/academies/${academy.slug}`} variant="ghost" style={{ marginTop: "12px", width: "100%", justifyContent: "center" }}>
                    {tx("صفحة الأكاديمية", "Academy Profile")}
                  </Button>
                )}
              </article>
            )}
          </aside>
        </section>
      )}

      {activeTab === "assignments" && (
        <section style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <header style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>{tx("الواجبات والتكليفات الدراسية", "Course Assignments")}</h2>
            <p style={{ color: "var(--text-muted, #888)", margin: 0, fontSize: "13px" }}>
              {tx("قم برفع حلك ومتابعة تقييم المدرس والدرجات.", "Submit your work and track instructor feedback and grades.")}
            </p>
          </header>
          <StudentAssignmentsWorkspaceTab roomId={batch?.roomId} courseId={course?.id} />
        </section>
      )}

      {activeTab === "quizzes" && (
        <section style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <header style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>{tx("الاختبارات والتقييمات التفاعلية", "Quizzes & Assessments")}</h2>
            <p style={{ color: "var(--text-muted, #888)", margin: 0, fontSize: "13px" }}>
              {tx("اختبارات تفاعلية بتصحيح فوري لحساب نتيجتك ونسبة استيعابك.", "Interactive quizzes with instant auto-grading.")}
            </p>
          </header>
          <StudentQuizzesWorkspaceTab roomId={batch?.roomId} courseId={course?.id} />
        </section>
      )}

      {activeTab === "discussions" && (
        <section style={{ padding: "24px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <RoomCommunityDiscussion roomId={batch?.roomId || "rm-default"} isInstructor={false} />
        </section>
      )}
    </>
  );
}
