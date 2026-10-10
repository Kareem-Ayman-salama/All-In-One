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
import { useLanguage } from "../contexts/LanguageContext";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../services/api";

function PageHead({ title, description, action }) {
  return <div className="stitch-page-head"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function label(item, isArabic = true) {
  if (!item) return "-";
  if (isArabic) return item.titleAr || item.nameAr || item.title || item.name || "-";
  return item.titleEn || item.nameEn || item.title || item.name || item.titleAr || item.nameAr || "-";
}

function statusTone(status) {
  return ["published", "approved", "confirmed", "active", "accepted"].includes(status) ? "success" : ["rejected", "cancelled", "expired", "suspended"].includes(status) ? "danger" : "warning";
}

export function LockedModulePage({ title, description, requiredPlan = "Growth" }) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const defTitle = isArabic ? "هذه الميزة غير متاحة في باقتك" : "This feature is not available on your plan";
  const defDesc = isArabic ? "قم بترقية الباقة لتفعيل الموديول وإتاحته لفريقك." : "Upgrade your plan to unlock this module for your organization.";
  return (
    <div className="locked-module-state">
      <span><LockKeyhole /></span>
      <Badge tone="warning">{isArabic ? `متاح في باقة ${requiredPlan}` : `Available on ${requiredPlan} plan`}</Badge>
      <h1>{title || defTitle}</h1>
      <p>{description || defDesc}</p>
      <Button as="a" href="/tenant-admin/subscription">{isArabic ? "ترقية الباقة" : "Upgrade Plan"}</Button>
    </div>
  );
}

export function AcademyProfileSettingsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { academies, add, update } = useMarketplace();
  const { showToast } = useToast();
  const academy = academies.find((item) => item.organizationId === activeOrganization?.id);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      organizationId: activeOrganization.id,
      name: form.get("name"),
      nameAr: form.get("nameAr"),
      slug: form.get("slug"),
      descriptionAr: form.get("descriptionAr"),
      description: form.get("description"),
      phone: form.get("phone"),
      email: form.get("email"),
      website: form.get("website"),
      location: form.get("location"),
      public: form.get("public") === "on",
      status: academy?.status || "pending",
      verified: academy?.verified || false,
      color: activeOrganization.color,
      initials: (form.get("name") || "AC").slice(0, 2).toUpperCase(),
      deliveryMethods: ["online", "offline"],
      branches: []
    };
    try {
      await (academy ? update("academies", academy.id, payload) : add("academies", "academy", payload));
      showToast(isArabic ? "تم حفظ الملف العام للأكاديمية بنجاح" : "Academy public profile saved successfully", "success");
    } catch (error) {
      showToast(error.message || (isArabic ? "تعذر حفظ الملف العام" : "Failed to save profile"), "error");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "8px 0" }}>
      <PageHead
        title={isArabic ? "الملف العام للأكاديمية" : "Academy Public Profile"}
        description={isArabic ? "هذه البيانات تظهر للطلاب في صفحة الأكاديمية العامة والبحث عن المحاضرات والمسارات." : "This information appears to students on the public academy storefront and search."}
        action={
          academy?.slug && (
            <Button
              variant="outline"
              as="a"
              href={`/marketplace?academy=${academy.slug}`}
              target="_blank"
            >
              {isArabic ? "معاينة الصفحة العامة" : "Preview Public Page"}
            </Button>
          )
        }
      />
      <form className="admin-settings-form" onSubmit={submit}>
        <section>
          <h2>{isArabic ? "الهوية العامة والعلامة التجارية" : "Public Brand Identity"}</h2>
          <div className="admin-cover-placeholder">
            <Image style={{ width: 28, height: 28, color: "var(--primary)" }} />
            <div>
              <strong>{isArabic ? "غلاف وشعار الأكاديمية" : "Academy Logo & Cover"}</strong>
              <span>{isArabic ? "يمكنك ربط الشعار والغلاف الرسمي لزيادة ثقة الطلاب في صفحة الشراء." : "Link your official branding and cover banner to build student trust."}</span>
            </div>
            <Button variant="ghost" type="button">{isArabic ? "اختيار صورة" : "Choose Image"}</Button>
          </div>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "اسم الأكاديمية بالعربية" : "Academy Name (Arabic)"}>
              <input name="nameAr" defaultValue={academy?.nameAr || activeOrganization?.name || ""} required />
            </FormField>
            <FormField label={isArabic ? "الاسم بالإنجليزية (Slug/Search)" : "Academy Name (English)"}>
              <input name="name" defaultValue={academy?.name || activeOrganization?.name || ""} required />
            </FormField>
            <FormField label={isArabic ? "رابط الصفحة المخصص (Slug)" : "Custom URL Slug"}>
              <input name="slug" defaultValue={academy?.slug || "academy-name"} pattern="[a-z0-9-]+" required dir="ltr" />
            </FormField>
            <FormField label={isArabic ? "المقر الرئيسي / المدينة" : "Headquarters / City"}>
              <input name="location" defaultValue={academy?.location || (isArabic ? "القاهرة، مصر" : "Cairo, Egypt")} required />
            </FormField>
          </div>
          <FormField label={isArabic ? "نبذة تعريفية بالأكاديمية (بالعربية)" : "About Academy (Arabic)"}>
            <textarea
              name="descriptionAr"
              rows={3}
              defaultValue={academy?.descriptionAr || ""}
              placeholder={isArabic ? "اكتب نبذة عن التخصصات والمدرسين والشهادات المقدمة..." : "About specializations, teachers, certificates..."}
              required
            />
          </FormField>
          <FormField label={isArabic ? "نبذة تعريفية بالإنجليزية" : "About Academy (English)"}>
            <textarea
              name="description"
              rows={3}
              defaultValue={academy?.description || ""}
              placeholder="Brief description about courses, programs, and certifications..."
              required
              dir="ltr"
            />
          </FormField>
        </section>

        <section>
          <h2>{isArabic ? "بيانات التواصل والظهور للجمهور" : "Contact & Public Visibility"}</h2>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "رقم هاتف / واتساب الدعم" : "Support Phone / WhatsApp"}>
              <input name="phone" defaultValue={academy?.phone || ""} required dir="ltr" />
            </FormField>
            <FormField label={isArabic ? "البريد الإلكتروني الرسمي" : "Official Email"}>
              <input name="email" type="email" defaultValue={academy?.email || activeOrganization?.email || ""} required dir="ltr" />
            </FormField>
            <FormField label={isArabic ? "الموقع الإلكتروني الرسمي" : "Official Website"}>
              <input name="website" defaultValue={academy?.website || "https://ain-learning.com"} dir="ltr" />
            </FormField>
          </div>
          <label className="learning-check" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input name="public" type="checkbox" defaultChecked={academy?.public !== false} />
            <span>{isArabic ? "نشر صفحة الأكاديمية في دليل المنصة العام ومحركات البحث للطلاب الجدد" : "Publish academy storefront in the public marketplace and search engines"}</span>
          </label>
        </section>

        <footer>
          <Button type="submit">{isArabic ? "حفظ التغييرات" : "Save Changes"}</Button>
        </footer>
      </form>
    </div>
  );
}

