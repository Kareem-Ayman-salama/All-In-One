import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useLanguage, useBilingualText } from "../contexts/LanguageContext";

/**
 * CertificatesHub
 * Displays the student's certified graduation certificates with print, download, and QR code verification.
 */
export function CertificatesHub({ certificates = [], onRefresh }) {
  const { direction, language } = useLanguage();
  const bt = useBilingualText();
  const [selectedCert, setSelectedCert] = useState(certificates[0] || null);

  useEffect(() => {
    if (!selectedCert && certificates.length > 0) {
      setSelectedCert(certificates[0]);
    }
  }, [certificates, selectedCert]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8" dir={direction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-amber-900/40 via-slate-900 to-slate-900 p-6 rounded-3xl border border-amber-500/20 backdrop-blur-xl">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            {bt("🏆 الشهادات والاعتمادات الرسمية", "🏆 Official Accreditations & Certificates")}
          </span>
          <h2 className="text-2xl font-bold text-white">
            {bt("شهادات إتمام الكورسات المعتمدة", "Certified Course Completion Certificates")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {bt(
              "جميع الشهادات الصادرة مزودة برمز QR فريد للتحقق الرقمي الفوري من صحة ومصداقية الاعتماد.",
              "Every issued certificate features a secure cryptographic QR code for instant authenticity verification."
            )}
          </p>
        </div>
        {selectedCert && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all"
          >
            {bt("🖨️ طباعة أو حفظ كـ PDF", "🖨️ Print / Save as PDF")}
          </button>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="text-lg font-bold text-white">
            {bt("لا توجد شهادات صادرة بعد", "No certificates issued yet")}
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            {bt(
              "ستظهر شهاداتك هنا تلقائياً بمجرد إكمال محتوى الكورس واجتياز الاختبار النهائي بنجاح.",
              "Your certificates will appear here once you complete the coursework and pass the final exam."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Selector List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 px-1">
              {bt("الشهادات المتاحة", "Available Certificates")} ({certificates.length})
            </h3>
            {certificates.map((cert) => (
              <div
                key={cert.id}
                onClick={() => setSelectedCert(cert)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedCert?.id === cert.id
                    ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-amber-400 font-mono mb-1">
                  <span>{cert.certificateNumber}</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {bt("درجة:", "Grade:")} {cert.gradeScore}%
                  </span>
                </div>
                <h4 className="font-bold text-white text-sm line-clamp-1">
                  {language === "ar"
                    ? cert.course?.titleAr || cert.course?.title
                    : cert.course?.title || cert.course?.titleAr}
                </h4>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span>
                    {language === "ar"
                      ? cert.organization?.nameAr || cert.organization?.name
                      : cert.organization?.name || cert.organization?.nameAr}
                  </span>
                  <span>{cert.issueDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Certificate Preview Card */}
          <div className="lg:col-span-2">
            {selectedCert && <OfficialCertificateView certificate={selectedCert} />}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * OfficialCertificateView
 * Luxury printable certificate layout with gold borders, official seal, and verification QR code.
 */
export function OfficialCertificateView({ certificate }) {
  const { direction, language } = useLanguage();
  const bt = useBilingualText();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
    `${window.location.origin}/verify-certificate/${certificate.verificationCode}`
  )}`;

  return (
    <div
      id="printable-certificate"
      className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 rounded-3xl border-2 border-amber-500/40 shadow-2xl overflow-hidden text-center select-none"
      dir={direction}
    >
      {/* Decorative Golden Ornaments */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Border Inset */}
      <div className="border border-amber-500/20 rounded-2xl p-6 sm:p-10 relative">
        {/* Academy Branding */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-6 mb-8">
          <div className="text-start">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest block">
              {language === "ar"
                ? certificate.organization?.nameAr || certificate.organization?.name || "منصة عين التعليمية"
                : certificate.organization?.name || certificate.organization?.nameAr || "AIN Learning Platform"}
            </span>
            <span className="text-slate-400 text-xs">
              {bt("معتمدة في سجل التدريب الرقمي الموثق", "Accredited in the Official Digital Registry")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl font-bold text-amber-300">
            🏛️
          </div>
        </div>

        {/* Certificate Title */}
        <div className="space-y-3 mb-8">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            CERTIFICATE OF COMPLETION • {bt("شهادة إتمام واعتماد", "OFFICIAL ACCREDITATION")}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 mt-4">
            {bt("شهادة إتمام كورس تدريبي", "Certificate of Course Completion")}
          </h1>
          <p className="text-slate-400 text-sm">
            {bt("تشهد الأكاديمية بأن المتدرب / الطالب:", "This is to certify that:")}
          </p>
        </div>

        {/* Student Name */}
        <div className="my-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white underline decoration-amber-500/50 underline-offset-8">
            {certificate.student?.name || certificate.metadata?.studentName || (language === "ar" ? "أحمد إبراهيم علي" : "Ahmed Ibrahim Ali")}
          </h2>
        </div>

        {/* Course Details */}
        <div className="max-w-xl mx-auto space-y-2 mb-10 text-slate-300 text-sm leading-relaxed">
          <p>
            {bt(
              "قد أتم بنجاح كافة متطلبات وحصص الكورس التدريبي والمهام العملية في:",
              "Has successfully completed all academic requirements and practical coursework in:"
            )}
          </p>
          <div className="text-lg font-bold text-amber-300 bg-amber-500/10 py-2 px-4 rounded-xl border border-amber-500/20 inline-block">
            {language === "ar"
              ? certificate.course?.titleAr || certificate.course?.title || certificate.metadata?.courseTitle
              : certificate.course?.title || certificate.course?.titleAr || certificate.metadata?.courseTitle}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {bt("بدرجة تقييم نهائية بلغت ", "With a final graduation score of ")}
            <strong className="text-emerald-400 font-bold">{certificate.gradeScore}%</strong>{" "}
            {bt("بمعدل تفوق واجتياز لكافة الاختبارات.", "demonstrating academic excellence and mastery.")}
          </p>
        </div>

        {/* Signatures & QR Code Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center border-t border-amber-500/20 pt-8 mt-6">
          {/* Issue Date & Serial */}
          <div className="text-start space-y-1 text-xs text-slate-400">
            <div><strong>{bt("تاريخ الإصدار:", "Issue Date:")}</strong> {certificate.issueDate}</div>
            <div><strong>{bt("رقم الشهادة:", "Certificate No:")}</strong> <span className="font-mono text-amber-300">{certificate.certificateNumber}</span></div>
            <div><strong>{bt("كود التحقق:", "Verification Code:")}</strong> <span className="font-mono text-amber-300">{certificate.verificationCode}</span></div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-2 bg-white rounded-2xl shadow-xl border border-amber-400/40">
              <img src={qrUrl} alt="Certificate Verification QR" className="w-24 h-24 rounded-lg" />
            </div>
            <span className="text-[10px] text-amber-300 mt-1.5 font-mono">
              {bt("امسح الكود للتحقق", "Scan QR to Verify")}
            </span>
          </div>

          {/* Golden Seal & Signature */}
          <div className="text-end space-y-2">
            <div className="inline-block text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 border-2 border-white">
                VERIFIED
              </div>
              <div className="text-[11px] font-bold text-slate-300 mt-1">
                {bt("ختم الاعتماد الرقمي", "Digital Accreditation Seal")}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">AIN-CERT-ENGINE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PublicCertificateVerifyPage
 * Standalone verification page for employers, parents, and institutions scanning the QR Code.
 */
export function PublicCertificateVerifyPage({ verificationCode }) {
  const { direction } = useLanguage();
  const bt = useBilingualText();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!verificationCode) return;
    setLoading(true);
    apiService
      .verifyCertificatePublic(verificationCode)
      .then((res) => {
        if (res.valid) {
          setCertData(res.certificate);
        } else {
          setError(bt("الشهادة غير مسجلة أو غير صالحة", "Certificate is not registered or invalid"));
        }
      })
      .catch(() => setError(bt("تعذر التحقق من الشهادة. يرجى التأكد من الرمز المدخل.", "Failed to verify certificate. Please check the code.")))
      .finally(() => setLoading(false));
  }, [verificationCode]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6" dir={direction}>
      <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="text-center py-12 space-y-3">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-slate-400 text-sm">
              {bt("جاري مطابقة بيانات الشهادة والتحقق من التوقيع الرقمي...", "Verifying certificate credentials and digital signature...")}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl font-bold border border-red-500/30">
              ✕
            </div>
            <h2 className="text-xl font-bold text-white">
              {bt("فشل التحقق من الشهادة", "Certificate Verification Failed")}
            </h2>
            <p className="text-red-400 text-sm">{error}</p>
            <div className="text-xs text-slate-500 font-mono">
              {bt("الكود:", "Code:")} {verificationCode}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-white">
                {bt("شهادة موثقة ورسمية", "Official Verified Certificate")}
              </h2>
              <p className="text-emerald-400 text-xs font-semibold">
                {bt(
                  "تم التحقق من صحة الشهادة وسجل الطالب بنجاح عبر النظام المركزي",
                  "Certificate authenticity and student enrollment verified successfully via the central registry"
                )}
              </p>
            </div>

            {/* Details Box */}
            <div className="bg-slate-950/70 rounded-2xl p-6 border border-slate-800 space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">{bt("اسم الطالب / المتدرب:", "Student Name:")}</span>
                <span className="font-bold text-white text-base">{certData.studentName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">{bt("اسم الكورس المعتمد:", "Accredited Course:")}</span>
                <span className="font-bold text-amber-300">{certData.courseTitle}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">{bt("الأكاديمية المصدرة:", "Issuing Academy:")}</span>
                <span className="font-medium text-white">{certData.organizationName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">{bt("الدرجة المكتسبة:", "Earned Grade:")}</span>
                <span className="font-bold text-emerald-400">{certData.gradeScore}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">{bt("تاريخ الإصدار:", "Issue Date:")}</span>
                <span className="text-slate-300">{certData.issueDate}</span>
              </div>
              <div className="flex justify-between items-center pt-1 font-mono text-xs">
                <span className="text-slate-400">{bt("كود التحقق الرقمي:", "Digital Verification Code:")}</span>
                <span className="text-amber-400 font-bold">{certData.verificationCode}</span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2">
              {bt(
                "منصة عين التعليمية | نظام حماية وتوثيق الشهادات الرقمية",
                "AIN Learning Platform | Digital Certificate Security & Registry"
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

