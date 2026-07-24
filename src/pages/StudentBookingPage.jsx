import {
  BookOpen, CalendarCheck2, CalendarDays, CheckCircle2, Clock3,
  GraduationCap, MapPin, Search, Star, Users, Video
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { useBilingualText } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";

function initials(name) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("");
}

function getSubject(subjects, subjectId) {
  return subjects.find((subject) => subject.id === subjectId) || { id: subjectId, name: subjectId, nameAr: subjectId };
}

export function StudentBookingPage({ user }) {
  const tx = useBilingualText();
  const [teachers, setTeachers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const { showToast } = useToast();
  const [tab, setTab] = useState("explore");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [level, setLevel] = useState("all");
  const [format, setFormat] = useState("all");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [bookingForm, setBookingForm] = useState({ subjectId: "", slotId: "", format: "online" });
  const subjects = useMemo(() => [...new Set(teachers.flatMap((teacher) => teacher.subjects))].map((id) => ({
    id,
    name: id.replaceAll("-", " "),
    nameAr: id.replaceAll("-", " ")
  })), [teachers]);

  useEffect(() => {
    let active = true;
    Promise.all([api.getPublicInstructors(), api.getLessonBookings()])
      .then(([instructorItems, bookingItems]) => {
        if (active) {
          setTeachers(instructorItems);
          setBookings(bookingItems);
        }
      });
    return () => { active = false; };
  }, []);

  const visibleTeachers = useMemo(() => teachers.filter((teacher) => {
    const searchable = `${teacher.name} ${teacher.nameAr} ${teacher.title} ${teacher.titleAr}`.toLowerCase();
    return (!query || searchable.includes(query.toLowerCase()))
      && (subject === "all" || teacher.subjects.includes(subject))
      && (level === "all" || teacher.levels.includes(level))
      && (format === "all" || teacher.formats.includes(format));
  }), [format, level, query, subject]);

  const openBooking = (teacher) => {
    setSelectedTeacher(teacher);
    setBookingForm({
      subjectId: teacher.subjects[0],
      slotId: "",
      format: teacher.formats[0]
    });
  };

  const isBooked = (teacherId, slot) => bookings.some((booking) => (
    booking.teacherId === teacherId
    && booking.date === slot.date
    && booking.time === slot.time
    && booking.status !== "cancelled"
  ));

  const confirmBooking = async () => {
    const slot = selectedTeacher?.slots.find((item) => item.id === bookingForm.slotId);
    const selectedSubject = getSubject(subjects, bookingForm.subjectId);
    if (!slot) {
      showToast(tx("اختر موعدًا متاحًا أولاً", "Choose an available time first"), "danger");
      return;
    }
    try {
      await api.reserveLesson({
        slotId: slot.id,
        subject: selectedSubject.name,
        note: null
      });
      setBookings(await api.getLessonBookings());
    } catch {
      showToast(tx("هذا الموعد لم يعد متاحًا، اختر موعدًا آخر", "This time is no longer available. Choose another one."), "danger");
      return;
    }
    showToast(tx("تم تأكيد الحجز وإضافته إلى تقويمك", "Booking confirmed and added to your calendar"));
    setSelectedTeacher(null);
    setTab("mine");
  };

  const cancelBooking = async (booking) => {
    if (!window.confirm(tx("هل تريد إلغاء هذا الحجز؟", "Cancel this lesson booking?"))) return;
    try {
      await api.cancelLesson(booking.id);
      setBookings(await api.getLessonBookings());
      showToast(tx("تم إلغاء الحجز", "Booking cancelled"));
    } catch (error) {
      showToast(error.message, "danger");
    }
  };

  return (
    <>
      <div className="stitch-page-head booking-page-head">
        <div>
          <h1>{tx("احجز مع مدرس", "Book a teacher")}</h1>
          <p>{tx("اختر المادة والمدرس والموعد المناسب لك في خطوات واضحة.", "Choose your subject, teacher, and preferred time in a few clear steps.")}</p>
        </div>
        <Button as="a" href="/end-user/calendar" variant="ghost"><CalendarDays size={18} /> {tx("عرض التقويم", "View calendar")}</Button>
      </div>

      <section className="booking-hero">
        <div className="booking-hero-icon"><GraduationCap size={28} /></div>
        <div><span>{tx("تعلم بالطريقة المناسبة لك", "Learn your way")}</span><h2>{tx("مدرسون موثوقون ومواعيد مرنة", "Trusted teachers, flexible schedules")}</h2></div>
        <dl>
          <div><dt>{teachers.length}</dt><dd>{tx("مدرسين موثقين", "verified teachers")}</dd></div>
          <div><dt>{subjects.length}</dt><dd>{tx("مواد متاحة", "subjects available")}</dd></div>
          <div><dt>{teachers.reduce((total, teacher) => total + teacher.slots.length, 0)}</dt><dd>{tx("مواعيد متاحة", "available slots")}</dd></div>
        </dl>
      </section>

      <div className="booking-tabs" role="tablist" aria-label={tx("صفحات الحجز", "Booking views")}>
        <button className={tab === "explore" ? "active" : ""} onClick={() => setTab("explore")} type="button" role="tab" aria-selected={tab === "explore"}><Search size={17} /> {tx("استكشف المدرسين", "Explore teachers")}</button>
        <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")} type="button" role="tab" aria-selected={tab === "mine"}><CalendarCheck2 size={17} /> {tx("حجوزاتي", "My bookings")} {bookings.length > 0 && <span>{bookings.length}</span>}</button>
      </div>

      {tab === "explore" ? (
        <>
          <section className="booking-discovery" aria-label={tx("البحث عن مدرس", "Find a teacher")}>
            <div className="subject-chips">
              <button className={subject === "all" ? "active" : ""} onClick={() => setSubject("all")} type="button">{tx("كل المواد", "All subjects")}</button>
              {subjects.map((item) => <button className={subject === item.id ? "active" : ""} onClick={() => setSubject(item.id)} type="button" key={item.id}>{tx(item.nameAr, item.name)}</button>)}
            </div>
            <div className="booking-filters">
              <label className="booking-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("ابحث باسم المدرس أو التخصص", "Search by teacher or specialty")} /></label>
              <label><span>{tx("المستوى", "Level")}</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option value="all">{tx("كل المستويات", "All levels")}</option><option value="beginner">{tx("مبتدئ", "Beginner")}</option><option value="intermediate">{tx("متوسط", "Intermediate")}</option><option value="advanced">{tx("متقدم", "Advanced")}</option></select></label>
              <label><span>{tx("نوع الحصة", "Lesson type")}</span><select value={format} onChange={(event) => setFormat(event.target.value)}><option value="all">{tx("الكل", "All types")}</option><option value="online">{tx("أونلاين", "Online")}</option><option value="onsite">{tx("حضوري", "On-site")}</option></select></label>
            </div>
          </section>

          <div className="teacher-results-head"><div><h2>{tx("المدرسون المتاحون", "Available teachers")}</h2><span>{visibleTeachers.length} {tx("نتائج", "results")}</span></div><small>{tx("الأسعار للحصة الواحدة", "Prices are per lesson")}</small></div>
          <section className="teacher-grid">
            {visibleTeachers.map((teacher) => {
              const nextSlot = teacher.slots.find((slot) => !isBooked(teacher.id, slot));
              return (
                <article className="teacher-card" key={teacher.id}>
                  <div className="teacher-card-head">
                    <span className="teacher-avatar" style={{ backgroundColor: teacher.color }}>{initials(teacher.name)}</span>
                    <div><div className="teacher-name"><h3>{tx(teacher.nameAr, teacher.name)}</h3><CheckCircle2 size={16} /></div><p>{tx(teacher.titleAr, teacher.title)}</p></div>
                    {teacher.rating && <span className="teacher-rating"><Star size={15} fill="currentColor" /> {teacher.rating}<small>({teacher.reviews})</small></span>}
                  </div>
                  <p className="teacher-bio">{tx(teacher.bioAr, teacher.bio)}</p>
                  <div className="teacher-subjects">{teacher.subjects.map((id) => { const item = getSubject(subjects, id); return <Badge tone="primary" key={id}>{tx(item.nameAr, item.name)}</Badge>; })}</div>
                  <div className="teacher-meta">
                    {teacher.experience && <span><Users size={16} /> {teacher.experience} {tx("سنوات خبرة", "years experience")}</span>}
                    <span><Clock3 size={16} /> {teacher.duration} {tx("دقيقة", "minutes")}</span>
                    <span>{teacher.formats.includes("online") ? <Video size={16} /> : <MapPin size={16} />} {teacher.formats.map((item) => item === "online" ? tx("أونلاين", "Online") : tx("حضوري", "On-site")).join(" / ")}</span>
                  </div>
                  <div className="teacher-next-slot"><CalendarDays size={17} /><div><span>{tx("أقرب موعد", "Next available")}</span><strong>{nextSlot ? formatDateTime(nextSlot, tx) : tx("لا توجد مواعيد", "No available times")}</strong></div></div>
                  <footer><div><strong>{teacher.price} {tx("جنيه", "EGP")}</strong><span>/ {tx("حصة", "lesson")}</span></div><Button onClick={() => openBooking(teacher)} disabled={!nextSlot}>{tx("عرض المواعيد", "View times")}</Button></footer>
                </article>
              );
            })}
          </section>
          {!visibleTeachers.length && <div className="booking-empty"><Search size={34} /><h2>{tx("لم نجد مدرسين بهذه المواصفات", "No teachers match these filters")}</h2><p>{tx("غيّر المادة أو المستوى أو نوع الحصة وحاول مرة أخرى.", "Try changing the subject, level, or lesson type.")}</p><Button variant="ghost" onClick={() => { setSubject("all"); setLevel("all"); setFormat("all"); setQuery(""); }}>{tx("مسح الفلاتر", "Clear filters")}</Button></div>}
        </>
      ) : <MyBookings bookings={bookings} onExplore={() => setTab("explore")} onCancel={cancelBooking} />}

      <Modal
        open={Boolean(selectedTeacher)}
        onClose={() => setSelectedTeacher(null)}
        title={tx("اختيار موعد الحصة", "Choose a lesson time")}
        footer={<><Button variant="ghost" onClick={() => setSelectedTeacher(null)}>{tx("إلغاء", "Cancel")}</Button><Button onClick={confirmBooking} disabled={!bookingForm.slotId}><CalendarCheck2 size={17} /> {tx("تأكيد الحجز", "Confirm booking")}</Button></>}
      >
        {selectedTeacher && <div className="booking-modal-content">
          <div className="booking-teacher-summary"><span className="teacher-avatar" style={{ backgroundColor: selectedTeacher.color }}>{initials(selectedTeacher.name)}</span><div><strong>{tx(selectedTeacher.nameAr, selectedTeacher.name)}</strong><span>{tx(selectedTeacher.titleAr, selectedTeacher.title)}</span></div>{selectedTeacher.rating && <span><Star size={15} fill="currentColor" /> {selectedTeacher.rating}</span>}</div>
          <div className="booking-field"><label htmlFor="booking-subject">{tx("المادة", "Subject")}</label><select id="booking-subject" value={bookingForm.subjectId} onChange={(event) => setBookingForm((current) => ({ ...current, subjectId: event.target.value }))}>{selectedTeacher.subjects.map((id) => { const item = getSubject(subjects, id); return <option value={id} key={id}>{tx(item.nameAr, item.name)}</option>; })}</select></div>
          <fieldset className="booking-field"><legend>{tx("نوع الحصة", "Lesson type")}</legend><div className="booking-format-toggle">{selectedTeacher.formats.map((item) => <button className={bookingForm.format === item ? "active" : ""} onClick={() => setBookingForm((current) => ({ ...current, format: item }))} type="button" aria-pressed={bookingForm.format === item} key={item}>{item === "online" ? <Video size={18} /> : <MapPin size={18} />}{item === "online" ? tx("أونلاين", "Online") : tx("حضوري", "On-site")}</button>)}</div></fieldset>
          <fieldset className="booking-field"><legend>{tx("اختر الموعد", "Select a time")}</legend><div className="booking-slot-grid">{selectedTeacher.slots.map((slot) => { const unavailable = isBooked(selectedTeacher.id, slot); return <button className={bookingForm.slotId === slot.id ? "active" : ""} disabled={unavailable} onClick={() => setBookingForm((current) => ({ ...current, slotId: slot.id }))} type="button" aria-pressed={bookingForm.slotId === slot.id} key={slot.id}><CalendarDays size={17} /><span>{new Intl.DateTimeFormat(document.documentElement.lang || "en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${slot.date}T12:00:00`))}<small>{unavailable ? tx("محجوز", "Booked") : slot.time}</small></span></button>; })}</div></fieldset>
          <div className="booking-summary"><div><BookOpen size={19} /><span>{tx("مدة الحصة", "Lesson duration")}</span><strong>{selectedTeacher.duration} {tx("دقيقة", "min")}</strong></div><div><span>{tx("الإجمالي", "Total")}</span><strong>{selectedTeacher.price} {tx("جنيه", "EGP")}</strong></div></div>
        </div>}
      </Modal>
    </>
  );
}

function formatDateTime(slot, tx) {
  const date = new Intl.DateTimeFormat(document.documentElement.lang || "en", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${slot.date}T12:00:00`));
  return `${date} · ${slot.time} ${tx("", "")}`.trim();
}

function MyBookings({ bookings, onExplore, onCancel }) {
  const tx = useBilingualText();
  if (!bookings.length) return <div className="booking-empty"><CalendarCheck2 size={38} /><h2>{tx("لا توجد حجوزات بعد", "No bookings yet")}</h2><p>{tx("اختر المادة والمدرس والموعد، وستظهر كل حجوزاتك هنا.", "Choose a subject, teacher, and time. Your bookings will appear here.")}</p><Button onClick={onExplore}>{tx("استكشف المدرسين", "Explore teachers")}</Button></div>;
  return <section className="my-bookings-list"><div className="teacher-results-head"><div><h2>{tx("الحصص القادمة", "Upcoming lessons")}</h2><span>{bookings.length} {tx("حجوزات", "bookings")}</span></div><Button as="a" href="/end-user/calendar" variant="ghost"><CalendarDays size={17} /> {tx("فتح التقويم", "Open calendar")}</Button></div>{bookings.map((booking) => <article className="my-booking-card" key={booking.id}><div className="my-booking-date"><strong>{new Intl.DateTimeFormat(document.documentElement.lang || "en", { day: "2-digit" }).format(new Date(`${booking.date}T12:00:00`))}</strong><span>{new Intl.DateTimeFormat(document.documentElement.lang || "en", { month: "short" }).format(new Date(`${booking.date}T12:00:00`))}</span></div><div className="my-booking-main"><Badge tone={booking.status === "cancelled" ? "neutral" : "success"}>{booking.status}</Badge><h3>{tx(booking.subjectNameAr, booking.subjectName)}</h3><p>{tx(booking.teacherNameAr, booking.teacherName)}</p></div><div className="my-booking-details"><span><Clock3 size={16} /> {booking.time} · {booking.duration} {tx("دقيقة", "min")}</span><span>{booking.format === "online" ? <Video size={16} /> : <MapPin size={16} />}{booking.format === "online" ? tx("أونلاين", "Online") : tx("حضوري", "On-site")}</span></div><strong className="my-booking-price">{booking.price} {tx("جنيه", "EGP")}</strong>{booking.status !== "cancelled" && <Button variant="ghost" onClick={() => onCancel(booking)}>{tx("إلغاء الحجز", "Cancel booking")}</Button>}</article>)}</section>;
}
