import { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export function PwaInstallBanner() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone (installed) mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("ain_pwa_dismissed") === "true";
    setIsDismissed(dismissed);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("ain_pwa_dismissed", "true");
  };

  if (isStandalone || isDismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <div
      className="pwa-install-banner"
      style={{
        position: "fixed",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(480px, calc(100% - 32px))",
        backgroundColor: "#1E293B",
        color: "#FFFFFF",
        padding: "12px 16px",
        borderRadius: "14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        zIndex: 9999,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        direction: isArabic ? "rtl" : "ltr",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
        <img
          src="/images/ain-logo.png"
          alt="AIN"
          style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "contain", background: "#FFFFFF", padding: "2px" }}
        />
        <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
          <strong style={{ display: "block", color: "#F8FAFC", fontSize: "14px" }}>
            {isArabic ? "تطبيق منصة عين التعليمية" : "AIN Educational App"}
          </strong>
          <span style={{ color: "#94A3B8" }}>
            {isArabic ? "وصول سريع وحضور فوري من الشاشة الرئيسية" : "Quick access & instant attendance from your home screen"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={handleInstallClick}
          style={{
            backgroundColor: "#2563EB",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {isArabic ? "تثبيت" : "Install"}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            backgroundColor: "transparent",
            color: "#94A3B8",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {showIosGuide && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#0F172A",
            padding: "12px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#E2E8F0",
            border: "1px solid #334155",
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
          }}
        >
          {isArabic ? (
            <>
              لتثبيت التطبيق على آيفون: اضغط على زر <strong>مشاركة (Share)</strong> أسفل الشاشة، ثم اختر <strong>"إضافة إلى الصفحة الرئيسية"</strong> 📲
            </>
          ) : (
            <>
              To install on iPhone: Tap <strong>Share</strong> in Safari, then choose <strong>"Add to Home Screen"</strong> 📲
            </>
          )}
          <button
            onClick={() => setShowIosGuide(false)}
            style={{ display: "block", marginTop: "6px", color: "#38BDF8", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "11px" }}
          >
            {isArabic ? "حسناً، فهمت" : "Got it"}
          </button>
        </div>
      )}
    </div>
  );
}
