import 'package:flutter/widgets.dart';

class AppStrings {
  const AppStrings._(this.locale);

  factory AppStrings.of(BuildContext context) {
    return AppStrings._(Localizations.localeOf(context));
  }

  final Locale locale;

  bool get isArabic => locale.languageCode == 'ar';

  String get createAccount => isArabic ? 'إنشاء حساب جديد' : 'Create account';
  String get verifyEmail =>
      isArabic ? 'تأكيد البريد الإلكتروني' : 'Verify email';
  String get verificationCode => isArabic ? 'رمز التحقق' : 'Verification code';
  String get invalidVerificationCode =>
      isArabic ? 'أدخل الرمز المكون من 6 أرقام.' : 'Enter the 6-digit code.';
  String get resendVerification =>
      isArabic ? 'إعادة إرسال رمز التحقق' : 'Resend verification code';
  String get forgotPassword =>
      isArabic ? 'نسيت كلمة المرور؟' : 'Forgot password?';
  String get resetPassword =>
      isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset password';
  String get sendResetCode =>
      isArabic ? 'إرسال رمز الاستعادة' : 'Send reset code';
  String get invitation => isArabic ? 'دعوة الانضمام' : 'Invitation';
  String get invitationUnavailable =>
      isArabic ? 'رابط الدعوة غير متاح حالياً.' : 'Invitation is unavailable.';
  String get acceptInvitation =>
      isArabic ? 'قبول الدعوة والانضمام' : 'Accept invitation';
  String get passwordMinTen => isArabic
      ? 'يجب ألا تقل كلمة المرور عن 10 أحرف.'
      : 'Password must be at least 10 characters.';
  String get organizationOverview =>
      isArabic ? 'نظرة عامة على المؤسسة' : 'Organization overview';
  String get organizationOverviewHint => isArabic
      ? 'متابعة أداء مساحة العمل، المهام المعلقة، والمجالات الإدارية الرئيسية.'
      : 'Review workspace health, pending work, and key management areas.';
  String get quickActions => isArabic ? 'إجراءات سريعة' : 'Quick actions';
  String get subscription => isArabic ? 'الاشتراك' : 'Subscription';
  String get subscriptionPlan =>
      isArabic ? 'خطة الاشتراك' : 'Subscription plan';
  String get activeSubscription =>
      isArabic ? 'اشتراك نشط' : 'Active subscription';
  String get trialSubscription =>
      isArabic ? 'فترة تجريبية' : 'Trial subscription';
  String get graceSubscription => isArabic ? 'فترة سماح' : 'Grace period';
  String get subscriptionExpired =>
      isArabic ? 'انتهى الاشتراك' : 'Subscription expired';
  String get subscriptionPastDue =>
      isArabic ? 'دفعة متأخرة' : 'Payment past due';
  String get noActiveSubscription =>
      isArabic ? 'لا يوجد اشتراك نشط' : 'No active subscription';
  String get renewSubscription =>
      isArabic ? 'تجديد الاشتراك' : 'Renew subscription';
  String get manageSubscriptionOnWeb => isArabic
      ? 'افتح لوحة الويب لتجديد أو ترقية هذه الخطة.'
      : 'Open the web dashboard to renew or change this plan.';
  String subscriptionEndsInDays(int days) {
    return isArabic
        ? 'ينتهي الاشتراك خلال $days أيام'
        : 'Subscription ends in $days days';
  }

  String subscriptionEndedOn(String date) {
    return isArabic ? 'انتهى الاشتراك في $date' : 'Subscription ended on $date';
  }

  String get subscriptionStatusNeedsAttention => isArabic
      ? 'تحتاج مساحة العمل هذه إلى تسوية الفواتير قبل حظر الوحدات.'
      : 'This workspace needs billing attention before modules are blocked.';
  String get planModules => isArabic ? 'وحدات الخطة' : 'Plan modules';
  String get subscriptionOk => isArabic
      ? 'الخطة نشطة وكافة الوحدات متاحة للاستخدام.'
      : 'Plan is active and modules are available.';
  String get accessUnavailable =>
      isArabic ? 'الوصول غير متاح' : 'Access unavailable';
  String get platformOverview =>
      isArabic ? 'نظرة عامة على المنصة' : 'Platform overview';
  String get platformOverviewHint => isArabic
      ? 'مراجعة المؤسسات، الإيرادات، الاشتراكات، الحجوزات، والأداء التشغيلي.'
      : 'Review tenants, revenue, subscriptions, bookings, and operational health.';
  String get platformAccessRequired => isArabic
      ? 'يتطلب فتح هذه الشاشة صلاحيات إدارة المنصة.'
      : 'Platform access is required to open this screen.';
  String get academyApprovals =>
      isArabic ? 'اعتمادات الأكاديميات' : 'Academy approvals';
  String get academyApprovalsHint => isArabic
      ? 'مراجعة ملفات الأكاديميات وقبول أو رفض ظهورها في المنصة.'
      : 'Review academy profiles and verify or reject marketplace visibility.';
  String get verified => isArabic ? 'موثق' : 'Verified';
  String get noAcademyApprovals => isArabic
      ? 'لا توجد أكاديميات بانتظار المراجعة.'
      : 'No academies are waiting for review.';
  String get verifyAcademy => isArabic ? 'توثيق الأكاديمية' : 'Verify academy';
  String get academyVerified =>
      isArabic ? 'تم توثيق الأكاديمية بنجاح.' : 'Academy verified.';
  String get academyRejected =>
      isArabic ? 'تم رفض طلب الأكاديمية.' : 'Academy rejected.';
  String get publicProfile =>
      isArabic ? 'الملف التعريفي العام' : 'Public profile';
  String get platformCategories =>
      isArabic ? 'تصنيفات المنصة' : 'Platform categories';
  String get platformCategoriesHint => isArabic
      ? 'إدارة تصنيفات الدورات، ترتيبها، وظهورها في المنصة.'
      : 'Manage marketplace category labels, ordering, and visibility.';
  String get createCategory => isArabic ? 'إضافة تصنيف' : 'Create category';
  String get editCategory => isArabic ? 'تعديل التصنيف' : 'Edit category';
  String get deleteCategory => isArabic ? 'حذف التصنيف' : 'Delete category';
  String get deleteCategoryPrompt => isArabic
      ? 'هل تريد حذف هذا التصنيف؟ لا يمكن حذف تصنيف يحتوي على دورات.'
      : 'Delete this category? Categories with courses cannot be removed.';
  String get categorySaved =>
      isArabic ? 'تم حفظ التصنيف بنجاح.' : 'Category saved.';
  String get categoryDeleted =>
      isArabic ? 'تم حذف التصنيف بنجاح.' : 'Category deleted.';
  String get activeCategories =>
      isArabic ? 'التصنيفات النشطة' : 'Active categories';
  String get categoryCourses => isArabic ? 'دورات التصنيف' : 'Category courses';
  String get noCategories =>
      isArabic ? 'لا توجد تصنيفات حالياً.' : 'No categories found.';
  String get categoryName => isArabic ? 'اسم التصنيف' : 'Category name';
  String get categoryNameAr =>
      isArabic ? 'اسم التصنيف بالعربية' : 'Arabic category name';
  String get slugOptional =>
      isArabic ? 'الرابط الدائم (اختياري)' : 'Slug optional';
  String get parentCategory => isArabic ? 'التصنيف الرئيسي' : 'Parent category';
  String get noParentCategory =>
      isArabic ? 'بدون تصنيف رئيسي' : 'No parent category';
  String get sortOrder => isArabic ? 'ترتيب العرض' : 'Sort order';
  String get active => isArabic ? 'نشط' : 'Active';
  String get inactive => isArabic ? 'غير نشط' : 'Inactive';
  String get courseApprovals =>
      isArabic ? 'موافقات الدورات' : 'Course approvals';
  String get courseApprovalsHint => isArabic
      ? 'مراجعة الدورات المقدمة للنشر والموافقة عليها أو رفضها.'
      : 'Review pending marketplace courses and approve or reject publication.';
  String get pendingReview => isArabic ? 'قيد المراجعة' : 'Pending review';
  String get rejected => isArabic ? 'مرفوض' : 'Rejected';
  String get noCourseApprovals => isArabic
      ? 'لا توجد دورات بانتظار المراجعة.'
      : 'No courses are waiting for review.';
  String get approveAndPublish =>
      isArabic ? 'موافقة ونشر الدورة' : 'Approve and publish';
  String get rejectWithNote =>
      isArabic ? 'رفض مع إبداء السبب' : 'Reject with note';
  String get moderationNote => isArabic ? 'ملاحظة الإشراف' : 'Moderation note';
  String get courseApproved =>
      isArabic ? 'تمت الموافقة على الدورة ونشرها.' : 'Course approved.';
  String get courseRejected => isArabic ? 'تم رفض الدورة.' : 'Course rejected.';
  String get sessions => isArabic ? 'حصص' : 'sessions';
  String get promotionApprovals =>
      isArabic ? 'موافقات الحملات الترويجية' : 'Promotion approvals';
  String get promotionApprovalsHint => isArabic
      ? 'مراجعة طلبات الإعلانات المميزة وقبولها أو رفضها.'
      : 'Review sponsored placements and approve or reject campaigns.';
  String get pendingApproval => isArabic ? 'قيد الموافقة' : 'Pending approval';
  String get noPromotionApprovals => isArabic
      ? 'لا توجد حملات بانتظار المراجعة.'
      : 'No promotions are waiting for review.';
  String get approvePromotion =>
      isArabic ? 'الموافقة على الحملة' : 'Approve promotion';
  String get promotionApproved =>
      isArabic ? 'تمت الموافقة على الحملة الترويجية.' : 'Promotion approved.';
  String get promotionRejected =>
      isArabic ? 'تم رفض الحملة الترويجية.' : 'Promotion rejected.';
  String get impressions => isArabic ? 'المشاهدات' : 'Impressions';
  String get clicks => isArabic ? 'النقرات' : 'Clicks';
  String get bookingConversions => isArabic ? 'الحجوزات المكتملة' : 'Bookings';
  String get activeOrganizations =>
      isArabic ? 'المؤسسات النشطة' : 'Active organizations';
  String get latestTenants =>
      isArabic ? 'أحدث المؤسسات المسجلة' : 'Latest tenants';
  String get noOrganizationsYet =>
      isArabic ? 'لا توجد مؤسسات مسجلة بعد.' : 'No organizations yet.';
  String get moduleUnavailable => isArabic
      ? 'هذه الميزة غير متوفرة في خطة اشتراكك الحالية.'
      : 'This feature is not included in the current plan.';
  String get permissionUnavailable => isArabic
      ? 'ليس لديك الصلاحية لفتح هذه الصفحة.'
      : 'Your role does not include permission to open this screen.';
  String get chooseAnotherWorkspace =>
      isArabic ? 'اختيار مساحة عمل أخرى' : 'Choose another workspace';
  String get backToHome => isArabic ? 'العودة للرئيسية' : 'Back to home';
  String get organizationBookings =>
      isArabic ? 'حجوزات المؤسسة' : 'Organization bookings';
  String get organizationBookingsHint => isArabic
      ? 'مراجعة طلبات حجز الطلاب وتأكيدها أو إلغاؤها.'
      : 'Review student booking requests and confirm, reject, or cancel through the backend.';
  String get confirmBooking => isArabic ? 'تأكيد الحجز' : 'Confirm booking';
  String get rejectBooking => isArabic ? 'رفض الحجز' : 'Reject booking';
  String get cancelBooking => isArabic ? 'إلغاء الحجز' : 'Cancel booking';
  String get organizationContent =>
      isArabic ? 'محتوى المؤسسة' : 'Organization content';
  String get organizationContentHint => isArabic
      ? 'مراجعة محتوى الغرف الآمن وإضافة روابط وملفات تعليمية.'
      : 'Review protected room content and add published learning links.';
  String get addContentLink =>
      isArabic ? 'إضافة رابط محتوى' : 'Add content link';
  String get addContentFile =>
      isArabic ? 'إضافة ملف محتوى' : 'Add content file';
  String get contentSource => isArabic ? 'مصدر المحتوى' : 'Content source';
  String get chooseFile => isArabic ? 'اختيار ملف' : 'Choose file';
  String get selectedFile => isArabic ? 'الملف المحدد' : 'Selected file';
  String get fileRequired =>
      isArabic ? 'يرجى اختيار ملف المحتوى.' : 'Choose a content file.';
  String get deleteContent => isArabic ? 'حذف المحتوى' : 'Delete content';
  String get contentItems => isArabic ? 'عناصر المحتوى' : 'Content items';
  String get publishedContent =>
      isArabic ? 'المحتوى المنشور' : 'Published content';
  String get noContentYet =>
      isArabic ? 'لا يوجد محتوى مضاف بعد.' : 'No content yet.';
  String get contentTitle => isArabic ? 'عنوان المحتوى' : 'Content title';
  String get contentTitleRequired =>
      isArabic ? 'أدخل عنوان المحتوى.' : 'Enter a content title.';
  String get externalUrl => isArabic ? 'الرابط الخارجي' : 'External URL';
  String get validUrlRequired => isArabic
      ? 'أدخل رابط HTTP أو HTTPS صحيح.'
      : 'Enter a valid HTTP or HTTPS URL.';
  String get roomRequired =>
      isArabic ? 'اختر الغرفة التعليمية.' : 'Choose a room.';
  String contentTypeLabel(String type) {
    return switch (type) {
      'pdf' => isArabic ? 'مستند PDF' : 'PDF',
      'image' => isArabic ? 'صورة' : 'Image',
      'video' => isArabic ? 'فيديو' : 'Video',
      'link' => isArabic ? 'رابط خارجي' : 'Link',
      _ => isArabic ? 'ملف' : 'File',
    };
  }

