import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronDown,
  Clock3, CreditCard, ExternalLink, Filter, GraduationCap, Languages, MapPin, Megaphone, Menu, MonitorPlay,
  Rocket, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Store, Sun, Moon, UserRound, Users, Wallet, X
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
    Intermediate: "متوسط",
    Advanced: "متقدم",
    All: "جميع المستويات"
  };
  return map[level] || level;
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
  const remaining = batch ? Math.max(0, batch.capacity - batch.confirmedSeats - batch.reservedSeats) : 0;
  const { isArabic, copy } = useMarketI18n();
  const providerType = providerTypeFor(course, academy);
  return <article className="market-course-card">
    <Link className="market-course-cover" to={`/courses/${course.slug}`}>{course.coverUrl ? <img src={course.coverUrl} alt="" loading="lazy" /> : <BookOpen />}<div>{course.sponsored && <Badge tone="warning">{copy("إعلان ممول", "Sponsored")}</Badge>}{course.featured && <Badge tone="primary">{copy("مميز", "Featured")}</Badge>}</div></Link>
    <div className="market-course-body"><span>{nameOf(category, isArabic)} · {translateLevel(course.level, isArabic)}</span><Link to={`/courses/${course.slug}`}><h2>{nameOf(course, isArabic)}</h2></Link><p>{isArabic ? course.shortDescriptionAr : course.shortDescription}</p>
      <div className="market-course-owner"><span style={{ background: academy?.color }}>{academy?.initials}</span><div><strong>{instructor ? nameOf(instructor, isArabic) : copy("فريق التعليم", "Education team")}</strong><small>{nameOf(academy, isArabic)} {academy?.verified && <BadgeCheck size={14} />} · {providerLabel(providerType, copy)}</small></div></div>
      <div className="market-course-meta"><span><MonitorPlay />{translateDelivery(course.deliveryType, isArabic)}</span><span><CalendarDays />{batch?.startDate || copy("قريبًا", "Soon")}</span><span><Users />{remaining} {copy("مكان متبقٍ", "seats left")}</span></div>
      <footer><div>{course.discountedPrice && <del>{course.price.toLocaleString()} {copy("ج.م", "EGP")}</del>}<strong>{(course.discountedPrice || course.price).toLocaleString()} {copy("ج.م", "EGP")}</strong></div><Button as={Link} to={`/courses/${course.slug}`}>{copy("عرض التفاصيل", "View details")}</Button></footer>
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
  const { courses, academies, instructors, batches, categories } = useMarketplace();
  const course = courses.find((item) => item.slug === courseSlug && item.status === "published");
  if (!course) return <Navigate to="/courses" replace />;
  const { isArabic, copy } = useMarketI18n();
  const academy = academies.find((item) => item.id === course.academyId);
  const instructor = instructors.find((item) => item.id === course.instructorId);
  const category = categories.find((item) => item.id === course.categoryId);
  const courseBatches = batches.filter((item) => item.courseId === course.id && item.status === "open");
  useMarketplaceSeo(`${nameOf(course, isArabic)} | AIN`, isArabic ? course.shortDescriptionAr : course.shortDescription);
  return <MarketplaceShell><main className="course-detail-main">
    <div className="market-breadcrumbs"><Link to="/courses">{copy("الكورسات", "Courses")}</Link><span>/</span><span>{nameOf(category, isArabic)}</span><span>/</span><strong>{nameOf(course, isArabic)}</strong></div>
    <section className="course-detail-hero"><div><Badge tone="primary">{nameOf(category, isArabic)}</Badge><h1>{nameOf(course, isArabic)}</h1><p>{isArabic ? course.shortDescriptionAr : course.shortDescription}</p><div className="course-detail-owner"><span style={{ background: academy?.color }}>{academy?.initials}</span><div><strong>{nameOf(academy, isArabic)} {academy?.verified && <BadgeCheck />}</strong><small>{copy("بواسطة", "By")} {nameOf(instructor, isArabic)}</small></div></div><div className="course-detail-facts"><span><Clock3 />{course.duration}</span><span><BookOpen />{course.sessions} {copy("حصة", "sessions")}</span><span><MonitorPlay />{translateDelivery(course.deliveryType, isArabic)}</span></div></div><div className="course-visual">{course.coverUrl ? <img src={course.coverUrl} alt="" /> : <GraduationCap />}</div></section>
    <div className="course-detail-layout"><div className="course-detail-content"><section><h2>{copy("عن الكورس", "About this course")}</h2><p>{isArabic ? course.descriptionAr : course.description}</p></section><section><h2>{copy("ماذا ستتعلم؟", "What you will learn")}</h2><div className="outcomes-grid">{course.learningOutcomes.map((item) => <span key={item}><Check />{item}</span>)}</div></section><section><h2>{copy("المدرس", "Instructor")}</h2><div className="instructor-profile"><span>{instructor?.initials}</span><div><h3>{nameOf(instructor, isArabic)}</h3><strong>{instructor?.specialty}</strong><p>{instructor?.bio}</p></div></div></section><section><h2>{copy("الدفعات المتاحة", "Available batches")}</h2><div className="batch-public-list">{courseBatches.map((batch) => <article key={batch.id}><CalendarDays /><div><strong>{nameOf(batch, isArabic)}</strong><span>{batch.schedule} · {copy("يبدأ", "Starts")} {batch.startDate}</span><small><MapPin />{batch.location}</small></div><Badge tone="success">{batch.capacity - batch.confirmedSeats - batch.reservedSeats} {copy("مكان", "seats")}</Badge></article>)}</div></section></div>
      <aside className="course-booking-card"><span>{copy("السعر يبدأ من", "Price starts at")}</span>{course.discountedPrice && <del>{course.price.toLocaleString()} {copy("ج.م", "EGP")}</del>}<strong>{(course.discountedPrice || course.price).toLocaleString()} {copy("ج.م", "EGP")}</strong><p>{copy("الحجز الآن والدفع لاحقًا بعد تأكيد الأكاديمية.", "Reserve now and pay after academy confirmation.")}</p><Button as={Link} to={`/booking/${course.id}`}>{copy("احجز مكانك الآن", "Reserve your seat")}</Button><div><ShieldCheck />{copy("لن يتم تحصيل أي مبلغ في هذه المرحلة.", "No payment is collected at this stage.")}</div></aside>
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
  const academy = academies.find((item) => item.slug === academySlug && item.public);
  if (!academy) return <Navigate to="/academies" replace />;
  const { isArabic, copy } = useMarketI18n();
  const academyCourses = courses.filter((item) => item.academyId === academy.id && item.status === "published");
  const academyInstructors = instructors.filter((item) => item.organizationId === academy.organizationId && item.active);
  useMarketplaceSeo(`${nameOf(academy, isArabic)} | AIN`, isArabic ? academy.descriptionAr : academy.description);
  return <MarketplaceShell><main className="academy-profile-main"><section className="academy-profile-cover"><div className="academy-profile-logo" style={{ background: academy.color }}>{academy.initials}</div><div><Badge tone="success">{academy.verified ? copy(`${providerLabel(academy.providerType, copy)} موثّق`, `Verified ${providerLabel(academy.providerType, copy).toLowerCase()}`) : copy("قيد التحقق", "Verification pending")}</Badge><h1>{nameOf(academy, isArabic)}</h1><p>{isArabic ? academy.descriptionAr : academy.description}</p><span><MapPin />{academy.location}</span></div></section><nav className="academy-profile-stats"><span><strong>{academyCourses.length}</strong> {copy("كورسات", "courses")}</span><span><strong>{academyInstructors.length}</strong> {copy("مدرسين", "instructors")}</span><span><strong>{academy.branches.length || 1}</strong> {copy("فرع / أونلاين", "branches / online")}</span></nav><section className="academy-profile-section"><h2>{copy("الكورسات المتاحة", "Available courses")}</h2><div className="market-course-grid">{academyCourses.map((course) => <CourseCard course={course} key={course.id} />)}</div></section><section className="academy-profile-section"><h2>{copy("المدرسون", "Instructors")}</h2><div className="instructors-public-grid">{academyInstructors.map((item) => <article key={item.id}><span>{item.initials}</span><h3>{nameOf(item, isArabic)}</h3><strong>{item.specialty}</strong><p>{item.bio}</p></article>)}</div></section></main></MarketplaceShell>;
}

