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
  UserRoundCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";
import { WESAM_COURSE_SLUG, wesamNahwJourney } from "../data/wesamNahwJourneyData";
import { MarketplaceShell } from "./MarketplacePages";

const stageIcons = [BookOpen, Map, Trophy];

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
      meta.content = "استعرض نموذج رحلة النحو التفاعلية مع الأستاذة وسام: 15 وحدة، درس تطبيقي، معمل إعراب ولوحة متابعة للطالب.";
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
          <div className="nahw-hero-visual" aria-hidden="true">
            <div className="nahw-book-cover">
              <small>الأستاذة وسام</small>
              <strong>رِحْلَةُ<br />النَّحْوِ</strong>
              <span>من الصفر إلى الإعراب بثقة</span>
              <div>نحوٌ نفهمه… لا نحفظه</div>
            </div>
            <div className="nahw-floating-card grammar"><span>مبتدأ</span><strong>العِلْمُ</strong><small>مرفوع بالضمة</small></div>
            <div className="nahw-floating-card points"><Trophy /><strong>+20</strong><small>نقطة إتقان</small></div>
          </div>
        </section>
        <nav className="nahw-local-nav" aria-label="أقسام العرض">
          <a href="#overview">فكرة البرنامج</a><a href="#curriculum">خريطة المنهج</a><a href="#sample-lesson">نموذج الدرس</a><a href="#e3rab-lab">معمل الإعراب</a><a href="#student-view">لوحة الطالب</a>
        </nav>
        <ProgramOverview />
        <CurriculumJourney />
        <SampleLesson />
        <ParsingLab />
        <StudentPreview />
        <section className="nahw-final-cta">
          <div><span><Sparkles /></span><h2>هذا هو التصور الأول للبرنامج</h2><p>بعد مراجعة الأستاذة وسام نثبت ترتيب الوحدات، نعتمد أسلوب الشرح، ونبدأ إدخال المحتوى الحقيقي درسًا بعد درس.</p></div>
          <Button as={Link} to={`/courses/${WESAM_COURSE_SLUG}`}>العودة إلى صفحة الكورس <ArrowLeft /></Button>
        </section>
      </main>
    </MarketplaceShell>
  );
}
