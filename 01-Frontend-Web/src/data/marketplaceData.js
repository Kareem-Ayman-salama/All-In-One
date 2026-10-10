function relativeDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const marketplaceSeed = {
  categories: [
    { id: "cat-high-school", name: "High School", nameAr: "الثانوية العامة", parentId: null, active: true },
    { id: "cat-languages", name: "Languages", nameAr: "اللغات", parentId: null, active: true },
    { id: "cat-tech", name: "Programming & AI", nameAr: "البرمجة والذكاء الاصطناعي", parentId: null, active: true },
    { id: "cat-business", name: "Business Skills", nameAr: "مهارات الأعمال", parentId: null, active: true }
  ],
  academies: [
    {
      id: "academy-elite", organizationId: "org-elite-academy", slug: "elite-academy", name: "Elite Academy",
      nameAr: "أكاديمية النخبة", initials: "EA", color: "#16458f", providerType: "academy", verified: true, status: "approved", public: true,
      description: "Live, practical learning paths for students and professionals.",
      descriptionAr: "مسارات تعليمية مباشرة وعملية للطلاب والمحترفين.", location: "Nasr City, Cairo", deliveryMethods: ["online", "offline", "hybrid"],
      phone: "+20 100 555 0182", email: "hello@elite.example", website: "elite.example", branches: ["Nasr City", "New Cairo"]
    },
    {
      id: "academy-nova", organizationId: "org-nova-learning", slug: "nova-learning", name: "Nova Learning Hub",
      nameAr: "نوفا للتعليم", initials: "NL", color: "#0f766e", providerType: "independent_instructor", verified: true, status: "approved", public: true,
      description: "Technology and career programs built around real projects.",
      descriptionAr: "برامج تقنية ومهنية مبنية على مشروعات حقيقية.", location: "Online", deliveryMethods: ["online", "recorded"],
      phone: "+20 111 900 2040", email: "learn@nova.example", website: "nova.example", branches: []
    },
    {
      id: "academy-future", organizationId: "org-future-center", slug: "future-center", name: "Future Center",
      nameAr: "مركز المستقبل", initials: "FC", color: "#7c3aed", providerType: "training_center", verified: false, status: "pending", public: false,
      description: "Secondary school tutoring and exam preparation.", descriptionAr: "دروس ومراجعات للمرحلة الثانوية.",
      location: "Giza", deliveryMethods: ["offline"], phone: "+20 122 000 1122", email: "future@example.com", website: "", branches: ["Dokki"]
    }
  ],
  instructors: [
    { id: "inst-sarah", organizationId: "org-elite-academy", name: "Sarah Hassan", nameAr: "سارة حسن", initials: "SH", specialty: "Business English", bio: "CELTA-certified instructor with 8 years of experience.", active: true },
    { id: "inst-omar", organizationId: "org-elite-academy", name: "Omar Adel", nameAr: "عمر عادل", initials: "OA", specialty: "Mathematics", bio: "Secondary mathematics specialist and curriculum designer.", active: true },
    { id: "inst-lina", organizationId: "org-nova-learning", name: "Lina Samir", nameAr: "لينا سمير", initials: "LS", specialty: "Artificial Intelligence", bio: "Machine learning engineer and technical educator.", active: true },
    { id: "inst-hany", organizationId: "org-elite-academy", name: "Hany Mostafa", nameAr: "هاني مصطفى", initials: "HM", specialty: "Physics & Chemistry", bio: "Science educator focused on exam strategy and concept mastery.", active: true },
    { id: "inst-menna", organizationId: "org-nova-learning", name: "Menna Tarek", nameAr: "منة طارق", initials: "MT", specialty: "Mobile Development", bio: "Flutter engineer helping beginners ship practical mobile apps.", active: true }
  ],
  courses: [
    {
      id: "course-elite-english", organizationId: "org-elite-academy", academyId: "academy-elite", instructorId: "inst-sarah", providerType: "academy",
      slug: "business-english-intensive", title: "Business English Intensive", titleAr: "الإنجليزية المكثفة للأعمال",
      coverUrl: "/images/courses/english.jpg",
      shortDescription: "Speak confidently in meetings, presentations, and interviews.", shortDescriptionAr: "تحدث بثقة في الاجتماعات والعروض ومقابلات العمل.",
      description: "A practical live course covering workplace conversations, email writing, presentations, and interview practice.",
      descriptionAr: "كورس عملي مباشر يغطي محادثات العمل وكتابة البريد والعروض والتدريب على المقابلات.",
      categoryId: "cat-languages", level: "Intermediate", subject: "English", deliveryType: "hybrid", price: 1800, discountedPrice: 1450,
      duration: "8 weeks", sessions: 16, status: "published", featured: true, sponsored: false, learningOutcomes: ["Confident workplace speaking", "Professional email writing", "Presentation practice"], requirements: ["A2 English level or higher"]
    },
    {
      id: "course-elite-math", organizationId: "org-elite-academy", academyId: "academy-elite", instructorId: "inst-omar", providerType: "academy",
      slug: "secondary-mathematics", title: "Secondary Mathematics", titleAr: "رياضيات الثانوية العامة",
      coverUrl: "/images/courses/math.jpg",
      shortDescription: "Structured Grade 12 revision with weekly problem-solving sessions.", shortDescriptionAr: "مراجعة منظمة للصف الثالث الثانوي مع حصص أسبوعية لحل المسائل.",
      description: "A complete revision program that moves from core concepts to timed exam practice.", descriptionAr: "برنامج مراجعة كامل يبدأ من المفاهيم الأساسية وحتى التدريب على الامتحانات.",
      categoryId: "cat-high-school", level: "Grade 12", subject: "Mathematics", deliveryType: "online", price: 1250, discountedPrice: null,
      duration: "10 weeks", sessions: 20, status: "published", featured: true, sponsored: true, learningOutcomes: ["Master core concepts", "Solve exam questions faster", "Track weekly progress"], requirements: ["Grade 12 student"]
    },
    {
      id: "course-nova-ai", organizationId: "org-nova-learning", academyId: "academy-nova", instructorId: "inst-lina", providerType: "independent_instructor",
      slug: "ai-foundations", title: "AI Foundations", titleAr: "أساسيات الذكاء الاصطناعي",
      coverUrl: "/images/courses/coding.jpg",
      shortDescription: "Build your first practical AI workflow with no previous experience.", shortDescriptionAr: "ابنِ أول تطبيق عملي للذكاء الاصطناعي بدون خبرة سابقة.",
      description: "A project-led introduction to data, machine learning, prompting, and responsible AI.", descriptionAr: "مقدمة عملية للمعلومات وتعلم الآلة وهندسة الأوامر والاستخدام المسؤول للذكاء الاصطناعي.",
      categoryId: "cat-tech", level: "Beginner", subject: "AI", deliveryType: "online", price: 2200, discountedPrice: 1750,
      duration: "6 weeks", sessions: 12, status: "published", featured: true, sponsored: false, learningOutcomes: ["Understand AI foundations", "Build a small AI project", "Evaluate model output"], requirements: ["Laptop", "Basic computer skills"]
    },
    {
      id: "course-future-physics", organizationId: "org-future-center", academyId: "academy-future", instructorId: null, providerType: "training_center",
      slug: "physics-exam-camp", title: "Physics Exam Camp", titleAr: "معسكر مراجعة الفيزياء", shortDescription: "Final exam preparation.", shortDescriptionAr: "استعداد مكثف للامتحان النهائي.",
      coverUrl: "/images/courses/physics.jpg",
      description: "Pending moderation course.", descriptionAr: "كورس قيد مراجعة إدارة المنصة.", categoryId: "cat-high-school", level: "Grade 12", subject: "Physics",
      deliveryType: "offline", price: 900, discountedPrice: null, duration: "4 weeks", sessions: 8, status: "pending_review", featured: false, sponsored: false, learningOutcomes: [], requirements: []
    },
    {
      id: "course-elite-chemistry", organizationId: "org-elite-academy", academyId: "academy-elite", instructorId: "inst-hany", providerType: "academy",
      slug: "chemistry-mastery", title: "Chemistry Mastery", titleAr: "إتقان الكيمياء للثانوية العامة",
      coverUrl: "/images/courses/chemistry.jpg",
      shortDescription: "Understand the syllabus, solve faster, and prepare with weekly exam simulations.", shortDescriptionAr: "افهم المنهج وحل أسرع واستعد بمحاكاة أسبوعية للامتحانات.",
      description: "A focused chemistry program combining clear explanations, guided practice, and timed exam simulations.", descriptionAr: "برنامج كيمياء مركز يجمع بين الشرح المبسط والتدريب الموجه ومحاكاة الامتحانات.",
      categoryId: "cat-high-school", level: "Grade 12", subject: "Chemistry", deliveryType: "hybrid", price: 1400, discountedPrice: 1190,
      duration: "9 weeks", sessions: 18, status: "published", featured: false, sponsored: false, learningOutcomes: ["Master core chemistry concepts", "Solve exam questions accurately", "Build a practical revision plan"], requirements: ["Grade 12 student"]
    },
    {
      id: "course-nova-mobile", organizationId: "org-nova-learning", academyId: "academy-nova", instructorId: "inst-menna", providerType: "independent_instructor",
      slug: "flutter-mobile-apps", title: "Build Mobile Apps with Flutter", titleAr: "تطوير تطبيقات الموبايل باستخدام Flutter",
      coverUrl: "/images/courses/mobile.jpg",
      shortDescription: "Design and ship a complete mobile app through a practical guided project.", shortDescriptionAr: "صمم واطلق تطبيق موبايل كامل من خلال مشروع عملي خطوة بخطوة.",
      description: "A hands-on Flutter path covering layouts, state, APIs, testing, and publishing fundamentals.", descriptionAr: "مسار Flutter عملي يغطي الواجهات وإدارة الحالة والربط بالـ API والاختبارات وأساسيات النشر.",
      categoryId: "cat-tech", level: "Beginner", subject: "Mobile Development", deliveryType: "recorded", price: 1600, discountedPrice: 1290,
      duration: "7 weeks", sessions: 14, status: "published", featured: true, sponsored: false, learningOutcomes: ["Build responsive Flutter interfaces", "Connect apps to APIs", "Ship a portfolio-ready app"], requirements: ["Laptop", "No previous coding experience required"]
    }
  ],
  batches: [
    { id: "batch-english-evening", organizationId: "org-elite-academy", courseId: "course-elite-english", title: "Evening Batch", titleAr: "الدفعة المسائية", startDate: relativeDate(7), endDate: relativeDate(63), schedule: "Sun & Wed, 7:00 PM", capacity: 30, confirmedSeats: 24, reservedSeats: 2, roomId: 2, roomName: "English Growth Room", status: "open", location: "Nasr City + Zoom" },
    { id: "batch-math-a", organizationId: "org-elite-academy", courseId: "course-elite-math", title: "Grade 12 Group A", titleAr: "الصف الثالث الثانوي - مجموعة أ", startDate: relativeDate(4), endDate: relativeDate(74), schedule: "Sat & Tue, 8:00 PM", capacity: 25, confirmedSeats: 22, reservedSeats: 1, roomId: 3, roomName: "Math Batch A", status: "open", location: "Online" },
    { id: "batch-ai-july", organizationId: "org-nova-learning", courseId: "course-nova-ai", title: "July Cohort", titleAr: "دفعة يوليو", startDate: relativeDate(12), endDate: relativeDate(54), schedule: "Fri, 5:00 PM", capacity: 40, confirmedSeats: 19, reservedSeats: 3, roomId: 8, roomName: "AI Foundations", status: "open", location: "Online" },
    { id: "batch-chemistry-weekend", organizationId: "org-elite-academy", courseId: "course-elite-chemistry", title: "Weekend Revision", titleAr: "دفعة مراجعة نهاية الأسبوع", startDate: relativeDate(9), endDate: relativeDate(72), schedule: "Thu & Sat, 6:30 PM", capacity: 28, confirmedSeats: 17, reservedSeats: 2, roomId: 4, roomName: "Science Lab", status: "open", location: "New Cairo + Zoom" },
    { id: "batch-flutter-flex", organizationId: "org-nova-learning", courseId: "course-nova-mobile", title: "Flexible Recorded Cohort", titleAr: "دفعة مسجلة مرنة", startDate: relativeDate(2), endDate: relativeDate(51), schedule: "Self-paced + weekly Q&A", capacity: 60, confirmedSeats: 31, reservedSeats: 4, roomId: 9, roomName: "Flutter Builders", status: "open", location: "Online" }
  ],
  bookings: [
    { id: "public-booking-1", organizationId: "org-elite-academy", courseId: "course-elite-english", batchId: "batch-english-evening", studentId: "student-1001", studentName: "Mariam Hassan", email: "student@ain.test", phone: "+20 100 555 0182", status: "pending_confirmation", paymentStatus: "unpaid", amount: 1450, createdAt: relativeDate(-1), note: "Prefers online attendance." }
  ],
  enrollments: [],
  subscriptions: [],
  roomMemberships: [],
  notifications: [],
  promotions: [
    { id: "promo-math", organizationId: "org-elite-academy", courseId: "course-elite-math", type: "featured_course", placement: "homepage", startDate: relativeDate(0), endDate: relativeDate(14), status: "active", paymentStatus: "paid", impressions: 1280, clicks: 94, bookingConversions: 8 },
    { id: "promo-ai", organizationId: "org-nova-learning", courseId: "course-nova-ai", type: "search_boost", placement: "courses", startDate: relativeDate(5), endDate: relativeDate(20), status: "pending_approval", paymentStatus: "unpaid", impressions: 0, clicks: 0, bookingConversions: 0 }
  ],
  invitations: [
    { id: "invite-1", organizationId: "org-elite-academy", email: "teacher@example.com", role: "instructor", roomIds: [2], status: "pending", expiresAt: relativeDate(5), createdAt: relativeDate(-2) },
    { id: "invite-2", organizationId: "org-elite-academy", email: "old.student@example.com", role: "student", roomIds: [3], status: "expired", expiresAt: relativeDate(-2), createdAt: relativeDate(-12) }
  ]
};
