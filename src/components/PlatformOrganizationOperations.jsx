import { Building2, CheckCircle2, Search, Settings2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { FormField } from "./FormField";
import { Modal } from "./Modal";
import { organizations as seedOrganizations } from "../data/organizationData";
import { modulesForOrganization, ORGANIZATION_TYPES } from "../domain/organization";
import { useBilingualText } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";

const metrics = {
  "org-techcorp": { members: 1280, admins: 8, revenue: 1200, reviewStatus: "approved" },
  "org-elite-academy": { members: 620, admins: 12, revenue: 2500, reviewStatus: "approved" },
  "org-language-center": { members: 46, admins: 3, revenue: 0, reviewStatus: "pending_review" }
};

export function PlatformOrganizationsPage() {
  const tx = useBilingualText();
  const { showToast } = useToast();
  const [organizations, setOrganizations] = useState(() => seedOrganizations.map((item) => ({ ...item, ...metrics[item.id] })));
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => organizations.filter((item) => {
    const matchesQuery = `${item.name} ${item.nameAr}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (type === "all" || item.type === type);
  }), [organizations, query, type]);
  const pending = organizations.filter((item) => item.reviewStatus === "pending_review").length;

  const save = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const enabledModules = form.getAll("modules");
    const availableModules = ["rooms", "content", "courses", "batches", "bookings", "announcements", "meetings", "tasks", "analytics", "attendance", "exams", "payments", "live_sessions"];
    setOrganizations((current) => current.map((item) => item.id === selected.id ? {
      ...item,
      plan: form.get("plan"),
      subscriptionStatus: form.get("subscriptionStatus"),
      reviewStatus: form.get("reviewStatus"),
      enabledModules,
      disabledModules: availableModules.filter((module) => !enabledModules.includes(module))
    } : item));
    setSelected(null);
    showToast(tx("تم حفظ إعدادات المؤسسة", "Organization settings saved"), "success");
  };

  return <>
    <div className="stitch-page-head">
      <div><h1>{tx("إدارة المؤسسات", "Organization management")}</h1><p>{tx("راجع الشركات والأكاديميات، الباقات، الوحدات، وحالة التشغيل من شاشة واحدة.", "Review companies and academies, plans, modules, and operational status in one place.")}</p></div>
    </div>
    <section className="platform-org-stats">
      <article><Building2 size={21} /><span>{tx("إجمالي المؤسسات", "Organizations")}</span><strong>{organizations.length}</strong></article>
      <article><Users size={21} /><span>{tx("إجمالي الأعضاء", "Total members")}</span><strong>{organizations.reduce((sum, item) => sum + item.members, 0).toLocaleString()}</strong></article>
      <article><ShieldCheck size={21} /><span>{tx("تحتاج مراجعة", "Needs review")}</span><strong>{pending}</strong></article>
      <article><Sparkles size={21} /><span>{tx("باقات Pro", "Pro plans")}</span><strong>{organizations.filter((item) => item.plan === "Pro").length}</strong></article>
    </section>
    <div className="platform-org-toolbar">
      <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tx("ابحث عن مؤسسة...", "Search organizations...")} /></label>
      <select value={type} onChange={(event) => setType(event.target.value)} aria-label={tx("نوع المؤسسة", "Organization type")}><option value="all">{tx("كل الأنواع", "All types")}</option>{Object.entries(ORGANIZATION_TYPES).map(([value, item]) => <option value={value} key={value}>{tx(item.labelAr, item.label)}</option>)}</select>
    </div>
    <section className="platform-org-grid">
      {filtered.map((organization) => {
        const typeInfo = ORGANIZATION_TYPES[organization.type];
        const modules = modulesForOrganization(organization);
        return <article className="platform-org-card" key={organization.id}>
          <header><div className="platform-org-logo" style={{ background: organization.color }}>{organization.logo}</div><div><h2>{tx(organization.nameAr, organization.name)}</h2><p>{tx(typeInfo.labelAr, typeInfo.label)} · {organization.slug}</p></div><Badge tone={organization.reviewStatus === "approved" ? "success" : "warning"}>{organization.reviewStatus === "approved" ? tx("معتمدة", "Approved") : tx("قيد المراجعة", "Under review")}</Badge></header>
          <div className="platform-org-metrics"><span><small>{tx("الباقة", "Plan")}</small><strong>{organization.plan}</strong></span><span><small>{tx("الأعضاء", "Members")}</small><strong>{organization.members.toLocaleString()}</strong></span><span><small>{tx("المديرون", "Admins")}</small><strong>{organization.admins}</strong></span></div>
          <div className="platform-module-list">{modules.slice(0, 6).map((module) => <span key={module}>{module.replace("_", " ")}</span>)}{modules.length > 6 && <span>+{modules.length - 6}</span>}</div>
          <footer><div><Badge tone={organization.subscriptionStatus === "active" ? "success" : "primary"}>{organization.subscriptionStatus}</Badge><span>{organization.pendingActions} {tx("إجراءات معلقة", "pending actions")}</span></div><Button variant="ghost" onClick={() => setSelected(organization)}><Settings2 size={17} />{tx("إدارة", "Manage")}</Button></footer>
        </article>;
      })}
    </section>
    <OrganizationControlModal organization={selected} onClose={() => setSelected(null)} onSave={save} />
  </>;
}

function OrganizationControlModal({ organization, onClose, onSave }) {
  const tx = useBilingualText();
  if (!organization) return null;
  const availableModules = ["rooms", "content", "courses", "batches", "bookings", "announcements", "meetings", "tasks", "analytics", "attendance", "exams", "payments", "live_sessions"];
  const currentModules = modulesForOrganization(organization);
  return <Modal title={tx("إدارة المؤسسة", "Manage organization")} open={Boolean(organization)} onClose={onClose}><form className="learning-form" onSubmit={onSave}>
    <div className="organization-modal-head"><div className="platform-org-logo" style={{ background: organization.color }}>{organization.logo}</div><div><strong>{tx(organization.nameAr, organization.name)}</strong><span>{organization.slug}</span></div></div>
    <div className="learning-form-grid"><FormField label={tx("الباقة", "Plan")}><select name="plan" defaultValue={organization.plan}><option>Starter</option><option>Growth</option><option>Pro</option></select></FormField><FormField label={tx("حالة الاشتراك", "Subscription status")}><select name="subscriptionStatus" defaultValue={organization.subscriptionStatus}><option value="trial">Trial</option><option value="active">Active</option><option value="past_due">Past due</option><option value="suspended">Suspended</option></select></FormField><FormField label={tx("حالة المراجعة", "Review status")}><select name="reviewStatus" defaultValue={organization.reviewStatus}><option value="pending_review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></FormField></div>
    <fieldset className="platform-module-picker"><legend>{tx("الوحدات المفعلة", "Enabled modules")}</legend>{availableModules.map((module) => <label key={module}><input type="checkbox" name="modules" value={module} defaultChecked={currentModules.includes(module)} /><CheckCircle2 size={16} /><span>{module.replace("_", " ")}</span></label>)}</fieldset>
    <div className="learning-form-actions"><Button variant="ghost" onClick={onClose}>{tx("إلغاء", "Cancel")}</Button><Button type="submit">{tx("حفظ الإعدادات", "Save settings")}</Button></div>
  </form></Modal>;
}
