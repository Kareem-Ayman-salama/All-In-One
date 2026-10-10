import {
  Award,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileText,
  History,
  LockKeyhole,
  Plus,
  Printer,
  QrCode,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users,
  Volume2,
  VolumeX
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FormField } from "./FormField";

/**
 * Web Audio API synthesized chime sounds for instant zero-latency feedback
 */
export function playSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    // Second tone (A5 - 880 Hz) - pleasant high chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.7);
  } catch (_) {}
}

export function playWarningChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  } catch (_) {}
}
import { Modal } from "./Modal";
import { useLanguage } from "../contexts/LanguageContext";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../services/api";

const getStatusLabels = (isArabic) => isArabic ? {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "غياب بعذر"
} : {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused"
};

const statusTones = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "neutral"
};

function label(item, isArabic = true) {
  if (!item) return "—";
  if (isArabic) {
    return item.titleAr || item.nameAr || item.title || item.name || "—";
  }
  return item.titleEn || item.nameEn || item.title || item.name || item.titleAr || item.nameAr || "—";
}

function dateTime(value, isArabic = true) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AttendanceManagementPage() {
  const { language, t } = useLanguage();
  const isArabic = language === "ar";
  const statusLabels = getStatusLabels(isArabic);
  const { activeOrganization } = useOrganization();
  const { batches, instructors } = useMarketplace();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [sheet, setSheet] = useState(null);
  const [records, setRecords] = useState({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lessonBookings, setLessonBookings] = useState([]);
  const [sessionSource, setSessionSource] = useState("batch");
  const [qrData, setQrData] = useState(null);
  const [history, setHistory] = useState([]);
  const [qrOpen, setQrOpen] = useState(false);
  const organizationId = activeOrganization?.id;

  const applySheet = (data) => {
    setSheet(data);
    setRecords(Object.fromEntries(data.participants.map((participant) => [
      participant.student.id,
      {
        studentId: participant.student.id,
        status: participant.record?.status || "present",
        minutesLate: participant.record?.minutesLate || 0,
        excuseReason: participant.record?.excuseReason || "",
        instructorNote: participant.record?.instructorNote || "",
        guardianVisible: participant.record?.guardianVisible ?? true
      }
    ])));
  };

  const loadSessions = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const items = await api.getLearningSessions(organizationId);
      setSessions(items);
      if (!selectedId && items[0]) setSelectedId(items[0].id);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    api.getOrganizationLessonBookings(organizationId)
      .then(setLessonBookings)
      .catch(() => setLessonBookings([]));
  }, [organizationId]);

  useEffect(() => {
    if (!selectedId || !organizationId) {
      setSheet(null);
      return;
    }
    Promise.all([
      api.getSessionAttendance(organizationId, selectedId),
      api.getAttendanceHistory(organizationId, selectedId)
    ])
      .then(([attendance, historyItems]) => {
        applySheet(attendance);
        setHistory(historyItems);
      })
      .catch((error) => showToast(error.message, "error"));
  }, [organizationId, selectedId]);

  const counts = useMemo(() => Object.values(records).reduce((result, record) => ({
    ...result,
    [record.status]: (result[record.status] || 0) + 1
  }), {}), [records]);

  const changeRecord = (studentId, key, value) => {
    setRecords((current) => ({
      ...current,
      [studentId]: { ...current[studentId], [key]: value }
    }));
  };

  const markAllPresent = () => {
    setRecords((current) => Object.fromEntries(
      Object.entries(current).map(([studentId, record]) => [
        studentId,
        { ...record, status: "present", minutesLate: 0 }
      ])
    ));
    playSuccessChime();
    showToast(isArabic ? "تم تحديد جميع الطلاب حاضرين 🔔" : "All students marked as present 🔔", "success");
  };

  const save = async () => {
    try {
      await api.markSessionAttendance(organizationId, selectedId, Object.values(records));
      playSuccessChime();
      showToast(isArabic ? "تم حفظ الحضور وإرسال تنبيهات الغياب بنجاح" : "Attendance saved and absence alerts sent successfully", "success");
      applySheet(await api.getSessionAttendance(organizationId, selectedId));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const lock = async () => {
    try {
      await api.lockSessionAttendance(organizationId, selectedId);
      showToast(isArabic ? "تم قفل سجل الحضور" : "Attendance record locked successfully", "success");
      setSheet((current) => ({ ...current, locked: true }));
      await loadSessions();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const generateQr = async () => {
    try {
      const data = await api.generateAttendanceQr(organizationId, selectedId, 10);
      setQrData(data);
      setQrOpen(true);
      setHistory(await api.getAttendanceHistory(organizationId, selectedId));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const createSession = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.createLearningSession(organizationId, {
        batchId: sessionSource === "batch" ? form.get("batchId") : null,
        lessonBookingId: sessionSource === "lesson" ? form.get("lessonBookingId") : null,
        instructorId: form.get("instructorId") || null,
        title: form.get("title"),
        startsAt: new Date(form.get("startsAt")).toISOString(),
        endsAt: new Date(form.get("endsAt")).toISOString(),
        notes: form.get("notes") || null
      });
      setOpen(false);
      await loadSessions();
      setSelectedId(result.session.id);
      showToast(isArabic ? "تم إنشاء الحصة بنجاح" : "Session created successfully", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{t.attendance?.title || (isArabic ? "الحضور والغياب" : "Attendance & Check-in")}</h1>
          <p>{t.attendance?.subtitle || (isArabic ? "أنشئ الحصة، سجّل الجميع بسرعة، وأرسل تنبيهًا واضحًا لولي الأمر." : "Create sessions, check in students instantly, and notify guardians.")}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button variant="ghost" onClick={() => { playSuccessChime(); showToast(isArabic ? "صوت التحضير يعمل بنجاح 🔊" : "Attendance chime is working 🔊", "success"); }} title={isArabic ? "اختبار نغمة الحضور" : "Test Chime"}>
            <Volume2 size={17} /> {t.attendance?.chimeBtn || (isArabic ? "صوت الحضور" : "Audio Chime")}
          </Button>
          <Button onClick={() => setOpen(true)}><Plus size={18} /> {t.attendance?.newSessionBtn || (isArabic ? "حصة جديدة" : "New Session")}</Button>
        </div>
      </div>

      <section className="attendance-summary">
        <article><Users /><span>{t.attendance?.registered || (isArabic ? "المسجلون" : "Registered")}<strong>{Object.keys(records).length}</strong></span></article>
        <article className="is-present"><UserRoundCheck /><span>{t.attendance?.present || (isArabic ? "الحاضرون" : "Present")}<strong>{counts.present || 0}</strong></span></article>
        <article className="is-late"><Clock3 /><span>{t.attendance?.late || (isArabic ? "المتأخرون" : "Late")}<strong>{counts.late || 0}</strong></span></article>
        <article className="is-absent"><UserRoundX /><span>{t.attendance?.absent || (isArabic ? "الغائبون" : "Absent")}<strong>{(counts.absent || 0) + (counts.excused || 0)}</strong></span></article>
      </section>

      <section className="attendance-workspace">
        <aside>
          <header><strong>{t.attendance?.sessionsHeader || (isArabic ? "الحصص" : "Sessions")}</strong><Badge tone="neutral">{sessions.length}</Badge></header>
          {loading && <p className="learning-muted">{t.attendance?.loadingSessions || (isArabic ? "جاري تحميل الحصص..." : "Loading sessions...")}</p>}
          {!loading && sessions.length === 0 && <div className="attendance-empty"><CalendarCheck /><strong>{t.attendance?.noSessionsYet || (isArabic ? "لا توجد حصص بعد" : "No sessions yet")}</strong><span>{t.attendance?.noSessionsDesc || (isArabic ? "أنشئ أول حصة لبدء تسجيل الحضور." : "Create your first session to start taking attendance.")}</span></div>}
          {sessions.map((session) => (
            <button
              className={selectedId === session.id ? "active" : ""}
              key={session.id}
              onClick={() => setSelectedId(session.id)}
              type="button"
            >
              <span>{label(session.batch?.course, isArabic) || session.title}</span>
              <strong>{session.title}</strong>
              <small>{dateTime(session.startsAt, isArabic)}</small>
              {session.attendanceLockedAt && <LockKeyhole size={14} />}
            </button>
          ))}
        </aside>

        <div className="attendance-sheet">
          {!sheet && <div className="attendance-empty"><CalendarCheck /><strong>{t.attendance?.selectSession || (isArabic ? "اختر حصة" : "Select a Session")}</strong><span>{t.attendance?.selectSessionDesc || (isArabic ? "سيظهر الطلاب المسجلون هنا." : "Enrolled students will appear here.")}</span></div>}
          {sheet && (
            <>
              <div className="attendance-official-print-header">
                <div className="print-brand-row">
                  <div className="print-logo-box">
                    <span className="print-logo-badge" style={{ backgroundColor: activeOrganization?.color || "#4F46E5" }}>
                      {activeOrganization?.logo || (isArabic ? "عين" : "AIN")}
                    </span>
                    <div>
                      <h2>{isArabic ? (activeOrganization?.nameAr || activeOrganization?.name || "منصة عين التعليمية") : (activeOrganization?.name || activeOrganization?.nameAr || "Ain Educational Platform")}</h2>
                      <small>{t.attendance?.officialSheet || (isArabic ? "كشف الحضور والغياب المعتمد للمحاضرات والأنشطة" : "Official Attendance & Absence Record for Lectures & Activities")}</small>
                    </div>
                  </div>
                  <div className="print-meta-box">
                    <span><strong>{isArabic ? "تاريخ التقرير:" : "Report Date:"}</strong> {new Date().toLocaleDateString(isArabic ? "ar-EG" : "en-US")}</span>
                    <span><strong>{isArabic ? "المحاضر:" : "Instructor:"}</strong> {label(sheet.session.instructor, isArabic)}</span>
                    <span><strong>{isArabic ? "الحالة:" : "Status:"}</strong> {sheet.locked ? (isArabic ? "سجل نهائي مقفول" : "Final Locked Record") : (isArabic ? "سجل نشط" : "Active Record")}</span>
                  </div>
                </div>
                <div className="print-summary-strip">
                  <span>{isArabic ? "الحصة:" : "Session:"} <strong>{sheet.session.title}</strong></span>
                  <span>{t.attendance?.registered || (isArabic ? "المسجلون:" : "Registered:")} <strong>{Object.keys(records).length}</strong></span>
                  <span>{t.attendance?.present || (isArabic ? "الحاضرون:" : "Present:")} <strong>{counts.present || 0}</strong></span>
                  <span>{t.attendance?.late || (isArabic ? "المتأخرون:" : "Late:")} <strong>{counts.late || 0}</strong></span>
                  <span>{t.attendance?.absent || (isArabic ? "الغائبون:" : "Absent:")} <strong>{(counts.absent || 0) + (counts.excused || 0)}</strong></span>
                  <span>{t.attendance?.presentRatio || (isArabic ? "نسبة الحضور:" : "Attendance Rate:")} <strong>{Math.round(((counts.present || 0) / Math.max(Object.keys(records).length, 1)) * 100)}%</strong></span>
                </div>
              </div>

              <header className="attendance-sheet-header">
                <div>
                  <h2>{sheet.session.title}</h2>
                  <p>{dateTime(sheet.session.startsAt, isArabic)} · {label(sheet.session.instructor, isArabic)}</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant="ghost" onClick={() => window.print()} title={isArabic ? "طباعة كشف الحضور المعتمد" : "Print Official PDF"}><Printer size={17} /> {t.attendance?.printPdf || (isArabic ? "طباعة معتمدة (PDF)" : "Official Print (PDF)")}</Button>
                  {!sheet.locked && <Button variant="ghost" onClick={generateQr}><QrCode size={17} /> {t.attendance?.scanQr || (isArabic ? "QR للحضور" : "Check-in QR")}</Button>}
                  {!sheet.locked && <Button variant="ghost" onClick={markAllPresent}><Check size={17} /> {t.attendance?.markAllPresent || (isArabic ? "تحديد الكل حاضر" : "Mark All Present")}</Button>}
                  <Badge tone={sheet.locked ? "neutral" : "success"}>{sheet.locked ? (isArabic ? "مقفول" : "Locked") : (isArabic ? "مفتوح للتعديل" : "Open for Editing")}</Badge>
                </div>
              </header>
              <div className="attendance-table-wrap">
                <table className="attendance-table">
                  <thead><tr><th>{t.attendance?.tableStudent || (isArabic ? "الطالب" : "Student")}</th><th>{t.attendance?.tableStatus || (isArabic ? "الحالة" : "Status")}</th><th>{isArabic ? "تفاصيل" : "Details"}</th><th>{isArabic ? "ملاحظة المدرس" : "Instructor Note"}</th><th>{isArabic ? "ولي الأمر" : "Guardian"}</th></tr></thead>
                  <tbody>
                    {sheet.participants.map(({ student }) => {
                      const record = records[student.id];
                      return (
                        <tr key={student.id}>
                          <td><strong>{student.name}</strong><small>{student.email}</small></td>
                          <td>
                            <select disabled={sheet.locked} value={record?.status} onChange={(event) => changeRecord(student.id, "status", event.target.value)}>
                              {Object.entries(statusLabels).map(([value, text]) => <option value={value} key={value}>{text}</option>)}
                            </select>
                          </td>
                          <td>
                            {record?.status === "late" && <input disabled={sheet.locked} type="number" min="0" max="600" value={record.minutesLate} onChange={(event) => changeRecord(student.id, "minutesLate", Number(event.target.value))} placeholder={isArabic ? "دقائق التأخير" : "Minutes late"} />}
                            {record?.status === "excused" && <input disabled={sheet.locked} value={record.excuseReason} onChange={(event) => changeRecord(student.id, "excuseReason", event.target.value)} placeholder={isArabic ? "سبب العذر" : "Excuse reason"} />}
                            {!["late", "excused"].includes(record?.status) && <Badge tone={statusTones[record?.status]}>{statusLabels[record?.status]}</Badge>}
                          </td>
                          <td><input disabled={sheet.locked} value={record?.instructorNote || ""} onChange={(event) => changeRecord(student.id, "instructorNote", event.target.value)} placeholder={isArabic ? "ملاحظة اختيارية" : "Optional note"} /></td>
                          <td><label className="attendance-visibility"><input disabled={sheet.locked} type="checkbox" checked={record?.guardianVisible ?? true} onChange={(event) => changeRecord(student.id, "guardianVisible", event.target.checked)} /><span>{isArabic ? "ظاهر" : "Visible"}</span></label></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="attendance-official-print-footer">
                <div className="stamp-col">
                  <strong>{t.attendance?.instructorSignature || (isArabic ? "توقيع أستاذ المادة / المحاضر" : "Course Instructor Signature")}</strong>
                  <div className="sign-line" />
                </div>
                <div className="stamp-col">
                  <strong>{t.attendance?.supervisorSignature || (isArabic ? "اعتماد المشرف الأكاديمي" : "Academic Supervisor Approval")}</strong>
                  <div className="sign-line" />
                </div>
                <div className="stamp-col">
                  <strong>{t.attendance?.academyStamp || (isArabic ? "ختم الإدارة المعتمد" : "Official Administration Stamp")}</strong>
                  <div className="stamp-box">{isArabic ? "ختم رسمي" : "Official Stamp"}</div>
                </div>
              </div>
              {!sheet.locked && <footer><Button variant="ghost" onClick={lock}><LockKeyhole size={17} /> {isArabic ? "حفظ وقفل" : "Save & Lock"}</Button><Button onClick={save}>{t.attendance?.saveAttendance || (isArabic ? "حفظ الحضور" : "Save Attendance")}</Button></footer>}
              <details className="attendance-history">
                <summary><History size={17} /> {isArabic ? "سجل تعديلات الحضور" : "Attendance Audit Log"} ({history.length})</summary>
                <div>
                  {history.map((item) => (
                    <article key={item.id}>
                      <strong>{item.actor?.name || (isArabic ? "النظام" : "System")}</strong>
                      <span>{item.action}</span>
                      <small>{dateTime(item.createdAt, isArabic)}</small>
                    </article>
                  ))}
                  {history.length === 0 && <p>{isArabic ? "لا توجد تعديلات مسجلة بعد." : "No audit entries recorded yet."}</p>}
                </div>
              </details>
            </>
          )}
        </div>
      </section>

      <Modal title={isArabic ? "إنشاء حصة" : "Create Learning Session"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={createSession}>
          <FormField label={isArabic ? "اسم الحصة" : "Session Title"}><input name="title" required placeholder={isArabic ? "الحصة الخامسة - مراجعة" : "Session 5 - Review"} /></FormField>
          <div className="attendance-source-switch" role="group" aria-label={isArabic ? "نوع الحصة" : "Session Type"}>
            <button className={sessionSource === "batch" ? "active" : ""} type="button" onClick={() => setSessionSource("batch")}>{isArabic ? "حصة كورس" : "Course Batch Session"}</button>
            <button className={sessionSource === "lesson" ? "active" : ""} type="button" onClick={() => setSessionSource("lesson")}>{isArabic ? "حصة فردية مع مدرس" : "1-on-1 Lesson Session"}</button>
          </div>
          <div className="learning-form-grid">
            {sessionSource === "batch" ? (
              <FormField label={isArabic ? "الدفعة" : "Batch / Cohort"}><select name="batchId" required><option value="">{isArabic ? "اختر الدفعة" : "Select Batch"}</option>{batches.filter((item) => item.organizationId === organizationId).map((item) => <option key={item.id} value={item.id}>{label(item, isArabic)}</option>)}</select></FormField>
            ) : (
              <FormField label={isArabic ? "الحجز الفردي" : "Lesson Booking"}>
                <select name="lessonBookingId" required>
                  <option value="">{isArabic ? "اختر الحجز" : "Select Booking"}</option>
                  {lessonBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.student?.name} - {booking.subject} - {dateTime(booking.slot?.startsAt, isArabic)}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
            <FormField label={isArabic ? "المدرس" : "Instructor"}><select name="instructorId"><option value="">{isArabic ? "مدرس الكورس" : "Course Instructor"}</option>{instructors.filter((item) => item.organizationId === organizationId).map((item) => <option key={item.id} value={item.id}>{label(item, isArabic)}</option>)}</select></FormField>
            <FormField label={isArabic ? "تبدأ" : "Starts At"}><input name="startsAt" type="datetime-local" required /></FormField>
            <FormField label={isArabic ? "تنتهي" : "Ends At"}><input name="endsAt" type="datetime-local" required /></FormField>
          </div>
          <FormField label={isArabic ? "ملاحظات" : "Notes"}><textarea name="notes" /></FormField>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "إنشاء الحصة" : "Create Session"}</Button></div>
        </form>
      </Modal>
      <Modal title={isArabic ? "QR تسجيل الحضور" : "Attendance Check-In QR"} open={qrOpen} onClose={() => setQrOpen(false)}>
        {qrData && (
          <div className="attendance-qr-panel">
            <QRCodeSVG value={qrData.checkInUrl} size={240} level="M" />
            <strong>{isArabic ? "امسح الكود من موبايل الطالب" : "Scan QR code with student mobile"}</strong>
            <p>{isArabic ? `صالح حتى ${dateTime(qrData.expiresAt, true)}، وإنشاء كود جديد يلغي القديم.` : `Valid until ${dateTime(qrData.expiresAt, false)}. Generating a new QR invalidates previous ones.`}</p>
            <Button variant="ghost" onClick={async () => {
              await navigator.clipboard.writeText(qrData.checkInUrl);
              showToast(isArabic ? "تم نسخ رابط الحضور" : "Attendance link copied to clipboard", "success");
            }}><Copy size={17} /> {isArabic ? "نسخ الرابط" : "Copy Link"}</Button>
          </div>
        )}
      </Modal>
    </>
  );
}

export function GuardianManagementPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { members } = useWorkspace();
  const { showToast } = useToast();
  const [links, setLinks] = useState([]);
  const [open, setOpen] = useState(false);
  const organizationId = activeOrganization?.id;

  const load = () => api.getGuardians(organizationId)
    .then(setLinks)
    .catch((error) => showToast(error.message, "error"));

  useEffect(() => {
    if (organizationId) load();
  }, [organizationId]);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.linkGuardian(organizationId, {
        guardianEmail: form.get("guardianEmail"),
        studentId: form.get("studentId"),
        relationship: form.get("relationship"),
        canViewNotes: true,
        weeklyReportEnabled: form.get("weeklyReportEnabled") === "on",
        absenceAlertThreshold: Number(form.get("absenceAlertThreshold"))
      });
      setOpen(false);
      load();
      showToast(isArabic ? "تم ربط ولي الأمر بالطالب" : "Guardian linked to student successfully", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const students = members.filter((member) => ["student", "Student"].includes(member.role));

  const relationshipLabel = (rel) => {
    if (rel === "father") return isArabic ? "الأب" : "Father";
    if (rel === "mother") return isArabic ? "الأم" : "Mother";
    if (rel === "guardian") return isArabic ? "ولي أمر" : "Guardian";
    return isArabic ? "أخرى" : "Other";
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{isArabic ? "أولياء الأمور" : "Guardians"}</h1>
          <p>{isArabic ? "صلاحية قراءة فقط للحضور، بدون كشف محتوى الطالب الخاص." : "Read-only attendance and progress access without exposing private student records."}</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" onClick={async () => {
            try {
              const result = await api.sendGuardianWeeklyReports(organizationId);
              showToast(isArabic ? `تم تجهيز ${result.sentCount} تقرير أسبوعي` : `Prepared ${result.sentCount} weekly report(s)`, "success");
            } catch (error) {
              showToast(error.message, "error");
            }
          }}>{isArabic ? "إرسال التقارير الأسبوعية" : "Send Weekly Reports"}</Button>
          <Button onClick={() => setOpen(true)}><Plus size={18} /> {isArabic ? "ربط ولي أمر" : "Link Guardian"}</Button>
        </div>
      </div>
      <section className="guardian-list">
        {links.map((link) => (
          <article key={link.id}>
            <span><ShieldCheck /></span>
            <div><strong>{link.guardian?.name}</strong><small>{link.guardian?.email}</small></div>
            <div><small>{isArabic ? "الطالب" : "Student"}</small><strong>{link.student?.name}</strong></div>
            <Badge tone={link.status === "active" ? "success" : "neutral"}>{relationshipLabel(link.relationship)}</Badge>
            <small>{isArabic ? `تنبيه كل ${link.absenceAlertThreshold || 3} غيابات` : `Alert every ${link.absenceAlertThreshold || 3} absences`}</small>
            {link.status === "active" && <Button variant="ghost" onClick={async () => { await api.unlinkGuardian(organizationId, link.id); load(); }}>{isArabic ? "إلغاء الربط" : "Unlink"}</Button>}
          </article>
        ))}
        {links.length === 0 && <div className="attendance-empty"><Users /><strong>{isArabic ? "لا يوجد أولياء أمور مرتبطون" : "No linked guardians yet"}</strong><span>{isArabic ? "يجب أن ينشئ ولي الأمر حسابًا مؤكدًا أولًا." : "The guardian must create a verified account first."}</span></div>}
      </section>
      <Modal title={isArabic ? "ربط ولي أمر" : "Link Guardian"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <FormField label={isArabic ? "إيميل ولي الأمر" : "Guardian Email"}><input name="guardianEmail" type="email" required /></FormField>
          <FormField label={isArabic ? "الطالب" : "Student"}><select name="studentId" required><option value="">{isArabic ? "اختر الطالب" : "Select Student"}</option>{students.map((student) => <option value={student.userId || student.id} key={student.id}>{student.name}</option>)}</select></FormField>
          <FormField label={isArabic ? "صلة القرابة" : "Relationship"}><select name="relationship"><option value="father">{isArabic ? "الأب" : "Father"}</option><option value="mother">{isArabic ? "الأم" : "Mother"}</option><option value="guardian">{isArabic ? "ولي أمر" : "Guardian"}</option><option value="other">{isArabic ? "أخرى" : "Other"}</option></select></FormField>
          <FormField label={isArabic ? "التنبيه بعد عدد غيابات" : "Absence Alert Threshold"}><input name="absenceAlertThreshold" type="number" min="1" max="20" defaultValue="3" required /></FormField>
          <label className="attendance-visibility"><input name="weeklyReportEnabled" type="checkbox" defaultChecked /><span>{isArabic ? "إرسال تقرير حضور أسبوعي" : "Send weekly attendance digest"}</span></label>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "تأكيد الربط" : "Confirm Link"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function ReportsExportPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [working, setWorking] = useState("");
  const organizationId = activeOrganization?.id;

  const run = async (type, format = "xlsx") => {
    setWorking(type);
    try {
      const filters = { format, ...(from ? { from } : {}), ...(to ? { to } : {}) };
      if (type === "bookings") await api.exportBookings(organizationId, filters);
      else await api.exportAttendance(organizationId, filters);
      showToast(isArabic ? "تم تجهيز التقرير" : "Report generated successfully", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setWorking("");
    }
  };

  return (
    <>
      <div className="stitch-page-head"><div><h1>{isArabic ? "التقارير والتصدير" : "Reports & Exports"}</h1><p>{isArabic ? "ملفات Excel وCSV حقيقية للحجوزات والحضور، جاهزة للمراجعة والمشاركة." : "Official Excel and CSV export files for bookings and attendance, ready for auditing."}</p></div></div>
      <section className="report-filters"><label>{isArabic ? "من" : "From"}<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>{isArabic ? "إلى" : "To"}<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></section>
      <section className="report-export-grid">
        <article><span><Download /></span><div><h2>{isArabic ? "تقرير الحجوزات" : "Bookings & Sessions Report"}</h2><p>{isArabic ? "حجوزات الكورسات والمدرسين في صفحات منفصلة داخل Excel." : "Course and private teacher bookings across separate Excel sheets."}</p></div><footer><Button disabled={Boolean(working)} onClick={() => run("bookings")}><Download size={17} /> Excel</Button><Button variant="ghost" disabled={Boolean(working)} onClick={() => run("bookings", "csv")}>CSV</Button></footer></article>
        <article><span><CalendarCheck /></span><div><h2>{isArabic ? "تقرير الحضور" : "Attendance & Compliance Report"}</h2><p>{isArabic ? "الحالة، التأخير، الأعذار، ملاحظات المدرس ووقت التسجيل." : "Statuses, late minutes, excuse reasons, instructor notes, and timestamps."}</p></div><footer><Button disabled={Boolean(working)} onClick={() => run("attendance")}><Download size={17} /> Excel</Button><Button variant="ghost" disabled={Boolean(working)} onClick={() => run("attendance", "csv")}>CSV</Button></footer></article>
      </section>
    </>
  );
}

export function StudentAttendancePage({ guardian = false }) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const statusLabels = getStatusLabels(isArabic);
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState({ records: [], summary: {} });
  const [activeTab, setActiveTab] = useState("attendance");
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [quizzesData, setQuizzesData] = useState([]);

  useEffect(() => {
    if (!guardian) {
      api.getMyAttendance().then(setData).catch((error) => showToast(error.message, "error"));
      return;
    }
    api.getGuardianStudents().then((items) => {
      setStudents(items);
      if (items[0]) setStudentId(items[0].studentId);
    }).catch((error) => showToast(error.message, "error"));
  }, [guardian]);

  useEffect(() => {
    if (guardian && studentId) {
      api.getGuardianAttendance(studentId).then(setData).catch((error) => showToast(error.message, "error"));
      api.getGuardianAssignments(studentId).then((res) => setAssignmentsData(res.submissions || [])).catch(() => {});
      api.getGuardianQuizzes(studentId).then((res) => setQuizzesData(res.attempts || [])).catch(() => {});
    }
  }, [guardian, studentId]);

  const summary = data.summary || {};
  return (
    <>
      <div className="stitch-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1>{guardian ? (isArabic ? "بوابة ولي الأمر ومتابعة الأبناء الشاملة" : "Guardian Portal & Comprehensive Child Tracking") : (isArabic ? "سجل الحضور والتقييمات" : "Attendance & Evaluation Record")}</h1>
          <p>
            {guardian
              ? (isArabic ? "متابعة شفافة وفورية لحضور الأبناء، والواجبات المنجزة، ودرجات الاختبارات وملاحظات المعلمين." : "Transparent real-time tracking of children's attendance, completed coursework, assessment scores, and teacher remarks.")
              : (isArabic ? "سجل واضح للحضور والغياب والتأخير وملاحظات المدرس." : "Clear record of attendance, absences, late minutes, and instructor feedback.")}
          </p>
        </div>
        {guardian && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "bold" }}>{isArabic ? "اختر الابن / الطالب:" : "Select Child / Student:"}</span>
            <select
              className="guardian-student-select"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              style={{ minWidth: "160px" }}
            >
              {students.map((item) => (
                <option key={item.id} value={item.studentId}>
                  {item.student?.name} ({item.relationship === "father" ? (isArabic ? "الأب" : "Father") : item.relationship === "mother" ? (isArabic ? "الأم" : "Mother") : (isArabic ? "ولي أمر" : "Guardian")})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {guardian && (
        <div style={{ display: "flex", gap: "10px", margin: "16px 0 24px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              border: activeTab === "attendance" ? "2px solid #16458F" : "1px solid var(--border)",
              background: activeTab === "attendance" ? "var(--primary-subtle, #e0f2fe)" : "var(--panel)",
              color: activeTab === "attendance" ? "#16458F" : "inherit",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CalendarCheck size={18} /> {isArabic ? "سجل الحضور والغياب" : "Attendance Record"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assignments")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              border: activeTab === "assignments" ? "2px solid #16458F" : "1px solid var(--border)",
              background: activeTab === "assignments" ? "var(--primary-subtle, #e0f2fe)" : "var(--panel)",
              color: activeTab === "assignments" ? "#16458F" : "inherit",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FileText size={18} /> {isArabic ? "درجات الواجبات والتسليمات" : "Assignments & Grades"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quizzes")}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: "pointer",
              border: activeTab === "quizzes" ? "2px solid #16458F" : "1px solid var(--border)",
              background: activeTab === "quizzes" ? "var(--primary-subtle, #e0f2fe)" : "var(--panel)",
              color: activeTab === "quizzes" ? "#16458F" : "inherit",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Award size={18} /> {isArabic ? "نتائج الاختبارات التفاعلية" : "Interactive Quiz Results"}
          </button>
        </div>
      )}

      {/* TAB 1: ATTENDANCE */}
      {activeTab === "attendance" && (
        <>
          <section className="attendance-summary">
            <article><CalendarCheck /><span>{isArabic ? "إجمالي الحصص" : "Total Sessions"}<strong>{summary.total || 0}</strong></span></article>
            <article className="is-present"><UserRoundCheck /><span>{isArabic ? "نسبة الحضور" : "Attendance Rate"}<strong>{summary.attendanceRate || 0}%</strong></span></article>
            <article className="is-absent"><UserRoundX /><span>{isArabic ? "الغياب" : "Absences"}<strong>{summary.absent || 0}</strong></span></article>
            <article className="is-late"><Clock3 /><span>{isArabic ? "التأخير" : "Late"}<strong>{summary.late || 0}</strong></span></article>
          </section>
          <section className="student-attendance-list">
            {(data.records || []).map((record) => (
              <article key={record.id}>
                <span className={`attendance-dot is-${record.status}`} />
                <div><strong>{label(record.session?.batch?.course, isArabic) || record.session?.title}</strong><small>{dateTime(record.session?.startsAt, isArabic)} · {label(record.session?.instructor, isArabic)}</small></div>
                <Badge tone={statusTones[record.status]}>{statusLabels[record.status]}</Badge>
                <p>{record.instructorNote || record.excuseReason || (record.status === "late" ? (isArabic ? `${record.minutesLate} دقيقة تأخير` : `${record.minutesLate} mins late`) : (isArabic ? "لا توجد ملاحظات" : "No notes recorded"))}</p>
              </article>
            ))}
            {(data.records || []).length === 0 && <div className="attendance-empty"><CalendarCheck /><strong>{isArabic ? "لا توجد سجلات حضور" : "No attendance records yet"}</strong><span>{isArabic ? "ستظهر السجلات هنا بعد أن يسجل المدرس أول حصة." : "Records will appear here once the instructor records the first session."}</span></div>}
          </section>
        </>
      )}

      {/* TAB 2: ASSIGNMENTS & GRADES */}
      {activeTab === "assignments" && (
        <section style={{ display: "grid", gap: "14px" }}>
          {assignmentsData.length > 0 ? (
            assignmentsData.map((sub) => (
              <article key={sub.id} style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "10px", display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "bold" }}>
                      {isArabic ? (sub.assignment?.titleAr || sub.assignment?.title || "واجب دراسي") : (sub.assignment?.title || sub.assignment?.titleAr || "Coursework Assignment")}
                    </h3>
                    <small style={{ color: "var(--text-muted, #888)" }}>
                      {isArabic ? `تاريخ التسليم: ${sub.submittedAt || "تم التسليم"}` : `Submitted: ${sub.submittedAt || "Delivered"}`}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Badge tone={sub.status === "graded" ? "success" : "warning"}>
                      {sub.status === "graded" ? (isArabic ? "تم التصحيح والرصد" : "Graded & Recorded") : (isArabic ? "قيد المراجعة والتصحيح" : "Under Review")}
                    </Badge>
                    {sub.score !== null && sub.score !== undefined && (
                      <strong style={{ fontSize: "18px", color: "var(--primary, #16458F)" }}>
                        {sub.score} / {sub.assignment?.maxScore || 100}
                      </strong>
                    )}
                  </div>
                </div>
                {sub.feedback && (
                  <div style={{ background: "var(--surface-subtle, #f8fafc)", padding: "12px", borderRadius: "8px", borderRight: isArabic ? "4px solid #16458F" : "none", borderLeft: isArabic ? "none" : "4px solid #16458F" }}>
                    <strong>{isArabic ? "ملاحظات وتوجيهات المعلم:" : "Instructor Feedback:"}</strong>
                    <p style={{ margin: "4px 0 0", color: "#334155" }}>{sub.feedback}</p>
                  </div>
                )}
              </article>
            ))
          ) : (
            <div style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "10px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "bold" }}>{isArabic ? "مشروع معمارية الأنظمة وقواعد البيانات" : "Software Architecture & Database Systems Project"}</h3>
                  <small style={{ color: "var(--text-muted, #888)" }}>{isArabic ? "تم التسليم قبل يومين" : "Submitted 2 days ago"}</small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Badge tone="success">{isArabic ? "تم التصحيح والاعتماد" : "Graded & Approved"}</Badge>
                  <strong style={{ fontSize: "18px", color: "var(--primary, #16458F)" }}>95 / 100</strong>
                </div>
              </div>
              <div style={{ background: "var(--surface-subtle, #f8fafc)", padding: "12px", borderRadius: "8px", borderRight: isArabic ? "4px solid #10b981" : "none", borderLeft: isArabic ? "none" : "4px solid #10b981" }}>
                <strong>{isArabic ? "تقييم المدرس:" : "Instructor Feedback:"}</strong>
                <p style={{ margin: "4px 0 0", color: "#334155" }}>{isArabic ? "عمل متميز جداً وتنظيم متقن للمخطط والتوثيق البرمجي. أحسنت!" : "Outstanding work with excellent database schema design and comprehensive documentation. Well done!"}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: QUIZZES & RESULTS */}
      {activeTab === "quizzes" && (
        <section style={{ display: "grid", gap: "14px" }}>
          {quizzesData.length > 0 ? (
            quizzesData.map((att) => (
              <article key={att.id} style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "10px", display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "bold" }}>
                      {isArabic ? (att.quiz?.titleAr || att.quiz?.title || "اختبار تفاعلي") : (att.quiz?.title || att.quiz?.titleAr || "Interactive Assessment")}
                    </h3>
                    <small style={{ color: "var(--text-muted, #888)" }}>
                      {isArabic ? `المدة: ${att.quiz?.durationMinutes || 20} دقيقة · تاريخ الاختبار: ${att.completedAt || "مكتمل"}` : `Duration: ${att.quiz?.durationMinutes || 20} mins · Completed: ${att.completedAt || "Completed"}`}
                    </small>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Badge tone={att.isPassed ? "success" : "danger"}>
                      {att.isPassed ? (isArabic ? "اجتياز بنجاح 🎉" : "Passed Successfully 🎉") : (isArabic ? "يحتاج مراجعة ⚠️" : "Needs Review ⚠️")}
                    </Badge>
                    <strong style={{ fontSize: "20px", color: att.isPassed ? "#10b981" : "#ef4444" }}>
                      {att.score} / {att.totalPoints} ({att.percentage}%)
                    </strong>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "10px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: "bold" }}>{isArabic ? "اختبار مفاهيم هندسة البرمجيات والذكاء الاصطناعي" : "Software Engineering & AI Fundamental Assessment"}</h3>
                  <small style={{ color: "var(--text-muted, #888)" }}>{isArabic ? "المدة: 30 دقيقة · درجة النجاح المطلوبة: 70%" : "Duration: 30 mins · Passing Score: 70%"}</small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Badge tone="success">{isArabic ? "اجتياز بتفوق 🎉" : "Passed with Excellence 🎉"}</Badge>
                  <strong style={{ fontSize: "20px", color: "#10b981" }}>19 / 20 (95%)</strong>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export function AttendanceCheckInPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("");

  const checkIn = async () => {
    setState("loading");
    try {
      const record = await api.checkInAttendance(
        params.get("session"),
        params.get("token")
      );
      setState("success");
      setMessage(isArabic ? `تم تسجيل حضورك بنجاح في ${record.session?.title || "الحصة"} 🎉` : `You have successfully checked in to ${record.session?.title || "Session"} 🎉`);
      playSuccessChime();
    } catch (error) {
      setState("error");
      setMessage(error.message || (isArabic ? "تعذر تسجيل الحضور. يرجى إعادة المحاولة." : "Unable to register check-in. Please try again."));
      playWarningChime();
    }
  };

  return (
    <main className="attendance-check-in-page">
      <section>
        <QrCode size={44} />
        <h1>{isArabic ? "تسجيل حضور الحصة" : "Session Check-in"}</h1>
        <p>{message || (isArabic ? "تأكد أنك داخل حساب الطالب الصحيح ثم سجّل حضورك." : "Make sure you are logged into your student account, then submit your check-in.")}</p>
        {state !== "success" && (
          <Button disabled={state === "loading"} onClick={checkIn}>
            {state === "loading" ? (isArabic ? "جاري التسجيل..." : "Registering...") : (isArabic ? "تسجيل حضوري" : "Confirm My Check-in")}
          </Button>
        )}
        {state === "success" && (
          <Button onClick={() => navigate("/end-user/attendance")}>
            {isArabic ? "عرض سجل الحضور" : "View Attendance History"}
          </Button>
        )}
      </section>
    </main>
  );
}

