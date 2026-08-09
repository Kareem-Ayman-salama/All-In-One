const AIN_CONTACT = {
  whatsapp: "201025849793",
};

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

function submitTrialForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const message = [
    "مرحبًا فريق AIN، أريد تجربة شهر مجاني للمنصة.",
    "",
    `الاسم: ${value(data, "name")}`,
    `الهاتف / WhatsApp: ${value(data, "phone")}`,
    `البريد الإلكتروني: ${value(data, "email")}`,
    `اسم الأكاديمية / المركز: ${value(data, "organization")}`,
    `نوع النشاط: ${value(data, "type")}`,
    `عدد الطلاب المتوقع: ${value(data, "students")}`,
    `المحتوى المطلوب حمايته: ${value(data, "content")}`,
  ].join("\n");

  closeLeadModal("trial-modal");
  openWhatsApp(message);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLeadModal(overlay.id);
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".overlay.on").forEach((overlay) => {
    closeLeadModal(overlay.id);
  });
});
