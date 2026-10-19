import { BookOpen, FileUp, Link2, Plus, Upload, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

const TYPES = [
  { value: "written", ar: "شرح وملاحظات مكتوبة", en: "Written notes" },
  { value: "video", ar: "فيديو مسجل", en: "Recorded video" },
  { value: "pdf", ar: "ملف PDF ومذكرات", en: "PDF document / notes" },
  { value: "examples", ar: "أمثلة وتمارين", en: "Examples & Exercises" },
  { value: "exercise", ar: "تدريب تطبيقي", en: "Hands-on Practice" },
  { value: "quiz", ar: "اختبار وتقييم", en: "Quiz & Assessment" },
  { value: "homework", ar: "واجب منزلي", en: "Homework" },
  { value: "external_link", ar: "رابط ومصدر خارجي", en: "External link / resource" }
];

export function CourseCurriculumPage() {
  const { direction, language } = useLanguage();
  const tx = useBilingualText();
  const isArabic = language === "ar";
  const { activeOrganization } = useOrganization();
  const { courses } = useMarketplace();
  const { rooms } = useWorkspace();
  const { showToast } = useToast();
  const organizationId = activeOrganization?.id;
  const academyCourses = useMemo(
    () => courses.filter((course) => course.organizationId === organizationId),
    [courses, organizationId]
  );
  const [courseId, setCourseId] = useState("");
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ moduleId: "", title: "", type: "written", externalUrl: "", file: null });

  useEffect(() => {
    if (!courseId && academyCourses.length) setCourseId(academyCourses[0].id);
  }, [academyCourses, courseId]);

  const load = async () => {
    if (!organizationId || !courseId) return;
    setLoading(true);
    try {
      setCurriculum(await api.getCourseCurriculum(organizationId, courseId));
    } catch (error) {
      showToast(error.message || tx("تعذر تحميل محتوى الكورس", "Failed to load course curriculum"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [organizationId, courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const openLesson = (moduleId) => {
    setForm({ moduleId, title: "", type: "written", externalUrl: "", file: null });
    setModalOpen(true);
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    if (!form.moduleId || !form.title.trim()) return;
    setSaving(true);
    try {
      let contentItemId = null;
      const roomId = rooms[0]?.id;
      if (["video", "pdf"].includes(form.type)) {
        if (!form.file || !roomId) throw new Error(tx("اختر الملف وتأكد من وجود غرفة للكورس.", "Please select a file and ensure the course has an active room."));
        const content = await api.uploadContent(organizationId, {
          roomId,
          title: form.title.trim(),
          type: form.type,
          file: form.file,
          status: "draft",
          downloadAllowed: false,
          watermarkEnabled: true
        });
        contentItemId = content.id;
      } else if (form.type === "external_link") {
        if (!form.externalUrl || !roomId) throw new Error(tx("أدخل الرابط وتأكد من وجود غرفة للكورس.", "Please enter the link and ensure the course has an active room."));
        const content = await api.uploadContent(organizationId, {
          roomId,
          title: form.title.trim(),
          type: /(?:youtube\.com|youtu\.be)/i.test(form.externalUrl) ? "youtube" : "link",
          externalUrl: form.externalUrl,
          status: "draft"
        });
        contentItemId = content.id;
      }

      await api.createCourseLesson(organizationId, courseId, {
        moduleId: form.moduleId,
        title: form.title.trim(),
        titleAr: form.title.trim(),
        type: form.type,
        status: "draft",
        contentItemId,
        templateSections: curriculum?.lessonTemplate?.sections || []
      });
      showToast(tx("تم حفظ الدرس كمسودة بنجاح", "Lesson saved as draft successfully"), "success");
      setModalOpen(false);
      await load();
    } catch (error) {
      showToast(error.message || tx("تعذر حفظ الدرس", "Failed to save lesson"), "error");
    } finally {
      setSaving(false);
    }
  };

  const publishLesson = async (lesson) => {
    try {
      await api.updateCourseLesson(organizationId, courseId, lesson.id, { status: "published" });
      showToast(tx("تم نشر الدرس داخل الأكاديمية بنجاح 🚀", "Lesson published to academy successfully 🚀"), "success");
      await load();
    } catch (error) {
      showToast(error.message || tx("تعذر نشر الدرس", "Failed to publish lesson"), "error");
    }
  };

  const getTypeLabel = (typeKey) => {
    const item = TYPES.find((t) => t.value === typeKey);
    if (!item) return typeKey;
    return isArabic ? item.ar : item.en;
  };

  return (
    <div className="curriculum-page" dir={direction}>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("محتوى ومناهج الكورس", "Course Curriculum & Modules")}</h1>
          <p>{tx("أضف الدروس والملفات والواجبات واحفظها كمسودة حتى تصبح جاهزة للنشر للطلاب.", "Add lessons, attach materials, and publish when ready for enrolled students.")}</p>
        </div>
        <FormField label={tx("الكورس", "Course")}>
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            {academyCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {isArabic ? (course.titleAr || course.title) : (course.title || course.titleAr)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {loading && <div className="empty-state">{tx("جارٍ تحميل الوحدات الدراسية…", "Loading modules…")}</div>}
      {!loading && !academyCourses.length && (
        <div className="empty-state">{tx("أنشئ الكورس أولاً لبدء إضافة المحتوى والدروس.", "Create a course first to start organizing lessons.")}</div>
      )}
      {!loading && curriculum?.modules?.map((module, index) => (
        <section className="curriculum-module" key={module.id}>
          <header>
            <div>
              <small>{tx(`الوحدة ${index + 1}`, `Module ${index + 1}`)}</small>
              <h2>{isArabic ? (module.titleAr || module.title) : (module.title || module.titleAr)}</h2>
            </div>
            <Button onClick={() => openLesson(module.id)}>
              <Plus size={17} /> {tx("إضافة درس", "Add Lesson")}
            </Button>
          </header>
          <div className="curriculum-lessons">
            {module.lessons?.map((lesson) => (
              <article className="curriculum-lesson" key={lesson.id}>
                <span className="curriculum-lesson-icon">
                  {lesson.type === "video" ? <Video /> : lesson.type === "pdf" ? <FileUp /> : lesson.type === "external_link" ? <Link2 /> : <BookOpen />}
                </span>
                <div>
                  <strong>{isArabic ? (lesson.titleAr || lesson.title) : (lesson.title || lesson.titleAr)}</strong>
                  <small>
                    {lesson.type === "placeholder" ? tx("مكان جاهز لإضافة المحتوى", "Placeholder ready for content") : getTypeLabel(lesson.type)}
                  </small>
                </div>
                <span className={`status-pill ${lesson.status}`}>
                  {lesson.status === "published" ? tx("منشور", "Published") : tx("مسودة", "Draft")}
                </span>
                {lesson.status !== "published" && lesson.type !== "placeholder" && (
                  <Button variant="ghost" onClick={() => publishLesson(lesson)}>
                    {tx("نشر", "Publish")}
                  </Button>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}

      <Modal title={tx("إضافة درس جديد", "Add New Lesson")} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="form-stack" onSubmit={saveLesson}>
          <FormField label={tx("عنوان الدرس", "Lesson Title")}>
            <input
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder={tx("مثال: مقدمة في قواعد النحو والصرف", "e.g. Introduction to Syntax")}
            />
          </FormField>
          <FormField label={tx("نوع الدرس", "Lesson Type")}>
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, file: null, externalUrl: "" }))}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {isArabic ? t.ar : t.en}
                </option>
              ))}
            </select>
          </FormField>
          {["video", "pdf"].includes(form.type) && (
            <FormField label={form.type === "video" ? tx("ملف الفيديو المرفوع", "Video file") : tx("ملف PDF المرفوع", "PDF document")}>
              <input
                type="file"
                required
                accept={form.type === "video" ? "video/*" : "application/pdf"}
                onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))}
              />
            </FormField>
          )}
          {form.type === "external_link" && (
            <FormField label={tx("رابط الفيديو أو المصدر الخارجي", "Resource / Video URL")}>
              <input
                type="url"
                required
                dir="ltr"
                value={form.externalUrl}
                onChange={(event) => setForm((current) => ({ ...current, externalUrl: event.target.value }))}
                placeholder="https://..."
              />
            </FormField>
          )}
          <div className="form-actions">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              {tx("إلغاء", "Cancel")}
            </Button>
            <Button type="submit" loading={saving}>
              <Upload size={17} /> {tx("حفظ كمسودة", "Save as Draft")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
