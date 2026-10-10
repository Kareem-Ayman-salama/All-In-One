import { ArrowLeft, KeyRound, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AuthHeader, AuthLayout, AuthProgress, AuthStatus } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { OtpInput } from "../components/OtpInput";
import { PasswordInput, PasswordStrength } from "../components/PasswordInput";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { getAuthErrorMessage } from "../services/authErrors";
import { getRoleHome } from "./LoginPage";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/;
const showDemoCodes = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === "true";

export function CreateAccountPage() {
  const { user, createPersonalAccount } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeRegistrationDestination(searchParams.get("next"));
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", terms: false });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const errors = {
    name: form.name.trim().length >= 2 ? "" : t.validation.name,
    email: emailPattern.test(form.email) ? "" : t.validation.email,
    password: strongPasswordPattern.test(form.password) ? "" : t.validation.password,
    confirm: form.confirm && form.confirm === form.password ? "" : t.validation.passwordMatch,
    terms: form.terms ? "" : t.validation.terms
  };
  const isValid = Object.values(errors).every((error) => !error);

  if (user) return <Navigate to={user.tenantId ? getRoleHome(user.role) : "/no-workspace"} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true, terms: true });
    if (!isValid) return;
    setStatusMessage("");
    setLoading(true);
    try {
      await createPersonalAccount(form);
      showToast(t.auth.accountCreated);
      const verifyParams = new URLSearchParams({ email: form.email.trim().toLowerCase() });
      if (next) verifyParams.set("next", next);
      navigate(`/verify-email?${verifyParams.toString()}`, { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-panel-card">
        <AuthProgress current={1} total={2} label={t.common.language === "اللغة" ? "إنشاء الحساب" : "Account setup"} />
        <AuthHeader icon={<UserPlus size={23} />} title={t.auth.createTitle} subtitle={t.auth.createSubtitle} />
        <form className="auth-form auth-form-two" onSubmit={submit} noValidate>
          <FormField label={t.auth.fullName} error={touched.name ? errors.name : ""}>
            <input className="auth-plain-input" autoComplete="name" value={form.name} onBlur={() => setTouched((current) => ({ ...current, name: true }))} onChange={(event) => { setStatusMessage(""); setForm((current) => ({ ...current, name: event.target.value })); }} />
          </FormField>
          <FormField label={t.common.email} error={touched.email ? errors.email : ""}>
            <input className="auth-plain-input" type="email" autoComplete="email" value={form.email} onBlur={() => { setTouched((current) => ({ ...current, email: true })); setForm((current) => ({ ...current, email: current.email.trim().toLowerCase() })); }} onChange={(event) => { setStatusMessage(""); setForm((current) => ({ ...current, email: event.target.value })); }} placeholder="name@company.com" />
          </FormField>
          <FormField label={t.common.password} error={touched.password ? errors.password : ""}>
            <PasswordInput value={form.password} autoComplete="new-password" onBlur={() => setTouched((current) => ({ ...current, password: true }))} onChange={(event) => { setStatusMessage(""); setForm((current) => ({ ...current, password: event.target.value })); }} />
            <PasswordStrength password={form.password} />
          </FormField>
          <FormField label={t.auth.confirmPassword} error={touched.confirm ? errors.confirm : ""}>
            <PasswordInput value={form.confirm} autoComplete="new-password" onBlur={() => setTouched((current) => ({ ...current, confirm: true }))} onChange={(event) => { setStatusMessage(""); setForm((current) => ({ ...current, confirm: event.target.value })); }} />
          </FormField>
          <label className={`auth-check auth-terms ${touched.terms && errors.terms ? "has-error" : ""}`}>
            <input type="checkbox" checked={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.checked }))} />
            <span>{t.auth.agreePrefix} <a href="/terms">{t.auth.terms}</a> {languageJoiner(t)} <a href="/privacy">{t.auth.privacy}</a></span>
          </label>
          {touched.terms && errors.terms && <small className="auth-inline-error">{errors.terms}</small>}
          <AuthStatus message={statusMessage} />
          <Button className="auth-submit" type="submit" loading={loading} loadingLabel={t.auth.creating}>{t.auth.createAccount}</Button>
          <div className="auth-switch"><span>{t.auth.haveAccount}</span><Link to="/login">{t.auth.signIn}</Link></div>
        </form>
      </div>
    </AuthLayout>
  );
}

function languageJoiner(t) {
  return t.common.language === "اللغة" ? "و" : "and";
}

