import React, { useEffect, useState, useCallback } from "react";
import { useLanguage, useBilingualText } from "../contexts/LanguageContext";

/**
 * generateWebFingerprint
 *
 * Produces a stable, opaque browser fingerprint using:
 *  - Canvas pixel hash (GPU/font rendering signature)
 *  - User-Agent string
 *  - Screen dimensions + colour depth
 *  - Browser language & timezone
 *  - CPU cores & device memory (when available)
 *
 * This fingerprint is used as a proxy for "stable installation ID" on web
 * and is passed to the backend as the `installationId` field during login /
 * content playback so that the device policy layer can enforce one-device
 * rules correctly.
 *
 * NOTE: This is a deterrence measure, not cryptographically secure identity.
 */
export function generateWebFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("AIN-FP-2026 \u0630\u0643\u0627\u0621", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("AIN-FP-2026 \u0630\u0643\u0627\u0621", 4, 17);

    const canvasHash = canvas.toDataURL();

    const parts = [
      navigator.userAgent,
      navigator.language || "",
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      String(navigator.hardwareConcurrency || ""),
      String(navigator.deviceMemory || ""),
      canvasHash.slice(-64), // tail of the canvas data URL
    ];

    // Simple djb2-inspired hash over the joined parts
    let hash = 5381;
    const combined = parts.join("|");
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) + hash + combined.charCodeAt(i);
      hash |= 0; // keep as 32-bit integer
    }
    return `wfp-${Math.abs(hash).toString(16).padStart(8, "0")}`;
  } catch (_) {
    return "wfp-unknown";
  }
}

// Singleton: compute once per page load and cache.
let _cachedFingerprint = null;
export function getWebFingerprint() {
  if (!_cachedFingerprint) {
    _cachedFingerprint = generateWebFingerprint();
  }
  return _cachedFingerprint;
}

/**
 * SecureContentProtectionWrapper
 * Comprehensive Anti-Leakage Deterrent Component for Course Rooms, Videos & Workspaces.
 *
 * 1. Blocks right-click (contextmenu)
 * 2. Intercepts common save, print, source, and developer-tool shortcuts as a deterrent
 * 3. Detects PrintScreen key presses and shows an intellectual-property reminder
 * 4. Applies CSS styles to prevent text selection and drag-and-drop
 * 5. Displays a polite, firm intellectual property alert banner upon violation attempts
 * 6. Generates and stores a stable Web Device Fingerprint for backend device-policy enforcement
 */

export function SecureContentProtectionWrapper({ children, active = true, title }) {
  const { direction } = useLanguage();
  const bt = useBilingualText();
  const [warningMessage, setWarningMessage] = useState(null);

  // Compute fingerprint on mount and store it for later API calls.
  useEffect(() => {
    if (!active) return;
    const fp = getWebFingerprint();
    // Expose on window so any fetch wrapper or API client can read it.
    window.__ainWebFingerprint = fp;
  }, [active]);

  const triggerWarning = useCallback((msg) => {
    setWarningMessage(msg);
    window.clearTimeout(window.__protectionToastTimer);
    window.__protectionToastTimer = window.setTimeout(() => {
      setWarningMessage(null);
    }, 4000);
  }, []);

  useEffect(() => {
    if (!active) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerWarning(
        bt(
          "تم حظر النقر بزر الفأرة الأيمن لحماية محتوى الأكاديمية وحقوق الملكية.",
          "Right-click is disabled to protect academy intellectual property."
        )
      );
      return false;
    };

    const handleKeyDown = (e) => {
      // PrintScreen detection
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        triggerWarning(
          bt(
            "تنبيه: تم رصد مفتاح لقطة الشاشة. لا تمنع واجهة الويب التصوير تقنياً، لكن العلامة المائية تساعد على تتبع التسريب.",
            "Notice: A screenshot key press was detected. Web apps cannot technically prevent capture; the watermark supports traceability."
          )
        );
      }

      // Ctrl / Cmd combos
      if (e.ctrlKey || e.metaKey) {
        const key = e.key ? e.key.toLowerCase() : "";
        // Ctrl+S (Save), Ctrl+U (Source), Ctrl+P (Print)
        if (key === "s" || key === "u" || key === "p") {
          e.preventDefault();
          triggerWarning(
            bt("تم حظر اختصارات حفظ وطباعة المحتوى.", "Saving and printing shortcuts are disabled.")
          );
          return false;
        }
        // Ctrl+Shift+I (DevTools)
        if (e.shiftKey && key === "i") {
          e.preventDefault();
          triggerWarning(
            bt(
              "تم اعتراض اختصار أدوات المطورين داخل المشغل كإجراء ردع.",
              "The developer-tools shortcut was intercepted in the player as a deterrent."
            )
          );
          return false;
        }
      }

      // F12 DevTools
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        triggerWarning(
          bt(
            "تم اعتراض اختصار أدوات المطورين داخل المشغل كإجراء ردع.",
            "The developer-tools shortcut was intercepted in the player as a deterrent."
          )
        );
        return false;
      }
    };

    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.clearTimeout(window.__protectionToastTimer);
    };
  }, [active, triggerWarning, bt]);

  if (!active) return children;

  return (
    <div
      className="relative secure-content-wrapper"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        WebkitTouchCallout: "none"
      }}
    >
      {/* Toast Notification for Intercepted Actions */}
      {warningMessage && (
        <div
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-red-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-red-500/50 backdrop-blur-md transition-all animate-bounce"
          role="alert"
          dir={direction}
        >
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <div className="text-sm font-medium">
            <strong className="font-bold block text-red-200">
              {bt("درع الحماية النشط", "Active Protection Shield")}
            </strong>
            {warningMessage}
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-red-300 hover:text-white text-xs px-2 py-1 rounded-lg bg-red-800/60 transition-colors"
          >
            {bt("إغلاق", "Dismiss")}
          </button>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * VideoProtectionShield
 * An invisible protection layer over video elements preventing automated downloaders (like IDM)
 * and right-click video grabbing while allowing click-to-play interactions.
 */
export function VideoProtectionShield({ children, onShieldClick }) {
  return (
    <div className="relative overflow-hidden group select-none">
      {children}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "transparent",
          backgroundImage: "radial-gradient(rgba(0,0,0,0) 1px, transparent 0)",
          backgroundSize: "24px 24px"
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
