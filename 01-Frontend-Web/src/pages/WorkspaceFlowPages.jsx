import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  CloudUpload,
  Headphones,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthHeader, AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { getAuthErrorMessage } from "../services/authErrors";
import { api } from "../services/api";

const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";

const flowCopy = {
  ar: {
    companyTitle: "أنشئ مساحة عمل لشركتك",
    companySubtitle: "ابدأ تجربة شهر مجاني، واضبط هوية الشركة قبل دعوة فريقك.",
    companyName: "اسم الشركة",
    yourName: "اسمك الكامل",
    createCompany: "إنشاء مساحة الشركة",
    onboardingTitle: "جهّز هوية مساحة العمل",
    onboardingSubtitle: "أضف الشعار والبيانات الأساسية لتظهر التجربة باسم شركتك.",
    logo: "رفع شعار الشركة",
    logoHint: "PNG أو JPG أو SVG، ويفضل مقاس 400×400",
    bio: "نبذة عن الشركة",
    finish: "حفظ وفتح لوحة التحكم",
    joinTitle: "الانضمام إلى مساحة عمل",
    joinSubtitle: "أدخل رمز الدعوة الذي أرسله مسؤول شركتك. سيتم ربط الحساب بعد التحقق.",
    inviteCode: "رمز الدعوة",
    validate: "التحقق والمتابعة",
    noCode: "ليس لدي رمز دعوة",
    noWorkspaceTitle: "حسابك جاهز، وننتظر دعوة الشركة",
    noWorkspaceText: "اطلب من مسؤول شركتك دعوتك على نفس البريد. ستظهر الدعوة هنا فور وصولها.",
    noInvites: "لا توجد دعوات معلقة حالياً",
    noInvitesHint: "يمكنك إدخال رمز الدعوة يدوياً أو العودة لاحقاً بعد إرسال الدعوة.",
    preview: "تجربة دعوة",
    switchAccount: "استخدام حساب آخر",
    createWorkspace: "إنشاء مساحة لشركة",
    invitation: "دعوة للانضمام",
    invitedTo: "تمت دعوتك إلى فريق تحليل البيانات",
    invitedBy: "دعتك سارة أحمد للانضمام إلى مساحة TechCorp Egypt.",
    role: "الدور",
    rooms: "الغرف المتاحة",
    inviter: "صاحب الدعوة",
    accept: "قبول الدعوة",
    accepting: "جاري ربط الحساب...",
    decline: "ليس الآن",
    signInAccept: "سجل الدخول لقبول الدعوة",
    accepted: "تم ربط حسابك بمساحة العمل",
    notFound: "الصفحة غير موجودة",
    notFoundText: "قد يكون الرابط غير صحيح أو تم نقل الصفحة.",
    goLogin: "العودة لتسجيل الدخول"
  },
  en: {
    companyTitle: "Create your company workspace",
    companySubtitle: "Start a one-month free trial and set up your company identity before inviting your team.",
    companyName: "Company name",
    yourName: "Your full name",
    createCompany: "Create company workspace",
    onboardingTitle: "Set up your workspace identity",
    onboardingSubtitle: "Add your logo and company details so the experience feels like your own.",
    logo: "Upload company logo",
    logoHint: "PNG, JPG, or SVG. 400×400 recommended",
    bio: "Company bio",
    finish: "Save and open dashboard",
    joinTitle: "Join a workspace",
    joinSubtitle: "Enter the invitation code sent by your company admin. We will link your account after validation.",
    inviteCode: "Invitation code",
    validate: "Validate and continue",
    noCode: "I do not have an invitation code",
    noWorkspaceTitle: "Your account is ready. We are waiting for your company invitation",
    noWorkspaceText: "Ask your company admin to invite the same email. Your invitation will appear here when it arrives.",
    noInvites: "No pending invitations right now",
    noInvitesHint: "Enter an invitation code manually or return after your admin sends the invitation.",
    preview: "Preview invitation",
    switchAccount: "Use another account",
    createWorkspace: "Create a company workspace",
    invitation: "Workspace invitation",
    invitedTo: "You are invited to the Data Analysis team",
    invitedBy: "Sarah Ahmed invited you to join TechCorp Egypt.",
    role: "Role",
    rooms: "Available rooms",
    inviter: "Invited by",
    accept: "Accept invitation",
    accepting: "Linking your account...",
    decline: "Not now",
    signInAccept: "Sign in to accept invitation",
    accepted: "Your account is now linked to the workspace",
    notFound: "Page not found",
    notFoundText: "The link may be invalid or the page has moved.",
    goLogin: "Back to sign in"
  }
};

