const blockedDomEvents = ["contextmenu", "copy", "cut", "dragstart", "selectstart"];

function isEditableTarget(target) {
  const element = target instanceof Element ? target : null;
  if (!element) return false;
  return Boolean(element.closest("input, textarea, select, [contenteditable='true'], .allow-copy"));
}

function shouldBlockShortcut(event) {
  const key = event.key.toLowerCase();
  return event.key === "F12"
    || event.key === "PrintScreen"
    || ((event.ctrlKey || event.metaKey) && ["p", "s", "u"].includes(key))
    || ((event.ctrlKey || event.metaKey) && event.shiftKey && ["c", "i", "j", "s"].includes(key));
}

export function installBrowserProtection() {
  if (typeof window === "undefined" || window.__AIO_BROWSER_PROTECTION__) return;
  window.__AIO_BROWSER_PROTECTION__ = true;
  document.documentElement.classList.add("aio-browser-protection");

  const blockEvent = (event) => {
    if (event.type !== "contextmenu" && isEditableTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  };
  const blockShortcut = (event) => {
    if (!shouldBlockShortcut(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };
  const blockPrint = (event) => {
    event.preventDefault?.();
  };

  blockedDomEvents.forEach((eventName) => document.addEventListener(eventName, blockEvent, true));
  window.addEventListener("keydown", blockShortcut, true);
  window.addEventListener("beforeprint", blockPrint, true);
}
