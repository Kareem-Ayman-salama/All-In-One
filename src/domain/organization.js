export const ORGANIZATION_TYPES = {
  company: { label: "Company", labelAr: "شركة" },
  academy: { label: "Academy", labelAr: "أكاديمية" },
  training_center: { label: "Training center", labelAr: "مركز تدريب" },
  educational_institution: { label: "Educational institution", labelAr: "مؤسسة تعليمية" },
  general: { label: "General workspace", labelAr: "مساحة عمل عامة" }
};

export const ORGANIZATION_ROLES = {
  organization_owner: "Organization owner",
  organization_admin: "Organization admin",
  instructor: "Instructor",
  staff: "Staff",
  student: "Student",
  member: "Member"
};

export const PERMISSIONS = {
  organizationView: "organization.view",
  organizationUpdate: "organization.update",
  manageBranding: "organization.manage_branding",
  manageBilling: "organization.manage_billing",
  membersView: "members.view",
  membersInvite: "members.invite",
  membersUpdate: "members.update",
  membersRemove: "members.remove",
  rolesManage: "roles.manage",
  roomsView: "rooms.view",
  roomsCreate: "rooms.create",
  roomsUpdate: "rooms.update",
  roomsDelete: "rooms.delete",
  contentView: "content.view",
  contentCreate: "content.create",
  contentUpdate: "content.update",
  contentDelete: "content.delete",
  announcementsCreate: "announcements.create",
  eventsManage: "events.manage",
  coursesView: "courses.view",
  coursesCreate: "courses.create",
  coursesUpdate: "courses.update",
  coursesPublish: "courses.publish",
  batchesManage: "batches.manage",
  bookingsView: "bookings.view",
  bookingsManage: "bookings.manage",
  analyticsView: "analytics.view"
};

const allPermissions = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = {
  organization_owner: allPermissions,
  organization_admin: allPermissions.filter((permission) => permission !== PERMISSIONS.manageBilling),
  instructor: [
    PERMISSIONS.organizationView, PERMISSIONS.membersView, PERMISSIONS.roomsView,
    PERMISSIONS.contentView, PERMISSIONS.contentCreate, PERMISSIONS.contentUpdate,
    PERMISSIONS.announcementsCreate, PERMISSIONS.eventsManage, PERMISSIONS.coursesView,
    PERMISSIONS.coursesCreate, PERMISSIONS.coursesUpdate, PERMISSIONS.batchesManage,
    PERMISSIONS.bookingsView, PERMISSIONS.analyticsView
  ],
  staff: [
    PERMISSIONS.organizationView, PERMISSIONS.membersView, PERMISSIONS.roomsView,
    PERMISSIONS.contentView, PERMISSIONS.contentCreate, PERMISSIONS.eventsManage
  ],
  student: [PERMISSIONS.organizationView, PERMISSIONS.roomsView, PERMISSIONS.contentView, PERMISSIONS.coursesView],
  member: [PERMISSIONS.organizationView, PERMISSIONS.roomsView, PERMISSIONS.contentView]
};

const sharedModules = ["rooms", "content", "announcements", "calendar", "meetings", "tasks", "analytics"];

export const PLAN_ENTITLEMENTS = {
  Starter: {
    modules: [...sharedModules, "courses"],
    features: ["basic_watermark"],
    limits: { max_rooms: 3, max_members: 100, max_storage_gb: 10 }
  },
  Growth: {
    modules: [...sharedModules, "courses", "batches", "bookings", "subscriptions", "attendance"],
    features: ["basic_watermark", "advanced_watermark", "saved_views"],
    limits: { max_rooms: 10, max_members: 500, max_storage_gb: 50 }
  },
  Pro: {
    modules: [...sharedModules, "courses", "batches", "bookings", "subscriptions", "attendance", "exams", "payments", "promotions", "live_sessions"],
    features: ["basic_watermark", "advanced_watermark", "saved_views", "white_label"],
    limits: { max_rooms: null, max_members: null, max_storage_gb: 250 }
  }
};

export function permissionsForMembership(membership) {
  return [...new Set([...(ROLE_PERMISSIONS[membership?.role] || []), ...(membership?.permissions || [])])];
}

export function modulesForOrganization(organization) {
  const planModules = PLAN_ENTITLEMENTS[organization?.plan]?.modules || sharedModules;
  const disabledModules = new Set(organization?.disabledModules || []);
  return [...new Set([...planModules, ...(organization?.enabledModules || [])])]
    .filter((module) => !disabledModules.has(module));
}

export function roleDestination(role) {
  if (["organization_owner", "organization_admin", "staff", "instructor"].includes(role)) return "/tenant-admin/dashboard";
  return "/end-user/home";
}
