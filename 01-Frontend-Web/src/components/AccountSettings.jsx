import {
  AlertTriangle,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Globe,
  KeyRound,
  Languages,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Palette,
  Phone,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  UserCheck,
  UserRound,
  Wifi,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useTheme } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";
import { getAuthErrorMessage } from "../services/authErrors";
import { Button } from "./Button";
import { PasswordInput, PasswordStrength } from "./PasswordInput";

const accentColors = [
  { id: "#16458f", nameAr: "أزرق ملكي (AIN)", nameEn: "Royal Blue" },
  { id: "#4f46e5", nameAr: "إنديجو حديث", nameEn: "Modern Indigo" },
  { id: "#047857", nameAr: "زمردي هادئ", nameEn: "Emerald Green" },
  { id: "#0e7490", nameAr: "سماوي بحري", nameEn: "Cyan Ocean" },
  { id: "#be123c", nameAr: "قرمزي روبي", nameEn: "Ruby Crimson" },
  { id: "#7c3aed", nameAr: "بنفسجي داكن", nameEn: "Deep Violet" }
];

export function AccountSettings({ user = {}, workspaceLabel = "Workspace" }) {
  const { updateProfile, changePassword } = useAuth();
  const { direction, language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { activeOrganization } = useOrganization();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    location: user?.location || "",
    avatar: user?.avatar || "",
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  });
  const [profileErrors, setProfileErrors] = useState({});

  const [security, setSecurity] = useState(() => ({
    currentPassword: "",
    password: "",
    confirm: ""
  }));

  const [notifications, setNotifications] = useState({
    inAppEnabled: true,
    emailEnabled: true,
    pushEnabled: true,
    bookingUpdates: true,
    announcements: true,
    subscriptionReminders: true
  });
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const [density, setDensity] = useState(() => window.localStorage.getItem("ain-density") || "comfortable");
  const [videoQuality, setVideoQuality] = useState(() => window.localStorage.getItem("ain-video-quality") || "auto");
  const [accent, setAccent] = useState(() => window.localStorage.getItem("ain-accent") || accentColors[0].id);
  const [saving, setSaving] = useState(false);

  // Device binding and access-control state
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [deviceError, setDeviceError] = useState("");
  const [deviceReloadKey, setDeviceReloadKey] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState("new_device");
  const [resetNotes, setResetNotes] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", accent);
    document.documentElement.style.setProperty("--ain-accent", accent);
    window.localStorage.setItem("ain-accent", accent);
  }, [accent]);

  useEffect(() => {
    window.localStorage.setItem("ain-density", density);
  }, [density]);

  useEffect(() => {
    window.localStorage.setItem("ain-video-quality", videoQuality);
  }, [videoQuality]);

  useEffect(() => {
    if (activeSection === "devices" || activeSection === "security") {
      setLoadingDevices(true);
      setDeviceError("");
      api.getStudentDevices()
        .then((items) => setDevices(Array.isArray(items) ? items : []))
        .catch((error) => {
          setDevices([]);
          setDeviceError(getAuthErrorMessage(error, t));
        })
        .finally(() => setLoadingDevices(false));
    }
  }, [activeSection, deviceReloadKey, language]);

  useEffect(() => {
    if (activeSection !== "notifications") return undefined;
    let current = true;
    setLoadingNotifications(true);
    setNotificationError("");
    api.getNotificationPreferences(activeOrganization?.id)
      .then((preferences) => {
        if (current) setNotifications((existing) => ({ ...existing, ...preferences }));
      })
      .catch((error) => {
        if (current) setNotificationError(getAuthErrorMessage(error, t));
      })
      .finally(() => {
        if (current) setLoadingNotifications(false);
      });
    return () => { current = false; };
  }, [activeOrganization?.id, activeSection, language]);

  const activeDeviceCount = devices.filter((device) => device.status === "active").length;
  const activeDevice = devices.find((device) => device.status === "active") || devices[0] || null;

  const sections = [
    { id: "profile", label: t.settings.profile, icon: UserRound, badge: language === "ar" ? "مكتمل" : "Ready" },
    { id: "devices", label: language === "ar" ? "الأجهزة وضوابط الوصول" : "Devices & Security", icon: Laptop, badge: activeDeviceCount > 0 ? (language === "ar" ? `${activeDeviceCount} نشط` : `${activeDeviceCount} Active`) : null },
    { id: "security", label: t.settings.security, icon: ShieldCheck, badge: null },
    { id: "notifications", label: t.settings.notifications, icon: Bell, badge: null },
    { id: "appearance", label: t.settings.appearance, icon: Palette, badge: null }
  ];

  const initials = useMemo(() => {
    return (profile.name || user.email || "AIN")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [profile.name, user.email]);

  // Account ID calculation
  const accountId = user.id ? String(user.id) : "";

  const copyAccountId = () => {
    if (!accountId) return;
    navigator.clipboard?.writeText(accountId);
    setCopiedId(true);
    showToast(language === "ar" ? "تم نسخ معرف الحساب بنجاح" : "Account ID copied to clipboard", "success");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const changeAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return showToast(t.validation.imageType, "danger");
    }
    if (file.size > 2 * 1024 * 1024) {
      return showToast(t.validation.imageSize, "danger");
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({ ...current, avatar: String(reader.result) }));
      showToast(language === "ar" ? "تم تجهيز الصورة، اضغط حفظ التغييرات" : "Image ready, click save changes", "info");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const errors = {
      name: profile.name.trim().length >= 2 ? "" : t.validation.name,
      phone: !profile.phone.trim() || profile.phone.trim().length >= 8 ? "" : (language === "ar" ? "يرجى كتابة رقم هاتف صحيح" : "Please enter a valid phone number")
    };
    setProfileErrors(errors);
    if (errors.name || errors.phone) return;

    setSaving(true);
    try {
      await updateProfile(profile);
      showToast(t.settings.profileSaved, "success");
    } catch (error) {
      showToast(getAuthErrorMessage(error, t), "danger");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!security.currentPassword || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(security.password)) {
      return showToast(t.validation.password, "danger");
    }
    if (security.password !== security.confirm) {
      return showToast(t.validation.passwordMatch, "danger");
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword: security.currentPassword, newPassword: security.password });
      setSecurity((current) => ({ ...current, currentPassword: "", password: "", confirm: "" }));
      showToast(language === "ar" ? "تم تحديث كلمة المرور بنجاح" : "Password updated successfully", "success");
    } catch (error) {
      showToast(getAuthErrorMessage(error, t), "danger");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationError("");
    try {
      const saved = await api.updateNotificationPreferences({
        organizationId: activeOrganization?.id || null,
        ...notifications
      });
      setNotifications((current) => ({ ...current, ...saved }));
      showToast(t.settings.settingsSaved, "success");
    } catch (error) {
      const message = getAuthErrorMessage(error, t);
      setNotificationError(message);
      showToast(message, "danger");
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleDeviceResetSubmit = async (event) => {
    event.preventDefault();
    setSubmittingReset(true);
    try {
      await api.requestDeviceReset({ reason: resetReason, notes: resetNotes });
      showToast(
        language === "ar"
          ? "تم إرسال طلب استبدال الجهاز بنجاح لإدارة الأكاديمية والمدرس لمراجعته"
          : "Device replacement request submitted successfully to academy admin",
        "success"
      );
      setShowResetModal(false);
      setResetNotes("");
    } catch (error) {
      showToast(
        language === "ar"
          ? "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً"
          : "Could not submit request, please try again",
        "danger"
      );
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleEmergencySignOut = async () => {
    if (window.confirm(language === "ar" ? "هل أنت متأكد من رغبتك في تسجيل الخروج من كافة الأجهزة والجلسات الأخرى؟" : "Are you sure you want to sign out from all other active sessions?")) {
      try {
        await api.revokeOtherSessions();
        showToast(
          language === "ar"
            ? "تم إبطال كافة الجلسات الأخرى بنجاح"
            : "All other sessions have been revoked",
          "success"
        );
      } catch (error) {
        showToast(getAuthErrorMessage(error, t), "danger");
      }
    }
  };

  return (
    <div className="account-settings-pro" dir={direction}>
      {/* UNIFIED STREAMLINED HEADER WITH HORIZONTAL TABS */}
      <header className="account-unified-header">
        <div className="account-header-top">
          <div className="account-title-block">
            <div className="account-title-row">
              <h1>{t.settings.title}</h1>
              <span className="hero-status-pill">
                <span className="pulse-dot"></span>
                <ShieldCheck size={14} />
                <span>{language === "ar" ? "إعدادات أمان الحساب" : "Account security settings"}</span>
              </span>
            </div>
            <p className="account-subtitle">{t.settings.subtitle}</p>
          </div>

          <div className="account-header-meta">
            <div className="account-user-pill">
              <Avatar avatar={profile.avatar} initials={initials} />
              <div className="account-user-meta">
                <strong>{profile.name || user.name}</strong>
                <small>{user.email}</small>
              </div>
            </div>

            <div className="account-meta-chips">
              {accountId && <button
                type="button"
                className="hero-id-chip"
                onClick={copyAccountId}
                title={language === "ar" ? "اضغط لنسخ معرّف الحساب" : "Click to copy account ID"}
              >
                <span>{accountId}</span>
                <Copy size={12} className={copiedId ? "copied" : ""} />
              </button>}

              <span className="role-tag">{user.roleLabel || user.role}</span>
            </div>
          </div>
        </div>

        {/* MODERN HORIZONTAL TABS */}
        <nav className="account-horizontal-tabs" aria-label={t.settings.title}>
          {sections.map(({ id, label, icon: Icon, badge }) => (
            <button
              type="button"
              aria-label={label}
              aria-current={activeSection === id ? "page" : undefined}
              className={`account-tab-btn settings-nav-${id} ${id === "profile" ? "settings-nav-profile" : ""} ${activeSection === id ? "active" : ""}`}
              onClick={() => setActiveSection(id)}
              key={id}
            >
              <Icon size={17} />
              <span>{label}</span>
              {badge && <span className="tab-pill-badge">{badge}</span>}
            </button>
          ))}
        </nav>
      </header>

      {/* TAB CONTENTS */}
      <main className="account-settings-main">
          {/* TAB 1: PROFILE */}
          {activeSection === "profile" && (
            <SettingsSectionCard
              icon={<UserRound />}
              title={t.settings.profile}
              description={t.settings.profileDescription}
            >
              <form className="settings-profile-form" onSubmit={saveProfile}>
                {/* PHOTO UPLOADER */}
                <div className="pro-photo-card">
                  <div className="pro-photo-avatar-wrap">
                    <Avatar avatar={profile.avatar} initials={initials} large />
                    <label className="photo-edit-overlay" title={t.settings.changePhoto}>
                      <Camera size={20} />
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={changeAvatar} />
                    </label>
                  </div>
                  <div className="pro-photo-meta">
                    <h4>{t.settings.photo}</h4>
                    <p className="settings-nav-note">{t.settings.photoHint}</p>
                    <div className="photo-actions-row">
                      <label className="btn-photo-upload">
                        <Camera size={15} />
                        <span>{t.settings.changePhoto}</span>
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={changeAvatar} />
                      </label>
                      {profile.avatar && (
                        <button
                          type="button"
                          className="btn-photo-remove"
                          onClick={() => setProfile((c) => ({ ...c, avatar: "" }))}
                        >
                          <Trash2 size={15} />
                          <span>{t.settings.removePhoto}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FORM FIELDS GRID */}
                <div className="pro-fields-grid">
                  {/* Full Name */}
                  <div className="field-group">
                    <label htmlFor="user-full-name">{t.auth.fullName}</label>
                    <div className="pro-input-wrap">
                      <UserRound size={17} />
                      <input
                        id="user-full-name"
                        value={profile.name}
                        onChange={(e) => setProfile((c) => ({ ...c, name: e.target.value }))}
                        placeholder={language === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
                      />
                    </div>
                    {profileErrors.name && <small className="field-error">{profileErrors.name}</small>}
                  </div>

                  {/* Phone */}
                  <div className="field-group">
                    <label htmlFor="user-phone">
                      {language === "ar" ? "رقم الهاتف" : "Phone number"}
                    </label>
                    <div className="pro-input-wrap">
                      <Phone size={17} />
                      <input
                        id="user-phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))}
                        placeholder="010XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                    {profileErrors.phone && <small className="field-error">{profileErrors.phone}</small>}
                  </div>

                  {/* Email */}
                  <div className="field-group">
                    <label htmlFor="user-email">{t.common.email}</label>
                    <div className="pro-input-wrap readonly">
                      <Mail size={17} />
                      <input id="user-email" value={user.email} readOnly dir="ltr" />
                      <span className="verified-pill">
                        <CheckCircle2 size={13} /> {language === "ar" ? "موثّق" : "Verified"}
                      </span>
                    </div>
                    <small className="field-hint">
                      {language === "ar" ? "لتغيير البريد الإلكتروني، يرجى مراجعة الدعم الفني" : "Contact admin to change email"}
                    </small>
                  </div>

                  {/* Role */}
                  <div className="field-group">
                    <label htmlFor="user-role">{t.settings.role}</label>
                    <div className="pro-input-wrap readonly">
                      <ShieldCheck size={17} />
                      <input id="user-role" value={user.roleLabel || user.role} readOnly />
                    </div>
                  </div>

                  {/* Workspace */}
                  <div className="field-group">
                    <label htmlFor="user-company">{t.settings.company}</label>
                    <div className="pro-input-wrap readonly">
                      <Laptop size={17} />
                      <input id="user-company" value={user.company || workspaceLabel} readOnly />
                    </div>
                  </div>

                  {/* Location & City */}
                  <div className="field-group">
                    <label htmlFor="user-location">{language === "ar" ? "الدولة والمدينة" : "Location"}</label>
                    <div className="pro-input-wrap">
                      <MapPin size={17} />
                      <input
                        id="user-location"
                        value={profile.location}
                        onChange={(e) => setProfile((c) => ({ ...c, location: e.target.value }))}
                        placeholder={language === "ar" ? "القاهرة، مصر" : "Cairo, Egypt"}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="field-group full-width">
                    <label htmlFor="user-bio">
                      {language === "ar" ? "نبذة تعريفية وتخصصك" : "Bio / Specialization"}
                    </label>
                    <div className="pro-textarea-wrap">
                      <textarea
                        id="user-bio"
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => setProfile((c) => ({ ...c, bio: e.target.value }))}
                        placeholder={language === "ar" ? "اكتب نبذة مختصرة عنك أو مادتك الدراسية..." : "Brief bio..."}
                      />
                    </div>
                  </div>
                </div>

                {/* SAVE ACTION BAR */}
                <div className="pro-save-bar">
                  <div className="save-status-text">
                    <Sparkles size={16} />
                    <span>{language === "ar" ? "يتم حفظ التغييرات فوراً على حسابك ومزامنتها مع كافة أجهزتك." : "Changes are synced instantly across your devices."}</span>
                  </div>
                  <Button type="submit" loading={saving} loadingLabel={t.common.saving}>{t.common.save}</Button>
                </div>
              </form>
            </SettingsSectionCard>
          )}

          {/* TAB 2: DEVICES & ACCESS CONTROLS */}
          {activeSection === "devices" && (
            <SettingsSectionCard
              icon={<Laptop />}
              title={language === "ar" ? "الأجهزة الموثقة وضوابط الوصول" : "Bound Devices & Access Controls"}
              description={
                language === "ar"
                  ? "لحماية المحتوى التعليمي والحد من مشاركة الحسابات، يتم تفعيل سياسة (طالب واحد = جهاز واحد معتمد)."
                  : "To prevent unauthorized account sharing, exactly 1 active authorized device is bound per account."
              }
            >
              {/* POLICY BANNER */}
              <div className="drm-policy-banner">
                <div className="banner-icon-badge">
                  <ShieldCheck size={28} />
                </div>
                <div className="banner-text">
                  <strong>
                    {language === "ar" ? "ضوابط الوصول وربط الأجهزة (1 Student = 1 Bound Device)" : "Access Controls & Device Binding (1 Student = 1 Device)"}
                  </strong>
                  <p>
                    {language === "ar"
                      ? "جهازك الحالي مقترن بجلسة معتمدة لحماية حقوق الأكاديمية والحد من مشاركة الحسابات، مع علامة مائية ديناميكية مخصصة ببياناتك أثناء تشغيل المحتوى."
                      : "Your account is bound to this device session to prevent account sharing, backed by dynamic watermarks during video sessions."}
                  </p>
                </div>
              </div>

              {/* ACTIVE DEVICE SHOWCASE */}
              <div className="devices-showcase-container">
                <div className="section-subhead">
                  <Cpu size={18} />
                  <h3>{language === "ar" ? "الجهاز النشط المعتمد حالياً" : "Current Bound Device"}</h3>
                </div>

                {loadingDevices && (
                  <div className="devices-loading-box">
                    <div className="spinner-dots"></div>
                    <p>{language === "ar" ? "جاري فحص حالة اقتران الأجهزة وضوابط الجلسات..." : "Verifying bound devices..."}</p>
                  </div>
                )}

                {!loadingDevices && deviceError && (
                  <div className="auth-status" role="alert">
                    <AlertTriangle size={18} />
                    <span>{deviceError}</span>
                    <button type="button" onClick={() => setDeviceReloadKey((current) => current + 1)}>
                      {language === "ar" ? "إعادة المحاولة" : "Try again"}
                    </button>
                  </div>
                )}

                {!loadingDevices && !deviceError && !activeDevice && (
                  <div className="devices-loading-box">
                    <p>{language === "ar" ? "لا يوجد جهاز مقترن بهذا الحساب حالياً." : "No device is currently bound to this account."}</p>
                  </div>
                )}

                {!loadingDevices && !deviceError && activeDevice && (
                  <div className="active-device-card">
                    <div className="device-card-header">
                      <div className="device-type-icon">
                        {window.navigator?.userAgent?.includes("Mobi") ? <Smartphone size={26} /> : <Laptop size={26} />}
                      </div>
                      <div className="device-meta-title">
                        <div className="name-and-tag">
                          <strong>
                            {activeDevice.deviceName || activeDevice.device_name || (language === "ar" ? "جهاز مسجل" : "Registered device")}
                          </strong>
                          <span className="active-badge">
                            <span className="live-dot"></span>
                            {language === "ar" ? "الجهاز المقترن النشط" : "Active Bound Device"}
                          </span>
                        </div>
                        <div className="device-specs-chips">
                          <span className="spec-chip">
                            <Wifi size={13} /> {activeDevice.lastIp || activeDevice.last_ip || activeDevice.ipAddress || (language === "ar" ? "عنوان الشبكة غير متاح" : "Network address unavailable")}
                          </span>
                          <span className="spec-chip fp">
                            <Cpu size={13} /> {activeDevice.id ? `ID: DEV-${String(activeDevice.id).slice(0, 8)}` : (language === "ar" ? "معرّف الجهاز غير متاح" : "Device ID unavailable")}
                          </span>
                          <span className="spec-chip sec">
                            <Shield size={13} /> {language === "ar" ? "علامة مائية ديناميكية وضوابط الجلسات" : "Dynamic Watermark & Session Guard"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="device-card-footer">
                      <div className="device-last-seen">
                        <Clock size={14} />
                        <span>{activeDevice.lastSeenAt || activeDevice.last_seen_at
                          ? `${language === "ar" ? "آخر نشاط:" : "Last active:"} ${new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activeDevice.lastSeenAt || activeDevice.last_seen_at))}`
                          : (language === "ar" ? "وقت آخر نشاط غير متاح" : "Last activity time unavailable")}</span>
                      </div>
                      <Button variant="secondary" type="button" onClick={() => setShowResetModal(true)}>
                        <RotateCcw size={15} />
                        <span>{language === "ar" ? "طلب استبدال الجهاز المقترن" : "Request Device Replacement"}</span>
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* MODAL: DEVICE RESET REQUEST */}
              {showResetModal && (
                <div className="modal-backdrop-pro" onClick={() => setShowResetModal(false)}>
                  <div className="modal-box-pro" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header-pro">
                      <div className="modal-icon-badge warning">
                        <RotateCcw size={22} />
                      </div>
                      <div>
                        <h3>{language === "ar" ? "طلب استبدال الجهاز المقترن" : "Request Device Change"}</h3>
                        <p>{language === "ar" ? "سيتم مراجعة الطلب بواسطة إدارة الأكاديمية لفك ارتباط الجهاز القديم" : "The admin will review your request to unbind the old device"}</p>
                      </div>
                      <button type="button" className="modal-close-btn" onClick={() => setShowResetModal(false)}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleDeviceResetSubmit} className="modal-form-pro">
                      <div className="modal-alert-box">
                        <AlertTriangle size={18} />
                        <span>
                          {language === "ar"
                            ? "تنبيه: لا تقم بمشاركة حسابك مع أصدقائك؛ سيتم فك ارتباط جهازك الحالي بعد الموافقة وربط الجهاز الجديد فقط."
                            : "Notice: Account sharing is prohibited. Your old device will be unbound upon approval."}
                        </span>
                      </div>

                      <div className="form-field-pro">
                        <label>{language === "ar" ? "سبب استبدال الجهاز:" : "Reason for replacement:"}</label>
                        <select
                          value={resetReason}
                          onChange={(e) => setResetReason(e.target.value)}
                        >
                          <option value="new_device">{language === "ar" ? "اشتريت هاتف أو لابتوب جديد" : "Purchased a new laptop or phone"}</option>
                          <option value="os_format">{language === "ar" ? "تم عمل فورمات لنظام التشغيل (Windows / Mac)" : "Operating system formatted"}</option>
                          <option value="hardware_damage">{language === "ar" ? "عطل أو كسر في الجهاز القديم" : "Old device damaged or broken"}</option>
                          <option value="other">{language === "ar" ? "سبب آخر (توضيح في الملاحظات)" : "Other reason (specify below)"}</option>
                        </select>
                      </div>

                      <div className="form-field-pro">
                        <label>{language === "ar" ? "ملاحظات وتفاصيل إضافية للمعلم / الإدارة:" : "Additional details for instructor:"}</label>
                        <textarea
                          value={resetNotes}
                          onChange={(e) => setResetNotes(e.target.value)}
                          placeholder={language === "ar" ? "اكتب نوع جهازك الجديد أو سبب التغيير..." : "Describe your new device..."}
                          rows={3}
                        />
                      </div>

                      <div className="modal-actions-pro">
                        <Button type="button" variant="ghost" onClick={() => setShowResetModal(false)}>
                          {language === "ar" ? "إلغاء" : "Cancel"}
                        </Button>
                        <Button type="submit" loading={submittingReset} loadingLabel={language === "ar" ? "جاري الإرسال..." : "Submitting..."}>
                          {language === "ar" ? "إرسال الطلب للمراجعة" : "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </SettingsSectionCard>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeSection === "security" && (
            <SettingsSectionCard
              icon={<ShieldCheck />}
              title={t.settings.security}
              description={t.settings.securityDescription}
            >
              {/* VERIFIED SECURITY CONTROLS */}
              <div className="security-meter-card">
                <div className="meter-head">
                  <div className="meter-title">
                    <ShieldCheck size={20} />
                    <strong>{language === "ar" ? "ضوابط الأمان المتاحة" : "Available Security Controls"}</strong>
                  </div>
                  <span className="meter-score-badge">{language === "ar" ? "حالة فعلية" : "Live status"}</span>
                </div>
                <div className="meter-checks-row">
                  <span className="meter-check-item passed">
                    <CheckCircle2 size={13} /> {language === "ar" ? "تغيير كلمة المرور متاح" : "Password change available"}
                  </span>
                  <span className="meter-check-item passed">
                    <CheckCircle2 size={13} /> {language === "ar" ? "تحقق بالبريد عند طلب تسجيل الدخول" : "Email login verification when required"}
                  </span>
                  <span className={`meter-check-item ${activeDeviceCount > 0 ? "passed" : "pending"}`}>
                    <CheckCircle2 size={13} /> {activeDeviceCount > 0
                      ? (language === "ar" ? `${activeDeviceCount} جهاز معتمد` : `${activeDeviceCount} bound device(s)`)
                      : (language === "ar" ? "لا يوجد جهاز نشط حالياً" : "No active bound device")}
                  </span>
                </div>
              </div>

              {/* PASSWORD CHANGE FORM */}
              <form className="settings-security-form" onSubmit={savePassword}>
                <div className="section-subhead">
                  <KeyRound size={18} />
                  <h3>{language === "ar" ? "تغيير كلمة المرور" : "Change Password"}</h3>
                </div>

                <div className="pro-fields-grid">
                  <div className="field-group full-width">
                    <label>{t.settings.currentPassword}</label>
                    <PasswordInput
                      value={security.currentPassword}
                      onChange={(e) => setSecurity((c) => ({ ...c, currentPassword: e.target.value }))}
                      placeholder="••••••••••••"
                    />
                  </div>

                  <div className="field-group">
                    <label>{t.auth.newPassword}</label>
                    <PasswordInput
                      autoComplete="new-password"
                      value={security.password}
                      onChange={(e) => setSecurity((c) => ({ ...c, password: e.target.value }))}
                      placeholder={language === "ar" ? "10 أحرف على الأقل، حروف كبيرة وصغيرة وأرقام" : "Min 10 chars, uppercase, lowercase & numbers"}
                    />
                    <PasswordStrength password={security.password} />
                  </div>

                  <div className="field-group">
                    <label>{t.auth.confirmPassword}</label>
                    <PasswordInput
                      autoComplete="new-password"
                      value={security.confirm}
                      onChange={(e) => setSecurity((c) => ({ ...c, confirm: e.target.value }))}
                      placeholder={language === "ar" ? "أعد كتابة كلمة المرور الجديدة" : "Repeat new password"}
                    />
                  </div>
                </div>

                <div className="password-actions-bar">
                  <Button type="submit" loading={saving} loadingLabel={t.common.saving}>{t.settings.changePassword}</Button>
                </div>
              </form>

              <div className="settings-divider-line" />

              {/* LOGIN VERIFICATION */}
              <div className="two-factor-section">
                <div className="section-subhead">
                  <ShieldAlert size={18} />
                  <h3>{language === "ar" ? "التحقق عند تسجيل الدخول" : "Login Verification"}</h3>
                </div>

                <div className="pro-session-card">
                  <div className="session-left">
                    <span className="session-icon-circle"><Mail size={20} /></span>
                    <div className="session-text">
                      <strong>{language === "ar" ? "رمز تحقق عبر البريد الإلكتروني" : "Email verification code"}</strong>
                      <small>{language === "ar"
                        ? "ترسل المنصة رمزاً إلى البريد المسجل عندما تتطلب محاولة الدخول تحققاً إضافياً. إعداد WhatsApp وSMS وتطبيقات المصادقة غير متاح في هذا الإصدار."
                        : "AIN emails a code when a login requires additional verification. WhatsApp, SMS, and authenticator-app setup are not available in this release."}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-divider-line" />

              {/* ACTIVE SESSIONS & LOGOUT ALL */}
              <div className="sessions-control-section">
                <div className="section-subhead">
                  <Monitor size={18} />
                  <h3>{t.settings.sessions}</h3>
                </div>

                <div className="pro-session-card">
                  <div className="session-left">
                    <span className="session-icon-circle">
                      <Monitor size={22} />
                    </span>
                    <div className="session-text">
                      <strong>{language === "ar" ? "الجلسة الحالية (هذا المتصفح)" : "Current Active Session"}</strong>
                      <small>{t.settings.sessionsHint}{(activeDevice?.lastIp || activeDevice?.last_ip) ? ` • IP: ${activeDevice.lastIp || activeDevice.last_ip}` : ""}</small>
                    </div>
                  </div>
                  <Button variant="danger" type="button" onClick={handleEmergencySignOut}>
                    <LogOut size={16} />
                    <span>{t.settings.signOutOthers}</span>
                  </Button>
                </div>
              </div>
            </SettingsSectionCard>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeSection === "notifications" && (
            <SettingsSectionCard
              icon={<Bell />}
              title={t.settings.notifications}
              description={t.settings.notificationDescription}
            >
              {notificationError && <div className="auth-status" role="alert"><AlertTriangle size={18} /><span>{notificationError}</span></div>}
              <div className="notifications-groups-wrap">
                <div className="notif-group-card">
                  <div className="group-card-header">
                    <Bell size={18} />
                    <div>
                      <h4>{language === "ar" ? "قنوات الإشعارات" : "Notification channels"}</h4>
                      <p>{language === "ar" ? "اختر القنوات التي تريد استلام التنبيهات من خلالها" : "Choose how you want to receive updates"}</p>
                    </div>
                  </div>
                  <div className="group-toggle-items">
                    <ToggleRow
                      icon={<Bell />}
                      title={language === "ar" ? "داخل المنصة" : "In-app notifications"}
                      subtitle={language === "ar" ? "إظهار التنبيهات في مركز إشعارات حسابك" : "Show updates in your account notification center"}
                      checked={notifications.inAppEnabled}
                      onChange={() => setNotifications((c) => ({ ...c, inAppEnabled: !c.inAppEnabled }))}
                    />
                    <ToggleRow
                      icon={<Smartphone />}
                      title={language === "ar" ? "إشعارات الهاتف" : "Push notifications"}
                      subtitle={language === "ar" ? "إرسال تنبيهات إلى الأجهزة المسجلة" : "Send alerts to your registered devices"}
                      checked={notifications.pushEnabled}
                      onChange={() => setNotifications((c) => ({ ...c, pushEnabled: !c.pushEnabled }))}
                    />
                    <ToggleRow
                      icon={<Mail />}
                      title={t.settings.emailNotifications}
                      subtitle={t.settings.emailNotificationsHint}
                      checked={notifications.emailEnabled}
                      onChange={() => setNotifications((c) => ({ ...c, emailEnabled: !c.emailEnabled }))}
                    />
                  </div>
                </div>

                <div className="notif-group-card">
                  <div className="group-card-header">
                    <Sparkles size={18} />
                    <div>
                      <h4>{language === "ar" ? "أنواع التحديثات" : "Update types"}</h4>
                      <p>{language === "ar" ? "حدد الموضوعات المهمة بالنسبة لك" : "Choose the updates that matter to you"}</p>
                    </div>
                  </div>
                  <div className="group-toggle-items">
                    <ToggleRow
                      icon={<Clock />}
                      title={language === "ar" ? "تحديثات الحجوزات والمواعيد" : "Booking and schedule updates"}
                      subtitle={language === "ar" ? "تغييرات المواعيد، التأكيدات والإلغاءات" : "Schedule changes, confirmations, and cancellations"}
                      checked={notifications.bookingUpdates}
                      onChange={() => setNotifications((c) => ({ ...c, bookingUpdates: !c.bookingUpdates }))}
                    />
                    <ToggleRow
                      icon={<Bell />}
                      title={language === "ar" ? "الإعلانات" : "Announcements"}
                      subtitle={language === "ar" ? "إعلانات الأكاديمية والمنصة المهمة" : "Important academy and platform announcements"}
                      checked={notifications.announcements}
                      onChange={() => setNotifications((c) => ({ ...c, announcements: !c.announcements }))}
                    />
                    <ToggleRow
                      icon={<ShieldCheck />}
                      title={language === "ar" ? "تذكيرات الاشتراك" : "Subscription reminders"}
                      subtitle={language === "ar" ? "تنبيهات التجديد وحالة الاشتراك" : "Renewal and subscription status alerts"}
                      checked={notifications.subscriptionReminders}
                      onChange={() => setNotifications((c) => ({ ...c, subscriptionReminders: !c.subscriptionReminders }))}
                    />
                  </div>
                </div>
              </div>

              <div className="pro-save-bar">
                <span>{language === "ar" ? "لن تُطبق التغييرات حتى تضغط حفظ" : "Changes apply after you save"}</span>
                <Button type="button" onClick={saveNotifications} loading={loadingNotifications} loadingLabel={t.common.saving}>
                  {t.common.save}
                </Button>
              </div>
            </SettingsSectionCard>
          )}

          {/* TAB 5: APPEARANCE & CUSTOMIZATION */}
          {activeSection === "appearance" && (
            <SettingsSectionCard
              icon={<Palette />}
              title={t.settings.appearance}
              description={t.settings.appearanceDescription}
            >
              {/* THEME PICKER */}
              <div className="appearance-block-card">
                <div className="block-card-header">
                  <Sun size={18} />
                  <div>
                    <h4>{t.settings.theme}</h4>
                    <p>{language === "ar" ? "اختر النمط المناسب لراحة عينيك أثناء الدراسة والعمل" : "Choose between light and dark modes"}</p>
                  </div>
                </div>
                <div className="theme-options-grid">
                  <button
                    type="button"
                    className={`theme-card-btn light ${theme === "light" ? "active" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="theme-mini-mockup light">
                      <span className="mock-nav"></span>
                      <div className="mock-body">
                        <span className="mock-card"></span>
                        <span className="mock-line"></span>
                      </div>
                    </div>
                    <div className="theme-label-row">
                      <Sun size={17} />
                      <strong>{t.common.light}</strong>
                      {theme === "light" && <CheckCircle2 size={16} className="active-check" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`theme-card-btn dark ${theme === "dark" ? "active" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="theme-mini-mockup dark">
                      <span className="mock-nav"></span>
                      <div className="mock-body">
                        <span className="mock-card"></span>
                        <span className="mock-line"></span>
                      </div>
                    </div>
                    <div className="theme-label-row">
                      <Moon size={17} />
                      <strong>{t.common.dark}</strong>
                      {theme === "dark" && <CheckCircle2 size={16} className="active-check" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* ACCENT COLOR */}
              <div className="appearance-block-card">
                <div className="block-card-header">
                  <Palette size={18} />
                  <div>
                    <h4>{t.settings.accent}</h4>
                    <p>{language === "ar" ? "اللون الأساسي للأزرار وشارات التحديد والتفاعل" : "Primary accent for buttons and indicators"}</p>
                  </div>
                </div>
                <div className="accent-colors-grid">
                  {accentColors.map((colorObj) => {
                    const isSelected = accent === colorObj.id;
                    return (
                      <button
                        type="button"
                        key={colorObj.id}
                        className={`accent-color-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => setAccent(colorObj.id)}
                      >
                        <span className="color-swatch" style={{ backgroundColor: colorObj.id }}>
                          {isSelected && <Check size={16} />}
                        </span>
                        <span className="color-label">
                          {language === "ar" ? colorObj.nameAr : colorObj.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INTERFACE LANGUAGE */}
              <div className="appearance-block-card">
                <div className="block-card-header">
                  <Languages size={18} />
                  <div>
                    <h4>{t.settings.interfaceLanguage}</h4>
                    <p>{language === "ar" ? "تغيير لغة العرض واتجاه النصوص (RTL / LTR)" : "Switch UI language and reading direction"}</p>
                  </div>
                </div>
                <div className="language-options-grid">
                  <button
                    type="button"
                    className={`lang-card-btn ${language === "ar" ? "active" : ""}`}
                    onClick={() => setLanguage("ar")}
                  >
                    <div className="lang-content">
                      <span className="flag-icon">🇪🇬</span>
                      <div>
                        <strong>{language === "ar" ? "اللغة العربية" : "Arabic"}</strong>
                        <small>{language === "ar" ? "واجهة كاملة من اليمين إلى اليسار (RTL)" : "Right-to-Left layout (RTL)"}</small>
                      </div>
                    </div>
                    {language === "ar" && <CheckCircle2 size={18} className="lang-check" />}
                  </button>

                  <button
                    type="button"
                    className={`lang-card-btn ${language === "en" ? "active" : ""}`}
                    onClick={() => setLanguage("en")}
                  >
                    <div className="lang-content">
                      <span className="flag-icon">🌐</span>
                      <div>
                        <strong>{language === "ar" ? "الإنجليزية (English)" : "English"}</strong>
                        <small>{language === "ar" ? "واجهة من اليسار إلى اليمين (LTR)" : "Left-to-Right layout (LTR)"}</small>
                      </div>
                    </div>
                    {language === "en" && <CheckCircle2 size={18} className="lang-check" />}
                  </button>
                </div>
              </div>

              {/* DISPLAY DENSITY & VIDEO DEFAULTS */}
              <div className="appearance-block-card">
                <div className="block-card-header">
                  <Sparkles size={18} />
                  <div>
                    <h4>{language === "ar" ? "تفضيلات البث وكثافة العرض" : "Streaming & Layout Preferences"}</h4>
                    <p>{language === "ar" ? "تخصيص استهلاك باقة الإنترنت وحجم العناصر في الشاشة" : "Customize mobile data usage and UI density"}</p>
                  </div>
                </div>

                <div className="preferences-two-col">
                  <div className="pref-item">
                    <label>{language === "ar" ? "جودة الفيديو الافتراضية:" : "Default Video Quality:"}</label>
                    <select value={videoQuality} onChange={(e) => setVideoQuality(e.target.value)}>
                      <option value="auto">{language === "ar" ? "تلقائي (توفير باقة النت + تشغيل فوري بدون تقطيع)" : "Auto (Adaptive Bitrate - Saves data)"}</option>
                      <option value="1080p">{language === "ar" ? "Full HD (1080p - أعلى جودة وأوضح تفاصيل)" : "Full HD (1080p - Highest quality)"}</option>
                      <option value="720p">{language === "ar" ? "HD (720p - جودة ممتازة وسريعة)" : "HD (720p - Balanced)"}</option>
                      <option value="480p">{language === "ar" ? "SD (480p - للباقات المحدودة والسرعات الضعيفة)" : "SD (480p - Low data)"}</option>
                    </select>
                  </div>

                  <div className="pref-item">
                    <label>{language === "ar" ? "كثافة عرض القوائم والجداول:" : "Interface Density:"}</label>
                    <select value={density} onChange={(e) => setDensity(e.target.value)}>
                      <option value="comfortable">{language === "ar" ? "مريح ومتسع (افتراضي - مريح للعين)" : "Comfortable (Standard)"}</option>
                      <option value="compact">{language === "ar" ? "مدمج واحترافي (لعرض بيانات أكثر)" : "Compact (Information-dense)"}</option>
                    </select>
                  </div>
                </div>
              </div>
            </SettingsSectionCard>
          )}
        </main>
    </div>
  );
}

function SettingsSectionCard({ icon, title, description, children }) {
  return (
    <section className="account-settings-section-card">
      <header className="section-card-head">
        <span className="section-head-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      <div className="section-card-body">{children}</div>
    </section>
  );
}

function Avatar({ avatar, initials, large = false }) {
  return (
    <span className={`settings-avatar-pro ${large ? "large" : ""}`}>
      {avatar ? <img src={avatar} alt="" /> : initials}
    </span>
  );
}

function ToggleRow({ icon, title, subtitle, checked, onChange }) {
  return (
    <div className="pro-toggle-row">
      <span className="toggle-row-icon">{icon}</span>
      <div className="toggle-row-text">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
      <button
        type="button"
        className={`pro-switch ${checked ? "on" : ""}`}
        onClick={onChange}
        role="switch"
        aria-checked={checked}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

