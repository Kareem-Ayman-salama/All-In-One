import { ArrowRight, Building2, GraduationCap, KeyRound, LogIn, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthHeader, AuthLayout, AuthStatus } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { PasswordInput } from "../components/PasswordInput";
import { OtpInput } from "../components/OtpInput";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { getAuthErrorMessage } from "../services/authErrors";

const demoAccounts = [
  {
    role: "super-admin",
    email: "super@ain.test",
    icon: ShieldCheck,
    color: "#6366F1",
    badgeBg: "rgba(99, 102, 241, 0.12)",
    titleAr: "مدير المنصة العام",
    titleEn: "Super Admin",
    descAr: "إدارة النظام، مراجعة واعتماد الأكاديميات، الكورسات والاشتراكات",
    descEn: "System management, academy approval, courses and platform subscriptions"
  },
  {
    role: "tenant-admin",
    email: "admin@techcorp.test",
    icon: Building2,
    color: "#0EA5E9",
    badgeBg: "rgba(14, 165, 233, 0.12)",
    titleAr: "مدير الأكاديمية / المركز",
    titleEn: "Academy Admin",
    descAr: "إدارة الكورسات، جلسات الفيديو بالعلامة المائية، المجموعات، وتسجيل الحضور",
    descEn: "Manage courses, watermarked video sessions, cohorts, and attendance tracking"
  },
  {
    role: "end-user",
    email: "employee@techcorp.test",
    icon: UserRound,
    color: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    titleAr: "معلم / موظف الأكاديمية",
    titleEn: "Instructor / Staff",
    descAr: "متابعة الفصول الدراسية، الحضور، المهام، والمحاضرات",
    descEn: "Track classrooms, student attendance, quizzes, and live lectures"
  },
  {
    role: "student",
    email: "student@ain.test",
    icon: GraduationCap,
    color: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    titleAr: "طالب مسجل",
    titleEn: "Enrolled Student",
    descAr: "مشاهدة الكورسات وجلسات الفيديو بعلامة مائية، الحضور بالـ QR، والشهادات",
    descEn: "Watch watermarked course sessions, scan QR attendance, and download certificates"
  }
];
const showDemoAccounts = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";