  String get organizationAnnouncements =>
      isArabic ? 'إعلانات المؤسسة' : 'Organization announcements';
  String get organizationAnnouncementsHint => isArabic
      ? 'نشر ومراجعة إعلانات مساحة العمل للأعضاء والطلاب.'
      : 'Publish and review workspace announcements for members.';
  String get createAnnouncement =>
      isArabic ? 'إنشاء إعلان جديد' : 'Create announcement';
  String get editAnnouncement =>
      isArabic ? 'تعديل الإعلان' : 'Edit announcement';
  String get deleteAnnouncement =>
      isArabic ? 'حذف الإعلان' : 'Delete announcement';
  String get announcementUpdated =>
      isArabic ? 'تم تحديث الإعلان بنجاح.' : 'Announcement updated.';
  String get announcementDeleted =>
      isArabic ? 'تم حذف الإعلان بنجاح.' : 'Announcement deleted.';
  String get deleteAnnouncementPrompt =>
      isArabic ? 'هل تريد حذف هذا الإعلان؟' : 'Delete this announcement?';
  String get announcements => isArabic ? 'الإعلانات' : 'Announcements';
  String get pinnedAnnouncements =>
      isArabic ? 'الإعلانات المثبتة' : 'Pinned announcements';
  String get announcementTitle =>
      isArabic ? 'عنوان الإعلان' : 'Announcement title';
  String get announcementTitleRequired =>
      isArabic ? 'أدخل عنوان الإعلان.' : 'Enter an announcement title.';
  String get announcementBody => isArabic ? 'نص الإعلان' : 'Announcement body';
  String get announcementBodyRequired =>
      isArabic ? 'أدخل نص الإعلان.' : 'Enter an announcement body.';
  String get pinAnnouncement =>
      isArabic ? 'تثبيت الإعلان في الأعلى' : 'Pin announcement';
  String get announcementAudience =>
      isArabic ? 'الجمهور المستهدف' : 'Announcement audience';
  String get organizationWide =>
      isArabic ? 'لكافة أعضاء المؤسسة' : 'Organization-wide';
  String get targetRoom => isArabic ? 'غرفة تعليمية محددة' : 'Target room';
  String get roomRequiredForAnnouncement => isArabic
      ? 'اختر الغرفة المستهدفة لهذا الإعلان.'
      : 'Choose a room for room announcements.';
  String get pinned => isArabic ? 'مثبت' : 'Pinned';
  String announcementAudienceLabel(String audience) {
    return switch (audience) {
      'room' => isArabic ? 'الغرفة' : 'Room',
      _ => isArabic ? 'كامل المؤسسة' : 'Organization',
    };
  }

  String get organizationCourses =>
      isArabic ? 'دورات المؤسسة' : 'Organization courses';
  String get organizationCoursesHint => isArabic
      ? 'متابعة الدورات والدفعات لمساحة العمل المحددة.'
      : 'Review courses and batches from the selected workspace.';
  String get createCourse => isArabic ? 'إنشاء دورة تدريبية' : 'Create course';
  String get editCourse => isArabic ? 'تعديل الدورة التدريبية' : 'Edit course';
  String get submitForReview =>
      isArabic ? 'إرسال للمراجعة والنشر' : 'Submit for review';
  String get createBatch => isArabic ? 'إضافة دفعة طلابية' : 'Create batch';
  String get editBatch => isArabic ? 'تعديل الدفعة' : 'Edit batch';
  String get courseTitle => isArabic ? 'عنوان الدورة' : 'Course title';
  String get courseTitleRequired =>
      isArabic ? 'أدخل عنوان الدورة.' : 'Enter a course title.';
  String get shortDescription => isArabic ? 'نبذة مختصرة' : 'Short description';
  String get subject => isArabic ? 'المادة / التخصص' : 'Subject';
  String get deliveryType => isArabic ? 'طريقة تقديم الدورة' : 'Delivery type';
  String get priceMinor =>
      isArabic ? 'السعر (بالقروش / السنتات)' : 'Price in minor units';
  String get priceMinorRequired =>
      isArabic ? 'أدخل سعرًا صحيحًا.' : 'Enter a valid price.';
  String get courseCreated =>
      isArabic ? 'تم إنشاء الدورة بنجاح.' : 'Course created.';
  String get courseUpdated =>
      isArabic ? 'تم تحديث بيانات الدورة.' : 'Course updated.';
  String get courseSubmittedForReview => isArabic
      ? 'تم إرسال الدورة للمراجعة بنجاح.'
      : 'Course submitted for review.';
  String get batchCreated =>
      isArabic ? 'تم إنشاء الدفعة بنجاح.' : 'Batch created.';
  String get batchUpdated =>
      isArabic ? 'تم تحديث الدفعة بنجاح.' : 'Batch updated.';
  String get batchTitle => isArabic ? 'اسم الدفعة' : 'Batch title';
  String get batchTitleRequired =>
      isArabic ? 'أدخل اسم الدفعة.' : 'Enter a batch title.';
  String get chooseRoom => isArabic ? 'اختر الغرفة' : 'Choose room';
  String get capacity => isArabic ? 'السعة الاستيعابية' : 'Capacity';
  String get capacityRequired =>
      isArabic ? 'أدخل سعة استيعابية صحيحة.' : 'Enter a valid capacity.';
  String get startDate => isArabic ? 'تاريخ البدء' : 'Start date';
  String get endDate => isArabic ? 'تاريخ الانتهاء' : 'End date';
  String get scheduleDay => isArabic ? 'يوم الحصة' : 'Schedule day';
  String get startTime => isArabic ? 'وقت البدء' : 'Start time';
  String get endTime => isArabic ? 'وقت الانتهاء' : 'End time';
  String get noRoomsForBatch => isArabic
      ? 'يرجى إنشاء غرفة أولاً قبل إضافة دفعات.'
      : 'Create a room before adding batches.';
  String get publishedCourses =>
      isArabic ? 'الدورات المنشورة' : 'Published courses';
  String get openBatches =>
      isArabic ? 'الدفعات المتاحة للتسجيل' : 'Open batches';
  String get noOrganizationCourses => isArabic
      ? 'لا توجد دورات في المؤسسة بعد.'
      : 'No organization courses yet.';
  String get noBatchesYet =>
      isArabic ? 'لا توجد دفعات مضافة بعد.' : 'No batches yet.';
  String get organizationEvents =>
      isArabic ? 'فعاليات وتقويم المؤسسة' : 'Organization events';
  String get organizationEventsHint => isArabic
      ? 'جدولة المحاضرات والامتحانات والاجتماعات ومتابعة التقويم.'
      : 'Review the workspace calendar and schedule classes, exams, and meetings.';
  String get createEvent => isArabic ? 'إضافة فعالية' : 'Create event';
  String get deleteEvent => isArabic ? 'حذف الفعالية' : 'Delete event';
  String get events => isArabic ? 'الفعاليات' : 'Events';
  String get scheduledEvents =>
      isArabic ? 'الفعاليات المجدولة' : 'Scheduled events';
  String get noEventsYet =>
      isArabic ? 'لا توجد فعاليات مجدولة بعد.' : 'No events yet.';
  String get allRooms => isArabic ? 'كافة الغرف' : 'All rooms';
  String get eventTitle => isArabic ? 'عنوان الفعالية' : 'Event title';
  String get eventTitleRequired =>
      isArabic ? 'أدخل عنوان الفعالية.' : 'Enter an event title.';
  String get eventType => isArabic ? 'نوع الفعالية' : 'Event type';
  String get startsAt => isArabic ? 'تبدأ في' : 'Starts at';
  String get endsAt => isArabic ? 'تنتهي في' : 'Ends at';
  String get location => isArabic ? 'المكان / الرابط' : 'Location';
  String get validIsoDateRequired => isArabic
      ? 'أدخل تاريخ ووقت صحيح بصيغة ISO.'
      : 'Enter a valid ISO date and time.';
  String eventTypeLabel(String type) {
    return switch (type) {
      'class' => isArabic ? 'محاضرة' : 'Class',
      'exam' => isArabic ? 'امتحان' : 'Exam',
      'meeting' => isArabic ? 'اجتماع' : 'Meeting',
      _ => isArabic ? 'فعالية' : 'Event',
    };
  }

