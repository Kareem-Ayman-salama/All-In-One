import { BookOpen, FileUp, Link2, Plus, Upload, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../services/api";

const TYPES = [
  ["written", "شرح مكتوب"], ["video", "فيديو"], ["pdf", "PDF"],
  ["examples", "أمثلة"], ["exercise", "تدريب"], ["quiz", "اختبار"],
  ["homework", "واجب"], ["external_link", "رابط خارجي"]
];

export function CourseCurriculumPage() {
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
      showToast(error.message || "تعذر تحميل محتوى الكورس", "error");
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
        if (!form.file || !roomId) throw new Error("اختاري الملف وتأكدي من وجود غرفة للكورس.");
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
        if (!form.externalUrl || !roomId) throw new Error("أدخلي الرابط وتأكدي من وجود غرفة للكورس.");
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
      showToast("تم حفظ الدرس كمسودة");
      setModalOpen(false);
      await load();
    } catch (error) {
      showToast(error.message || "تعذر حفظ الدرس", "error");
    } finally {
      setSaving(false);
    }
  };

  const publishLesson = async (lesson) => {
    try {
      await api.updateCourseLesson(organizationId, courseId, lesson.id, { status: "published" });
      showToast("تم نشر الدرس داخل الأكاديمية");
      await load();
    } catch (error) {
      showToast(error.message || "تعذر نشر الدرس", "error");
    }
  };

  return (
    <div className="curriculum-page" dir="rtl">
      <div className="stitch-page-head">
        <div><h1>محتوى الكورس</h1><p>أضيفي الدروس والملفات واحفظيها كمسودة حتى تصبح جاهزة للنشر.</p></div>
        <FormField label="الكورس">
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            {academyCourses.map((course) => <option key={course.id} value={course.id}>{course.titleAr || course.title}</option>)}
          </select>
        </FormField>
      </div>

      {loading && <div className="empty-state">جارٍ تحميل الوحدات…</div>}
      {!loading && !academyCourses.length && <div className="empty-state">أنشئي الكورس أولاً لبدء إضافة المحتوى.</div>}
      {!loading && curriculum?.modules?.map((module, index) => (
        <section className="curriculum-module" key={module.id}>
          <header>
            <div><small>الوحدة {index + 1}</small><h2>{module.titleAr || module.title}</h2></div>
            <Button onClick={() => openLesson(module.id)}><Plus size={17} /> إضافة درس</Button>
          </header>
          <div className="curriculum-lessons">
            {module.lessons?.map((lesson) => (
              <article className="curriculum-lesson" key={lesson.id}>
                <span className="curriculum-lesson-icon">{lesson.type === "video" ? <Video /> : lesson.type === "pdf" ? <FileUp /> : lesson.type === "external_link" ? <Link2 /> : <BookOpen />}</span>
                <div><strong>{lesson.titleAr || lesson.title}</strong><small>{lesson.type === "placeholder" ? "مكان جاهز لإضافة المحتوى" : TYPES.find(([key]) => key === lesson.type)?.[1] || lesson.type}</small></div>
                <span className={`status-pill ${lesson.status}`}>{lesson.status === "published" ? "منشور" : "مسودة"}</span>
                {lesson.status !== "published" && lesson.type !== "placeholder" && <Button variant="ghost" onClick={() => publishLesson(lesson)}>نشر</Button>}
              </article>
            ))}
          </div>
        </section>
      ))}

      <Modal title="إضافة درس جديد" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="form-stack" onSubmit={saveLesson}>
          <FormField label="عنوان الدرس"><input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></FormField>
          <FormField label="نوع الدرس"><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, file: null, externalUrl: "" }))}>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          {["video", "pdf"].includes(form.type) && <FormField label={form.type === "video" ? "ملف الفيديو" : "ملف PDF"}><input type="file" required accept={form.type === "video" ? "video/*" : "application/pdf"} onChange={(event) => setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} /></FormField>}
          {form.type === "external_link" && <FormField label="رابط الفيديو أو المصدر"><input type="url" required dir="ltr" value={form.externalUrl} onChange={(event) => setForm((current) => ({ ...current, externalUrl: event.target.value }))} /></FormField>}
          <div className="form-actions"><Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>إلغاء</Button><Button type="submit" loading={saving}><Upload size={17} /> حفظ كمسودة</Button></div>
        </form>
      </Modal>
    </div>
  );
}
