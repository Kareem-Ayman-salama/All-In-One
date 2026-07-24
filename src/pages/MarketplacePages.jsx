import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Building2, CalendarDays, Check, ChevronDown,
  Clock3, Filter, GraduationCap, Languages, MapPin, Menu, MonitorPlay, Search, ShieldCheck,
  SlidersHorizontal, Sparkles, Star, Sun, Moon, Users, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { useMarketplace } from "../contexts/MarketplaceContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

function nameOf(item, arabic = true) {
  return arabic ? (item?.nameAr || item?.titleAr || item?.name || item?.title) : (item?.name || item?.title);
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
      <Link className="marketplace-brand" to="/courses"><img src="/images/aio-logo-64.png" alt="" /><strong>All In One</strong></Link>
      <button className="marketplace-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={copy("فتح القائمة", "Open menu")}><Menu /></button>
      <nav className={menuOpen ? "open" : ""}>
        <Link to="/courses">{copy("استكشف الكورسات", "Explore courses")}</Link><Link to="/academies">{copy("الأكاديميات", "Academies")}</Link><Link to="/register-company">{copy("للأكاديميات والشركات", "For organizations")}</Link><Link to="/login">{copy("تسجيل الدخول", "Sign in")}</Link>
      </nav>
      <div className="marketplace-nav-tools"><button onClick={toggleLanguage}>{isArabic ? "EN" : "ع"}</button><button onClick={toggleTheme} aria-label={copy("تبديل المظهر", "Toggle theme")}>{theme === "dark" ? <Sun /> : <Moon />}</button></div>
      <Button as={Link} to="/register-company">{copy("ابدأ كأكاديمية", "Start as an academy")}</Button>
    </header>
    {children}
    <footer className="marketplace-footer"><div><strong>AIO</strong><p>{copy("منصة واحدة للتعلم وإدارة المحتوى والحجوزات ومساحات العمل.", "One platform for learning, content, bookings, and workspaces.")}</p></div><div><Link to="/courses">{copy("الكورسات", "Courses")}</Link><Link to="/academies">{copy("الأكاديميات", "Academies")}</Link><Link to="/privacy">{copy("الخصوصية", "Privacy")}</Link><Link to="/support">{copy("الدعم", "Support")}</Link></div><small>© 2026 All In One. {copy("جميع الحقوق محفوظة.", "All rights reserved.")}</small></footer>
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
  return <article className="market-course-card">
    <Link className="market-course-cover" to={`/courses/${course.slug}`}>{course.coverUrl ? <img src={course.coverUrl} alt="" loading="lazy" /> : <BookOpen />}<div>{course.sponsored && <Badge tone="warning">{copy("إعلان ممول", "Sponsored")}</Badge>}{course.featured && <Badge tone="primary">{copy("مميز", "Featured")}</Badge>}</div></Link>
    <div className="market-course-body"><span>{nameOf(category, isArabic)} · {course.level}</span><Link to={`/courses/${course.slug}`}><h2>{nameOf(course, isArabic)}</h2></Link><p>{isArabic ? course.shortDescriptionAr : course.shortDescription}</p>
      <div className="market-course-owner"><span style={{ background: academy?.color }}>{academy?.initials}</span><div><strong>{instructor ? nameOf(instructor, isArabic) : copy("فريق الأكاديمية", "Academy team")}</strong><small>{nameOf(academy, isArabic)} {academy?.verified && <BadgeCheck size={14} />}</small></div></div>
      <div className="market-course-meta"><span><MonitorPlay />{course.deliveryType}</span><span><CalendarDays />{batch?.startDate || copy("قريبًا", "Soon")}</span><span><Users />{remaining} {copy("مكان متبقٍ", "seats left")}</span></div>
      <footer><div>{course.discountedPrice && <del>{course.price.toLocaleString()} {copy("ج.م", "EGP")}</del>}<strong>{(course.discountedPrice || course.price).toLocaleString()} {copy("ج.م", "EGP")}</strong></div><Button as={Link} to={`/courses/${course.slug}`}>{copy("عرض التفاصيل", "View details")}</Button></footer>
    </div>
  </article>;
}

