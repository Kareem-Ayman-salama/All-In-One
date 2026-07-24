import 'package:flutter/widgets.dart';

class AppStrings {
  const AppStrings._(this.locale);

  factory AppStrings.of(BuildContext context) {
    return AppStrings._(Localizations.localeOf(context));
  }

  final Locale locale;

  bool get isArabic => locale.languageCode == 'ar';

  String get createAccount => isArabic ? 'Create account' : 'Create account';
  String get verifyEmail => isArabic ? 'Verify email' : 'Verify email';
  String get verificationCode =>
      isArabic ? 'Verification code' : 'Verification code';
  String get invalidVerificationCode => isArabic
      ? 'Enter the 6-digit code.'
      : 'Enter the 6-digit code.';
  String get resendVerification =>
      isArabic ? 'Resend verification code' : 'Resend verification code';
  String get forgotPassword =>
      isArabic ? 'Forgot password?' : 'Forgot password?';
  String get resetPassword => isArabic ? 'Reset password' : 'Reset password';
  String get sendResetCode =>
      isArabic ? 'Send reset code' : 'Send reset code';
  String get invitation => isArabic ? 'Invitation' : 'Invitation';
  String get invitationUnavailable =>
      isArabic ? 'Invitation is unavailable.' : 'Invitation is unavailable.';
  String get acceptInvitation =>
      isArabic ? 'Accept invitation' : 'Accept invitation';
  String get passwordMinTen => isArabic
      ? 'Password must be at least 10 characters.'
      : 'Password must be at least 10 characters.';
  String get organizationBookings =>
      isArabic ? 'Organization bookings' : 'Organization bookings';
  String get organizationBookingsHint => isArabic
      ? 'Review student booking requests and confirm, reject, or cancel through the backend.'
      : 'Review student booking requests and confirm, reject, or cancel through the backend.';
  String get confirmBooking =>
      isArabic ? 'Confirm booking' : 'Confirm booking';
  String get rejectBooking => isArabic ? 'Reject booking' : 'Reject booking';
  String get cancelBooking => isArabic ? 'Cancel booking' : 'Cancel booking';
  String get organizationContent =>
      isArabic ? 'Organization content' : 'Organization content';
  String get organizationContentHint => isArabic
      ? 'Review protected room content and add published learning links.'
      : 'Review protected room content and add published learning links.';
  String get addContentLink =>
      isArabic ? 'Add content link' : 'Add content link';
  String get deleteContent =>
      isArabic ? 'Delete content' : 'Delete content';
  String get contentItems => isArabic ? 'Content items' : 'Content items';
  String get publishedContent =>
      isArabic ? 'Published content' : 'Published content';
  String get noContentYet => isArabic ? 'No content yet.' : 'No content yet.';
  String get contentTitle => isArabic ? 'Content title' : 'Content title';
  String get contentTitleRequired =>
      isArabic ? 'Enter a content title.' : 'Enter a content title.';
  String get externalUrl => isArabic ? 'External URL' : 'External URL';
  String get validUrlRequired =>
      isArabic ? 'Enter a valid HTTP or HTTPS URL.' : 'Enter a valid HTTP or HTTPS URL.';
  String get roomRequired => isArabic ? 'Choose a room.' : 'Choose a room.';
  String contentTypeLabel(String type) {
    return switch (type) {
      'pdf' => isArabic ? 'PDF' : 'PDF',
      'image' => isArabic ? 'Image' : 'Image',
      'video' => isArabic ? 'Video' : 'Video',
      'link' => isArabic ? 'Link' : 'Link',
      _ => isArabic ? 'File' : 'File',
    };
  }
  String get organizationAnnouncements =>
      isArabic ? 'Organization announcements' : 'Organization announcements';
  String get organizationAnnouncementsHint => isArabic
      ? 'Publish and review workspace announcements for members.'
      : 'Publish and review workspace announcements for members.';
  String get createAnnouncement =>
      isArabic ? 'Create announcement' : 'Create announcement';
  String get announcements => isArabic ? 'Announcements' : 'Announcements';
  String get pinnedAnnouncements =>
      isArabic ? 'Pinned announcements' : 'Pinned announcements';
  String get noAnnouncementsYet =>
      isArabic ? 'No announcements yet.' : 'No announcements yet.';
  String get announcementTitle =>
      isArabic ? 'Announcement title' : 'Announcement title';
  String get announcementTitleRequired =>
      isArabic ? 'Enter an announcement title.' : 'Enter an announcement title.';
  String get announcementBody =>
      isArabic ? 'Announcement body' : 'Announcement body';
  String get announcementBodyRequired =>
      isArabic ? 'Enter an announcement body.' : 'Enter an announcement body.';
  String get pinAnnouncement =>
      isArabic ? 'Pin announcement' : 'Pin announcement';
  String get pinned => isArabic ? 'Pinned' : 'Pinned';
  String announcementAudienceLabel(String audience) {
    return switch (audience) {
      'room' => isArabic ? 'Room' : 'Room',
      _ => isArabic ? 'Organization' : 'Organization',
    };
  }
  String get organizationCourses =>
      isArabic ? 'Organization courses' : 'Organization courses';
  String get organizationCoursesHint => isArabic
      ? 'Review courses and batches from the selected workspace.'
      : 'Review courses and batches from the selected workspace.';
  String get publishedCourses =>
      isArabic ? 'Published courses' : 'Published courses';
  String get openBatches => isArabic ? 'Open batches' : 'Open batches';
  String get noOrganizationCourses =>
      isArabic ? 'No organization courses yet.' : 'No organization courses yet.';
  String get noBatchesYet => isArabic ? 'No batches yet.' : 'No batches yet.';
  String get organizationEvents =>
      isArabic ? 'Organization events' : 'Organization events';
  String get organizationEventsHint => isArabic
      ? 'Review the workspace calendar and schedule classes, exams, and meetings.'
      : 'Review the workspace calendar and schedule classes, exams, and meetings.';
  String get createEvent => isArabic ? 'Create event' : 'Create event';
  String get deleteEvent => isArabic ? 'Delete event' : 'Delete event';
  String get events => isArabic ? 'Events' : 'Events';
  String get scheduledEvents =>
      isArabic ? 'Scheduled events' : 'Scheduled events';
  String get noEventsYet => isArabic ? 'No events yet.' : 'No events yet.';
  String get eventTitle => isArabic ? 'Event title' : 'Event title';
  String get eventTitleRequired =>
      isArabic ? 'Enter an event title.' : 'Enter an event title.';
  String get eventType => isArabic ? 'Event type' : 'Event type';
  String get startsAt => isArabic ? 'Starts at' : 'Starts at';
  String get endsAt => isArabic ? 'Ends at' : 'Ends at';
  String get location => isArabic ? 'Location' : 'Location';
  String get validIsoDateRequired => isArabic
      ? 'Enter a valid ISO date and time.'
      : 'Enter a valid ISO date and time.';
  String eventTypeLabel(String type) {
    return switch (type) {
      'class' => isArabic ? 'Class' : 'Class',
      'exam' => isArabic ? 'Exam' : 'Exam',
      'meeting' => isArabic ? 'Meeting' : 'Meeting',
      _ => isArabic ? 'Event' : 'Event',
    };
  }

