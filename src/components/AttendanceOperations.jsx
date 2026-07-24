import {
  CalendarCheck,
  Check,
  Clock3,
  Copy,
  Download,
  History,
  LockKeyhole,
  Plus,
  QrCode,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  Users
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../services/api";

const statusLabels = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "غياب بعذر"
};

const statusTones = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "neutral"
};

function label(item) {
  return item?.titleAr || item?.nameAr || item?.title || item?.name || "—";
}

function dateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AttendanceManagementPage() {
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
  };

  const save = async () => {
    try {
      await api.markSessionAttendance(organizationId, selectedId, Object.values(records));
      showToast("تم حفظ الحضور وإرسال تنبيهات الغياب", "success");
      applySheet(await api.getSessionAttendance(organizationId, selectedId));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const lock = async () => {
    try {
      await api.lockSessionAttendance(organizationId, selectedId);
      showToast("تم قفل سجل الحضور", "success");
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
      showToast("تم إنشاء الحصة", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>الحضور والغياب</h1>
          <p>أنشئ الحصة، سجّل الجميع بسرعة، وأرسل تنبيهًا واضحًا لولي الأمر.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus size={18} /> حصة جديدة</Button>
      </div>

      <section className="attendance-summary">
        <article><Users /><span>المسجلون<strong>{Object.keys(records).length}</strong></span></article>
        <article className="is-present"><UserRoundCheck /><span>الحاضرون<strong>{counts.present || 0}</strong></span></article>
        <article className="is-late"><Clock3 /><span>المتأخرون<strong>{counts.late || 0}</strong></span></article>
        <article className="is-absent"><UserRoundX /><span>الغائبون<strong>{(counts.absent || 0) + (counts.excused || 0)}</strong></span></article>
      </section>

      <section className="attendance-workspace">
        <aside>
          <header><strong>الحصص</strong><Badge tone="neutral">{sessions.length}</Badge></header>
          {loading && <p className="learning-muted">جاري تحميل الحصص...</p>}
          {!loading && sessions.length === 0 && <div className="attendance-empty"><CalendarCheck /><strong>لا توجد حصص بعد</strong><span>أنشئ أول حصة لبدء تسجيل الحضور.</span></div>}
          {sessions.map((session) => (
            <button
              className={selectedId === session.id ? "active" : ""}
              key={session.id}
              onClick={() => setSelectedId(session.id)}
              type="button"
            >
              <span>{label(session.batch?.course) || session.title}</span>
              <strong>{session.title}</strong>
              <small>{dateTime(session.startsAt)}</small>
              {session.attendanceLockedAt && <LockKeyhole size={14} />}
            </button>
          ))}
        </aside>

        <div className="attendance-sheet">
          {!sheet && <div className="attendance-empty"><CalendarCheck /><strong>اختر حصة</strong><span>سيظهر الطلاب المسجلون هنا.</span></div>}
          {sheet && (
            <>
              <header>
                <div>
                  <h2>{sheet.session.title}</h2>
                  <p>{dateTime(sheet.session.startsAt)} · {label(sheet.session.instructor)}</p>
                </div>
                <div>
                  {!sheet.locked && <Button variant="ghost" onClick={generateQr}><QrCode size={17} /> QR للحضور</Button>}
                  {!sheet.locked && <Button variant="ghost" onClick={markAllPresent}><Check size={17} /> تحديد الكل حاضر</Button>}
                  <Badge tone={sheet.locked ? "neutral" : "success"}>{sheet.locked ? "مقفول" : "مفتوح للتعديل"}</Badge>
                </div>
              </header>
              <div className="attendance-table-wrap">
                <table className="attendance-table">
                  <thead><tr><th>الطالب</th><th>الحالة</th><th>تفاصيل</th><th>ملاحظة المدرس</th><th>ولي الأمر</th></tr></thead>
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
                            {record?.status === "late" && <input disabled={sheet.locked} type="number" min="0" max="600" value={record.minutesLate} onChange={(event) => changeRecord(student.id, "minutesLate", Number(event.target.value))} placeholder="دقائق التأخير" />}
                            {record?.status === "excused" && <input disabled={sheet.locked} value={record.excuseReason} onChange={(event) => changeRecord(student.id, "excuseReason", event.target.value)} placeholder="سبب العذر" />}
                            {!["late", "excused"].includes(record?.status) && <Badge tone={statusTones[record?.status]}>{statusLabels[record?.status]}</Badge>}
                          </td>
                          <td><input disabled={sheet.locked} value={record?.instructorNote || ""} onChange={(event) => changeRecord(student.id, "instructorNote", event.target.value)} placeholder="ملاحظة اختيارية" /></td>
                          <td><label className="attendance-visibility"><input disabled={sheet.locked} type="checkbox" checked={record?.guardianVisible ?? true} onChange={(event) => changeRecord(student.id, "guardianVisible", event.target.checked)} /><span>ظاهر</span></label></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!sheet.locked && <footer><Button variant="ghost" onClick={lock}><LockKeyhole size={17} /> حفظ وقفل</Button><Button onClick={save}>حفظ الحضور</Button></footer>}
              <details className="attendance-history">
                <summary><History size={17} /> سجل تعديلات الحضور ({history.length})</summary>
                <div>
                  {history.map((item) => (
                    <article key={item.id}>
                      <strong>{item.actor?.name || "النظام"}</strong>
                      <span>{item.action}</span>
                      <small>{dateTime(item.createdAt)}</small>
                    </article>
                  ))}
                  {history.length === 0 && <p>لا توجد تعديلات مسجلة بعد.</p>}
                </div>
              </details>
            </>
          )}
        </div>
      </section>

      <Modal title="إنشاء حصة" open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={createSession}>
          <FormField label="اسم الحصة"><input name="title" required placeholder="الحصة الخامسة - مراجعة" /></FormField>
          <div className="attendance-source-switch" role="group" aria-label="نوع الحصة">
            <button className={sessionSource === "batch" ? "active" : ""} type="button" onClick={() => setSessionSource("batch")}>حصة كورس</button>
            <button className={sessionSource === "lesson" ? "active" : ""} type="button" onClick={() => setSessionSource("lesson")}>حصة فردية مع مدرس</button>
          </div>
          <div className="learning-form-grid">
            {sessionSource === "batch" ? (
              <FormField label="الدفعة"><select name="batchId" required><option value="">اختر الدفعة</option>{batches.filter((item) => item.organizationId === organizationId).map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></FormField>
            ) : (
              <FormField label="الحجز الفردي">
                <select name="lessonBookingId" required>
                  <option value="">اختر الحجز</option>
                  {lessonBookings.map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.student?.name} - {booking.subject} - {dateTime(booking.slot?.startsAt)}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
            <FormField label="المدرس"><select name="instructorId"><option value="">مدرس الكورس</option>{instructors.filter((item) => item.organizationId === organizationId).map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</select></FormField>
            <FormField label="تبدأ"><input name="startsAt" type="datetime-local" required /></FormField>
            <FormField label="تنتهي"><input name="endsAt" type="datetime-local" required /></FormField>
          </div>
          <FormField label="ملاحظات"><textarea name="notes" /></FormField>
          <div className="learning-form-actions"><Button type="submit">إنشاء الحصة</Button></div>
        </form>
      </Modal>
      <Modal title="QR تسجيل الحضور" open={qrOpen} onClose={() => setQrOpen(false)}>
        {qrData && (
          <div className="attendance-qr-panel">
            <QRCodeSVG value={qrData.checkInUrl} size={240} level="M" />
            <strong>امسح الكود من موبايل الطالب</strong>
            <p>صالح حتى {dateTime(qrData.expiresAt)}، وإنشاء كود جديد يلغي القديم.</p>
            <Button variant="ghost" onClick={async () => {
              await navigator.clipboard.writeText(qrData.checkInUrl);
              showToast("تم نسخ رابط الحضور", "success");
            }}><Copy size={17} /> نسخ الرابط</Button>
          </div>
        )}
      </Modal>
    </>
  );
}

export function GuardianManagementPage() {
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
      showToast("تم ربط ولي الأمر بالطالب", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const students = members.filter((member) => ["student", "Student"].includes(member.role));

  return (
    <>
      <div className="stitch-page-head">
        <div><h1>أولياء الأمور</h1><p>صلاحية قراءة فقط للحضور، بدون كشف محتوى الطالب الخاص.</p></div>
        <div className="page-actions">
          <Button variant="ghost" onClick={async () => {
            try {
              const result = await api.sendGuardianWeeklyReports(organizationId);
              showToast(`تم تجهيز ${result.sentCount} تقرير أسبوعي`, "success");
            } catch (error) {
              showToast(error.message, "error");
            }
          }}>إرسال التقارير الأسبوعية</Button>
          <Button onClick={() => setOpen(true)}><Plus size={18} /> ربط ولي أمر</Button>
        </div>
      </div>
      <section className="guardian-list">
        {links.map((link) => (
          <article key={link.id}>
            <span><ShieldCheck /></span>
            <div><strong>{link.guardian?.name}</strong><small>{link.guardian?.email}</small></div>
            <div><small>الطالب</small><strong>{link.student?.name}</strong></div>
            <Badge tone={link.status === "active" ? "success" : "neutral"}>{link.relationship}</Badge>
            <small>تنبيه كل {link.absenceAlertThreshold || 3} غيابات</small>
            {link.status === "active" && <Button variant="ghost" onClick={async () => { await api.unlinkGuardian(organizationId, link.id); load(); }}>إلغاء الربط</Button>}
          </article>
        ))}
        {links.length === 0 && <div className="attendance-empty"><Users /><strong>لا يوجد أولياء أمور مرتبطون</strong><span>يجب أن ينشئ ولي الأمر حسابًا مؤكدًا أولًا.</span></div>}
      </section>
      <Modal title="ربط ولي أمر" open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <FormField label="إيميل ولي الأمر"><input name="guardianEmail" type="email" required /></FormField>
          <FormField label="الطالب"><select name="studentId" required><option value="">اختر الطالب</option>{students.map((student) => <option value={student.userId || student.id} key={student.id}>{student.name}</option>)}</select></FormField>
          <FormField label="صلة القرابة"><select name="relationship"><option value="father">الأب</option><option value="mother">الأم</option><option value="guardian">ولي أمر</option><option value="other">أخرى</option></select></FormField>
          <FormField label="التنبيه بعد عدد غيابات"><input name="absenceAlertThreshold" type="number" min="1" max="20" defaultValue="3" required /></FormField>
          <label className="attendance-visibility"><input name="weeklyReportEnabled" type="checkbox" defaultChecked /><span>إرسال تقرير حضور أسبوعي</span></label>
          <div className="learning-form-actions"><Button type="submit">تأكيد الربط</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function ReportsExportPage() {
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
      showToast("تم تجهيز التقرير", "success");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setWorking("");
    }
  };

  return (
    <>
      <div className="stitch-page-head"><div><h1>التقارير والتصدير</h1><p>ملفات Excel وCSV حقيقية للحجوزات والحضور، جاهزة للمراجعة والمشاركة.</p></div></div>
      <section className="report-filters"><label>من<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>إلى<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></section>
      <section className="report-export-grid">
        <article><span><Download /></span><div><h2>تقرير الحجوزات</h2><p>حجوزات الكورسات والمدرسين في صفحات منفصلة داخل Excel.</p></div><footer><Button disabled={Boolean(working)} onClick={() => run("bookings")}><Download size={17} /> Excel</Button><Button variant="ghost" disabled={Boolean(working)} onClick={() => run("bookings", "csv")}>CSV</Button></footer></article>
        <article><span><CalendarCheck /></span><div><h2>تقرير الحضور</h2><p>الحالة، التأخير، الأعذار، ملاحظات المدرس ووقت التسجيل.</p></div><footer><Button disabled={Boolean(working)} onClick={() => run("attendance")}><Download size={17} /> Excel</Button><Button variant="ghost" disabled={Boolean(working)} onClick={() => run("attendance", "csv")}>CSV</Button></footer></article>
      </section>
    </>
  );
}

export function StudentAttendancePage({ guardian = false }) {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState({ records: [], summary: {} });

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
    }
  }, [guardian, studentId]);

  const summary = data.summary || {};
  return (
    <>
      <div className="stitch-page-head">
        <div><h1>{guardian ? "متابعة حضور الأبناء" : "سجل حضوري"}</h1><p>سجل واضح للحضور والغياب والتأخير وملاحظات المدرس.</p></div>
        {guardian && <select className="guardian-student-select" value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((item) => <option key={item.id} value={item.studentId}>{item.student?.name}</option>)}</select>}
      </div>
      <section className="attendance-summary">
        <article><CalendarCheck /><span>إجمالي الحصص<strong>{summary.total || 0}</strong></span></article>
        <article className="is-present"><UserRoundCheck /><span>نسبة الحضور<strong>{summary.attendanceRate || 0}%</strong></span></article>
        <article className="is-absent"><UserRoundX /><span>الغياب<strong>{summary.absent || 0}</strong></span></article>
        <article className="is-late"><Clock3 /><span>التأخير<strong>{summary.late || 0}</strong></span></article>
      </section>
      <section className="student-attendance-list">
        {(data.records || []).map((record) => (
          <article key={record.id}>
            <span className={`attendance-dot is-${record.status}`} />
            <div><strong>{label(record.session?.batch?.course) || record.session?.title}</strong><small>{dateTime(record.session?.startsAt)} · {label(record.session?.instructor)}</small></div>
            <Badge tone={statusTones[record.status]}>{statusLabels[record.status]}</Badge>
            <p>{record.instructorNote || record.excuseReason || (record.status === "late" ? `${record.minutesLate} دقيقة تأخير` : "لا توجد ملاحظات")}</p>
          </article>
        ))}
        {(data.records || []).length === 0 && <div className="attendance-empty"><CalendarCheck /><strong>لا توجد سجلات حضور</strong><span>ستظهر السجلات هنا بعد أن يسجل المدرس أول حصة.</span></div>}
      </section>
    </>
  );
}

export function AttendanceCheckInPage() {
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
      setMessage(`تم تسجيل حضورك في ${record.session?.title || "الحصة"}`);
    } catch (error) {
      setState("error");
      setMessage(error.message);
    }
  };

  return (
    <main className="attendance-check-in-page">
      <section>
        <QrCode size={44} />
        <h1>تسجيل حضور الحصة</h1>
        <p>{message || "تأكد أنك داخل حساب الطالب الصحيح ثم سجّل حضورك."}</p>
        {state !== "success" && (
          <Button disabled={state === "loading"} onClick={checkIn}>
            {state === "loading" ? "جاري التسجيل..." : "تسجيل حضوري"}
          </Button>
        )}
        {state === "success" && (
          <Button onClick={() => navigate("/end-user/attendance")}>
            عرض سجل الحضور
          </Button>
        )}
      </section>
    </main>
  );
}
