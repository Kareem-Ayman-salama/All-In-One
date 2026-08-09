import {
  BadgeCheck, Ban, BookOpen, Building2, Check, Copy, GraduationCap, Image, LockKeyhole,
  Mail, Megaphone, Pencil, Plus, RefreshCw, Search, Send, Settings2, ShieldCheck, Tag,
  Trash2, UserRound, Users, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../services/api";

function PageHead({ title, description, action }) {
  return <div className="stitch-page-head"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function label(item) { return item?.titleAr || item?.nameAr || item?.title || item?.name || "-"; }
function statusTone(status) { return ["published", "approved", "confirmed", "active", "accepted"].includes(status) ? "success" : ["rejected", "cancelled", "expired", "suspended"].includes(status) ? "danger" : "warning"; }

export function LockedModulePage({ title = "هذه الميزة غير متاحة في باقتك", description = "قم بترقية الباقة لتفعيل الموديول وإتاحته لفريقك.", requiredPlan = "Growth" }) {
  return <div className="locked-module-state"><span><LockKeyhole /></span><Badge tone="warning">متاح في باقة {requiredPlan}</Badge><h1>{title}</h1><p>{description}</p><Button as="a" href="/tenant-admin/subscription">ترقية الباقة</Button></div>;
}

export function AcademyProfileSettingsPage() {
  const { activeOrganization } = useOrganization();
  const { academies, add, update } = useMarketplace();
  const { showToast } = useToast();
  const academy = academies.find((item) => item.organizationId === activeOrganization?.id);
  const submit = async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const payload = { organizationId: activeOrganization.id, name: form.get("name"), nameAr: form.get("nameAr"), slug: form.get("slug"), descriptionAr: form.get("descriptionAr"), description: form.get("description"), phone: form.get("phone"), email: form.get("email"), website: form.get("website"), location: form.get("location"), public: form.get("public") === "on", status: academy?.status || "pending", verified: academy?.verified || false, color: activeOrganization.color, initials: form.get("name").slice(0, 2).toUpperCase(), deliveryMethods: ["online", "offline"], branches: [] };
    try {
      await (academy ? update("academies", academy.id, payload) : add("academies", "academy", payload));
      showToast("تم حفظ الملف العام للأكاديمية", "success");
    } catch (error) {
      showToast(error.message || "تعذر حفظ الملف العام", "error");
    }
  };
  return <><PageHead title="الملف العام للأكاديمية" description="هذه البيانات تظهر للطلاب في صفحة الأكاديمية العامة ونتائج البحث." /><form className="admin-settings-form" onSubmit={submit}><section><h2>الهوية العامة</h2><div className="admin-cover-placeholder"><Image /><div><strong>غلاف الأكاديمية</strong><span>سيتم ربط رفع الصور مع Storage API</span></div><Button variant="ghost">اختيار صورة</Button></div><div className="learning-form-grid"><FormField label="الاسم بالإنجليزية"><input name="name" defaultValue={academy?.name || activeOrganization?.name} required /></FormField><FormField label="الاسم بالعربية"><input name="nameAr" defaultValue={academy?.nameAr || ""} required /></FormField><FormField label="رابط الصفحة"><input name="slug" defaultValue={academy?.slug || "academy-name"} pattern="[a-z0-9-]+" required /></FormField><FormField label="الموقع"><input name="location" defaultValue={academy?.location || ""} required /></FormField></div><FormField label="نبذة بالعربية"><textarea name="descriptionAr" defaultValue={academy?.descriptionAr || ""} required /></FormField><FormField label="نبذة بالإنجليزية"><textarea name="description" defaultValue={academy?.description || ""} required /></FormField></section><section><h2>التواصل والظهور</h2><div className="learning-form-grid"><FormField label="الهاتف"><input name="phone" defaultValue={academy?.phone || ""} required /></FormField><FormField label="البريد العام"><input name="email" type="email" defaultValue={academy?.email || ""} required /></FormField><FormField label="الموقع الإلكتروني"><input name="website" defaultValue={academy?.website || ""} /></FormField></div><label className="learning-check"><input name="public" type="checkbox" defaultChecked={academy?.public} />نشر صفحة الأكاديمية للطلاب بعد موافقة المنصة</label></section><footer><Button type="submit">حفظ التغييرات</Button></footer></form></>;
}

export function InstructorsManagementPage() {
  const { activeOrganization } = useOrganization();
  const { instructors, add, update } = useMarketplace();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [slots, setSlots] = useState([]);
  const visible = instructors.filter((item) => item.organizationId === activeOrganization?.id);
  useEffect(() => {
    if (!activeOrganization?.id) return;
    api.getInstructorSlots(activeOrganization.id).then(setSlots).catch(() => setSlots([]));
  }, [activeOrganization?.id]);
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get("name");
    try {
      await add("instructors", "instructor", {
        organizationId: activeOrganization.id,
        name,
        nameAr: form.get("nameAr"),
        specialty: form.get("specialty"),
        bio: form.get("bio"),
        active: true
      });
      setOpen(false);
      showToast("تمت إضافة المدرس", "success");
    } catch (error) {
      showToast(error.message || "تعذر إضافة المدرس", "error");
    }
  };
  const submitSlot = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.createInstructorSlot(activeOrganization.id, {
        instructorId: form.get("instructorId"),
        startsAt: new Date(form.get("startsAt")).toISOString(),
        endsAt: new Date(form.get("endsAt")).toISOString(),
        deliveryType: form.get("deliveryType"),
        location: form.get("location") || null,
        priceMinor: Math.round(Number(form.get("price")) * 100),
        currency: "EGP"
      });
      setSlots(await api.getInstructorSlots(activeOrganization.id));
      setSlotOpen(false);
      showToast("تم نشر الموعد للحجز", "success");
    } catch (error) {
      showToast(error.message || "تعذر إضافة الموعد", "error");
    }
  };
  return <><PageHead title="المدرسون" description="أنشئ ملفات المدرسين وانشر المواعيد التي يستطيع الطلاب حجزها." action={<div className="learning-actions"><Button variant="ghost" onClick={() => setSlotOpen(true)}><Plus />موعد متاح</Button><Button onClick={() => setOpen(true)}><Plus />مدرس جديد</Button></div>} /><section className="admin-people-grid">{visible.map((item) => <article key={item.id}><span>{item.initials}</span><div><h2>{label(item)}</h2><strong>{item.specialty}</strong><p>{item.bio}</p><small>{slots.filter((slot) => slot.instructorId === item.id && slot.status === "open").length} مواعيد متاحة</small></div><button onClick={async () => { try { await update("instructors", item.id, { ...item, active: !item.active }); } catch (error) { showToast(error.message, "error"); } }}><Badge tone={item.active ? "success" : "neutral"}>{item.active ? "نشط" : "موقوف"}</Badge></button></article>)}</section><Modal title="إضافة مدرس" open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><div className="learning-form-grid"><FormField label="الاسم بالإنجليزية"><input name="name" required /></FormField><FormField label="الاسم بالعربية"><input name="nameAr" required /></FormField><FormField label="التخصص"><input name="specialty" required /></FormField></div><FormField label="نبذة"><textarea name="bio" required /></FormField><div className="learning-form-actions"><Button type="submit">إضافة المدرس</Button></div></form></Modal><Modal title="إضافة موعد متاح للحجز" open={slotOpen} onClose={() => setSlotOpen(false)}><form className="learning-form" onSubmit={submitSlot}><FormField label="المدرس"><select name="instructorId" required>{visible.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{label(item)}</option>)}</select></FormField><div className="learning-form-grid"><FormField label="بداية الحصة"><input name="startsAt" type="datetime-local" required /></FormField><FormField label="نهاية الحصة"><input name="endsAt" type="datetime-local" required /></FormField><FormField label="نوع الحصة"><select name="deliveryType"><option value="online">أونلاين</option><option value="onsite">حضوري</option></select></FormField><FormField label="السعر بالجنيه"><input name="price" type="number" min="0" required /></FormField></div><FormField label="المكان أو رابط الاجتماع"><input name="location" /></FormField><div className="learning-form-actions"><Button type="submit">نشر الموعد</Button></div></form></Modal></>;
}

