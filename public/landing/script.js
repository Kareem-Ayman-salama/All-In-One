const AIN_CONTACT = {
  whatsapp: "201025849793",
  apiBaseUrl: window.AIN_API_BASE_URL || "/api/v1",
};

const AIN_BLOCKED_EVENTS = ["contextmenu", "copy", "cut", "dragstart", "selectstart"];

function isEditableTarget(target) {
  return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true'], .allow-copy"));
}

function protectBrowserActions() {
  document.documentElement.classList.add("aio-browser-protection");
  AIN_BLOCKED_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, (event) => {
      if (event.type !== "contextmenu" && isEditableTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  });
  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const blocked = event.key === "F12"
      || event.key === "PrintScreen"
      || ((event.ctrlKey || event.metaKey) && ["p", "s", "u"].includes(key))
      || ((event.ctrlKey || event.metaKey) && event.shiftKey && ["c", "i", "j", "s"].includes(key));
    if (!blocked) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  window.addEventListener("beforeprint", (event) => event.preventDefault?.(), true);
}

protectBrowserActions();

function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openLeadModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("on");
  document.body.style.overflow = "hidden";
  const firstInput = modal.querySelector("input, select, textarea");
  window.setTimeout(() => firstInput?.focus(), 50);
}

function closeLeadModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("on");
  document.body.style.overflow = "";
}

function value(formData, key) {
  return String(formData.get(key) || "").trim();
}

function openWhatsApp(message) {
  const url = `https://wa.me/${AIN_CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function setBillingMode(mode) {
  const yearly = mode === "yearly";
  document.querySelectorAll("[data-billing]").forEach((button) => {
    button.classList.toggle("active", button.dataset.billing === mode);
    button.setAttribute("aria-pressed", String(button.dataset.billing === mode));
  });
  document.querySelectorAll(".plan-price").forEach((price) => {
    const amount = price.querySelector("strong");
    const period = price.querySelector("span");
    if (!amount || !period) return;
    amount.textContent = yearly ? amount.dataset.yearly : amount.dataset.monthly;
    period.textContent = yearly ? "جنيه / سنة" : "جنيه / شهر";
  });
}

window.setBillingMode = setBillingMode;

function installCardSpotlight() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const selectors = [
    ".answer-list div",
    ".audience-card",
    ".steps article",
    ".use-cases article",
    ".protection-grid article",
    ".plan-card",
    ".dashboard-mockup",
    ".mockup-stats span",
    ".mockup-body > div",
    ".faq-list details",
  ].join(",");

  document.querySelectorAll(selectors).forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x.toFixed(1)}%`);
      card.style.setProperty("--my", `${y.toFixed(1)}%`);
    });
  });
}

async function captureTrialLead(data) {
  const payload = Object.fromEntries(data.entries());
  const response = await fetch(`${AIN_CONTACT.apiBaseUrl}/public/trial-leads`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Trial lead capture failed.");
  }
}

async function submitTrialForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submit = form.querySelector("[type='submit']");

  const data = new FormData(form);
  const message = [
    "مرحبًا فريق AIN، أريد تجربة شهر مجاني للمنصة.",
    "",
    `الاسم: ${value(data, "name")}`,
    `الهاتف / WhatsApp: ${value(data, "phone")}`,
    `البريد الإلكتروني: ${value(data, "email")}`,
    `اسم الشركة / الأكاديمية: ${value(data, "organization")}`,
    `نوع النشاط: ${value(data, "type")}`,
    `حجم التجربة: ${value(data, "students")}`,
    `المطلوب تنظيمه على AIN: ${value(data, "content")}`,
  ].join("\n");

  submit?.setAttribute("disabled", "disabled");
  try {
    await captureTrialLead(data);
    form.reset();
  } catch (error) {
    console.warn(error);
  } finally {
    submit?.removeAttribute("disabled");
  }
  closeLeadModal("trial-modal");
  openWhatsApp(message);
}

document.addEventListener("DOMContentLoaded", () => {
  setBillingMode("monthly");
  installCardSpotlight();

  document.querySelectorAll("[data-billing]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setBillingMode(button.dataset.billing || "monthly");
    });
  });

  document.querySelectorAll(".overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLeadModal(overlay.id);
    });
  });
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("[data-billing]");
  if (!button) return;
  event.preventDefault();
  setBillingMode(button.dataset.billing || "monthly");
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".overlay.on").forEach((overlay) => {
    closeLeadModal(overlay.id);
  });
});