export function CoursesMarketplacePage() {
  const { courses, categories, academies, instructors } = useMarketplace();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { isArabic, copy } = useMarketI18n();
  useMarketplaceSeo(copy("الكورسات | All In One", "Courses | All In One"), copy("ابحث عن كورسات ومدرسين وأكاديميات واحجز دفعتك على منصة AIO.", "Discover courses, instructors, and academies and reserve your batch on AIO."));
  const query = params.get("q") || "";
  const category = params.get("category") || "all";
  const delivery = params.get("delivery") || "all";
  const sort = params.get("sort") || "featured";
  const set = (key, value) => { const next = new URLSearchParams(params); value && value !== "all" ? next.set(key, value) : next.delete(key); setParams(next); };
  const visible = useMemo(() => {
    const text = query.toLowerCase().trim();
    const filtered = courses.filter((course) => course.status === "published")
      .filter((course) => category === "all" || course.categoryId === category)
      .filter((course) => delivery === "all" || course.deliveryType === delivery)
      .filter((course) => !text || [course.title, course.titleAr, course.subject, academies.find((a) => a.id === course.academyId)?.name, instructors.find((i) => i.id === course.instructorId)?.name].join(" ").toLowerCase().includes(text));
    return [...filtered].sort((a, b) => sort === "price-low" ? (a.discountedPrice || a.price) - (b.discountedPrice || b.price) : sort === "price-high" ? (b.discountedPrice || b.price) - (a.discountedPrice || a.price) : Number(b.featured) - Number(a.featured));
  }, [academies, category, courses, delivery, instructors, query, sort]);
  return <MarketplaceShell>
    <main className="marketplace-main">
      <section className="marketplace-hero"><Badge tone="primary"><Sparkles size={14} />{copy("تعلم من أكاديميات موثوقة", "Learn from verified academies")}</Badge><h1>{copy("اختر الكورس المناسب، واحجز مكانك بسهولة", "Find the right course and reserve your seat")}</h1><p>{copy("ابحث حسب المادة أو المدرس أو الأكاديمية، ثم انضم إلى مساحة الكورس الخاصة بك بعد تأكيد الحجز.", "Search by subject, instructor, or academy, then enter your course workspace after confirmation.")}</p>
        <label className="marketplace-search"><Search /><input value={query} onChange={(e) => set("q", e.target.value)} placeholder={copy("ابحث عن مادة، مدرس، أكاديمية أو كورس...", "Search courses, instructors, or academies...")} /><Button>{copy("بحث", "Search")}</Button></label>
      </section>
      <section className="marketplace-categories">{categories.filter((item) => item.active).map((item) => <button className={category === item.id ? "active" : ""} onClick={() => set("category", item.id)} key={item.id}><GraduationCap />{nameOf(item, isArabic)}</button>)}</section>
      <div className="marketplace-results-head"><div><h2>{copy("الكورسات المتاحة", "Available courses")}</h2><p>{visible.length} {copy("نتيجة مناسبة", "matching results")}</p></div><button className="marketplace-filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal /> {copy("الفلاتر", "Filters")}</button><select value={sort} onChange={(e) => set("sort", e.target.value)}><option value="featured">{copy("المميزة أولًا", "Featured first")}</option><option value="price-low">{copy("السعر: الأقل أولًا", "Price: low to high")}</option><option value="price-high">{copy("السعر: الأعلى أولًا", "Price: high to low")}</option></select></div>
      <div className="marketplace-results-layout">
        <aside className={filtersOpen ? "open" : ""}><header><strong>{copy("تصفية النتائج", "Filter results")}</strong><button onClick={() => setFiltersOpen(false)}><X /></button></header><label>{copy("نوع الحضور", "Delivery type")}<select value={delivery} onChange={(e) => set("delivery", e.target.value)}><option value="all">{copy("الكل", "All")}</option><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option><option value="recorded">Recorded</option></select></label><label>{copy("التصنيف", "Category")}<select value={category} onChange={(e) => set("category", e.target.value)}><option value="all">{copy("كل التصنيفات", "All categories")}</option>{categories.map((item) => <option value={item.id} key={item.id}>{nameOf(item, isArabic)}</option>)}</select></label><Button variant="ghost" onClick={() => setParams({})}>{copy("مسح الفلاتر", "Clear filters")}</Button></aside>
        <section className="market-course-grid">{visible.length ? visible.map((course) => <CourseCard course={course} key={course.id} />) : <div className="market-empty"><Search /><h2>{copy("لا توجد نتائج مطابقة", "No matching results")}</h2><p>{copy("غيّر كلمات البحث أو امسح بعض الفلاتر.", "Try another search or clear some filters.")}</p><Button onClick={() => setParams({})}>{copy("عرض كل الكورسات", "View all courses")}</Button></div>}</section>
      </div>
    </main>
  </MarketplaceShell>;
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
  useMarketplaceSeo(`${nameOf(course, isArabic)} | AIO`, isArabic ? course.shortDescriptionAr : course.shortDescription);
  return <MarketplaceShell><main className="course-detail-main">
    <div className="market-breadcrumbs"><Link to="/courses">{copy("الكورسات", "Courses")}</Link><span>/</span><span>{nameOf(category, isArabic)}</span><span>/</span><strong>{nameOf(course, isArabic)}</strong></div>
    <section className="course-detail-hero"><div><Badge tone="primary">{nameOf(category, isArabic)}</Badge><h1>{nameOf(course, isArabic)}</h1><p>{isArabic ? course.shortDescriptionAr : course.shortDescription}</p><div className="course-detail-owner"><span style={{ background: academy?.color }}>{academy?.initials}</span><div><strong>{nameOf(academy, isArabic)} {academy?.verified && <BadgeCheck />}</strong><small>{copy("بواسطة", "By")} {nameOf(instructor, isArabic)}</small></div></div><div className="course-detail-facts"><span><Clock3 />{course.duration}</span><span><BookOpen />{course.sessions} {copy("حصة", "sessions")}</span><span><MonitorPlay />{course.deliveryType}</span></div></div><div className="course-visual">{course.coverUrl ? <img src={course.coverUrl} alt="" /> : <GraduationCap />}</div></section>
    <div className="course-detail-layout"><div className="course-detail-content"><section><h2>{copy("عن الكورس", "About this course")}</h2><p>{isArabic ? course.descriptionAr : course.description}</p></section><section><h2>{copy("ماذا ستتعلم؟", "What you will learn")}</h2><div className="outcomes-grid">{course.learningOutcomes.map((item) => <span key={item}><Check />{item}</span>)}</div></section><section><h2>{copy("المدرس", "Instructor")}</h2><div className="instructor-profile"><span>{instructor?.initials}</span><div><h3>{nameOf(instructor, isArabic)}</h3><strong>{instructor?.specialty}</strong><p>{instructor?.bio}</p></div></div></section><section><h2>{copy("الدفعات المتاحة", "Available batches")}</h2><div className="batch-public-list">{courseBatches.map((batch) => <article key={batch.id}><CalendarDays /><div><strong>{nameOf(batch, isArabic)}</strong><span>{batch.schedule} · {copy("يبدأ", "Starts")} {batch.startDate}</span><small><MapPin />{batch.location}</small></div><Badge tone="success">{batch.capacity - batch.confirmedSeats - batch.reservedSeats} {copy("مكان", "seats")}</Badge></article>)}</div></section></div>
      <aside className="course-booking-card"><span>{copy("السعر يبدأ من", "Price starts at")}</span>{course.discountedPrice && <del>{course.price.toLocaleString()} {copy("ج.م", "EGP")}</del>}<strong>{(course.discountedPrice || course.price).toLocaleString()} {copy("ج.م", "EGP")}</strong><p>{copy("الحجز الآن والدفع لاحقًا بعد تأكيد الأكاديمية.", "Reserve now and pay after academy confirmation.")}</p><Button as={Link} to={`/booking/${course.id}`}>{copy("احجز مكانك الآن", "Reserve your seat")}</Button><div><ShieldCheck />{copy("لن يتم تحصيل أي مبلغ في هذه المرحلة.", "No payment is collected at this stage.")}</div></aside>
    </div>
  </main></MarketplaceShell>;
}