  String eventStatusLabel(String status) {
    return switch (status) {
      'completed' => isArabic ? 'مكتملة' : 'Completed',
      'cancelled' => isArabic ? 'ملغاة' : 'Cancelled',
      _ => isArabic ? 'مجدولة' : 'Scheduled',
    };
  }

  String get organizationTasks =>
      isArabic ? 'مهام مساحة العمل' : 'Organization tasks';
  String get organizationTasksHint => isArabic
      ? 'متابعة المهام التشغيلية، الأولويات، والمواعيد النهائية.'
      : 'Track workspace tasks, priorities, progress, and due dates.';
  String get createTask => isArabic ? 'إنشاء مهمة جديدة' : 'Create task';
  String get deleteTask => isArabic ? 'حذف المهمة' : 'Delete task';
  String get tasks => isArabic ? 'المهام' : 'Tasks';
  String get openTasks => isArabic ? 'المهام المفتوحة' : 'Open tasks';
  String get noTasksYet => isArabic ? 'لا توجد مهام بعد.' : 'No tasks yet.';
  String get taskTitle => isArabic ? 'عنوان المهمة' : 'Task title';
  String get taskTitleRequired =>
      isArabic ? 'أدخل عنوان المهمة.' : 'Enter a task title.';
  String get taskPriority => isArabic ? 'أولوية المهمة' : 'Task priority';
  String get taskStatus => isArabic ? 'حالة المهمة' : 'Task status';
  String get noRoom => isArabic ? 'بدون غرفة' : 'No room';
  String get assignedTo => isArabic ? 'مسندة إلى' : 'Assigned to';
  String get unassigned => isArabic ? 'غير مسندة' : 'Unassigned';
  String get dueAt => isArabic ? 'تاريخ الاستحقاق' : 'Due at';
  String taskPriorityLabel(String priority) {
    return switch (priority) {
      'low' => isArabic ? 'منخفضة' : 'Low',
      'high' => isArabic ? 'عالية' : 'High',
      'urgent' => isArabic ? 'عاجلة' : 'Urgent',
      _ => isArabic ? 'متوسطة' : 'Medium',
    };
  }

  String taskStatusLabel(String status) {
    return switch (status) {
      'in_progress' => isArabic ? 'قيد التنفيذ' : 'In progress',
      'done' => isArabic ? 'مكتملة' : 'Done',
      'cancelled' => isArabic ? 'ملغاة' : 'Cancelled',
      _ => isArabic ? 'للقيام بها' : 'To do',
    };
  }

  String get attendance => isArabic ? 'سجل الحضور' : 'Attendance';
  String get attendanceHint => isArabic
      ? 'متابعة سجلات الحضور للطلاب وأولياء الأمور.'
      : 'Review student and guardian-visible attendance records.';
  String get studentAttendance =>
      isArabic ? 'حضور الطالب' : 'Student attendance';
  String get guardianAttendance =>
      isArabic ? 'حضور الأبناء' : 'Guardian attendance';
  String get attendanceRate => isArabic ? 'نسبة الحضور' : 'Attendance rate';
  String get present => isArabic ? 'حاضر' : 'Present';
  String get absent => isArabic ? 'غائب' : 'Absent';
  String get late => isArabic ? 'متأخر' : 'Late';
  String get excused => isArabic ? 'معذور' : 'Excused';
  String get noAttendanceRecords =>
      isArabic ? 'لا توجد سجلات حضور بعد.' : 'No attendance records yet.';
  String get noGuardianStudents => isArabic
      ? 'لا يوجد طلاب مرتبطون بهذا الحساب.'
      : 'No linked students yet.';
  String get organizationAttendance =>
      isArabic ? 'إدارة الحضور والغياب' : 'Organization attendance';
  String get organizationAttendanceHint => isArabic
      ? 'تسجيل حضور الجلسات، توليد رمز QR لتسجيل الحضور الذاتي، وإغلاق الكشوفات.'
      : 'Mark session attendance, generate check-in QR links, and lock sheets.';
  String get learningSessions =>
      isArabic ? 'الجلسات التعليمية' : 'Learning sessions';
  String get noLearningSessions =>
      isArabic ? 'لا توجد جلسات تعليمية بعد.' : 'No learning sessions yet.';
  String get participants => isArabic ? 'المشاركون' : 'Participants';
  String get records => isArabic ? 'سجلات' : 'records';
  String get lockAttendance =>
      isArabic ? 'إغلاق كشف الحضور' : 'Lock attendance';
  String get generateQr => isArabic ? 'إنشاء رمز QR' : 'Generate QR';
  String get qrGenerated =>
      isArabic ? 'تم نسخ رابط تسجيل الحضور.' : 'Check-in link copied.';
  String get attendanceLocked =>
      isArabic ? 'تم إغلاق كشف الحضور بنجاح.' : 'Attendance locked.';
  String get attendanceUpdated =>
      isArabic ? 'تم تحديث سجل الحضور.' : 'Attendance updated.';

  String attendanceStatusLabel(String status) {
    return switch (status) {
      'absent' => isArabic ? 'غائب' : 'Absent',
      'late' => isArabic ? 'متأخر' : 'Late',
      'excused' => isArabic ? 'معذور' : 'Excused',
      _ => isArabic ? 'حاضر' : 'Present',
    };
  }

  String get organizationMembers =>
      isArabic ? 'أعضاء المؤسسة' : 'Organization members';
  String get organizationMembersHint => isArabic
      ? 'إدارة الأعضاء والأدوار وصلاحيات الوصول في مساحة العمل.'
      : 'Review members, roles, and active access for the selected workspace.';
  String get members => isArabic ? 'الأعضاء' : 'Members';
  String get activeMembers => isArabic ? 'الأعضاء النشطون' : 'Active members';
  String get noMembersYet =>
      isArabic ? 'لا يوجد أعضاء مضافون بعد.' : 'No members yet.';
  String get removeMember => isArabic ? 'إزالة العضو' : 'Remove member';
  String get memberStatus => isArabic ? 'حالة العضو' : 'Member status';
  String memberStatusLabel(String status) {
    return switch (status) {
      'suspended' => isArabic ? 'معلق' : 'Suspended',
      _ => isArabic ? 'نشط' : 'Active',
    };
  }

  String organizationRoleLabel(String role) {
    return switch (role) {
      'organization_owner' => isArabic ? 'مالك المؤسسة' : 'Owner',
      'organization_admin' => isArabic ? 'مدير' : 'Admin',
      'instructor' => isArabic ? 'مدرب / معلّم' : 'Instructor',
      'student' => isArabic ? 'طالب' : 'Student',
      'guardian' => isArabic ? 'ولي أمر' : 'Guardian',
      _ => isArabic ? 'عضو' : 'Member',
    };
  }

