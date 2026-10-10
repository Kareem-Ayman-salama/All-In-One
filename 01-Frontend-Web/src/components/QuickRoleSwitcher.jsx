import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, ChevronDown, ShieldCheck, Building2, UserRound, GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { getRoleHome } from "../pages/LoginPage";

const DEMO_ROLES = [
  {
    role: "super-admin",
    email: "super@ain.test",
    titleAr: "مدير المنصة العام",
    titleEn: "Super Admin",
    icon: ShieldCheck,
    color: "#6366F1",
    badgeBg: "rgba(99, 102, 241, 0.12)"
  },
  {
    role: "tenant-admin",
    email: "admin@techcorp.test",
    titleAr: "مدير الأكاديمية",
    titleEn: "Academy Admin",
    icon: Building2,
    color: "#0EA5E9",
    badgeBg: "rgba(14, 165, 233, 0.12)"
  },
  {
    role: "end-user",
    email: "employee@techcorp.test",
    titleAr: "معلم / موظف",
    titleEn: "Instructor / Staff",
    icon: UserRound,
    color: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.12)"
  },
  {
    role: "student",
    email: "student@ain.test",
    titleAr: "طالب مسجل",
    titleEn: "Enrolled Student",
    icon: GraduationCap,
    color: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.12)"
  }
];

export function QuickRoleSwitcher() {
  const { user, login } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const containerRef = useRef(null);

  const isArabic = language === "ar";
  const activeRole = DEMO_ROLES.find((item) => item.email === user?.email) || {
    titleAr: user?.roleLabel || user?.role || "مستخدم",
    titleEn: user?.roleLabel || user?.role || "User",
    color: "#6366F1",
    badgeBg: "rgba(99, 102, 241, 0.12)",
    icon: Sparkles
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitch = async (account) => {
    if (account.email === user?.email) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const nextUser = await login({ email: account.email, password: "12345678", remember: true });
      showToast(isArabic ? `تم التبديل إلى: ${account.titleAr}` : `Switched to: ${account.titleEn}`);
      setOpen(false);
      navigate(getRoleHome(nextUser.role), { replace: true });
    } catch (err) {
      showToast(isArabic ? "تعذر التبديل بين الأدوار" : "Failed to switch role", "error");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="quick-role-switcher" ref={containerRef}>
      <button
        type="button"
        className="quick-role-toggle-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        title={isArabic ? "تبديل الدور التجريبي السريع" : "Switch Demo Role"}
        disabled={switching}
      >
        <Sparkles size={16} className="quick-sparkle-icon" />
        <span className="quick-role-label">{isArabic ? activeRole.titleAr : activeRole.titleEn}</span>
        {switching ? <Loader2 size={14} className="spin-icon" /> : <ChevronDown size={14} className={open ? "icon-rotated" : ""} />}
      </button>

      {open && (
        <div className="quick-role-dropdown" dir={isArabic ? "rtl" : "ltr"}>
          <div className="quick-role-header">
            <small>{isArabic ? "تبديل الصلاحية للتجربة المباشرة:" : "Switch Role for Interactive Demo:"}</small>
          </div>
          <div className="quick-role-list">
            {DEMO_ROLES.map((account) => {
              const Icon = account.icon;
              const isCurrent = account.email === user?.email;
              return (
                <button
                  type="button"
                  key={account.email}
                  className={`quick-role-item ${isCurrent ? "active" : ""}`}
                  onClick={() => handleSwitch(account)}
                  disabled={switching}
                >
                  <span className="quick-item-icon" style={{ color: account.color, backgroundColor: account.badgeBg }}>
                    <Icon size={16} />
                  </span>
                  <div className="quick-item-details">
                    <strong>{isArabic ? account.titleAr : account.titleEn}</strong>
                    <small dir="ltr">{account.email}</small>
                  </div>
                  {isCurrent && <Check size={16} className="quick-check-icon" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
