import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useBilingualText } from "../contexts/LanguageContext";

export function ForbiddenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tx = useBilingualText();
  const home = user?.role === "super-admin" ? "/super-admin/dashboard" : user?.role === "tenant-admin" ? "/tenant-admin/dashboard" : "/end-user/home";

  return (
    <AuthLayout>
      <section className="not-found-pro forbidden-pro">
        <span><LockKeyhole size={38} /></span>
        <small>403</small>
        <h1>{tx("ليس لديك صلاحية للوصول", "You do not have access")}</h1>
        <p>{tx("هذه الصفحة تتطلب صلاحية مختلفة. لم يتم تغيير أي بيانات في حسابك.", "This page requires a different permission. No account data was changed.")}</p>
        <div className="workspace-secondary-actions">
          <Button onClick={() => navigate(home)}><ArrowLeft size={17} /> {tx("العودة لمساحة العمل", "Back to workspace")}</Button>
          <Button as={Link} to="/support" variant="ghost">{tx("طلب المساعدة", "Request help")}</Button>
        </div>
      </section>
    </AuthLayout>
  );
}
