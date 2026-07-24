import { httpClient } from "./httpClient";

function camelKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelize(value) {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [camelKey(key), camelize(item)])
  );
}

function money(minor) {
  return minor == null ? null : Number(minor) / 100;
}

function normalizeCourse(raw) {
  const course = camelize(raw);
  return {
    ...course,
    academyId: course.academyId || course.academy?.id || course.academyProfileId,
    instructorId: course.instructorId || course.instructor?.id,
    categoryId: course.categoryId || course.category?.id,
    coverUrl: course.coverUrl || course.cover,
    price: money(course.priceMinor) ?? Number(course.price || 0),
    discountedPrice: money(course.discountedPriceMinor),
    sessions: course.sessions ?? course.sessionsCount ?? 0,
    batches: (course.batches || []).map(normalizeBatch)
  };
}

function normalizeBatch(raw) {
  const batch = camelize(raw);
  const occupied = Number(batch.reservedSeats || 0) + Number(batch.confirmedSeats || 0);
  return {
    ...batch,
    titleAr: batch.titleAr || batch.title,
    reservedSeats: Number(batch.reservedSeats || 0),
    confirmedSeats: Number(batch.confirmedSeats || 0),
    remainingSeats: batch.remainingSeats ?? Math.max(0, Number(batch.capacity || 0) - occupied)
  };
}

function normalizeAcademy(raw) {
  const academy = camelize(raw);
  const name = academy.publicName || academy.name || "";
  return {
    ...academy,
    name,
    nameAr: academy.publicNameAr || academy.nameAr || name,
    public: academy.isPublic ?? academy.public ?? false,
    verified: academy.verificationStatus === "verified" || academy.verified === true,
    status: academy.verificationStatus === "verified"
      ? "approved"
      : academy.verificationStatus || academy.status || "pending",
    branches: academy.branches || [],
    deliveryMethods: academy.deliveryMethods || [],
    initials: academy.initials || name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
  };
}

function normalizeInstructor(raw) {
  const instructor = camelize(raw);
  return {
    ...instructor,
    nameAr: instructor.nameAr || instructor.name,
    active: instructor.status === "active",
    specialty: instructor.specialty || instructor.specialties?.[0] || ""
  };
}

function normalizeCategory(raw) {
  const category = camelize(raw);
  return { ...category, nameAr: category.nameAr || category.name };
}

function normalizeBooking(raw) {
  const booking = camelize(raw);
  return {
    ...booking,
    amount: money(booking.amountMinor) ?? Number(booking.amount || 0),
    studentName: booking.studentName || booking.student?.name || ""
  };
}

function normalizeEnrollment(raw) {
  const enrollment = camelize(raw);
  return {
    ...enrollment,
    status: enrollment.status || enrollment.enrollmentStatus
  };
}

function normalizePromotion(raw) {
  const promotion = camelize(raw);
  return {
    ...promotion,
    impressions: Number(promotion.impressions || 0),
    clicks: Number(promotion.clicks || 0),
    bookingConversions: Number(promotion.bookingConversions || 0)
  };
}

function mergeById(...lists) {
  return [...new Map(lists.flat().filter(Boolean).map((item) => [item.id, item])).values()];
}

function academyPayload(payload) {
  return {
    slug: payload.slug,
    publicName: payload.name || payload.publicName,
    publicNameAr: payload.nameAr || payload.publicNameAr || null,
    description: payload.description,
    descriptionAr: payload.descriptionAr || null,
    phone: payload.phone || null,
    email: payload.email || null,
    website: payload.website || null,
    location: payload.location || null,
    branches: payload.branches || [],
    deliveryMethods: payload.deliveryMethods || [],
    cancellationPolicy: payload.cancellationPolicy || null,
    isPublic: payload.public ?? payload.isPublic ?? false
  };
}

function instructorPayload(payload) {
  return {
    userId: payload.userId || null,
    name: payload.name,
    nameAr: payload.nameAr || null,
    bio: payload.bio || null,
    bioAr: payload.bioAr || null,
    specialties: payload.specialties || (payload.specialty ? [payload.specialty] : []),
    socialLinks: payload.socialLinks || [],
    status: payload.status || (payload.active === false ? "inactive" : "active")
  };
}

