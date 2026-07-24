import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Megaphone,
  Video
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useLearning } from "../contexts/LearningContext";
import { useWorkspace } from "../contexts/WorkspaceContext";

function label(item) {
  return item?.titleAr || item?.nameAr || item?.title || item?.name || "-";
}

function bookingTone(status) {
  if (status === "confirmed") return "success";
  if (["rejected", "cancelled"].includes(status)) return "danger";
  return "warning";
}

export function StudentMarketplaceCourses({ user }) {
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

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>كورساتي وحجوزاتي</h1>
          <p>تابع طلبات الحجز وافتح مساحات الكورسات التي تم تأكيدها.</p>
        </div>
        <Button as={Link} to="/courses">استكشف كورسات جديدة</Button>
      </div>

      {latestNotification && (
        <section className="student-marketplace-notice" aria-live="polite">
          <Megaphone />
          <div>
            <strong>{latestNotification.titleAr || latestNotification.title}</strong>
            <p>{latestNotification.bodyAr || latestNotification.body}</p>
          </div>
        </section>
      )}

      <section className="student-learning-summary">
        <article><BookOpen /><span>طلبات الحجز</span><strong>{userBookings.length}</strong></article>
        <article><CheckCircle2 /><span>الكورسات النشطة</span><strong>{active.length}</strong></article>
        <article><Clock3 /><span>قيد التأكيد</span><strong>{userBookings.filter((item) => item.status === "pending_confirmation").length}</strong></article>
      </section>

      {userBookings.length === 0 ? (
        <section className="learning-empty-state">
          <BookOpen />
          <h2>لا توجد حجوزات بعد</h2>
          <p>استكشف الكورسات واختر الدفعة المناسبة لك.</p>
          <Button as={Link} to="/courses">استكشف الكورسات</Button>
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
                  <Badge tone={bookingTone(booking.status)}>{booking.status.replaceAll("_", " ")}</Badge>
                </header>
                <h2>{label(course)}</h2>
                <p>{label(academy)} · {label(batch)}</p>
                <div>
                  <span><CalendarDays />{batch?.schedule}</span>
                  <span><Clock3 />{subscription ? `الوصول حتى ${subscription.endDate}` : "بانتظار تأكيد الوصول"}</span>
                </div>
                <footer>
                  {enrollment ? (
                    <Button as={Link} to={`/end-user/course?enrollment=${enrollment.id}`}>فتح مساحة الكورس</Button>
                  ) : (
                    <span>ستظهر مساحة الكورس بعد تأكيد الأكاديمية.</span>
                  )}
                  {booking.status === "pending_confirmation" && (
                    <Button variant="ghost" onClick={() => cancelBooking(booking.id)}>إلغاء الطلب</Button>
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
        <h1>لا يمكنك فتح مساحة الكورس</h1>
        <p>يجب أن يكون التسجيل نشطاً والحجز تابعاً لحسابك.</p>
        <Button as={Link} to="/end-user/courses">العودة إلى كورساتي</Button>
      </div>
    );
  }

  const course = courses.find((item) => item.id === enrollment.courseId);
  const batch = batches.find((item) => item.id === enrollment.batchId);
  const academy = academies.find((item) => item.id === course?.academyId);
  const instructor = instructors.find((item) => item.id === course?.instructorId);
  const subscription = subscriptions.find((item) => item.id === enrollment.subscriptionId);
  const materials = files.filter((item) => item.roomId === batch?.roomId);
  const latestAnnouncement = announcements.find((item) => !item.roomId || item.roomId === batch?.roomId);
  const schedule = Array.isArray(batch?.schedule)
    ? batch.schedule.map((item) => `${item.day} ${item.startTime}-${item.endTime}`).join("، ")
    : batch?.schedule;

  return (
    <>
      <section className="student-course-hero">
        <div>
          <Badge tone="success">وصول نشط</Badge>
          <h1>{label(course)}</h1>
          <p>{label(academy)} · {label(instructor)}</p>
          <div><span><CalendarDays />{schedule || "لم يحدد بعد"}</span><span><Clock3 />الوصول حتى {subscription?.endDate || enrollment.accessEndsAt}</span></div>
        </div>
        <span style={{ background: academy?.color }}>{academy?.initials}</span>
      </section>
      <nav className="student-course-tabs" aria-label="أقسام الكورس">
        <button className="active">نظرة عامة</button><button>المحتوى</button><button>الإعلانات</button><button>الجدول</button>
      </nav>
      <section className="student-course-layout">
        <div>
          <article className="student-next-session">
            <header><div><small>الحصة القادمة</small><h2>{label(batch)}</h2></div><Video /></header>
            <p>{schedule || "لم يحدد بعد"} · {batch?.location || "Online"}</p>
            {batch?.meetingReference && <Button as="a" href={batch.meetingReference}><Video />فتح تفاصيل الحصة</Button>}
          </article>
          <article className="student-materials">
            <header><h2>محتوى الكورس</h2><Badge tone="primary">{materials.length} عناصر</Badge></header>
            {materials.map((item) => (
              <button key={item.id}>
                <span>{item.type === "video" ? <Video /> : <FileText />}</span>
                <div><strong>{item.name || item.title}</strong><small>{item.watermarkEnabled ? "محمي بعلامة مائية" : "متاح للمشاهدة"}</small></div>
              </button>
            ))}
            {!materials.length && <p className="learning-muted">لم تضف الأكاديمية محتوى لهذه الدفعة بعد.</p>}
          </article>
        </div>
        <aside><Megaphone /><h2>آخر إعلان</h2>{latestAnnouncement ? <><strong>{latestAnnouncement.titleAr || latestAnnouncement.title}</strong><p>{latestAnnouncement.bodyAr || latestAnnouncement.body}</p><small>{latestAnnouncement.createdAt || ""}</small></> : <p>لا توجد إعلانات جديدة.</p>}</aside>
      </section>
    </>
  );
}
