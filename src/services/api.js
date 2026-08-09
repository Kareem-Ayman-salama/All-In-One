import { analytics, files, members, notifications, roles, rooms, tenants } from "../data/mockData";
import { downloadFile, httpClient, shouldUseMockApi } from "./httpClient";

const delay = (value) => new Promise((resolve) => {
  window.setTimeout(() => resolve(value), 120);
});

function camelKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [camelKey(key), camelize(item)]));
}

function endpoint(path, mockValue) {
  if (shouldUseMockApi()) return delay(mockValue);
  return httpClient(path).then(camelize);
}

function organizationPath(organizationId, resource) {
  if (!organizationId) return null;
  return `/organizations/${organizationId}/${resource}`;
}

export const api = {
  getOtpOperationsStatus: () => endpoint("/admin/otp/status", {
    status: "ready",
    checks: {
      transactionalMail: true,
      senderConfigured: true,
      transportConfigured: true,
      deliveryMode: true
    },
    mailer: "smtp",
    queue: "sync",
    sender: "ad***@aio.test"
  }),
  sendOtpDeliveryTest: () => shouldUseMockApi()
    ? delay({ deliveredTo: "ad***@aio.test", expiresInMinutes: 15 })
    : httpClient("/admin/otp/test", { method: "POST", body: "{}" }).then(camelize),
  getErrorCatalog: () => endpoint("/meta/error-catalog", { version: "local", errors: {} }),
  getDeepLinks: () => endpoint("/meta/deep-links", { version: "local", routes: {} }),
  getOfflineCachePolicy: () => endpoint("/meta/offline-cache-policy", { version: "local", datasets: {}, writeOperations: {} }),
  getDevicePolicy: () => endpoint("/meta/device-policy", { version: "local" }),
  getRoles: () => shouldUseMockApi() ? delay(roles) : Promise.resolve([]),
  getRooms: (organizationId) => organizationId
    ? endpoint(`${organizationPath(organizationId, "rooms")}?perPage=100`, rooms).then((items) => items.map((room) => ({
      ...room,
      members: room.membershipsCount || 0,
      files: room.filesCount || 0,
      status: room.status === "active" ? "Active" : room.status
    })))
    : Promise.resolve([]),
  getFiles: (organizationId) => organizationId
    ? endpoint(`${organizationPath(organizationId, "content")}?perPage=100`, files).then((items) => items.map((item) => ({
      ...item,
      name: item.title,
      room: item.room?.name || item.roomId,
      uploadedBy: item.creator?.name || "",
      date: item.createdAt ? new Intl.DateTimeFormat(document.documentElement.lang || "en", { dateStyle: "medium" }).format(new Date(item.createdAt)) : "",
      views: Number(item.views || 0),
      size: item.fileAsset?.sizeBytes ? `${(item.fileAsset.sizeBytes / 1048576).toFixed(1)} MB` : "",
      protected: !item.downloadAllowed
    })))
    : Promise.resolve([]),
  getMembers: (organizationId) => organizationId
    ? endpoint(`${organizationPath(organizationId, "members")}?perPage=100`, members).then((items) => items.map((item) => ({
      ...item,
      name: item.user?.name || "",
      email: item.user?.email || "",
      role: item.role?.name || "",
      status: item.status === "active" ? "Active" : item.status
    })))
    : Promise.resolve([]),
  getTenants: (platformAdmin) => platformAdmin
    ? endpoint("/admin/organizations?perPage=100", tenants).then((items) => items.map((item) => {
      const subscription = item.subscriptions?.[0];
      return {
        ...item,
        plan: subscription?.plan?.name || subscription?.plan?.code || "—",
        users: item.membershipsCount || 0,
        rooms: item.roomsCount || 0,
        files: item.filesCount || 0,
        revenue: null,
        expiresAt: subscription?.currentPeriodEndsAt || null,
        subscriptionStatus: subscription?.status || "none",
        status: item.status || "inactive"
      };
    }))
    : Promise.resolve([]),
  getPlatformSubscriptions: (filters = {}) => {
    const query = new URLSearchParams({ perPage: "100", ...filters });
    return endpoint(`/admin/subscriptions?${query}`, []).then(camelize);
  },
  requestSubscriptionActivation: (organizationId, payload) => httpClient(
    `/admin/organizations/${organizationId}/subscriptions/request-activation`,
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  approvePlatformSubscription: (subscriptionId, payload = {}) => httpClient(
    `/admin/subscriptions/${subscriptionId}/approve`,
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  rejectPlatformSubscription: (subscriptionId, reason) => httpClient(
    `/admin/subscriptions/${subscriptionId}/reject`,
    { method: "POST", body: JSON.stringify({ reason }) }
  ).then(camelize),
  suspendOrganization: (organizationId, reason) => httpClient(
    `/admin/organizations/${organizationId}/suspend`,
    { method: "POST", body: JSON.stringify({ reason }) }
  ).then(camelize),
  activateOrganization: (organizationId) => httpClient(
    `/admin/organizations/${organizationId}/activate`,
    { method: "POST", body: "{}" }
  ).then(camelize),
  getNotifications: (organizationId) => endpoint(
    `/notifications?perPage=100${organizationId ? `&organizationId=${organizationId}` : ""}`,
    notifications
  ).then((items) => items.map((item) => ({
    ...item,
    unread: item.status === "unread",
    title: item.title || item.data?.title || "Notification",
    titleAr: item.titleAr || item.data?.titleAr,
    body: item.body || item.data?.body || "",
    bodyAr: item.bodyAr || item.data?.bodyAr,
    target: item.target || item.data?.target || "/",
    type: item.type || item.data?.type || "Workspace",
    time: item.createdAt
  }))),
  getAnalytics: (scope, organizationId) => {
    const path = scope === "platform"
      ? "/admin/analytics/overview"
      : organizationId
        ? `${organizationPath(organizationId, "analytics/overview")}`
        : null;
    return path ? endpoint(path, analytics[scope] || []) : Promise.resolve([]);
  },
  createRoom: (organizationId, payload) => httpClient(organizationPath(organizationId, "rooms"), {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      description: payload.description || null,
      accessType: payload.type === "Upload + read" ? "collaborative" : "read_only",
      status: "active"
    })
  }).then(camelize),
  createEvent: (organizationId, payload) => httpClient(organizationPath(organizationId, "events"), {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(camelize),
  getRoomMessages: (organizationId, roomId) => endpoint(
    `${organizationPath(organizationId, `rooms/${roomId}/messages`)}?perPage=100`,
    []
  ).then((items) => items.map((item) => ({
    ...item,
    roomId: item.roomId || roomId,
    author: item.user?.name || item.user?.email || "Member",
    body: item.body,
    time: item.createdAt
      ? new Intl.DateTimeFormat(document.documentElement.lang || "en", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(item.createdAt))
      : item.time
  }))),
  sendRoomMessage: (organizationId, roomId, payload) => {
    const shape = (item) => ({
      ...item,
      roomId: item.roomId || roomId,
      author: item.user?.name || item.user?.email || item.author || "Member",
      body: item.body,
      time: item.createdAt
        ? new Intl.DateTimeFormat(document.documentElement.lang || "en", {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(item.createdAt))
        : "Just now"
    });
    if (shouldUseMockApi()) {
      return delay(shape({
        id: `message-${Date.now()}`,
        body: payload.body,
        user: { name: "Workspace admin" }
      }));
    }

    return httpClient(
      organizationPath(organizationId, `rooms/${roomId}/messages`),
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    ).then(camelize).then(shape);
  },
  inviteMember: (organizationId, payload) => httpClient(organizationPath(organizationId, "invitations"), {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(camelize),
  uploadContent: (organizationId, payload) => {
    if (payload.type === "youtube") {
      return httpClient(organizationPath(organizationId, "content"), {
        method: "POST",
        body: JSON.stringify({
          roomId: payload.roomId,
          title: payload.title,
          type: "youtube",
          externalUrl: payload.externalUrl,
          downloadAllowed: false,
          watermarkEnabled: payload.watermarkEnabled !== false,
          allowFullscreen: payload.allowFullscreen !== false,
          displayOrder: payload.displayOrder || 0,
          status: "published"
        })
      }).then(camelize);
    }

    const body = new FormData();
    body.set("roomId", payload.roomId);
    body.set("title", payload.file.name);
    body.set("type", payload.type);
    body.set("file", payload.file);
    body.set("downloadAllowed", payload.downloadAllowed ? "1" : "0");
    body.set("watermarkEnabled", payload.watermarkEnabled === false ? "0" : "1");
    body.set("status", "published");
    return httpClient(organizationPath(organizationId, "content"), { method: "POST", body }).then(camelize);
  },
  getContentViewSession: (organizationId, contentId) => httpClient(
    `${organizationPath(organizationId, "content")}/${contentId}/view-session`
  ).then(camelize),
  recordContentViewerAudit: (organizationId, contentId, payload) => httpClient(
    `${organizationPath(organizationId, "content")}/${contentId}/viewer-audit`,
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  getContentAccessLogs: (organizationId, filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString() ? `?${query}` : "";
    return endpoint(`${organizationPath(organizationId, "content-access-logs")}${suffix}`, []).then(camelize);
  },
  getSecurityEvents: (organizationId, filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString() ? `?${query}` : "";
    return endpoint(`${organizationPath(organizationId, "security-events")}${suffix}`, []).then(camelize);
  },
  getMemberSessions: (organizationId) => endpoint(
    organizationPath(organizationId, "member-sessions"),
    []
  ).then(camelize),
  getMemberDevices: (organizationId, filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    const suffix = query.toString() ? `?${query}` : "";
    return endpoint(`${organizationPath(organizationId, "member-devices")}${suffix}`, []).then(camelize);
  },
  approveMemberDevice: (organizationId, memberId, deviceId) => httpClient(
    `${organizationPath(organizationId, "members")}/${memberId}/devices/${deviceId}/approve`,
    { method: "POST", body: "{}" }
  ).then(camelize),
  blockMemberDevice: (organizationId, memberId, deviceId) => httpClient(
    `${organizationPath(organizationId, "members")}/${memberId}/devices/${deviceId}/block`,
    { method: "POST", body: "{}" }
  ).then(camelize),
  revokeMemberDevice: (organizationId, memberId, deviceId) => httpClient(
    `${organizationPath(organizationId, "members")}/${memberId}/devices/${deviceId}/revoke`,
    { method: "POST", body: "{}" }
  ).then(camelize),
  getPlanUsage: (organizationId) => endpoint(
    organizationPath(organizationId, "plan-usage"),
    null
  ).then(camelize),
  revokeMemberSessions: (organizationId, memberId) => httpClient(
    `${organizationPath(organizationId, "members")}/${memberId}/sessions`,
    { method: "DELETE" }
  ).then(camelize),
  deleteRoom: (organizationId, roomId) => httpClient(`${organizationPath(organizationId, "rooms")}/${roomId}`, { method: "DELETE" }),
  deleteContent: (organizationId, contentId) => httpClient(`${organizationPath(organizationId, "content")}/${contentId}`, { method: "DELETE" }),
  removeMember: (organizationId, membershipId) => httpClient(`${organizationPath(organizationId, "members")}/${membershipId}`, { method: "DELETE" }),
  markNotificationRead: (notificationId) => httpClient(`/notifications/${notificationId}/read`, { method: "POST", body: "{}" }),
  markAllNotificationsRead: () => httpClient("/notifications/read-all", { method: "POST", body: "{}" }),
  registerPushDeviceToken: (payload) => httpClient("/devices/push-tokens", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(camelize),
  revokePushDeviceToken: (payload) => httpClient("/devices/push-tokens", {
    method: "DELETE",
    body: JSON.stringify(payload)
  }).then(camelize),
  getInstructorSlots: (organizationId) => endpoint(
    organizationPath(organizationId, "instructor-slots?perPage=100"),
    []
  ),
  createInstructorSlot: (organizationId, payload) => httpClient(
    organizationPath(organizationId, "instructor-slots"),
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  submitCourseForReview: (organizationId, courseId) => httpClient(
    `${organizationPath(organizationId, "courses")}/${courseId}/submit-review`,
    { method: "POST", body: "{}" }
  ).then(camelize),
  getInvitationPreview: (token) => endpoint(`/public/invitations/${encodeURIComponent(token)}`, null),
  getPublicInstructors: () => endpoint("/public/instructors?perPage=100", []).then((items) => items.map((item) => ({
    ...item,
    nameAr: item.nameAr || item.name,
    title: item.specialties?.join(", ") || "Instructor",
    titleAr: item.specialties?.join("، ") || "مدرس",
    subjects: (item.specialties || []).map((subject) => subject.toLowerCase().replace(/\s+/g, "-")),
    levels: ["beginner", "intermediate", "advanced"],
    formats: [...new Set((item.availabilitySlots || []).map((slot) => slot.deliveryType))],
    price: Number(item.availabilitySlots?.[0]?.priceMinor || 0) / 100,
    duration: item.availabilitySlots?.[0]
      ? Math.round((new Date(item.availabilitySlots[0].endsAt) - new Date(item.availabilitySlots[0].startsAt)) / 60000)
      : 60,
    slots: (item.availabilitySlots || []).map((slot) => ({
      ...slot,
      date: slot.startsAt.slice(0, 10),
      time: new Date(slot.startsAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false })
    }))
  }))),
  getLessonBookings: () => endpoint("/student/lesson-bookings?perPage=100", []).then((items) => items.map((item) => ({
    ...item,
    teacherId: item.instructorId,
    teacherName: item.instructor?.name,
    teacherNameAr: item.instructor?.nameAr || item.instructor?.name,
    subjectName: item.subject,
    subjectNameAr: item.subject,
    date: item.slot?.startsAt?.slice(0, 10),
    time: item.slot?.startsAt ? new Date(item.slot.startsAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }) : "",
    duration: item.slot ? Math.round((new Date(item.slot.endsAt) - new Date(item.slot.startsAt)) / 60000) : 0,
    format: item.slot?.deliveryType,
    price: Number(item.amountMinor || 0) / 100
  }))),
  reserveLesson: (payload) => httpClient("/student/lesson-bookings", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(camelize),
  cancelLesson: (bookingId) => httpClient(`/student/lesson-bookings/${bookingId}/cancel`, { method: "POST", body: "{}" }).then(camelize),
  getOrganizationLessonBookings: (organizationId) => endpoint(
    `${organizationPath(organizationId, "lesson-bookings")}?perPage=100`,
    []
  ).then(camelize),
  getLearningSessions: (organizationId, filters = {}) => {
    const query = new URLSearchParams({ perPage: "100", ...filters });
    return endpoint(`${organizationPath(organizationId, "learning-sessions")}?${query}`, []).then(camelize);
  },
  createLearningSession: (organizationId, payload) => httpClient(
    organizationPath(organizationId, "learning-sessions"),
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  getSessionAttendance: (organizationId, sessionId) => httpClient(
    `${organizationPath(organizationId, "learning-sessions")}/${sessionId}/attendance`
  ).then(camelize),
  markSessionAttendance: (organizationId, sessionId, records) => httpClient(
    `${organizationPath(organizationId, "learning-sessions")}/${sessionId}/attendance`,
    { method: "PUT", body: JSON.stringify({ records }) }
  ).then(camelize),
  lockSessionAttendance: (organizationId, sessionId) => httpClient(
    `${organizationPath(organizationId, "learning-sessions")}/${sessionId}/attendance/lock`,
    { method: "POST", body: "{}" }
  ).then(camelize),
  generateAttendanceQr: (organizationId, sessionId, validForMinutes = 10) => httpClient(
    `${organizationPath(organizationId, "learning-sessions")}/${sessionId}/attendance/qr`,
    { method: "POST", body: JSON.stringify({ validForMinutes }) }
  ).then(camelize),
  checkInAttendance: (sessionId, token) => httpClient(
    "/student/attendance/check-in",
    { method: "POST", body: JSON.stringify({ sessionId, token }) }
  ).then(camelize),
  getAttendanceHistory: (organizationId, sessionId) => endpoint(
    `${organizationPath(organizationId, "learning-sessions")}/${sessionId}/attendance/history`,
    []
  ).then(camelize),
  getMyAttendance: () => endpoint("/student/attendance?perPage=100", { records: [], summary: {} }).then(camelize),
  getGuardians: (organizationId) => endpoint(
    `${organizationPath(organizationId, "guardians")}?perPage=100`,
    []
  ).then(camelize),
  linkGuardian: (organizationId, payload) => httpClient(
    organizationPath(organizationId, "guardians"),
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  unlinkGuardian: (organizationId, linkId) => httpClient(
    `${organizationPath(organizationId, "guardians")}/${linkId}`,
    { method: "DELETE" }
  ).then(camelize),
  sendGuardianWeeklyReports: (organizationId) => httpClient(
    organizationPath(organizationId, "guardians/weekly-reports/send"),
    { method: "POST", body: "{}" }
  ).then(camelize),
  getGuardianStudents: () => endpoint("/guardian/students", []).then(camelize),
  getGuardianAttendance: (studentId) => endpoint(
    `/guardian/students/${studentId}/attendance?perPage=100`,
    { student: null, records: [], summary: {} }
  ).then(camelize),
  exportBookings: (organizationId, filters = {}) => {
    const query = new URLSearchParams({ format: "xlsx", kind: "all", ...filters });
    return downloadFile(
      `${organizationPath(organizationId, "reports/bookings")}?${query}`,
      "aio-bookings.xls"
    );
  },
  exportAttendance: (organizationId, filters = {}) => {
    const query = new URLSearchParams({ format: "xlsx", ...filters });
    return downloadFile(
      `${organizationPath(organizationId, "reports/attendance")}?${query}`,
      "aio-attendance.xls"
    );
  }
};
