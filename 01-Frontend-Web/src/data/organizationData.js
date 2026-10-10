const inDays = (days) => new Date(Date.now() + days * 86400000).toISOString();

export const organizations = [
  {
    id: "org-techcorp",
    slug: "techcorp-egypt",
    name: "TechCorp Egypt",
    nameAr: "تك كورب مصر",
    type: "company",
    plan: "Growth",
    subscriptionStatus: "active",
    currentPeriodEndsAt: inDays(28),
    logo: "TC",
    color: "#2563eb",
    pendingActions: 3,
    enabledModules: ["courses", "meetings", "tasks"]
  },
  {
    id: "org-elite-academy",
    slug: "elite-academy",
    name: "Elite Academy",
    nameAr: "أكاديمية إيليت",
    type: "academy",
    plan: "Pro",
    subscriptionStatus: "active",
    currentPeriodEndsAt: inDays(30),
    logo: "EA",
    color: "#7c3aed",
    pendingActions: 7,
    enabledModules: ["courses", "batches", "bookings", "promotions", "meetings", "tasks"]
  },
  {
    id: "org-language-center",
    slug: "language-center",
    name: "AIN Language Center",
    nameAr: "مركز عين للغات",
    type: "training_center",
    plan: "Starter",
    subscriptionStatus: "trial",
    currentPeriodEndsAt: inDays(14),
    logo: "AL",
    color: "#0f766e",
    pendingActions: 1,
    enabledModules: ["courses", "meetings", "tasks"]
  }
];

export const organizationMemberships = {
  "admin@techcorp.test": [
    { organizationId: "org-techcorp", role: "organization_owner", status: "active" },
    { organizationId: "org-elite-academy", role: "organization_admin", status: "active" }
  ],
  "employee@techcorp.test": [
    { organizationId: "org-techcorp", role: "member", status: "active" }
  ],
  "student@ain.test": [
    { organizationId: "org-elite-academy", role: "student", status: "active" },
    { organizationId: "org-language-center", role: "student", status: "active" }
  ]
};