const COURSE_STEPS = ["المعلومات", "طريقة التقديم", "السعر", "تفاصيل المحتوى", "الوصول", "المراجعة"];
export function CourseWizardPage() {
  const { activeOrganization } = useOrganization();
  const { academies, categories, instructors, courses, add, update } = useMarketplace();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", titleAr: "", shortDescriptionAr: "", descriptionAr: "", categoryId: categories[0]?.id || "", level: "", subject: "", instructorId: "", deliveryType: "online", price: 0, discountedPrice: "", duration: "", sessions: 8, learningOutcomes: "", requirements: "", roomId: "", status: "draft" });
  const orgCourses = courses.filter((item) => item.organizationId === activeOrganization?.id);
  const orgInstructors = instructors.filter((item) => item.organizationId === activeOrganization?.id && item.active);
  const draftKey = `ain-course-draft:${activeOrganization?.id || "none"}`;
  useEffect(() => {
    if (!editing) return undefined;
    window.sessionStorage.setItem(draftKey, JSON.stringify({ form, step }));
    const protect = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protect);
    return () => window.removeEventListener("beforeunload", protect);
  }, [draftKey, editing, form, step]);
  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const reset = () => { const saved = window.sessionStorage.getItem(draftKey); if (saved) { const draft = JSON.parse(saved); setForm(draft.form); setStep(draft.step || 0); } else { setStep(0); setForm({ title: "", titleAr: "", shortDescriptionAr: "", descriptionAr: "", categoryId: categories[0]?.id || "", level: "", subject: "", instructorId: orgInstructors[0]?.id || "", deliveryType: "online", price: 0, discountedPrice: "", duration: "", sessions: 8, learningOutcomes: "", requirements: "", roomId: "", status: "draft" }); } setEditing("new"); };
  const save = async (status) => {
    const payload = { ...form, organizationId: activeOrganization.id, academyId: academies.find((item) => item.organizationId === activeOrganization.id)?.id || null, slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), shortDescription: form.shortDescriptionAr, description: form.descriptionAr, price: Number(form.price), discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : null, sessions: Number(form.sessions), learningOutcomes: form.learningOutcomes.split("\n").filter(Boolean), requirements: form.requirements.split("\n").filter(Boolean), status, featured: false, sponsored: false };
    try {
      const saved = editing && editing !== "new"
        ? await update("courses", editing, payload)
        : await add("courses", "course", payload);
      if (status === "pending_review") {
        const courseId = saved?.id || editing;
        await api.submitCourseForReview(activeOrganization.id, courseId);
      }
      window.sessionStorage.removeItem(draftKey);
      setEditing(null);
      showToast(status === "draft" ? "تم حفظ المسودة" : "تم إرسال الكورس للمراجعة", "success");
    } catch (error) {
      showToast(error.message || "تعذر حفظ الكورس", "error");
    }
  };
  return <><PageHead title="إدارة الكورسات" description="أنشئ كورسًا كاملًا واحفظه كمسودة أو أرسله لمراجعة المنصة." action={<Button onClick={reset}><Plus />إنشاء كورس</Button>} />{editing ? <section className="course-wizard"><ol>{COURSE_STEPS.map((item, index) => <li className={index === step ? "active" : index < step ? "done" : ""} key={item}><span>{index < step ? <Check /> : index + 1}</span>{item}</li>)}</ol><div className="course-wizard-panel">
    {step === 0 && <><h2>المعلومات الأساسية</h2><div className="learning-form-grid"><FormField label="اسم الكورس بالإنجليزية"><input value={form.title} onChange={(e) => change("title", e.target.value)} required /></FormField><FormField label="اسم الكورس بالعربية"><input value={form.titleAr} onChange={(e) => change("titleAr", e.target.value)} required /></FormField><FormField label="التصنيف"><select value={form.categoryId} onChange={(e) => change("categoryId", e.target.value)}>{categories.map((item) => <option value={item.id} key={item.id}>{label(item)}</option>)}</select></FormField><FormField label="المدرس"><select value={form.instructorId} onChange={(e) => change("instructorId", e.target.value)}><option value="">فريق الأكاديمية</option>{orgInstructors.map((item) => <option value={item.id} key={item.id}>{label(item)}</option>)}</select></FormField><FormField label="المرحلة / المستوى"><input value={form.level} onChange={(e) => change("level", e.target.value)} /></FormField><FormField label="المادة"><input value={form.subject} onChange={(e) => change("subject", e.target.value)} /></FormField></div><FormField label="وصف مختصر"><textarea value={form.shortDescriptionAr} onChange={(e) => change("shortDescriptionAr", e.target.value)} /></FormField></>}
    {step === 1 && <><h2>طريقة تقديم الكورس</h2><div className="choice-grid">{["online", "offline", "hybrid", "recorded"].map((item) => <button className={form.deliveryType === item ? "active" : ""} onClick={() => change("deliveryType", item)} key={item}><GraduationCap /><strong>{item}</strong><span>إعداد مناسب لطريقة الحضور المختارة</span></button>)}</div></>}
    {step === 2 && <><h2>السعر والعروض</h2><div className="learning-form-grid"><FormField label="السعر بالجنيه"><input type="number" min="0" value={form.price} onChange={(e) => change("price", e.target.value)} /></FormField><FormField label="سعر الخصم (اختياري)"><input type="number" min="0" value={form.discountedPrice} onChange={(e) => change("discountedPrice", e.target.value)} /></FormField></div><div className="wizard-note"><ShieldCheck />لا يوجد دفع بكارت الآن. الحجز يعمل بنظام تأكيد يدوي ثم الدفع عبر InstaPay أو Vodafone Cash.</div></>}
    {step === 3 && <><h2>تفاصيل المحتوى</h2><FormField label="الوصف الكامل"><textarea value={form.descriptionAr} onChange={(e) => change("descriptionAr", e.target.value)} /></FormField><div className="learning-form-grid"><FormField label="المدة"><input value={form.duration} onChange={(e) => change("duration", e.target.value)} placeholder="8 أسابيع" /></FormField><FormField label="عدد الحصص"><input type="number" min="1" value={form.sessions} onChange={(e) => change("sessions", e.target.value)} /></FormField></div><FormField label="نواتج التعلم - سطر لكل عنصر"><textarea value={form.learningOutcomes} onChange={(e) => change("learningOutcomes", e.target.value)} /></FormField><FormField label="المتطلبات - سطر لكل عنصر"><textarea value={form.requirements} onChange={(e) => change("requirements", e.target.value)} /></FormField></>}
    {step === 4 && <><h2>الوصول والروم</h2><FormField label="رقم أو اسم الروم المرتبطة"><input value={form.roomId} onChange={(e) => change("roomId", e.target.value)} placeholder="سيتم إنشاء روم عند إضافة الدفعة إذا تركته فارغًا" /></FormField><div className="wizard-note"><LockKeyhole />بعد تأكيد الحجز سيُنشأ Enrollment واشتراك وعضوية في روم الدفعة تلقائيًا.</div></>}
    {step === 5 && <><h2>المراجعة والنشر</h2><div className="wizard-review"><span><small>الكورس</small><strong>{form.titleAr || "بدون عنوان"}</strong></span><span><small>النوع</small><strong>{form.deliveryType}</strong></span><span><small>السعر</small><strong>{Number(form.discountedPrice || form.price).toLocaleString()} ج.م</strong></span><span><small>الحالة التالية</small><strong>قيد مراجعة المنصة</strong></span></div><article className="course-wizard-preview"><div><BookOpen /></div><span>{label(categories.find((item) => item.id === form.categoryId))} · {form.level}</span><h3>{form.titleAr || "اسم الكورس"}</h3><p>{form.shortDescriptionAr || "سيظهر وصف الكورس المختصر هنا."}</p><strong>{Number(form.discountedPrice || form.price).toLocaleString()} ج.م</strong></article></>}
    <footer><Button variant="ghost" onClick={() => step ? setStep(step - 1) : setEditing(null)}>{step ? "السابق" : "إلغاء"}</Button><div><Button variant="ghost" onClick={() => save("draft")}>حفظ كمسودة</Button>{step < COURSE_STEPS.length - 1 ? <Button disabled={step === 0 && (!form.title || !form.titleAr)} onClick={() => setStep(step + 1)}>التالي</Button> : <Button onClick={() => save("pending_review")}><Send />إرسال للمراجعة</Button>}</div></footer>
  </div></section> : <section className="admin-course-table"><table><thead><tr><th>الكورس</th><th>التصنيف</th><th>طريقة التقديم</th><th>السعر</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>{orgCourses.map((item) => <tr key={item.id}><td><strong>{label(item)}</strong><small>{item.subject} · {item.level}</small></td><td>{label(categories.find((cat) => cat.id === item.categoryId))}</td><td>{item.deliveryType}</td><td>{item.price?.toLocaleString()} ج.م</td><td><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge></td><td><Button variant="ghost" onClick={() => { setEditing(item.id); setForm({ ...form, ...item, learningOutcomes: item.learningOutcomes?.join("\n") || "", requirements: item.requirements?.join("\n") || "" }); }}><Pencil />تعديل</Button></td></tr>)}</tbody></table></section>}</>;
}