  String eventStatusLabel(String status) {
    return switch (status) {
      'completed' => isArabic ? 'Completed' : 'Completed',
      'cancelled' => isArabic ? 'Cancelled' : 'Cancelled',
      _ => isArabic ? 'Scheduled' : 'Scheduled',
    };
  }
  String get organizationTasks =>
      isArabic ? 'Organization tasks' : 'Organization tasks';
  String get organizationTasksHint => isArabic
      ? 'Track workspace tasks, priorities, progress, and due dates.'
      : 'Track workspace tasks, priorities, progress, and due dates.';
  String get createTask => isArabic ? 'Create task' : 'Create task';
  String get deleteTask => isArabic ? 'Delete task' : 'Delete task';
  String get tasks => isArabic ? 'Tasks' : 'Tasks';
  String get openTasks => isArabic ? 'Open tasks' : 'Open tasks';
  String get noTasksYet => isArabic ? 'No tasks yet.' : 'No tasks yet.';
  String get taskTitle => isArabic ? 'Task title' : 'Task title';
  String get taskTitleRequired =>
      isArabic ? 'Enter a task title.' : 'Enter a task title.';
  String get taskPriority => isArabic ? 'Task priority' : 'Task priority';
  String get taskStatus => isArabic ? 'Task status' : 'Task status';
  String get dueAt => isArabic ? 'Due at' : 'Due at';
  String taskPriorityLabel(String priority) {
    return switch (priority) {
      'low' => isArabic ? 'Low' : 'Low',
      'high' => isArabic ? 'High' : 'High',
      'urgent' => isArabic ? 'Urgent' : 'Urgent',
      _ => isArabic ? 'Medium' : 'Medium',
    };
  }