  String get organizationInvitations =>
      isArabic ? 'دعوات الانضمام' : 'Organization invitations';
  String get organizationInvitationsHint => isArabic
      ? 'إرسال وإدارة روابط دعوة الأعضاء لمساحة العمل.'
      : 'Invite members and manage pending workspace invitation links.';
  String get inviteMember => isArabic ? 'دعوة عضو جديد' : 'Invite member';
  String get sendInvitation => isArabic ? 'إرسال الدعوة' : 'Send invitation';
  String get invitations => isArabic ? 'الدعوات' : 'Invitations';
  String get pendingInvitations =>
      isArabic ? 'دعوات معلقة' : 'Pending invitations';
  String get noInvitationsYet =>
      isArabic ? 'لا توجد دعوات مرسلة بعد.' : 'No invitations yet.';
  String get resendInvitation =>
      isArabic ? 'إعادة إرسال الدعوة' : 'Resend invitation';
  String get cancelInvitation =>
      isArabic ? 'إلغاء الدعوة' : 'Cancel invitation';
  String get role => isArabic ? 'الدور' : 'Role';
  String get organizationInstructors =>
      isArabic ? 'مدربو المؤسسة' : 'Organization instructors';
  String get organizationInstructorsHint => isArabic
      ? 'إدارة الملفات التعريفية للمدربين والمواعيد المتاحة للحجز.'
      : 'Manage instructor profiles and bookable availability slots.';
  String get createInstructor => isArabic ? 'إضافة مدرب' : 'Create instructor';
  String get editInstructor =>
      isArabic ? 'تعديل بيانات المدرب' : 'Edit instructor';
  String get createInstructorSlot =>
      isArabic ? 'إضافة موعد متاح' : 'Create availability slot';
  String get activeInstructors =>
      isArabic ? 'المدربون النشطون' : 'Active instructors';
  String get openSlots => isArabic ? 'المواعيد المتاحة' : 'Open slots';
  String get noInstructorsYet =>
      isArabic ? 'لا يوجد مدربون مضافون بعد.' : 'No instructors yet.';
  String get instructor => isArabic ? 'المدرب' : 'Instructor';
  String get instructorName => isArabic ? 'اسم المدرب' : 'Instructor name';
  String get instructorStatusLabel =>
      isArabic ? 'حالة المدرب' : 'Instructor status';
  String get arabicName => isArabic ? 'الاسم بالعربية' : 'Arabic name';
  String get bio => isArabic ? 'النبذة التعريفية' : 'Bio';
  String get arabicBio => isArabic ? 'النبذة بالعربية' : 'Arabic bio';
  String get specialties => isArabic ? 'التخصصات' : 'Specialties';
  String get socialLinks => isArabic ? 'روابط التواصل' : 'Social links';
  String get courses => isArabic ? 'دورات' : 'courses';
  String get online => isArabic ? 'عن بُعد (أونلاين)' : 'Online';
  String get onsite => isArabic ? 'حضوري' : 'Onsite';
  String get requiredField =>
      isArabic ? 'هذا الحقل مطلوب.' : 'This field is required.';
  String instructorStatus(String status) {
    return switch (status) {
      'inactive' => isArabic ? 'غير نشط' : 'Inactive',
      _ => isArabic ? 'نشط' : 'Active',
    };
  }

  String get organizationPromotions =>
      isArabic ? 'الحملات الترويجية' : 'Organization promotions';
  String get organizationPromotionsHint => isArabic
      ? 'طلب إعلانات مميزة في المنصة ومتابعة إحصائيات التفاعل.'
      : 'Request marketplace promotion placements and review campaign metrics.';
  String get createPromotion =>
      isArabic ? 'إنشاء حملة ترويجية' : 'Create promotion';
  String get pendingPromotions =>
      isArabic ? 'حملات قيد المراجعة' : 'Pending promotions';
  String get approvedPromotions =>
      isArabic ? 'حملات معتمدة' : 'Approved promotions';
  String get noPromotionsYet =>
      isArabic ? 'لا توجد حملات ترويجية بعد.' : 'No promotions yet.';
  String get organizationAnalytics =>
      isArabic ? 'تحليلات المؤسسة' : 'Organization analytics';
  String get organizationAnalyticsHint => isArabic
      ? 'مؤشرات الأداء للحجوزات، الاشتراكات، الإيرادات، والعمليات.'
      : 'Review workspace KPIs across bookings, enrollments, revenue, and operations.';
  String get rooms => isArabic ? 'الغرف' : 'Rooms';
  String get activeBatches => isArabic ? 'الدفعات النشطة' : 'Active batches';
  String get bookings => isArabic ? 'الحجوزات' : 'Bookings';
  String get confirmedBookings =>
      isArabic ? 'الحجوزات المؤكدة' : 'Confirmed bookings';
  String get bookingConversionRate =>
      isArabic ? 'معدل إتمام الحجز' : 'Booking conversion';
  String get activeEnrollments =>
      isArabic ? 'الاشتراكات النشطة' : 'Active enrollments';
  String get expiringSubscriptions =>
      isArabic ? 'اشتراكات تنتهي قريباً' : 'Expiring subscriptions';
  String get confirmedRevenue =>
      isArabic ? 'الإيرادات المحصلة' : 'Confirmed revenue';
  String get analyticsRange =>
      isArabic ? 'اختر النطاق الزمني للتحليلات' : 'Choose analytics range';
  String get promotionType => isArabic ? 'نوع الترويج' : 'Promotion type';
  String get promotionPlacement => isArabic ? 'موضع الإعلان' : 'Placement';
  String get destinationUrl => isArabic ? 'رابط الوجهة' : 'Destination URL';

  String promotionStatus(String status) {
    return switch (status) {
      'approved' => isArabic ? 'معتمدة' : 'Approved',
      'rejected' => isArabic ? 'مرفوضة' : 'Rejected',
      'active' => isArabic ? 'نشطة' : 'Active',
      _ => isArabic ? 'قيد الموافقة' : 'Pending approval',
    };
  }

  String promotionTypeLabel(String type) {
    return switch (type) {
      'featured_academy' => isArabic ? 'أكاديمية مميزة' : 'Featured academy',
      'homepage_banner' =>
        isArabic ? 'بانر الصفحة الرئيسية' : 'Homepage banner',
      'category_banner' => isArabic ? 'بانر التصنيف' : 'Category banner',
      'search_boost' => isArabic ? 'أولوية نتائج البحث' : 'Search boost',
      _ => isArabic ? 'دورة مميزة' : 'Featured course',
    };
  }

  String promotionPlacementLabel(String placement) {
    return switch (placement) {
      'courses' => isArabic ? 'صفحة الدورات' : 'Courses',
      'academies' => isArabic ? 'صفحة الأكاديميات' : 'Academies',
      'category' => isArabic ? 'صفحة التصنيف' : 'Category',
      'search' => isArabic ? 'نتائج البحث' : 'Search',
      _ => isArabic ? 'الصفحة الرئيسية' : 'Homepage',
    };
  }

  String get organizationRooms =>
      isArabic ? 'الغرف التعليمية' : 'Organization rooms';
  String get organizationRoomsHint => isArabic
      ? 'إنشاء وإدارة الغرف التعليمية وتوزيع الطلاب والمحتوى عليها.'
      : 'Review and create rooms for course members and content access.';
  String get createRoom => isArabic ? 'إنشاء غرفة تعليمية' : 'Create room';
  String get editRoom => isArabic ? 'تعديل الغرفة' : 'Edit room';
  String get deleteRoom => isArabic ? 'حذف الغرفة' : 'Delete room';
  String get roomUpdated =>
      isArabic ? 'تم تحديث بيانات الغرفة.' : 'Room updated.';
  String get roomDeleted => isArabic ? 'تم حذف الغرفة بنجاح.' : 'Room deleted.';
  String get manageRoomMembers =>
      isArabic ? 'إدارة أعضاء الغرفة' : 'Manage room members';
  String get addRoomMember => isArabic ? 'إضافة عضو للغرفة' : 'Add room member';
  String get chooseMember => isArabic ? 'اختر العضو' : 'Choose member';
  String get roomMemberAdded =>
      isArabic ? 'تمت إضافة العضو للغرفة.' : 'Room member added.';
  String get roomMemberUpdated =>
      isArabic ? 'تم تحديث بيانات العضو.' : 'Room member updated.';
  String get roomMemberRemoved =>
      isArabic ? 'تمت إزالة العضو من الغرفة.' : 'Room member removed.';
  String get noRoomMembersYet =>
      isArabic ? 'لا يوجد أعضاء في هذه الغرفة بعد.' : 'No room members yet.';
  String get confirmDelete => isArabic ? 'تأكيد الحذف' : 'Confirm delete';
  String get deleteRoomPrompt => isArabic
      ? 'هل أنت متأكد من حذف هذه الغرفة؟ لا يمكن الحذف إذا كانت تحوي أعضاء نشطين.'
      : 'Delete this room? The backend will block deletion when members are still assigned.';
  String get activeRooms => isArabic ? 'الغرف النشطة' : 'Active rooms';
  String get roomMembers => isArabic ? 'أعضاء الغرفة' : 'Room members';
  String get noRoomsYet =>
      isArabic ? 'لا توجد غرف مضافة بعد.' : 'No rooms yet.';
  String get roomName => isArabic ? 'اسم الغرفة' : 'Room name';
  String get roomNameRequired =>
      isArabic ? 'أدخل اسم الغرفة.' : 'Enter a room name.';
  String get accessType => isArabic ? 'نوع الوصول' : 'Access type';
  String get description => isArabic ? 'الوصف' : 'Description';
  String get verificationRequired => isArabic
      ? 'تفقد بريدك الإلكتروني للحصول على رمز التحقق.'
      : 'Check your email for the verification code.';
  String get resetRequested => isArabic
      ? 'تفقد بريدك الإلكتروني للحصول على رمز الاستعادة.'
      : 'Check your email for the reset code.';
  String get passwordChanged => isArabic
      ? 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مجدداً.'
      : 'Password changed. Sign in again.';