export function MarketplaceBatchesPage() {
  const { activeOrganization } = useOrganization();
  const { courses, batches, add } = useMarketplace();
  const { rooms } = useWorkspace();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const orgCourses = courses.filter((item) => item.organizationId === activeOrganization?.id);
  const visible = batches.filter((item) => item.organizationId === activeOrganization?.id);
  const submit = async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      await add("batches", "batch", {
        organizationId: activeOrganization.id,
        courseId: form.get("courseId"),
        title: form.get("title"),
        titleAr: form.get("titleAr"),
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        schedule: [{
          day: form.get("day"),
          startTime: form.get("startTime"),
          endTime: form.get("endTime")
        }],
        deliveryType: form.get("deliveryType"),
        capacity: Number(form.get("capacity")),
        roomId: form.get("roomId"),
        location: form.get("location"),
        status: "open"
      });
      setOpen(false);
      showToast("تم إنشاء الدفعة وربطها بالروم", "success");
    } catch (error) {
      showToast(error.message || "تعذر إنشاء الدفعة", "error");
    }
  };
  return <><PageHead title="الدفعات والمجموعات" description="كل دفعة لها موعد وسعة وروم تعليمية مستقلة مرتبطة بالحجوزات." action={<Button onClick={() => setOpen(true)} disabled={!rooms.length}><Plus />دفعة جديدة</Button>} /><section className="learning-list">{visible.map((batch) => { const course = courses.find((item) => item.id === batch.courseId); const used = batch.confirmedSeats + batch.reservedSeats; const percent = Math.min(100, Math.round((used / batch.capacity) * 100)); const schedule = Array.isArray(batch.schedule) ? batch.schedule.map((item) => `${item.day} ${item.startTime}-${item.endTime}`).join("، ") : batch.schedule; return <article className="learning-batch-row" key={batch.id}><div className="learning-card-icon"><Users /></div><div><Badge tone={batch.status === "open" ? "success" : "neutral"}>{batch.status}</Badge><h2>{label(batch)}</h2><p>{label(course)} · {schedule} · {batch.location}</p><small>{batch.startDate} → {batch.endDate} · Room: {batch.room?.name || batch.roomName || "-"}</small></div><div className="learning-capacity"><div><span>{used}/{batch.capacity} مقعد</span><small>{percent}%</small></div><progress max="100" value={percent} /></div></article>; })}</section>{!rooms.length && <section className="learning-empty-state"><LockKeyhole /><h2>أنشئ روم أولاً</h2><p>كل دفعة يجب أن ترتبط بروم حقيقية لحماية المحتوى وإضافة الطلاب بعد التأكيد.</p></section>}<Modal title="إنشاء دفعة" open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><FormField label="الكورس"><select name="courseId" required>{orgCourses.map((item) => <option value={item.id} key={item.id}>{label(item)}</option>)}</select></FormField><div className="learning-form-grid"><FormField label="اسم الدفعة بالإنجليزية"><input name="title" required /></FormField><FormField label="اسم الدفعة بالعربية"><input name="titleAr" required /></FormField><FormField label="تاريخ البداية"><input name="startDate" type="date" required /></FormField><FormField label="تاريخ النهاية"><input name="endDate" type="date" required /></FormField><FormField label="اليوم"><select name="day"><option value="Sunday">الأحد</option><option value="Monday">الاثنين</option><option value="Tuesday">الثلاثاء</option><option value="Wednesday">الأربعاء</option><option value="Thursday">الخميس</option><option value="Friday">الجمعة</option><option value="Saturday">السبت</option></select></FormField><FormField label="من"><input name="startTime" type="time" required /></FormField><FormField label="إلى"><input name="endTime" type="time" required /></FormField><FormField label="نوع التقديم"><select name="deliveryType"><option value="online">أونلاين</option><option value="offline">حضوري</option><option value="hybrid">هجين</option><option value="recorded">مسجل</option></select></FormField><FormField label="السعة"><input name="capacity" type="number" min="1" defaultValue="25" required /></FormField><FormField label="الروم"><select name="roomId" required>{rooms.map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select></FormField><FormField label="المكان / Online"><input name="location" /></FormField></div><div className="learning-form-actions"><Button type="submit">إنشاء الدفعة</Button></div></form></Modal></>;
}

