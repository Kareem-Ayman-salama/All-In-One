import { Building2, KeyRound, LockKeyhole } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthHeader, AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { useLanguage } from "../contexts/LanguageContext";

export function RolePicker() {
  const { language } = useLanguage();
  const copy = language === "ar" ? {
    title: "ابدأ بالطريقة المناسبة لك",
    subtitle: "لن نطلب منك اختيار صلاحيتك. حسابك أو دعوتك هما اللذان يحددان تجربتك تلقائياً.",
    create: "إنشاء مساحة شركة",
    createText: "لأصحاب الشركات والفرق الذين يريدون بدء مساحة عمل جديدة وإدارة أعضائها.",
    createAction: "بدء إعداد الشركة",
    join: "الانضمام إلى شركة",
    joinText: "للموظفين والأعضاء الذين لديهم رابط دعوة أو رمز من مسؤول الشركة.",
    joinAction: "إدخال رمز الدعوة",
    secure: "لا يمكن إنشاء حساب مسؤول منصة من التسجيل العام. هذه الصلاحية تُدار داخلياً فقط."
  } : {
    title: "Start with the right path",
    subtitle: "You never choose your own role. Your account or invitation automatically determines the correct experience.",
    create: "Create a company workspace",
    createText: "For company owners and teams starting a new workspace and managing its members.",
    createAction: "Start company setup",
    join: "Join a company",
    joinText: "For employees and members with an invitation link or code from their company admin.",
    joinAction: "Enter invitation code",
    secure: "Platform admin accounts cannot be created through public registration. That permission is managed internally."
  };

  return (
    <AuthLayout compact>
      <div className="auth-panel-card workspace-picker-pro">
        <AuthHeader icon={<KeyRound size={23} />} title={copy.title} subtitle={copy.subtitle} />
        <div className="workspace-picker-grid">
          <article><span><Building2 size={22} /></span><h2>{copy.create}</h2><p>{copy.createText}</p><Button as={Link} to="/register-company">{copy.createAction}</Button></article>
          <article><span><KeyRound size={22} /></span><h2>{copy.join}</h2><p>{copy.joinText}</p><Button as={Link} to="/join" variant="ghost">{copy.joinAction}</Button></article>
        </div>
        <div className="workspace-security-note"><LockKeyhole size={18} /><span>{copy.secure}</span></div>
      </div>
    </AuthLayout>
  );
}