export function RegisterCompanyPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedType = searchParams.get("type");
  const type = ["independent_instructor", "academy", "training_center"].includes(requestedType) ? requestedType : "academy";
  const [form, setForm] = useState({ name: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const valid = form.name.trim().length >= 2;
  const isArabic = language === "ar";
  const typeCopy = {
    independent_instructor: { ar: "مدرس مستقل", en: "Independent instructor", icon: <UserPlus size={20} /> },
    academy: { ar: "أكاديمية", en: "Academy", icon: <Building2 size={20} /> },
    training_center: { ar: "مركز تدريبي", en: "Training center", icon: <Sparkles size={20} /> }
  };
  const registrationPath = `/register-company?type=${type}`;

  const selectType = (nextType) => {
    const next = new URLSearchParams(searchParams);
    next.set("type", nextType);
    setSearchParams(next);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!valid || !user) return;
    setLoading(true);
    setError("");
    try {
      await api.createOrganization({ name: form.name.trim(), type, bio: form.bio.trim() || null });
      showToast(isArabic ? "تم إنشاء مساحة العمل بنجاح" : "Workspace created successfully");
      window.location.assign("/workspaces");
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-panel-card">
        <AuthHeader icon={typeCopy[type].icon} title={isArabic ? "ابدأ بيع كورساتك على AIN" : "Start selling courses on AIN"} subtitle={isArabic ? "اختر نوع مقدم الكورس، ثم أنشئ مساحة العمل التي ستدير منها الكورسات والحجوزات." : "Choose your provider type, then create the workspace where you will manage courses and bookings."} />
        <div className="workspace-type-picker" role="group" aria-label={isArabic ? "نوع مقدم الكورس" : "Course provider type"}>{Object.entries(typeCopy).map(([value, item]) => <button type="button" className={type === value ? "selected" : ""} onClick={() => selectType(value)} key={value}>{item.icon}<span>{isArabic ? item.ar : item.en}</span></button>)}</div>
        {!user ? <div className="seller-auth-gate"><p>{isArabic ? "تحتاج أولًا إلى حساب شخصي موثّق. بعد تأكيد البريد سنرجعك مباشرة لإنشاء صفحة الكورسات." : "First create a verified personal account. After email verification, we will bring you back to create your course storefront."}</p><Button as={Link} className="auth-submit" to={`/create-account?next=${encodeURIComponent(registrationPath)}`}>{isArabic ? "إنشاء حساب والمتابعة" : "Create account and continue"}</Button><span>{isArabic ? "لديك حساب بالفعل؟" : "Already have an account?"} <Link to={`/login?next=${encodeURIComponent(registrationPath)}`}>{isArabic ? "سجّل الدخول" : "Sign in"}</Link></span></div> : <form className="auth-form" onSubmit={submit}>
          <FormField label={type === "independent_instructor" ? (isArabic ? "اسمك كما سيظهر للطلاب" : "Public instructor name") : (isArabic ? "اسم الأكاديمية أو المركز" : "Academy or center name")}><input className="auth-plain-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></FormField>
          <FormField label={isArabic ? "نبذة مختصرة (اختياري)" : "Short bio (optional)"}><textarea className="workspace-textarea" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} placeholder={isArabic ? "عرّف الطلاب بخبرتك وما الذي تقدمه..." : "Tell students about your expertise and courses..."} /></FormField>
          {error && <p className="auth-inline-error" role="alert">{error}</p>}
          <Button className="auth-submit" type="submit" loading={loading} disabled={!valid}>{isArabic ? `إنشاء مساحة ${typeCopy[type].ar}` : `Create ${typeCopy[type].en} workspace`}</Button>
          <p className="seller-review-note"><ShieldCheck size={17} />{isArabic ? "نشر الصفحة والكورسات يحتاج مراجعة بيانات مقدم المحتوى أولًا." : "Publishing your profile and courses requires provider review first."}</p>
        </form>}
      </div>
    </AuthLayout>
  );
}