  String get organizationProfile =>
      isArabic ? 'ملف مساحة العمل' : 'Organization profile';
  String get organizationProfileHint => isArabic
      ? 'تحديث هوية المؤسسة، لغة النظام، والمنطقة الزمنية.'
      : 'Update workspace identity, locale, and operating timezone.';
  String get organizationName => isArabic ? 'اسم المؤسسة' : 'Organization name';
  String get organizationNameRequired =>
      isArabic ? 'أدخل اسم المؤسسة.' : 'Enter an organization name.';
  String get organizationBio =>
      isArabic ? 'نبذة عن المؤسسة' : 'Organization bio';
  String get brandColor => isArabic ? 'لون الهوية (Hex)' : 'Brand color';
  String get validBrandColorRequired => isArabic
      ? 'استخدم كود لون بصيغة هيكس مثل #16458F.'
      : 'Use a hex color like #16458F.';
  String get organizationLocale =>
      isArabic ? 'لغة المؤسسة' : 'Organization locale';
  String get arabic => isArabic ? 'العربية' : 'Arabic';
  String get english => isArabic ? 'English' : 'English';
  String get timezone => isArabic ? 'المنطقة الزمنية' : 'Timezone';
  String get timezoneRequired =>
      isArabic ? 'أدخل المنطقة الزمنية.' : 'Enter a timezone.';
  String get saveChanges => isArabic ? 'حفظ التعديلات' : 'Save changes';

  String get appName => isArabic ? 'منصة عين' : 'AIN Platform';
  String get signIn => isArabic ? 'تسجيل الدخول' : 'Sign in';
  String get email => isArabic ? 'البريد الإلكتروني' : 'Email';
  String get password => isArabic ? 'كلمة المرور' : 'Password';
  String get invalidEmail =>
      isArabic ? 'أدخل بريدًا إلكترونيًا صحيحًا.' : 'Enter a valid email.';
  String get invalidPassword => isArabic
      ? 'يجب ألا تقل كلمة المرور عن 8 أحرف.'
      : 'Password must be at least 8 characters.';
  String get workspaces => isArabic ? 'مساحات العمل' : 'Workspaces';
  String get chooseWorkspace =>
      isArabic ? 'اختر مساحة العمل' : 'Choose workspace';
  String get today => isArabic ? 'اليوم' : 'Today';
  String get mobileFoundationReady =>
      isArabic ? 'تطبيق منصة عين جاهز للاستخدام' : 'Mobile foundation ready';
  String get repositoryWiringNext => isArabic
      ? 'متصل بالخادم السحابي لمنصة عين ومحدث بآخر السياسات.'
      : 'Next step is wiring generated API clients and real repositories.';
  String get explore => isArabic ? 'استكشف' : 'Explore';
  String get myCourses => isArabic ? 'دوراتي' : 'My Courses';
  String get lessonBookings => isArabic ? 'حجوزات الدروس' : 'Lesson bookings';
  String get availableInstructors =>
      isArabic ? 'المعلمون المتاحون' : 'Available instructors';
  String get myLessonBookings =>
      isArabic ? 'حجوزاتي الخاصة' : 'My lesson bookings';
  String get bookTeacherHint => isArabic
      ? 'احجز درساً خصوصياً فردياً مع أحد المعلمين المتاحين.'
      : 'Reserve a private lesson with an available instructor.';
  String get availableSlots =>
      isArabic ? 'المواعيد المتاحة' : 'Available slots';
  String get noAvailableLessonSlots => isArabic
      ? 'لا توجد مواعيد متاحة حالياً.'
      : 'No lesson slots are available right now.';
  String get reserveLesson => isArabic ? 'حجز الموعد' : 'Reserve lesson';
  String get lessonTime => isArabic ? 'وقت الدرس' : 'Lesson time';
  String get lessonSubject => isArabic ? 'المادة الدراسية' : 'Subject';
  String get lessonSubjectRequired =>
      isArabic ? 'أدخل مادة الدرس.' : 'Enter the lesson subject.';
  String get contactPhone => isArabic ? 'رقم هاتف التواصل' : 'Contact phone';
  String get contactPhoneRequired =>
      isArabic ? 'أدخل رقم هاتف صحيح.' : 'Enter a valid contact phone.';
  String get lessonReserved =>
      isArabic ? 'تم حجز الدرس بنجاح.' : 'Lesson reserved.';
  String get lessonCancelled =>
      isArabic ? 'تم إلغاء الحجز.' : 'Lesson cancelled.';
  String get noLessonBookings =>
      isArabic ? 'لا توجد حجوزات دروس خصوصية بعد.' : 'No lesson bookings yet.';
  String get schedule => isArabic ? 'الجدول' : 'Schedule';
  String get scheduleTitle => isArabic ? 'جدول المواعيد' : 'Schedule';
  String get scheduleSubtitle => isArabic
      ? 'متابعة مواعيد حصصك الدراسية وتقويم مساحة العمل.'
      : 'Review student course schedules and workspace calendar events.';
  String get studentCourseSchedules =>
      isArabic ? 'مواعيد حصص الدورات' : 'Student course schedules';
  String get organizationCalendar =>
      isArabic ? 'تقويم المؤسسة' : 'Organization calendar';
  String get noScheduleItems =>
      isArabic ? 'لا توجد مواعيد مجدولة بعد.' : 'No schedule items yet.';
  String get noScheduleItemsHint => isArabic
      ? 'ستظهر هنا مواعيد الدفعات المؤكدة وفعاليات المؤسسة.'
      : 'Confirmed course batches and workspace events will appear here.';
  String get noStudentSchedule => isArabic
      ? 'لا توجد مواعيد حصص دراسية حالياً.'
      : 'No student course schedules yet.';
  String get noOrganizationEvents => isArabic
      ? 'لا توجد فعاليات مجدولة حالياً.'
      : 'No organization events are scheduled.';
  String get openMyCourses => isArabic ? 'فتح دوراتي' : 'Open my courses';
  String get openOrganizationEvents =>
      isArabic ? 'فتح فعاليات المؤسسة' : 'Open organization events';
  String get profile => isArabic ? 'الملف الشخصي' : 'Profile';
  String get accountSettings =>
      isArabic ? 'إعدادات الحساب' : 'Account settings';
  String get language => isArabic ? 'اللغة' : 'Language';
  String get emailVerified => isArabic ? 'البريد مؤكد' : 'Email verified';
  String get emailNotVerified =>
      isArabic ? 'البريد غير مؤكد' : 'Email not verified';
  String get profileUpdated =>
      isArabic ? 'تم تحديث الملف الشخصي بنجاح.' : 'Profile updated.';
  String get profileWorkspaces =>
      isArabic ? 'مساحات العمل المرتبطة' : 'Profile workspaces';
  String get noProfileWorkspaces => isArabic
      ? 'لا توجد مساحات عمل نشطة مرتبطة بهذا الحساب.'
      : 'No active workspaces are linked to this account.';
  String get permissions => isArabic ? 'صلاحيات' : 'permissions';
  String get signOut => isArabic ? 'تسجيل الخروج' : 'Sign out';
  String get signOutHint => isArabic
      ? 'إنهاء هذه الجلسة ومسح بيانات الدخول المخزنة محلياً.'
      : 'End this mobile session and clear local credentials.';
  String get activeSessions =>
      isArabic ? 'الأجهزة والجلسات النشطة' : 'Active sessions';
  String get noActiveSessions =>
      isArabic ? 'لا توجد جلسات نشطة أخرى.' : 'No active sessions found.';
  String get signOutOtherDevices =>
      isArabic ? 'تسجيل الخروج من بقية الأجهزة' : 'Sign out others';
  String get revokeSession => isArabic ? 'إنهاء الجلسة' : 'Revoke session';
  String get sessionRevoked =>
      isArabic ? 'تم إنهاء الجلسة بنجاح.' : 'Session revoked.';
  String get otherSessionsRevoked => isArabic
      ? 'تم تسجيل الخروج من كافة الأجهزة الأخرى.'
      : 'Other sessions were revoked.';
  String get offlineReadiness =>
      isArabic ? 'حالة العمل دون اتصال' : 'Offline readiness';
  String get offlineReadinessHint => isArabic
      ? 'مراجعة سياسات التخزين المؤقت وحماية المحتوى للأجهزة المحمولة.'
      : 'Review backend cache, device, and content protection policies used by this mobile app.';
  String persistableDatasets(int count) {
    return isArabic
        ? '$count مجموعات بيانات قابلة للتخزين'
        : '$count persistable datasets';
  }

  String memoryOnlyDatasets(int count) {
    return isArabic
        ? '$count مجموعات بيانات في الذاكرة المؤقتة فقط'
        : '$count memory-only datasets';
  }

  String optimisticWrites(int count) {
    return isArabic
        ? '$count عمليات كتابة متفائلة'
        : '$count optimistic writes';
  }

  String serverConfirmedWrites(int count) {
    return isArabic
        ? '$count عمليات مؤكدة من الخادم'
        : '$count server-confirmed writes';
  }

