import { ArrowLeft, Building2, Check, CloudUpload, KeyRound, LockKeyhole, Mail, Search, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AuthHeader, AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { PasswordInput, PasswordStrength } from "../components/PasswordInput";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { getAuthErrorMessage } from "../services/authErrors";
import { api } from "../services/api";

const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";

const flowCopy = {
  ar: {
    companyTitle: "أنشئ مساحة عمل لشركتك",
    companySubtitle: "ابدأ تجربة مجانية، واضبط هوية الشركة قبل دعوة فريقك.",
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
    companySubtitle: "Start a free trial and set up your company identity before inviting your team.",
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
  const { language, t } = useLanguage();
  const copy = flowCopy[language];
  const navigate = useNavigate();
  const [form, setForm] = useState({ company: "", name: "", email: "", password: "", confirm: "" });
  const valid = form.company.trim().length > 1 && form.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && form.password.length >= 10 && form.password === form.confirm;

  return (
    <AuthLayout>
      <div className="auth-panel-card">
        <AuthHeader icon={<Building2 size={23} />} title={copy.companyTitle} subtitle={copy.companySubtitle} />
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); if (valid) navigate("/company-onboarding"); }}>
          <FormField label={copy.companyName}><input className="auth-plain-input" value={form.company} onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))} required /></FormField>
          <FormField label={copy.yourName}><input className="auth-plain-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required /></FormField>
          <FormField label={t.common.email}><div className="auth-input-wrap"><Mail size={18} /><input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required /></div></FormField>
          <FormField label={t.common.password}><PasswordInput autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /><PasswordStrength password={form.password} /></FormField>
          <FormField label={t.auth.confirmPassword}><PasswordInput autoComplete="new-password" value={form.confirm} onChange={(event) => setForm((current) => ({ ...current, confirm: event.target.value }))} /></FormField>
          <Button className="auth-submit" type="submit" disabled={!valid}>{copy.createCompany}</Button>
        </form>
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
        inviter: { name: "AIO Demo" },
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
        <AuthHeader icon={<UserPlus size={23} />} title={copy.invitation} subtitle={invitation.note || `${invitation.inviter?.name || "AIO"} ${copy.invitation}`} />
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
  const content = {
    privacy: language === "ar"
      ? ["سياسة الخصوصية", "نحمي بيانات الحساب ومساحة العمل، ولا نستخدمها إلا لتقديم الخدمة وتأمينها. عند ربط الباك اند ستوضح هذه الصفحة فترات الاحتفاظ بالبيانات وحقوق المستخدم بالتفصيل."]
      : ["Privacy policy", "We protect account and workspace data and only use it to deliver and secure the service. The production policy will detail retention periods and user rights when the backend is connected."],
    terms: language === "ar"
      ? ["شروط الخدمة", "باستخدام AIO، يوافق المستخدم على الالتزام بصلاحيات مساحة العمل وسياسات حماية المحتوى وعدم محاولة تجاوز قيود الوصول."]
      : ["Terms of service", "By using AIO, users agree to follow workspace permissions, content protection policies, and access restrictions."],
    support: language === "ar"
      ? ["الدعم الفني", "للمساعدة في الحساب أو الدعوات أو الوصول إلى المحتوى، تواصل مع مسؤول مساحة عملك أو فريق دعم AIO."]
      : ["Support", "For help with your account, invitations, or content access, contact your workspace admin or the AIO support team."]
  }[type];

  return (
    <AuthLayout compact>
      <div className="auth-panel-card legal-page-pro">
        <ShieldCheck size={36} />
        <h1>{content[0]}</h1>
        <p>{content[1]}</p>
        <Button as={Link} to="/login">{language === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}</Button>
      </div>
    </AuthLayout>
  );
}