export function CompanyOnboardingPage() {
  const { language, t } = useLanguage();
  const copy = flowCopy[language];
  const navigate = useNavigate();
  const [color, setColor] = useState("#4f46e5");

  return (
    <AuthLayout>
      <div className="auth-panel-card">
        <AuthHeader icon={<CloudUpload size={23} />} title={copy.onboardingTitle} subtitle={copy.onboardingSubtitle} />
        <div className="auth-form">
          <label className="workspace-upload"><CloudUpload size={28} /><strong>{copy.logo}</strong><span>{copy.logoHint}</span><input type="file" accept="image/png,image/jpeg,image/svg+xml" /></label>
          <FormField label={copy.companyName}><input className="auth-plain-input" defaultValue="TechCorp Egypt" /></FormField>
          <FormField label={copy.bio}><textarea className="workspace-textarea" defaultValue={language === "ar" ? "شركة متخصصة في حلول البرمجيات والتدريب." : "A company specializing in software and training solutions."} /></FormField>
          <div className="workspace-colors">{["#4f46e5", "#16458f", "#0e7490", "#047857", "#be123c"].map((item) => <button type="button" style={{ background: item }} className={color === item ? "selected" : ""} onClick={() => setColor(item)} key={item}>{color === item && <Check size={16} />}</button>)}</div>
          <Button className="auth-submit" onClick={() => navigate("/login?role=tenant-admin")}>{copy.finish}</Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export function JoinWorkspacePage() {
  const { language } = useLanguage();
  const copy = flowCopy[language];
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  return (
    <AuthLayout compact>
      <div className="auth-panel-card">
        <AuthHeader icon={<KeyRound size={23} />} title={copy.joinTitle} subtitle={copy.joinSubtitle} />
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); if (code.trim()) navigate(`/invite/${encodeURIComponent(code.trim())}`); }}>
          <FormField label={copy.inviteCode}><input className="auth-plain-input auth-code-input" dir="ltr" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="TECHCORP-2026" required /></FormField>
          <Button className="auth-submit" type="submit" disabled={!code.trim()}>{copy.validate}</Button>
          <Link className="auth-back-link" to="/no-workspace"><ArrowLeft size={17} />{copy.noCode}</Link>
        </form>
      </div>
    </AuthLayout>
  );
}

export function NoWorkspacePage() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const copy = flowCopy[language];
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const switchAccount = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout compact>
      <div className="auth-panel-card no-workspace-card">
        <AuthHeader icon={<Search size={23} />} title={copy.noWorkspaceTitle} subtitle={<>{copy.noWorkspaceText} {user?.email && <strong dir="ltr">{user.email}</strong>}</>} />
        <div className="pending-workspace-status"><span><Mail size={20} /></span><div><strong>{copy.noInvites}</strong><small>{copy.noInvitesHint}</small></div></div>
        <form className="auth-form workspace-code-form" onSubmit={(event) => { event.preventDefault(); if (code.trim()) navigate(`/invite/${encodeURIComponent(code.trim())}`); }}>
          <FormField label={copy.inviteCode}><input className="auth-plain-input" dir="ltr" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="TECHCORP-2026" /></FormField>
          <Button type="submit" disabled={!code.trim()}>{copy.validate}</Button>
        </form>
        <div className="workspace-secondary-actions">
          {showDemoAccounts && <Button as={Link} to="/invite/demo-token" variant="ghost">{copy.preview}</Button>}
          <Button type="button" onClick={switchAccount} variant="ghost">{copy.switchAccount}</Button>
          <Button as={Link} to="/register-company" variant="ghost">{copy.createWorkspace}</Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export function InviteAcceptPage() {
  const { user, acceptInvitation } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const copy = flowCopy[language];
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    let active = true;
    if (showDemoAccounts && token === "demo-token") {
      setInvitation({
        organization: { name: "Demo workspace" },
        role: "member",
        rooms: [],
        inviter: { name: "AIN Demo" },
        status: "pending"
      });
      return () => { active = false; };
    }
    api.getInvitationPreview(token)
      .then((result) => {
        if (active) setInvitation(result);
      })
      .catch((error) => {
        if (active) setPreviewError(error.message);
      });
    return () => { active = false; };
  }, [token]);

  const accept = async () => {
    setLoading(true);
    try {
      await acceptInvitation({ token });
      showToast(copy.accepted);
      navigate("/end-user/home", { replace: true });
    } catch (error) {
      showToast(getAuthErrorMessage(error, t), "danger");
    } finally {
      setLoading(false);
    }
  };

  if (previewError) {
    return <AuthLayout compact><div className="auth-panel-card"><AuthHeader icon={<LockKeyhole size={23} />} title={copy.notFound} subtitle={previewError} /><Button as={Link} to="/login">{copy.goLogin}</Button></div></AuthLayout>;
  }
  if (!invitation) {
    return <AuthLayout compact><div className="auth-panel-card"><p>{copy.accepting}</p></div></AuthLayout>;
  }
  const canAccept = invitation.status === "pending";

  return (
    <AuthLayout compact>
      <div className="auth-panel-card invite-pro-card">
        <AuthHeader icon={<UserPlus size={23} />} title={copy.invitation} subtitle={invitation.note || `${invitation.inviter?.name || "AIN"} ${copy.invitation}`} />
        <div className="invite-company-mark"><span>{invitation.organization?.name?.slice(0, 2).toUpperCase() || "AI"}</span><div><strong>{invitation.organization?.name}</strong><small>{invitation.status}</small></div></div>
        <div className="invite-details-pro">
          <div><span>{copy.role}</span><strong>{invitation.role}</strong></div>
          <div><span>{copy.rooms}</span><strong>{invitation.rooms?.map((room) => room.name).join(", ") || "—"}</strong></div>
          <div><span>{copy.inviter}</span><strong>{invitation.inviter?.name || "—"}</strong></div>
        </div>
        <div className="workspace-secondary-actions">
          {canAccept && (user ? <Button type="button" onClick={accept} disabled={loading}>{loading ? copy.accepting : copy.accept}</Button> : <Button as={Link} to="/login" state={{ from: location.pathname }}>{copy.signInAccept}</Button>)}
          <Button as={Link} to={user ? "/no-workspace" : "/"} variant="ghost">{copy.decline}</Button>
        </div>
      </div>
    </AuthLayout>
  );
}