function coursePayload(payload) {
  return {
    title: payload.title,
    titleAr: payload.titleAr || null,
    shortDescription: payload.shortDescription || null,
    shortDescriptionAr: payload.shortDescriptionAr || null,
    description: payload.description || null,
    descriptionAr: payload.descriptionAr || null,
    instructorId: payload.instructorId || null,
    categoryId: payload.categoryId || null,
    educationLevel: payload.educationLevel || payload.level || null,
    subject: payload.subject || null,
    deliveryType: payload.deliveryType,
    priceMinor: Math.round(Number(payload.priceMinor ?? Number(payload.price || 0) * 100)),
    discountedPriceMinor: payload.discountedPrice == null || payload.discountedPrice === ""
      ? null
      : Math.round(Number(payload.discountedPriceMinor ?? payload.discountedPrice * 100)),
    currency: payload.currency || "EGP",
    discountEndsAt: payload.discountEndsAt || null,
    learningOutcomes: payload.learningOutcomes || [],
    requirements: payload.requirements || [],
    duration: payload.duration || null,
    sessionsCount: Number(payload.sessionsCount || payload.sessions || 1)
  };
}

function batchPayload(payload) {
  return {
    courseId: payload.courseId,
    roomId: payload.roomId,
    title: payload.title,
    titleAr: payload.titleAr || null,
    startDate: payload.startDate,
    endDate: payload.endDate,
    schedule: payload.schedule,
    deliveryType: payload.deliveryType,
    capacity: Number(payload.capacity),
    location: payload.location || null,
    meetingReference: payload.meetingReference || null,
    enrollmentStartsAt: payload.enrollmentStartsAt || null,
    enrollmentEndsAt: payload.enrollmentEndsAt || null,
    status: payload.status || "draft"
  };
}

function payloadFor(key, payload) {
  if (key === "academies") return academyPayload(payload);
  if (key === "instructors") return instructorPayload(payload);
  if (key === "courses") return coursePayload(payload);
  if (key === "batches") return batchPayload(payload);
  if (key === "invitations") {
    return {
      email: payload.email,
      phone: payload.phone || null,
      role: payload.role,
      roomIds: payload.roomIds || [],
      note: payload.note || null,
      expiresInDays: Number(payload.expiresInDays || 7)
    };
  }
  return payload;
}

async function safeRequest(path) {
  try {
    return await httpClient(path);
  } catch (error) {
    if ([403, 404].includes(error.status) || error.code === "MODULE_DISABLED") return [];
    throw error;
  }
}

