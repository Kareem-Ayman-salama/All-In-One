import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  HelpCircle,
  Inbox,
  MessageCircle,
  Phone,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { useOrganization } from "../contexts/OrganizationContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";

function sanitizePhoneForWhatsApp(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("01") && digits.length === 11) {
    return `20${digits.slice(1)}`;
  }
  if (digits.startsWith("201") && digits.length === 12) {
    return digits;
  }
  return digits;
}

function extractPhoneFromMessage(message, fallbackPhone = null) {
  if (fallbackPhone) return fallbackPhone;
  if (!message) return null;
  const match = message.match(/(?:01[0125]\d{8})|(?:\+?201[0125]\d{8})/);
  return match ? match[0] : null;
}

function statusTone(status) {
  switch (status) {
    case "open":
      return "warning";
    case "in_progress":
      return "primary";
    case "resolved":
      return "success";
    case "closed":
      return "neutral";
    default:
      return "neutral";
  }
}

export function SupportLeadsHub() {
  const tx = useBilingualText();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalPriority, setModalPriority] = useState("normal");
  const [savingNotes, setSavingNotes] = useState(false);

  const openTicketModal = (ticket) => {
    setSelectedTicket(ticket);
    setModalNotes(ticket.notes || "");
    setModalPriority(ticket.priority || "normal");
  };

  const fetchTickets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getSupportRequests();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(tx("تعذر جلب طلبات الدعم والتجربة", "Failed to load support leads"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      await api.updateSupportRequest(ticketId, { status: newStatus });
      setItems((prev) =>
        prev.map((item) => (item.id === ticketId ? { ...item, status: newStatus } : item))
      );
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      }
      showToast(tx("تم تحديث حالة الطلب بنجاح", "Ticket status updated successfully"), "success");
    } catch (err) {
      showToast(tx("فشل تحديث الحالة", "Failed to update status"), "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setSavingNotes(true);
    try {
      await api.updateSupportRequest(selectedTicket.id, {
        notes: modalNotes,
        priority: modalPriority,
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedTicket.id
            ? { ...item, notes: modalNotes, priority: modalPriority }
            : item
        )
      );
      setSelectedTicket((prev) => ({
        ...prev,
        notes: modalNotes,
        priority: modalPriority,
      }));
      showToast(
        tx("تم حفظ ملاحظات CRM والأولوية بنجاح", "CRM notes & priority saved successfully"),
        "success"
      );
    } catch (err) {
      showToast(tx("فشل حفظ الملاحظات", "Failed to save notes"), "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      const isLead =
        (item.subject && /trial|lead|تجربة/i.test(item.subject)) ||
        (item.message && /trial|lead|تجربة/i.test(item.message));
      const isDeviceReset =
        (item.subject && /device reset|جهاز/i.test(item.subject)) ||
        (item.message && /device reset|جهاز/i.test(item.message));

      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter === "leads" && !isLead) return false;
      if (typeFilter === "device_resets" && !isDeviceReset) return false;

      if (!q) return true;
      const haystack = `${item.name || ""} ${item.email || ""} ${item.subject || ""} ${item.message || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, search, statusFilter, typeFilter]);

  const metrics = useMemo(() => {
    const total = items.length;
    const open = items.filter((i) => i.status === "open").length;
    const inProgress = items.filter((i) => i.status === "in_progress").length;
    const resolved = items.filter((i) => i.status === "resolved" || i.status === "closed").length;
    const leads = items.filter((i) => /trial|lead|تجربة/i.test(`${i.subject || ""} ${i.message || ""}`)).length;
    const deviceResets = items.filter((i) => /device reset|جهاز/i.test(`${i.subject || ""} ${i.message || ""}`)).length;
    return { total, open, inProgress, resolved, leads, deviceResets };
  }, [items]);

  const statusLabel = (status) => {
    switch (status) {
      case "open":
        return tx("جديد / قيد الانتظار", "Open / Pending");
      case "in_progress":
        return tx("قيد المتابعة", "In Progress");
      case "resolved":
        return tx("تم الحل", "Resolved");
      case "closed":
        return tx("مغلق", "Closed");
      default:
        return status;
    }
  };

  return (
    <div className="support-leads-hub" style={{ display: "grid", gap: "20px" }}>
      <header className="stitch-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 6px" }}>
            {tx("مركز طلبات التجربة والدعم الفني", "Trial Leads & Support Desk")}
          </h1>
          <p style={{ color: "var(--text-muted, #888)", margin: 0 }}>
            {tx(
              "متابعة طلبات التجربة المجانية من صفحة الهبوط، وبلاغات الطلاب ومسؤولي الأكاديميات مع إمكانية الرد الفوري عبر واتساب.",
              "Track trial leads submitted via landing page, student tickets, and device reset requests with one-click WhatsApp action."
            )}
          </p>
        </div>
        <Button onClick={() => fetchTickets(true)} disabled={refreshing} variant="ghost">
          <RefreshCw size={16} className={refreshing ? "spin-animation" : ""} />
          {tx("تحديث", "Refresh")}
        </Button>
      </header>

      {/* KPI Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        <article style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted, #888)", fontSize: "13px" }}>{tx("إجمالي الطلبات", "Total Tickets")}</span>
            <Inbox size={18} style={{ color: "var(--primary, #16458F)" }} />
          </div>
          <strong style={{ fontSize: "24px", display: "block" }}>{metrics.total}</strong>
          <small style={{ color: "var(--text-muted, #888)", fontSize: "12px" }}>
            {metrics.leads} {tx("طلب تجربة", "trial leads")} · {metrics.deviceResets} {tx("إعادة تعيين جهاز", "device resets")}
          </small>
        </article>

        <article style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted, #888)", fontSize: "13px" }}>{tx("جديدة وبانتظار الرد", "Open / Unresolved")}</span>
            <AlertCircle size={18} style={{ color: "var(--warning, #f59e0b)" }} />
          </div>
          <strong style={{ fontSize: "24px", color: "var(--warning, #f59e0b)", display: "block" }}>{metrics.open}</strong>
          <small style={{ color: "var(--text-muted, #888)", fontSize: "12px" }}>{tx("تحتاج إجراء عاجل", "Action required")}</small>
        </article>

        <article style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted, #888)", fontSize: "13px" }}>{tx("قيد المتابعة", "In Progress")}</span>
            <Clock3 size={18} style={{ color: "var(--primary, #16458F)" }} />
          </div>
          <strong style={{ fontSize: "24px", color: "var(--primary, #16458F)", display: "block" }}>{metrics.inProgress}</strong>
          <small style={{ color: "var(--text-muted, #888)", fontSize: "12px" }}>{tx("جاري التواصل معهم", "Under review")}</small>
        </article>

        <article style={{ padding: "18px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--text-muted, #888)", fontSize: "13px" }}>{tx("مكتملة ومغلقة", "Resolved / Closed")}</span>
            <CheckCircle2 size={18} style={{ color: "var(--success, #10b981)" }} />
          </div>
          <strong style={{ fontSize: "24px", color: "var(--success, #10b981)", display: "block" }}>{metrics.resolved}</strong>
          <small style={{ color: "var(--text-muted, #888)", fontSize: "12px" }}>{tx("تمت معالجتها بنجاح", "Successfully handled")}</small>
        </article>
      </section>

      {/* Filter and Search Bar */}
      <section style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", background: "var(--panel)", padding: "14px 18px", border: "1px solid var(--border)", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "var(--panel-soft, rgba(255,255,255,0.04))", padding: "8px 14px", border: "1px solid var(--border)", borderRadius: "6px" }}>
            <Search size={18} style={{ color: "var(--text-muted, #888)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tx("ابحث بالاسم، الإيميل، رقم الهاتف، أو نص الطلب...", "Search by name, email, phone, or message...")}
              style={{ background: "transparent", border: 0, outline: 0, width: "100%", color: "inherit" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "6px", color: "inherit", fontSize: "13px" }}
          >
            <option value="all">{tx("جميع أنواع الطلبات", "All Request Types")}</option>
            <option value="leads">{tx("طلبات التجربة (Leads)", "Trial Leads")}</option>
            <option value="device_resets">{tx("إعادة تعيين الأجهزة", "Device Resets")}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "6px", color: "inherit", fontSize: "13px" }}
          >
            <option value="all">{tx("جميع الحالات", "All Statuses")}</option>
            <option value="open">{tx("جديدة (Open)", "Open")}</option>
            <option value="in_progress">{tx("قيد المتابعة (In Progress)", "In Progress")}</option>
            <option value="resolved">{tx("تم الحل (Resolved)", "Resolved")}</option>
            <option value="closed">{tx("مغلقة (Closed)", "Closed")}</option>
          </select>
        </div>
      </section>

      {/* Tickets Feed */}
      {loading ? (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <RefreshCw size={32} className="spin-animation" style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <p>{tx("جاري تحميل طلبات التجربة والدعم...", "Loading requests...")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 20px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <Inbox size={44} style={{ opacity: 0.3, margin: "0 auto 14px" }} />
          <h3 style={{ fontSize: "18px", margin: "0 0 6px" }}>{tx("لا توجد طلبات تطابق هذا البحث", "No requests match your criteria")}</h3>
          <p style={{ color: "var(--text-muted, #888)", fontSize: "14px", margin: 0 }}>
            {tx("جرب تعديل خيارات التصفية أو مسح عبارة البحث.", "Try clearing your search query or changing filters.")}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filtered.map((ticket) => {
            const rawPhone = extractPhoneFromMessage(ticket.message, ticket.phone);
            const waPhone = sanitizePhoneForWhatsApp(rawPhone);
            const isLead = /trial|lead|تجربة/i.test(`${ticket.subject || ""} ${ticket.message || ""}`);
            const isReset = /device reset|جهاز/i.test(`${ticket.subject || ""} ${ticket.message || ""}`);

            const waText = encodeURIComponent(
              isArabic
                ? `أهلاً بك أستاذ ${ticket.name || ""}، معك فريق منصة عين بخصوص طلبك (${ticket.subject || "منصة عين"}). كيف يمكننا مساعدتك؟`
                : `Hello ${ticket.name || ""}, this is the AIN Platform team regarding your inquiry (${ticket.subject || "AIN Platform"}). How can we help?`
            );
            const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : null;

            return (
              <article
                key={ticket.id}
                style={{
                  padding: "18px 20px",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  display: "grid",
                  gap: "14px"
                }}
              >
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        background: isLead ? "rgba(22, 69, 143, 0.12)" : isReset ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: isLead ? "var(--primary, #16458F)" : isReset ? "var(--warning, #f59e0b)" : "var(--success, #10b981)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}
                    >
                      {ticket.name ? ticket.name.slice(0, 2).toUpperCase() : <User size={18} />}
                    </span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "16px" }}>{ticket.name || tx("زائر مجهول", "Anonymous Visitor")}</strong>
                        {isLead && <Badge tone="primary">{tx("طلب تجربة مجانية", "Trial Lead")}</Badge>}
                        {isReset && <Badge tone="warning">{tx("إعادة تعيين جهاز", "Device Reset")}</Badge>}
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "3px", fontSize: "13px", color: "var(--text-muted, #888)", flexWrap: "wrap" }}>
                        <span>{ticket.email || "—"}</span>
                        {rawPhone && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Phone size={13} /> {rawPhone}
                          </span>
                        )}
                        {ticket.createdAt && <span>• {new Date(ticket.createdAt).toLocaleString(isArabic ? "ar-EG" : "en-US")}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Status selection pill */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Badge tone={statusTone(ticket.status)}>{statusLabel(ticket.status)}</Badge>
                    <select
                      value={ticket.status}
                      disabled={updatingId === ticket.id}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      style={{
                        padding: "4px 8px",
                        fontSize: "12px",
                        borderRadius: "6px",
                        background: "var(--panel-soft, rgba(255,255,255,0.05))",
                        border: "1px solid var(--border)",
                        color: "inherit"
                      }}
                    >
                      <option value="open">{tx("جديد (Open)", "Open")}</option>
                      <option value="in_progress">{tx("قيد المتابعة (In Progress)", "In Progress")}</option>
                      <option value="resolved">{tx("تم الحل (Resolved)", "Resolved")}</option>
                      <option value="closed">{tx("إغلاق (Closed)", "Closed")}</option>
                    </select>
                  </div>
                </header>

                <div style={{ background: "var(--panel-soft, rgba(255,255,255,0.02))", padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px", color: "var(--text, #333)" }}>
                    {ticket.subject}
                  </div>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted, #777)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {ticket.message?.length > 220 ? `${ticket.message.slice(0, 220)}...` : ticket.message}
                  </p>
                  {ticket.notes && (
                    <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(22, 69, 143, 0.08)", border: "1px dashed rgba(22, 69, 143, 0.3)", borderRadius: "6px", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center" }}>
                      <FileText size={14} style={{ color: "var(--primary, #16458F)", flexShrink: 0 }} />
                      <span style={{ color: "var(--text, #333)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <strong>{tx("ملاحظة CRM:", "CRM Note:")}</strong> {ticket.notes}
                      </span>
                    </div>
                  )}
                </div>

                <footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button variant="ghost" onClick={() => openTicketModal(ticket)} style={{ padding: "6px 12px", fontSize: "13px" }}>
                      {tx("عرض كامل التفاصيل", "View Full Details")}
                    </Button>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {waUrl && (
                      <Button
                        as="a"
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#25D366",
                          color: "#fff",
                          borderColor: "#25D366",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: "600"
                        }}
                      >
                        <MessageCircle size={16} />
                        {tx("مراسلة عبر واتساب", "WhatsApp Chat")}
                      </Button>
                    )}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedTicket && (
        <Modal
          open={Boolean(selectedTicket)}
          title={selectedTicket.subject || tx("تفاصيل الطلب", "Request Details")}
          onClose={() => setSelectedTicket(null)}
        >
          <div style={{ display: "grid", gap: "16px", padding: "10px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <small style={{ color: "var(--text-muted, #888)", display: "block" }}>{tx("المرسل", "Sender")}</small>
                <strong>{selectedTicket.name || "—"}</strong>
              </div>
              <div>
                <small style={{ color: "var(--text-muted, #888)", display: "block" }}>{tx("البريد الإلكتروني", "Email")}</small>
                <strong>{selectedTicket.email || "—"}</strong>
              </div>
              <div>
                <small style={{ color: "var(--text-muted, #888)", display: "block" }}>{tx("الحالة الحالية", "Current Status")}</small>
                <Badge tone={statusTone(selectedTicket.status)}>{statusLabel(selectedTicket.status)}</Badge>
              </div>
              <div>
                <small style={{ color: "var(--text-muted, #888)", display: "block" }}>{tx("تاريخ الإرسال", "Date")}</small>
                <span>{selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString(isArabic ? "ar-EG" : "en-US") : "—"}</span>
              </div>
            </div>

            <div>
              <small style={{ color: "var(--text-muted, #888)", display: "block", marginBottom: "6px" }}>{tx("نص الرسالة والبيانات المدخلة", "Message & Submitted Data")}</small>
              <div style={{ padding: "14px", background: "var(--panel-soft, rgba(255,255,255,0.03))", border: "1px solid var(--border)", borderRadius: "8px", whiteSpace: "pre-wrap", lineHeight: "1.7", fontSize: "14px" }}>
                {selectedTicket.message}
              </div>
            </div>

            {/* CRM Notes & Priority Editor */}
            <div style={{ background: "rgba(22, 69, 143, 0.04)", border: "1px solid rgba(22, 69, 143, 0.2)", borderRadius: "8px", padding: "14px", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px", color: "var(--primary, #16458F)" }}>
                  <FileText size={15} />
                  {tx("ملاحظات CRM الداخلية وسجل المتابعة", "Internal CRM Notes & Follow-up")}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <small style={{ color: "var(--text-muted, #777)" }}>{tx("الأولوية:", "Priority:")}</small>
                  <select
                    value={modalPriority}
                    onChange={(e) => setModalPriority(e.target.value)}
                    style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid var(--border)", background: "var(--panel)", color: "inherit" }}
                  >
                    <option value="low">{tx("منخفضة (Low)", "Low")}</option>
                    <option value="normal">{tx("عادية (Normal)", "Normal")}</option>
                    <option value="high">{tx("مرتفعة (High)", "High")}</option>
                    <option value="urgent">{tx("عاجلة جداً (Urgent)", "Urgent")}</option>
                  </select>
                </div>
              </div>
              <textarea
                rows={3}
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder={tx("أدخل ملاحظات الفريق الداخلية (مثل: تم الاتصال، تم تفعيل تجربة مجانية، تفاصيل التواصل، إلخ)...", "Enter internal team notes (e.g. called customer, trial issued, follow-up date)...")}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--panel)", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="primary" onClick={handleSaveNotes} disabled={savingNotes} style={{ fontSize: "13px", padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Save size={14} />
                  {savingNotes ? tx("جاري الحفظ...", "Saving...") : tx("حفظ ملاحظات CRM", "Save CRM Notes")}
                </Button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "14px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px" }}>{tx("تغيير الحالة:", "Change status:")}</span>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "6px", background: "var(--panel)", border: "1px solid var(--border)", color: "inherit" }}
                >
                  <option value="open">{tx("جديد (Open)", "Open")}</option>
                  <option value="in_progress">{tx("قيد المتابعة (In Progress)", "In Progress")}</option>
                  <option value="resolved">{tx("تم الحل (Resolved)", "Resolved")}</option>
                  <option value="closed">{tx("مغلق (Closed)", "Closed")}</option>
                </select>
              </div>

              {extractPhoneFromMessage(selectedTicket.message, selectedTicket.phone) && (
                <Button
                  as="a"
                  href={`https://wa.me/${sanitizePhoneForWhatsApp(extractPhoneFromMessage(selectedTicket.message, selectedTicket.phone))}?text=${encodeURIComponent(
                    isArabic
                      ? `أهلاً بك أستاذ ${selectedTicket.name || ""}، معك فريق منصة عين بخصوص طلبك (${selectedTicket.subject || "منصة عين"}).`
                      : `Hello ${selectedTicket.name || ""}, this is the AIN Platform team regarding your inquiry.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: "#25D366", color: "#fff", borderColor: "#25D366" }}
                >
                  <MessageCircle size={16} /> {tx("مراسلة واتساب", "WhatsApp")}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function OrganizationCrmPipeline() {
  const tx = useBilingualText();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { showToast } = useToast();
  const { activeOrganization } = useOrganization();
  const organizationId = activeOrganization?.id;

  const [leads, setLeads] = useState([
    {
      id: "lead-1",
      name: "زياد سامي",
      nameEn: "Ziad Sami",
      email: "ziad.sami@gmail.com",
      phone: "01099887766",
      subject: "استفسار عن كورس تطوير واجهات الويب Full-Stack",
      subjectEn: "Inquiry about Full-Stack Web Development Course",
      notes: "تم التواصل هاتفياً ومتحمس للدفعة المسائية القادمة.",
      notesEn: "Contacted via phone, enthusiastic about the upcoming evening cohort.",
      status: "contacted",
      priority: "high",
      createdAt: "2026-09-18 14:30",
    },
    {
      id: "lead-2",
      name: "سارة خليل",
      nameEn: "Sara Khalil",
      email: "sara.khalil@outlook.com",
      phone: "01233445566",
      subject: "حجز مقعد في دفعة بايثون وتحليل البيانات",
      subjectEn: "Seat reservation in Python & Data Analysis cohort",
      notes: "بانتظار تأكيد طريقة الدفع (فودافون كاش أو بطاقة).",
      notesEn: "Pending payment method confirmation (Vodafone Cash or Card).",
      status: "booking",
      priority: "urgent",
      createdAt: "2026-09-19 10:15",
    },
    {
      id: "lead-3",
      name: "حسام الدين ممدوح",
      nameEn: "Hossam El-Din Mamdouh",
      email: "hossam.m@yahoo.com",
      phone: "01122334455",
      subject: "سؤال عن الخطة الشهرية والدورات المتاحة",
      subjectEn: "Question about monthly plan and available curricula",
      notes: "طلب إرسال المنهج عبر واتساب.",
      notesEn: "Requested curriculum outline via WhatsApp.",
      status: "lead",
      priority: "normal",
      createdAt: "2026-09-20 09:00",
    },
    {
      id: "lead-4",
      name: "مروة عبد العزيز",
      nameEn: "Marwa Abdelaziz",
      email: "marwa.abdelaziz@gmail.com",
      phone: "01555667788",
      subject: "التسجيل في برنامج الذكاء الاصطناعي للأعمال",
      subjectEn: "Enrollment in AI for Business program",
      notes: "تم استلام الرسوم واعتماد المقعد بنجاح.",
      notesEn: "Tuition received and seat confirmed successfully.",
      status: "enrolled",
      priority: "normal",
      createdAt: "2026-09-17 18:20",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchLeads = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const data = await api.getOrganizationLeads(organizationId);
      if (Array.isArray(data) && data.length > 0) {
        setLeads(data);
      }
    } catch {
      // Keep state if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [organizationId]);

  const handleStageChange = async (leadId, newStage) => {
    try {
      if (organizationId) {
        await api.updateOrganizationLead(organizationId, leadId, { status: newStage });
      }
      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? { ...item, status: newStage } : item))
      );
      if (selectedLead?.id === leadId) {
        setSelectedLead((prev) => ({ ...prev, status: newStage }));
      }
      showToast(tx("تم تحديث مرحلة العميل بنجاح", "Lead stage updated"), "success");
    } catch {
      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? { ...item, status: newStage } : item))
      );
      showToast(tx("تم التحديث محلياً", "Updated locally"), "info");
    }
  };

  const handleConvert = async (leadId) => {
    try {
      if (organizationId) {
        await api.convertOrganizationLead(organizationId, leadId);
      }
      setLeads((prev) =>
        prev.map((item) =>
          item.id === leadId
            ? { ...item, status: "enrolled", notes: `${item.notes || ""}\n${tx("[تم التحويل كطالب مسجل]", "[Converted to enrolled student]")}` }
            : item
        )
      );
      showToast(tx("🎉 مبروك! تم تحويل العميل إلى طالب مسجل بنجاح", "Lead converted to enrolled student!"), "success");
    } catch {
      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? { ...item, status: "enrolled" } : item))
      );
      showToast(tx("تم التحويل لطالب مسجل", "Converted to enrolled"), "success");
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newLead = {
      id: `lead-${Date.now()}`,
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      subject: form.get("subject") || tx("اهتمام بكورس جديد", "Course interest"),
      notes: form.get("notes") || "",
      priority: form.get("priority") || "normal",
      status: "lead",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    try {
      if (organizationId) {
        const created = await api.createOrganizationLead(organizationId, newLead);
        if (created?.id) newLead.id = created.id;
      }
      setLeads((prev) => [newLead, ...prev]);
      showToast(tx("تمت إضافة العميل المحتمل بنجاح", "Lead added successfully"), "success");
      setCreateModalOpen(false);
    } catch {
      setLeads((prev) => [newLead, ...prev]);
      showToast(tx("تمت الإضافة بنجاح", "Lead added"), "success");
      setCreateModalOpen(false);
    }
  };

  const STAGES = [
    { id: "lead", label: tx("مهتم جديد", "New Lead"), color: "#64748b" },
    { id: "contacted", label: tx("تم التواصل", "Contacted"), color: "#0284c7" },
    { id: "interested", label: tx("مهتم بالكورس", "Interested"), color: "#8b5cf6" },
    { id: "booking", label: tx("حجز مبدئي", "Booking"), color: "#f59e0b" },
    { id: "approved", label: tx("معتمد للدفع", "Approved"), color: "#10b981" },
    { id: "enrolled", label: tx("مسجل بالكورس", "Enrolled"), color: "#16458F" },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return leads.filter((item) => {
      if (activeStage !== "all" && item.status !== activeStage) return false;
      if (!q) return true;
      const haystack = `${item.name || ""} ${item.email || ""} ${item.phone || ""} ${item.subject || ""} ${item.notes || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, search, activeStage]);

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <header className="stitch-page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 6px" }}>
            {tx("مسار إدارة المبيعات والعملاء المحتملين (CRM Pipeline)", "CRM Pipeline & Leads Management")}
          </h1>
          <p style={{ color: "var(--text-muted, #888)", margin: 0 }}>
            {tx(
              "تتبع رحلة الطلاب المهتمين من أول رسالة حتى التسجيل الفعلي بالكورس، مع التواصل الفوري عبر واتساب ورصد الملاحظات.",
              "Track prospective student lifecycle from initial inquiry to enrollment with 1-click WhatsApp and progress tracking."
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button onClick={() => fetchLeads()} variant="ghost">
            <RefreshCw size={16} className={loading ? "spin-animation" : ""} /> {tx("تحديث", "Refresh")}
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Sparkles size={16} /> {tx("إضافة عميل محتمل", "Add Lead")}
          </Button>
        </div>
      </header>

      {/* KPI Cards */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        <article style={{ padding: "16px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <small style={{ color: "var(--text-muted, #888)" }}>{tx("إجمالي الاستفسارات", "Total Inquiries")}</small>
          <strong style={{ fontSize: "24px", display: "block", marginTop: "4px" }}>{leads.length}</strong>
        </article>
        <article style={{ padding: "16px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <small style={{ color: "var(--text-muted, #888)" }}>{tx("تحت المتابعة والتواصل", "In Contact & Interested")}</small>
          <strong style={{ fontSize: "24px", color: "#0284c7", display: "block", marginTop: "4px" }}>
            {leads.filter((x) => ["lead", "contacted", "interested"].includes(x.status)).length}
          </strong>
        </article>
        <article style={{ padding: "16px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <small style={{ color: "var(--text-muted, #888)" }}>{tx("حجوزات بانتظار الدفع", "Booking Requests")}</small>
          <strong style={{ fontSize: "24px", color: "#f59e0b", display: "block", marginTop: "4px" }}>
            {leads.filter((x) => ["booking", "approved"].includes(x.status)).length}
          </strong>
        </article>
        <article style={{ padding: "16px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <small style={{ color: "var(--text-muted, #888)" }}>{tx("تم تسجيلهم بنجاح 🎉", "Enrolled Students")}</small>
          <strong style={{ fontSize: "24px", color: "#10b981", display: "block", marginTop: "4px" }}>
            {leads.filter((x) => x.status === "enrolled").length}
          </strong>
        </article>
      </section>

      {/* Pipeline Stages Bar */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px" }}>
        <button
          type="button"
          onClick={() => setActiveStage("all")}
          style={{
            padding: "8px 14px",
            borderRadius: "20px",
            border: activeStage === "all" ? "2px solid var(--primary, #16458F)" : "1px solid var(--border)",
            background: activeStage === "all" ? "var(--primary-subtle, #e0f2fe)" : "var(--panel)",
            fontWeight: activeStage === "all" ? "bold" : "normal",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {tx("الكل", "All")} ({leads.length})
        </button>
        {STAGES.map((stage) => {
          const count = leads.filter((x) => x.status === stage.id).length;
          const isSelected = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                border: isSelected ? `2px solid ${stage.color}` : "1px solid var(--border)",
                background: isSelected ? `${stage.color}15` : "var(--panel)",
                color: isSelected ? stage.color : "inherit",
                fontWeight: isSelected ? "bold" : "normal",
                cursor: "pointer",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {stage.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Filter */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", [isArabic ? "right" : "left"]: "12px", top: "12px", color: "var(--text-muted, #888)" }} />
        <input
          type="search"
          placeholder={tx("ابحث بالاسم، الإيميل، رقم الواتساب، أو محتوى الاستفسار...", "Search by name, email, phone, or inquiry notes...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: isArabic ? "10px 38px 10px 14px" : "10px 14px 10px 38px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "inherit",
          }}
        />
      </div>

      {/* Leads Cards Grid */}
      <div style={{ display: "grid", gap: "12px" }}>
        {filtered.map((lead) => {
          const stageInfo = STAGES.find((s) => s.id === lead.status) || STAGES[0];
          const phone = sanitizePhoneForWhatsApp(lead.phone);
          return (
            <article
              key={lead.id}
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "18px",
                display: "grid",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: `${stageInfo.color}20`,
                      color: stageInfo.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {lead.name ? (isArabic ? lead.name[0] : (lead.nameEn ? lead.nameEn[0] : lead.name[0])) : "L"}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 3px", fontSize: "16px", fontWeight: "bold" }}>
                      {isArabic ? lead.name : (lead.nameEn || lead.name)}
                    </h3>
                    <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text-muted, #888)", flexWrap: "wrap" }}>
                      <span>{lead.email}</span>
                      {lead.phone && <span>· {lead.phone}</span>}
                      {lead.createdAt && <span>· {lead.createdAt}</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <select
                    value={lead.status}
                    onChange={(e) => handleStageChange(lead.id, e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: `1.5px solid ${stageInfo.color}`,
                      color: stageInfo.color,
                      fontWeight: "bold",
                      fontSize: "13px",
                      background: "var(--panel)",
                    }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  {lead.status !== "enrolled" && (
                    <Button onClick={() => handleConvert(lead.id)}>
                      <CheckCircle2 size={16} /> {tx("اعتماد كطالب مسجل", "Convert to Student")}
                    </Button>
                  )}
                </div>
              </div>

              <div style={{ background: "var(--surface-subtle, #f8fafc)", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
                <strong>{isArabic ? lead.subject : (lead.subjectEn || lead.subject)}</strong>
                {(lead.notes || lead.notesEn) && (
                  <p style={{ margin: "6px 0 0", color: "var(--text-muted, #64748b)" }}>
                    {isArabic ? lead.notes : (lead.notesEn || lead.notes)}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Badge tone={lead.priority === "urgent" ? "danger" : lead.priority === "high" ? "warning" : "neutral"}>
                    {lead.priority || "normal"}
                  </Badge>
                  <Button variant="ghost" onClick={() => setSelectedLead(lead)}>
                    <FileText size={15} /> {tx("تفاصيل الملاحظات", "Notes & Log")}
                  </Button>
                </div>

                {phone && (
                  <Button
                    as="a"
                    href={`https://wa.me/${phone}?text=${encodeURIComponent(
                      isArabic
                        ? `مرحباً بك أستاذ ${lead.name}، معك إدارة ${activeOrganization?.name || "الأكاديمية"} بخصوص استفسارك عن الكورسات التدريبية.`
                        : `Hello ${lead.nameEn || lead.name}, this is ${activeOrganization?.name || "our academy"} team regarding your inquiry.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "#25D366", color: "#fff", borderColor: "#25D366" }}
                  >
                    <MessageCircle size={16} /> {tx("محادثة واتساب مباشرة", "WhatsApp Chat")}
                  </Button>
                )}
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted, #888)" }}>
            <Inbox size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
            <p>{tx("لا توجد استفسارات أو عملاء محتملون في هذا المسار حالياً.", "No leads match this stage filter.")}</p>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {createModalOpen && (
        <Modal title={tx("إضافة عميل محتمل جديد لمسار المبيعات", "Add New Lead to CRM")} open onClose={() => setCreateModalOpen(false)}>
          <form onSubmit={handleCreateLead} style={{ display: "grid", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold" }}>
                  {tx("اسم العميل أو الطالب *", "Full Name *")}
                </label>
                <input name="name" required style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold" }}>
                  {tx("البريد الإلكتروني *", "Email Address *")}
                </label>
                <input name="email" type="email" required style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold" }}>
                  {tx("رقم الهاتف / الواتساب", "Phone / WhatsApp")}
                </label>
                <input name="phone" placeholder="01xxxxxxxxx" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold" }}>
                  {tx("الأولوية", "Priority")}
                </label>
                <select name="priority" defaultValue="normal" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <option value="normal">{tx("عادية", "Normal")}</option>
                  <option value="high">{tx("عالية", "High")}</option>
                  <option value="urgent">{tx("عاجلة", "Urgent")}</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold" }}>
                {tx("الكورس أو موضوع الاستفسار", "Course / Inquiry Subject")}
              </label>
              <input name="subject" placeholder={tx("مثال: مهتم بكورس الذكاء الاصطناعي", "e.g. AI Mastery Course")} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: "bold" }}>
                {tx("ملاحظات المتابعة الأولية", "Follow-up Notes")}
              </label>
              <textarea name="notes" rows={3} style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)}>
                {tx("إلغاء", "Cancel")}
              </Button>
              <Button type="submit">
                {tx("حفظ وإضافة للمسار", "Save Lead")}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Selected Lead Notes Modal */}
      {selectedLead && (
        <Modal title={selectedLead.name} open onClose={() => setSelectedLead(null)}>
          <div style={{ display: "grid", gap: "14px" }}>
            <div>
              <strong>{tx("موضوع الاستفسار:", "Subject:")}</strong> {selectedLead.subject}
            </div>
            <div>
              <strong>{tx("التواصل:", "Contact:")}</strong> {selectedLead.email} {selectedLead.phone && `· ${selectedLead.phone}`}
            </div>
            <div style={{ background: "var(--surface-subtle, #f8fafc)", padding: "12px", borderRadius: "8px" }}>
              <strong>{tx("سجل الملاحظات:", "Notes Log:")}</strong>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-line" }}>{selectedLead.notes || tx("لا توجد ملاحظات مسجلة.", "No notes yet.")}</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button variant="ghost" onClick={() => setSelectedLead(null)}>
                {tx("إغلاق", "Close")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