export function NotFoundPage() {
  const { language } = useLanguage();
  const copy = flowCopy[language];
  return (
    <AuthLayout compact>
      <div className="auth-panel-card not-found-pro"><span>404</span><LockKeyhole size={36} /><h1>{copy.notFound}</h1><p>{copy.notFoundText}</p><Button as={Link} to="/login">{copy.goLogin}</Button></div>
    </AuthLayout>
  );
}

export function LegalPage({ type }) {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { showToast } = useToast();

  const [supportState, setSupportState] = useState({
    name: "",
    email: "",
    subject: isArabic ? "استفسار عن اشتراك أو كورس" : "Inquiry about course or subscription",
    message: "",
    priority: "normal"
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportState.name.trim() || !supportState.email.trim() || !supportState.message.trim()) {
      showToast(isArabic ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.sendSupportMessage(supportState);
      setSubmittedTicket(res || { id: "TKT-" + Date.now(), status: "open" });
      showToast(isArabic ? "تم إرسال طلبك بنجاح وسيتواصل معك فريق الدعم" : "Ticket submitted successfully", "success");
    } catch (err) {
      showToast(isArabic ? "حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً أو مراسلتنا عبر واتساب" : "Failed to send ticket, please try WhatsApp", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (type === "support") {
    return (
      <AuthLayout compact>
        <div className="auth-panel-card support-desk-pro" style={{ textAlign: isArabic ? "right" : "left" }}>
          <header style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(22, 69, 143, 0.12)", color: "var(--primary, #16458F)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
              <Headphones size={28} />
            </div>
            <h1 style={{ fontSize: "22px", margin: "0 0 6px" }}>
              {isArabic ? "مركز الدعم والمساعدة | منصة AIN" : "Support & Help Center | AIN"}
            </h1>
            <p style={{ color: "var(--text-muted, #888)", fontSize: "14px", margin: 0 }}>
              {isArabic
                ? "فريق الدعم الفني جاهز لمساعدتك في استفسارات الحساب، تفعيل الاشتراكات، أو مشاكل الأجهزة."
                : "Our technical team is ready to assist with account questions, subscriptions, or device reset requests."}
            </p>
          </header>

          {/* Quick WhatsApp Action Banner */}
          <div style={{ padding: "14px 18px", background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.3)", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <strong style={{ fontSize: "14px", display: "block", color: "#128C7E" }}>
                {isArabic ? "للمساعدة العاجلة والمباشرة عبر واتساب" : "Need immediate assistance via WhatsApp?"}
              </strong>
              <small style={{ color: "var(--text-muted, #666)" }}>
                {isArabic ? "تواصل مباشرة مع فريق خدمة العملاء (24/7)" : "Direct line to our support & sales team"}
              </small>
            </div>
            <Button
              as="a"
              href="https://wa.me/201025849793?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85%D9%86%D8%B5%D8%A9%20%D8%B9%D9%8A%D9%86%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D8%A8%D8%AE%D8%B5%D9%88%D8%B5%20%D8%AD%D8%B3%D8%A7%D8%A8%D9%8A"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#25D366", borderColor: "#25D366", color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <MessageCircle size={16} />
              {isArabic ? "محادثة واتساب سريعة" : "Chat on WhatsApp"}
            </Button>
          </div>

          {/* Ticket Submission Form */}
          {submittedTicket ? (
            <div style={{ padding: "24px", background: "var(--panel-soft, rgba(255,255,255,0.03))", border: "1px solid var(--border)", borderRadius: "8px", textAlign: "center" }}>
              <CheckCircle2 size={46} style={{ color: "var(--success, #10b981)", margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: "18px", margin: "0 0 8px" }}>
                {isArabic ? "تم استلام طلبك بنجاح!" : "Ticket Received Successfully!"}
              </h2>
              <p style={{ color: "var(--text-muted, #888)", fontSize: "14px", marginBottom: "16px" }}>
                {isArabic
                  ? `رقم التذكرة: ${submittedTicket.ticketId || submittedTicket.id || "REQ-101"}. سيقوم أحد مسؤولي الدعم بمراجعة طلبك والرد على بريدك الإلكتروني قريباً.`
                  : `Ticket reference: ${submittedTicket.ticketId || submittedTicket.id || "REQ-101"}. Our team will review and reply via email shortly.`}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Button onClick={() => { setSubmittedTicket(null); setSupportState({ name: "", email: "", subject: "", message: "", priority: "normal" }); }}>
                  {isArabic ? "إرسال تذكرة أخرى" : "Submit Another Ticket"}
                </Button>
                <Button as={Link} to="/login" variant="ghost">
                  {isArabic ? "تسجيل الدخول" : "Sign In"}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitSupport} style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label={isArabic ? "الاسم الكامل *" : "Full Name *"} htmlFor="sup-name">
                  <input
                    id="sup-name"
                    required
                    value={supportState.name}
                    onChange={(e) => setSupportState({ ...supportState, name: e.target.value })}
                    placeholder={isArabic ? "اكتب اسمك" : "Enter your name"}
                  />
                </FormField>
                <FormField label={isArabic ? "البريد الإلكتروني *" : "Email Address *"} htmlFor="sup-email">
                  <input
                    id="sup-email"
                    type="email"
                    required
                    value={supportState.email}
                    onChange={(e) => setSupportState({ ...supportState, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </FormField>
              </div>

              <FormField label={isArabic ? "نوع الطلب / الموضوع *" : "Subject / Inquiry Type *"} htmlFor="sup-subject">
                <select
                  id="sup-subject"
                  value={supportState.subject}
                  onChange={(e) => setSupportState({ ...supportState, subject: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "6px", color: "inherit" }}
                >
                  <option value={isArabic ? "استفسار عن كورس أو حجز دفعة" : "Inquiry about Course or Booking"}>
                    {isArabic ? "استفسار عن كورس أو حجز دفعة" : "Inquiry about Course or Booking"}
                  </option>
                  <option value={isArabic ? "مشكلة في تشغيل الفيديو أو العلامة المائية" : "Video Playback or Watermark Issue"}>
                    {isArabic ? "مشكلة في تشغيل الفيديو أو العلامة المائية" : "Video Playback or Watermark Issue"}
                  </option>
                  <option value={isArabic ? "طلب إعادة تعيين جهاز (Device Reset)" : "Device Reset Request"}>
                    {isArabic ? "طلب إعادة تعيين جهاز (Device Reset)" : "Device Reset Request"}
                  </option>
                  <option value={isArabic ? "استفسار عن تفعيل حساب أكاديمية أو مدرس" : "Academy or Instructor Account Activation"}>
                    {isArabic ? "استفسار عن تفعيل حساب أكاديمية أو مدرس" : "Academy or Instructor Account Activation"}
                  </option>
                  <option value={isArabic ? "أمر آخر" : "Other"}>
                    {isArabic ? "أمر آخر" : "Other"}
                  </option>
                </select>
              </FormField>

              <FormField label={isArabic ? "تفاصيل الرسالة أو المشكلة *" : "Message Details *"} htmlFor="sup-msg">
                <textarea
                  id="sup-msg"
                  required
                  rows={4}
                  value={supportState.message}
                  onChange={(e) => setSupportState({ ...supportState, message: e.target.value })}
                  placeholder={isArabic ? "اشرح بالتفصيل كيف يمكننا مساعدتك (رقم الهاتف، اسم الأكاديمية أو الكورس إن وجد)..." : "Explain how we can help you..."}
                  style={{ width: "100%", padding: "10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "6px", color: "inherit", resize: "vertical" }}
                />
              </FormField>

              <Button type="submit" disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
                <Send size={16} />
                {submitting ? (isArabic ? "جاري الإرسال..." : "Sending...") : (isArabic ? "إرسال تذكرة الدعم" : "Submit Support Ticket")}
              </Button>
            </form>
          )}

          {/* Quick FAQ accordion */}
          <section style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <HelpCircle size={16} style={{ color: "var(--primary, #16458F)" }} />
              {isArabic ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h3>
            <div style={{ display: "grid", gap: "10px", fontSize: "13px" }}>
              <div style={{ padding: "10px 14px", background: "var(--panel-soft, rgba(255,255,255,0.02))", border: "1px solid var(--border)", borderRadius: "6px" }}>
                <strong>{isArabic ? "كيف يتم فتح مساحة الكورس بعد الحجز؟" : "When is my course space unlocked?"}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted, #777)" }}>
                  {isArabic
                    ? "بمجرد تأكيد الأكاديمية أو المدرس لطلب حجزك، يظهر الكورس فوراً في صفحة (كورساتي) ويمكنك حضور الجلسات وتصفح المحتوى."
                    : "Once the academy confirms your reservation, the course appears in 'My Courses' with full access."}
                </p>
              </div>
              <div style={{ padding: "10px 14px", background: "var(--panel-soft, rgba(255,255,255,0.02))", border: "1px solid var(--border)", borderRadius: "6px" }}>
                <strong>{isArabic ? "كم عدد الأجهزة المسموح بها لكل طالب؟" : "What is the allowed device limit?"}</strong>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted, #777)" }}>
                  {isArabic
                    ? "تلتزم منصة عين بسياسة جهاز واحد متزامن لكل حساب مع علامة مائية ذكية لحماية حقوق المدرسين والأكاديميات ومنع مشاركة الحسابات."
                    : "AIN Platform enforces single concurrent device access with dynamic watermarking to protect instructor content."}
                </p>
              </div>
            </div>
          </section>

          <footer style={{ marginTop: "20px", textAlign: "center" }}>
            <Link to="/login" style={{ fontSize: "13px", color: "var(--primary, #16458F)" }}>
              {isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}
            </Link>
          </footer>
        </div>
      </AuthLayout>
    );
  }

  const termsContent = isArabic ? {
    title: "شروط استخدام منصة AIN التعليمية",
    subtitle: "آخر تحديث: 2026",
    sections: [
      {
        head: "1. الاستخدام العادل وصلاحيات مساحة العمل",
        body: "باستخدام منصة عين (AIN Platform)، يوافق المستخدم على الالتزام بسياسات الحساب والأدوار الممنوحة له سواء كطالب، ولي أمر، مدرس، أو مدير أكاديمية، وعدم محاولة استغلال النظام أو تجاوز قيود الوصول المحددة."
      },
      {
        head: "2. حماية المحتوى والعلامة المائية الذكية",
        body: "جميع الفيديوهات والملفات والمحاضرات المنشورة على منصة عين هي ملكية فكرية للأكاديميات والمحاضرين. يحظر تماماً تصوير الشاشة أو تسجيل المحاضرات أو إعادة نشرها بأي شكل. تعمل العلامة المائية الذكية على إظهار بيانات المستخدم المشاهد لحماية الحقوق قانونياً."
      },
      {
        head: "3. سياسة الأجهزة المتزامنة ومنع مشاركة الحساب",
        body: "يقتصر استخدام الحساب على مالكه الفعلي وعلى الأجهزة المعتمدة في النظام. يحظر مشاركة بيانات المرور. وعند تغيير جهاز الطالب، يلزم إرسال طلب إعادة تعيين جهاز لمراجعة مسؤولي المنصة."
      },
      {
        head: "4. الحجوزات والمدفوعات",
        body: "حجز الدفعات عبر المنصة يخضع لسياسات القبول والتأكيد المحددة من كل أكاديمية أو مدرس. تتم التسويات وفق الشروط المعتمدة لكل دورة تدريبية."
      }
    ]
  } : {
    title: "AIN Platform Terms of Service",
    subtitle: "Last updated: 2026",
    sections: [
      {
        head: "1. Fair Use & Access Rights",
        body: "By accessing AIN Platform, users agree to respect role permissions and adhere to institutional standards without attempting to bypass security boundaries."
      },
      {
        head: "2. Intellectual Property & Dynamic Watermarking",
        body: "Course content, videos, and materials remain the protected intellectual property of their instructors and academies. Dynamic watermarks display viewing student credentials to prevent unauthorized redistribution."
      },
      {
        head: "3. Device Concurrency & Account Sharing Policy",
        body: "Accounts are licensed for individual personal use. Device resets must be submitted and authorized through the platform support desk."
      },
      {
        head: "4. Bookings & Academy Confirmations",
        body: "Batch enrollments are finalized upon academy approval following verified capacity limits."
      }
    ]
  };

  const privacyContent = isArabic ? {
    title: "سياسة الخصوصية وحماية البيانات الشخصية | منصة AIN",
    subtitle: "إطار الخصوصية المصمم لمواءمة قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 والممارسات التعليمية الرشيدة",
    effectiveDate: "تاريخ السريان: 1 سبتمبر 2026 | آخر تحديث: 28 سبتمبر 2026",
    entity: "الجهة المسؤولة: الجهة المشغلة المحددة في عقد الخدمة الخاص بالأكاديمية",
    dpoEmail: "privacy@ainplatform.com",
    sections: [
      {
        head: "1. الكيان القانوني وبيانات التواصل الرسمية",
        body: "تُشغّل منصة AIN الجهة القانونية المحددة في عقد الخدمة المبرم مع الأكاديمية. للاستفسارات أو طلبات الوصول والتصحيح والتصدير والحذف، يمكن التواصل عبر privacy@ainplatform.com أو مركز الدعم داخل المنصة. يجب استكمال بيانات السجل التجاري وعنوان المراسلات في عقد كل بيئة إنتاج قبل استقبال مستخدمين فعليين."
      },
      {
        head: "2. البيانات المجمعة وجداول فترات الاحتفاظ المحددة",
        body: "تطبق المنصة مبدأ الحد الأدنى من البيانات: (أ) بيانات الحساب تُحفظ أثناء نشاطه مع مهلة إلغاء مدتها 30 يوماً بعد طلب الحذف. (ب) السجلات المالية والأكاديمية تُحتفظ وفق عقد الأكاديمية والالتزامات القانونية السارية، وتُجهّل بياناتها الشخصية عند تنفيذ الحذف متى سمح الغرض القانوني بذلك. (ج) سجلات الوصول والجلسات والأجهزة المنتهية تُنظف افتراضياً بعد 90 يوماً، وتُنظف رموز التحقق وإعادة التعيين المنتهية بعد 30 يوماً. يمكن تعديل هذه المدد في إعدادات بيئة التشغيل وفق العقد والمتطلبات القانونية."
      },
      {
        head: "3. سياسة موافقة ولي الأمر وحماية القُصّر (دون سن 18 عاماً)",
        body: "تتحمل الأكاديمية مسؤولية التحقق من العمر والحصول على موافقة ولي الأمر المطلوبة قبل إنشاء أو تفعيل حساب القاصر. توفر المنصة آلية Guardian Link لربط ولي أمر موثّق بحساب الطالب ومتابعة الحضور والنتائج. لا تُعد الآلية الحالية بديلاً عن نموذج موافقة موثق، ويجب على الأكاديمية حفظ دليل الموافقة وفق إجراءاتها القانونية."
      },
      {
        head: "4. معالجو البيانات الخارجيون ونطاق تشغيلهم",
        body: "قد تستخدم بيئة الإنتاج مزودي دفع مثل Paymob ومزودي تخزين كـ S3 أو Cloudflare R2 وخدمات بريد وإشعارات، بحسب إعداد النشر الفعلي. تُرسل لهم البيانات اللازمة فقط لتنفيذ الخدمة وفق عقودهم وسياساتهم، ولا تخزن المنصة أرقام البطاقات كاملة. لا تُباع البيانات الشخصية لشبكات الإعلانات."
      },
      {
        head: "5. أمان النقل، التشفير، وإدارة الجلسات",
        body: "تستخدم بيئة الإنتاج HTTPS/TLS لحماية البيانات أثناء النقل، مع تجزئة كلمات المرور وإدارة توكنز المصادقة والجلسات. تعتمد نسخة TLS الفعلية على إعداد بوابة النشر والاستضافة ويجب التحقق منها قبل الإطلاق. تُستخدم ملفات الارتباط الفنية وبيانات الجلسة للمصادقة والأمان، لا للاستهداف الإعلاني."
      },
      {
        head: "6. حقوق المستخدمين في التصدير والحذف وآلية تنفيذ الإلغاء",
        body: "يستطيع المستخدم تصدير نسخة JSON من فئات البيانات المتاحة آلياً عبر واجهة الخصوصية، وطلب استكمال أي بيانات أخرى عبر الدعم. ويمكنه تقديم طلب حذف يُنفذ بعد مهلة تراجع مدتها 30 يوماً؛ عند التنفيذ تُلغى الجلسات والتوكنز وتُمسح روابط الأجهزة وتُحذف الملفات الشخصية غير المستخدمة وتُجهّل البيانات الواجب الاحتفاظ بسجلاتها."
      },
      {
        head: "7. آلية الشكاوى وحل النزاعات والإشعار القانوني",
        body: "تُرسل شكاوى الخصوصية إلى privacy@ainplatform.com أو مركز الدعم، وتُعالج وفق المدد والالتزامات القانونية المطبقة على الجهة المشغلة. ويمكن تصعيد الشكاوى غير المحلولة إلى الجهة التنظيمية المختصة. يجب اعتماد هذه السياسة من مستشار قانوني محلي قبل الإطلاق التجاري؛ فهي لا تمثل بذاتها شهادة امتثال قانوني."
      }
    ]
  } : {
    title: "AIN Platform Privacy & Data Protection Policy",
    subtitle: "A privacy framework designed to align with Egyptian Data Protection Law No. 151/2020 and sound EdTech practices",
    effectiveDate: "Effective Date: September 1, 2026 | Last Updated: September 28, 2026",
    entity: "Data Controller: the operating entity identified in the academy service agreement",
    dpoEmail: "privacy@ainplatform.com",
    sections: [
      {
        head: "1. Legal Operating Entity & Official Contact",
        body: "AIN is operated by the legal entity identified in the academy's service agreement. For access, correction, export, or deletion requests, contact privacy@ainplatform.com or the in-platform support desk. Commercial registration details and a service address must be completed in each production agreement before onboarding real users."
      },
      {
        head: "2. Collected Data & Explicit Retention Schedules",
        body: "The platform applies data minimization: (a) Account data is retained while active and during the 30-day cancellation window after a deletion request. (b) Financial and academic records follow the academy agreement and applicable legal obligations, with personal fields anonymized on deletion where the lawful purpose permits. (c) Expired access logs, sessions, and device records are purged after 90 days by default; expired verification and reset records are purged after 30 days. Deployments may configure these periods to match contracts and law."
      },
      {
        head: "3. Minor Protection & Parental Consent Policy (<18 Years)",
        body: "The academy is responsible for verifying age and obtaining any required guardian consent before provisioning or activating a minor's account. Guardian Link can associate a verified guardian with a student for attendance and academic oversight. It is not currently a substitute for a documented consent record, which the academy must retain under its legal process."
      },
      {
        head: "4. Third-Party Service Processors Scope",
        body: "A production deployment may use payment providers such as Paymob, object storage such as S3 or Cloudflare R2, and email or notification services, depending on its actual configuration. Only service-required data is sent under the provider's terms, and AIN does not store full card numbers. Personal data is not sold to advertising networks."
      },
      {
        head: "5. In-Transit Encryption & Session Tokens",
        body: "Production deployments use HTTPS/TLS for data in transit, password hashing, and managed authentication and session tokens. The negotiated TLS version depends on the deployed gateway and hosting configuration and must be verified before launch. Technical cookies and session data support authentication and security, not behavioral advertising."
      },
      {
        head: "6. User Rights, Machine-Readable Export & Deletion Execution",
        body: "Users can export a JSON archive of the data categories available through the automated privacy endpoint and request any additional records through support. A deletion request has a 30-day cancellation window; after it expires, sessions and tokens are revoked, device bindings and unused personal files are removed, and records that must be retained are anonymized."
      },
      {
        head: "7. Complaints Mechanism, Dispute Resolution & Legal Notice",
        body: "Privacy concerns may be filed at privacy@ainplatform.com or through the support desk and will be handled under the response duties applicable to the operating entity. Unresolved concerns may be escalated to the competent regulator. Local legal counsel must approve this policy before commercial launch; this page is not, by itself, a certification of legal compliance."
      }
    ]
  };

  const legal = type === "privacy" ? privacyContent : termsContent;

  return (
    <AuthLayout compact>
      <div className="auth-panel-card legal-page-pro" style={{ textAlign: isArabic ? "right" : "left", padding: "28px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(22, 69, 143, 0.12)", color: "var(--primary, #16458F)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
          <ShieldCheck size={28} />
        </div>
        <h1 style={{ fontSize: "22px", textAlign: "center", margin: "0 0 4px" }}>{legal.title}</h1>
        <p style={{ textAlign: "center", color: "var(--text-muted, #888)", fontSize: "13px", margin: "0 0 14px" }}>{legal.subtitle}</p>

        {legal.effectiveDate && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "20px", fontSize: "12px" }}>
            <span style={{ padding: "4px 10px", borderRadius: "16px", background: "var(--panel-soft, rgba(0,0,0,0.04))", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              {legal.effectiveDate}
            </span>
            <span style={{ padding: "4px 10px", borderRadius: "16px", background: "rgba(14, 165, 233, 0.1)", border: "1px solid rgba(14, 165, 233, 0.2)", color: "#0284c7" }}>
              {legal.entity}
            </span>
            <span style={{ padding: "4px 10px", borderRadius: "16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#059669" }}>
              DPO: {legal.dpoEmail}
            </span>
          </div>
        )}

        <div style={{ display: "grid", gap: "16px", marginBottom: "24px" }}>
          {legal.sections.map((sec, idx) => (
            <article key={idx} style={{ padding: "14px 16px", background: "var(--panel-soft, rgba(255,255,255,0.02))", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <h2 style={{ fontSize: "15px", margin: "0 0 6px", color: "var(--text, #333)" }}>{sec.head}</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted, #666)", lineHeight: "1.7" }}>{sec.body}</p>
            </article>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button as={Link} to="/login">
            {isArabic ? "العودة لتسجيل الدخول" : "Back to sign in"}
          </Button>
          <Button as={Link} to="/support" variant="ghost">
            {isArabic ? "مركز المساعدة والدعم" : "Help & Support"}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