export function VerifyEmailPage() {
  const { user, verifyRegistrationOtp, resendRegistrationOtp } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const next = safeRegistrationDestination(searchParams.get("next"));
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setInterval(() => setSeconds((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  if (user) return <Navigate to={user.tenantId ? getRoleHome(user.role) : "/no-workspace"} replace />;
  if (!email) return <Navigate to="/create-account" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) return showToast(t.validation.otp, "danger");
    setStatusMessage("");
    setLoading(true);
    try {
      const nextUser = await verifyRegistrationOtp({ email, otp });
      showToast(t.auth.verified);
      navigate(next || (nextUser.tenantId ? getRoleHome(nextUser.role) : "/no-workspace"), { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setStatusMessage("");
    try {
      await resendRegistrationOtp({ email });
      setSeconds(30);
      showToast(t.auth.codeSent);
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setStatusMessage(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout compact>
      <div className="auth-panel-card">
        <AuthProgress current={2} total={2} label={t.common.language === "اللغة" ? "تأكيد البريد" : "Email verification"} />
        <AuthHeader icon={<ShieldCheck size={23} />} title={t.auth.verifyTitle} subtitle={<>{t.auth.verifySubtitle} <strong dir="ltr">{email}</strong></>} />
        <form className="auth-form" onSubmit={submit}>
          <OtpInput value={otp} onChange={(value) => { setStatusMessage(""); setOtp(value); }} label={t.auth.verifyTitle} />
          {showDemoCodes && <p className="auth-demo-code">{t.auth.demoCode}</p>}
          <AuthStatus message={statusMessage} />
          <Button className="auth-submit" type="submit" loading={loading} loadingLabel={t.auth.verifying} disabled={otp.length !== 6}>{t.auth.verify}</Button>
          <div className="auth-resend">
            {seconds > 0 ? <span>{t.auth.resendIn} <b dir="ltr">00:{String(seconds).padStart(2, "0")}</b></span> : <button type="button" onClick={resend} disabled={resending}>{resending ? t.auth.sending : t.auth.resend}</button>}
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}

function safeRegistrationDestination(value) {
  return value?.startsWith("/register-company") ? value : "";
}

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const error = emailPattern.test(email) ? "" : t.validation.email;

  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (error) return;
    setStatusMessage("");
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      showToast(t.auth.resetCodeSent);
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`, { replace: true });
    } catch (requestError) {
      const message = getAuthErrorMessage(requestError, t);
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout compact>
      <div className="auth-panel-card">
        <AuthHeader icon={<Mail size={23} />} title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle} />
        <form className="auth-form" onSubmit={submit} noValidate>
          <FormField label={t.common.email} error={touched ? error : ""}>
            <div className="auth-input-wrap"><Mail size={18} /><input type="email" autoComplete="email" value={email} onBlur={() => { setTouched(true); setEmail((current) => current.trim().toLowerCase()); }} onChange={(event) => { setStatusMessage(""); setEmail(event.target.value); }} placeholder="name@company.com" /></div>
          </FormField>
          <AuthStatus message={statusMessage} />
          <Button className="auth-submit" type="submit" loading={loading} loadingLabel={t.auth.sending}>{t.auth.sendCode}</Button>
          <Link className="auth-back-link" to="/login"><ArrowLeft size={17} /> {t.auth.backToLogin}</Link>
        </form>
      </div>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [form, setForm] = useState({ otp: "", password: "", confirm: "" });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const errors = useMemo(() => ({
    otp: /^\d{6}$/.test(form.otp) ? "" : t.validation.otp,
    password: strongPasswordPattern.test(form.password) ? "" : t.validation.password,
    confirm: form.confirm && form.confirm === form.password ? "" : t.validation.passwordMatch
  }), [form, t]);
  const isValid = Object.values(errors).every((error) => !error);

  if (!email) return <Navigate to="/forgot-password" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setTouched({ otp: true, password: true, confirm: true });
    if (!isValid) return;
    setStatusMessage("");
    setLoading(true);
    try {
      await resetPassword({ email, otp: form.otp, password: form.password });
      showToast(t.auth.resetSuccess);
      navigate("/login", { replace: true });
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout compact>
      <div className="auth-panel-card">
        <AuthHeader icon={<KeyRound size={23} />} title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle} />
        <form className="auth-form" onSubmit={submit} noValidate>
          <FormField as="div" label={t.auth.resetCode} error={touched.otp ? errors.otp : ""}>
            <OtpInput value={form.otp} onChange={(value) => { setStatusMessage(""); setForm((current) => ({ ...current, otp: value })); }} label={t.auth.resetCode} />
          </FormField>
          <FormField label={t.auth.newPassword} error={touched.password ? errors.password : ""}>
            <PasswordInput value={form.password} autoComplete="new-password" onBlur={() => setTouched((current) => ({ ...current, password: true }))} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            <PasswordStrength password={form.password} />
          </FormField>
          <FormField label={t.auth.confirmPassword} error={touched.confirm ? errors.confirm : ""}>
            <PasswordInput value={form.confirm} autoComplete="new-password" onBlur={() => setTouched((current) => ({ ...current, confirm: true }))} onChange={(event) => setForm((current) => ({ ...current, confirm: event.target.value }))} />
          </FormField>
          {showDemoCodes && <p className="auth-demo-code">{t.auth.demoCode}</p>}
          <AuthStatus message={statusMessage} />
          <Button className="auth-submit" type="submit" loading={loading} loadingLabel={t.common.saving}>{t.auth.reset}</Button>
        </form>
      </div>
    </AuthLayout>
  );
}