  String taskStatusLabel(String status) {
    return switch (status) {
      'in_progress' => isArabic ? 'In progress' : 'In progress',
      'done' => isArabic ? 'Done' : 'Done',
      'cancelled' => isArabic ? 'Cancelled' : 'Cancelled',
      _ => isArabic ? 'To do' : 'To do',
    };
  }
  String get organizationMembers =>
      isArabic ? 'Organization members' : 'Organization members';
  String get organizationMembersHint => isArabic
      ? 'Review members, roles, and active access for the selected workspace.'
      : 'Review members, roles, and active access for the selected workspace.';
  String get members => isArabic ? 'Members' : 'Members';
  String get activeMembers => isArabic ? 'Active members' : 'Active members';
  String get noMembersYet => isArabic ? 'No members yet.' : 'No members yet.';
  String get removeMember => isArabic ? 'Remove member' : 'Remove member';
  String get memberStatus => isArabic ? 'Member status' : 'Member status';
  String memberStatusLabel(String status) {
    return switch (status) {
      'suspended' => isArabic ? 'Suspended' : 'Suspended',
      _ => isArabic ? 'Active' : 'Active',
    };
  }

  String organizationRoleLabel(String role) {
    return switch (role) {
      'organization_owner' => isArabic ? 'Owner' : 'Owner',
      'organization_admin' => isArabic ? 'Admin' : 'Admin',
      'instructor' => isArabic ? 'Instructor' : 'Instructor',
      'student' => isArabic ? 'Student' : 'Student',
      'guardian' => isArabic ? 'Guardian' : 'Guardian',
      _ => isArabic ? 'Member' : 'Member',
    };
  }
  String get organizationInvitations =>
      isArabic ? 'Organization invitations' : 'Organization invitations';
  String get organizationInvitationsHint => isArabic
      ? 'Invite members and manage pending workspace invitation links.'
      : 'Invite members and manage pending workspace invitation links.';
  String get inviteMember => isArabic ? 'Invite member' : 'Invite member';
  String get sendInvitation =>
      isArabic ? 'Send invitation' : 'Send invitation';
  String get invitations => isArabic ? 'Invitations' : 'Invitations';
  String get pendingInvitations =>
      isArabic ? 'Pending invitations' : 'Pending invitations';
  String get noInvitationsYet =>
      isArabic ? 'No invitations yet.' : 'No invitations yet.';
  String get resendInvitation =>
      isArabic ? 'Resend invitation' : 'Resend invitation';
  String get cancelInvitation =>
      isArabic ? 'Cancel invitation' : 'Cancel invitation';
  String get role => isArabic ? 'Role' : 'Role';
  String get organizationRooms =>
      isArabic ? 'Organization rooms' : 'Organization rooms';
  String get organizationRoomsHint => isArabic
      ? 'Review and create rooms for course members and content access.'
      : 'Review and create rooms for course members and content access.';
  String get createRoom => isArabic ? 'Create room' : 'Create room';
  String get activeRooms => isArabic ? 'Active rooms' : 'Active rooms';
  String get roomMembers => isArabic ? 'Room members' : 'Room members';
  String get noRoomsYet => isArabic ? 'No rooms yet.' : 'No rooms yet.';
  String get roomName => isArabic ? 'Room name' : 'Room name';
  String get roomNameRequired =>
      isArabic ? 'Enter a room name.' : 'Enter a room name.';
  String get accessType => isArabic ? 'Access type' : 'Access type';
  String get description => isArabic ? 'Description' : 'Description';
  String get verificationRequired => isArabic
      ? 'Check your email for the verification code.'
      : 'Check your email for the verification code.';
  String get resetRequested => isArabic
      ? 'Check your email for the reset code.'
      : 'Check your email for the reset code.';
  String get passwordChanged =>
      isArabic ? 'Password changed. Sign in again.' : 'Password changed. Sign in again.';