export function InstructorsManagementPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
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
      showToast(isArabic ? "تمت إضافة المدرس بنجاح" : "Instructor added successfully", "success");
    } catch (error) {
      showToast(error.message || (isArabic ? "تعذر إضافة المدرس" : "Failed to add instructor"), "error");
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
      showToast(isArabic ? "تم نشر الموعد للحجز" : "Booking slot published successfully", "success");
    } catch (error) {
      showToast(error.message || (isArabic ? "تعذر إضافة الموعد" : "Failed to create slot"), "error");
    }
  };

  return (
    <>
      <PageHead
        title={isArabic ? "المدرسون" : "Instructors"}
        description={isArabic ? "أنشئ ملفات المدرسين وانشر المواعيد التي يستطيع الطلاب حجزها." : "Create instructor profiles and publish booking availability for students."}
        action={
          <div className="learning-actions">
            <Button variant="ghost" onClick={() => setSlotOpen(true)}><Plus />{isArabic ? "موعد متاح" : "Add Slot"}</Button>
            <Button onClick={() => setOpen(true)}><Plus />{isArabic ? "مدرس جديد" : "New Instructor"}</Button>
          </div>
        }
      />
      <section className="admin-people-grid">
        {visible.map((item) => (
          <article key={item.id}>
            <span>{item.initials}</span>
            <div>
              <h2>{label(item, isArabic)}</h2>
              <strong>{item.specialty}</strong>
              <p>{item.bio}</p>
              <small>{slots.filter((slot) => slot.instructorId === item.id && slot.status === "open").length} {isArabic ? "مواعيد متاحة" : "slots available"}</small>
            </div>
            <button type="button" onClick={async () => {
              try {
                await update("instructors", item.id, { ...item, active: !item.active });
              } catch (error) {
                showToast(error.message, "error");
              }
            }}>
              <Badge tone={item.active ? "success" : "neutral"}>{item.active ? (isArabic ? "نشط" : "Active") : (isArabic ? "موقوف" : "Inactive")}</Badge>
            </button>
          </article>
        ))}
        {visible.length === 0 && (
          <div className="attendance-empty" style={{ gridColumn: "1 / -1", padding: "40px 20px" }}>
            <Users />
            <strong>{isArabic ? "لا يوجد مدرسون مضافون بعد" : "No instructors added yet"}</strong>
            <span>{isArabic ? "أضف مدرسك الأول لنشر المحاضرات وتوفير مواعيد حجز فردية." : "Add your first instructor to publish courses and open 1-on-1 booking slots."}</span>
          </div>
        )}
      </section>
      <Modal title={isArabic ? "إضافة مدرس" : "Add Instructor"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "الاسم بالإنجليزية" : "English Name"}><input name="name" required /></FormField>
            <FormField label={isArabic ? "الاسم بالعربية" : "Arabic Name"}><input name="nameAr" required /></FormField>
            <FormField label={isArabic ? "التخصص" : "Specialty"}><input name="specialty" required /></FormField>
          </div>
          <FormField label={isArabic ? "نبذة" : "Biography"}><textarea name="bio" required /></FormField>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "إضافة المدرس" : "Add Instructor"}</Button></div>
        </form>
      </Modal>
      <Modal title={isArabic ? "إضافة موعد متاح للحجز" : "Add Booking Availability"} open={slotOpen} onClose={() => setSlotOpen(false)}>
        <form className="learning-form" onSubmit={submitSlot}>
          <FormField label={isArabic ? "المدرس" : "Instructor"}>
            <select name="instructorId" required>
              {visible.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{label(item, isArabic)}</option>)}
            </select>
          </FormField>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "بداية الحصة" : "Start Time"}><input name="startsAt" type="datetime-local" required /></FormField>
            <FormField label={isArabic ? "نهاية الحصة" : "End Time"}><input name="endsAt" type="datetime-local" required /></FormField>
            <FormField label={isArabic ? "نوع الحصة" : "Delivery Type"}>
              <select name="deliveryType">
                <option value="online">{isArabic ? "أونلاين" : "Online"}</option>
                <option value="onsite">{isArabic ? "حضوري" : "On-site"}</option>
              </select>
            </FormField>
            <FormField label={isArabic ? "السعر بالجنيه" : "Price (EGP)"}><input name="price" type="number" min="0" required /></FormField>
          </div>
          <FormField label={isArabic ? "المكان أو رابط الاجتماع" : "Location or Meeting URL"}><input name="location" /></FormField>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "نشر الموعد" : "Publish Slot"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function CourseWizardPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { academies, categories, instructors, courses, add, update } = useMarketplace();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", titleAr: "", shortDescriptionAr: "", descriptionAr: "", categoryId: categories[0]?.id || "", level: "", subject: "", instructorId: "", deliveryType: "online", price: 0, discountedPrice: "", duration: "", sessions: 8, learningOutcomes: "", requirements: "", roomId: "", status: "draft" });
  const courseSteps = isArabic
    ? ["المعلومات", "طريقة التقديم", "السعر", "تفاصيل المحتوى", "الوصول", "المراجعة"]
    : ["Information", "Delivery", "Pricing", "Content", "Access", "Review"];
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
  const reset = () => {
    const saved = window.sessionStorage.getItem(draftKey);
    if (saved) {
      const draft = JSON.parse(saved);
      setForm(draft.form);
      setStep(draft.step || 0);
    } else {
      setStep(0);
      setForm({ title: "", titleAr: "", shortDescriptionAr: "", descriptionAr: "", categoryId: categories[0]?.id || "", level: "", subject: "", instructorId: orgInstructors[0]?.id || "", deliveryType: "online", price: 0, discountedPrice: "", duration: "", sessions: 8, learningOutcomes: "", requirements: "", roomId: "", status: "draft" });
    }
    setEditing("new");
  };

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
      showToast(status === "draft" ? (isArabic ? "تم حفظ المسودة" : "Draft saved") : (isArabic ? "تم إرسال الكورس للمراجعة" : "Course submitted for review"), "success");
    } catch (error) {
      showToast(error.message || (isArabic ? "تعذر حفظ الكورس" : "Failed to save course"), "error");
    }
  };

  return (
    <>
      <PageHead
        title={isArabic ? "إدارة الكورسات" : "Course Management"}
        description={isArabic ? "أنشئ كورسًا كاملًا واحفظه كمسودة أو أرسله لمراجعة المنصة." : "Create courses, save drafts, and submit for platform review."}
        action={<Button onClick={reset}><Plus />{isArabic ? "إنشاء كورس" : "Create Course"}</Button>}
      />
      {editing ? (
        <section className="course-wizard">
          <ol>
            {courseSteps.map((item, index) => (
              <li className={index === step ? "active" : index < step ? "done" : ""} key={item}>
                <span>{index < step ? <Check /> : index + 1}</span>{item}
              </li>
            ))}
          </ol>
          <div className="course-wizard-panel">
            {step === 0 && (
              <>
                <h2>{isArabic ? "المعلومات الأساسية" : "Basic Information"}</h2>
                <div className="learning-form-grid">
                  <FormField label={isArabic ? "اسم الكورس بالإنجليزية" : "Course Title (English)"}><input value={form.title} onChange={(e) => change("title", e.target.value)} required /></FormField>
                  <FormField label={isArabic ? "اسم الكورس بالعربية" : "Course Title (Arabic)"}><input value={form.titleAr} onChange={(e) => change("titleAr", e.target.value)} required /></FormField>
                  <FormField label={isArabic ? "التصنيف" : "Category"}><select value={form.categoryId} onChange={(e) => change("categoryId", e.target.value)}>{categories.map((item) => <option value={item.id} key={item.id}>{label(item, isArabic)}</option>)}</select></FormField>
                  <FormField label={isArabic ? "المدرس" : "Instructor"}><select value={form.instructorId} onChange={(e) => change("instructorId", e.target.value)}><option value="">{isArabic ? "فريق الأكاديمية" : "Academy Team"}</option>{orgInstructors.map((item) => <option value={item.id} key={item.id}>{label(item, isArabic)}</option>)}</select></FormField>
                  <FormField label={isArabic ? "المرحلة / المستوى" : "Level"}><input value={form.level} onChange={(e) => change("level", e.target.value)} /></FormField>
                  <FormField label={isArabic ? "المادة" : "Subject"}><input value={form.subject} onChange={(e) => change("subject", e.target.value)} /></FormField>
                </div>
                <FormField label={isArabic ? "وصف مختصر" : "Short Description"}><textarea value={form.shortDescriptionAr} onChange={(e) => change("shortDescriptionAr", e.target.value)} /></FormField>
              </>
            )}
            {step === 1 && (
              <>
                <h2>{isArabic ? "طريقة تقديم الكورس" : "Delivery Method"}</h2>
                <div className="choice-grid">
                  {["online", "offline", "hybrid", "recorded"].map((item) => (
                    <button className={form.deliveryType === item ? "active" : ""} onClick={() => change("deliveryType", item)} key={item} type="button">
                      <GraduationCap />
                      <strong>{item}</strong>
                      <span>{isArabic ? "إعداد مناسب لطريقة الحضور المختارة" : "Configured for selected delivery method"}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h2>{isArabic ? "السعر والعروض" : "Pricing & Offers"}</h2>
                <div className="learning-form-grid">
                  <FormField label={isArabic ? "السعر بالجنيه" : "Price (EGP)"}><input type="number" min="0" value={form.price} onChange={(e) => change("price", e.target.value)} /></FormField>
                  <FormField label={isArabic ? "سعر الخصم (اختياري)" : "Discounted Price (Optional)"}><input type="number" min="0" value={form.discountedPrice} onChange={(e) => change("discountedPrice", e.target.value)} /></FormField>
                </div>
                <div className="wizard-note"><ShieldCheck />{isArabic ? "الدفع الإلكتروني غير مفعل في النسخة التجريبية. الحجز يعمل بنظام احجز الآن وادفع لاحقًا." : "Online checkout in demo mode uses book-now-pay-later model."}</div>
              </>
            )}
            {step === 3 && (
              <>
                <h2>{isArabic ? "تفاصيل المحتوى" : "Curriculum & Details"}</h2>
                <FormField label={isArabic ? "الوصف الكامل" : "Full Description"}><textarea value={form.descriptionAr} onChange={(e) => change("descriptionAr", e.target.value)} /></FormField>
                <div className="learning-form-grid">
                  <FormField label={isArabic ? "المدة" : "Duration"}><input value={form.duration} onChange={(e) => change("duration", e.target.value)} placeholder={isArabic ? "8 أسابيع" : "8 weeks"} /></FormField>
                  <FormField label={isArabic ? "عدد الحصص" : "Number of Sessions"}><input type="number" min="1" value={form.sessions} onChange={(e) => change("sessions", e.target.value)} /></FormField>
                </div>
                <FormField label={isArabic ? "نواتج التعلم - سطر لكل عنصر" : "Learning Outcomes (one per line)"}><textarea value={form.learningOutcomes} onChange={(e) => change("learningOutcomes", e.target.value)} /></FormField>
                <FormField label={isArabic ? "المتطلبات - سطر لكل عنصر" : "Requirements (one per line)"}><textarea value={form.requirements} onChange={(e) => change("requirements", e.target.value)} /></FormField>
              </>
            )}
            {step === 4 && (
              <>
                <h2>{isArabic ? "الوصول والروم" : "Room & Access"}</h2>
                <FormField label={isArabic ? "رقم أو اسم الروم المرتبطة" : "Associated Room ID/Name"}><input value={form.roomId} onChange={(e) => change("roomId", e.target.value)} placeholder={isArabic ? "سيتم إنشاء روم عند إضافة الدفعة إذا تركته فارغًا" : "Leave blank to auto-create room when batch is created"} /></FormField>
                <div className="wizard-note"><LockKeyhole />{isArabic ? "بعد تأكيد الحجز سيُنشأ Enrollment واشتراك وعضوية في روم الدفعة تلقائيًا." : "After booking confirmation, enrollment, subscription, and room membership are provisioned automatically."}</div>
              </>
            )}
            {step === 5 && (
              <>
                <h2>{isArabic ? "المراجعة والنشر" : "Review & Publish"}</h2>
                <div className="wizard-review">
                  <span><small>{isArabic ? "الكورس" : "Course"}</small><strong>{(isArabic ? form.titleAr : form.title) || form.title || form.titleAr || (isArabic ? "بدون عنوان" : "Untitled")}</strong></span>
                  <span><small>{isArabic ? "النوع" : "Delivery"}</small><strong>{form.deliveryType}</strong></span>
                  <span><small>{isArabic ? "السعر" : "Price"}</small><strong>{Number(form.discountedPrice || form.price).toLocaleString()} {isArabic ? "ج.م" : "EGP"}</strong></span>
                  <span><small>{isArabic ? "الحالة التالية" : "Next Status"}</small><strong>{isArabic ? "قيد مراجعة المنصة" : "Pending Platform Review"}</strong></span>
                </div>
                <article className="course-wizard-preview">
                  <div><BookOpen /></div>
                  <span>{label(categories.find((item) => item.id === form.categoryId), isArabic)} · {form.level}</span>
                  <h3>{(isArabic ? form.titleAr : form.title) || form.title || form.titleAr || (isArabic ? "اسم الكورس" : "Course Title")}</h3>
                  <p>{form.shortDescriptionAr || (isArabic ? "سيظهر وصف الكورس المختصر هنا." : "Short course description will appear here.")}</p>
                  <strong>{Number(form.discountedPrice || form.price).toLocaleString()} {isArabic ? "ج.م" : "EGP"}</strong>
                </article>
              </>
            )}
            <footer>
              <Button variant="ghost" onClick={() => step ? setStep(step - 1) : setEditing(null)}>{step ? (isArabic ? "السابق" : "Back") : (isArabic ? "إلغاء" : "Cancel")}</Button>
              <div>
                <Button variant="ghost" onClick={() => save("draft")}>{isArabic ? "حفظ كمسودة" : "Save as Draft"}</Button>
                {step < courseSteps.length - 1 ? (
                  <Button disabled={step === 0 && (!form.title || !form.titleAr)} onClick={() => setStep(step + 1)}>{isArabic ? "التالي" : "Next"}</Button>
                ) : (
                  <Button onClick={() => save("pending_review")}><Send />{isArabic ? "إرسال للمراجعة" : "Submit for Review"}</Button>
                )}
              </div>
            </footer>
          </div>
        </section>
      ) : (
        <section className="admin-course-table">
          <table>
            <thead>
              <tr>
                <th>{isArabic ? "الكورس" : "Course"}</th>
                <th>{isArabic ? "التصنيف" : "Category"}</th>
                <th>{isArabic ? "طريقة التقديم" : "Delivery"}</th>
                <th>{isArabic ? "السعر" : "Price"}</th>
                <th>{isArabic ? "الحالة" : "Status"}</th>
                <th>{isArabic ? "الإجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {orgCourses.map((item) => (
                <tr key={item.id}>
                  <td><strong>{label(item, isArabic)}</strong><small>{item.subject} · {item.level}</small></td>
                  <td>{label(categories.find((cat) => cat.id === item.categoryId), isArabic)}</td>
                  <td>{item.deliveryType}</td>
                  <td>{item.price?.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</td>
                  <td><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge></td>
                  <td>
                    <Button variant="ghost" onClick={() => {
                      setEditing(item.id);
                      setForm({ ...form, ...item, learningOutcomes: item.learningOutcomes?.join("\n") || "", requirements: item.requirements?.join("\n") || "" });
                    }}><Pencil />{isArabic ? "تعديل" : "Edit"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

export function MarketplaceBatchesPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { courses, batches, add } = useMarketplace();
  const { rooms } = useWorkspace();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const orgCourses = courses.filter((item) => item.organizationId === activeOrganization?.id);
  const visible = batches.filter((item) => item.organizationId === activeOrganization?.id);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
      showToast(isArabic ? "تم إنشاء الدفعة وربطها بالروم" : "Cohort created and linked to room", "success");
    } catch (error) {
      showToast(error.message || (isArabic ? "تعذر إنشاء الدفعة" : "Failed to create cohort"), "error");
    }
  };

  return (
    <>
      <PageHead
        title={isArabic ? "الدفعات والمجموعات" : "Cohorts & Batches"}
        description={isArabic ? "كل دفعة لها موعد وسعة وروم تعليمية مستقلة مرتبطة بالحجوزات." : "Each cohort has its own schedule, seat capacity, and learning room."}
        action={<Button onClick={() => setOpen(true)} disabled={!rooms.length}><Plus />{isArabic ? "دفعة جديدة" : "New Cohort"}</Button>}
      />
      <section className="learning-list">
        {visible.map((batch) => {
          const course = courses.find((item) => item.id === batch.courseId);
          const used = batch.confirmedSeats + batch.reservedSeats;
          const percent = Math.min(100, Math.round((used / batch.capacity) * 100));
          const schedule = Array.isArray(batch.schedule) ? batch.schedule.map((item) => `${item.day} ${item.startTime}-${item.endTime}`).join(isArabic ? "، " : ", ") : batch.schedule;
          return (
            <article className="learning-batch-row" key={batch.id}>
              <div className="learning-card-icon"><Users /></div>
              <div>
                <Badge tone={batch.status === "open" ? "success" : "neutral"}>{batch.status}</Badge>
                <h2>{label(batch, isArabic)}</h2>
                <p>{label(course, isArabic)} · {schedule} · {batch.location}</p>
                <small>{batch.startDate} → {batch.endDate} · Room: {batch.room?.name || batch.roomName || "-"}</small>
              </div>
              <div className="learning-capacity">
                <div><span>{used}/{batch.capacity} {isArabic ? "مقعد" : "seats"}</span><small>{percent}%</small></div>
                <progress max="100" value={percent} />
              </div>
            </article>
          );
        })}
      </section>
      {!rooms.length && (
        <section className="learning-empty-state">
          <LockKeyhole />
          <h2>{isArabic ? "أنشئ روم أولاً" : "Create a room first"}</h2>
          <p>{isArabic ? "كل دفعة يجب أن ترتبط بروم حقيقية لحماية المحتوى وإضافة الطلاب بعد التأكيد." : "Every batch must link to a real room to protect content and enroll students."}</p>
        </section>
      )}
      <Modal title={isArabic ? "إنشاء دفعة" : "Create Cohort"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <FormField label={isArabic ? "الكورس" : "Course"}>
            <select name="courseId" required>
              {orgCourses.map((item) => <option value={item.id} key={item.id}>{label(item, isArabic)}</option>)}
            </select>
          </FormField>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "اسم الدفعة بالإنجليزية" : "Batch Title (English)"}><input name="title" required /></FormField>
            <FormField label={isArabic ? "اسم الدفعة بالعربية" : "Batch Title (Arabic)"}><input name="titleAr" required /></FormField>
            <FormField label={isArabic ? "تاريخ البداية" : "Start Date"}><input name="startDate" type="date" required /></FormField>
            <FormField label={isArabic ? "تاريخ النهاية" : "End Date"}><input name="endDate" type="date" required /></FormField>
            <FormField label={isArabic ? "اليوم" : "Day"}>
              <select name="day">
                <option value="Sunday">{isArabic ? "الأحد" : "Sunday"}</option>
                <option value="Monday">{isArabic ? "الاثنين" : "Monday"}</option>
                <option value="Tuesday">{isArabic ? "الثلاثاء" : "Tuesday"}</option>
                <option value="Wednesday">{isArabic ? "الأربعاء" : "Wednesday"}</option>
                <option value="Thursday">{isArabic ? "الخميس" : "Thursday"}</option>
                <option value="Friday">{isArabic ? "الجمعة" : "Friday"}</option>
                <option value="Saturday">{isArabic ? "السبت" : "Saturday"}</option>
              </select>
            </FormField>
            <FormField label={isArabic ? "من" : "From"}><input name="startTime" type="time" required /></FormField>
            <FormField label={isArabic ? "إلى" : "To"}><input name="endTime" type="time" required /></FormField>
            <FormField label={isArabic ? "نوع التقديم" : "Delivery"}>
              <select name="deliveryType">
                <option value="online">{isArabic ? "أونلاين" : "Online"}</option>
                <option value="offline">{isArabic ? "حضوري" : "Onsite"}</option>
                <option value="hybrid">{isArabic ? "هجين" : "Hybrid"}</option>
                <option value="recorded">{isArabic ? "مسجل" : "Recorded"}</option>
              </select>
            </FormField>
            <FormField label={isArabic ? "السعة" : "Capacity"}><input name="capacity" type="number" min="1" defaultValue="25" required /></FormField>
            <FormField label={isArabic ? "الروم" : "Room"}><select name="roomId" required>{rooms.map((room) => <option value={room.id} key={room.id}>{room.name}</option>)}</select></FormField>
            <FormField label={isArabic ? "المكان / Online" : "Location / Online"}><input name="location" /></FormField>
          </div>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "إنشاء الدفعة" : "Create Batch"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function MarketplaceBookingsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
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
    showToast(result.ok ? action === "confirm" ? (isArabic ? "تم التأكيد وإنشاء الاشتراك وعضوية الروم" : "Confirmed: enrollment, subscription, and room membership created") : action === "cancel" ? (isArabic ? "تم إلغاء الحجز وتحديث الوصول" : "Booking cancelled and access revoked") : (isArabic ? "تم رفض الحجز" : "Booking rejected") : result.error?.message || (isArabic ? "تعذر تنفيذ الإجراء" : "Failed to execute action"), result.ok ? "success" : "error");
    return result;
  };

  const openDetails = (item) => { setSelected(item); setInternalNote(item.internalNote || ""); };
  const finishFromModal = async (action, payload = {}) => {
    const result = await act(selected.id, action, { internalNote, ...payload });
    if (result.ok) setSelected(null);
  };

  return (
    <>
      <PageHead
        title={isArabic ? "إدارة الحجوزات" : "Bookings & Requests"}
        description={isArabic ? "تأكيد الحجز ينشئ Enrollment واشتراكًا وعضوية روم دون تكرار." : "Confirming requests provisions enrollment, subscriptions, and room access."}
      />
      <div className="admin-filter-bar">
        <label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isArabic ? "ابحث باسم الطالب" : "Search student by name"} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{isArabic ? "كل الحالات" : "All Statuses"}</option>
          <option value="pending_confirmation">{isArabic ? "قيد التأكيد" : "Pending Confirmation"}</option>
          <option value="confirmed">{isArabic ? "مؤكد" : "Confirmed"}</option>
          <option value="rejected">{isArabic ? "مرفوض" : "Rejected"}</option>
          <option value="cancelled">{isArabic ? "ملغي" : "Cancelled"}</option>
        </select>
      </div>
      <section className="admin-course-table">
        <table>
          <thead>
            <tr>
              <th>{isArabic ? "الطالب" : "Student"}</th>
              <th>{isArabic ? "الكورس / الدفعة" : "Course / Cohort"}</th>
              <th>{isArabic ? "المبلغ" : "Amount"}</th>
              <th>{isArabic ? "الحالة" : "Status"}</th>
              <th>{isArabic ? "الوصول" : "Access"}</th>
              <th>{isArabic ? "الإجراء" : "Action"}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const enrollment = enrollments.find((e) => e.bookingId === item.id);
              return (
                <tr key={item.id}>
                  <td><strong>{item.studentName}</strong><small>{item.email}<br />{item.phone}</small></td>
                  <td><strong>{label(courses.find((x) => x.id === item.courseId), isArabic)}</strong><small>{label(batches.find((x) => x.id === item.batchId), isArabic)}</small></td>
                  <td>{item.amount?.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</td>
                  <td><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge></td>
                  <td>{enrollment ? <Badge tone="success">{isArabic ? "Enrollment نشط" : "Active Enrollment"}</Badge> : <span className="learning-muted">{isArabic ? "لم يُنشأ بعد" : "Not provisioned"}</span>}</td>
                  <td>
                    <div className="learning-actions">
                      <Button variant="ghost" onClick={() => openDetails(item)}>{isArabic ? "التفاصيل" : "Details"}</Button>
                      {item.status === "pending_confirmation" && (
                        <>
                          <Button onClick={() => act(item.id, "confirm")}><Check />{isArabic ? "تأكيد" : "Confirm"}</Button>
                          <Button variant="ghost" onClick={() => act(item.id, "reject")}><X />{isArabic ? "رفض" : "Reject"}</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <div className="operation-proof">
        <span><strong>{enrollments.filter((x) => x.organizationId === activeOrganization?.id).length}</strong> Enrollments</span>
        <span><strong>{subscriptions.filter((x) => x.organizationId === activeOrganization?.id).length}</strong> Subscriptions</span>
        <span><strong>{roomMemberships.filter((x) => x.organizationId === activeOrganization?.id).length}</strong> Room memberships</span>
      </div>
      <Modal title={isArabic ? "تفاصيل طلب الحجز" : "Booking Request Details"} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div className="booking-detail-modal">
            <div>
              <span>{isArabic ? "الطالب" : "Student"}<strong>{selected.studentName}</strong></span>
              <span>{isArabic ? "البريد" : "Email"}<strong>{selected.email}</strong></span>
              <span>{isArabic ? "الهاتف" : "Phone"}<strong>{selected.phone}</strong></span>
              <span>{isArabic ? "المبلغ" : "Amount"}<strong>{selected.amount?.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</strong></span>
            </div>
            <FormField label={isArabic ? "ملاحظة داخلية" : "Internal Note"}><textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /></FormField>
            <footer>
              {selected.status === "pending_confirmation" && (
                <>
                  <Button variant="ghost" onClick={() => finishFromModal("confirm", { markAsPaid: true })}>{isArabic ? "تأكيد كمدفوع" : "Confirm as Paid"}</Button>
                  <Button onClick={() => finishFromModal("confirm")}>{isArabic ? "تأكيد الحجز" : "Confirm Booking"}</Button>
                  <Button variant="ghost" onClick={() => finishFromModal("reject")}>{isArabic ? "رفض" : "Reject"}</Button>
                </>
              )}
              {selected.status === "confirmed" && <Button variant="ghost" onClick={() => finishFromModal("cancel")}>{isArabic ? "إلغاء الحجز" : "Cancel Booking"}</Button>}
            </footer>
          </div>
        )}
      </Modal>
    </>
  );
}

export function InvitationsManagementPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { invitations, add, update } = useMarketplace();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const visible = invitations.filter((item) => item.organizationId === activeOrganization?.id);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await add("invitations", "invite", {
        organizationId: activeOrganization.id,
        email: form.get("email"),
        role: form.get("role"),
        roomIds: [],
        expiresInDays: Number(form.get("days"))
      });
      setOpen(false);
      showToast(isArabic ? "تم إرسال الدعوة" : "Invitation sent successfully", "success");
    } catch (error) {
      showToast(error.message || (isArabic ? "تعذر إرسال الدعوة" : "Failed to send invite"), "error");
    }
  };

  const copy = (id) => {
    navigator.clipboard?.writeText(`${location.origin}/invite/${id}`);
    showToast(isArabic ? "تم نسخ رابط الدعوة" : "Invitation link copied", "success");
  };

  return (
    <>
      <PageHead
        title={isArabic ? "إدارة الدعوات" : "Invitations"}
        description={isArabic ? "تابع الدعوات المعلقة والمقبولة والمنتهية وأعد إرسالها بأمان." : "Manage pending, accepted, and expired workspace invitations."}
        action={<Button onClick={() => setOpen(true)}><Plus />{isArabic ? "دعوة جديدة" : "New Invite"}</Button>}
      />
      <section className="invitation-list">
        {visible.map((item) => (
          <article key={item.id}>
            <span className="invitation-icon"><Mail /></span>
            <div>
              <strong>{item.email}</strong>
              <small>{item.role} · {isArabic ? `تنتهي ${item.expiresAt}` : `Expires ${item.expiresAt}`}</small>
            </div>
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            <div className="learning-actions">
              <button title={isArabic ? "نسخ الرابط" : "Copy Link"} onClick={() => copy(item.id)}><Copy /></button>
              {item.status !== "accepted" && (
                <button title={isArabic ? "إعادة الإرسال" : "Resend"} onClick={async () => {
                  try {
                    await update("invitations", item.id, { action: "resend" });
                    showToast(isArabic ? "تمت إعادة إرسال الدعوة" : "Invitation resent", "success");
                  } catch (error) {
                    showToast(error.message, "error");
                  }
                }}><RefreshCw /></button>
              )}
              {item.status === "pending" && (
                <button title={isArabic ? "إلغاء" : "Cancel"} onClick={async () => {
                  try {
                    await update("invitations", item.id, { status: "cancelled" });
                    showToast(isArabic ? "تم إلغاء الدعوة" : "Invitation cancelled", "success");
                  } catch (error) {
                    showToast(error.message, "error");
                  }
                }}><Ban /></button>
              )}
            </div>
          </article>
        ))}
      </section>
      <Modal title={isArabic ? "دعوة عضو" : "Invite Member"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <FormField label={isArabic ? "البريد الإلكتروني" : "Email Address"}><input type="email" name="email" required /></FormField>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "الدور" : "Role"}>
              <select name="role">
                <option value="student">{isArabic ? "طالب" : "Student"}</option>
                <option value="instructor">{isArabic ? "مدرس" : "Instructor"}</option>
                <option value="staff">{isArabic ? "موظف" : "Staff"}</option>
                <option value="organization_admin">{isArabic ? "مدير" : "Admin"}</option>
              </select>
            </FormField>
            <FormField label={isArabic ? "مدة صلاحية الدعوة" : "Invitation Expiry"}>
              <select name="days">
                <option value="7">{isArabic ? "7 أيام" : "7 days"}</option>
                <option value="14">{isArabic ? "14 يومًا" : "14 days"}</option>
                <option value="30">{isArabic ? "30 يومًا" : "30 days"}</option>
              </select>
            </FormField>
          </div>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "إرسال الدعوة" : "Send Invitation"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function PromotionsManagementPage({ platform = false }) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { promotions, courses, add, update } = useMarketplace();
  const [open, setOpen] = useState(false);
  const visible = platform ? promotions : promotions.filter((item) => item.organizationId === activeOrganization?.id);

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + Number(form.get("duration")));
    add("promotions", "promotion", {
      organizationId: activeOrganization.id,
      courseId: form.get("courseId"),
      type: form.get("type"),
      placement: form.get("placement"),
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      status: "pending_approval",
      paymentStatus: "unpaid",
      impressions: 0,
      clicks: 0,
      bookingConversions: 0
    });
    setOpen(false);
  };

  return (
    <>
      <PageHead
        title={platform ? (isArabic ? "مراجعة الإعلانات الممولة" : "Sponsored Ads Review") : (isArabic ? "الحملات والإعلانات" : "Campaigns & Promotions")}
        description={platform ? (isArabic ? "راجع أماكن ظهور الإعلانات ووافق عليها أو ارفضها." : "Review ad placements, approve or decline them.") : (isArabic ? "اطلب إبراز كورس أو أكاديمية داخل الـMarketplace." : "Feature your courses or academy on the marketplace.")}
        action={!platform && <Button onClick={() => setOpen(true)}><Plus />{isArabic ? "حملة جديدة" : "New Campaign"}</Button>}
      />
      <section className="promotion-grid">
        {visible.map((item) => (
          <article key={item.id}>
            <header><span><Megaphone /></span><Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge></header>
            <h2>{label(courses.find((course) => course.id === item.courseId), isArabic)}</h2>
            <p>{item.type} · {item.placement}</p>
            <div>
              <span><small>{isArabic ? "المشاهدات" : "Views"}</small><strong>{item.impressions}</strong></span>
              <span><small>{isArabic ? "النقرات" : "Clicks"}</small><strong>{item.clicks}</strong></span>
              <span><small>{isArabic ? "الحجوزات" : "Bookings"}</small><strong>{item.bookingConversions}</strong></span>
            </div>
            <footer>
              <span>{item.startDate} → {item.endDate}</span>
              {platform && item.status === "pending_approval" && (
                <div className="learning-actions">
                  <Button onClick={() => update("promotions", item.id, { status: "approved" })}>{isArabic ? "موافقة" : "Approve"}</Button>
                  <Button variant="ghost" onClick={() => update("promotions", item.id, { status: "rejected" })}>{isArabic ? "رفض" : "Reject"}</Button>
                </div>
              )}
            </footer>
          </article>
        ))}
      </section>
      <Modal title={isArabic ? "طلب حملة ممولة" : "Request Campaign"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <FormField label={isArabic ? "الكورس" : "Course"}>
            <select name="courseId">
              {courses.filter((item) => item.organizationId === activeOrganization?.id && item.status === "published").map((item) => <option value={item.id} key={item.id}>{label(item, isArabic)}</option>)}
            </select>
          </FormField>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "نوع الحملة" : "Campaign Type"}>
              <select name="type">
                <option value="featured_course">{isArabic ? "كورس مميز" : "Featured Course"}</option>
                <option value="homepage_banner">{isArabic ? "بانر الرئيسية" : "Homepage Banner"}</option>
                <option value="search_boost">{isArabic ? "تعزيز البحث" : "Search Boost"}</option>
              </select>
            </FormField>
            <FormField label={isArabic ? "مكان الظهور" : "Placement"}>
              <select name="placement">
                <option value="homepage">{isArabic ? "الرئيسية" : "Homepage"}</option>
                <option value="courses">{isArabic ? "صفحة الكورسات" : "Courses Page"}</option>
                <option value="category">{isArabic ? "صفحة التصنيف" : "Category Page"}</option>
              </select>
            </FormField>
            <FormField label={isArabic ? "المدة" : "Duration"}>
              <select name="duration">
                <option value="7">{isArabic ? "7 أيام" : "7 days"}</option>
                <option value="14">{isArabic ? "14 يومًا" : "14 days"}</option>
                <option value="30">{isArabic ? "30 يومًا" : "30 days"}</option>
              </select>
            </FormField>
          </div>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "إرسال للمراجعة" : "Submit for Review"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

export function CourseApprovalsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { courses, academies, update } = useMarketplace();
  const [selected, setSelected] = useState(null);
  const pending = courses.filter((item) => ["pending_review", "rejected"].includes(item.status));

  return (
    <>
      <PageHead
        title={isArabic ? "مراجعة الكورسات" : "Course Approvals"}
        description={isArabic ? "لا يظهر أي كورس للعامة قبل الموافقة عليه." : "Courses remain hidden from the marketplace until approved."}
      />
      <section className="moderation-list">
        {pending.map((item) => (
          <article key={item.id}>
            <div className="learning-card-icon"><BookOpen /></div>
            <div>
              <h2>{label(item, isArabic)}</h2>
              <p>{label(academies.find((a) => a.id === item.academyId), isArabic)} · {item.subject} · {item.deliveryType}</p>
            </div>
            <Badge tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Badge>
            <Button variant="ghost" onClick={() => setSelected(item)}>{isArabic ? "مراجعة" : "Review"}</Button>
          </article>
        ))}
      </section>
      <Modal title={isArabic ? "مراجعة الكورس" : "Review Course"} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div className="moderation-detail">
            <h2>{label(selected, isArabic)}</h2>
            <p>{selected.descriptionAr || selected.description}</p>
            <div>
              <span>{isArabic ? "السعر" : "Price"}<strong>{selected.price?.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</strong></span>
              <span>{isArabic ? "عدد الحصص" : "Sessions"}<strong>{selected.sessions}</strong></span>
              <span>{isArabic ? "طريقة التقديم" : "Delivery"}<strong>{selected.deliveryType}</strong></span>
            </div>
            <footer>
              <Button onClick={() => { update("courses", selected.id, { status: "published" }); setSelected(null); }}><Check />{isArabic ? "موافقة ونشر" : "Approve & Publish"}</Button>
              <Button variant="ghost" onClick={() => { update("courses", selected.id, { status: "rejected", rejectionReason: isArabic ? "يرجى استكمال الوصف وبيانات المدرس" : "Please complete course description and instructor profile" }); setSelected(null); }}><X />{isArabic ? "رفض مع ملاحظة" : "Reject with note"}</Button>
            </footer>
          </div>
        )}
      </Modal>
    </>
  );
}

export function AcademyApprovalsPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { academies, courses, update } = useMarketplace();

  return (
    <>
      <PageHead
        title={isArabic ? "توثيق الأكاديميات" : "Academy Verification"}
        description={isArabic ? "تحقق من الملف العام قبل إتاحته للطلاب." : "Verify public profiles before marketplace publishing."}
      />
      <section className="academy-approval-grid">
        {academies.map((item) => (
          <article key={item.id}>
            <span style={{ background: item.color }}>{item.initials}</span>
            <div>
              <h2>{label(item, isArabic)}</h2>
              <p>{item.email} · {item.location}</p>
              <small>{courses.filter((course) => course.organizationId === item.organizationId).length} {isArabic ? "كورسات" : "courses"}</small>
            </div>
            <Badge tone={statusTone(item.status)}>{item.status}</Badge>
            <footer>
              {item.status === "pending" ? (
                <>
                  <Button onClick={() => update("academies", item.id, { status: "approved", verified: true, public: true })}>{isArabic ? "توثيق" : "Verify"}</Button>
                  <Button variant="ghost" onClick={() => update("academies", item.id, { status: "rejected", public: false })}>{isArabic ? "رفض" : "Reject"}</Button>
                </>
              ) : (
                <Button variant="ghost" onClick={() => update("academies", item.id, { status: "suspended", public: false })}>{isArabic ? "إيقاف مؤقت" : "Suspend"}</Button>
              )}
            </footer>
          </article>
        ))}
      </section>
    </>
  );
}

export function CategoryManagementPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { categories, courses, add, update } = useMarketplace();
  const [open, setOpen] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    add("categories", "category", {
      name: form.get("name"),
      nameAr: form.get("nameAr"),
      parentId: form.get("parentId") || null,
      active: true
    });
    setOpen(false);
  };

  return (
    <>
      <PageHead
        title={isArabic ? "التصنيفات" : "Categories"}
        description={isArabic ? "نظّم تصنيفات الـMarketplace وامنع حذف التصنيفات المستخدمة." : "Organize categories and taxonomies across the platform."}
        action={<Button onClick={() => setOpen(true)}><Plus />{isArabic ? "تصنيف جديد" : "New Category"}</Button>}
      />
      <section className="category-admin-list">
        {categories.map((item) => (
          <article key={item.id}>
            <span><Tag /></span>
            <div>
              <h2>{label(item, isArabic)}</h2>
              <p>{item.name} · {courses.filter((course) => course.categoryId === item.id).length} {isArabic ? "كورسات" : "courses"}</p>
            </div>
            <Badge tone={item.active ? "success" : "neutral"}>{item.active ? (isArabic ? "نشط" : "Active") : (isArabic ? "موقوف" : "Inactive")}</Badge>
            <Button variant="ghost" onClick={() => update("categories", item.id, { active: !item.active })}>{item.active ? (isArabic ? "إيقاف" : "Deactivate") : (isArabic ? "تفعيل" : "Activate")}</Button>
          </article>
        ))}
      </section>
      <Modal title={isArabic ? "إضافة تصنيف" : "Add Category"} open={open} onClose={() => setOpen(false)}>
        <form className="learning-form" onSubmit={submit}>
          <div className="learning-form-grid">
            <FormField label={isArabic ? "الاسم بالإنجليزية" : "English Name"}><input name="name" required /></FormField>
            <FormField label={isArabic ? "الاسم بالعربية" : "Arabic Name"}><input name="nameAr" required /></FormField>
          </div>
          <FormField label={isArabic ? "التصنيف الأب" : "Parent Category"}>
            <select name="parentId">
              <option value="">{isArabic ? "تصنيف رئيسي" : "Main Category"}</option>
              {categories.map((item) => <option value={item.id} key={item.id}>{label(item, isArabic)}</option>)}
            </select>
          </FormField>
          <div className="learning-form-actions"><Button type="submit">{isArabic ? "إضافة" : "Add"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