export const marketplaceRepository = {
  async load({ organizationId, platformAdmin, authenticated }) {
    const [publicCourses, publicAcademies, categories] = await Promise.all([
      safeRequest("/public/courses?perPage=48"),
      safeRequest("/public/academies?perPage=48"),
      safeRequest("/public/categories")
    ]);

    let tenant = {};
    if (organizationId) {
      const [academy, instructors, courses, batches, bookings, promotions, invitations] = await Promise.all([
        safeRequest(`/organizations/${organizationId}/academy-profile`),
        safeRequest(`/organizations/${organizationId}/instructors?perPage=100`),
        safeRequest(`/organizations/${organizationId}/courses?perPage=100`),
        safeRequest(`/organizations/${organizationId}/batches?perPage=100`),
        safeRequest(`/organizations/${organizationId}/bookings?perPage=100`),
        safeRequest(`/organizations/${organizationId}/promotions?perPage=100`),
        safeRequest(`/organizations/${organizationId}/invitations?perPage=100`)
      ]);
      tenant = { academy, instructors, courses, batches, bookings, promotions, invitations };
    }

    let student = {};
    if (authenticated && !platformAdmin) {
      const [bookings, enrollments] = await Promise.all([
        safeRequest("/student/bookings?perPage=100"),
        safeRequest("/student/enrollments?perPage=100")
      ]);
      student = { bookings, enrollments };
    }

    let admin = {};
    if (platformAdmin) {
      const [academies, courses, promotions, adminCategories] = await Promise.all([
        safeRequest("/admin/academies?perPage=100"),
        safeRequest("/admin/courses?perPage=100"),
        safeRequest("/admin/promotions?perPage=100"),
        safeRequest("/admin/categories")
      ]);
      admin = { academies, courses, promotions, categories: adminCategories };
    }

    const allCourseSources = [...publicCourses, ...(tenant.courses || []), ...(admin.courses || [])];
    const nestedPublicBatches = allCourseSources.flatMap((course) => (
      course.batches || []
    ).map((batch) => ({ ...batch, courseId: batch.courseId || course.id, organizationId: batch.organizationId || course.organizationId })));
    const publicInstructors = allCourseSources
      .filter((course) => course.instructor)
      .map((course) => ({ ...course.instructor, organizationId: course.organizationId }));
    return {
      academies: mergeById(
        publicAcademies.map(normalizeAcademy),
        tenant.academy ? [normalizeAcademy(tenant.academy)] : [],
        (admin.academies || []).map(normalizeAcademy)
      ),
      instructors: mergeById(publicInstructors, tenant.instructors || []).map(normalizeInstructor),
      categories: mergeById(categories, admin.categories || []).map(normalizeCategory),
      courses: mergeById(publicCourses, tenant.courses || [], admin.courses || []).map(normalizeCourse),
      batches: mergeById(nestedPublicBatches, tenant.batches || []).map(normalizeBatch),
      bookings: mergeById(tenant.bookings || [], student.bookings || []).map(normalizeBooking),
      enrollments: (student.enrollments || []).map(normalizeEnrollment),
      subscriptions: (student.enrollments || []).map((item) => camelize(item.subscription)).filter(Boolean),
      roomMemberships: [],
      promotions: mergeById(tenant.promotions || [], admin.promotions || []).map(normalizePromotion),
      invitations: (tenant.invitations || []).map(camelize),
      notifications: []
    };
  },

  reserve(payload) {
    return httpClient("/public/bookings", {
      method: "POST",
      body: JSON.stringify({
        courseId: payload.courseId,
        batchId: payload.batchId,
        studentName: payload.studentName,
        email: payload.email,
        phone: payload.phone,
        note: payload.note || null
      })
    });
  },

  create(organizationId, key, payload, platformAdmin = false) {
    if (platformAdmin && key === "categories") {
      return httpClient("/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    const routes = {
      academies: "academy-profile",
      instructors: "instructors",
      courses: "courses",
      batches: "batches",
      promotions: "promotions",
      invitations: "invitations"
    };
    const route = routes[key];
    if (!route) throw new Error(`Creating ${key} is not supported by the API.`);
    return httpClient(`/organizations/${organizationId}/${route}`, {
      method: key === "academies" ? "PUT" : "POST",
      body: JSON.stringify(payloadFor(key, payload))
    });
  },

  update(organizationId, key, id, changes, platformAdmin = false) {
    if (platformAdmin && key === "categories") {
      return httpClient(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(changes)
      });
    }
    if (platformAdmin) return this.moderate(key, id, changes);
    if (key === "academies") {
      return httpClient(`/organizations/${organizationId}/academy-profile`, {
        method: "PUT",
        body: JSON.stringify(academyPayload(changes))
      });
    }
    if (key === "instructors" || key === "courses") {
      return httpClient(`/organizations/${organizationId}/${key}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payloadFor(key, changes))
      });
    }
    if (key === "invitations" && (changes.action === "resend" || changes.status === "pending")) {
      return httpClient(`/organizations/${organizationId}/invitations/${id}/resend`, { method: "POST", body: "{}" });
    }
    if (key === "invitations" && changes.status === "cancelled") {
      return httpClient(`/organizations/${organizationId}/invitations/${id}`, { method: "DELETE" });
    }
    throw new Error(`Updating ${key} is not supported by the API.`);
  },

  bookingAction(organizationId, bookingId, action, payload = {}) {
    return httpClient(`/organizations/${organizationId}/bookings/${bookingId}/${action}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  moderate(key, id, changes) {
    let route;
    if (key === "courses") route = changes.status === "published" ? "approve" : "reject";
    if (key === "academies") route = changes.status === "approved" ? "verify" : "reject";
    if (key === "promotions") route = changes.status === "approved" ? "approve" : "reject";
    if (!route) throw new Error(`Moderating ${key} is not supported.`);
    return httpClient(`/admin/${key}/${id}/${route}`, {
      method: "POST",
      body: JSON.stringify({ reason: changes.rejectionReason || changes.reason || null })
    });
  }
};