export function AcademiesPage() {
  const { academies, courses } = useMarketplace();
  const [query, setQuery] = useState("");
  const { isArabic, copy } = useMarketI18n();
  useMarketplaceSeo(copy("الأكاديميات | AIO", "Academies | AIO"), copy("اكتشف الأكاديميات الموثقة والكورسات المتاحة.", "Discover verified academies and their available courses."));
  const visible = academies.filter((item) => item.public && item.status === "approved" && nameOf(item, isArabic).toLowerCase().includes(query.toLowerCase()));
  return <MarketplaceShell><main className="marketplace-main"><section className="marketplace-simple-hero"><Building2 /><div><h1>{copy("الأكاديميات على AIO", "Academies on AIO")}</h1><p>{copy("تصفح الأكاديميات الموثوقة وشاهد كورساتها ودفعاتها المتاحة.", "Browse verified academies, courses, and available batches.")}</p></div><label><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy("ابحث باسم الأكاديمية", "Search academies")} /></label></section><section className="academy-public-grid">{visible.map((academy) => <article key={academy.id}><header><span style={{ background: academy.color }}>{academy.initials}</span><div><h2>{nameOf(academy, isArabic)} {academy.verified && <BadgeCheck />}</h2><p><MapPin />{academy.location}</p></div></header><p>{isArabic ? academy.descriptionAr : academy.description}</p><div>{academy.deliveryMethods.map((item) => <Badge key={item} tone="neutral">{item}</Badge>)}</div><footer><span>{courses.filter((course) => course.academyId === academy.id && course.status === "published").length} {copy("كورسات منشورة", "published courses")}</span><Button as={Link} to={`/academies/${academy.slug}`}>{copy("عرض الأكاديمية", "View academy")}</Button></footer></article>)}</section></main></MarketplaceShell>;
}

