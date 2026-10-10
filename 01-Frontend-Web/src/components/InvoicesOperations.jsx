import {
  AlertCircle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Eye,
  Printer,
  ReceiptText,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBilingualText, useLanguage } from "../contexts/LanguageContext";
import { apiService } from "../services/api";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";

/**
 * Displays billing history, due dates, renewal notices, and printable invoices.
 */
export function InvoicesOperations() {
  const { language, direction } = useLanguage();
  const tx = useBilingualText();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const locale = language === "ar" ? "ar-EG" : "en-US";

  useEffect(() => {
    let mounted = true;
    apiService.getInvoices()
      .then((data) => {
        if (mounted) setInvoices(Array.isArray(data) ? data : data?.data || []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const money = (minor = 0, currency = "EGP") => `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(minor / 100)} ${currency === "EGP" ? tx("ج.م", "EGP") : currency}`;
  const date = (value) => value ? new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value)) : "—";
  const daysUntil = (value) => value ? Math.ceil((new Date(value) - new Date()) / 86400000) : null;
  const totals = useMemo(() => ({
    paid: invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.totalMinor || 0), 0),
    due: invoices.filter((invoice) => invoice.status !== "paid").reduce((sum, invoice) => sum + Number(invoice.totalMinor || 0), 0),
    pending: invoices.filter((invoice) => invoice.status !== "paid").length
  }), [invoices]);

  const printInvoice = () => {
    document.body.classList.add("printing-invoice");
    window.print();
    window.setTimeout(() => document.body.classList.remove("printing-invoice"), 100);
  };

  return (
    <div className="invoice-workspace" dir={direction}>
      <div className="stitch-page-head invoice-page-head"><div><span className="page-eyebrow"><ReceiptText size={15} />{tx("الحساب المالي", "Billing center")}</span><h1>{tx("الفواتير والمدفوعات", "Invoices & payments")}</h1><p>{tx("تابع المدفوعات ومواعيد الاستحقاق والتجديد، وافتح نسخة جاهزة للطباعة لكل فاتورة.", "Track payments, due dates, renewals, and print-ready invoice copies.")}</p></div></div>
      <section className="invoice-summary-grid">
        <article><span><Wallet /></span><div><small>{tx("إجمالي المدفوع", "Total paid")}</small><strong>{money(totals.paid)}</strong></div></article>
        <article className={totals.pending ? "attention" : ""}><span><CreditCard /></span><div><small>{tx("مبالغ مستحقة", "Amount due")}</small><strong>{money(totals.due)}</strong></div></article>
        <article><span><BellRing /></span><div><small>{tx("فواتير تحتاج إجراء", "Needs action")}</small><strong>{totals.pending}</strong></div></article>
      </section>
      {loading ? <div className="operation-loading">{tx("جاري تحميل الفواتير...", "Loading invoices...")}</div> : !invoices.length ? <EmptyState title={tx("لا توجد فواتير", "No invoices yet")} message={tx("ستظهر الفواتير وإيصالات الدفع هنا.", "Invoices and payment receipts will appear here.")} /> : (
        <section className="invoice-list">
          <header><div><h2>{tx("سجل الفواتير", "Invoice history")}</h2><p>{tx("مرتبة حسب أحدث عملية.", "Ordered by latest activity.")}</p></div><span>{invoices.length} {tx("فاتورة", "invoices")}</span></header>
          <div className="invoice-card-grid">{invoices.map((invoice) => {
            const pending = invoice.status !== "paid";
            const remaining = daysUntil(invoice.dueAt || invoice.renewalAt);
            return <article className={`invoice-record ${pending ? "invoice-pending" : "invoice-paid"}`} key={invoice.id}>
              <header><span className="invoice-record-icon"><ReceiptText /></span><div><small>{invoice.invoiceNumber}</small><h3>{invoice.organization?.nameAr || invoice.organization?.name || "AIN Platform"}</h3></div><Badge tone={pending ? "warning" : "success"}>{pending ? tx("مطلوب السداد", "Payment due") : tx("تم السداد", "Paid")}</Badge></header>
              <div className="invoice-amount"><strong>{money(invoice.totalMinor, invoice.currency)}</strong><span>{invoice.itemsBreakdown?.[0]?.description || tx("اشتراك تعليمي", "Education subscription")}</span></div>
              <dl><div><dt>{tx("تاريخ الإصدار", "Issued")}</dt><dd>{date(invoice.issuedAt)}</dd></div><div><dt>{pending ? tx("آخر موعد للسداد", "Payment due") : tx("تاريخ السداد", "Paid on")}</dt><dd>{date(pending ? invoice.dueAt : invoice.paidAt || invoice.issuedAt)}</dd></div></dl>
              {pending && <div className={`invoice-reminder ${remaining != null && remaining <= 3 ? "urgent" : ""}`}><CalendarClock size={17} /><span>{remaining >= 0 ? tx(`متبقي ${remaining} يوم على موعد السداد، وسيصلك تذكير قبل التجديد.`, `${remaining} days until payment. A renewal reminder is scheduled.`) : tx("فات موعد السداد. راجع الأكاديمية لتجنب توقف الوصول.", "Payment is overdue. Contact the academy to avoid access interruption.")}</span></div>}
              <footer><Button variant="ghost" onClick={() => setSelectedInvoice(invoice)}><Eye size={16} />{tx("عرض الفاتورة", "View invoice")}</Button>{pending ? <Button><CreditCard size={16} />{tx("إتمام الدفع", "Pay now")}</Button> : <Button variant="ghost" onClick={() => { setSelectedInvoice(invoice); window.setTimeout(printInvoice, 80); }}><Printer size={16} />{tx("طباعة", "Print")}</Button>}</footer>
            </article>;
          })}</div>
        </section>
      )}
      <Modal open={Boolean(selectedInvoice)} onClose={() => setSelectedInvoice(null)} title={tx("تفاصيل الفاتورة", "Invoice details")} footer={<><Button variant="ghost" onClick={() => setSelectedInvoice(null)}>{tx("إغلاق", "Close")}</Button><Button onClick={printInvoice}><Printer size={16} />{tx("طباعة الفاتورة", "Print invoice")}</Button></>}>
        {selectedInvoice && <article id="printable-invoice" className="printable-invoice">
          <header><div className="print-invoice-brand"><img src="/images/ain-logo.png" alt="AIN" /><div><strong>AIN Platform</strong><span>{tx("فاتورة إلكترونية", "Electronic invoice")}</span></div></div><div><small>{tx("رقم الفاتورة", "Invoice number")}</small><strong>{selectedInvoice.invoiceNumber}</strong></div></header>
          <section className="invoice-parties"><div><small>{tx("صادرة من", "Issued by")}</small><strong>{selectedInvoice.organization?.nameAr || selectedInvoice.organization?.name}</strong><span>{tx("منصة تعليم وإدارة أكاديميات", "Education and academy management")}</span></div><div><small>{tx("الحالة", "Status")}</small><Badge tone={selectedInvoice.status === "paid" ? "success" : "warning"}>{selectedInvoice.status === "paid" ? tx("مدفوعة", "Paid") : tx("قيد السداد", "Pending")}</Badge><span>{tx("تاريخ الإصدار", "Issue date")}: {date(selectedInvoice.issuedAt)}</span><span>{tx("تاريخ الاستحقاق", "Due date")}: {date(selectedInvoice.dueAt || selectedInvoice.issuedAt)}</span></div></section>
          <table><thead><tr><th>{tx("البيان", "Description")}</th><th>{tx("المبلغ", "Amount")}</th></tr></thead><tbody>{(selectedInvoice.itemsBreakdown || []).map((item, index) => <tr key={`${item.description}-${index}`}><td>{item.description}</td><td>{money(item.amountMinor || selectedInvoice.totalMinor, selectedInvoice.currency)}</td></tr>)}</tbody></table>
          <section className="invoice-total-box"><div><span>{tx("الصافي", "Subtotal")}</span><strong>{money(selectedInvoice.subtotalMinor || selectedInvoice.totalMinor, selectedInvoice.currency)}</strong></div><div><span>{tx("الضريبة", "Tax")}</span><strong>{money(selectedInvoice.taxMinor || 0, selectedInvoice.currency)}</strong></div><div><span>{tx("الإجمالي", "Total")}</span><strong>{money(selectedInvoice.totalMinor, selectedInvoice.currency)}</strong></div></section>
          <footer><span>{selectedInvoice.status === "paid" ? <CheckCircle2 /> : <AlertCircle />}{selectedInvoice.status === "paid" ? tx("تم استلام المبلغ وتسجيل العملية بنجاح.", "Payment received and recorded successfully.") : tx("هذه الفاتورة تنتظر إتمام عملية السداد.", "This invoice is awaiting payment.")}</span><small>{tx("نسخة إلكترونية صالحة للطباعة — لا تحتاج توقيعًا يدويًا.", "Print-ready electronic copy — no handwritten signature required.")}</small></footer>
        </article>}
      </Modal>
    </div>
  );
}
