import {
  ArrowLeft, ArrowRight, Award, BadgeCheck, BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronDown,
  Clock3, CreditCard, ExternalLink, Filter, GraduationCap, Languages, MapPin, Megaphone, Menu, MessageCircle, MonitorPlay,
  Phone, Rocket, Search, Share2, ShieldCheck, SlidersHorizontal, Sparkles, Star, Store, Sun, Moon, UserRound, Users, Wallet, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { Modal } from "../components/Modal";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { api } from "../services/api";

function nameOf(item, arabic = true) {
  if (!item) return "";
  return arabic
    ? (item?.nameAr || item?.titleAr || item?.name || item?.title || "")
    : (item?.nameEn || item?.titleEn || item?.name || item?.title || item?.nameAr || item?.titleAr || "");
}

function translateLevel(level, isArabic) {
  if (!isArabic) return level;
  const map = {
    Beginner: "مبتدئ",
    beginner: "مبتدئ",
    Intermediate: "متوسط",
    intermediate: "متوسط",
    Advanced: "متقدم",
    advanced: "متقدم",
    All: "جميع المستويات"
  };
  return map[level] || level;
}

function formatBatchSchedule(schedule, isArabic) {
  if (!Array.isArray(schedule)) return schedule || "";
  return schedule.map((slot) => {
    const time = slot.startTime && slot.endTime
      ? `${slot.startTime}-${slot.endTime}`
      : slot.time || slot.startTime || "";
    return [slot.day, time].filter(Boolean).join(" ");
  }).join(isArabic ? "، " : ", ");
}

function formatMarketDate(value, isArabic) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function translateDelivery(deliveryType, isArabic) {
  if (!isArabic) return deliveryType;
  const map = {
    online: "أونلاين",
    offline: "حضوري",
    onsite: "حضوري",
    hybrid: "مدمج",
    recorded: "مسجل"
  };
  return map[deliveryType] || deliveryType;
}

function providerTypeFor(course, academy) {
  return course?.providerType || academy?.providerType || "academy";
}

function providerLabel(type, copy) {
  if (type === "independent_instructor") return copy("مدرس مستقل", "Independent instructor");
  if (type === "training_center") return copy("مركز تدريبي", "Training center");
  return copy("أكاديمية", "Academy");
}

function useMarketI18n() {
  const { language, toggleLanguage, direction } = useLanguage();
  return { language, direction, toggleLanguage, isArabic: language === "ar", copy: (ar, en) => language === "ar" ? ar : en };
}

function useMarketplaceSeo(title, description) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = description;
  }, [description, title]);
}

export function MarketplaceShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { direction, isArabic, toggleLanguage, copy } = useMarketI18n();
  const { theme, toggleTheme } = useTheme();
  return <div className="marketplace-shell" dir={direction}>
    <header className="marketplace-nav">
      <div className="marketplace-nav-inner">
        <Link className="marketplace-brand" to="/courses"><img src="/images/ain-logo.png" alt="AIN" /><strong>{copy("منصة عين", "AIN Platform")}</strong></Link>
        <button className="marketplace-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={copy("فتح القائمة", "Open menu")} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? "open" : ""}>
          <Link to="/courses">{copy("الكورسات", "Courses")}</Link><Link to="/academies">{copy("المدرسون والأكاديميات", "Educators")}</Link><Link to="/sell-courses">{copy("انشر كورسك", "Sell courses")}</Link>
        </nav>
        <div className="marketplace-nav-actions"><div className="marketplace-nav-tools"><button onClick={toggleLanguage}>{isArabic ? "EN" : "ع"}</button><button onClick={toggleTheme} aria-label={copy("تبديل المظهر", "Toggle theme")}>{theme === "dark" ? <Sun /> : <Moon />}</button></div><Link className="marketplace-signin" to="/login">{copy("تسجيل الدخول", "Sign in")}</Link><Button as={Link} to="/sell-courses">{copy("ابدأ البيع", "Start selling")}</Button></div>
      </div>
    </header>
    {children}
    <footer className="marketplace-footer"><div className="marketplace-footer-brand"><img src="/images/ain-logo.png" alt="" /><strong>AIN</strong><span>{copy("تعلم. أدر. انمُ.", "Learn. Manage. Grow.")}</span></div><nav><Link to="/courses">{copy("الكورسات", "Courses")}</Link><Link to="/academies">{copy("مقدمو الكورسات", "Educators")}</Link><Link to="/sell-courses">{copy("انشر كورسك", "Sell courses")}</Link><Link to="/privacy">{copy("الخصوصية", "Privacy")}</Link><Link to="/support">{copy("الدعم", "Support")}</Link></nav><small>© 2026 AIN Platform</small></footer>
  </div>;
}

function CourseCard({ course }) {
  const { academies, instructors, batches, categories } = useMarketplace();
  const academy = academies.find((item) => item.id === course.academyId);
  const instructor = instructors.find((item) => item.id === course.instructorId);
  const batch = batches.find((item) => item.courseId === course.id && item.status === "open");
  const category = categories.find((item) => item.id === course.categoryId);
  const unlimitedEnrollment = batch?.capacity == null;
  const remaining = batch && !unlimitedEnrollment
    ? Math.max(0, batch.capacity - batch.confirmedSeats - batch.reservedSeats)
    : null;
  const isFree = Number(course.discountedPrice ?? course.price ?? 0) === 0;
  const { isArabic, copy } = useMarketI18n();
  const providerType = providerTypeFor(course, academy);
  return <article className="market-course-card">
    <Link className="market-course-cover" to={`/courses/${course.slug}`}>{course.coverUrl ? <img src={course.coverUrl} alt="" loading="lazy" /> : <BookOpen />}<div>{course.sponsored && <Badge tone="warning">{copy("إعلان ممول", "Sponsored")}</Badge>}{course.featured && <Badge tone="primary">{copy("مميز", "Featured")}</Badge>}</div></Link>
    <div className="market-course-body"><span>{nameOf(category, isArabic)} · {translateLevel(course.level, isArabic)}</span><Link to={`/courses/${course.slug}`}><h2>{nameOf(course, isArabic)}</h2></Link><p>{isArabic ? course.shortDescriptionAr : course.shortDescription}</p>
      <div className="market-course-owner"><span style={{ background: academy?.color }}>{academy?.initials}</span><div><strong>{instructor ? nameOf(instructor, isArabic) : copy("فريق التعليم", "Education team")}</strong><small>{nameOf(academy, isArabic)} {academy?.verified && <BadgeCheck size={14} />} · {providerLabel(providerType, copy)}</small></div></div>
      <div className="market-course-meta"><span><MonitorPlay />{translateDelivery(course.deliveryType, isArabic)}</span><span><CalendarDays />{course.deliveryType === "recorded" ? copy("متاح الآن", "Available now") : (batch?.startDate || copy("قريبًا", "Soon"))}</span><span><Users />{unlimitedEnrollment ? copy("تسجيل مفتوح", "Open enrollment") : `${remaining} ${copy("مكان متبقٍ", "seats left")}`}</span></div>
      <footer><div>{!isFree && course.discountedPrice && <del>{course.price.toLocaleString()} {copy("ج.م", "EGP")}</del>}<strong>{isFree ? copy("مجاني", "Free") : `${(course.discountedPrice || course.price).toLocaleString()} ${copy("ج.م", "EGP")}`}</strong></div><Button as={Link} to={`/courses/${course.slug}`}>{copy("عرض التفاصيل", "View details")}</Button></footer>
    </div>
  </article>;
}