export function LoginPage() {
  const { user, login } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedDestination = searchParams.get("next") || location.state?.from;
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const errors = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "" : t.validation.email,
    password: form.password.length >= 8 ? "" : t.validation.password
  };
  const isValid = !errors.email && !errors.password && (!mfaRequired || /^\d{6}$/.test(mfaCode));

  useEffect(() => {
    const selected = showDemoAccounts
      ? demoAccounts.find((account) => account.role === searchParams.get("role"))
      : null;
    if (selected) setForm({ email: selected.email, password: "12345678", remember: true });
  }, [searchParams]);

  if (user) return <Navigate to={getSafeDestination(requestedDestination, user)} replace />;

  const submit = async (event) => {
    if (event) event.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setStatusMessage("");
    setLoading(true);
    try {
      const nextUser = await login({ ...form, ...(mfaRequired ? { mfaCode } : {}) });
      if (nextUser?.mfaRequired) {
        setMfaRequired(true);
        setMfaCode("");
        showToast(language === "ar" ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني" : "A verification code was sent to your email");
        return;
      }
      showToast(t.auth.loginSuccess);
      navigate(getSafeDestination(requestedDestination, nextUser), { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const chooseDemo = (account) => {
    setForm({ email: account.email, password: "12345678", remember: true });
    setTouched({});
    setStatusMessage("");
  };

  const quickSignIn = async (account) => {
    setForm({ email: account.email, password: "12345678", remember: true });
    setTouched({});
    setStatusMessage("");
    setActiveQuickRole(account.role);
    setLoading(true);
    try {
      const nextUser = await login({ email: account.email, password: "12345678", remember: true });
      if (nextUser?.mfaRequired) {
        setMfaRequired(true);
        setMfaCode("");
        showToast(language === "ar" ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني" : "A verification code was sent to your email");
        return;
      }
      showToast(language === "ar" ? `تم تسجيل الدخول بنجاح كـ ${account.titleAr}` : `Signed in as ${account.titleEn}`);
      navigate(getSafeDestination(requestedDestination, nextUser), { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setStatusMessage(message);
    } finally {
      setLoading(false);
      setActiveQuickRole(null);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-panel-card">
        <AuthHeader icon={<LogIn size={23} />} title={t.auth.signIn} subtitle={t.auth.signInSubtitle} />
        <form className="auth-form" onSubmit={submit} noValidate>
          <FormField label={t.common.email} error={touched.email ? errors.email : ""}>
            <div className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                onChange={(event) => {
                  setStatusMessage("");
                  setForm((current) => ({ ...current, email: event.target.value }));
                }}
                placeholder="name@company.com"
                aria-invalid={Boolean(touched.email && errors.email)}
                disabled={mfaRequired}
              />
            </div>
          </FormField>
          <FormField label={t.common.password} error={touched.password ? errors.password : ""}>
            <PasswordInput
              value={form.password}
              onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              onChange={(event) => {
                setStatusMessage("");
                setForm((current) => ({ ...current, password: event.target.value }));
              }}
              placeholder="••••••••"
              aria-invalid={Boolean(touched.password && errors.password)}
              disabled={mfaRequired}
            />
          </FormField>

          {mfaRequired && (
            <FormField label={language === "ar" ? "رمز تحقق المدير" : "Administrator verification code"}>
              <div className="auth-mfa-block">
                <KeyRound size={20} aria-hidden="true" />
                <OtpInput
                  value={mfaCode}
                  onChange={setMfaCode}
                  label={language === "ar" ? "رمز التحقق" : "Verification code"}
                />
              </div>
            </FormField>
          )}

          <AuthStatus message={statusMessage} />

          <div className="auth-form-row">
            <label className="auth-check">
              <input type="checkbox" checked={form.remember} onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))} />
              <span>{t.auth.remember}</span>
            </label>
            <Link to="/forgot-password">{t.auth.forgot}</Link>
          </div>

          <Button
            className="auth-submit"
            type="submit"
            loading={loading}
            loadingLabel={t.auth.signingIn}
            disabled={mfaRequired && mfaCode.length !== 6}
          >
            {mfaRequired ? (language === "ar" ? "تأكيد الدخول" : "Verify and sign in") : t.auth.signIn}
            <ArrowRight className={language === "ar" ? "icon-flip" : ""} size={18} />
          </Button>

          <div className="auth-switch"><span>{t.auth.noAccount}</span><Link to="/create-account">{t.auth.createAccount}</Link></div>
        </form>

        {showDemoAccounts && <div className="demo-access">
          <button type="button" className="demo-access-toggle" onClick={() => setDemoOpen((current) => !current)} aria-expanded={demoOpen}>
            <span><ShieldCheck size={18} color="var(--auth-primary)" /> {language === "ar" ? "تجربة المنصة بحساب جاهز" : "Explore with a demo account"}</span>
            <small>{demoOpen ? "−" : "+"}</small>
          </button>
          {demoOpen && (
            <div className="demo-access-content">
              <p className="demo-hint-box">
                {language === "ar"
                  ? "اختر الدور المناسب لمعاينة تجربته داخل المنصة."
                  : "Choose a role to preview its experience inside the platform."}
              </p>
              <div className="demo-account-grid">
                {demoAccounts.map((account) => {
                  const Icon = account.icon;
                  const isSelected = form.email === account.email;
                  const isBusy = loading && activeQuickRole === account.role;
                  return (
                    <div
                      key={account.role}
                      className={`demo-account-card ${isSelected ? "selected" : ""}`}
                    >
                      <button
                        type="button"
                        className="demo-account-select-btn"
                        onClick={() => chooseDemo(account)}
                        aria-label={language === "ar" ? `اختيار بيانات ${account.titleAr}` : `Select ${account.titleEn}`}
                      >
                        <div className="demo-account-icon" style={{ color: account.color, backgroundColor: account.badgeBg }}>
                          <Icon size={20} />
                        </div>
                        <div className="demo-account-info">
                          <div className="demo-account-title-row">
                            <strong>{language === "ar" ? account.titleAr : account.titleEn}</strong>
                            <span className="demo-email-badge" dir="ltr">{account.email}</span>
                          </div>
                          <p className="demo-account-desc">{language === "ar" ? account.descAr : (account.descEn || account.titleEn)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="demo-quick-btn"
                        onClick={() => quickSignIn(account)}
                        disabled={loading}
                        title={language === "ar" ? "دخول مباشر بهذا الحساب" : "Direct sign in"}
                        aria-label={language === "ar" ? `دخول فوري بحساب ${account.titleAr}` : `Instant sign in as ${account.titleEn}`}
                      >
                        {isBusy ? (
                          <span className="demo-spin">⏳</span>
                        ) : (
                          <>
                            <span>{language === "ar" ? "دخول فوري" : "Instant"}</span>
                            <ArrowRight size={14} className={language === "ar" ? "icon-flip" : ""} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>}
      </div>
    </AuthLayout>
  );
}

export function getRoleHome(role) {
  if (role === "super-admin") return "/super-admin/dashboard";
  if (role === "end-user") return "/end-user/home";
  return "/workspaces?auto=1";
}

function getSafeDestination(requestedPath, user) {
  if (requestedPath?.startsWith("/invite/")) return requestedPath;
  if (requestedPath?.startsWith("/register-company")) return requestedPath;
  if (user.role === "end-user" && user.tenantId === null) return "/no-workspace";
  const rolePrefix = `/${user.role}`;
  return requestedPath?.startsWith(rolePrefix) ? requestedPath : getRoleHome(user.role);
}
