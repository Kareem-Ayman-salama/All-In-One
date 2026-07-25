import { CheckCircle2, MailCheck, RefreshCw, Send, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useBilingualText } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";
import { api } from "../services/api";
import { Button } from "./Button";

const checkLabels = {
  transactionalMail: ["مزود بريد فعلي", "Transactional mail provider"],
  senderConfigured: ["عنوان مرسل موثق", "Verified sender address"],
  transportConfigured: ["بيانات اتصال SMTP", "SMTP connection settings"],
  deliveryMode: ["وضع الإرسال المباشر", "Direct delivery mode"]
};

export function OtpOperationsPanel({ user }) {
  const tx = useBilingualText();
  const { showToast } = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await api.getOtpOperationsStatus());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function sendTest() {
    setSending(true);
    setError("");
    try {
      const result = await api.sendOtpDeliveryTest();
      showToast(tx(
        `تم إرسال رمز اختبار إلى ${result.deliveredTo}`,
        `Test OTP sent to ${result.deliveredTo}`
      ));
    } catch (requestError) {
      setError(requestError.message);
      showToast(tx("تعذر إرسال رمز الاختبار", "Test OTP delivery failed"), "danger");
    } finally {
      setSending(false);
    }
  }

  const ready = status?.status === "ready";

  return (
    <section className="otp-operations-panel" aria-labelledby="otp-operations-title">
      <header>
        <span className="otp-operations-icon"><MailCheck size={22} /></span>
        <div>
          <div className="otp-operations-title-row">
            <h2 id="otp-operations-title">{tx("تشغيل رموز التحقق OTP", "OTP delivery operations")}</h2>
            {!loading && status && (
              <span className={`otp-readiness-badge ${ready ? "ready" : "not-ready"}`}>
                {ready ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {ready ? tx("جاهز", "Ready") : tx("يحتاج إعداد", "Setup required")}
              </span>
            )}
          </div>
          <p>{tx(
            "تحقق من إعدادات البريد وأرسل رمزًا حقيقيًا إلى حساب مدير المنصة قبل فتح التسجيل للمستخدمين.",
            "Verify email configuration and send a real code to the platform administrator before opening registration."
          )}</p>
        </div>
        <button type="button" className="otp-refresh-button" onClick={loadStatus} disabled={loading} aria-label={tx("تحديث الحالة", "Refresh status")}>
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </header>

      {error && <div className="otp-operations-error" role="alert">{error}</div>}

      <div className="otp-check-grid" aria-busy={loading}>
        {loading && Array.from({ length: 4 }).map((_, index) => <span className="otp-check-skeleton" key={index} />)}
        {!loading && Object.entries(status?.checks || {}).map(([key, passed]) => (
          <div className={`otp-check-item ${passed ? "passed" : "failed"}`} key={key}>
            {passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{tx(...(checkLabels[key] || [key, key]))}</span>
          </div>
        ))}
      </div>

      <footer>
        <div className="otp-delivery-meta">
          <span>{tx("المرسل", "Sender")}: <strong>{status?.sender || tx("غير معد", "Not configured")}</strong></span>
          <span>{tx("مزود الإرسال", "Mailer")}: <strong>{status?.mailer || "-"}</strong></span>
          <span>{tx("حساب الاختبار", "Test account")}: <strong dir="ltr">{user.email}</strong></span>
        </div>
        <Button onClick={sendTest} disabled={!ready || sending || loading}>
          <Send size={17} />
          {sending ? tx("جاري الإرسال...", "Sending...") : tx("إرسال OTP تجريبي", "Send test OTP")}
        </Button>
      </footer>
    </section>
  );
}
