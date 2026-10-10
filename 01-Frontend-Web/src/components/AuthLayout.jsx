import { Activity, BookOpenCheck, CheckCircle2, Globe2, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export function AuthLayout({ children, compact = false }) {
  const { direction, language, setLanguage, t } = useLanguage();

  return (
    <main className={`auth-shell auth-${language}`} dir={direction}>
      <header className="auth-topbar">
        <a className="auth-logo" href="/" aria-label={t.common.appName}>
          <img src="/images/ain-logo.png" alt="" />
          <strong>{t.common.appName}</strong>
        </a>
        <button
          type="button"
          className="auth-language"
          onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
          aria-label={t.common.language}
        >
          <Globe2 size={18} />
          {language === "ar" ? "English" : "العربية"}
        </button>
      </header>

      <div className={`auth-stage ${compact ? "compact" : ""}`}>
        <aside className="auth-showcase" aria-label={t.auth.secureAccess}>
          <div className="auth-showcase-content">
            <span className="auth-eyebrow"><Sparkles size={16} /> {language === "ar" ? "منصة تشغيل متكاملة" : "One connected platform"}</span>
            <h2>{t.auth.secureAccess}</h2>
            <p>{t.auth.secureDescription}</p>
            <div className="auth-trust-list">
              <span><CheckCircle2 size={18} /> {language === "ar" ? "إدارة واضحة لكل دور وصلاحية" : "Clear access for every role"}</span>
              <span><CheckCircle2 size={18} /> {language === "ar" ? "حضور ومدفوعات وتقارير مترابطة" : "Connected attendance, payments, and reports"}</span>
              <span><CheckCircle2 size={18} /> {language === "ar" ? "جلسات محمية على كل الأجهزة" : "Protected sessions across devices"}</span>
            </div>

            <div className="auth-product-card" aria-hidden="true">
              <div className="auth-product-head">
                <span><span className="auth-live-dot" /> {language === "ar" ? "نظرة مباشرة" : "Live overview"}</span>
                <strong>AIN Workspace</strong>
              </div>
              <div className="auth-product-metrics">
                <div><UsersRound size={17} /><span>{language === "ar" ? "الطلاب" : "Students"}</span><strong>482</strong></div>
                <div><BookOpenCheck size={17} /><span>{language === "ar" ? "الحضور" : "Attendance"}</span><strong>94%</strong></div>
                <div><Activity size={17} /><span>{language === "ar" ? "جلسات نشطة" : "Live sessions"}</span><strong>12</strong></div>
              </div>
              <div className="auth-product-activity">
                <span className="auth-activity-icon"><ShieldCheck size={17} /></span>
                <div>
                  <strong>{language === "ar" ? "الجلسات تعمل بصورة طبيعية" : "Sessions are running normally"}</strong>
                  <small>{language === "ar" ? "آخر تحديث الآن" : "Updated just now"}</small>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-security-chip"><ShieldCheck size={19} /><span>{language === "ar" ? "وصول آمن ومراقب" : "Secure, monitored access"}</span></div>
        </aside>

        <section className="auth-panel">{children}</section>
      </div>

      <footer className="auth-footer">
        <span>© 2026 AIN Platform. {t.shell.footerRights}</span>
        <nav aria-label="Legal">
          <a href="/privacy">{t.shell.privacy}</a>
          <a href="/terms">{t.shell.terms}</a>
          <a href="/support">{t.shell.support}</a>
        </nav>
      </footer>
    </main>
  );
}

export function AuthHeader({ icon, title, subtitle }) {
  return (
    <div className="auth-panel-head">
      <span className="auth-panel-icon">{icon}</span>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

export function AuthProgress({ current, total, label }) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 1), safeTotal);
  const percentage = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className="auth-progress" aria-label={label}>
      <div className="auth-progress-copy">
        <span>{label}</span>
        <strong dir="ltr">{safeCurrent}/{safeTotal}</strong>
      </div>
      <div className="auth-progress-track" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export function AuthStatus({ message, tone = "danger" }) {
  if (!message) return null;

  return (
    <div className={`auth-status ${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <ShieldCheck size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