export function CoursesMarketplacePage() {
  const { courses, categories, academies, instructors } = useMarketplace();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { isArabic, copy } = useMarketI18n();
  useMarketplaceSeo(copy("الكورسات | AIN Platform", "Courses | AIN Platform"), copy("ابحث عن كورسات ومدرسين وأكاديميات واحجز دفعتك على منصة AIN.", "Discover courses, instructors, and academies and reserve your batch on AIN."));
  const query = params.get("q") || "";
  const category = params.get("category") || "all";
  const delivery = params.get("delivery") || "all";
  const provider = params.get("provider") || "all";
  const sort = params.get("sort") || "featured";
  const set = (key, value) => { const next = new URLSearchParams(params); value && value !== "all" ? next.set(key, value) : next.delete(key); setParams(next); };
  const visible = useMemo(() => {
    const text = query.toLowerCase().trim();
    const filtered = courses.filter((course) => course.status === "published")
      .filter((course) => category === "all" || course.categoryId === category)
      .filter((course) => delivery === "all" || course.deliveryType === delivery)
      .filter((course) => provider === "all" || providerTypeFor(course, academies.find((item) => item.id === course.academyId)) === provider)
      .filter((course) => !text || [course.title, course.titleAr, course.subject, academies.find((a) => a.id === course.academyId)?.name, instructors.find((i) => i.id === course.instructorId)?.name].join(" ").toLowerCase().includes(text));
    return [...filtered].sort((a, b) => sort === "price-low" ? (a.discountedPrice || a.price) - (b.discountedPrice || b.price) : sort === "price-high" ? (b.discountedPrice || b.price) - (a.discountedPrice || a.price) : Number(b.featured) - Number(a.featured));
  }, [academies, category, courses, delivery, instructors, provider, query, sort]);
  return <MarketplaceShell>
    <main className="marketplace-main">
      <section className="marketplace-hero"><Badge tone="primary"><Sparkles size={14} />{copy("مدرسون مستقلون وأكاديميات موثقة", "Independent instructors and verified academies")}</Badge><h1>{copy("اكتشف كورسك القادم، وانضم من مكان واحد", "Discover your next course in one place")}</h1><p>{copy("قارن بين كورسات المدرسين المستقلين والأكاديميات، واختر طريقة التعلم والدفعة المناسبة ثم احجز مكانك.", "Compare courses from independent instructors and academies, choose the right format and batch, then reserve your seat.")}</p>
        <label className="marketplace-search"><Search /><input value={query} onChange={(e) => set("q", e.target.value)} placeholder={copy("ابحث عن مادة، مدرس، أكاديمية أو كورس...", "Search courses, instructors, or academies...")} /><Button>{copy("بحث", "Search")}</Button></label>
      </section>
      <section className="marketplace-categories">{categories.filter((item) => item.active).map((item) => <button className={category === item.id ? "active" : ""} onClick={() => set("category", item.id)} key={item.id}><GraduationCap />{nameOf(item, isArabic)}</button>)}</section>
      <div className="marketplace-results-head"><div><h2>{copy("الكورسات المتاحة", "Available courses")}</h2><p>{visible.length} {copy("نتيجة مناسبة", "matching results")}</p></div><button className="marketplace-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal /> {copy("الفلاتر", "Filters")}</button><select value={sort} onChange={(e) => set("sort", e.target.value)}><option value="featured">{copy("المميزة أولًا", "Featured first")}</option><option value="price-low">{copy("السعر: الأقل أولًا", "Price: low to high")}</option><option value="price-high">{copy("السعر: الأعلى أولًا", "Price: high to low")}</option></select></div>
      <div className="marketplace-results-layout">
        <aside className={filtersOpen ? "open" : ""}><header><strong>{copy("تصفية النتائج", "Filter results")}</strong><button onClick={() => setFiltersOpen(false)}><X /></button></header><label>{copy("مقدم الكورس", "Course provider")}<select value={provider} onChange={(e) => set("provider", e.target.value)}><option value="all">{copy("الكل", "All")}</option><option value="independent_instructor">{copy("مدرس مستقل", "Independent instructor")}</option><option value="academy">{copy("أكاديمية", "Academy")}</option><option value="training_center">{copy("مركز تدريبي", "Training center")}</option></select></label><label>{copy("نوع الحضور", "Delivery type")}<select value={delivery} onChange={(e) => set("delivery", e.target.value)}><option value="all">{copy("الكل", "All")}</option><option value="online">{copy("أونلاين", "Online")}</option><option value="offline">{copy("حضوري", "On-site")}</option><option value="hybrid">{copy("مدمج", "Hybrid")}</option><option value="recorded">{copy("مسجل", "Recorded")}</option></select></label><label>{copy("التصنيف", "Category")}<select value={category} onChange={(e) => set("category", e.target.value)}><option value="all">{copy("كل التصنيفات", "All categories")}</option>{categories.map((item) => <option value={item.id} key={item.id}>{nameOf(item, isArabic)}</option>)}</select></label><Button variant="ghost" onClick={() => setParams({})}>{copy("مسح الفلاتر", "Clear filters")}</Button></aside>
        <section className="market-course-grid">{visible.length ? visible.map((course) => <CourseCard course={course} key={course.id} />) : <div className="market-empty"><Search /><h2>{copy("لا توجد نتائج مطابقة", "No matching results")}</h2><p>{copy("غيّر كلمات البحث أو امسح بعض الفلاتر.", "Try another search or clear some filters.")}</p><Button onClick={() => setParams({})}>{copy("عرض كل الكورسات", "View all courses")}</Button></div>}</section>
      </div>
    </main>
  </MarketplaceShell>;
}

