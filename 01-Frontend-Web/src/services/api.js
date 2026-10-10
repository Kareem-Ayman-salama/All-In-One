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
  createOrganization: (payload) => httpClient("/organizations", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(camelize),
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
      members: room.membershipsCount ?? room.members ?? 0,
      files: room.filesCount ?? room.files ?? 0,
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
        plan: subscription?.plan?.name || subscription?.plan?.code || item.plan || "—",
        users: item.membershipsCount ?? item.users ?? 0,
        rooms: item.roomsCount ?? item.rooms ?? 0,
        files: item.filesCount ?? item.files ?? 0,
        revenue: item.revenue ?? null,
        expiresAt: subscription?.currentPeriodEndsAt || item.expiresAt || null,
        subscriptionStatus: subscription?.status || (item.status === "Active" ? "active" : item.status === "Expiring soon" ? "past_due" : "none"),
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
  getNotificationPreferences: (organizationId) => endpoint(
    `/notification-preferences${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
    {
      inAppEnabled: true,
      emailEnabled: true,
      pushEnabled: true,
      bookingUpdates: true,
      announcements: true,
      subscriptionReminders: true
    }
  ).then(camelize),
  updateNotificationPreferences: (payload) => shouldUseMockApi()
    ? delay(payload)
    : httpClient("/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(payload)
    }).then(camelize),
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
  getEvents: (organizationId) => organizationId
    ? endpoint(`${organizationPath(organizationId, "events")}?perPage=100`, [])
      .then(camelize)
      .catch((error) => {
        if ([403, 404].includes(error.status) || error.code === "MODULE_DISABLED") return [];
        throw error;
      })
    : Promise.resolve([]),
  getPersonalReminders: () => endpoint("/calendar/reminders", []).then(camelize),
  createPersonalReminder: (payload) => shouldUseMockApi()
    ? delay({
      id: `reminder-${Date.now()}`,
      type: "personal_reminder",
      isPrivate: true,
      ...payload
    })
    : httpClient("/calendar/reminders", {
      method: "POST",
      body: JSON.stringify(payload)
    }).then(camelize),
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
  revokeOtherSessions: () => httpClient("/sessions/others", {
    method: "DELETE"
  }).then(camelize),
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
  getGuardianAssignments: (studentId) => endpoint(
    `/guardian/students/${studentId}/assignments`,
    { student: null, submissions: [] }
  ).then(camelize),
  getGuardianQuizzes: (studentId) => endpoint(
    `/guardian/students/${studentId}/quizzes`,
    { student: null, attempts: [] }
  ).then(camelize),
  getOrganizationLeads: (organizationId, params = {}) => endpoint(
    `${organizationPath(organizationId, "crm/leads")}?${new URLSearchParams(params)}`,
    []
  ).then(camelize),
  createOrganizationLead: (organizationId, payload) => httpClient(
    organizationPath(organizationId, "crm/leads"),
    { method: "POST", body: JSON.stringify(payload) }
  ).then(camelize),
  updateOrganizationLead: (organizationId, leadId, payload) => httpClient(
    `${organizationPath(organizationId, "crm/leads")}/${leadId}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  ).then(camelize),
  convertOrganizationLead: (organizationId, leadId) => httpClient(
    `${organizationPath(organizationId, "crm/leads")}/${leadId}/convert`,
    { method: "POST" }
  ).then(camelize),
  exportBookings: (organizationId, filters = {}) => {
    const query = new URLSearchParams({ format: "xlsx", kind: "all", ...filters });
    return downloadFile(
      `${organizationPath(organizationId, "reports/bookings")}?${query}`,
      "ain-bookings.xls"
    );
  },
  exportAttendance: (organizationId, filters = {}) => {
    const query = new URLSearchParams({ format: "xlsx", ...filters });
    return downloadFile(
      `${organizationPath(organizationId, "reports/attendance")}?${query}`,
      "ain-attendance.xls"
    );
  },
  getStudentDevices: () => endpoint("/student/devices", [
    {
      id: "dev-current",
      deviceName: window.navigator?.userAgent?.includes("Mac") ? "Apple MacBook Pro" : "Windows PC (Current Device)",
      platform: "web",
      status: "approved",
      lastSeenAt: new Date().toISOString()
    }
  ]),
  requestDeviceReset: (payload) => shouldUseMockApi()
    ? delay({ status: "pending", ticketId: "REQ-" + Math.floor(1000 + Math.random() * 9000), message: "Device reset request submitted" })
    : httpClient("/student/device-reset-request", { method: "POST", body: JSON.stringify(payload) }).then(camelize),
  getSupportRequests: (filters = {}) => {
    const query = new URLSearchParams({ perPage: "100", ...filters });
    return endpoint(`/admin/support?${query}`, [
      {
        id: "sup-101",
        name: "د. طارق محمود",
        email: "tarek@cairo-academy.com",
        subject: "One-month trial lead",
        message: "Phone / WhatsApp: 01025849793\nOrganization: أكاديمية القاهرة للغات\nBusiness type: academy\nExpected students: 120\nProtected content: فيديوهات لغة إنجليزية",
        priority: "high",
        status: "open",
        createdAt: new Date().toISOString()
      },
      {
        id: "sup-102",
        name: "م. محمد سامي",
        email: "sami@math-center.com",
        subject: "Device Reset Request: اشتريت هاتف جديد",
        message: "Student requested device reset for old phone screen broken.",
        priority: "high",
        status: "in_progress",
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]).then(camelize);
  },
  updateSupportRequest: (id, payload) => shouldUseMockApi()
    ? delay({ id, ...payload, updatedAt: new Date().toISOString() })
    : httpClient(`/admin/support/${id}`, { method: "PATCH", body: JSON.stringify(payload) }).then(camelize),
  sendSupportMessage: (payload) => shouldUseMockApi()
    ? delay({ id: "sup-" + Date.now(), status: "open", message: "Your message has been received" })
    : httpClient("/support", { method: "POST", body: JSON.stringify(payload) }).then(camelize),
  checkoutPayment: (payload) => shouldUseMockApi()
    ? delay({
        provider: "paymob",
        paymentId: "pay-" + Date.now(),
        providerReference: "ord-" + Math.floor(100000 + Math.random() * 900000),
        clientSecret: "tok_simulated_" + Math.random().toString(36).substring(2),
        checkoutUrl: "/checkout/paymob?payment_id=pay-" + Date.now(),
        amountMinor: 100000,
        currency: "EGP"
      })
    : httpClient("/payments/checkout", { method: "POST", body: JSON.stringify(payload) }).then(camelize),
  getPaymentStatus: (paymentId) => shouldUseMockApi()
    ? delay({ payment: { id: paymentId, status: "paid" }, isConfirmed: true })
    : httpClient(`/payments/${paymentId}/status`, { method: "GET" }).then(camelize),
  simulatePaymentSuccess: (paymentId) => shouldUseMockApi()
    ? delay({ payment: { id: paymentId, status: "paid" }, message: "Simulated payment successful" })
    : httpClient("/payments/simulate-success", { method: "POST", body: JSON.stringify({ payment_id: paymentId }) }).then(camelize),

  // Advanced Platform Features
  getCertificates: (filters = {}) => {
    const query = new URLSearchParams(filters);
    return endpoint(`/certificates?${query}`, [
      {
        id: "cert-01",
        certificateNumber: "AIN-2026-948123",
        verificationCode: "CERT-9A7B-42K8",
        issueDate: "2026-09-20",
        gradeScore: 98,
        status: "issued",
        student: { id: "std-1", name: "أحمد إبراهيم علي" },
        course: { id: "c-101", title: "دبلومة هندسة البرمجيات وتطبيقات الويب والموبايل", titleAr: "دبلومة هندسة البرمجيات" },
        organization: { id: "org-1", name: "أكاديمية التقنية المتقدمة", nameAr: "أكاديمية التقنية المتقدمة" }
      }
    ]).then(camelize);
  },
  generateCertificate: (payload) => {
    const orgId = payload?.organizationId;
    const url = orgId ? `/organizations/${orgId}/certificates` : "/certificates";
    return shouldUseMockApi()
      ? delay({
          id: "cert-" + Date.now(),
          certificateNumber: "AIN-2026-" + Math.floor(100000 + Math.random() * 900000),
          verificationCode: "CERT-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
          issueDate: new Date().toISOString().split("T")[0],
          gradeScore: payload.gradeScore || 95,
          status: "issued",
          ...payload
        })
      : httpClient(url, { method: "POST", body: JSON.stringify(payload) }).then(camelize);
  },
  verifyCertificatePublic: (code) => shouldUseMockApi()
    ? delay({
        valid: true,
        certificate: {
          certificateNumber: "AIN-2026-948123",
          verificationCode: code.toUpperCase(),
          issueDate: "2026-09-20",
          gradeScore: 98,
          status: "issued",
          studentName: "أحمد إبراهيم علي",
          courseTitle: "دبلومة هندسة البرمجيات وتطبيقات الويب والموبايل",
          organizationName: "أكاديمية التقنية المتقدمة"
        }
      })
    : httpClient(`/public/certificates/verify/${code}`, { method: "GET" }).then(camelize),

  getRoomDiscussions: (roomId) => endpoint(`/rooms/${roomId}/discussions`, [
    {
      id: "disc-1",
      title: "استفسار بخصوص معمارية MVC في مشروع التخرج",
      body: "السلام عليكم، هل يفضل فصل خدمات الـ Service Layer عن الـ Controller في هذا الكورس؟",
      isPinned: true,
      likesCount: 14,
      commentsCount: 2,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      user: { id: "u-10", name: "يوسف حسن", email: "youssef@student.com" },
      comments: [
        {
          id: "comm-1",
          body: "نعم بالتأكيد! هذا يضمن الـ Separation of Concerns ويجعل الكود قابلاً للاختبار بسهولة.",
          isInstructorReply: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: { id: "inst-1", name: "م. طارق علي (المعلم المعتمد)" }
        }
      ]
    }
  ]).then(camelize),
  createRoomDiscussion: (roomId, payload) => shouldUseMockApi()
    ? delay({ id: "disc-" + Date.now(), roomId, ...payload, isPinned: false, likesCount: 0, commentsCount: 0, createdAt: new Date().toISOString(), comments: [] })
    : httpClient(`/rooms/${roomId}/discussions`, { method: "POST", body: JSON.stringify(payload) }).then(camelize),
  addDiscussionComment: (discussionId, payload) => shouldUseMockApi()
    ? delay({ id: "comm-" + Date.now(), discussionId, ...payload, isInstructorReply: false, createdAt: new Date().toISOString() })
    : httpClient(`/discussions/${discussionId}/comments`, { method: "POST", body: JSON.stringify(payload) }).then(camelize),
  toggleDiscussionPin: (discussionId) => shouldUseMockApi()
    ? delay({ id: discussionId, isPinned: true })
    : httpClient(`/discussions/${discussionId}/pin`, { method: "POST" }).then(camelize),

  saveVideoProgress: (payload) => shouldUseMockApi()
    ? delay({ contentId: payload.contentId, lastPositionSeconds: payload.lastPositionSeconds, completionPercentage: Math.min(100, Math.round((payload.watchedSeconds / (payload.totalDurationSeconds || 1)) * 100)), isCompleted: (payload.watchedSeconds / (payload.totalDurationSeconds || 1)) >= 0.85 })
    : httpClient("/video-progress", { method: "POST", body: JSON.stringify(payload) }).then(camelize),
  getVideoProgress: (contentId) => endpoint(`/video-progress/${contentId}`, { contentId, lastPositionSeconds: 0, completionPercentage: 0, isCompleted: false }).then(camelize),

  scheduleLiveMeeting: (payload) => {
    const orgId = payload?.organizationId;
    const url = orgId ? `/organizations/${orgId}/meetings/schedule` : "/meetings/schedule";
    return shouldUseMockApi()
      ? delay({
          id: "sess-" + Date.now(),
          ...payload,
          status: "scheduled",
          meetingLink: payload.meetingLink || (payload.meetingProvider === "zoom" ? "https://zoom.us/j/8429184712?pwd=ainpass" : "https://meet.google.com/ain-meet-live"),
          meetingId: payload.meetingId || "842 918 4712",
          meetingPasscode: payload.meetingPasscode || "ain2026"
        })
      : httpClient(url, { method: "POST", body: JSON.stringify(payload) }).then(camelize);
  },
  getUpcomingMeetings: () => endpoint("/meetings/upcoming?scope=all", [
    {
      id: "sess-meet-1",
      title: "جلسة المراجعة الشاملة المباشرة (Zoom)",
      titleAr: "جلسة المراجعة الشاملة المباشرة",
      startsAt: new Date(Date.now() + 3600000 * 4).toISOString(),
      endsAt: new Date(Date.now() + 3600000 * 6).toISOString(),
      meetingProvider: "zoom",
      meetingLink: "https://zoom.us/j/9128374615?pwd=masterclass",
      meetingId: "912 837 4615",
      meetingPasscode: "learn2026",
      notes: "يرجى تجهيز الأسئلة المتعلقة بـ Database Migrations & Relations",
      academyName: "أكاديمية التقنية المتقدمة",
      attendanceCount: 0,
      invitedCount: 24
    },
    {
      id: "sess-meet-completed-1",
      title: "Database design workshop",
      titleAr: "ورشة تصميم قواعد البيانات",
      startsAt: new Date(Date.now() - 3600000 * 30).toISOString(),
      endsAt: new Date(Date.now() - 3600000 * 28).toISOString(),
      meetingProvider: "zoom",
      meetingLink: "https://zoom.us/j/closed",
      notes: "تمت مراجعة تصميم المشروع والتطبيق العملي.",
      academyName: "أكاديمية التقنية المتقدمة",
      status: "completed",
      attendanceStatus: "attended",
      attendanceCount: 21,
      invitedCount: 24
    },
    {
      id: "sess-meet-completed-2",
      title: "Mathematics revision",
      titleAr: "مراجعة الرياضيات الأسبوعية",
      startsAt: new Date(Date.now() - 3600000 * 78).toISOString(),
      endsAt: new Date(Date.now() - 3600000 * 76).toISOString(),
      meetingProvider: "google_meet",
      meetingLink: "https://meet.google.com/closed",
      academyName: "مركز عين للغات",
      status: "completed",
      attendanceStatus: "absent",
      attendanceCount: 17,
      invitedCount: 20
    }
  ]).then(camelize),

  getInvoices: () => endpoint("/invoices", [
    {
      id: "inv-101",
      invoiceNumber: "INV-2026-0812",
      totalMinor: 150000,
      taxMinor: 21000,
      subtotalMinor: 129000,
      currency: "EGP",
      status: "paid",
      issuedAt: "2026-09-18T10:00:00Z",
      dueAt: "2026-09-18T10:00:00Z",
      paidAt: "2026-09-18T10:14:00Z",
      renewalAt: "2026-12-18T10:00:00Z",
      itemsBreakdown: [
        { description: "اشتراك الغرفة البرمجية المتقدمة - 3 شهور", amountMinor: 150000 }
      ],
      organization: { name: "أكاديمية التقنية المتقدمة", nameAr: "أكاديمية التقنية المتقدمة" }
    },
    {
      id: "inv-102",
      invoiceNumber: "INV-2026-1044",
      totalMinor: 95000,
      taxMinor: 0,
      subtotalMinor: 95000,
      currency: "EGP",
      status: "pending",
      issuedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
      renewalAt: new Date(Date.now() + 86400000 * 5).toISOString(),
      itemsBreakdown: [
        { description: "تجديد الاشتراك الشهري — دفعة الرياضيات", amountMinor: 95000 }
      ],
      organization: { name: "AIN Language Center", nameAr: "مركز عين للغات" }
    }
  ]).then(camelize),
  getInvoice: (id) => endpoint(`/invoices/${id}`, {
    id,
    invoiceNumber: "INV-2026-0812",
    totalMinor: 150000,
    taxMinor: 21000,
    subtotalMinor: 129000,
    currency: "EGP",
    status: "paid",
    issuedAt: "2026-09-18T10:00:00Z",
    itemsBreakdown: [
      { description: "اشتراك الغرفة البرمجية المتقدمة - 3 شهور", amountMinor: 150000 }
    ],
    organization: { name: "أكاديمية التقنية المتقدمة", nameAr: "أكاديمية التقنية المتقدمة" }
  }).then(camelize),

  getGuardianConsents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return httpClient(`/guardian/consents${qs ? `?${qs}` : ""}`).then(camelize);
  },
  getGuardianConsent: (id) => httpClient(`/guardian/consents/${id}`).then(camelize),
  requestGuardianConsent: (payload) => httpClient("/guardian/consents/request", {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(camelize),
  verifyGuardianConsentOtp: (id, code) => httpClient(`/guardian/consents/${id}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ code })
  }).then(camelize),
  revokeGuardianConsent: (id, reason) => httpClient(`/guardian/consents/${id}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason })
  }).then(camelize),
  renewGuardianConsent: (id) => httpClient(`/guardian/consents/${id}/renew`, {
    method: "POST"
  }).then(camelize),
  getStudentGuardianConsentStatus: () => httpClient("/student/guardian-consent-status").then(camelize)
};

export const apiService = {
  ...api,
  getRoomDiscussions: api.getRoomDiscussions,
  createRoomDiscussion: api.createRoomDiscussion,
  addDiscussionComment: api.addDiscussionComment,
  toggleDiscussionPin: api.toggleDiscussionPin,
  verifyCertificatePublic: api.verifyCertificatePublic,
  getVideoProgress: api.getVideoProgress,
  saveVideoProgress: api.saveVideoProgress,
  getUpcomingMeetings: api.getUpcomingMeetings,
  scheduleLiveMeeting: api.scheduleLiveMeeting,
  getInvoices: api.getInvoices,
  getInvoice: api.getInvoice
};