  String get signedUrlsProtected =>
      isArabic ? 'روابط المحتوى المحمية' : 'Signed content URLs';
  String get memoryOnly => isArabic ? 'في الذاكرة فقط' : 'Memory only';
  String get needsAttention => isArabic ? 'تتطلب انتباهاً' : 'Needs attention';
  String get maxActiveSessions =>
      isArabic ? 'الحد الأقصى للجلسات المتزامنة' : 'Max active sessions';
  String get deepLinkManifest =>
      isArabic ? 'روابط الوصول المباشر (Deep Links)' : 'Deep-link manifest';
  String get deepLinkRoutes =>
      isArabic ? 'مسارات الروابط المباشرة' : 'Deep-link routes';
  String deepLinkRoutesCount(int routeCount, int authRequiredCount) {
    return isArabic
        ? '$routeCount مسارات، منها $authRequiredCount تتطلب تسجيل الدخول'
        : '$routeCount routes, $authRequiredCount auth-required';
  }

  String get cachePurgeTriggers =>
      isArabic ? 'مشغلات تفريغ التخزين المؤقت' : 'Cache purge triggers';
  String get disallowedDevicePractices =>
      isArabic ? 'ممارسات الأجهزة المحظورة' : 'Disallowed device practices';
  String get notificationPreferences =>
      isArabic ? 'تفضيلات الإشعارات' : 'Notification preferences';
  String get globalNotificationPreferences => isArabic
      ? 'تُطبق عند عدم اختيار مساحة عمل معينة.'
      : 'Applies when no workspace is selected.';
  String get inAppNotifications =>
      isArabic ? 'إشعارات داخل التطبيق' : 'In-app notifications';
  String get emailNotifications =>
      isArabic ? 'إشعارات البريد الإلكتروني' : 'Email notifications';
  String get pushNotifications =>
      isArabic ? 'إشعارات الدفع (Push)' : 'Push notifications';
  String get bookingUpdates =>
      isArabic ? 'تحديثات الحجوزات' : 'Booking updates';
  String get announcementNotifications =>
      isArabic ? 'تنبيهات الإعلانات' : 'Announcements';
  String get subscriptionReminders =>
      isArabic ? 'تذكيرات الاشتراك والتجديد' : 'Subscription reminders';
  String get notificationPreferencesUpdated => isArabic
      ? 'تم تحديث تفضيلات الإشعارات بنجاح.'
      : 'Notification preferences updated.';
  String get notifications => isArabic ? 'الإشعارات' : 'Notifications';
  String get notificationsHint => isArabic
      ? 'متابعة تنبيهات الحجوزات والأنشطة الأكاديمية وافتح الوجهة المناسبة.'
      : 'Review booking and course alerts and open the right destination.';
  String get notificationOfflineStatus =>
      isArabic ? 'حالة الإشعارات دون اتصال' : 'Notification offline status';
  String notificationOfflineStatusHint(int ttlMinutes, String storage) {
    return isArabic
        ? 'قد تظل الإشعارات قابلة للقراءة دون اتصال لمدة $ttlMinutes دقيقة باستخدام تخزين $storage.'
        : 'Notifications may stay readable offline for $ttlMinutes minutes using $storage storage.';
  }

  String get offlineReadable =>
      isArabic ? 'متاح دون اتصال' : 'Offline readable';
  String get cacheFallbackEnabled =>
      isArabic ? 'التخزين الاحتياطي مفعل' : 'Cache fallback enabled';
  String get staleWhileRevalidate =>
      isArabic ? 'تحديث تلقائي في الخلفية' : 'Stale while revalidate';
  String get optimisticReadState =>
      isArabic ? 'قراءة متفائلة فورية' : 'Optimistic read state';
  String get offlinePolicyUnavailable => isArabic
      ? 'سياسة العمل دون اتصال غير متاحة حالياً.'
      : 'Offline policy is unavailable right now.';
  String get loading => isArabic ? 'جاري التحميل...' : 'Loading';
  String get openWorkspace => isArabic ? 'فتح مساحة العمل' : 'Open workspace';
  String get exploreCourses => isArabic ? 'استكشف الدورات' : 'Explore courses';
  String get findCourses => isArabic
      ? 'اختر الدورة المناسبة واحجز مقعدك الآن'
      : 'Find the right course and reserve your seat';
  String get findCoursesHint => isArabic
      ? 'ابحث في الدورات التدريبية المعتمدة من الأكاديميات الموثقة.'
      : 'Browse published courses from verified academies through the backend.';
  String get searchCourses => isArabic
      ? 'ابحث عن دورة، مادة، مدرب أو أكاديمية...'
      : 'Search courses, subjects, instructors, or academies';
  String get clearSearch => isArabic ? 'مسح البحث' : 'Clear search';
  String get newest => isArabic ? 'الأحدث' : 'Newest';
  String get priceLow => isArabic ? 'الأقل سعراً' : 'Lowest price';
  String get startingSoon => isArabic ? 'يبدأ قريباً' : 'Starting soon';
  String get noCoursesFound => isArabic
      ? 'لا توجد دورات مطابقة لبحثك حالياً.'
      : 'No matching courses found.';
  String get course => isArabic ? 'دورة تدريبية' : 'Course';
  String get academyTeam => isArabic ? 'فريق الأكاديمية' : 'Academy team';
  String get verifiedAcademy =>
      isArabic ? 'أكاديمية موثقة' : 'Verified academy';
  String get viewDetails => isArabic ? 'عرض التفاصيل' : 'View details';
  String get courseDetailsNext => isArabic
      ? 'صفحة تفاصيل الدورة والحجز متاحة الآن.'
      : 'Course details and booking are the next implementation step.';
  String get retry => isArabic ? 'إعادة المحاولة' : 'Retry';
  String get back => isArabic ? 'رجوع' : 'Back';
  String get courseDetails => isArabic ? 'تفاصيل الدورة' : 'Course details';
  String get availableBatches =>
      isArabic ? 'الدفعات المتاحة' : 'Available batches';
  String get noAvailableBatches => isArabic
      ? 'لا توجد دفعات متاحة للحجز حالياً.'
      : 'No batches are currently available.';
  String get whatYouWillLearn =>
      isArabic ? 'ماذا ستتعلم في هذه الدورة؟' : 'What you will learn';
  String get learningOutcomesPending => isArabic
      ? 'ستضيف الأكاديمية مخرجات التعلم التفصيلية قريباً.'
      : 'Detailed learning outcomes will be added by the academy soon.';
  String get completeBooking => isArabic ? 'إتمام الحجز' : 'Complete booking';
  String get noPaymentNow => isArabic
      ? 'يمكنك تأكيد الحجز الآن والدفع عبر بوابات الدفع الإلكتروني أو نقداً.'
      : 'No payment now. The academy will contact you to confirm your seat.';
  String get fullName => isArabic ? 'الاسم الكامل' : 'Full name';
  String get fullNameRequired =>
      isArabic ? 'يرجى كتابة الاسم الكامل.' : 'Enter the full name.';
  String get phone => isArabic ? 'رقم الهاتف' : 'Phone';
  String get phoneRequired =>
      isArabic ? 'أدخل رقم هاتف صحيح.' : 'Enter a valid phone number.';
  String get optionalNote =>
      isArabic ? 'ملاحظة إضافية (اختياري)' : 'Optional note';
  String get bookingTerms => isArabic
      ? 'أوافق على شروط الحجز وسياسة الخصوصية الخاصة بالأكاديمية.'
      : 'I accept the academy booking and cancellation policy.';
  String get acceptBookingTerms => isArabic
      ? 'يجب الموافقة على شروط الحجز للمتابعة.'
      : 'Please accept the booking terms.';
  String get sendBookingRequest =>
      isArabic ? 'تأكيد طلب الحجز' : 'Send booking request';
  String get bookingSubmitted =>
      isArabic ? 'تم إرسال طلب الحجز بنجاح' : 'Booking request sent';
  String get bookingSubmittedHint => isArabic
      ? 'تم تسجيل طلبك، وسيتواصل معك فريق الأكاديمية أو يمكنك إتمام الدفع فوراً.'
      : 'The academy team will contact you to confirm your seat and payment method.';
  String get requestNumber => isArabic ? 'رقم الطلب' : 'Request number';
  String get batch => isArabic ? 'الدفعة' : 'Batch';
  String get bookingStatus => isArabic ? 'حالة الطلب' : 'Booking status';
  String get pendingAcademyConfirmation =>
      isArabic ? 'قيد تأكيد الأكاديمية' : 'Pending academy confirmation';
  String get exploreMoreCourses =>
      isArabic ? 'استكشاف دورات أخرى' : 'Explore more courses';
  String get myLearningTitle =>
      isArabic ? 'دوراتي وحجوزاتي' : 'My learning and bookings';
  String get myLearningSubtitle => isArabic
      ? 'تابع طلبات الحجز وافتح مساحات الدورات التي تم تأكيدها.'
      : 'Track booking requests and open confirmed course spaces.';
  String get pendingBookings => isArabic ? 'قيد التأكيد' : 'Pending bookings';
  String get activeCourses => isArabic ? 'الدورات النشطة' : 'Active courses';
  String get noActiveCourses =>
      isArabic ? 'لا توجد دورات نشطة بعد.' : 'No active courses yet.';
  String get bookingRequests => isArabic ? 'طلبات الحجز' : 'Booking requests';
  String get noBookingRequests =>
      isArabic ? 'لا توجد طلبات حجز مسجلة.' : 'No booking requests yet.';
  String get openCourseSpace =>
      isArabic ? 'فتح مساحة الدورة' : 'Open course space';
  String get noLearningYet =>
      isArabic ? 'لا توجد دورات مسجلة بعد' : 'No bookings yet';
  String get noLearningYetHint => isArabic
      ? 'استكشف الدورات المتاحة واختر الدفعة المناسبة لك.'
      : 'Explore courses and choose the right batch for you.';
  String get courseSpace => isArabic ? 'مساحة الدورة' : 'Course space';
  String get activeAccess => isArabic ? 'وصول نشط' : 'Active access';
  String get nextSession => isArabic ? 'الحصة القادمة' : 'Next session';
  String get schedulePending =>
      isArabic ? 'لم يتم تحديد جدول المواعيد بعد.' : 'Schedule is not set yet.';
  String get courseContent => isArabic ? 'محتوى الدورة' : 'Course content';
  String get courseContentPending => isArabic
      ? 'ستظهر ملفات وفيديوهات الدورة هنا بعد نشرها من قِبل الأكاديمية.'
      : 'Course files and videos will appear here after the academy adds them.';
  String get contentFileUnavailable => isArabic
      ? 'ملف المحتوى غير متاح حالياً.'
      : 'Content file is not available.';
  String get watermarkProtected =>
      isArabic ? 'محمي بعلامة مائية رقمية' : 'Watermark protected';
  String get downloadDisabled =>
      isArabic ? 'التحميل محظور أمنياً' : 'Download disabled';
  String get openSecureViewer =>
      isArabic ? 'فتح المشاهد الآمن' : 'Open secure viewer';
  String get secureViewerOpen =>
      isArabic ? 'جلسة المشاهد الآمن نشطة' : 'Secure viewer open';
  String viewerSessionExpiresIn(int minutes) {
    return isArabic
        ? 'تنتهي صلاحية الجلسة خلال $minutes دقيقة'
        : 'Viewer session expires in $minutes min';
  }