export function CourseSellerPage() {
  const { copy } = useMarketI18n();
  useMarketplaceSeo(
    copy("انشر كورسك | AIN Platform", "Sell your course | AIN Platform"),
    copy(
      "انشر وسوّق كورساتك كمدرس مستقل أو أكاديمية، وأدر التسجيلات والدفعات من مساحة واحدة.",
      "Publish and market courses as an independent instructor or academy, and manage enrollments and cohorts in one workspace."
    )
  );

  const steps = [
    [UserRound, copy("أنشئ حساب مقدم كورس", "Create an educator account"), copy("اختر مدرسًا مستقلًا أو أكاديمية، ثم أضف بياناتك الأساسية.", "Choose independent instructor or academy, then add your basics.")],
    [Store, copy("جهّز صفحتك العامة", "Build your storefront"), copy("أضف الهوية والنبذة والمدرسين ووسائل التواصل المتاحة.", "Add your brand, bio, instructors, and contact details.")],
    [BookOpen, copy("أضف الكورس والدفعات", "Add courses and cohorts"), copy("حدد المحتوى والسعر وطريقة الحضور والمواعيد وعدد المقاعد.", "Set content, pricing, delivery format, schedule, and capacity.")],
    [Rocket, copy("راجع ثم انشر", "Review and publish"), copy("بعد مراجعة الجودة يظهر الكورس في السوق ويصبح جاهزًا للتسويق والحجز.", "After quality review, your course appears in the marketplace ready for promotion and enrollment.")]
  ];

  return <MarketplaceShell><main className="seller-page">
    <section className="seller-hero">
      <div><Badge tone="primary"><Megaphone size={14} />{copy("سوق AIN للكورسات", "AIN Course Marketplace")}</Badge><h1>{copy("علّم بطريقتك، وخلّي كورسك يوصل للطالب المناسب", "Teach your way and reach the right students")}</h1><p>{copy("سواء كنت مدرسًا مستقلًا أو تدير أكاديمية، تحصل على صفحة عامة للكورسات ومساحة لإدارة الدفعات والحجوزات والمحتوى.", "Whether you teach independently or run an academy, you get a public course storefront plus tools for cohorts, bookings, and content.")}</p><div className="seller-hero-actions"><Button as={Link} to="/register-company?type=independent_instructor">{copy("ابدأ كمدرس مستقل", "Start as an instructor")}</Button><Button as={Link} to="/register-company?type=academy" variant="ghost">{copy("سجّل أكاديميتك", "Register your academy")}</Button></div><small><ShieldCheck />{copy("نراجع بيانات مقدم الكورس قبل النشر لحماية ثقة الطلاب.", "We review provider details before publishing to protect student trust.")}</small></div>
      <div className="seller-preview" aria-hidden="true"><span><Store /></span><div><small>{copy("صفحتك على السوق", "Your marketplace page")}</small><strong>{copy("اسمك أو اسم أكاديميتك", "Your name or academy")}</strong><p>{copy("كورسات مباشرة ومسجلة · حجوزات ودفعات", "Live and recorded courses · bookings and cohorts")}</p></div><div className="seller-preview-metric"><strong>3</strong><span>{copy("كورسات جاهزة للنشر", "courses ready to publish")}</span></div></div>
    </section>

    <section className="seller-choice-section"><header><span>{copy("اختر الشكل المناسب لك", "Choose your setup")}</span><h2>{copy("نفس قوة المنصة، بإدارة تناسب حجمك", "One platform, sized for how you teach")}</h2></header><div className="seller-choice-grid">
      <article><span><UserRound /></span><h3>{copy("مدرس مستقل", "Independent instructor")}</h3><p>{copy("صفحة باسمك، كورساتك وأسعارك، وإدارة الطلاب والدفعات بدون الحاجة إلى سنتر.", "A storefront under your name, with your courses, pricing, students, and cohorts—no center required.")}</p><ul><li><Check />{copy("هوية شخصية موثقة", "Verified personal profile")}</li><li><Check />{copy("كورس مباشر أو مسجل", "Live or recorded courses")}</li><li><Check />{copy("أكواد خصم وحملات ترويجية", "Discount codes and promotions")}</li></ul><Button as={Link} to="/register-company?type=independent_instructor">{copy("أنشئ صفحة مدرس", "Create instructor page")}</Button></article>
      <article className="featured"><span><Building2 /></span><h3>{copy("أكاديمية أو مركز", "Academy or center")}</h3><p>{copy("متجر تعليمي بهوية الأكاديمية، مع عدة مدرسين وكورسات وفروع ودفعات.", "A branded education storefront with multiple instructors, courses, branches, and cohorts.")}</p><ul><li><Check />{copy("فريق وصلاحيات متعددة", "Team roles and permissions")}</li><li><Check />{copy("إدارة مدرسين وفروع", "Instructor and branch management")}</li><li><Check />{copy("تقارير الحجوزات والأداء", "Booking and performance reports")}</li></ul><Button as={Link} to="/register-company?type=academy">{copy("سجّل الأكاديمية", "Register academy")}</Button></article>
    </div></section>

    <section className="seller-steps"><header><span>{copy("من التسجيل إلى أول حجز", "From signup to first booking")}</span><h2>{copy("أربع خطوات واضحة للنشر", "Four clear steps to publish")}</h2></header><div>{steps.map(([Icon, title, description], index) => <article key={title}><b>{index + 1}</b><span><Icon /></span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="seller-final-cta"><div><h2>{copy("جاهز تعرض كورساتك في سوق AIN؟", "Ready to list your courses on AIN?")}</h2><p>{copy("ابدأ بإنشاء حسابك، وجهّز أول كورس للمراجعة والنشر.", "Create your account and prepare your first course for review and publishing.")}</p></div><Button as={Link} to="/register-company?type=independent_instructor">{copy("ابدأ الآن", "Get started")}</Button><Link to="/courses">{copy("شاهد تجربة الطالب", "View student experience")}</Link></section>
  </main></MarketplaceShell>;
}

export function CourseDetailsPage() {
  const { courseSlug } = useParams();
  const { courses, academies, instructors, batches, categories, getPublicCourse, loading } = useMarketplace();
  const { isArabic, copy } = useMarketI18n();
  const summaryCourse = courses.find((item) => item.slug === courseSlug && item.status === "published");
  const [courseDetails, setCourseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setCourseDetails(null);
    if (!summaryCourse) return () => { active = false; };
    setDetailsLoading(true);
    getPublicCourse(summaryCourse.id)
      .then((result) => {
        if (active) setCourseDetails(result);
      })
      .catch(() => {
        if (active) setCourseDetails(summaryCourse);
      })
      .finally(() => {
        if (active) setDetailsLoading(false);
      });
    return () => { active = false; };
  }, [getPublicCourse, summaryCourse?.id]);

  const course = courseDetails || summaryCourse;
  useMarketplaceSeo(
    course ? `${nameOf(course, isArabic)} | AIN` : copy("الكورسات | AIN", "Courses | AIN"),
    course ? (isArabic ? course.shortDescriptionAr : course.shortDescription) : ""
  );
  if (loading) return <MarketplaceShell><main className="course-detail-main"><div className="market-empty"><BookOpen /><h2>{copy("جارٍ تحميل الكورس...", "Loading course...")}</h2></div></main></MarketplaceShell>;
  if (!summaryCourse) return <Navigate to="/courses" replace />;
  const academy = academies.find((item) => item.id === course.academyId);
  const instructor = instructors.find((item) => item.id === course.instructorId);
  const category = categories.find((item) => item.id === course.categoryId);
  const courseBatches = courseDetails?.batches?.length
    ? courseDetails.batches.filter((item) => item.status === "open")
    : batches.filter((item) => item.courseId === course.id && item.status === "open");
  const learningOutcomes = Array.isArray(course.learningOutcomes) ? course.learningOutcomes : [];
  return <MarketplaceShell><main className="course-detail-main">
    <div className="market-breadcrumbs"><Link to="/courses">{copy("الكورسات", "Courses")}</Link><span>/</span><span>{nameOf(category, isArabic)}</span><span>/</span><strong>{nameOf(course, isArabic)}</strong></div>
    <section className="course-detail-hero"><div><Badge tone="primary">{nameOf(category, isArabic)}</Badge><h1>{nameOf(course, isArabic)}</h1><p>{isArabic ? course.shortDescriptionAr : course.shortDescription}</p><div className="course-detail-owner"><span style={{ background: academy?.color }}>{academy?.initials}</span><div><strong>{nameOf(academy, isArabic)} {academy?.verified && <BadgeCheck />}</strong><small>{copy("بواسطة", "By")} {nameOf(instructor, isArabic)}</small></div></div><div className="course-detail-facts"><span><Clock3 />{course.duration}</span><span><BookOpen />{course.sessions} {copy("حصة", "sessions")}</span><span><MonitorPlay />{translateDelivery(course.deliveryType, isArabic)}</span></div></div><div className="course-visual">{course.coverUrl ? <img src={course.coverUrl} alt="" /> : <GraduationCap />}</div></section>
    <div className="course-detail-layout"><div className="course-detail-content"><section><h2>{copy("عن الكورس", "About this course")}</h2><p>{isArabic ? course.descriptionAr : course.description}</p></section>{(detailsLoading || learningOutcomes.length > 0) && <section><h2>{copy("ماذا ستتعلم؟", "What you will learn")}</h2>{detailsLoading ? <p>{copy("جارٍ تحميل تفاصيل الكورس...", "Loading course details...")}</p> : <div className="outcomes-grid">{learningOutcomes.map((item) => <span key={item}><Check />{item}</span>)}</div>}</section>}<section><h2>{copy("المدرس", "Instructor")}</h2><div className="instructor-profile"><span>{instructor?.initials}</span><div><h3>{nameOf(instructor, isArabic)}</h3><strong>{instructor?.specialty}</strong><p>{instructor?.bio}</p></div></div></section><section><h2>{copy(course.deliveryType === "recorded" ? "التسجيل" : "الدفعات المتاحة", course.deliveryType === "recorded" ? "Enrollment" : "Available batches")}</h2><div className="batch-public-list">{courseBatches.map((batch) => { const unlimited = batch.capacity == null; const remaining = unlimited ? null : (batch.remainingSeats ?? Math.max(0, Number(batch.capacity || 0) - Number(batch.confirmedSeats || 0) - Number(batch.reservedSeats || 0))); return <article key={batch.id}><CalendarDays /><div><strong>{nameOf(batch, isArabic)}</strong><span>{course.deliveryType === "recorded" ? copy("دراسة ذاتية · متاح فورًا", "Self-paced · Instant access") : `${formatBatchSchedule(batch.schedule, isArabic)} · ${copy("يبدأ", "Starts")} ${formatMarketDate(batch.startDate, isArabic)}`}</span>{batch.location && <small><MapPin />{batch.location}</small>}</div><Badge tone="success">{unlimited ? copy("تسجيل مفتوح", "Open enrollment") : `${remaining} ${copy("مكان", "seats")}`}</Badge></article>; })}</div></section></div>
      <aside className="course-booking-card"><span>{Number(course.discountedPrice ?? course.price ?? 0) === 0 ? copy("سعر الكورس", "Course price") : copy("السعر يبدأ من", "Price starts at")}</span>{Number(course.discountedPrice ?? course.price ?? 0) > 0 && course.discountedPrice && <del>{course.price.toLocaleString()} {copy("ج.م", "EGP")}</del>}<strong>{Number(course.discountedPrice ?? course.price ?? 0) === 0 ? copy("مجاني", "Free") : `${(course.discountedPrice || course.price).toLocaleString()} ${copy("ج.م", "EGP")}`}</strong><p>{Number(course.discountedPrice ?? course.price ?? 0) === 0 ? copy("أنشئ حساب طالب أو سجّل الدخول لتحصل على وصول فوري للكورس.", "Create a student account or sign in for instant course access.") : copy("الحجز الآن والدفع لاحقًا بعد تأكيد الأكاديمية.", "Reserve now and pay after academy confirmation.")}</p><Button as={Link} to={`/booking/${course.id}`}>{Number(course.discountedPrice ?? course.price ?? 0) === 0 ? copy("اشترك مجانًا", "Enroll for free") : copy("احجز مكانك الآن", "Reserve your seat")}</Button><div><ShieldCheck />{Number(course.discountedPrice ?? course.price ?? 0) === 0 ? copy("لن يُطلب منك إدخال أي بيانات دفع.", "No payment details are required.") : copy("لن يتم تحصيل أي مبلغ في هذه المرحلة.", "No payment is collected at this stage.")}</div></aside>
    </div>
  </main></MarketplaceShell>;
}

export function AcademiesPage() {
  const { academies, courses } = useMarketplace();
  const [query, setQuery] = useState("");
  const { isArabic, copy } = useMarketI18n();
  useMarketplaceSeo(copy("المدرسون والأكاديميات | AIN", "Educators | AIN"), copy("اكتشف المدرسين المستقلين والأكاديميات الموثقة والكورسات المتاحة.", "Discover independent instructors, verified academies, and their courses."));
  const visible = academies.filter((item) => item.public && item.status === "approved" && nameOf(item, isArabic).toLowerCase().includes(query.toLowerCase()));
  return <MarketplaceShell><main className="marketplace-main"><section className="marketplace-simple-hero"><Building2 /><div><h1>{copy("مقدمو الكورسات على AIN", "Educators on AIN")}</h1><p>{copy("تصفح المدرسين المستقلين والأكاديميات الموثقة وشاهد كورساتهم المتاحة.", "Browse independent instructors and verified academies and view their courses.")}</p></div><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy("ابحث باسم المدرس أو الأكاديمية", "Search instructors or academies")} /></label></section><section className="academy-public-grid">{visible.map((academy) => <article key={academy.id}><header><span style={{ background: academy.color }}>{academy.initials}</span><div><Badge tone="neutral">{providerLabel(academy.providerType, copy)}</Badge><h2>{nameOf(academy, isArabic)} {academy.verified && <BadgeCheck />}</h2><p><MapPin />{academy.location}</p></div></header><p>{isArabic ? academy.descriptionAr : academy.description}</p><div>{academy.deliveryMethods.map((item) => <Badge key={item} tone="neutral">{translateDelivery(item, isArabic)}</Badge>)}</div><footer><span>{courses.filter((course) => course.academyId === academy.id && course.status === "published").length} {copy("كورسات منشورة", "published courses")}</span><Button as={Link} to={`/academies/${academy.slug}`}>{copy("عرض الصفحة", "View profile")}</Button></footer></article>)}</section></main></MarketplaceShell>;
}