export function PublicBookingPage() {
  const { courseId } = useParams();
  const { courses, batches, academies, createBooking } = useMarketplace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const course = courses.find((item) => item.id === courseId && item.status === "published");
  const available = batches.filter((item) => item.courseId === courseId && item.status === "open" && item.confirmedSeats + item.reservedSeats < item.capacity);
  const [batchId, setBatchId] = useState(available[0]?.id || "");
  const [paymentPreference, setPaymentPreference] = useState("paymob");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!course) return <Navigate to="/courses" replace />;
  const { isArabic, copy } = useMarketI18n();
  const academy = academies.find((item) => item.id === course.academyId);
  useMarketplaceSeo(copy("إتمام الحجز والدفع | AIN", "Complete Booking & Payment | AIN"), copy("اختر الدفعة وطريقة الدفع لإتمام تسجيلك في الكورس.", "Select a batch and payment method to enroll in the course."));

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
        amount: course.discountedPrice || course.price,
        note: form.get("note"),
      });
      if (!result.ok) {
        showToast(result.reason === "duplicate" ? copy("لديك طلب حجز قائم لهذا الكورس", "You already have an active booking") : copy("اكتملت سعة الدفعة", "This batch is full"), "error");
        return;
      }
      navigate(`/booking/success?booking=${result.booking.id}&pay=${paymentPreference}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketplaceShell>
      <main className="booking-page">
        <div className="booking-progress">
          <span className="active">1 {copy("اختيار الدفعة", "Select batch")}</span>
          <span className="active">2 {copy("بيانات الطالب والدفع", "Student & Payment")}</span>
          <span>3 {copy("تأكيد الطلب", "Confirmation")}</span>
        </div>
        <div className="booking-layout">
          <form className="booking-form" onSubmit={submit}>
            <header>
              <h1>{copy("إتمام الحجز والتسجيل", "Complete Booking & Enrollment")}</h1>
              <p>{copy("أدخل بياناتك واختر طريقة الدفع المناسبة لتأكيد مقعدك في الكورس.", "Enter your details and select your preferred payment method to secure your seat.")}</p>
            </header>

            <FormField label={copy("اختر الدفعة المناسبة", "Select batch")}>
              <select value={batchId} onChange={(e) => setBatchId(e.target.value)} required>
                {available.map((batch) => (
                  <option value={batch.id} key={batch.id}>
                    {nameOf(batch, isArabic)} - {batch.schedule}
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

            {/* Payment Method Selector */}
            <div style={{ margin: "14px 0", display: "grid", gap: "10px" }}>
              <label style={{ fontWeight: "600", fontSize: "14px" }}>
                {copy("طريقة الدفع وتأكيد المقعد:", "Payment Method & Seat Confirmation:")}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div
                  onClick={() => setPaymentPreference("paymob")}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: `2px solid ${paymentPreference === "paymob" ? "var(--primary, #16458F)" : "var(--border)"}`,
                    background: paymentPreference === "paymob" ? "rgba(22, 69, 143, 0.05)" : "var(--panel)",
                    cursor: "pointer",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px", color: paymentPreference === "paymob" ? "var(--primary, #16458F)" : "inherit" }}>
                    <CreditCard size={18} />
                    {copy("دفع إلكتروني فوري (Paymob)", "Instant Paymob Online")}
                  </div>
                  <small style={{ color: "var(--text-muted, #777)", lineHeight: "1.4" }}>
                    {copy("تأكيد فوري بالفيزا، ماستركارد، ميزة والمحافظ الإلكترونية.", "Instant confirmation via Cards, Meeza & Mobile Wallets.")}
                  </small>
                </div>

                <div
                  onClick={() => setPaymentPreference("later")}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    border: `2px solid ${paymentPreference === "later" ? "var(--primary, #16458F)" : "var(--border)"}`,
                    background: paymentPreference === "later" ? "rgba(22, 69, 143, 0.05)" : "var(--panel)",
                    cursor: "pointer",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "14px", color: paymentPreference === "later" ? "var(--primary, #16458F)" : "inherit" }}>
                    <Wallet size={18} />
                    {copy("الدفع لاحقاً مع الأكاديمية", "Pay Later with Academy")}
                  </div>
                  <small style={{ color: "var(--text-muted, #777)", lineHeight: "1.4" }}>
                    {copy("حجز مبدئي والتواصل مع إدارة الأكاديمية لتأكيد السداد.", "Reserve seat now; pay via bank transfer or cash at academy.")}
                  </small>
                </div>
              </div>
            </div>

            <label className="booking-terms">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              {copy("أوافق على شروط الحجز وسياسة الإلغاء وحماية المحتوى لمنصة عين.", "I accept AIN Platform's booking, cancellation, and protected content policy.")}
            </label>

            <Button type="submit" disabled={!batchId || submitting} style={{ width: "100%", padding: "12px", fontSize: "15px" }}>
              {submitting ? copy("جاري إرسال الطلب...", "Submitting...") : copy("متابعة وتأكيد الحجز", "Proceed to Confirmation")}
            </Button>
          </form>

          <aside className="booking-summary">
            <span className="academy-mini-logo" style={{ background: academy?.color }}>{academy?.initials}</span>
            <small>{nameOf(academy, isArabic)}</small>
            <h2>{nameOf(course, isArabic)}</h2>
            <div>
              <span>{copy("سعر الكورس", "Course price")}</span>
              <strong>{(course.discountedPrice || course.price).toLocaleString()} {copy("ج.م", "EGP")}</strong>
            </div>
            <p>
              <ShieldCheck />
              {paymentPreference === "paymob"
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
  const shouldPayNow = params.get("pay") === "paymob";
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

  const startCheckout = async () => {
    setLoadingCheckout(true);
    try {
      const intent = await api.checkoutPayment({
        booking_id: booking.id,
        payment_method: "paymob",
      });
      setPayIntent(intent);
      setPayModalOpen(true);
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
          {isPaid ? copy("حجز مؤكد ومدفوع", "Confirmed & Paid") : copy("قيد تأكيد الأكاديمية / انتظار السداد", "Pending Confirmation / Unpaid")}
        </Badge>

        <h1>{isPaid ? copy("تم تأكيد حجزك واشتراكك بنجاح!", "Booking & Enrollment Confirmed!") : copy("تم استلام طلب الحجز بنجاح", "Booking Request Received")}</h1>

        <p>
          {isPaid
            ? copy("تم تفعيل الكورس في حسابك تلقائياً ويمكنك الآن الوصول إلى المواد والفيديوهات المشفرة.", "Course access is activated. You can now access your course materials and encrypted content.")
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
          <strong>{isPaid ? copy("مدفوع بالكامل", "Paid in full") : copy("غير مدفوع", "Unpaid")}</strong>
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
