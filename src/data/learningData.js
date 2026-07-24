function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const learningSeed = {
  courses: [
    { id: "course-tech-onboarding", organizationId: "org-techcorp", title: "Employee Onboarding", titleAr: "تهيئة الموظفين الجدد", category: "Internal training", instructor: "HR Team", deliveryType: "hybrid", visibility: "organization", status: "published", roomId: 1, roomName: "HR & Policies", price: 0, students: 38, color: "#2563eb" },
    { id: "course-tech-security", organizationId: "org-techcorp", title: "Information Security Essentials", titleAr: "أساسيات أمن المعلومات", category: "Compliance", instructor: "Security Team", deliveryType: "online", visibility: "organization", status: "draft", roomId: 3, roomName: "Engineering Hub", price: 0, students: 0, color: "#0f766e" },
    { id: "course-elite-english", organizationId: "org-elite-academy", title: "Business English Intensive", titleAr: "الإنجليزية المكثفة للأعمال", category: "Languages", instructor: "Sarah Hassan", deliveryType: "hybrid", visibility: "public", status: "published", roomId: 2, roomName: "English Growth Room", price: 1800, students: 26, color: "#7c3aed" },
    { id: "course-elite-math", organizationId: "org-elite-academy", title: "Secondary Mathematics", titleAr: "رياضيات المرحلة الثانوية", category: "High School", instructor: "Omar Adel", deliveryType: "online", visibility: "public", status: "published", roomId: 3, roomName: "Math Batch A", price: 1250, students: 18, color: "#db2777" }
  ],
  batches: [
    { id: "batch-tech-aug", organizationId: "org-techcorp", courseId: "course-tech-onboarding", title: "August New Hires", titleAr: "موظفو أغسطس الجدد", startDate: dateAfter(8), endDate: dateAfter(22), capacity: 50, reservedSeats: 4, confirmedSeats: 38, deliveryType: "hybrid", roomId: 1, roomName: "HR & Policies", status: "open", meetingLink: "" },
    { id: "batch-english-a", organizationId: "org-elite-academy", courseId: "course-elite-english", title: "Evening Batch A", titleAr: "دفعة مسائية A", startDate: dateAfter(5), endDate: dateAfter(45), capacity: 30, reservedSeats: 3, confirmedSeats: 24, deliveryType: "hybrid", roomId: 2, roomName: "English Growth Room", status: "open", meetingLink: "" },
    { id: "batch-math-a", organizationId: "org-elite-academy", courseId: "course-elite-math", title: "Grade 12 - Group A", titleAr: "الصف الثالث الثانوي - مجموعة A", startDate: dateAfter(3), endDate: dateAfter(60), capacity: 20, reservedSeats: 2, confirmedSeats: 18, deliveryType: "online", roomId: 3, roomName: "Math Batch A", status: "full", meetingLink: "" }
  ],
  bookings: [
    { id: "booking-1001", organizationId: "org-elite-academy", courseId: "course-elite-english", batchId: "batch-english-a", studentId: "student-1001", studentName: "Mariam Hassan", email: "student@ain.test", phone: "+20 100 555 0182", status: "pending_confirmation", paymentStatus: "unpaid", createdAt: dateAfter(-1) },
    { id: "booking-1002", organizationId: "org-elite-academy", courseId: "course-elite-english", batchId: "batch-english-a", studentId: "student-1002", studentName: "Youssef Ahmed", email: "youssef@example.com", phone: "+20 111 224 9011", status: "confirmed", paymentStatus: "unpaid", createdAt: dateAfter(-2) },
    { id: "booking-tech-1", organizationId: "org-techcorp", courseId: "course-tech-onboarding", batchId: "batch-tech-aug", studentId: "employee-12", studentName: "Nour Ibrahim", email: "n.ibrahim@techcorp.eg", phone: "+20 122 440 1123", status: "confirmed", paymentStatus: "not_required", createdAt: dateAfter(-3) }
  ],
  enrollments: [
    { id: "enrollment-1002", organizationId: "org-elite-academy", courseId: "course-elite-english", batchId: "batch-english-a", studentId: "student-1002", bookingId: "booking-1002", roomId: 2, enrollmentStatus: "active", accessStartsAt: dateAfter(0), accessEndsAt: dateAfter(60) }
  ],
  announcements: [
    { id: "announcement-tech-1", organizationId: "org-techcorp", title: "Quarterly town hall", titleAr: "اللقاء العام ربع السنوي", body: "The company town hall starts Thursday at 2:00 PM.", bodyAr: "يبدأ اللقاء العام للشركة يوم الخميس الساعة 2:00 مساءً.", audience: "All employees", roomName: "Company wide", author: "Management", publishedAt: "2 hours ago", pinned: true },
    { id: "announcement-elite-1", organizationId: "org-elite-academy", title: "New lesson materials", titleAr: "محتوى جديد للحصة", body: "Business English worksheets are now available in the room.", bodyAr: "تم رفع أوراق عمل الإنجليزية للأعمال داخل الروم.", audience: "Evening Batch A", roomName: "English Growth Room", author: "Sarah Hassan", publishedAt: "1 hour ago", pinned: true },
    { id: "announcement-elite-2", organizationId: "org-elite-academy", title: "Schedule update", titleAr: "تحديث في الجدول", body: "Saturday's session will start at 6:30 PM.", bodyAr: "حصة السبت ستبدأ الساعة 6:30 مساءً.", audience: "Grade 12 - Group A", roomName: "Math Batch A", author: "Omar Adel", publishedAt: "Yesterday", pinned: false }
  ],
  meetings: [
    { id: "meeting-tech-1", organizationId: "org-techcorp", title: "Product weekly sync", titleAr: "متابعة المنتج الأسبوعية", date: dateAfter(1), time: "14:00", duration: 60, roomName: "Engineering Hub", host: "Ahmed Mostafa", status: "scheduled", participants: 8 },
    { id: "meeting-elite-1", organizationId: "org-elite-academy", title: "Business English live session", titleAr: "حصة مباشرة للإنجليزية للأعمال", date: dateAfter(1), time: "18:30", duration: 75, roomName: "English Growth Room", host: "Sarah Hassan", status: "scheduled", participants: 24 },
    { id: "meeting-elite-2", organizationId: "org-elite-academy", title: "Math revision room", titleAr: "مراجعة الرياضيات", date: dateAfter(2), time: "20:00", duration: 60, roomName: "Math Batch A", host: "Omar Adel", status: "scheduled", participants: 18 }
  ],
  tasks: [
    { id: "task-tech-1", organizationId: "org-techcorp", title: "Read the updated attendance policy", titleAr: "قراءة سياسة الحضور المحدثة", scope: "HR & Policies", assignee: "All employees", dueDate: dateAfter(3), priority: "high", status: "in_progress", progress: 40 },
    { id: "task-tech-2", organizationId: "org-techcorp", title: "Complete security awareness", titleAr: "إكمال تدريب التوعية الأمنية", scope: "Engineering Hub", assignee: "Engineering team", dueDate: dateAfter(7), priority: "medium", status: "todo", progress: 0 },
    { id: "task-elite-1", organizationId: "org-elite-academy", title: "Submit speaking assignment", titleAr: "تسليم مهمة المحادثة", scope: "English Growth Room", assignee: "Evening Batch A", dueDate: dateAfter(2), priority: "high", status: "in_progress", progress: 65 },
    { id: "task-elite-2", organizationId: "org-elite-academy", title: "Solve chapter 4 exercises", titleAr: "حل تدريبات الفصل الرابع", scope: "Math Batch A", assignee: "Grade 12 - Group A", dueDate: dateAfter(4), priority: "medium", status: "todo", progress: 0 }
  ]
};
