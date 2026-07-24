import { CheckCircle2, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export function AuthLayout({ children, compact = false }) {
  const { direction, language, setLanguage, t } = useLanguage();

  return (
    <main className={`auth-shell auth-${language}`} dir={direction}>
      <header className="auth-topbar">
        <a className="auth-logo" href="/" aria-label={t.common.appName}>
          <img src="/images/aio-logo-64.png" alt="" />
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
            <span className="auth-eyebrow"><Sparkles size={16} /> {t.common.appName}</span>
            <h2>{t.auth.secureAccess}</h2>
            <p>{t.auth.secureDescription}</p>
            <div className="auth-trust-list">
              <span><CheckCircle2 size={18} /> {language === "ar" ? "توجيه تلقائي حسب الصلاحيات" : "Automatic role-based routing"}</span>
              <span><CheckCircle2 size={18} /> {language === "ar" ? "حماية للجلسات والبيانات" : "Protected sessions and data"}</span>
              <span><CheckCircle2 size={18} /> {language === "ar" ? "تجربة موحدة لكل الأجهزة" : "A consistent experience on every device"}</span>
            </div>
          </div>
          <div className="auth-security-chip"><ShieldCheck size={20} /><span>Enterprise security</span></div>
        </aside>

        <section className="auth-panel">{children}</section>
      </div>

      <footer className="auth-footer">
        <span>© 2026 AIO SaaS. {t.shell.footerRights}</span>
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
