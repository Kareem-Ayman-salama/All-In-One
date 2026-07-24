import { ArrowRight, Building2, CheckCircle2, LogOut, Plus, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../contexts/AuthContext";
import { useBilingualText } from "../contexts/LanguageContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { ORGANIZATION_ROLES, ORGANIZATION_TYPES, roleDestination } from "../domain/organization";

export function WorkspaceSelectionPage() {
  const { user, logout } = useAuth();
  const { loading, memberships, activeOrganization, selectOrganization } = useOrganization();
  const tx = useBilingualText();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const autoOpen = new URLSearchParams(location.search).get("auto") === "1";

  useEffect(() => {
    if (!loading && autoOpen && memberships.length === 1) {
      const membership = selectOrganization(memberships[0].organizationId);
      if (membership) navigate(roleDestination(membership.role), { replace: true });
    }
  }, [autoOpen, loading, memberships, navigate, selectOrganization]);

  const filtered = useMemo(() => memberships.filter((membership) => {
    const organization = membership.organization;
    return `${organization.name} ${organization.nameAr} ${organization.type}`.toLowerCase().includes(query.toLowerCase());
  }), [memberships, query]);

  const openWorkspace = (membership) => {
    const selected = selectOrganization(membership.organizationId);
    if (selected) navigate(roleDestination(selected.role));
  };

  if (loading) return <div className="workspace-selection-page"><div className="workspace-selection-shell"><div className="workspace-selection-skeleton" /><div className="workspace-picker-grid"><div className="skeleton-card" /><div className="skeleton-card" /></div></div></div>;

  return (
    <main className="workspace-selection-page">
      <section className="workspace-selection-shell">
        <header className="workspace-selection-topbar">
          <Link className="workspace-selection-brand" to="/"><img src="/images/aio-logo-64.png" alt="" /><strong>AIO</strong></Link>
          <div><span>{user.email}</span><button type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }}><LogOut size={17} /> {tx("تسجيل الخروج", "Sign out")}</button></div>
        </header>

        <div className="workspace-selection-heading">
          <span><ShieldCheck size={18} /> {tx("دخول آمن ومتعدد المساحات", "Secure multi-workspace access")}</span>
          <h1>{tx("اختر مساحة العمل", "Choose a workspace")}</h1>
          <p>{tx("دورك وصلاحياتك وأدواتك تتغير تلقائيًا حسب الشركة أو الأكاديمية التي تفتحها.", "Your role, permissions, and enabled tools update automatically for each company or academy.")}</p>
        </div>

        {memberships.length > 1 && <label className="workspace-selection-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("ابحث باسم الشركة أو الأكاديمية", "Search companies and academies")} /></label>}

        <div className="workspace-selection-grid">
          {filtered.map((membership) => {
            const organization = membership.organization;
            const type = ORGANIZATION_TYPES[organization.type];
            const selected = activeOrganization?.id === organization.id;
            return (
              <article className={selected ? "selected" : ""} key={organization.id}>
                <div className="workspace-card-head">
                  <span className="workspace-card-logo" style={{ backgroundColor: organization.color }}>{organization.logo}</span>
                  <div><h2>{tx(organization.nameAr, organization.name)}</h2><p>{tx(type?.labelAr, type?.label)}</p></div>
                  {selected && <CheckCircle2 size={20} />}
                </div>
                <div className="workspace-card-meta">
                  <span><small>{tx("دورك", "Your role")}</small><strong>{formatRole(membership.role, tx)}</strong></span>
                  <span><small>{tx("الباقة", "Plan")}</small><strong>{organization.plan}</strong></span>
                </div>
                <div className="workspace-card-status"><Badge tone={organization.subscriptionStatus === "active" ? "success" : "warning"}>{organization.subscriptionStatus === "active" ? tx("اشتراك نشط", "Active subscription") : tx("فترة تجريبية", "Trial")}</Badge>{organization.pendingActions > 0 && <span>{organization.pendingActions} {tx("إجراءات معلقة", "pending actions")}</span>}</div>
                <Button onClick={() => openWorkspace(membership)}>{selected ? tx("العودة إلى المساحة", "Return to workspace") : tx("فتح مساحة العمل", "Open workspace")}<ArrowRight size={17} /></Button>
              </article>
            );
          })}
        </div>

        {!filtered.length && <div className="workspace-selection-empty"><Search size={30} /><strong>{tx("لم نجد مساحة بهذا الاسم", "No workspace matches your search")}</strong><button type="button" onClick={() => setQuery("")}>{tx("مسح البحث", "Clear search")}</button></div>}

        <footer className="workspace-selection-footer"><div><strong>{tx("هل تريد إنشاء مؤسسة جديدة؟", "Need another workspace?")}</strong><span>{tx("أنشئ شركة أو أكاديمية وأضف فريقك لاحقًا.", "Create a company or academy and invite your team later.")}</span></div><Button as={Link} to="/register-company" variant="ghost"><Plus size={17} /> {tx("إنشاء مؤسسة", "Create organization")}</Button></footer>
      </section>
    </main>
  );
}

function formatRole(role, tx) {
  const arabic = {
    organization_owner: "مالك المؤسسة",
    organization_admin: "مدير المؤسسة",
    instructor: "مدرس",
    staff: "موظف إداري",
    student: "طالب",
    member: "عضو"
  };
  return tx(arabic[role], ORGANIZATION_ROLES[role] || role);
}