  String get organizationProfile =>
      isArabic ? 'Organization profile' : 'Organization profile';
  String get organizationProfileHint => isArabic
      ? 'Update workspace identity, locale, and operating timezone.'
      : 'Update workspace identity, locale, and operating timezone.';
  String get organizationName =>
      isArabic ? 'Organization name' : 'Organization name';
  String get organizationNameRequired =>
      isArabic ? 'Enter an organization name.' : 'Enter an organization name.';
  String get organizationBio =>
      isArabic ? 'Organization bio' : 'Organization bio';
  String get brandColor => isArabic ? 'Brand color' : 'Brand color';
  String get validBrandColorRequired => isArabic
      ? 'Use a hex color like #16458F.'
      : 'Use a hex color like #16458F.';
  String get organizationLocale =>
      isArabic ? 'Organization locale' : 'Organization locale';
  String get arabic => isArabic ? 'Arabic' : 'Arabic';
  String get english => isArabic ? 'English' : 'English';
  String get timezone => isArabic ? 'Timezone' : 'Timezone';
  String get timezoneRequired =>
      isArabic ? 'Enter a timezone.' : 'Enter a timezone.';
  String get saveChanges => isArabic ? 'Save changes' : 'Save changes';

  String get appName => 'AIN';
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
      isArabic ? 'أساس تطبيق الموبايل جاهز' : 'Mobile foundation ready';
  String get repositoryWiringNext => isArabic
      ? 'الخطوة التالية هي توصيل مولد API والـ repositories الفعلية.'
      : 'Next step is wiring generated API clients and real repositories.';
  String get explore => isArabic ? 'استكشف' : 'Explore';
  String get myCourses => isArabic ? 'دوراتي' : 'My Courses';
  String get schedule => isArabic ? 'الجدول' : 'Schedule';
  String get profile => isArabic ? 'الملف الشخصي' : 'Profile';
  String get notifications =>
      isArabic ? 'الإشعارات' : 'Notifications';
  String get notificationsHint => isArabic
      ? 'تابع تنبيهات الحجوزات والكورسات وافتح الوجهة المناسبة.'
      : 'Review booking and course alerts and open the right destination.';
  String get loading =>
      isArabic ? 'جاري التحميل' : 'Loading';
  String get openWorkspace =>
      isArabic ? 'فتح مساحة العمل' : 'Open workspace';
  String get exploreCourses =>
      isArabic ? 'استكشف الكورسات' : 'Explore courses';
  String get findCourses => isArabic
      ? 'اختار الكورس المناسب واحجز مكانك'
      : 'Find the right course and reserve your seat';
  String get findCoursesHint => isArabic
      ? 'ابحث في الكورسات المنشورة من الأكاديميات الموثقة والمتصلة بالباكند.'
      : 'Browse published courses from verified academies through the backend.';
  String get searchCourses => isArabic
      ? 'ابحث عن كورس، مادة، مدرس أو أكاديمية'
      : 'Search courses, subjects, instructors, or academies';
  String get clearSearch => isArabic ? 'مسح البحث' : 'Clear search';
  String get newest => isArabic ? 'الأحدث' : 'Newest';
  String get priceLow => isArabic ? 'الأقل سعرا' : 'Lowest price';
  String get startingSoon => isArabic ? 'يبدأ قريبا' : 'Starting soon';
  String get noCoursesFound =>
      isArabic ? 'لا توجد كورسات مطابقة حاليا.' : 'No matching courses found.';
  String get course => isArabic ? 'كورس' : 'Course';
  String get academyTeam => isArabic ? 'فريق الأكاديمية' : 'Academy team';
  String get verifiedAcademy =>
      isArabic ? 'أكاديمية موثقة' : 'Verified academy';
  String get viewDetails => isArabic ? 'عرض التفاصيل' : 'View details';
  String get courseDetailsNext => isArabic
      ? 'صفحة تفاصيل الكورس والحجز هي الخطوة التالية.'
      : 'Course details and booking are the next implementation step.';
  String get retry => isArabic ? 'إعادة المحاولة' : 'Retry';
  String get back => isArabic ? 'رجوع' : 'Back';
  String get courseDetails =>
      isArabic ? 'تفاصيل الكورس' : 'Course details';
  String get availableBatches =>
      isArabic ? 'الدفعات المتاحة' : 'Available batches';
  String get noAvailableBatches =>
      isArabic ? 'لا توجد دفعات متاحة للحجز حاليا.' : 'No batches are currently available.';
  String get whatYouWillLearn =>
      isArabic ? 'ماذا ستتعلم؟' : 'What you will learn';
  String get learningOutcomesPending => isArabic
      ? 'ستضيف الأكاديمية مخرجات التعلم التفصيلية قريبا.'
      : 'Detailed learning outcomes will be added by the academy soon.';
  String get completeBooking =>
      isArabic ? 'إتمام الحجز' : 'Complete booking';
  String get noPaymentNow => isArabic
      ? 'لن تدفع الآن. ستتواصل الأكاديمية معك لتأكيد المقعد.'
      : 'No payment now. The academy will contact you to confirm your seat.';
  String get fullName => isArabic ? 'الاسم الكامل' : 'Full name';
  String get fullNameRequired =>
      isArabic ? 'اكتب الاسم الكامل.' : 'Enter the full name.';
  String get phone => isArabic ? 'رقم الهاتف' : 'Phone';
  String get phoneRequired =>
      isArabic ? 'اكتب رقم هاتف صحيح.' : 'Enter a valid phone number.';
  String get optionalNote =>
      isArabic ? 'ملاحظة اختيارية' : 'Optional note';
  String get bookingTerms => isArabic
      ? 'أوافق على شروط الحجز وسياسة الإلغاء الخاصة بالأكاديمية.'
      : 'I accept the academy booking and cancellation policy.';
  String get acceptBookingTerms => isArabic
      ? 'يجب الموافقة على شروط الحجز.'
      : 'Please accept the booking terms.';
  String get sendBookingRequest =>
      isArabic ? 'إرسال طلب الحجز' : 'Send booking request';
  String get bookingSubmitted =>
      isArabic ? 'تم إرسال طلب الحجز' : 'Booking request sent';
  String get bookingSubmittedHint => isArabic
      ? 'سيتواصل معك فريق الأكاديمية لتأكيد المقعد وطريقة الدفع.'
      : 'The academy team will contact you to confirm your seat and payment method.';
  String get requestNumber => isArabic ? 'رقم الطلب' : 'Request number';
  String get batch => isArabic ? 'الدفعة' : 'Batch';
  String get bookingStatus => isArabic ? 'حالة الطلب' : 'Booking status';
  String get pendingAcademyConfirmation =>
      isArabic ? 'قيد تأكيد الأكاديمية' : 'Pending academy confirmation';
  String get exploreMoreCourses =>
      isArabic ? 'استكشاف كورسات أخرى' : 'Explore more courses';
  String get myLearningTitle =>
      isArabic ? 'كورساتي وحجوزاتي' : 'My learning and bookings';
  String get myLearningSubtitle => isArabic
      ? 'تابع طلبات الحجز وافتح مساحات الكورسات التي تم تأكيدها.'
      : 'Track booking requests and open confirmed course spaces.';
  String get pendingBookings =>
      isArabic ? 'قيد التأكيد' : 'Pending bookings';
  String get activeCourses =>
      isArabic ? 'الكورسات النشطة' : 'Active courses';
  String get noActiveCourses => isArabic
      ? 'لا توجد كورسات نشطة بعد.'
      : 'No active courses yet.';
  String get bookingRequests =>
      isArabic ? 'طلبات الحجز' : 'Booking requests';
  String get noBookingRequests =>
      isArabic ? 'لا توجد طلبات حجز بعد.' : 'No booking requests yet.';
  String get openCourseSpace =>
      isArabic ? 'فتح مساحة الكورس' : 'Open course space';
  String get noLearningYet =>
      isArabic ? 'لا توجد حجوزات بعد' : 'No bookings yet';
  String get noLearningYetHint => isArabic
      ? 'استكشف الكورسات واختر الدفعة المناسبة لك.'
      : 'Explore courses and choose the right batch for you.';
  String get courseSpace => isArabic ? 'مساحة الكورس' : 'Course space';
  String get activeAccess => isArabic ? 'وصول نشط' : 'Active access';
  String get nextSession => isArabic ? 'الحصة القادمة' : 'Next session';
  String get schedulePending =>
      isArabic ? 'لم يتم تحديد الجدول بعد.' : 'Schedule is not set yet.';
  String get courseContent => isArabic ? 'محتوى الكورس' : 'Course content';
  String get courseContentPending => isArabic
      ? 'ستظهر ملفات وفيديوهات الكورس هنا بعد إضافتها من الأكاديمية.'
      : 'Course files and videos will appear here after the academy adds them.';
  String get contentFileUnavailable =>
      isArabic ? 'ملف المحتوى غير متاح حاليا.' : 'Content file is not available.';
  String get watermarkProtected =>
      isArabic ? 'محمي بعلامة مائية' : 'Watermark protected';
  String get downloadDisabled =>
      isArabic ? 'التحميل غير متاح' : 'Download disabled';
  String get openSecureViewer =>
      isArabic ? 'فتح المشاهد الآمن' : 'Open secure viewer';
  String get secureViewerOpen =>
      isArabic ? 'المشاهد الآمن مفتوح' : 'Secure viewer open';
  String get reportDownloadBlocked =>
      isArabic ? 'تسجيل منع التحميل' : 'Report blocked download';
  String get closeViewer =>
      isArabic ? 'إغلاق المشاهد' : 'Close viewer';
  String get markAllRead =>
      isArabic ? 'تحديد الكل كمقروء' : 'Mark all read';
  String get noNotifications =>
      isArabic ? 'لا توجد إشعارات حاليا.' : 'No notifications yet.';
  String get read => isArabic ? 'مقروء' : 'Read';
  String get unread => isArabic ? 'غير مقروء' : 'Unread';
  String get latestAnnouncement =>
      isArabic ? 'آخر إعلان' : 'Latest announcement';
  String get noAnnouncementsYet =>
      isArabic ? 'لا توجد إعلانات جديدة.' : 'No announcements yet.';
  String get courseAccessLocked =>
      isArabic ? 'لا يمكنك فتح مساحة الكورس' : 'Course access is locked';
  String get backToMyCourses =>
      isArabic ? 'العودة إلى كورساتي' : 'Back to my courses';