export function MarketplaceBookingsPage() {
  const { activeOrganization } = useOrganization();
  const { bookings, courses, batches, enrollments, subscriptions, roomMemberships, confirmBooking, rejectBooking, cancelBooking, update } = useMarketplace();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [internalNote, setInternalNote] = useState("");
  const visible = bookings.filter((item) => item.organizationId === activeOrganization?.id).filter((item) => status === "all" || item.status === status).filter((item) => item.studentName.toLowerCase().includes(query.toLowerCase()));
  const act = async (id, action, payload = {}) => {
    const result = action === "confirm"
      ? await confirmBooking(id, payload)
      : action === "cancel"
        ? await cancelBooking(id, payload)
        : await rejectBooking(id, payload);
    showToast(result.ok ? action === "confirm" ? "تم التأكيد وإنشاء الاشتراك وعضوية الروم" : action === "cancel" ? "تم إلغاء الحجز وتحديث الوصول" : "تم رفض الحجز" : result.error?.message || "تعذر تنفيذ الإجراء", result.ok ? "success" : "error");
    return result;
  };
  const openDetails = (item) => { setSelected(item); setInternalNote(item.internalNote || ""); };
  const finishFromModal = async (action, payload = {}) => {
    const result = await act(selected.id, action, { internalNote, ...payload });
    if (result.ok) setSelected(null);
  };
  return <><PageHead title="إدارة الحجوزات" description="تأكيد الحجز ينشئ Enrollment واشتراكًا وعضوية روم دون تكرار." /><div className="admin-filter-bar"><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم الطالب" /></label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">كل الحالات</option><option value="pending_confirmation">قيد التأكيد</option><option value="confirmed">مؤكد</option><option value="rejected">مرفوض</option><option value="cancelled">ملغي</option></select></div><section className="admin-course-table"><table><thead><tr><th>الطالب</th><th>الكورس / الدفعة</th><th>المبلغ</th><th>الحالة</th><th>الوصول</th><th>الإجراء</th></tr></thead><tbody>{visible.map((item) => { const enrollment = enrollments.find((e) => e.bookingId === item.id); return <tr key={item.id}><td><strong>{item.studentName}</strong><small>{item.email}<br />{item.phone}</small></td><td><strong>{label(courses.find((x) => x.id === item.courseId))}</strong><small>{label(batches.find((x) => x.id === item.batchId))}</small></td><td>{item.amount?.toLocaleString()} ج.م</td><td><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge></td><td>{enrollment ? <Badge tone="success">Enrollment نشط</Badge> : <span className="learning-muted">لم يُنشأ بعد</span>}</td><td><div className="learning-actions"><Button variant="ghost" onClick={() => openDetails(item)}>التفاصيل</Button>{item.status === "pending_confirmation" && <><Button onClick={() => act(item.id, "confirm")}><Check />تأكيد</Button><Button variant="ghost" onClick={() => act(item.id, "reject")}><X />رفض</Button></>}</div></td></tr>; })}</tbody></table></section><div className="operation-proof"><span><strong>{enrollments.filter((x) => x.organizationId === activeOrganization?.id).length}</strong> Enrollments</span><span><strong>{subscriptions.filter((x) => x.organizationId === activeOrganization?.id).length}</strong> Subscriptions</span><span><strong>{roomMemberships.filter((x) => x.organizationId === activeOrganization?.id).length}</strong> Room memberships</span></div><Modal title="تفاصيل طلب الحجز" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className="booking-detail-modal"><div><span>الطالب<strong>{selected.studentName}</strong></span><span>البريد<strong>{selected.email}</strong></span><span>الهاتف<strong>{selected.phone}</strong></span><span>المبلغ<strong>{selected.amount?.toLocaleString()} ج.م</strong></span></div><FormField label="ملاحظة داخلية"><textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /></FormField><footer>{selected.status === "pending_confirmation" && <><Button variant="ghost" onClick={() => finishFromModal("confirm", { markAsPaid: true })}>تأكيد كمدفوع</Button><Button onClick={() => finishFromModal("confirm")}>تأكيد الحجز</Button><Button variant="ghost" onClick={() => finishFromModal("reject")}>رفض</Button></>}{selected.status === "confirmed" && <Button variant="ghost" onClick={() => finishFromModal("cancel")}>إلغاء الحجز</Button>}</footer></div>}</Modal></>;
}