export function AcademyProfilePage() {
  const { academySlug } = useParams();
  const { academies, courses, instructors } = useMarketplace();
  const academy = academies.find((item) => item.slug === academySlug && item.public);
  if (!academy) return <Navigate to="/academies" replace />;
  const { isArabic, copy } = useMarketI18n();
  const academyCourses = courses.filter((item) => item.academyId === academy.id && item.status === "published");
  const academyInstructors = instructors.filter((item) => item.organizationId === academy.organizationId && item.active);
  useMarketplaceSeo(`${nameOf(academy, isArabic)} | AIO`, isArabic ? academy.descriptionAr : academy.description);
  return <MarketplaceShell><main className="academy-profile-main"><section className="academy-profile-cover"><div className="academy-profile-logo" style={{ background: academy.color }}>{academy.initials}</div><div><Badge tone="success">{academy.verified ? copy("أكاديمية موثقة", "Verified academy") : copy("قيد التحقق", "Verification pending")}</Badge><h1>{nameOf(academy, isArabic)}</h1><p>{isArabic ? academy.descriptionAr : academy.description}</p><span><MapPin />{academy.location}</span></div></section><nav className="academy-profile-stats"><span><strong>{academyCourses.length}</strong> {copy("كورسات", "courses")}</span><span><strong>{academyInstructors.length}</strong> {copy("مدرسين", "instructors")}</span><span><strong>{academy.branches.length || 1}</strong> {copy("فرع / أونلاين", "branches / online")}</span></nav><section className="academy-profile-section"><h2>{copy("الكورسات المتاحة", "Available courses")}</h2><div className="market-course-grid">{academyCourses.map((course) => <CourseCard course={course} key={course.id} />)}</div></section><section className="academy-profile-section"><h2>{copy("المدرسون", "Instructors")}</h2><div className="instructors-public-grid">{academyInstructors.map((item) => <article key={item.id}><span>{item.initials}</span><h3>{nameOf(item, isArabic)}</h3><strong>{item.specialty}</strong><p>{item.bio}</p></article>)}</div></section></main></MarketplaceShell>;
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
  const [accepted, setAccepted] = useState(false);
  if (!course) return <Navigate to="/courses" replace />;
  const { isArabic, copy } = useMarketI18n();
  const academy = academies.find((item) => item.id === course.academyId);
  useMarketplaceSeo(copy("إتمام الحجز | AIO", "Complete booking | AIO"), copy("اختر الدفعة وأرسل طلب حجزك للأكاديمية.", "Select a batch and send your booking request."));
  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!accepted) return showToast(copy("يجب الموافقة على سياسة الحجز", "Please accept the booking policy"), "error");
    const result = await createBooking({ organizationId: course.organizationId, courseId: course.id, batchId, studentId: user?.id || form.get("email"), studentName: form.get("name"), email: form.get("email"), phone: form.get("phone"), amount: course.discountedPrice || course.price, note: form.get("note") });
    if (!result.ok) return showToast(result.reason === "duplicate" ? copy("لديك طلب حجز قائم لهذا الكورس", "You already have an active booking") : copy("اكتملت سعة الدفعة", "This batch is full"), "error");
    navigate(`/booking/success?booking=${result.booking.id}`);
  };
  return <MarketplaceShell><main className="booking-page"><div className="booking-progress"><span className="active">1 {copy("اختيار الدفعة", "Select batch")}</span><span className="active">2 {copy("بيانات الطالب", "Student details")}</span><span>3 {copy("تأكيد الطلب", "Confirmation")}</span></div><div className="booking-layout"><form className="booking-form" onSubmit={submit}><header><h1>{copy("إتمام الحجز", "Complete booking")}</h1><p>{copy("راجع الدفعة وأدخل بيانات التواصل. الدفع يتم بعد تأكيد الأكاديمية.", "Review the batch and enter your contact details. Payment follows academy confirmation.")}</p></header><FormField label={copy("اختر الدفعة", "Select batch")}><select value={batchId} onChange={(e) => setBatchId(e.target.value)} required>{available.map((batch) => <option value={batch.id} key={batch.id}>{nameOf(batch, isArabic)} - {batch.schedule}</option>)}</select></FormField><div className="learning-form-grid"><FormField label={copy("الاسم الكامل", "Full name")}><input name="name" defaultValue={user?.name || ""} minLength="2" required /></FormField><FormField label={copy("البريد الإلكتروني", "Email")}><input name="email" type="email" defaultValue={user?.email || ""} required /></FormField><FormField label={copy("رقم الهاتف", "Phone")}><input name="phone" type="tel" placeholder="01xxxxxxxxx" required /></FormField><FormField label={copy("ملاحظة اختيارية", "Optional note")}><input name="note" placeholder={copy("مثال: أفضل الحضور أونلاين", "Example: I prefer online attendance")} /></FormField></div><label className="booking-terms"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> {copy("أوافق على شروط الحجز وسياسة الإلغاء الخاصة بالأكاديمية.", "I accept the academy booking and cancellation policy.")}</label><Button type="submit" disabled={!batchId}>{copy("إرسال طلب الحجز", "Send booking request")}</Button></form><aside className="booking-summary"><span className="academy-mini-logo" style={{ background: academy?.color }}>{academy?.initials}</span><small>{nameOf(academy, isArabic)}</small><h2>{nameOf(course, isArabic)}</h2><div><span>{copy("سعر الكورس", "Course price")}</span><strong>{(course.discountedPrice || course.price).toLocaleString()} {copy("ج.م", "EGP")}</strong></div><p><ShieldCheck />{copy("لن تدفع الآن. ستتواصل الأكاديمية معك لتأكيد المقعد.", "No payment now. The academy will contact you to confirm your seat.")}</p></aside></div></main></MarketplaceShell>;
}

