import {
  ArrowLeft,
  Award,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Map,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRoundCheck,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { WESAM_COURSE_SLUG, wesamNahwJourney } from "../data/wesamNahwJourneyData";
import { MarketplaceShell } from "./MarketplacePages";

const stageIcons = [BookOpen, Map, Trophy];
const practiceStorageKey = "ain:wesam-nahw-practice:v1";

function normalizeArabicAnswer(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("ar")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

function isPracticeAnswerCorrect(question, answer) {
  const accepted = question.acceptedAnswers || [question.correctAnswer];
  const normalizedAnswer = normalizeArabicAnswer(answer);
  return accepted.some((item) => normalizeArabicAnswer(item) === normalizedAnswer);
}

function loadPracticeProgress() {
  try {
    return JSON.parse(window.localStorage.getItem(practiceStorageKey)) || {};
  } catch {
    return {};
  }
}

function DemoNotice() {
  return (
    <div className="nahw-demo-notice">
      <Sparkles aria-hidden="true" />
      <div>
        <strong>نموذج عرض تجريبي للأستاذة وسام</strong>
        <span>المحتوى والتقسيم قابلان للمراجعة والاعتماد قبل الإطلاق التعليمي النهائي.</span>
      </div>
    </div>
  );
}

function ProgramOverview() {
  const facts = [
    [wesamNahwJourney.unitsCount, "وحدة متدرجة"],
    [wesamNahwJourney.lessonsCount, "درسًا قصيرًا"],
    [wesamNahwJourney.activitiesCount, "تطبيقًا وتحديًا"],
    [wesamNahwJourney.duration, "خطة مقترحة"]
  ];

  return (
    <section className="nahw-program-overview" id="overview">
      <div className="nahw-section-heading">
        <span>تجربة تعليمية وليست كتابًا تقليديًا</span>
        <h2>كل درس يبدأ بالملاحظة وينتهي بالتطبيق</h2>
        <p>
          يعتمد المسار على الشرح البصري والتدريب الفوري والتغذية الراجعة، مع الاحتفاظ
          بصوت الأستاذة وسام وأسلوبها في تبسيط القاعدة.
        </p>
      </div>
      <div className="nahw-facts-grid">
        {facts.map(([value, label]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <div className="nahw-method-grid">
        <article><span><Lightbulb /></span><h3>لاحظ</h3><p>نبدأ بمثال أو موقف بسيط يكتشف الطالب من خلاله الفكرة.</p></article>
        <article><span><BookOpen /></span><h3>افهم</h3><p>شرح مختصر وقاعدة واضحة مع ألوان وخرائط بصرية.</p></article>
        <article><span><FlaskConical /></span><h3>طبّق</h3><p>أنشطة تفاعلية ومعمل إعراب بدل الاعتماد على الحفظ.</p></article>
        <article><span><Target /></span><h3>أتقن</h3><p>اختبار قصير يعيد توجيه الطالب إلى نقطة الضعف.</p></article>
      </div>
    </section>
  );
}

function CurriculumJourney() {
  const [openStage, setOpenStage] = useState(wesamNahwJourney.stages[0].id);

  return (
    <section className="nahw-curriculum" id="curriculum">
      <div className="nahw-section-heading">
        <span>الخريطة التعليمية</span>
        <h2>ثلاث مراحل واضحة من التأسيس إلى الإعراب</h2>
        <p>الوحدات قصيرة ومترابطة، ويمكن للأستاذة إعادة ترتيبها أو إضافة أمثلة وواجبات بسهولة.</p>
      </div>
      <div className="nahw-stage-list">
        {wesamNahwJourney.stages.map((stage, index) => {
          const Icon = stageIcons[index];
          const expanded = openStage === stage.id;
          return (
            <article className={`nahw-stage ${expanded ? "is-open" : ""}`} key={stage.id} style={{ "--stage-color": stage.color }}>
              <button className="nahw-stage-header" type="button" onClick={() => setOpenStage(expanded ? "" : stage.id)} aria-expanded={expanded}>
                <span className="nahw-stage-icon"><Icon /></span>
                <span className="nahw-stage-number">المرحلة {stage.number}</span>
                <span className="nahw-stage-title"><strong>{stage.title}</strong><small>{stage.subtitle}</small></span>
                <span className="nahw-stage-count">5 وحدات</span>
                <ChevronDown className="nahw-stage-chevron" />
              </button>
              {expanded && (
                <div className="nahw-units-grid">
                  {stage.units.map((unit) => (
                    <div className={`nahw-unit-card ${unit.featured ? "is-featured" : ""}`} key={unit.number}>
                      <header><span>{String(unit.number).padStart(2, "0")}</span>{unit.featured && <Badge tone="primary">درس العرض</Badge>}</header>
                      <h3>{unit.title}</h3>
                      <p>{unit.summary}</p>
                      <ul>{unit.lessons.map((lesson) => <li key={lesson}><Check />{lesson}</li>)}</ul>
                      <footer><span><Clock3 />{unit.duration}</span><span><ListChecks />{unit.activities} أنشطة</span></footer>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SampleLesson() {
  const lesson = wesamNahwJourney.sampleLesson;
  const [revealed, setRevealed] = useState(false);

  return (
    <section className="nahw-sample-lesson" id="sample-lesson">
      <div className="nahw-section-heading">
        <span>{lesson.eyebrow}</span>
        <h2>جرّب شكل الدرس: {lesson.title}</h2>
        <p>{lesson.objective}</p>
      </div>
      <div className="nahw-lesson-board">
        <aside className="nahw-lesson-steps">
          <strong>مراحل الدرس</strong>
          <ol>
            <li className="active"><span>1</span>لاحظ المثال</li>
            <li><span>2</span>اكتشف العلاقة</li>
            <li><span>3</span>ثبّت القاعدة</li>
            <li><span>4</span>طبّق بنفسك</li>
          </ol>
          <div><Award /><strong>+20 نقطة</strong><small>عند إكمال الدرس</small></div>
        </aside>
        <div className="nahw-lesson-content">
          <div className="nahw-observation-card">
            <span><Lightbulb /> لاحظ الجملة</span>
            <strong>{lesson.observation}</strong>
            <p>فكّر في المعنى أولًا، ثم اضغط لإظهار العلاقة بين الكلمتين.</p>
            <Button variant="ghost" onClick={() => setRevealed((current) => !current)}>{revealed ? "إخفاء التحليل" : "اكتشف الإجابة"}</Button>
          </div>
          {revealed && (
            <div className="nahw-prompt-grid">
              {lesson.prompts.map((item, index) => (
                <article key={item.question}><span>{index + 1}</span><small>{item.question}</small><strong>{item.answer}</strong></article>
              ))}
            </div>
          )}
          <div className="nahw-rule-card"><BookOpen /><div><strong>القاعدة ببساطة</strong><p>{lesson.rule}</p></div></div>
          <div className="nahw-example-grid">
            {lesson.examples.map((example) => (
              <article key={example.sentence}>
                <strong>{example.sentence}</strong>
                <div><span className="subject">{example.subject}<small>مبتدأ</small></span><span className="predicate">{example.predicate}<small>خبر</small></span></div>
              </article>
            ))}
          </div>
          <div className="nahw-mistake-note"><BrainCircuit /><div><strong>انتبه للخطأ الشائع</strong><p>{lesson.commonMistake}</p></div></div>
        </div>
      </div>
    </section>
  );
}

function ParsingLab() {
  const exercise = wesamNahwJourney.parsingExercise;
  const [activeWordId, setActiveWordId] = useState(exercise.words[0].id);
  const [answers, setAnswers] = useState({});
  const activeWord = exercise.words.find((word) => word.id === activeWordId);
  const completed = Object.keys(answers).length;
  const correctAnswers = useMemo(
    () => exercise.words.filter((word) => answers[word.id] === word.correct).length,
    [answers, exercise.words]
  );

  const chooseAnswer = (answer) => {
    setAnswers((current) => ({ ...current, [activeWord.id]: answer }));
  };

  const reset = () => {
    setAnswers({});
    setActiveWordId(exercise.words[0].id);
  };

  return (
    <section className="nahw-lab-section" id="e3rab-lab">
      <div className="nahw-section-heading">
        <span>الميزة الرئيسية</span>
        <h2>معمل الإعراب التفاعلي</h2>
        <p>اختر كلمة من الجملة، ثم حدّد وظيفتها. تحصل على تفسير فوري يساعدك على التفكير لا التخمين.</p>
      </div>
      <div className="nahw-lab-shell">
        <header>
          <div><FlaskConical /><div><strong>تجربة سريعة</strong><small>حلّل الجملة كلمة كلمة</small></div></div>
          <span>{completed}/{exercise.words.length} كلمات</span>
        </header>
        <div className="nahw-lab-progress"><span style={{ width: `${(completed / exercise.words.length) * 100}%` }} /></div>
        <div className="nahw-sentence" aria-label={exercise.sentence}>
          {exercise.words.map((word) => {
            const answer = answers[word.id];
            const state = answer ? (answer === word.correct ? "correct" : "wrong") : "";
            return <button type="button" className={`${activeWordId === word.id ? "active" : ""} ${state}`} onClick={() => setActiveWordId(word.id)} key={word.id}>{word.text}{answer && <small>{answer}</small>}</button>;
          })}
        </div>
        <div className="nahw-lab-question">
          <span>ما إعراب كلمة <strong>«{activeWord.text}»</strong>؟</span>
          <div>{activeWord.options.map((option) => <button type="button" onClick={() => chooseAnswer(option)} key={option}>{option}</button>)}</div>
        </div>
        {answers[activeWord.id] && (
          <div className={answers[activeWord.id] === activeWord.correct ? "nahw-lab-feedback success" : "nahw-lab-feedback error"} role="status" aria-live="polite">
            {answers[activeWord.id] === activeWord.correct ? <CheckCircle2 /> : <RotateCcw />}
            <div><strong>{answers[activeWord.id] === activeWord.correct ? "إجابة صحيحة" : `الإجابة الصحيحة: ${activeWord.correct}`}</strong><p>{activeWord.feedback}</p></div>
          </div>
        )}
        {completed === exercise.words.length && (
          <div className="nahw-lab-result" role="status" aria-live="polite">
            <Trophy /><div><strong>أنهيت التحدي: {correctAnswers} من {exercise.words.length}</strong><span>في النسخة الكاملة تُحفظ النتيجة ويُقترح تدريب مناسب للأخطاء.</span></div><Button variant="ghost" onClick={reset}>جرّب مرة أخرى</Button>
          </div>
        )}
      </div>
    </section>
  );
}

function PracticeStudio() {
  const { isAuthenticated } = useAuth();
  const tracks = wesamNahwJourney.practiceTracks;
  const [progress, setProgress] = useState(loadPracticeProgress);
  const [activeTrackId, setActiveTrackId] = useState(tracks[0].id);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState("");
  const activeTrack = tracks.find((track) => track.id === activeTrackId) || tracks[0];
  const trackProgress = progress[activeTrack.id] || { answers: {} };
  const answers = trackProgress.answers || {};
  const currentQuestion = activeTrack.questions[questionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const answeredCount = Object.keys(answers).length;
  const correctCount = activeTrack.questions.filter((question) => (
    answers[question.id] != null && isPracticeAnswerCorrect(question, answers[question.id])
  )).length;
  const completed = answeredCount === activeTrack.questions.length;
  const showingResult = questionIndex >= activeTrack.questions.length;
  const percentage = Math.round((correctCount / activeTrack.questions.length) * 100);

  useEffect(() => {
    try {
      window.localStorage.setItem(practiceStorageKey, JSON.stringify(progress));
    } catch {
      // Practice remains usable when storage is unavailable.
    }
  }, [progress]);

  const openTrack = (track) => {
    const savedAnswers = progress[track.id]?.answers || {};
    const nextQuestion = track.questions.findIndex((question) => savedAnswers[question.id] == null);
    setActiveTrackId(track.id);
    setQuestionIndex(nextQuestion === -1 ? track.questions.length : nextQuestion);
    setDraftAnswer("");
  };

  const submitAnswer = (answer) => {
    const value = String(answer || "").trim();
    if (!currentQuestion || currentAnswer != null || !value) return;
    setProgress((current) => ({
      ...current,
      [activeTrack.id]: {
        ...(current[activeTrack.id] || {}),
        answers: {
          ...(current[activeTrack.id]?.answers || {}),
          [currentQuestion.id]: value
        },
        updatedAt: new Date().toISOString()
      }
    }));
    setDraftAnswer("");
  };

  const moveNext = () => {
    setQuestionIndex((current) => Math.min(current + 1, activeTrack.questions.length));
    setDraftAnswer("");
  };

  const resetTrack = () => {
    setProgress((current) => {
      const next = { ...current };
      delete next[activeTrack.id];
      return next;
    });
    setQuestionIndex(0);
    setDraftAnswer("");
  };

  return (
    <section className="nahw-practice-section" id="practice">
      <div className="nahw-section-heading">
        <span>تدريبات مجانية بتصحيح فوري</span>
        <h2>اختبر نفسك وتعلّم من كل إجابة</h2>
        <p>اختر المستوى، راجع القاعدة، ثم حل التدريب. نتيجتك تحفظ على هذا الجهاز ويمكنك إعادة أي مجموعة لتحسين مستواك.</p>
      </div>
      <div className="nahw-practice-layout">
        <aside className="nahw-practice-tracks" aria-label="مجموعات التدريب">
          {tracks.map((track, index) => {
            const savedAnswers = progress[track.id]?.answers || {};
            const trackScore = track.questions.filter((question) => (
              savedAnswers[question.id] != null && isPracticeAnswerCorrect(question, savedAnswers[question.id])
            )).length;
            const trackComplete = Object.keys(savedAnswers).length === track.questions.length;
            return (
              <button
                className={track.id === activeTrack.id ? "active" : ""}
                key={track.id}
                onClick={() => openTrack(track)}
                type="button"
              >
                <span>{index + 1}</span>
                <div><strong>{track.title}</strong><small>{track.level} · {track.duration}</small></div>
                {trackComplete ? <b>{trackScore}/{track.questions.length}</b> : <em>{Object.keys(savedAnswers).length}/{track.questions.length}</em>}
              </button>
            );
          })}
          <div className="nahw-practice-save-note">
            <CheckCircle2 />
            <div><strong>تقدمك محفوظ</strong><small>{isAuthenticated ? "يمكنك متابعة اختباراتك المسجلة من لوحة الطالب." : "أنشئ حسابًا مجانيًا لحفظ الدرجات على حسابك."}</small></div>
          </div>
        </aside>

        <div className="nahw-practice-player">
          <header>
            <div><Badge tone="primary">{activeTrack.level}</Badge><h3>{activeTrack.title}</h3><p>{activeTrack.description}</p></div>
            <span>{answeredCount}/{activeTrack.questions.length}</span>
          </header>
          <div className="nahw-practice-progress" aria-label={`أكملت ${answeredCount} من ${activeTrack.questions.length}`}>
            <span style={{ width: `${(answeredCount / activeTrack.questions.length) * 100}%` }} />
          </div>

          {!showingResult && currentQuestion && (
            <>
              <div className="nahw-practice-lesson">
                <div><BookOpen /><strong>راجع القاعدة</strong></div>
                <p>{activeTrack.lesson.rule}</p>
                <small><Lightbulb />{activeTrack.lesson.example}</small>
              </div>
              <div className="nahw-practice-question">
                <div className="nahw-question-meta"><span>السؤال {questionIndex + 1} من {activeTrack.questions.length}</span><strong>10 نقاط</strong></div>
                <h3>{currentQuestion.prompt}</h3>
                {currentQuestion.type === "text" ? (
                  <form onSubmit={(event) => { event.preventDefault(); submitAnswer(draftAnswer); }}>
                    <input
                      aria-label="اكتب إجابتك"
                      disabled={currentAnswer != null}
                      onChange={(event) => setDraftAnswer(event.target.value)}
                      placeholder="اكتب إجابتك هنا..."
                      value={currentAnswer ?? draftAnswer}
                    />
                    {currentAnswer == null && <Button type="submit" disabled={!draftAnswer.trim()}>تحقق من الإجابة</Button>}
                  </form>
                ) : (
                  <div className="nahw-practice-options">
                    {currentQuestion.options.map((option) => {
                      const answered = currentAnswer != null;
                      const selected = currentAnswer === option;
                      const correct = answered && option === currentQuestion.correctAnswer;
                      const wrong = answered && selected && !correct;
                      return (
                        <button
                          className={`${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
                          disabled={answered}
                          key={option}
                          onClick={() => submitAnswer(option)}
                          type="button"
                        >
                          <span>{option}</span>{correct && <CheckCircle2 />}{wrong && <XCircle />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {currentAnswer != null && (
                <div className={`nahw-practice-feedback ${isPracticeAnswerCorrect(currentQuestion, currentAnswer) ? "success" : "error"}`} role="status" aria-live="polite">
                  {isPracticeAnswerCorrect(currentQuestion, currentAnswer) ? <CheckCircle2 /> : <XCircle />}
                  <div>
                    <strong>{isPracticeAnswerCorrect(currentQuestion, currentAnswer) ? "إجابة صحيحة، أحسنت!" : `الإجابة الصحيحة: ${currentQuestion.correctAnswer}`}</strong>
                    <p>{currentQuestion.explanation}</p>
                  </div>
                </div>
              )}
              <footer className="nahw-practice-actions">
                <button type="button" onClick={resetTrack}><RotateCcw /> ابدأ المجموعة من جديد</button>
                {currentAnswer != null && <Button onClick={moveNext}>{questionIndex === activeTrack.questions.length - 1 ? "اعرض النتيجة" : "السؤال التالي"}<ArrowLeft /></Button>}
              </footer>
            </>
          )}

          {showingResult && completed && (
            <div className="nahw-practice-result" role="status" aria-live="polite">
              <span className={percentage >= 70 ? "success" : "needs-work"}><Trophy /></span>
              <small>نتيجة مجموعة {activeTrack.title}</small>
              <strong>{percentage}%</strong>
              <h3>{percentage >= 85 ? "ممتاز، أتقنت هذه المهارة" : percentage >= 70 ? "أحسنت، أنت جاهز للخطوة التالية" : "بداية جيدة، راجع القاعدة وحاول مرة أخرى"}</h3>
              <p>أجبت عن {correctCount} إجابات صحيحة من أصل {activeTrack.questions.length}. التصحيح والشرح يظلان متاحين عند إعادة المجموعة.</p>
              <div>
                <Button variant="ghost" onClick={resetTrack}><RotateCcw /> إعادة التدريب</Button>
                {isAuthenticated
                  ? <Button as={Link} to="/end-user/quizzes">اختباراتي المسجلة <ArrowLeft /></Button>
                  : <Button as={Link} to="/create-account">أنشئ حسابًا واحفظ نتائجك <ArrowLeft /></Button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StudentPreview() {
  return (
    <section className="nahw-student-preview" id="student-view">
      <div className="nahw-section-heading">
        <span>تصور لوحة الطالب</span>
        <h2>يعرف أين وصل وما الخطوة التالية</h2>
        <p>بيانات تجريبية توضح للأستاذة شكل المتابعة والتحفيز داخل البرنامج.</p>
      </div>
      <div className="nahw-dashboard-demo">
        <div className="nahw-profile-summary">
          <span><UserRoundCheck /></span>
          <div><small>مرحبًا يا سلمى</small><strong>استمري، أنتِ على الطريق الصحيح</strong></div>
          <div className="nahw-level-pill"><Star /> المستوى 3</div>
        </div>
        <div className="nahw-dashboard-grid">
          <article className="nahw-next-lesson">
            <Badge tone="primary">الدرس التالي</Badge>
            <h3>المبتدأ والخبر</h3>
            <p>الوحدة السادسة · الدرس الثاني</p>
            <div><span style={{ width: "68%" }} /></div>
            <small>أكملتِ 17 من 25 دقيقة</small>
            <Button><PlayCircle /> متابعة التعلّم</Button>
          </article>
          <article className="nahw-progress-card"><strong>32%</strong><span>إجمالي التقدم</span><small>5 وحدات مكتملة</small></article>
          <article className="nahw-progress-card"><strong>420</strong><span>نقطة تعلّم</span><small>+60 هذا الأسبوع</small></article>
          <article className="nahw-progress-card"><strong>4 أيام</strong><span>سلسلة الاستمرار</span><small>أفضل سلسلة: 7 أيام</small></article>
          <article className="nahw-skill-card">
            <header><strong>مهاراتك الآن</strong><span>تحديث تلقائي</span></header>
            {[["أقسام الكلمة", 92], ["الجملة الاسمية", 74], ["علامات الإعراب", 48]].map(([skill, score]) => <div key={skill}><span>{skill}</span><strong>{score}%</strong><div><i style={{ width: `${score}%` }} /></div></div>)}
          </article>
          <article className="nahw-recommendation-card"><BrainCircuit /><div><strong>اقتراح الأستاذة وسام</strong><p>راجعي علامات الاسم، ثم حاولي تحدي التصنيف مرة أخرى قبل الانتقال للوحدة التالية.</p></div></article>
        </div>
      </div>
    </section>
  );
}

export function WesamNahwJourneyPage() {
  const { direction } = useLanguage();

  useEffect(() => {
    document.title = "رحلة النحو مع وسام | تجربة تعليمية تفاعلية";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.content = "جرّب رحلة النحو التفاعلية مع الأستاذة وسام: 15 وحدة، معمل إعراب، و18 سؤالًا بتصحيح وشرح فوري.";
    }
  }, []);

  return (
    <MarketplaceShell>
      <main className="nahw-journey-page" dir={direction}>
        <DemoNotice />
        <section className="nahw-hero">
          <div className="nahw-hero-copy">
            <Badge tone="primary"><GraduationCap /> برنامج الأستاذة وسام</Badge>
            <h1>{wesamNahwJourney.title}</h1>
            <h2>{wesamNahwJourney.subtitle}</h2>
            <p>{wesamNahwJourney.description}</p>
            <div className="nahw-hero-actions">
              <Button as="a" href="#sample-lesson"><PlayCircle /> جرّب درسًا الآن</Button>
              <Button as="a" href="#curriculum" variant="ghost"><Map /> شاهد خريطة المنهج</Button>
            </div>
            <div className="nahw-trust-row"><span><CheckCircle2 /> مجاني للتجربة</span><span><CheckCircle2 /> تعلّم ذاتي</span><span><CheckCircle2 /> مناسب للموبايل</span></div>
          </div>
          <div className="nahw-hero-visual">
            <div className="nahw-book-cover">
              <img
                src="/images/courses/wesam-nahw-journey.jpg"
                alt="كتاب عربي مفتوح يرمز إلى رحلة تعلم النحو"
              />
              <div className="nahw-book-caption" aria-hidden="true">
                <small>الأستاذة وسام</small>
                <strong>رِحْلَةُ النَّحْوِ</strong>
              </div>
            </div>
            <div className="nahw-floating-card grammar"><span>مبتدأ</span><strong>العِلْمُ</strong><small>مرفوع بالضمة</small></div>
            <div className="nahw-floating-card points"><Trophy /><strong>+20</strong><small>نقطة إتقان</small></div>
          </div>
        </section>
        <nav className="nahw-local-nav" aria-label="أقسام العرض">
          <a href="#overview">فكرة البرنامج</a><a href="#curriculum">خريطة المنهج</a><a href="#sample-lesson">نموذج الدرس</a><a href="#e3rab-lab">معمل الإعراب</a><a href="#practice">التدريبات</a><a href="#student-view">لوحة الطالب</a>
        </nav>
        <ProgramOverview />
        <CurriculumJourney />
        <SampleLesson />
        <ParsingLab />
        <PracticeStudio />
        <StudentPreview />
        <section className="nahw-final-cta">
          <div><span><Sparkles /></span><h2>هذا هو التصور الأول للبرنامج</h2><p>بعد مراجعة الأستاذة وسام نثبت ترتيب الوحدات، نعتمد أسلوب الشرح، ونبدأ إدخال المحتوى الحقيقي درسًا بعد درس.</p></div>
          <Button as={Link} to={`/courses/${WESAM_COURSE_SLUG}`}>العودة إلى صفحة الكورس <ArrowLeft /></Button>
        </section>
      </main>
    </MarketplaceShell>
  );
}