  String get viewerSessionExpired =>
      isArabic ? 'انتهت صلاحية جلسة المشاهدة' : 'Viewer session expired';
  String get refreshViewerSession =>
      isArabic ? 'تحديث جلسة المشاهدة' : 'Refresh viewer session';
  String get signedUrlMemoryOnly =>
      isArabic ? 'رابط مؤقت في الذاكرة فقط' : 'Signed URL memory-only';
  String get secureViewerMemoryOnlyHint => isArabic
      ? 'هذا الرابط الموقّع مؤقت ومحمي، ولا يتم حفظه على ذاكرة الجهاز نهائياً.'
      : 'This signed URL is temporary and is never saved to offline storage.';
  String get reportDownloadBlocked =>
      isArabic ? 'تسجيل منع التحميل' : 'Report blocked download';
  String get closeViewer => isArabic ? 'إغلاق المشاهد' : 'Close viewer';
  String get markAllRead => isArabic ? 'تحديد الكل كمقروء' : 'Mark all read';
  String get noNotifications =>
      isArabic ? 'لا توجد إشعارات حالياً.' : 'No notifications yet.';
  String get read => isArabic ? 'مقروء' : 'Read';
  String get unread => isArabic ? 'غير مقروء' : 'Unread';
  String get latestAnnouncement =>
      isArabic ? 'آخر إعلان' : 'Latest announcement';
  String get noAnnouncementsYet =>
      isArabic ? 'لا توجد إعلانات جديدة.' : 'No announcements yet.';
  String get courseAccessLocked =>
      isArabic ? 'مساحة الدورة مغلقة' : 'Course access is locked';
  String get backToMyCourses =>
      isArabic ? 'العودة إلى دوراتي' : 'Back to my courses';

  String matchingCourses(int count) {
    return isArabic ? '$count دورة مطابقة' : '$count matching courses';
  }

  String seatsLeft(int count) {
    return isArabic ? 'متبقي $count مقاعد' : '$count seats left';
  }

  String priceFromMinor(int minor, String currency) {
    final major = minor / 100;
    final formatted = major == major.roundToDouble()
        ? major.toStringAsFixed(0)
        : major.toStringAsFixed(2);
    final displayCurrency =
        isArabic && currency.toUpperCase() == 'EGP' ? 'ج.م' : currency;
    return '$formatted $displayCurrency';
  }

  String sessionsCount(int count) {
    return isArabic ? '$count حصص' : '$count sessions';
  }

  String startsAtLabel(String date) {
    return isArabic ? 'تبدأ في $date' : 'Starts $date';
  }

  String accessUntil(String date) {
    return isArabic ? 'الوصول متاح حتى $date' : 'Access until $date';
  }

  String scheduleStarts(String date) {
    return isArabic ? 'تبدأ: $date' : 'Starts: $date';
  }

  String scheduleEnds(String date) {
    return isArabic ? 'تنتهي: $date' : 'Ends: $date';
  }

  String lastUsedAt(String date) {
    return isArabic ? 'آخر استخدام: $date' : 'Last used: $date';
  }

  String sessionExpiresAt(String date) {
    return isArabic ? 'تنتهي الصلاحية: $date' : 'Expires: $date';
  }

  String get paymentStatus => isArabic ? 'حالة الدفع' : 'Payment status';
  String get paymentMethod => isArabic ? 'طريقة الدفع' : 'Payment method';
  String get creditCard =>
      isArabic ? 'بطاقة بنكية (Credit/Debit Card)' : 'Credit / Debit Card';
  String get electronicWallet =>
      isArabic ? 'محفظة إلكترونية (فودافون كاش ومحافظ أخرى)' : 'Mobile Wallet';
  String get cashPayment =>
      isArabic ? 'دفع نقدي / عند الحضور' : 'Cash on delivery';
  String get proceedToPayment =>
      isArabic ? 'المتابعة للدفع الإلكتروني' : 'Proceed to payment';
  String get paymentComplete =>
      isArabic ? 'تم الدفع بنجاح' : 'Payment complete';
  String get paymentPending => isArabic ? 'بانتظار الدفع' : 'Payment pending';

  String bookingStatusLabel(String status) {
    final normalized = status.replaceAll('_', ' ');
    if (!isArabic) {
      return normalized;
    }
    return switch (status) {
      'pending_confirmation' => 'قيد تأكيد الأكاديمية',
      'confirmed' => 'تم التأكيد',
      'cancelled' => 'ملغي',
      'rejected' => 'مرفوض',
      _ => normalized,
    };
  }

  String courseAccessLockedHint(String? reason) {
    final fallback = isArabic
        ? 'يجب أن يكون التسجيل نشطاً والاشتراك سارياً للوصول للمحتوى.'
        : 'The enrollment and subscription must be active.';
    if (reason == null || reason.isEmpty) {
      return fallback;
    }
    return isArabic ? '$fallback ($reason)' : '$fallback ($reason)';
  }

  String watermarkRenderedFor(String? userName) {
    if (userName == null || userName.isEmpty) {
      return isArabic
          ? 'تم تفعيل العلامة المائية الرقمية.'
          : 'Watermark rendered.';
    }
    return isArabic
        ? 'جلسة مشاهدة آمنة ومحمية باسم $userName.'
        : 'Watermark rendered for $userName.';
  }

  String bookingRequestSent(String bookingId) {
    final shortId = bookingId.length > 8
        ? bookingId.substring(bookingId.length - 8).toUpperCase()
        : bookingId.toUpperCase();
    return isArabic
        ? 'تم إرسال طلب الحجز بنجاح. رقم الطلب: $shortId'
        : 'Booking request sent successfully. Request $shortId';
  }

  String repositoryWiringPending(String title) {
    return isArabic
        ? 'توصيل $title بالخادم قيد التنفيذ.'
        : '$title repository wiring is pending.';
  }

  String invitationRole(String role) {
    return isArabic ? 'الدور: $role' : 'Role: $role';
  }

  String invitationStatus(String status) {
    return isArabic ? 'الحالة: $status' : 'Status: $status';
  }

  String courseStatusLabel(String status) {
    final normalized = status.replaceAll('_', ' ');
    if (!isArabic) {
      return normalized;
    }
    return switch (status) {
      'published' => 'منشورة',
      'draft' => 'مسودة',
      'pending_review' => 'قيد المراجعة',
      'rejected' => 'مرفوضة',
      'archived' => 'مؤرشفة',
      _ => normalized,
    };
  }

  String batchesCount(int count) {
    return isArabic ? '$count دفعات' : '$count batches';
  }

  String expiresAt(String date) {
    return isArabic ? 'ينتهي في $date' : 'Expires $date';
  }

  String workspaceNotificationPreferences(String workspaceName) {
    return isArabic
        ? 'تفضيلات إشعارات $workspaceName.'
        : 'Preferences for $workspaceName.';
  }

  String membersCount(int count) {
    return isArabic ? '$count أعضاء' : '$count members';
  }

  String get rememberMe => isArabic ? 'تذكرني' : 'Remember me';
  String get biometricSignIn =>
      isArabic ? 'تسجيل الدخول بالبصمة أو الوجه' : 'Biometric sign in';
  String get dontHaveAccountCreate => isArabic
      ? 'ليس لديك حساب؟ أنشئ حساب طالب جديد'
      : 'No account yet? Create student account';
  String get welcomeBackToAin =>
      isArabic ? 'تسجيل الدخول إلى منصة عين' : 'Sign in to AIN Platform';

  String get filterAll => isArabic ? 'الكل' : 'All';
  String get filterProgramming => isArabic ? 'البرمجة' : 'Programming';
  String get filterAI => isArabic ? 'الذكاء الاصطناعي' : 'AI & Data';
  String get filterDesign => isArabic ? 'التصميم' : 'Design';
  String get filterBusiness => isArabic ? 'إدارة الأعمال' : 'Business';
  String get liveAndInteractive =>
      isArabic ? 'مباشر وتفاعلي' : 'Live & Interactive';
  String get bookSeat => isArabic ? 'حجز مقعد' : 'Book seat';