  String matchingCourses(int count) {
    return isArabic ? '$count نتيجة مناسبة' : '$count matching courses';
  }

  String seatsLeft(int count) {
    return isArabic ? '$count مقعد متاح' : '$count seats left';
  }

  String priceFromMinor(int minor, String currency) {
    final major = minor / 100;
    final formatted = major == major.roundToDouble()
        ? major.toStringAsFixed(0)
        : major.toStringAsFixed(2);
    return '$formatted $currency';
  }

  String sessionsCount(int count) {
    return isArabic ? '$count حصة' : '$count sessions';
  }

  String accessUntil(String date) {
    return isArabic ? 'الوصول حتى $date' : 'Access until $date';
  }

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
        ? 'يجب أن يكون التسجيل نشطا والاشتراك متاحا.'
        : 'The enrollment and subscription must be active.';
    if (reason == null || reason.isEmpty) {
      return fallback;
    }
    return isArabic ? '$fallback ($reason)' : '$fallback ($reason)';
  }

  String watermarkRenderedFor(String? userName) {
    if (userName == null || userName.isEmpty) {
      return isArabic ? 'تم عرض العلامة المائية.' : 'Watermark rendered.';
    }
    return isArabic
        ? 'تم عرض العلامة المائية باسم $userName.'
        : 'Watermark rendered for $userName.';
  }

  String bookingRequestSent(String bookingId) {
    final shortId = bookingId.length > 8
        ? bookingId.substring(bookingId.length - 8).toUpperCase()
        : bookingId.toUpperCase();
    return isArabic
        ? 'تم إرسال طلب الحجز بنجاح. رقم الطلب $shortId'
        : 'Booking request sent successfully. Request $shortId';
  }

  String repositoryWiringPending(String title) {
    return isArabic
        ? 'توصيل $title بالـ repository قيد التنفيذ.'
        : '$title repository wiring is pending.';
  }

  String invitationRole(String role) {
    return isArabic ? 'Role: $role' : 'Role: $role';
  }

  String invitationStatus(String status) {
    return isArabic ? 'Status: $status' : 'Status: $status';
  }

  String courseStatusLabel(String status) {
    final normalized = status.replaceAll('_', ' ');
    return normalized;
  }

  String batchesCount(int count) {
    return isArabic ? '$count batches' : '$count batches';
  }

  String expiresAt(String date) {
    return isArabic ? 'Expires $date' : 'Expires $date';
  }

  String membersCount(int count) {
    return isArabic ? '$count members' : '$count members';
  }
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
