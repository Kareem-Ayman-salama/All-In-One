export const DEEP_LINK_ROUTES = {
  inviteAccept: { name: "invite.accept", path: "/invite/{token}", required: ["token"] },
  resetPassword: { name: "auth.reset_password", path: "/reset-password" },
  courseDetails: { name: "marketplace.course", path: "/courses/{courseSlug}", required: ["courseSlug"] },
  academyProfile: { name: "marketplace.academy", path: "/academies/{academySlug}", required: ["academySlug"] },
  publicBooking: { name: "booking.public", path: "/booking/{courseId}", required: ["courseId"] },
  bookingSuccess: { name: "booking.success", path: "/booking/success" },
  studentNotifications: { name: "student.notifications", path: "/end-user/notifications" },
  studentContent: { name: "student.content", path: "/end-user/files" },
  studentBookings: { name: "student.bookings", path: "/end-user/bookings" },
  organizationBookings: { name: "organization.bookings", path: "/tenant-admin/bookings" },
  organizationContent: { name: "organization.content", path: "/tenant-admin/files" },
  platformCourseApprovals: { name: "platform.course_approvals", path: "/super-admin/courseApprovals" }
};

export function buildDeepLink(routeKey, params = {}, query = {}) {
  const route = DEEP_LINK_ROUTES[routeKey];
  if (!route) throw new Error(`Unknown deep-link route: ${routeKey}`);

  const path = (route.required || []).reduce((current, key) => {
    const value = params[key];
    if (value == null || value === "") {
      throw new Error(`Missing deep-link parameter: ${key}`);
    }
    return current.replace(`{${key}}`, encodeURIComponent(String(value)));
  }, route.path);

  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value != null && value !== "") search.set(key, String(value));
  });

  return `${path}${search.size ? `?${search.toString()}` : ""}`;
}

export function routeNameForPath(pathname) {
  const normalized = String(pathname || "").split("?")[0];
  const match = Object.values(DEEP_LINK_ROUTES).find((route) => {
    const pattern = new RegExp(`^${route.path.replace(/\{[^/]+\}/g, "[^/]+")}$`);
    return pattern.test(normalized);
  });
  return match?.name || null;
}