export function AcademyProfilePage() {
  const { academySlug } = useParams();
  const { academies, courses, instructors } = useMarketplace();
  const { showToast } = useToast();
  const academy = academies.find((item) => item.slug === academySlug && item.public);
  if (!academy) return <Navigate to="/academies" replace />;
  const { isArabic, copy } = useMarketI18n();
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const academyCourses = courses.filter((item) => item.academyId === academy.id && item.status === "published");
  const academyInstructors = instructors.filter((item) => item.organizationId === academy.organizationId && item.active);

  const filteredCourses = useMemo(() => {
    return academyCourses.filter((course) => {
      const title = nameOf(course, isArabic).toLowerCase();
      const matchesSearch = !courseSearch || title.includes(courseSearch.toLowerCase());
      const matchesCat = selectedCategory === "all" || course.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [academyCourses, courseSearch, selectedCategory, isArabic]);

  const categories = useMemo(() => {
    const set = new Set(academyCourses.map((c) => c.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [academyCourses]);

  const copyProfileLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(copy("تم نسخ رابط الأكاديمية بنجاح!", "Academy link copied to clipboard!"), "success");
    }
  };

  useMarketplaceSeo(`${nameOf(academy, isArabic)} | AIN`, isArabic ? academy.descriptionAr : academy.description);

  return (
    <MarketplaceShell>
      <main className="academy-profile-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 20px 60px" }}>
        {/* HERO BANNER / MINI-SITE COVER */}
        <section
          className="academy-profile-cover"
          style={{
            background: `linear-gradient(135deg, ${academy.color || "#1e3a8a"} 0%, #0f172a 100%)`,
            borderRadius: "20px",
            padding: "40px 32px",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", zIndex: 1 }}>
            <div
              className="academy-profile-logo"
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "20px",
                background: "#fff",
                color: academy.color || "#1e3a8a",
                fontSize: "32px",
                fontWeight: 900,
                display: "grid",
                placeItems: "center",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                border: "3px solid rgba(255,255,255,0.4)"
              }}
            >
              {academy.initials}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  padding: "4px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  backdropFilter: "blur(4px)"
                }}>
                  {providerLabel(academy.providerType, copy)}
                </span>
                {academy.verified && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "#10b981",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700
                  }}>
                    <BadgeCheck size={14} />
                    {copy("جهة تعليمية موثقة", "Verified Academy")}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: "28px", fontWeight: 850, margin: "0 0 8px 0", color: "#fff" }}>
                {nameOf(academy, isArabic)}
              </h1>

              <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "rgba(255,255,255,0.85)", maxWidth: "600px", lineHeight: 1.6 }}>
                {isArabic ? academy.descriptionAr : academy.description}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <MapPin size={15} /> {academy.location || copy("أونلاين وحضوري", "Online & In-person")}
                </span>
                <span>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Building2 size={15} /> {academy.branches?.length || 1} {copy("فروع تعليمية", "branches")}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 1, minWidth: "180px" }}>
            <Button
              as="a"
              href={`https://wa.me/201000000000?text=${encodeURIComponent(copy(`مرحباً، أود الاستفسار عن كورسات ${nameOf(academy, isArabic)}`, `Hello, I'd like to ask about ${nameOf(academy, isArabic)} courses`))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#25D366",
                color: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(37,211,102,0.3)"
              }}
            >
              <MessageCircle size={17} />
              {copy("تواصل واتساب مباشر", "Chat on WhatsApp")}
            </Button>

            <Button
              variant="outline"
              onClick={copyProfileLink}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <Share2 size={16} />
              {copy("مشاركة الرابط", "Share Profile")}
            </Button>
          </div>
        </section>

        {/* TRUST STATS BAR */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            margin: "24px 0",
            background: "var(--stitch-surface, #fff)",
            border: "1px solid var(--stitch-border, #e2e8f0)",
            borderRadius: "14px",
            padding: "20px 24px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center" }}>
              <BookOpen size={20} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "18px" }}>{academyCourses.length}</strong>
              <small style={{ color: "#64748b" }}>{copy("كورسات معتمدة", "Verified Courses")}</small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "grid", placeItems: "center" }}>
              <Users size={20} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "18px" }}>{academyInstructors.length || 1}</strong>
              <small style={{ color: "#64748b" }}>{copy("نخبة المدرسين", "Top Instructors")}</small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#fef3c7", color: "#d97706", display: "grid", placeItems: "center" }}>
              <Award size={20} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "18px" }}>100%</strong>
              <small style={{ color: "#64748b" }}>{copy("شهادات إلكترونية بـ QR", "QR Verified Certs")}</small>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f5f3ff", color: "#7c3aed", display: "grid", placeItems: "center" }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "18px" }}>{copy("حماية مشددة", "High Security")}</strong>
              <small style={{ color: "#64748b" }}>{copy("ضد تسريب المحتوى", "Anti-leakage protected")}</small>
            </div>
          </div>
        </section>

        {/* COURSES CATALOG */}
        <section style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 4px 0" }}>
                {copy("الكورسات المتاحة للتسجيل", "Available Courses for Enrollment")}
              </h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                {copy("اختر الكورس المناسب واحجز مقعدك في الدفعة الحالية.", "Pick a course and secure your seat in the active cohort.")}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", right: isArabic ? "12px" : "auto", left: isArabic ? "auto" : "12px", color: "#94a3b8" }} />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder={copy("بحث في الكورسات...", "Search courses...")}
                  style={{
                    padding: isArabic ? "8px 36px 8px 14px" : "8px 14px 8px 36px",
                    borderRadius: "8px",
                    border: "1px solid var(--stitch-border, #cbd5e1)",
                    fontSize: "13px"
                  }}
                />
              </div>

              {categories.length > 2 && (
                <div style={{ display: "flex", gap: "4px", background: "var(--stitch-soft, #f1f5f9)", padding: "4px", borderRadius: "8px" }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: selectedCategory === cat ? "var(--stitch-surface, #fff)" : "transparent",
                        color: selectedCategory === cat ? "#2563eb" : "#64748b",
                        boxShadow: selectedCategory === cat ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
                      }}
                    >
                      {cat === "all" ? copy("الكل", "All") : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--stitch-surface, #fff)", borderRadius: "14px", border: "1px solid var(--stitch-border, #e2e8f0)" }}>
              <BookOpen size={40} style={{ color: "#94a3b8", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0" }}>{copy("لا توجد كورسات مطابقة للبحث", "No courses match your search")}</h3>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>{copy("جرب تغيير معايير التصفية أو البحث.", "Try adjusting search or category filter.")}</p>
            </div>
          ) : (
            <div className="market-course-grid">
              {filteredCourses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </div>
          )}
        </section>

        {/* INSTRUCTORS SECTION */}
        {academyInstructors.length > 0 && (
          <section style={{ marginTop: "48px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "16px" }}>
              {copy("فريق المعلمين والمدربين", "Faculty & Instructors")}
            </h2>
            <div className="instructors-public-grid">
              {academyInstructors.map((item) => (
                <article key={item.id} style={{ background: "var(--stitch-surface, #fff)", border: "1px solid var(--stitch-border, #e2e8f0)", borderRadius: "14px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                    <span style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: 800 }}>
                      {item.initials}
                    </span>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 700 }}>{nameOf(item, isArabic)}</h3>
                      <strong style={{ color: "#2563eb", fontSize: "12.5px" }}>{item.specialty}</strong>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.6 }}>{item.bio}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* WHY STUDY WITH THIS ACADEMY */}
        <section style={{ marginTop: "48px", background: "var(--stitch-soft, #f8fafc)", borderRadius: "18px", padding: "32px 28px", border: "1px solid var(--stitch-border, #e2e8f0)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, textAlign: "center", marginBottom: "24px" }}>
            {copy("لماذا تختار الدراسة معنا عبر منصة AIN؟", "Why Choose to Study with Us on AIN?")}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            <div style={{ background: "var(--stitch-surface, #fff)", padding: "18px", borderRadius: "12px", border: "1px solid var(--stitch-border, #e2e8f0)" }}>
              <div style={{ color: "#2563eb", marginBottom: "10px" }}><MonitorPlay size={24} /></div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700 }}>{copy("قاعات تفاعلية وحضور مباشر", "Live Interactive Classrooms")}</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>{copy("متابعة مستمرة للحضور والغياب برمز الاستجابة السريعة (QR Code).", "Real-time attendance tracking and seamless session access via QR code.")}</p>
            </div>
            <div style={{ background: "var(--stitch-surface, #fff)", padding: "18px", borderRadius: "12px", border: "1px solid var(--stitch-border, #e2e8f0)" }}>
              <div style={{ color: "#059669", marginBottom: "10px" }}><Award size={24} /></div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700 }}>{copy("شهادات إتمام موثقة برمز QR", "Verifiable QR Completion Certificates")}</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>{copy("إصدار شهادات رقمية فورية عند استيفاء متطلبات النجاح مع رابط تدقيق رسمي.", "Instant digital certificates upon meeting criteria with a public verification URL.")}</p>
            </div>
            <div style={{ background: "var(--stitch-surface, #fff)", padding: "18px", borderRadius: "12px", border: "1px solid var(--stitch-border, #e2e8f0)" }}>
              <div style={{ color: "#d97706", marginBottom: "10px" }}><Users size={24} /></div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700 }}>{copy("بوابة متابعة شاملة لولي الأمر", "Dedicated Guardian Tracking Portal")}</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: 1.5 }}>{copy("متابعة درجات الاختبارات ونسب الحضور وتنبيهات واتساب دورية.", "Live tracking of quiz scores, attendance logs, and regular WhatsApp alerts.")}</p>
            </div>
          </div>
        </section>
      </main>
    </MarketplaceShell>
  );
}