export function InvitationsManagementPage() {
  const { activeOrganization } = useOrganization(); const { invitations, add, update } = useMarketplace(); const { showToast } = useToast(); const [open, setOpen] = useState(false);
  const visible = invitations.filter((item) => item.organizationId === activeOrganization?.id);
  const submit = async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await add("invitations", "invite", { organizationId: activeOrganization.id, email: form.get("email"), role: form.get("role"), roomIds: [], expiresInDays: Number(form.get("days")) }); setOpen(false); showToast("تم إرسال الدعوة", "success"); } catch (error) { showToast(error.message || "تعذر إرسال الدعوة", "error"); } };
  const copy = (id) => { navigator.clipboard?.writeText(`${location.origin}/invite/${id}`); showToast("تم نسخ رابط الدعوة", "success"); };
  return <><PageHead title="إدارة الدعوات" description="تابع الدعوات المعلقة والمقبولة والمنتهية وأعد إرسالها بأمان." action={<Button onClick={() => setOpen(true)}><Plus />دعوة جديدة</Button>} /><section className="invitation-list">{visible.map((item) => <article key={item.id}><span className="invitation-icon"><Mail /></span><div><strong>{item.email}</strong><small>{item.role} · تنتهي {item.expiresAt}</small></div><Badge tone={statusTone(item.status)}>{item.status}</Badge><div className="learning-actions"><button title="نسخ الرابط" onClick={() => copy(item.id)}><Copy /></button>{item.status !== "accepted" && <button title="إعادة الإرسال" onClick={async () => { try { await update("invitations", item.id, { action: "resend" }); showToast("تمت إعادة إرسال الدعوة", "success"); } catch (error) { showToast(error.message, "error"); } }}><RefreshCw /></button>}{item.status === "pending" && <button title="إلغاء" onClick={async () => { try { await update("invitations", item.id, { status: "cancelled" }); showToast("تم إلغاء الدعوة", "success"); } catch (error) { showToast(error.message, "error"); } }}><Ban /></button>}</div></article>)}</section><Modal title="دعوة عضو" open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><FormField label="البريد الإلكتروني"><input type="email" name="email" required /></FormField><div className="learning-form-grid"><FormField label="الدور"><select name="role"><option value="student">طالب</option><option value="instructor">مدرس</option><option value="staff">موظف</option><option value="organization_admin">مدير</option></select></FormField><FormField label="مدة صلاحية الدعوة"><select name="days"><option value="7">7 أيام</option><option value="14">14 يومًا</option><option value="30">30 يومًا</option></select></FormField></div><div className="learning-form-actions"><Button type="submit">إرسال الدعوة</Button></div></form></Modal></>;
}

