export const API_ERROR_CATALOG = {
  AUTHENTICATION_REQUIRED: { category: "auth", retryable: false, messageEn: "Sign in to continue.", messageAr: "سجل الدخول للمتابعة." },
  INVALID_CREDENTIALS: { category: "auth", retryable: false, messageEn: "Email or password is incorrect.", messageAr: "البريد الإلكتروني أو كلمة المرور غير صحيحة." },
  SESSION_EXPIRED: { category: "auth", retryable: false, messageEn: "Your session has expired. Sign in again.", messageAr: "انتهت جلستك. سجل الدخول مرة أخرى." },
  EMAIL_NOT_VERIFIED: { category: "auth", retryable: false, messageEn: "Verify your email before signing in.", messageAr: "فعّل بريدك الإلكتروني قبل تسجيل الدخول." },
  ACCOUNT_DISABLED: { category: "auth", retryable: false, messageEn: "This account is not available.", messageAr: "هذا الحساب غير متاح." },
  CURRENT_PASSWORD_INCORRECT: { category: "auth", retryable: false, messageEn: "The current password is incorrect.", messageAr: "كلمة المرور الحالية غير صحيحة." },
  INVALID_CODE: { category: "auth", retryable: false, messageEn: "The verification code is invalid or expired.", messageAr: "رمز التحقق غير صحيح أو منتهي الصلاحية." },
  VALIDATION_ERROR: { category: "request", retryable: false, messageEn: "Check the highlighted fields and try again.", messageAr: "راجع الحقول المطلوبة وحاول مرة أخرى." },
  RATE_LIMITED: { category: "request", retryable: true, messageEn: "Too many requests. Please try again later.", messageAr: "طلبات كثيرة جدًا. حاول مرة أخرى لاحقًا." },
  RESOURCE_NOT_FOUND: { category: "request", retryable: false, messageEn: "The requested item was not found.", messageAr: "لم يتم العثور على العنصر المطلوب." },
  FORBIDDEN: { category: "authorization", retryable: false, messageEn: "You do not have permission to do this.", messageAr: "ليست لديك صلاحية لتنفيذ هذا الإجراء." },
  TENANT_ACCESS_DENIED: { category: "workspace", retryable: false, messageEn: "You do not have access to this organization.", messageAr: "ليست لديك صلاحية الوصول إلى هذه المؤسسة." },
  ROOM_ACCESS_DENIED: { category: "workspace", retryable: false, messageEn: "You do not have access to this room.", messageAr: "ليست لديك صلاحية الوصول إلى هذه الغرفة." },
  MODULE_DISABLED: { category: "plan", retryable: false, messageEn: "This module is not enabled for the current plan.", messageAr: "هذه الوحدة غير مفعلة في الخطة الحالية." },
  PLAN_LIMIT_REACHED: { category: "plan", retryable: false, messageEn: "The current plan limit has been reached.", messageAr: "تم الوصول إلى حد الخطة الحالية." },
  CONTENT_NOT_AVAILABLE: { category: "content", retryable: true, messageEn: "This content is not available yet.", messageAr: "هذا المحتوى غير متاح بعد." },
  CONTENT_ACCESS_EXPIRED: { category: "content", retryable: false, messageEn: "Access to this content is no longer available.", messageAr: "لم يعد الوصول لهذا المحتوى متاحًا." },
  DOWNLOAD_DISABLED: { category: "content", retryable: false, messageEn: "Downloading is disabled for this content.", messageAr: "تنزيل هذا المحتوى غير مسموح." },
  FILE_UPLOAD_FAILED: { category: "content", retryable: true, messageEn: "The file could not be uploaded.", messageAr: "تعذر رفع الملف." },
  DEVICE_LIMIT_REACHED: { category: "device", retryable: false, messageEn: "Too many active devices. Revoke a device session and try again.", messageAr: "عدد الأجهزة النشطة كبير جدًا. ألغِ جلسة جهاز وحاول مرة أخرى." },
  COURSE_NOT_BOOKABLE: { category: "booking", retryable: false, messageEn: "This course is not available for booking.", messageAr: "هذا الكورس غير متاح للحجز." },
  BATCH_NOT_BOOKABLE: { category: "booking", retryable: false, messageEn: "This batch is not open for booking.", messageAr: "هذه الدفعة غير متاحة للحجز." },
  ENROLLMENT_CLOSED: { category: "booking", retryable: false, messageEn: "Enrollment is closed for this batch.", messageAr: "تم إغلاق التسجيل في هذه الدفعة." },
  CAPACITY_FULL: { category: "booking", retryable: true, messageEn: "This batch is full.", messageAr: "اكتمل عدد المقاعد في هذه الدفعة." },
  BOOKING_ALREADY_EXISTS: { category: "booking", retryable: false, messageEn: "You already have a booking for this course.", messageAr: "لديك حجز لهذا الكورس بالفعل." },
  SLOT_UNAVAILABLE: { category: "booking", retryable: true, messageEn: "This lesson slot is no longer available.", messageAr: "موعد الحصة لم يعد متاحًا." },
  INVITATION_EXPIRED: { category: "invitation", retryable: false, messageEn: "This invitation is invalid or expired.", messageAr: "هذه الدعوة غير صالحة أو منتهية الصلاحية." },
  INVITATION_EMAIL_MISMATCH: { category: "invitation", retryable: false, messageEn: "This invitation was sent to another email address.", messageAr: "هذه الدعوة مرسلة إلى بريد إلكتروني آخر." },
  INVITATION_INVALID: { category: "invitation", retryable: false, messageEn: "This invitation could not be found.", messageAr: "تعذر العثور على هذه الدعوة." },
  INTERNAL_SERVER_ERROR: { category: "system", retryable: true, messageEn: "Something went wrong. Please try again.", messageAr: "حدث خطأ غير متوقع. حاول مرة أخرى." }
};

export function getApiErrorMessage(error, language = document.documentElement.lang || "en") {
  const catalogEntry = error?.details?.catalog || error?.catalog || API_ERROR_CATALOG[error?.code];
  if (!catalogEntry) return error?.message || fallbackMessage(language);
  return String(language).startsWith("ar")
    ? catalogEntry.messageAr || catalogEntry.messageEn || fallbackMessage(language)
    : catalogEntry.messageEn || catalogEntry.messageAr || fallbackMessage(language);
}

export function isRetryableApiError(error) {
  const catalogEntry = error?.details?.catalog || error?.catalog || API_ERROR_CATALOG[error?.code];
  return Boolean(catalogEntry?.retryable);
}

function fallbackMessage(language) {
  return String(language).startsWith("ar")
    ? "حدث خطأ غير متوقع. حاول مرة أخرى."
    : "Something went wrong. Please try again.";
}
