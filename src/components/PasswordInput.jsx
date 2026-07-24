import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function PasswordInput({ value, onChange, autoComplete = "current-password", ...props }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="auth-input-wrap">
      <LockKeyhole size={18} aria-hidden="true" />
      <input
        {...props}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="password-visibility"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t.common.hidePassword : t.common.showPassword}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function PasswordStrength({ password }) {
  const { language, t } = useLanguage();
  const checks = [
    password.length >= 10,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password)
  ];
  const score = checks.filter(Boolean).length;
  const labels = language === "ar" ? ["ضعيفة", "مقبولة", "جيدة", "قوية"] : ["Weak", "Fair", "Good", "Strong"];

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength-bars">
        {[1, 2, 3].map((level) => <span className={score >= level ? `active level-${score}` : ""} key={level} />)}
      </div>
      <small>{password ? labels[score] : t.auth.passwordRules}</small>
    </div>
  );
}