export function PromotionsManagementPage({ platform = false }) {
  const { activeOrganization } = useOrganization(); const { promotions, courses, add, update } = useMarketplace(); const [open, setOpen] = useState(false);
  const visible = platform ? promotions : promotions.filter((item) => item.organizationId === activeOrganization?.id);
  const submit = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const start = new Date(); const end = new Date(); end.setDate(end.getDate() + Number(form.get("duration"))); add("promotions", "promotion", { organizationId: activeOrganization.id, courseId: form.get("courseId"), type: form.get("type"), placement: form.get("placement"), startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), status: "pending_approval", paymentStatus: "unpaid", impressions: 0, clicks: 0, bookingConversions: 0 }); setOpen(false); };
  return <><PageHead title={platform ? "مراجعة الإعلانات الممولة" : "الحملات والإعلانات"} description={platform ? "راجع أماكن ظهور الإعلانات ووافق عليها أو ارفضها." : "اطلب إبراز كورس أو أكاديمية داخل الـMarketplace."} action={!platform && <Button onClick={() => setOpen(true)}><Plus />حملة جديدة</Button>} /><section className="promotion-grid">{visible.map((item) => <article key={item.id}><header><span><Megaphone /></span><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge></header><h2>{label(courses.find((course) => course.id === item.courseId))}</h2><p>{item.type} · {item.placement}</p><div><span><small>المشاهدات</small><strong>{item.impressions}</strong></span><span><small>النقرات</small><strong>{item.clicks}</strong></span><span><small>الحجوزات</small><strong>{item.bookingConversions}</strong></span></div><footer><span>{item.startDate} → {item.endDate}</span>{platform && item.status === "pending_approval" && <div className="learning-actions"><Button onClick={() => update("promotions", item.id, { status: "approved" })}>موافقة</Button><Button variant="ghost" onClick={() => update("promotions", item.id, { status: "rejected" })}>رفض</Button></div>}</footer></article>)}</section><Modal title="طلب حملة ممولة" open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><FormField label="الكورس"><select name="courseId">{courses.filter((item) => item.organizationId === activeOrganization?.id && item.status === "published").map((item) => <option value={item.id} key={item.id}>{label(item)}</option>)}</select></FormField><div className="learning-form-grid"><FormField label="نوع الحملة"><select name="type"><option value="featured_course">كورس مميز</option><option value="homepage_banner">بانر الرئيسية</option><option value="search_boost">تعزيز البحث</option></select></FormField><FormField label="مكان الظهور"><select name="placement"><option value="homepage">الرئيسية</option><option value="courses">صفحة الكورسات</option><option value="category">صفحة التصنيف</option></select></FormField><FormField label="المدة"><select name="duration"><option value="7">7 أيام</option><option value="14">14 يومًا</option><option value="30">30 يومًا</option></select></FormField></div><div className="learning-form-actions"><Button type="submit">إرسال للمراجعة</Button></div></form></Modal></>;
}

