import { useEffect, useRef } from "react";
import { useBilingualText } from "../contexts/LanguageContext";
import { useToast } from "../contexts/ToastContext";

const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";

/**
 * Blocks casual browser actions commonly used to copy protected course media.
 * Form fields remain usable so paste, spellcheck, and accessibility workflows
 * are not broken across registration and administration screens.
 */
export function GlobalInteractionGuard() {
  const tx = useBilingualText();
  const { showToast } = useToast();
  const lastNoticeAt = useRef(0);

  useEffect(() => {
    const notify = (message) => {
      const now = Date.now();
      if (now - lastNoticeAt.current < 1200) return;
      lastNoticeAt.current = now;
      showToast(message, "warning");
    };

    const isEditableTarget = (target) => target instanceof Element
      && Boolean(target.closest(EDITABLE_SELECTOR));

    const handleContextMenu = (event) => {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      notify(tx(
        "تم تعطيل القائمة المختصرة لحماية محتوى المنصة.",
        "The context menu is disabled to protect platform content."
      ));
    };

    const handleDragStart = (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("img, video, iframe")) return;
      event.preventDefault();
    };

    const handleKeyDown = (event) => {
      if (isEditableTarget(event.target)) return;

      const key = String(event.key || "").toLowerCase();
      const commandKey = event.ctrlKey || event.metaKey;
      const blocked = event.key === "F12"
        || (commandKey && ["s", "u"].includes(key))
        || (commandKey && event.shiftKey && ["i", "j", "c"].includes(key));

      if (!blocked) return;
      event.preventDefault();
      notify(tx(
        "تم اعتراض الاختصار لحماية المحتوى وحقوق المدرس.",
        "This shortcut was blocked to protect instructor content."
      ));
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("dragstart", handleDragStart, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [showToast, tx]);

  return null;
}
