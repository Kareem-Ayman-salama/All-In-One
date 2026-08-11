import {
  Bell,
  Camera,
  Check,
  KeyRound,
  Languages,
  Laptop,
  LockKeyhole,
  Mail,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { getAuthErrorMessage } from "../services/authErrors";
import { Button } from "./Button";
import { PasswordInput, PasswordStrength } from "./PasswordInput";

const accentColors = ["#4f46e5", "#16458f", "#0e7490", "#047857", "#be123c", "#a21caf"];

export function AccountSettings({ user, workspaceLabel = "Workspace" }) {
  const { updateProfile, changePassword } = useAuth();
  const { direction, language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({ name: user.name || "", avatar: user.avatar || "" });
  const [profileErrors, setProfileErrors] = useState({});
  const [security, setSecurity] = useState(() => ({
    currentPassword: "",
    password: "",
    confirm: "",
    ...readPreference("ain-security-preferences", { authenticator: false, sms: false })
  }));
  const [notifications, setNotifications] = useState(() => readPreference("ain-notifications", { email: true, security: true, product: false }));
  const [accent, setAccent] = useState(() => window.localStorage.getItem("ain-accent") || accentColors[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", accent);
    document.documentElement.style.setProperty("--ain-accent", accent);
    window.localStorage.setItem("ain-accent", accent);
  }, [accent]);

  const sections = [
    { id: "profile", label: t.settings.profile, icon: UserRound },
    { id: "security", label: t.settings.security, icon: ShieldCheck },
    { id: "notifications", label: t.settings.notifications, icon: Bell },
    { id: "appearance", label: t.settings.appearance, icon: Palette }
  ];

  const initials = useMemo(() => (profile.name || user.email || "AIN").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [profile.name, user.email]);

  const changeAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return showToast(t.validation.imageType, "danger");
    if (file.size > 2 * 1024 * 1024) return showToast(t.validation.imageSize, "danger");
    const reader = new FileReader();
    reader.onload = () => setProfile((current) => ({ ...current, avatar: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const errors = { name: profile.name.trim().length >= 2 ? "" : t.validation.name };
    setProfileErrors(errors);
    if (errors.name) return;
    setSaving(true);
    try {
      await updateProfile(profile);
      showToast(t.settings.profileSaved);
    } catch (error) {
      showToast(getAuthErrorMessage(error, t), "danger");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!security.currentPassword || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(security.password)) return showToast(t.validation.password, "danger");
    if (security.password !== security.confirm) return showToast(t.validation.passwordMatch, "danger");
    setSaving(true);
    try {
      await changePassword({ currentPassword: security.currentPassword, newPassword: security.password });
      setSecurity((current) => ({ ...current, currentPassword: "", password: "", confirm: "" }));
      showToast(t.settings.profileSaved);
    } catch (error) {
      showToast(getAuthErrorMessage(error, t), "danger");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = () => {
    window.localStorage.setItem("ain-notifications", JSON.stringify(notifications));
    showToast(t.settings.settingsSaved);
  };

  const toggleSecurityPreference = (key) => {
    setSecurity((current) => {
      const next = { ...current, [key]: !current[key] };
      window.localStorage.setItem("ain-security-preferences", JSON.stringify({ authenticator: next.authenticator, sms: next.sms }));
      return next;
    });
    showToast(t.settings.settingsSaved);
  };

  return (
    <div className="account-settings" dir={direction}>
      <header className="account-settings-header">
        <div>
          <span className="settings-kicker"><ShieldCheck size={16} /> {t.settings.backendNote}</span>
          <h1>{t.settings.title}</h1>
          <p>{t.settings.subtitle}</p>
        </div>
        <div className="settings-identity">
          <Avatar avatar={profile.avatar} initials={initials} />
          <span><strong>{profile.name || user.name}</strong><small>{user.email}</small></span>
        </div>
      </header>

      <div className="account-settings-layout">
        <aside className="account-settings-nav" aria-label={t.settings.title}>
          <div className="settings-nav-profile">
            <Avatar avatar={profile.avatar} initials={initials} />
            <div>
              <strong>{profile.name || user.name}</strong>
              <small>{user.email}</small>
              <span><ShieldCheck size={13} />{language === "ar" ? "الحساب مؤمّن" : "Account protected"}</span>
            </div>
          </div>
          <p className="settings-nav-label">{language === "ar" ? "إعداداتك" : "Your settings"}</p>
          {sections.map(({ id, label, icon: Icon }) => (
            <button type="button" aria-label={label} aria-current={activeSection === id ? "page" : undefined} className={activeSection === id ? "active" : ""} onClick={() => setActiveSection(id)} key={id}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
          <div className="settings-nav-note">
            <LockKeyhole size={17} />
            <div>
              <strong>{language === "ar" ? "خصوصيتك أولاً" : "Privacy first"}</strong>
              <small>{language === "ar" ? "لن نعرض بيانات حسابك لأعضاء المساحة." : "Your account details stay private from workspace members."}</small>
            </div>
          </div>
        </aside>

        <main className="account-settings-main">
          {activeSection === "profile" && (
            <SettingsSection icon={<UserRound />} title={t.settings.profile} description={t.settings.profileDescription}>
              <form className="settings-profile-form" onSubmit={saveProfile}>
                <div className="settings-photo-row">
                  <Avatar avatar={profile.avatar} initials={initials} large />
                  <div><strong>{t.settings.photo}</strong><p>{t.settings.photoHint}</p><div className="settings-photo-actions"><label className="settings-upload-button"><Camera size={16} />{t.settings.changePhoto}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={changeAvatar} /></label>{profile.avatar && <button type="button" onClick={() => setProfile((current) => ({ ...current, avatar: "" }))}><Trash2 size={16} />{t.settings.removePhoto}</button>}</div></div>
                </div>
                <div className="settings-fields-grid">
                  <label><span>{t.auth.fullName}</span><div className="settings-control"><UserRound size={17} /><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></div>{profileErrors.name && <small>{profileErrors.name}</small>}</label>
                  <label><span>{t.common.email}</span><div className="settings-control readonly"><Mail size={17} /><input value={user.email} readOnly dir="ltr" /></div><small>{language === "ar" ? "تغيير البريد يحتاج إلى تأكيد جديد" : "Changing email requires reverification"}</small></label>
                  <label><span>{t.settings.role}</span><div className="settings-control readonly"><ShieldCheck size={17} /><input value={user.roleLabel || user.role} readOnly /></div></label>
                  <label><span>{t.settings.company}</span><div className="settings-control readonly"><Laptop size={17} /><input value={user.company || workspaceLabel} readOnly /></div></label>
                </div>
                <div className="settings-save-bar"><span>{language === "ar" ? "آخر تحديث يتم حفظه على حسابك" : "Changes are saved to your account"}</span><Button type="submit" disabled={saving}>{saving ? t.common.saving : t.common.save}</Button></div>
              </form>
            </SettingsSection>
          )}

          {activeSection === "security" && (
            <SettingsSection icon={<ShieldCheck />} title={t.settings.security} description={t.settings.securityDescription}>
              <form className="settings-security-form" onSubmit={savePassword}>
                <div className="settings-fields-grid">
                  <label><span>{t.settings.currentPassword}</span><PasswordInput value={security.currentPassword} onChange={(event) => setSecurity((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
                  <span />
                  <label><span>{t.auth.newPassword}</span><PasswordInput autoComplete="new-password" value={security.password} onChange={(event) => setSecurity((current) => ({ ...current, password: event.target.value }))} /><PasswordStrength password={security.password} /></label>
                  <label><span>{t.auth.confirmPassword}</span><PasswordInput autoComplete="new-password" value={security.confirm} onChange={(event) => setSecurity((current) => ({ ...current, confirm: event.target.value }))} /></label>
                </div>
                <Button type="submit" disabled={saving}>{t.settings.changePassword}</Button>
              </form>
              <div className="settings-divider" />
              <h3>{t.settings.twoFactor}</h3>
              <div className="settings-option-list">
                <ToggleRow icon={<ShieldCheck />} title={t.settings.authenticator} subtitle={t.settings.authenticatorHint} checked={security.authenticator} onChange={() => toggleSecurityPreference("authenticator")} />
                <ToggleRow icon={<Smartphone />} title={t.settings.sms} subtitle={t.settings.smsHint} checked={security.sms} onChange={() => toggleSecurityPreference("sms")} />
              </div>
              <div className="settings-session"><span className="session-icon"><Monitor size={21} /></span><div><strong>{t.settings.sessions}</strong><small>{t.settings.sessionsHint}</small></div><Button variant="ghost" onClick={() => showToast(t.settings.settingsSaved)}>{t.settings.signOutOthers}</Button></div>
            </SettingsSection>
          )}

          {activeSection === "notifications" && (
            <SettingsSection icon={<Bell />} title={t.settings.notifications} description={t.settings.notificationDescription}>
              <div className="settings-option-list">
                <ToggleRow icon={<Mail />} title={t.settings.emailNotifications} subtitle={t.settings.emailNotificationsHint} checked={notifications.email} onChange={() => setNotifications((current) => ({ ...current, email: !current.email }))} />
                <ToggleRow icon={<ShieldCheck />} title={t.settings.securityAlerts} subtitle={t.settings.securityAlertsHint} checked={notifications.security} onChange={() => setNotifications((current) => ({ ...current, security: !current.security }))} />
                <ToggleRow icon={<Bell />} title={t.settings.productUpdates} subtitle={t.settings.productUpdatesHint} checked={notifications.product} onChange={() => setNotifications((current) => ({ ...current, product: !current.product }))} />
              </div>
              <div className="settings-save-bar"><span>{t.settings.backendNote}</span><Button type="button" onClick={saveNotifications}>{t.common.save}</Button></div>
            </SettingsSection>
          )}

          {activeSection === "appearance" && (
            <SettingsSection icon={<Palette />} title={t.settings.appearance} description={t.settings.appearanceDescription}>
              <div className="appearance-setting-block">
                <h3>{t.settings.theme}</h3>
                <div className="theme-choice-grid">
                  <ThemeChoice icon={<Sun />} label={t.common.light} selected={theme === "light"} onClick={() => setTheme("light")} preview="light" />
                  <ThemeChoice icon={<Moon />} label={t.common.dark} selected={theme === "dark"} onClick={() => setTheme("dark")} preview="dark" />
                </div>
              </div>
              <div className="appearance-setting-block">
                <h3>{t.settings.accent}</h3>
                <div className="settings-color-grid">{accentColors.map((color) => <button type="button" style={{ backgroundColor: color }} className={accent === color ? "selected" : ""} onClick={() => setAccent(color)} aria-label={color} key={color}>{accent === color && <Check size={17} />}</button>)}</div>
              </div>
              <div className="appearance-setting-block">
                <h3>{t.settings.interfaceLanguage}</h3>
                <div className="language-choice-grid">
                  <button type="button" className={language === "ar" ? "selected" : ""} onClick={() => setLanguage("ar")}><Languages size={19} /><span><strong>العربية</strong><small>واجهة من اليمين إلى اليسار</small></span>{language === "ar" && <Check size={18} />}</button>
                  <button type="button" className={language === "en" ? "selected" : ""} onClick={() => setLanguage("en")}><Languages size={19} /><span><strong>English</strong><small>Left-to-right interface</small></span>{language === "en" && <Check size={18} />}</button>
                </div>
              </div>
            </SettingsSection>
          )}
        </main>
      </div>
    </div>
  );
}

function SettingsSection({ icon, title, description, children }) {
  return <section className="account-settings-section"><header><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div></header><div className="account-settings-body">{children}</div></section>;
}

function Avatar({ avatar, initials, large = false }) {
  return <span className={`settings-avatar-pro ${large ? "large" : ""}`}>{avatar ? <img src={avatar} alt="" /> : initials}</span>;
}

function ToggleRow({ icon, title, subtitle, checked, onChange }) {
  return <div className="settings-toggle-row"><span className="settings-toggle-icon">{icon}</span><div><strong>{title}</strong><small>{subtitle}</small></div><button type="button" className={`pro-toggle ${checked ? "on" : ""}`} onClick={onChange} role="switch" aria-checked={checked}><span /></button></div>;
}

function ThemeChoice({ icon, label, selected, onClick, preview }) {
  return <button type="button" className={`theme-choice ${selected ? "selected" : ""}`} onClick={onClick}><span className={`theme-preview ${preview}`}><i /><i /><i /></span><span>{icon}{label}</span>{selected && <Check className="theme-check" size={17} />}</button>;
}

function readPreference(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
