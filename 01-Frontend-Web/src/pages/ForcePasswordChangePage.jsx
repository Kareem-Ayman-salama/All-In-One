import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthHeader, AuthLayout, AuthStatus } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { PasswordInput, PasswordStrength } from "../components/PasswordInput";
import { useAuth } from "../contexts/AuthContext";

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export function ForcePasswordChangePage() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: "", password: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!strongPasswordPattern.test(form.password)) return setMessage("استخدمي 12 حرفاً على الأقل تشمل حرفاً كبيراً وصغيراً ورقماً ورمزاً.");
    if (form.password !== form.confirm) return setMessage("كلمتا المرور غير متطابقتين.");
    setLoading(true);
    setMessage("");
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.password });
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (error) {
      setMessage(error.message || "تعذر تغيير كلمة المرور. تأكدي من كلمة المرور المؤقتة.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-panel-card" dir="rtl">
        <AuthHeader icon={<KeyRound size={23} />} title="أنشئي كلمة مرور خاصة بك" subtitle="هذه خطوة أمان مطلوبة مرة واحدة قبل فتح لوحة أكاديميتك." />
        <form className="auth-form" onSubmit={submit}>
          <FormField label="كلمة المرور المؤقتة"><PasswordInput autoComplete="current-password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} /></FormField>
          <FormField label="كلمة المرور الجديدة"><PasswordInput autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /><PasswordStrength password={form.password} /></FormField>
          <FormField label="تأكيد كلمة المرور الجديدة"><PasswordInput autoComplete="new-password" value={form.confirm} onChange={(event) => setForm((current) => ({ ...current, confirm: event.target.value }))} /></FormField>
          <AuthStatus message={message} />
          <Button className="auth-submit" type="submit" loading={loading}>حفظ وفتح الأكاديمية</Button>
        </form>
      </div>
    </AuthLayout>
  );
}