export function CourseApprovalsPage() {
  const { courses, academies, update } = useMarketplace(); const [selected, setSelected] = useState(null);
  const pending = courses.filter((item) => ["pending_review", "rejected"].includes(item.status));
  return <><PageHead title="مراجعة الكورسات" description="لا يظهر أي كورس للعامة قبل الموافقة عليه." /><section className="moderation-list">{pending.map((item) => <article key={item.id}><div className="learning-card-icon"><BookOpen /></div><div><h2>{label(item)}</h2><p>{label(academies.find((a) => a.id === item.academyId))} · {item.subject} · {item.deliveryType}</p></div><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge><Button variant="ghost" onClick={() => setSelected(item)}>مراجعة</Button></article>)}</section><Modal title="مراجعة الكورس" open={Boolean(selected)} onClose={() => setSelected(null)}>{selected && <div className="moderation-detail"><h2>{label(selected)}</h2><p>{selected.descriptionAr}</p><div><span>السعر<strong>{selected.price?.toLocaleString()} ج.م</strong></span><span>عدد الحصص<strong>{selected.sessions}</strong></span><span>طريقة التقديم<strong>{selected.deliveryType}</strong></span></div><footer><Button onClick={() => { update("courses", selected.id, { status: "published" }); setSelected(null); }}><Check />موافقة ونشر</Button><Button variant="ghost" onClick={() => { update("courses", selected.id, { status: "rejected", rejectionReason: "يرجى استكمال الوصف وبيانات المدرس" }); setSelected(null); }}><X />رفض مع ملاحظة</Button></footer></div>}</Modal></>;
}