export function BookingSuccessPage() {
  const [params] = useSearchParams();
  const { isArabic, copy } = useMarketI18n();
  const { bookings, courses, batches } = useMarketplace();
  const booking = bookings.find((item) => item.id === params.get("booking"));
  if (!booking) return <Navigate to="/courses" replace />;
  const course = courses.find((item) => item.id === booking.courseId);
  const batch = batches.find((item) => item.id === booking.batchId);
  return <MarketplaceShell><main className="booking-success"><span><Check /></span><Badge tone="warning">{copy("قيد تأكيد الأكاديمية", "Pending academy confirmation")}</Badge><h1>{copy("تم إرسال طلب الحجز بنجاح", "Booking request sent successfully")}</h1><p>{copy("سيتواصل معك فريق الأكاديمية لتأكيد المقعد وطريقة الدفع.", "The academy team will contact you to confirm your seat and payment method.")}</p><div><small>{copy("رقم الطلب", "Request number")}</small><strong>{booking.id.slice(-8).toUpperCase()}</strong><small>{copy("الكورس", "Course")}</small><strong>{nameOf(course, isArabic)}</strong><small>{copy("الدفعة", "Batch")}</small><strong>{nameOf(batch, isArabic)}</strong></div><nav><Button as={Link} to="/end-user/courses">{copy("متابعة طلباتي", "Track my requests")}</Button><Button as={Link} variant="ghost" to="/courses">{copy("استكشاف المزيد", "Explore more")}</Button></nav></main></MarketplaceShell>;
}