export function PublicBookingPage() {
  const { courseId } = useParams();
  const { courses, batches, academies, createBooking, loading } = useMarketplace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { isArabic, copy } = useMarketI18n();
  const course = courses.find((item) => item.id === courseId && item.status === "published");
  const available = batches.filter((item) => {
    const unlimitedEnrollment = item.capacity == null;
    const remainingSeats = unlimitedEnrollment
      ? null
      : (item.remainingSeats ?? Math.max(0, Number(item.capacity) - Number(item.confirmedSeats || 0) - Number(item.reservedSeats || 0)));
    return item.courseId === courseId
      && item.status === "open"
      && (unlimitedEnrollment || remainingSeats > 0);
  });
  const [batchId, setBatchId] = useState("");
  const [paymentPreference, setPaymentPreference] = useState("paymob");
  const [offlineRef, setOfflineRef] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const basePrice = Number(course?.discountedPrice || course?.price || 0);
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") {
      return Math.round((basePrice * appliedCoupon.value) / 100);
    }
    return Math.min(basePrice, appliedCoupon.value);
  }, [appliedCoupon, basePrice]);

  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    const validCoupons = {
      "AIN20": { code: "AIN20", type: "percent", value: 20, desc: isArabic ? "خصم 20% للطلاب الجدد" : "20% off for new students" },
      "WESAM100": { code: "WESAM100", type: "fixed", value: 100, desc: isArabic ? "خصم 100 ج.م من أكاديمية وسام" : "100 EGP off" },
      "START2026": { code: "START2026", type: "percent", value: 15, desc: isArabic ? "خصم بداية العام 15%" : "15% seasonal discount" },
      "EID2026": { code: "EID2026", type: "percent", value: 25, desc: isArabic ? "عروض العيد 25%" : "25% Eid promotion" }
    };

    if (validCoupons[code]) {
      setAppliedCoupon(validCoupons[code]);
      showToast(copy(`تم تطبيق كود الخصم: ${validCoupons[code].desc}`, `Promo code applied: ${validCoupons[code].code}`), "success");
    } else {
      setCouponError(copy("كود الخصم غير صالح أو منتهي الصلاحية", "Invalid or expired promo code"));
    }
  };

  useEffect(() => {
    if (available.length > 0 && !available.some((item) => item.id === batchId)) {
      setBatchId(available[0].id);
    } else if (available.length === 0 && batchId) {
      setBatchId("");
    }
  }, [available, batchId]);

  useMarketplaceSeo(
    copy("إتمام الحجز والدفع | AIN", "Complete Booking & Payment | AIN"),
    copy("اختر الدفعة وطريقة الدفع لإتمام تسجيلك في الكورس.", "Select a batch and payment method to enroll in the course.")
  );
  if (loading) return <MarketplaceShell><main className="booking-page"><div className="market-empty"><CalendarDays /><h2>{copy("جارٍ تجهيز بيانات الحجز...", "Preparing booking details...")}</h2></div></main></MarketplaceShell>;
  if (!course) return <Navigate to="/courses" replace />;
  const academy = academies.find((item) => item.id === course.academyId);
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return (
      <MarketplaceShell>
        <main className="booking-page">
          <section className="market-empty booking-auth-gate" style={{ maxWidth: "620px", margin: "40px auto", padding: "40px 30px", background: "var(--panel)", borderRadius: "18px", border: "1px solid var(--border)", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(22, 69, 143, 0.1)", color: "var(--primary, #16458F)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <GraduationCap size={32} />
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>
              {copy("خطوة واحدة تفصلك عن مقعدك في الكورس!", "One Step Away from Your Course Seat!")}
            </h1>
            <p style={{ color: "var(--text-muted, #64748b)", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
              {copy(
                "سجّل دخولك أو أنشئ حساباً سريعاً لربط حجز الكورس والمواد التعليمية وجدول الحصص باسمك مباشرة.",
                "Sign in or create a quick account to link your course booking, schedule, and learning materials."
              )}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: isArabic ? "right" : "left", margin: "0 0 24px", background: "var(--panel-soft, #f8fafc)", padding: "14px 18px", borderRadius: "12px", fontSize: "13px", border: "1px solid var(--border)" }}>
              <div>✓ {copy("جدول الحصص والتنبيهات", "Class schedules & alerts")}</div>
              <div>✓ {copy("حماية المشاهدة والعلامة المائية", "Protected video access")}</div>
              <div>✓ {copy("تسليم الواجبات والتصحيح", "Assignments & feedback")}</div>
              <div>✓ {copy("شهادة إتمام معتمدة بـ QR", "QR Verified Certificate")}</div>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Button as={Link} to={`/login?next=${encodeURIComponent(next)}`} style={{ padding: "12px 28px", fontSize: "15px" }}>
                {copy("تسجيل الدخول والمتابعة", "Sign in and continue")}
              </Button>
              <Button as={Link} variant="outline" to={`/create-account?next=${encodeURIComponent(next)}`} style={{ padding: "12px 28px", fontSize: "15px" }}>
                {copy("إنشاء حساب طالب جديد", "Create Student Account")}
              </Button>
            </div>
          </section>
        </main>
      </MarketplaceShell>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!accepted) return showToast(copy("يجب الموافقة على سياسة الحجز", "Please accept the booking policy"), "error");
    setSubmitting(true);
    try {
      const result = await createBooking({
        organizationId: course.organizationId,
        courseId: course.id,
        batchId,
        studentId: user?.id || form.get("email"),
        studentName: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        amount: finalPrice,
        note: [
          form.get("note") || "",
          appliedCoupon ? `[Coupon: ${appliedCoupon.code}]` : "",
        basePrice > 0 && paymentPreference !== "paymob" ? `[Method: ${paymentPreference}]` : "",
          offlineRef ? `[Ref: ${offlineRef}]` : ""
        ].filter(Boolean).join(" ").trim(),
        idempotencyKey: globalThis.crypto?.randomUUID?.() || `booking-${Date.now()}`,
      });
      if (!result.ok) {
        const messages = {
          booking_already_exists: copy("لديك طلب حجز قائم لهذه الدفعة", "You already have an active booking for this batch"),
          duplicate: copy("لديك طلب حجز قائم لهذه الدفعة", "You already have an active booking for this batch"),
          capacity_full: copy("اكتملت سعة الدفعة", "This batch is full"),
          booking_email_mismatch: copy("استخدم البريد المرتبط بحسابك", "Use the email associated with your account")
        };
        showToast(messages[result.reason] || result.error?.message || copy("تعذر إتمام الحجز", "Could not complete booking"), "error");
        return;
      }
      navigate(`/booking/success?booking=${result.booking.id}&pay=${basePrice === 0 ? "free" : paymentPreference}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketplaceShell>
      <main className="booking-page">
        <div className="booking-progress">
          <span className="active">1 {copy("اختيار الدفعة", "Select batch")}</span>
          <span className="active">2 {basePrice === 0 ? copy("بيانات الطالب", "Student details") : copy("بيانات الطالب والدفع", "Student & Payment")}</span>
          <span>3 {copy("تأكيد الطلب", "Confirmation")}</span>
        </div>
        <div className="booking-layout">
          <form className="booking-form" onSubmit={submit}>
            <header>
              <h1>{basePrice === 0 ? copy("الاشتراك المجاني", "Free enrollment") : copy("إتمام الحجز والتسجيل", "Complete Booking & Enrollment")}</h1>
              <p>{basePrice === 0 ? copy("أكمل بياناتك لتحصل على وصول فوري إلى الكورس المسجّل.", "Complete your details for instant access to the recorded course.") : copy("أدخل بياناتك واختر طريقة الدفع المناسبة لتأكيد مقعدك في الكورس.", "Enter your details and select your preferred payment method to secure your seat.")}</p>
            </header>

            <FormField label={copy("اختر الدفعة المناسبة", "Select batch")}>
              <select value={batchId} onChange={(e) => setBatchId(e.target.value)} required>
                {available.length === 0 && <option value="">{copy("لا توجد دفعات متاحة حاليًا", "No batches are currently available")}</option>}
                {available.map((batch) => (
                  <option value={batch.id} key={batch.id}>
                    {nameOf(batch, isArabic)} - {course.deliveryType === "recorded" ? copy("دراسة ذاتية متاحة فورًا", "Instant self-paced access") : formatBatchSchedule(batch.schedule, isArabic)}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="learning-form-grid">
              <FormField label={copy("الاسم الكامل", "Full name")}>
                <input name="name" defaultValue={user?.name || ""} minLength="2" required />
              </FormField>
              <FormField label={copy("البريد الإلكتروني", "Email")}>
                <input name="email" type="email" defaultValue={user?.email || ""} required />
              </FormField>
              <FormField label={copy("رقم الهاتف / واتساب", "Phone / WhatsApp")}>
                <input name="phone" type="tel" placeholder="01xxxxxxxxx" required />
              </FormField>
              <FormField label={copy("ملاحظة اختيارية", "Optional note")}>
                <input name="note" placeholder={copy("مثال: أفضل الحضور أونلاين", "Example: I prefer online attendance")} />
              </FormField>
            </div>

            {basePrice > 0 && <div style={{ margin: "16px 0", display: "grid", gap: "10px" }}>
              <label style={{ fontWeight: "700", fontSize: "14px" }}>
                {copy("طريقة الدفع وتأكيد المقعد:", "Payment Method & Seat Confirmation:")}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                <div
                  onClick={() => setPaymentPreference("paymob")}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: `2px solid ${paymentPreference === "paymob" ? "var(--primary, #16458F)" : "var(--border)"}`,
                    background: paymentPreference === "paymob" ? "rgba(22, 69, 143, 0.05)" : "var(--panel)",
                    cursor: "pointer",
                    display: "grid",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px", color: paymentPreference === "paymob" ? "var(--primary, #16458F)" : "inherit" }}>
                    <CreditCard size={18} />
                    {copy("دفع فوري ببطاقة / محفظة (Paymob)", "Instant Paymob Online")}
                  </div>
                  <small style={{ color: "var(--text-muted, #777)", lineHeight: "1.4" }}>
                    {copy("تأكيد فوري بالفيزا، ماستركارد، ميزة، فودافون كاش.", "Instant confirmation via Cards, Meeza & Mobile Wallets.")}
                  </small>
                </div>

                <div
                  onClick={() => setPaymentPreference("instapay")}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: `2px solid ${paymentPreference === "instapay" ? "var(--primary, #16458F)" : "var(--border)"}`,
                    background: paymentPreference === "instapay" ? "rgba(22, 69, 143, 0.05)" : "var(--panel)",
                    cursor: "pointer",
                    display: "grid",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px", color: paymentPreference === "instapay" ? "var(--primary, #16458F)" : "inherit" }}>
                    <Wallet size={18} />
                    {copy("تحويل InstaPay / كاش", "InstaPay / Mobile Transfer")}
                  </div>
                  <small style={{ color: "var(--text-muted, #777)", lineHeight: "1.4" }}>
                    {copy("تحويل مباشر لمعرّف انستاباي أو محفظة الأكاديمية.", "Transfer directly to academy InstaPay or wallet.")}
                  </small>
                </div>

                <div
                  onClick={() => setPaymentPreference("cash")}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: `2px solid ${paymentPreference === "cash" ? "var(--primary, #16458F)" : "var(--border)"}`,
                    background: paymentPreference === "cash" ? "rgba(22, 69, 143, 0.05)" : "var(--panel)",
                    cursor: "pointer",
                    display: "grid",
                    gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px", color: paymentPreference === "cash" ? "var(--primary, #16458F)" : "inherit" }}>
                    <Building2 size={18} />
                    {copy("دفع نقدي بمقر الأكاديمية", "Cash at Academy")}
                  </div>
                  <small style={{ color: "var(--text-muted, #777)", lineHeight: "1.4" }}>
                    {copy("سداد الرسوم نقداً بالاستقبال قبل أول حصة لتأكيد مقعدك.", "Pay cash at reception desk before your first session.")}
                  </small>
                </div>
              </div>

              {/* InstaPay Transfer Instructions */}
              {paymentPreference === "instapay" && (
                <div style={{ marginTop: "6px", padding: "14px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", fontSize: "13px" }}>
                  <strong style={{ color: "#065f46", display: "block", marginBottom: "6px" }}>
                    {copy("⚡ بيانات التحويل المعتمدة للأكاديمية:", "⚡ Official Academy Transfer Details:")}
                  </strong>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", margin: "6px 0", color: "#1e293b" }}>
                    <span>📱 {copy("محفظة فودافون كاش / أورنج:", "Vodafone/Orange Cash:")} <strong>01000000000</strong></span>
                    <span>⚡ {copy("عنوان InstaPay:", "InstaPay Address:")} <strong>academy@instapay</strong></span>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#374151", marginBottom: "4px" }}>
                      {copy("رقم العملية المرجعي / اسم المحوّل (لتسريع تفعيل حسابك):", "Transaction Ref / Sender Name:")}
                    </label>
                    <input
                      type="text"
                      value={offlineRef}
                      onChange={(e) => setOfflineRef(e.target.value)}
                      placeholder={copy("مثال: Ref #109482 أو محول من رقم 010xxxxxxxx", "e.g. Ref #109482 or sent from 010xxxxxxxx")}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>
              )}
            </div>}

            <label className="booking-terms">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              {basePrice === 0 ? copy("أوافق على شروط الاستخدام وسياسة حماية المحتوى لمنصة عين.", "I accept AIN Platform's terms of use and content protection policy.") : copy("أوافق على شروط الحجز وسياسة الإلغاء وحماية المحتوى لمنصة عين.", "I accept AIN Platform's booking, cancellation, and protected content policy.")}
            </label>

            <Button type="submit" disabled={!batchId || submitting} style={{ width: "100%", padding: "12px", fontSize: "15px" }}>
              {submitting ? copy("جاري إنشاء اشتراكك...", "Creating your enrollment...") : (basePrice === 0 ? copy("اشترك مجانًا وابدأ الآن", "Enroll free and start now") : copy("متابعة وتأكيد الحجز", "Proceed to Confirmation"))}
            </Button>
          </form>

          <aside className="booking-summary">
            <span className="academy-mini-logo" style={{ background: academy?.color }}>{academy?.initials}</span>
            <small>{nameOf(academy, isArabic)}</small>
            <h2>{nameOf(course, isArabic)}</h2>

            {basePrice > 0 && <div style={{ margin: "16px 0", borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: "14px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: "bold", display: "block", marginBottom: "6px" }}>
                🏷️ {copy("هل لديك كود خصم أو كوبون؟", "Have a promo code?")}
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="مثال: AIN20"
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border, #cbd5e1)",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    textTransform: "uppercase"
                  }}
                />
                <Button type="button" size="sm" onClick={handleApplyCoupon}>
                  {copy("تطبيق", "Apply")}
                </Button>
              </div>
              {couponError && (
                <small style={{ color: "#ef4444", display: "block", marginTop: "4px", fontSize: "11.5px" }}>
                  {couponError}
                </small>
              )}
              {appliedCoupon && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px", background: "#ecfdf5", padding: "6px 8px", borderRadius: "6px", fontSize: "12px", color: "#065f46" }}>
                  <span>✓ {appliedCoupon.code} ({appliedCoupon.desc})</span>
                  <button type="button" onClick={() => setAppliedCoupon(null)} style={{ border: "none", background: "none", color: "#991b1b", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>✕</button>
                </div>
              )}
            </div>}

            <div style={{ borderTop: "1px solid var(--border, #e2e8f0)", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b" }}>
                <span>{copy("سعر الكورس", "Course price")}</span>
                <span>{basePrice === 0 ? copy("مجاني", "Free") : `${basePrice.toLocaleString()} ${copy("ج.م", "EGP")}`}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#059669", fontWeight: "bold", margin: "4px 0" }}>
                  <span>{copy("الخصم المطبق", "Discount")}</span>
                  <span>- {discountAmount.toLocaleString()} {copy("ج.م", "EGP")}</span>
                </div>
              )}
              {basePrice > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "800", marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border, #cbd5e1)" }}>
                <span>{copy("المبلغ النهائي المطلوب", "Total to pay")}</span>
                <strong style={{ color: "var(--primary, #16458F)" }}>{finalPrice.toLocaleString()} {copy("ج.م", "EGP")}</strong>
              </div>}
            </div>

            <p style={{ marginTop: "16px" }}>
              <ShieldCheck />
              {basePrice === 0
                ? copy("لا توجد أي رسوم أو بيانات دفع مطلوبة لهذا الكورس.", "No fees or payment details are required for this course.")
                : paymentPreference === "paymob"
                ? copy("سداد إلكتروني مشفر ومحمي عبر Paymob Egypt.", "Secure encrypted electronic payment powered by Paymob Egypt.")
                : copy("حجز مبدئي. ستتواصل الأكاديمية معك لتأكيد المقعد.", "Seat hold. The academy will contact you to confirm.")}
            </p>
          </aside>
        </div>
      </main>
    </MarketplaceShell>
  );
}

export function BookingSuccessPage() {
  const [params] = useSearchParams();
  const { isArabic, copy } = useMarketI18n();
  const { bookings, courses, batches, reload } = useMarketplace();
  const { showToast } = useToast();
  const bookingId = params.get("booking");
  const booking = bookings.find((item) => item.id === bookingId);

  const [isPaid, setIsPaid] = useState(booking?.paymentStatus === "paid" || booking?.status === "confirmed");
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [payIntent, setPayIntent] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (booking?.paymentStatus === "paid" || booking?.status === "confirmed") {
      setIsPaid(true);
    }
  }, [booking?.paymentStatus, booking?.status]);

  if (!booking) return <Navigate to="/courses" replace />;
  const course = courses.find((item) => item.id === booking.courseId);
  const batch = batches.find((item) => item.id === booking.batchId);
  const isFree = Number(booking.amount ?? course?.discountedPrice ?? course?.price ?? 0) === 0;

  const startCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const intent = await api.checkoutPayment({
        booking_id: booking.id,
        payment_method: "paymob",
      });
      setPayIntent(intent);
      const checkoutUrl = intent.checkoutUrl;
      if (!checkoutUrl) throw new Error("Checkout URL is unavailable");
      const target = new URL(checkoutUrl, window.location.origin);
      const localSandbox = target.origin === window.location.origin && target.pathname === "/checkout/paymob";
      if (localSandbox) {
        setPayModalOpen(true);
      } else {
        window.sessionStorage.setItem("ain-pending-payment-id", intent.paymentId);
        window.sessionStorage.setItem("ain-pending-booking-id", booking.id);
        window.location.assign(target.href);
      }
    } catch (err) {
      showToast(copy("تعذر بدء جلسة الدفع، حاول مجدداً", "Failed to initiate payment session"), "error");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!payIntent?.paymentId && !payIntent?.payment_id) return;
    const pId = payIntent.paymentId || payIntent.payment_id;
    setSimulating(true);
    try {
      await api.simulatePaymentSuccess(pId);
      setIsPaid(true);
      setPayModalOpen(false);
      showToast(copy("تم الدفع وتأكيد الحجز والاشتراك تلقائياً بنجاح!", "Payment successful! Booking and enrollment confirmed."), "success");
      if (reload) await reload();
    } catch (err) {
      showToast(copy("فشلت محاكاة الدفع", "Simulated payment failed"), "error");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <MarketplaceShell>
      <main className="booking-success">
        <span style={{ background: isPaid ? "rgba(16, 185, 129, 0.15)" : undefined, color: isPaid ? "#10B981" : undefined }}>
          {isPaid ? <CheckCircle2 size={36} /> : <Check size={36} />}
        </span>

        <Badge tone={isPaid ? "success" : "warning"}>
          {isPaid ? (isFree ? copy("تم الاشتراك مجانًا", "Free enrollment active") : copy("حجز مؤكد ومدفوع", "Confirmed & Paid")) : copy("قيد تأكيد الأكاديمية / انتظار السداد", "Pending Confirmation / Unpaid")}
        </Badge>

        <h1>{isPaid ? (isFree ? copy("تم تفعيل الكورس في حسابك!", "Your course is now active!") : copy("تم تأكيد حجزك واشتراكك بنجاح!", "Booking & Enrollment Confirmed!")) : copy("تم استلام طلب الحجز بنجاح", "Booking Request Received")}</h1>

        <p>
          {isPaid
            ? copy("تم تفعيل الكورس في حسابك تلقائياً ويمكنك الآن الوصول إلى الدروس والمواد المتاحة.", "Course access is activated. You can now access the available lessons and materials.")
            : copy("تم حفظ مقعدك المبدئي. يمكنك السداد الفوري إلكترونياً عبر Paymob لتأكيد الاشتراك مباشرة، أو انتظار تواصل إدارة الأكاديمية.", "Your seat is held. Complete instant payment via Paymob to confirm immediately, or wait for academy follow-up.")}
        </p>

        {/* Instant Electronic Payment Callout */}
        {!isPaid && (
          <div style={{ margin: "20px 0", padding: "18px", background: "rgba(22, 69, 143, 0.06)", border: "1px solid rgba(22, 69, 143, 0.2)", borderRadius: "10px", display: "grid", gap: "12px", maxWidth: "500px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary, #16458F)" }}>
                <CreditCard size={20} />
                {copy("سداد إلكتروني عبر Paymob", "Pay Online via Paymob")}
              </strong>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                {booking.amount ? Number(booking.amount).toLocaleString() : (course?.discountedPrice || course?.price || 0).toLocaleString()} {copy("ج.م", "EGP")}
              </span>
            </div>
            <small style={{ color: "var(--text-muted, #777)", lineHeight: "1.5" }}>
              {copy("سدد فوراً ببطاقتك البنكية أو محفظة الموبايل (فودافون كاش، أورنج، وي، ميزة) لتأكيد المقعد بدون انتظار موافقة الأكاديمية.", "Pay instantly with debit/credit card or mobile wallet to confirm your enrollment without waiting.")}
            </small>
            <Button onClick={startCheckout} disabled={loadingCheckout} style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
              <CreditCard size={16} />
              {loadingCheckout ? copy("جاري الاتصال بـ Paymob...", "Connecting to Paymob...") : copy("الدفع الآن وتأكيد المقعد (Paymob)", "Pay Now via Paymob")}
            </Button>
          </div>
        )}

        <div>
          <small>{copy("رقم الطلب", "Request number")}</small>
          <strong>{booking.id.slice(-8).toUpperCase()}</strong>
          <small>{copy("الكورس", "Course")}</small>
          <strong>{nameOf(course, isArabic)}</strong>
          <small>{copy("الدفعة", "Batch")}</small>
          <strong>{nameOf(batch, isArabic)}</strong>
          <small>{copy("حالة السداد", "Payment Status")}</small>
          <strong>{isFree ? copy("مجاني — لا توجد رسوم", "Free — no payment required") : (isPaid ? copy("مدفوع بالكامل", "Paid in full") : copy("غير مدفوع", "Unpaid"))}</strong>
        </div>

        <nav>
          <Button as={Link} to="/end-user/courses">
            {copy("الانتقال إلى كورساتي", "Go to My Courses")}
          </Button>
          <Button as={Link} variant="ghost" to="/courses">
            {copy("استكشاف المزيد", "Explore more")}
          </Button>
        </nav>

        {/* Paymob Checkout Modal */}
        {payModalOpen && payIntent && (
          <Modal
            open={payModalOpen}
            title={copy("بوابة الدفع الإلكتروني | Paymob Egypt", "Electronic Payment | Paymob Egypt")}
            onClose={() => setPayModalOpen(false)}
          >
            <div style={{ display: "grid", gap: "16px", padding: "10px 0" }}>
              <div style={{ padding: "14px", background: "var(--panel-soft, rgba(255,255,255,0.03))", border: "1px solid var(--border)", borderRadius: "8px", display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{copy("الكورس المطلوب:", "Course:")}</span>
                  <strong>{nameOf(course, isArabic)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{copy("المبلغ المستحق:", "Total Due:")}</span>
                  <strong style={{ fontSize: "16px", color: "var(--primary, #16458F)" }}>
                    {((payIntent.amountMinor || payIntent.amount_minor || 100000) / 100).toLocaleString()} {payIntent.currency || "EGP"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted, #888)" }}>{copy("رقم العملية:", "Transaction Reference:")}</span>
                  <code>{payIntent.providerReference || payIntent.provider_reference || payIntent.paymentId}</code>
                </div>
              </div>

              <div style={{ padding: "12px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "6px", fontSize: "13px", lineHeight: "1.5" }}>
                <Badge tone="success" style={{ marginBottom: "6px" }}>{copy("بيئة تجريبية آمنة (Sandbox)", "Safe Sandbox Environment")}</Badge>
                <p style={{ margin: 0, color: "var(--text, #333)" }}>
                  {copy(
                    "يمكنك تجربة إتمام السداد الآن فوراً عبر زر المحاكاة التجريبي بالأسفل، وسيتم تفعيل الحجز وتأكيد المقعد تلقائياً في قاعدة البيانات.",
                    "You can test the checkout flow immediately using the sandbox simulation button below. It will automatically mark the payment as paid and confirm your enrollment."
                  )}
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={() => setPayModalOpen(false)}>
                  {copy("إلغاء", "Cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <CheckCircle2 size={16} />
                  {simulating ? copy("جاري تأكيد الدفع...", "Processing Payment...") : copy("إتمام الدفع التجريبي بنجاح (Simulate Paymob Success)", "Simulate Paymob Payment Success")}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </MarketplaceShell>
  );
}

export function PaymentReturnPage() {
  const [params] = useSearchParams();
  const { isArabic, copy } = useMarketI18n();
  const paymentId = params.get("payment_id")
    || window.sessionStorage.getItem("ain-pending-payment-id");
  const fallbackBookingId = window.sessionStorage.getItem("ain-pending-booking-id");
  const [state, setState] = useState({ loading: Boolean(paymentId), result: null, error: "" });

  useEffect(() => {
    if (!paymentId) {
      setState({ loading: false, result: null, error: isArabic ? "لم نجد رقم عملية الدفع." : "Payment reference was not found." });
      return undefined;
    }

    let active = true;
    let timer;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      try {
        const result = await api.getPaymentStatus(paymentId);
        if (!active) return;
        const status = result.payment?.status;
        setState({ loading: false, result, error: "" });
        if (["pending", "processing"].includes(status) && attempts < 10) {
          timer = window.setTimeout(check, 2000);
        } else if (["paid", "succeeded"].includes(status) || result.isConfirmed) {
          window.sessionStorage.removeItem("ain-pending-payment-id");
          window.sessionStorage.removeItem("ain-pending-booking-id");
          window.sessionStorage.removeItem("ain-pending-invoice-id");
        }
      } catch (error) {
        if (active) setState({ loading: false, result: null, error: error.message || (isArabic ? "تعذر التحقق من الدفع." : "Could not verify payment.") });
      }
    };
    check();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isArabic, paymentId]);

  const status = state.result?.payment?.status;
  const confirmed = state.result?.isConfirmed || ["paid", "succeeded"].includes(status);
  const bookingId = state.result?.booking?.id || fallbackBookingId;

  return (
    <MarketplaceShell>
      <main className="booking-success payment-return-page">
        <span>{confirmed ? <CheckCircle2 size={36} /> : state.error ? <X size={36} /> : <Clock3 size={36} />}</span>
        <Badge tone={confirmed ? "success" : state.error ? "danger" : "warning"}>
          {confirmed ? copy("تم الدفع", "Payment confirmed") : state.error ? copy("تعذر التحقق", "Verification failed") : copy("جاري التحقق", "Verifying payment")}
        </Badge>
        <h1>{confirmed ? copy("تم تأكيد الدفع والاشتراك", "Payment and enrollment confirmed") : copy("نراجع نتيجة عملية الدفع", "Checking your payment result")}</h1>
        <p>{state.loading ? copy("قد يستغرق وصول تأكيد بوابة الدفع عدة ثوانٍ.", "The payment confirmation may take a few seconds.") : state.error || copy("لم يصل التأكيد النهائي بعد. يمكنك إعادة فتح هذه الصفحة بعد قليل.", "Final confirmation has not arrived yet. You can check again shortly.")}</p>
        <nav>
          {confirmed && <Button as={Link} to="/end-user/courses">{copy("الانتقال إلى كورساتي", "Go to My Courses")}</Button>}
          {!confirmed && bookingId && <Button as={Link} to={`/booking/success?booking=${bookingId}`}>{copy("العودة إلى تفاصيل الحجز", "Return to booking")}</Button>}
          <Button as={Link} variant="ghost" to="/courses">{copy("سوق الكورسات", "Course marketplace")}</Button>
        </nav>
      </main>
    </MarketplaceShell>
  );
}