export function AcademyApprovalsPage() {
  const { academies, courses, update } = useMarketplace();
  return <><PageHead title="توثيق الأكاديميات" description="تحقق من الملف العام قبل إتاحته للطلاب." /><section className="academy-approval-grid">{academies.map((item) => <article key={item.id}><span style={{ background: item.color }}>{item.initials}</span><div><h2>{label(item)}</h2><p>{item.email} · {item.location}</p><small>{courses.filter((course) => course.organizationId === item.organizationId).length} كورسات</small></div><Badge tone={statusTone(item.status)}>{item.status}</Badge><footer>{item.status === "pending" ? <><Button onClick={() => update("academies", item.id, { status: "approved", verified: true, public: true })}>توثيق</Button><Button variant="ghost" onClick={() => update("academies", item.id, { status: "rejected", public: false })}>رفض</Button></> : <Button variant="ghost" onClick={() => update("academies", item.id, { status: "suspended", public: false })}>إيقاف مؤقت</Button>}</footer></article>)}</section></>;
}

export function CategoryManagementPage() {
  const { categories, courses, add, update } = useMarketplace(); const [open, setOpen] = useState(false);
  const submit = (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); add("categories", "category", { name: form.get("name"), nameAr: form.get("nameAr"), parentId: form.get("parentId") || null, active: true }); setOpen(false); };
  return <><PageHead title="التصنيفات" description="نظّم تصنيفات الـMarketplace وامنع حذف التصنيفات المستخدمة." action={<Button onClick={() => setOpen(true)}><Plus />تصنيف جديد</Button>} /><section className="category-admin-list">{categories.map((item) => <article key={item.id}><span><Tag /></span><div><h2>{label(item)}</h2><p>{item.name} · {courses.filter((course) => course.categoryId === item.id).length} كورسات</p></div><Badge tone={item.active ? "success" : "neutral"}>{item.active ? "نشط" : "موقوف"}</Badge><Button variant="ghost" onClick={() => update("categories", item.id, { active: !item.active })}>{item.active ? "إيقاف" : "تفعيل"}</Button></article>)}</section><Modal title="إضافة تصنيف" open={open} onClose={() => setOpen(false)}><form className="learning-form" onSubmit={submit}><div className="learning-form-grid"><FormField label="الاسم بالإنجليزية"><input name="name" required /></FormField><FormField label="الاسم بالعربية"><input name="nameAr" required /></FormField></div><FormField label="التصنيف الأب"><select name="parentId"><option value="">تصنيف رئيسي</option>{categories.map((item) => <option value={item.id} key={item.id}>{label(item)}</option>)}</select></FormField><div className="learning-form-actions"><Button type="submit">إضافة</Button></div></form></Modal></>;
}