  String get selectPaymentMethod =>
      isArabic ? 'اختر طريقة الدفع' : 'Select payment method';
  String get paymentMethodCardTitle => isArabic ? 'بطاقة بنكية' : 'Bank Card';
  String get paymentMethodCardDesc =>
      isArabic ? '(Visa / Mastercard / Meeza)' : '(Visa / Mastercard / Meeza)';
  String get paymentMethodWalletTitle =>
      isArabic ? 'المحافظ الإلكترونية الذكية' : 'Smart E-Wallets';
  String get paymentMethodWalletDesc => isArabic
      ? '(فودافون كاش، وي باي، إنستاباي)'
      : '(Vodafone Cash, WE Pay, InstaPay)';
  String get paymentMethodCashTitle =>
      isArabic ? 'دفع نقدي أو فوري' : 'Cash or Fawry';
  String get paymentMethodCashDesc =>
      isArabic ? '(Fawry / فرع الأكاديمية)' : '(Fawry / Academy Branch)';
  String get couponCode => isArabic ? 'أدخل كود الخصم' : 'Enter discount code';
  String get applyCoupon => isArabic ? 'تطبيق' : 'Apply';
  String get totalAmount => isArabic ? 'المبلغ الإجمالي' : 'Total amount';
  String get taxIncluded => isArabic ? 'الضريبة: مشمولة' : 'Tax: included';
  String get confirmBookingAndSecurePay => isArabic
      ? 'تأكيد الحجز والدفع الآمن 🔒'
      : 'Confirm Booking & Secure Pay 🔒';

  String get drmContentProtection => isArabic
      ? 'ضوابط الوصول والعلامة المائية'
      : 'Access Controls & Watermarking';
  String get tabLessons => isArabic ? 'الدروس' : 'Lessons';
  String get tabResources =>
      isArabic ? 'المصادر والملفات' : 'Resources & Files';
  String get tabSmartNotes => isArabic ? 'الملاحظات الذكية' : 'Smart Notes';
  String get tabDiscussion => isArabic ? 'النقاش والأسئلة' : 'Q&A & Discussion';
  String get downloadForOffline => isArabic
      ? 'تحميل للاستماع بدون إنترنت (Offline)'
      : 'Download for offline listening (Offline)';

  // Extended Auth Cycle Strings
  String get registerSubtitle => isArabic
      ? 'حساب واحد يمنحك الوصول لجميع الدورات، الحجوزات، والفرق التعليمية.'
      : 'One account for all courses, bookings, and academy teams.';
  String get enterVerificationCode =>
      isArabic ? 'أدخل رمز التحقق' : 'Enter verification code';
  String codeSentToEmail(String email) => isArabic
      ? 'تم إرسال رمز التحقق المكون من 6 أرقام إلى $email'
      : 'A 6-digit verification code was sent to $email';
  String resendInSeconds(int seconds) => isArabic
      ? 'إعادة الإرسال خلال $seconds ثانية'
      : 'Resend in $seconds seconds';
  String get resendCode => isArabic ? 'إعادة إرسال الرمز' : 'Resend code';
  String get resendSuccess => isArabic
      ? 'تمت إعادة إرسال رمز التحقق بنجاح.'
      : 'Verification code resent successfully.';
  String get debugCodeHelper =>
      isArabic ? 'كود التجربة السريع:' : 'Quick debug code:';
  String get tapToFill => isArabic ? 'اضغط للتعبئة' : 'Tap to fill';
  String get forgotPasswordSubtitle => isArabic
      ? 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رمزاً لإعادة تعيين كلمة المرور.'
      : 'Enter your registered email and we will send a reset code.';
  String get resetPasswordSubtitle => isArabic
      ? 'أدخل الرمز المستلم وحدد كلمة مرور جديدة قوية لحسابك.'
      : 'Enter the code received and set a new strong password.';
  String get newPassword => isArabic ? 'كلمة المرور الجديدة' : 'New password';
  String get confirmNewPassword =>
      isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm new password';
  String get passwordsDoNotMatch =>
      isArabic ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.';
  String get changePasswordTitle =>
      isArabic ? 'تغيير كلمة المرور' : 'Change password';
  String get changePasswordSubtitle => isArabic
      ? 'قم بتحديث كلمة المرور لحماية حسابك بانتظام.'
      : 'Update your password regularly to secure your account.';
  String get currentPassword =>
      isArabic ? 'كلمة المرور الحالية' : 'Current password';
  String get currentPasswordRequired => isArabic
      ? 'يرجى إدخال كلمة المرور الحالية.'
      : 'Current password is required.';
  String get passwordChangedSuccess => isArabic
      ? 'تم تغيير كلمة المرور بنجاح. يرجى إعادة تسجيل الدخول.'
      : 'Password changed successfully. Please sign in again.';
  String get mfaVerificationTitle =>
      isArabic ? 'التحقق بخطوتين (MFA)' : 'Two-Factor Authentication (MFA)';
  String get mfaVerificationSubtitle => isArabic
      ? 'أدخل رمز التحقق الإضافي المرسل لحسابك لتأكيد هويتك.'
      : 'Enter the secondary security code sent to verify your identity.';
  String get submitVerification =>
      isArabic ? 'تأكيد الرمز والمتابعة' : 'Verify & continue';
  String get continueAsStudent =>
      isArabic ? 'المتابعة كطالب / متعلّم' : 'Continue as Student';
  String get studentWorkspaceTitle =>
      isArabic ? 'مساحة التعلم الشخصية' : 'Personal Learning Workspace';
  String get studentWorkspaceSubtitle => isArabic
      ? 'تصفح الكورسات، متابعة جدول المحاضرات، وحضور الحصص دون الحاجة لأكاديمية.'
      : 'Browse courses, view lecture schedules, and attend sessions directly.';
  String get enterLearningPlatform => isArabic
      ? 'الدخول إلى منصة الكورسات والتعلم'
      : 'Enter Learning & Course Platform';
  String get createNewAcademy =>
      isArabic ? 'إنشاء أكاديمية تعليمية جديدة' : 'Create a new academy';

  String get tabAssignments => isArabic ? 'الواجبات والتسليمات' : 'Assignments';
  String get tabQuizzes => isArabic ? 'الاختبارات والتقييم' : 'Quizzes';
  String get assignmentsEmptyTitle =>
      isArabic ? 'لا توجد واجبات حالياً' : 'No assignments posted yet';
  String get assignmentsEmptySubtitle => isArabic
      ? 'ستظهر تكليفات ومشاريع المدرس هنا فور نشرها.'
      : 'Homework and projects will appear here once assigned.';
  String get submitAssignment => isArabic ? 'تسليم الحل' : 'Submit Work';
  String get submittedStatus => isArabic ? 'تم التسليم' : 'Submitted';
  String get gradedStatus => isArabic ? 'تم رصد الدرجة' : 'Graded';
  String get scoreLabel => isArabic ? 'الدرجة' : 'Score';
  String get feedbackLabel =>
      isArabic ? 'ملاحظات المدرس' : 'Instructor Feedback';
  String get quizzesEmptyTitle =>
      isArabic ? 'لا توجد اختبارات متاحة' : 'No quizzes available';
  String get quizzesEmptySubtitle => isArabic
      ? 'ستظهر التقييمات التفاعلية هنا فور جدولتها.'
      : 'Interactive tests will appear here once scheduled.';
  String get startQuiz => isArabic ? 'بدء الاختبار' : 'Start Quiz';
  String get retakeQuiz => isArabic ? 'إعادة المحاولة' : 'Retake Quiz';
  String get quizCompleted =>
      isArabic ? 'اكتملت المحاولات' : 'Max attempts reached';
  String get quizDuration => isArabic ? 'المدة' : 'Duration';
  String get passingScore => isArabic ? 'درجة النجاح' : 'Passing Score';
  String get quizPassed =>
      isArabic ? 'تم الاجتياز بنجاح' : 'Passed Successfully';
  String get quizFailed => isArabic ? 'لم تجتز درجة النجاح' : 'Did Not Pass';
  String get submitAnswers =>
      isArabic ? 'إنهاء وتسليم الإجابات' : 'Submit Answers';
  String get timeRemaining => isArabic ? 'الوقت المتبقي' : 'Time Remaining';
  String get certificatesLabel =>
      isArabic ? 'الشهادات المعتمدة' : 'Certificates';
  String get viewCertificate =>
      isArabic ? 'عرض الشهادة المعتمدة' : 'View Certificate';
  String get communityDiscussions =>
      isArabic ? 'مجتمع الغرفة والنقاشات' : 'Room Community';
  String get postQuestion => isArabic ? 'طرح سؤال أو موضوع' : 'Ask Question';
  String get liveMeetings =>
      isArabic ? 'البث المباشر (Zoom & Meet)' : 'Live Meetings';
  String get joinMeeting =>
      isArabic ? 'انضم إلى الحصة المباشرة' : 'Join Live Meeting';
  String get invoicesLabel =>
      isArabic ? 'الفواتير وسندات السداد' : 'Invoices & Receipts';
  String get protectedContentNotice => isArabic
      ? 'تساعد ضوابط الوصول والعلامة المائية في ردع المشاركة وتتبع التسريب، ولا تمنع التصوير بشكل مطلق.'
      : 'Access controls and watermarks deter sharing and support traceability; they cannot prevent capture absolutely.';
  String get resumePlayback =>
      isArabic ? 'استئناف المشاهدة' : 'Resume Playback';
}

class AppStringsDelegate extends LocalizationsDelegate<AppStrings> {
  const AppStringsDelegate();

  @override
  bool isSupported(Locale locale) {
    return const {'ar', 'en'}.contains(locale.languageCode);
  }

  @override
  Future<AppStrings> load(Locale locale) async {
    return AppStrings._(locale);
  }

  @override
  bool shouldReload(AppStringsDelegate old) => false;
}
