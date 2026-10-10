import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LockKeyhole,
  Plus,
  Radio,
  Users,
  Video,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { apiService } from "../services/api";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";

const emptyForm = {
  title: "",
  titleAr: "",
  startsAt: "",
  endsAt: "",
  meetingProvider: "zoom",
  meetingLink: "",
  notes: ""
};

function meetingState(meeting, now) {
  const start = new Date(meeting.startsAt);
  const end = new Date(meeting.endsAt || meeting.startsAt);
  if (end < now || meeting.status === "completed") return "completed";
  if (start <= now && end >= now) return "live";
  return "upcoming";
}

/**
 * Renders live sessions as clear upcoming and completed workflows.
 */
export function LiveMeetingScheduler({ isInstructor = false, organizationId, batchId }) {
  const { direction, language } = useLanguage();
  const tx = useBilingualText();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const now = useMemo(() => new Date(), [meetings]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService.getUpcomingMeetings()
      .then((data) => {
        if (mounted) setMeetings(Array.isArray(data) ? data : data?.data || []);
      })
      .catch(() => {
        if (mounted) setMeetings([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const grouped = useMemo(() => ({
    active: meetings
      .filter((meeting) => meetingState(meeting, now) !== "completed")
      .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt)),
    completed: meetings
      .filter((meeting) => meetingState(meeting, now) === "completed")
      .sort((left, right) => new Date(right.startsAt) - new Date(left.startsAt))
  }), [meetings, now]);

  const submitMeeting = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await apiService.scheduleLiveMeeting({ ...form, batchId, organizationId });
      setMeetings((current) => [created, ...current]);
      setForm(emptyForm);
      setShowScheduleModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const locale = language === "ar" ? "ar-EG" : "en-US";
  const formatDate = (value) => new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(value));
  const formatTime = (value) => new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

  const renderCard = (meeting) => {
    const state = meetingState(meeting, now);
    const completed = state === "completed";
    const attended = ["attended", "present", "late", "excused"].includes(meeting.attendanceStatus) || meeting.attended === true;
    const absent = meeting.attendanceStatus === "absent" || meeting.attended === false;
    return (
      <article className={`meeting-card meeting-${state}`} key={meeting.id}>
        <header>
          <span className="meeting-provider"><Video size={20} />{meeting.meetingProvider === "google_meet" ? "Google Meet" : meeting.meetingProvider === "zoom" ? "Zoom" : tx("بث داخلي", "AIN Live")}</span>
          {state === "live" && <Badge tone="danger"><Radio size={13} /> {tx("مباشر الآن", "Live now")}</Badge>}
          {state === "upcoming" && <Badge tone="primary">{tx("قادمة", "Upcoming")}</Badge>}
          {completed && <Badge tone="neutral"><LockKeyhole size={13} /> {tx("انتهت", "Completed")}</Badge>}
        </header>
        <div className="meeting-card-body">
          <div>
            <small>{meeting.organizationName || meeting.academyName || tx("مساحة التعلم", "Learning workspace")}</small>
            <h3>{language === "ar" ? meeting.titleAr || meeting.title : meeting.title || meeting.titleAr}</h3>
            {meeting.notes && <p>{meeting.notes}</p>}
          </div>
          <dl>
            <div><dt><CalendarDays size={16} />{tx("اليوم", "Date")}</dt><dd>{formatDate(meeting.startsAt)}</dd></div>
            <div><dt><Clock3 size={16} />{tx("الوقت", "Time")}</dt><dd>{formatTime(meeting.startsAt)} – {formatTime(meeting.endsAt || meeting.startsAt)}</dd></div>
            {isInstructor && <div><dt><Users size={16} />{tx("الحضور", "Attendance")}</dt><dd>{meeting.attendanceCount ?? meeting.participants ?? 0} / {meeting.invitedCount ?? meeting.capacity ?? "—"}</dd></div>}
          </dl>
        </div>
        <footer>
          {!isInstructor && completed && (
            <span className={`attendance-result ${attended ? "attended" : absent ? "absent" : "pending"}`}>
              {attended ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
              {attended ? tx("تم تسجيل حضورك", "You attended") : absent ? tx("لم يتم تسجيل حضورك", "Marked absent") : tx("الحضور قيد المراجعة", "Attendance pending")}
            </span>
          )}
          {isInstructor && completed && <span className="attendance-result attended"><CheckCircle2 size={17} />{tx("تم قفل الجلسة والحضور", "Session and attendance locked")}</span>}
          {!completed ? (
            <Button as="a" href={meeting.meetingLink || "#"} target="_blank" rel="noreferrer" className={state === "live" ? "meeting-join-live" : ""}>
              <ExternalLink size={16} />{state === "live" ? tx("انضم الآن", "Join now") : tx("فتح رابط الجلسة", "Open session link")}
            </Button>
          ) : (
            <button className="meeting-locked-button" type="button" disabled><LockKeyhole size={16} />{tx("انتهى وقت الانضمام", "Join window closed")}</button>
          )}
        </footer>
      </article>
    );
  };

  return (
    <div className="meeting-workspace" dir={direction}>
      <div className="stitch-page-head meeting-page-head">
        <div><span className="page-eyebrow"><Video size={15} />{tx("الجلسات المباشرة", "Live sessions")}</span><h1>{tx("الاجتماعات والحضور", "Meetings & attendance")}</h1><p>{tx("مواعيد واضحة، حالة حضور مؤكدة، والجلسات المنتهية محفوظة كسجل بدون رابط دخول.", "Clear schedules, confirmed attendance, and a locked history of completed sessions.")}</p></div>
        {isInstructor && <Button onClick={() => setShowScheduleModal(true)}><Plus size={17} />{tx("جدولة جلسة", "Schedule session")}</Button>}
      </div>
      {loading ? <div className="operation-loading">{tx("جاري تحميل الاجتماعات...", "Loading meetings...")}</div> : (
        <>
          <section className="meeting-section"><header><div><h2>{tx("القادمة والمباشرة", "Upcoming & live")}</h2><p>{tx("يمكن الانضمام فقط خلال وقت الجلسة المتاح.", "Join access is available only within the session window.")}</p></div><strong>{grouped.active.length}</strong></header>{grouped.active.length ? <div className="meeting-grid">{grouped.active.map(renderCard)}</div> : <EmptyState title={tx("لا توجد جلسات قادمة", "No upcoming sessions")} message={tx("ستظهر الجلسات الجديدة هنا بمجرد جدولتها.", "New sessions will appear here once scheduled.")} />}</section>
          <section className="meeting-section completed-section"><header><div><h2>{tx("تمت وانتهت", "Completed")}</h2><p>{tx("سجل الجلسات السابقة وحالة حضورك.", "Previous sessions and attendance outcomes.")}</p></div><strong>{grouped.completed.length}</strong></header>{grouped.completed.length ? <div className="meeting-grid">{grouped.completed.map(renderCard)}</div> : <EmptyState title={tx("لا يوجد سجل سابق", "No meeting history")} message={tx("الجلسات المنتهية ستنتقل تلقائيًا إلى هذا القسم.", "Completed sessions move here automatically.")} />}</section>
        </>
      )}
      <Modal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} title={tx("جدولة جلسة مباشرة", "Schedule a live session")} footer={<><Button variant="ghost" type="button" onClick={() => setShowScheduleModal(false)}>{tx("إلغاء", "Cancel")}</Button><Button type="submit" form="meeting-schedule-form" disabled={submitting}>{submitting ? tx("جاري الحفظ...", "Scheduling...") : tx("حفظ الجلسة", "Schedule session")}</Button></>}>
        <form id="meeting-schedule-form" className="meeting-schedule-form" onSubmit={submitMeeting}>
          <label>{tx("عنوان الجلسة", "Session title")}<input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, titleAr: event.target.value }))} /></label>
          <div><label>{tx("تبدأ", "Starts")}<input required type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} /></label><label>{tx("تنتهي", "Ends")}<input required type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} /></label></div>
          <label>{tx("منصة الاجتماع", "Meeting provider")}<select value={form.meetingProvider} onChange={(event) => setForm((current) => ({ ...current, meetingProvider: event.target.value }))}><option value="zoom">Zoom</option><option value="google_meet">Google Meet</option><option value="custom">AIN Live / Custom</option></select></label>
          <label>{tx("الرابط (اختياري عند التوليد التلقائي)", "Link (optional when auto-generated)")}<input type="url" value={form.meetingLink} onChange={(event) => setForm((current) => ({ ...current, meetingLink: event.target.value }))} /></label>
          <label>{tx("تعليمات للطلاب", "Student instructions")}<textarea rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></label>
        </form>
      </Modal>
    </div>
  );
}
