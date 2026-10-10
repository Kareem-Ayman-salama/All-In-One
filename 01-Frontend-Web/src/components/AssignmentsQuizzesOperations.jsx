import { useState, useEffect, useMemo } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  HelpCircle,
  ListOrdered,
  Plus,
  Send,
  Timer,
  Trash2,
  UploadCloud,
  Users,
  X,
  XCircle
} from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { useLearning } from "../contexts/LearningContext";
import { useAuth } from "../contexts/AuthContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";

function titleFor(item, tx) {
  return tx(item?.titleAr || item?.title, item?.title || item?.titleAr || "—");
}

/* =========================================================================
   1. INSTRUCTOR / ADMIN: ASSIGNMENTS MANAGEMENT PAGE
   ========================================================================= */
export function AssignmentsManagementPage() {
  const { assignments, submissions, createAssignment, deleteAssignment, gradeSubmission } = useLearning();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();

  const [createOpen, setCreateOpen] = useState(false);
  const [activeSubmissionsAssignment, setActiveSubmissionsAssignment] = useState(null);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const orgAssignments = useMemo(() => {
    return (assignments || []).filter(
      (a) => !a.organizationId || a.organizationId === activeOrganization?.id
    );
  }, [assignments, activeOrganization]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await createAssignment({
      title: form.get("title"),
      titleAr: form.get("titleAr"),
      roomName: form.get("roomName") || "Default Room",
      description: form.get("description"),
      dueAt: form.get("dueAt"),
      maxScore: Number(form.get("maxScore") || 100),
      allowedFileTypes: form.get("allowedFileTypes") || "pdf,zip,doc"
    });
    showToast(tx("تم إنشاء الواجب بنجاح", "Assignment created successfully"), "success");
    setCreateOpen(false);
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const score = Number(form.get("score"));
    const feedback = form.get("feedback");
    await gradeSubmission(gradingSubmission.assignmentId, gradingSubmission.id, { score, feedback });
    showToast(tx("تم رصد الدرجة وإرسال التقييم للطالب", "Grade and feedback submitted"), "success");
    setGradingSubmission(null);
  };

  const currentSubmissions = useMemo(() => {
    if (!activeSubmissionsAssignment) return [];
    return (submissions || []).filter((s) => s.assignmentId === activeSubmissionsAssignment.id);
  }, [submissions, activeSubmissionsAssignment]);

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("إدارة الواجبات والمهام", "Assignments & Submissions")}</h1>
          <p>{tx("أنشئ الواجبات، استقبل تسليمات الطلاب، ورصد الدرجات والتقييمات.", "Create assignments, review student submissions, and submit grades.")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          {tx("إضافة واجب جديد", "Create Assignment")}
        </Button>
      </div>

      {orgAssignments.length === 0 ? (
        <section className="learning-empty-state">
          <FileText size={40} />
          <h2>{tx("لا توجد واجبات حالياً", "No assignments created yet")}</h2>
          <p>{tx("قم بإنشاء الواجب الأول لطلاب الغرف والدفعات.", "Create the first assignment for your room cohorts.")}</p>
          <Button onClick={() => setCreateOpen(true)}>{tx("إنشاء واجب", "Create Assignment")}</Button>
        </section>
      ) : (
        <section className="learning-card-grid">
          {orgAssignments.map((assignment) => (
            <article className="learning-course-card" key={assignment.id}>
              <div className="learning-card-icon" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                <FileText size={24} color="#fff" />
              </div>
              <div className="learning-card-badges">
                <Badge tone="primary">{assignment.maxScore} {tx("درجة", "pts")}</Badge>
                <Badge tone={assignment.status === "closed" ? "danger" : "success"}>
                  {assignment.status === "closed" ? tx("مغلق", "Closed") : tx("متاح للتسليم", "Active")}
                </Badge>
              </div>
              <h2>{titleFor(assignment, tx)}</h2>
              <p>{assignment.description || tx("لا يوجد وصف إضافي.", "No description provided.")}</p>
              <div className="learning-meta">
                <span><Calendar size={15} />{tx("التسليم حتى", "Due:")} {assignment.dueAt ? assignment.dueAt.slice(0, 10) : "—"}</span>
                <span><Users size={15} />{assignment.submissionsCount || 0} {tx("تسليم", "submissions")}</span>
              </div>
              <footer>
                <Button variant="outline" onClick={() => setActiveSubmissionsAssignment(assignment)}>
                  <FileCheck size={16} />
                  {tx("مراجعة التسليمات", "Review Submissions")}
                </Button>
                <Button variant="ghost" onClick={() => deleteAssignment(assignment.id)}>
                  <Trash2 size={16} color="#ef4444" />
                </Button>
              </footer>
            </article>
          ))}
        </section>
      )}

      {/* CREATE MODAL */}
      <Modal title={tx("إنشاء واجب دراسي جديد", "Create New Assignment")} open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="learning-form" onSubmit={handleCreate}>
          <div className="learning-form-grid">
            <FormField label={tx("العنوان بالإنجليزية", "English Title")}>
              <input name="title" required placeholder="e.g. Final Project Report" />
            </FormField>
            <FormField label={tx("العنوان بالعربية", "Arabic Title")}>
              <input name="titleAr" required placeholder={tx("مثال: تقرير المشروع النهائي", "e.g. Final Project Report")} />
            </FormField>
            <FormField label={tx("الغرفة التعليمية", "Room Name")}>
              <input name="roomName" defaultValue="Main Room" required />
            </FormField>
            <FormField label={tx("تاريخ وآخر موعد للتسليم", "Due Date")}>
              <input name="dueAt" type="date" required />
            </FormField>
            <FormField label={tx("الدرجة العظمى", "Max Score")}>
              <input name="maxScore" type="number" defaultValue="100" min="1" max="1000" required />
            </FormField>
            <FormField label={tx("الصيغ المسموحة للملفات", "Allowed File Types")}>
              <input name="allowedFileTypes" defaultValue="pdf,zip,doc,docx" />
            </FormField>
          </div>
          <FormField label={tx("شرح وتعليمات الواجب", "Assignment Description & Guidelines")}>
            <textarea name="description" rows={3} placeholder={tx("اكتب تفاصيل المطلوب بدقة...", "Provide specific requirements...")} />
          </FormField>
          <div className="learning-form-actions">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>{tx("إلغاء", "Cancel")}</Button>
            <Button type="submit">{tx("حفظ ونشر الواجب", "Save & Publish")}</Button>
          </div>
        </form>
      </Modal>

      {/* SUBMISSIONS DRAWER / MODAL */}
      <Modal
        title={`${tx("تسليمات الطلاب لـ:", "Submissions for:")} ${activeSubmissionsAssignment ? titleFor(activeSubmissionsAssignment, tx) : ""}`}
        open={Boolean(activeSubmissionsAssignment)}
        onClose={() => setActiveSubmissionsAssignment(null)}
      >
        <div className="stitch-table-card learning-table" style={{ maxHeight: "450px", overflowY: "auto" }}>
          {currentSubmissions.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              {tx("لم يقم أي طالب بتسليم هذا الواجب بعد.", "No students have submitted this assignment yet.")}
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{tx("الطالب", "Student")}</th>
                  <th>{tx("الملف / الإجابة", "Submission")}</th>
                  <th>{tx("الحالة والدرجة", "Status & Grade")}</th>
                  <th>{tx("الإجراء", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {currentSubmissions.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.studentName}</strong>
                      <small>{sub.studentEmail}</small>
                    </td>
                    <td>
                      {sub.attachmentUrl ? (
                        <a href={sub.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#4f46e5" }}>
                          <ExternalLink size={14} />
                          {sub.fileName || tx("فتح الملف المرفق", "Open attachment")}
                        </a>
                      ) : (
                        <small>{sub.submissionText?.slice(0, 40)}...</small>
                      )}
                    </td>
                    <td>
                      {sub.status === "graded" ? (
                        <Badge tone="success">{sub.score} / {activeSubmissionsAssignment?.maxScore || 100}</Badge>
                      ) : (
                        <Badge tone="warning">{tx("بانتظار التصحيح", "Pending review")}</Badge>
                      )}
                    </td>
                    <td>
                      <Button size="sm" onClick={() => setGradingSubmission(sub)}>
                        {sub.status === "graded" ? tx("تعديل الدرجة", "Edit Grade") : tx("رصد الدرجة", "Grade")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* GRADING MODAL */}
      <Modal
        title={tx("تصحيح الواجب ورصد الدرجة", "Grade Assignment Submission")}
        open={Boolean(gradingSubmission)}
        onClose={() => setGradingSubmission(null)}
      >
        {gradingSubmission && (
          <form className="learning-form" onSubmit={handleGrade}>
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", marginBottom: "1rem" }}>
              <strong>{gradingSubmission.studentName}</strong>
              <p style={{ margin: "4px 0", fontSize: "13px", color: "#334155" }}>
                {gradingSubmission.submissionText || tx("لا يوجد نص كتابي، يرجى مراجعة المرفق.", "No text provided, check attachment.")}
              </p>
              {gradingSubmission.attachmentUrl && (
                <a href={gradingSubmission.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", fontSize: "13px" }}>
                  {tx("معاينة الملف المرفوع", "Preview submitted file")} &rarr;
                </a>
              )}
            </div>

            <FormField label={`${tx("الدرجة المستحقة", "Score awarded")} (${tx("الحد الأقصى:", "Max:")} ${activeSubmissionsAssignment?.maxScore || 100})`}>
              <input name="score" type="number" defaultValue={gradingSubmission.score || 90} min="0" max={activeSubmissionsAssignment?.maxScore || 100} required />
            </FormField>

            <FormField label={tx("ملاحظات وتوجيهات للمتعلم", "Instructor Feedback")}>
              <textarea name="feedback" rows={3} defaultValue={gradingSubmission.feedback || ""} placeholder={tx("أداء رائع مع بعض الملاحظات حول...", "Great work, focus on...")} />
            </FormField>

            <div className="learning-form-actions">
              <Button variant="ghost" type="button" onClick={() => setGradingSubmission(null)}>{tx("إلغاء", "Cancel")}</Button>
              <Button type="submit">{tx("تأكيد وحفظ الدرجة", "Submit Grade")}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

/* =========================================================================
   2. INSTRUCTOR / ADMIN: QUIZZES MANAGEMENT PAGE
   ========================================================================= */
export function QuizzesManagementPage() {
  const { quizzes, quizAttempts, createQuiz, deleteQuiz } = useLearning();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();
  const tx = useBilingualText();

  const [createOpen, setCreateOpen] = useState(false);
  const [activeQuizAttempts, setActiveQuizAttempts] = useState(null);
  const [questions, setQuestions] = useState([
    {
      id: "q-1",
      questionText: "",
      questionTextAr: "",
      type: "mcq",
      options: [
        { id: "A", text: "" },
        { id: "B", text: "" },
        { id: "C", text: "" }
      ],
      correctAnswer: "A",
      points: 10
    }
  ]);

  const orgQuizzes = useMemo(() => {
    return (quizzes || []).filter(
      (q) => !q.organizationId || q.organizationId === activeOrganization?.id
    );
  }, [quizzes, activeOrganization]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        questionText: "",
        questionTextAr: "",
        type: "mcq",
        options: [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" }
        ],
        correctAnswer: "A",
        points: 10
      }
    ]);
  };

  const updateQuestion = (idx, field, value) => {
    const next = [...questions];
    next[idx][field] = value;
    setQuestions(next);
  };

  const updateOptionText = (qIdx, optIdx, text) => {
    const next = [...questions];
    next[qIdx].options[optIdx].text = text;
    setQuestions(next);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await createQuiz({
      title: form.get("title"),
      titleAr: form.get("titleAr"),
      description: form.get("description"),
      durationMinutes: Number(form.get("durationMinutes") || 20),
      passingScore: Number(form.get("passingScore") || 60),
      maxAttempts: Number(form.get("maxAttempts") || 2),
      questions
    });
    showToast(tx("تم إنشاء ونشر الاختبار بنجاح", "Quiz created and published"), "success");
    setCreateOpen(false);
  };

  const attemptsForQuiz = useMemo(() => {
    if (!activeQuizAttempts) return [];
    return (quizAttempts || []).filter((a) => a.quizId === activeQuizAttempts.id);
  }, [quizAttempts, activeQuizAttempts]);

  return (
    <>
      <div className="stitch-page-head">
        <div>
          <h1>{tx("إدارة الاختبارات والتقييم الآلي", "Quizzes & Auto-Grading")}</h1>
          <p>{tx("أنشئ اختبارات تفاعلية، حدد الإجابات النموذجية، وتابع نتائج ومحاولات الطلاب.", "Build interactive quizzes, set correct answers, and track attempts.")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={18} />
          {tx("إنشاء اختبار جديد", "Create Quiz")}
        </Button>
      </div>

      {orgQuizzes.length === 0 ? (
        <section className="learning-empty-state">
          <Award size={40} />
          <h2>{tx("لا توجد اختبارات منشأة بعد", "No quizzes created yet")}</h2>
          <p>{tx("أنشئ اختبارات تجريبية أو تقييمات نهائية مع تصحيح تلقائي.", "Create interactive quizzes with instant auto-grading.")}</p>
          <Button onClick={() => setCreateOpen(true)}>{tx("إنشاء اختبار", "Create Quiz")}</Button>
        </section>
      ) : (
        <section className="learning-card-grid">
          {orgQuizzes.map((quiz) => (
            <article className="learning-course-card" key={quiz.id}>
              <div className="learning-card-icon" style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)" }}>
                <Award size={24} color="#fff" />
              </div>
              <div className="learning-card-badges">
                <Badge tone="primary">{quiz.questions?.length || 0} {tx("أسئلة", "questions")}</Badge>
                <Badge tone="neutral"><Timer size={13} style={{ display: "inline", verticalAlign: "middle", marginInlineEnd: 4 }} />{quiz.durationMinutes} min</Badge>
              </div>
              <h2>{titleFor(quiz, tx)}</h2>
              <p>{quiz.description || tx("اختبار تقييمي لقياس الفهم والاستيعاب.", "Assessment quiz.")}</p>
              <div className="learning-meta">
                <span><Award size={15} />{tx("درجة الاجتياز:", "Pass:")} {quiz.passingScore}%</span>
                <span><CheckCircle2 size={15} />{quiz.maxAttempts} {tx("محاولات مسموحة", "attempts allowed")}</span>
              </div>
              <footer>
                <Button variant="outline" onClick={() => setActiveQuizAttempts(quiz)}>
                  <Users size={16} />
                  {tx("نتائج المحاولات", "View Results")}
                </Button>
                <Button variant="ghost" onClick={() => deleteQuiz(quiz.id)}>
                  <Trash2 size={16} color="#ef4444" />
                </Button>
              </footer>
            </article>
          ))}
        </section>
      )}

      {/* CREATE QUIZ MODAL */}
      <Modal title={tx("إنشاء اختبار تفاعلي جديد", "Create Interactive Quiz")} open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="learning-form" onSubmit={handleCreate}>
          <div className="learning-form-grid">
            <FormField label={tx("عنوان الاختبار بالإنجليزية", "English Title")}>
              <input name="title" required placeholder="e.g. Midterm Assessment" />
            </FormField>
            <FormField label={tx("عنوان الاختبار بالعربية", "Arabic Title")}>
              <input name="titleAr" required placeholder={tx("مثال: الاختبار النصفي", "e.g. Midterm Assessment")} />
            </FormField>
            <FormField label={tx("المدة بالدقائق", "Duration in Minutes")}>
              <input name="durationMinutes" type="number" defaultValue="20" min="1" max="180" required />
            </FormField>
            <FormField label={tx("نسبة النجاح (%)", "Passing Score (%)")}>
              <input name="passingScore" type="number" defaultValue="60" min="1" max="100" required />
            </FormField>
            <FormField label={tx("الحد الأقصى للمحاولات", "Max Attempts Allowed")}>
              <input name="maxAttempts" type="number" defaultValue="2" min="1" max="10" required />
            </FormField>
          </div>

          <FormField label={tx("وصف الاختبار", "Quiz Description")}>
            <textarea name="description" rows={2} placeholder={tx("تعليمات الاختبار...", "Quiz instructions...")} />
          </FormField>

          {/* QUESTIONS BUILDER */}
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>{tx("بنك الأسئلة والخيارات", "Questions Bank")} ({questions.length})</h3>
              <Button type="button" size="sm" onClick={addQuestion}>
                <Plus size={15} />
                {tx("إضافة سؤال", "Add Question")}
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={q.id} style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", marginBottom: "1rem", border: "1px solid #cbd5e1" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <strong>{tx(`سؤال رقم ${qIdx + 1}`, `Question #${qIdx + 1}`)}</strong>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(qIdx, "type", e.target.value)}
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                  >
                    <option value="mcq">{tx("اختيار من متعدد (MCQ)", "Multiple Choice (MCQ)")}</option>
                    <option value="true_false">{tx("صح أو خطأ (True/False)", "True / False")}</option>
                  </select>
                </div>

                <div className="learning-form-grid" style={{ marginBottom: "8px" }}>
                  <input
                    placeholder={tx("نص السؤال بالإنجليزية", "Question text in English")}
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIdx, "questionText", e.target.value)}
                    required
                  />
                  <input
                    placeholder={tx("نص السؤال بالعربية", "Question text in Arabic")}
                    value={q.questionTextAr}
                    onChange={(e) => updateQuestion(qIdx, "questionTextAr", e.target.value)}
                  />
                </div>

                {q.type === "mcq" ? (
                  <div style={{ display: "grid", gap: "6px", margin: "8px 0" }}>
                    {q.options.map((opt, optIdx) => (
                      <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === opt.id}
                          onChange={() => updateQuestion(qIdx, "correctAnswer", opt.id)}
                        />
                        <span style={{ fontWeight: "bold", width: "20px" }}>{opt.id}</span>
                        <input
                          placeholder={tx(`الخيار ${opt.id}`, `Option ${opt.id}`)}
                          value={opt.text}
                          onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                      </div>
                    ))}
                    <small style={{ color: "#64748b" }}>{tx("* حدد زر الاختيار للإجابة الصحيحة", "* Select radio button for correct answer")}</small>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "1.5rem", margin: "8px 0" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name={`tf-${q.id}`}
                        checked={q.correctAnswer === "true"}
                        onChange={() => updateQuestion(qIdx, "correctAnswer", "true")}
                      />
                      {tx("صح (True)", "True")}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name={`tf-${q.id}`}
                        checked={q.correctAnswer === "false"}
                        onChange={() => updateQuestion(qIdx, "correctAnswer", "false")}
                      />
                      {tx("خطأ (False)", "False")}
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="learning-form-actions">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>{tx("إلغاء", "Cancel")}</Button>
            <Button type="submit">{tx("نشر الاختبار", "Publish Quiz")}</Button>
          </div>
        </form>
      </Modal>

      {/* ATTEMPTS RESULTS MODAL */}
      <Modal
        title={`${tx("نتائج ومحاولات:", "Attempts for:")} ${activeQuizAttempts ? titleFor(activeQuizAttempts, tx) : ""}`}
        open={Boolean(activeQuizAttempts)}
        onClose={() => setActiveQuizAttempts(null)}
      >
        <div className="stitch-table-card learning-table" style={{ maxHeight: "400px", overflowY: "auto" }}>
          {attemptsForQuiz.length === 0 ? (
            <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              {tx("لم يقم أي طالب بإجراء هذا الاختبار بعد.", "No student has attempted this quiz yet.")}
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{tx("الطالب", "Student")}</th>
                  <th>{tx("النتيجة", "Score")}</th>
                  <th>{tx("النسبة", "Percentage")}</th>
                  <th>{tx("الحالة", "Status")}</th>
                  <th>{tx("رقم المحاولة", "Attempt #")}</th>
                </tr>
              </thead>
              <tbody>
                {attemptsForQuiz.map((att) => (
                  <tr key={att.id}>
                    <td><strong>{att.studentName}</strong></td>
                    <td>{att.score} / {att.totalPoints}</td>
                    <td><strong>{att.percentage}%</strong></td>
                    <td>
                      <Badge tone={att.passed ? "success" : "danger"}>
                        {att.passed ? tx("ناجح", "Passed") : tx("راسب", "Failed")}
                      </Badge>
                    </td>
                    <td>#{att.attemptNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </>
  );
}

/* =========================================================================
   3. STUDENT VIEW: ASSIGNMENTS & QUIZZES WORKSPACE TABS
   ========================================================================= */
export function StudentAssignmentsWorkspaceTab({ roomId, courseId }) {
  const { assignments, submissions, submitAssignment } = useLearning();
  const { user } = useAuth();
  const tx = useBilingualText();
  const { showToast } = useToast();

  const [activeSubmitModal, setActiveSubmitModal] = useState(null);

  const roomAssignments = useMemo(() => {
    return (assignments || []).filter(
      (a) => (!roomId || a.roomId === roomId) && (!courseId || a.courseId === courseId)
    );
  }, [assignments, roomId, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const submissionText = form.get("submissionText");
    const attachmentUrl = form.get("attachmentUrl");
    const fileName = form.get("fileName") || "submission.pdf";

    await submitAssignment(activeSubmitModal.id, { submissionText, attachmentUrl, fileName });
    showToast(tx("تم تسليم الواجب بنجاح!", "Assignment submitted successfully!"), "success");
    setActiveSubmitModal(null);
  };

  return (
    <div className="student-assignments-container">
      {roomAssignments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
          <FileCheck size={44} style={{ marginBottom: "8px", opacity: 0.5 }} />
          <h3>{tx("لا توجد واجبات مطلوبة حالياً", "No assignments posted yet")}</h3>
          <p>{tx("ستظهر هنا التكليفات ومشاريع التدريب فور نشرها من المدرس.", "Homework and projects will appear here once assigned.")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {roomAssignments.map((assignment) => {
            const userSub = (submissions || []).find(
              (s) => s.assignmentId === assignment.id && s.studentEmail === user?.email
            ) || assignment.mySubmission;

            return (
              <article
                key={assignment.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                      <Badge tone={userSub?.status === "graded" ? "success" : userSub ? "warning" : "primary"}>
                        {userSub?.status === "graded"
                          ? `${tx("تم التصحيح:", "Graded:")} ${userSub.score}/${assignment.maxScore}`
                          : userSub
                            ? tx("تم التسليم", "Submitted")
                            : tx("مطلوب تسليمه", "Pending Submission")}
                      </Badge>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        <Calendar size={13} style={{ display: "inline", verticalAlign: "middle", marginInlineEnd: 4 }} />
                        {tx("آخر موعد:", "Due:")} {assignment.dueAt ? assignment.dueAt.slice(0, 10) : "—"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "4px 0" }}>{titleFor(assignment, tx)}</h3>
                    <p style={{ color: "#475569", fontSize: "14px", margin: "6px 0" }}>{assignment.description}</p>
                  </div>

                  {!userSub ? (
                    <Button onClick={() => setActiveSubmitModal(assignment)}>
                      <UploadCloud size={16} />
                      {tx("تسليم الحل", "Submit Work")}
                    </Button>
                  ) : (
                    <div style={{ textAlign: "end" }}>
                      <Badge tone="success"><Check size={14} />{tx("تم الإرسال", "Sent")}</Badge>
                    </div>
                  )}
                </div>

                {userSub?.feedback && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px", marginTop: "12px" }}>
                    <strong style={{ color: "#166534", fontSize: "13px" }}>{tx("تقييم وملاحظات المدرس:", "Instructor Feedback:")}</strong>
                    <p style={{ margin: "4px 0 0", color: "#14532d", fontSize: "13px" }}>{userSub.feedback}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* SUBMISSION MODAL */}
      <Modal
        title={`${tx("تسليم حل:", "Submit Work for:")} ${activeSubmitModal ? titleFor(activeSubmitModal, tx) : ""}`}
        open={Boolean(activeSubmitModal)}
        onClose={() => setActiveSubmitModal(null)}
      >
        <form className="learning-form" onSubmit={handleSubmit}>
          <FormField label={tx("نص الإجابة أو الشرح", "Answer text / Notes")}>
            <textarea name="submissionText" rows={4} placeholder={tx("اكتب حلك أو ملخص العمل هنا...", "Type your answer or notes here...")} />
          </FormField>

          <FormField label={tx("رابط الملف المرفوع (Google Drive, Dropbox, إلخ)", "Cloud Attachment Link")}>
            <input name="attachmentUrl" type="url" placeholder="https://drive.google.com/..." />
          </FormField>

          <FormField label={tx("اسم الملف", "File Name")}>
            <input name="fileName" placeholder="my_project_solution.pdf" />
          </FormField>

          <div className="learning-form-actions">
            <Button variant="ghost" type="button" onClick={() => setActiveSubmitModal(null)}>{tx("إلغاء", "Cancel")}</Button>
            <Button type="submit">{tx("إرسال وتسليم الحل", "Submit Assignment")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* =========================================================================
   4. STUDENT VIEW: QUIZZES PLAYER WITH COUNTDOWN TIMER & INSTANT RESULTS
   ========================================================================= */
export function StudentQuizzesWorkspaceTab({ roomId, courseId }) {
  const { quizzes, quizAttempts, submitQuizAttempt } = useLearning();
  const { user } = useAuth();
  const tx = useBilingualText();
  const { showToast } = useToast();

  const [activeQuizPlayer, setActiveQuizPlayer] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizResult, setQuizResult] = useState(null);

  const roomQuizzes = useMemo(() => {
    return (quizzes || []).filter(
      (q) => (!roomId || q.roomId === roomId) && (!courseId || q.courseId === courseId)
    );
  }, [quizzes, roomId, courseId]);

  // Start Quiz
  const startQuiz = (quiz) => {
    setActiveQuizPlayer(quiz);
    setAnswers({});
    setQuizResult(null);
    setTimeLeft((quiz.durationMinutes || 20) * 60);
  };

  // Timer Countdown
  useEffect(() => {
    if (!activeQuizPlayer || quizResult || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuizPlayer, quizResult, timeLeft]);

  const finishQuiz = async () => {
    if (!activeQuizPlayer) return;
    const result = await submitQuizAttempt(activeQuizPlayer.id, answers);
    setQuizResult(result);
    showToast(result.passed ? tx("مبروك! لقد اجتزت الاختبار بنجاح", "Congratulations! You passed the quiz") : tx("للأسف لم تتجاوز درجة النجاح، يمكنك المحاولة مرة أخرى", "Quiz failed, you can retry"), result.passed ? "success" : "warning");
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="student-quizzes-container">
      {roomQuizzes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
          <Award size={44} style={{ marginBottom: "8px", opacity: 0.5 }} />
          <h3>{tx("لا توجد اختبارات متاحة حالياً", "No quizzes available yet")}</h3>
          <p>{tx("ستظهر هنا التقييمات الآلية فور جدولتها.", "Interactive tests will appear here once scheduled.")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {roomQuizzes.map((quiz) => {
            const userAttempts = (quizAttempts || []).filter(
              (a) => a.quizId === quiz.id && a.studentEmail === user?.email
            );
            const bestAttempt = userAttempts.sort((a, b) => b.percentage - a.percentage)[0];
            const attemptsLeft = (quiz.maxAttempts || 2) - userAttempts.length;

            return (
              <article
                key={quiz.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                      {bestAttempt ? (
                        <Badge tone={bestAttempt.passed ? "success" : "danger"}>
                          {bestAttempt.passed ? tx("تم الاجتياز", "Passed") : tx("لم يجتز", "Failed")} ({bestAttempt.percentage}%)
                        </Badge>
                      ) : (
                        <Badge tone="primary">{tx("جديد", "New")}</Badge>
                      )}
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        <Timer size={13} style={{ display: "inline", verticalAlign: "middle", marginInlineEnd: 4 }} />
                        {quiz.durationMinutes} min · {tx("درجة النجاح:", "Pass:")} {quiz.passingScore}%
                      </span>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "4px 0" }}>{titleFor(quiz, tx)}</h3>
                    <p style={{ color: "#475569", fontSize: "14px", margin: "6px 0" }}>{quiz.description}</p>
                    <small style={{ color: "#64748b" }}>
                      {tx("المحاولات المتبقية:", "Attempts remaining:")} {Math.max(0, attemptsLeft)} / {quiz.maxAttempts || 2}
                    </small>
                  </div>

                  {attemptsLeft > 0 ? (
                    <Button onClick={() => startQuiz(quiz)}>
                      <Timer size={16} />
                      {bestAttempt ? tx("إعادة المحاولة", "Retake Quiz") : tx("بدء الاختبار", "Start Quiz")}
                    </Button>
                  ) : (
                    <Badge tone="neutral">{tx("اكتملت المحاولات", "Max attempts reached")}</Badge>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* INTERACTIVE QUIZ MODAL */}
      <Modal
        title={activeQuizPlayer ? titleFor(activeQuizPlayer, tx) : ""}
        open={Boolean(activeQuizPlayer)}
        onClose={() => {
          if (!quizResult && !window.confirm(tx("هل تريد مغادرة الاختبار؟ سيتم فقدان تقدمك.", "Leave quiz? Progress will be lost."))) return;
          setActiveQuizPlayer(null);
        }}
      >
        {activeQuizPlayer && !quizResult && (
          <div>
            {/* TIMER BAR */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem" }}>
              <span style={{ fontWeight: "600", color: "#334155" }}>{tx("الوقت المتبقي:", "Time Remaining:")}</span>
              <strong style={{ fontSize: "18px", color: timeLeft < 60 ? "#ef4444" : "#4f46e5", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={18} />
                {formatTimer(timeLeft)}
              </strong>
            </div>

            {/* QUESTIONS LIST */}
            <div style={{ display: "grid", gap: "1.25rem", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
              {(activeQuizPlayer.questions || []).map((q, idx) => (
                <div key={q.id} style={{ background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong>{idx + 1}. {titleFor(q, tx) || q.questionText}</strong>
                    <small style={{ color: "#64748b" }}>{q.points || 10} {tx("درجات", "pts")}</small>
                  </div>

                  <div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
                    {(q.options || []).map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          background: answers[q.id] === opt.id ? "#e0e7ff" : "#ffffff",
                          border: answers[q.id] === opt.id ? "1.5px solid #4f46e5" : "1px solid #cbd5e1",
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        <input
                          type="radio"
                          name={`answer-${q.id}`}
                          checked={answers[q.id] === opt.id}
                          onChange={() => setAnswers({ ...answers, [q.id]: opt.id })}
                        />
                        <span style={{ fontSize: "14px", color: "#1e293b" }}>{opt.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="learning-form-actions" style={{ marginTop: "1rem" }}>
              <Button onClick={finishQuiz} style={{ width: "100%", justifyContent: "center" }}>
                <Send size={16} />
                {tx("إنهاء وتسليم الإجابات الآن", "Finish & Submit Answers")}
              </Button>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {quizResult && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: quizResult.passed ? "#dcfce7" : "#fee2e2",
                color: quizResult.passed ? "#16a34a" : "#dc2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem"
              }}
            >
              {quizResult.passed ? <CheckCircle2 size={46} /> : <XCircle size={46} />}
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>
              {quizResult.passed ? tx("تهانينا! لقد اجتزت الاختبار", "Congratulations! You Passed") : tx("للأسف، لم تجتز درجة النجاح", "Quiz Not Passed")}
            </h2>

            <p style={{ color: "#64748b", fontSize: "15px" }}>
              {tx("درجتك النهائية:", "Your final score:")} <strong>{quizResult.score} / {quizResult.totalPoints}</strong> ({quizResult.percentage}%)
            </p>

            <div style={{ margin: "1.5rem 0", display: "inline-block" }}>
              <Badge tone={quizResult.passed ? "success" : "danger"}>
                {quizResult.passed ? tx("حالة الاعتماد: ناجح", "Status: Passed") : tx("حالة الاعتماد: يحتاج إعادة", "Status: Needs Retake")}
              </Badge>
            </div>

            <div>
              <Button onClick={() => setActiveQuizPlayer(null)}>
                {tx("إغلاق والعودة لمساحة الكورس", "Close & Back to Course")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
