function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const subjects = [
  { id: "english", name: "English", nameAr: "اللغة الإنجليزية" },
  { id: "math", name: "Mathematics", nameAr: "الرياضيات" },
  { id: "programming", name: "Programming", nameAr: "البرمجة" },
  { id: "science", name: "Science", nameAr: "العلوم" },
  { id: "quran", name: "Quran & Ramadan", nameAr: "القرآن وبرامج رمضان" }
];

export const teachers = [
  {
    id: "teacher-sarah",
    name: "Sarah Hassan",
    nameAr: "سارة حسن",
    title: "Certified English instructor",
    titleAr: "مدرسة لغة إنجليزية معتمدة",
    bio: "Conversation, business English, and exam preparation with a practical study plan.",
    bioAr: "محادثة وإنجليزي للأعمال وتحضير للامتحانات بخطة دراسة عملية.",
    subjects: ["english"], levels: ["beginner", "intermediate", "advanced"],
    formats: ["online", "onsite"], rating: 4.9, reviews: 128, experience: 8,
    price: 250, duration: 60, color: "#3b82f6",
    slots: [
      { id: "sarah-1", date: dateAfter(1), time: "17:00" },
      { id: "sarah-2", date: dateAfter(2), time: "19:00" },
      { id: "sarah-3", date: dateAfter(4), time: "16:00" }
    ]
  },
  {
    id: "teacher-omar",
    name: "Omar Adel",
    nameAr: "عمر عادل",
    title: "Math and science specialist",
    titleAr: "متخصص رياضيات وعلوم",
    bio: "Clear explanations for school curricula with weekly progress follow-up.",
    bioAr: "شرح مبسط للمناهج الدراسية مع متابعة أسبوعية للتقدم.",
    subjects: ["math", "science"], levels: ["beginner", "intermediate"],
    formats: ["online"], rating: 4.8, reviews: 94, experience: 6,
    price: 220, duration: 60, color: "#14b8a6",
    slots: [
      { id: "omar-1", date: dateAfter(1), time: "20:00" },
      { id: "omar-2", date: dateAfter(3), time: "18:00" },
      { id: "omar-3", date: dateAfter(5), time: "15:30" }
    ]
  },
  {
    id: "teacher-nour",
    name: "Nour Khaled",
    nameAr: "نور خالد",
    title: "Programming mentor",
    titleAr: "مدربة برمجة وتطوير ويب",
    bio: "Project-based lessons in web development and programming fundamentals.",
    bioAr: "تعلم البرمجة وتطوير الويب من خلال مشاريع عملية.",
    subjects: ["programming"], levels: ["beginner", "intermediate"],
    formats: ["online"], rating: 4.9, reviews: 76, experience: 5,
    price: 300, duration: 75, color: "#8b5cf6",
    slots: [
      { id: "nour-1", date: dateAfter(2), time: "18:30" },
      { id: "nour-2", date: dateAfter(3), time: "20:30" },
      { id: "nour-3", date: dateAfter(6), time: "17:00" }
    ]
  },
  {
    id: "teacher-youssef",
    name: "Youssef Mahmoud",
    nameAr: "يوسف محمود",
    title: "Quran and Ramadan programs tutor",
    titleAr: "مدرس قرآن وبرامج رمضان",
    bio: "Flexible individual programs for recitation, memorization, and Ramadan study.",
    bioAr: "برامج فردية مرنة للتلاوة والحفظ وبرامج الدراسة في رمضان.",
    subjects: ["quran"], levels: ["beginner", "intermediate", "advanced"],
    formats: ["online", "onsite"], rating: 4.7, reviews: 61, experience: 10,
    price: 180, duration: 45, color: "#f59e0b",
    slots: [
      { id: "youssef-1", date: dateAfter(1), time: "16:30" },
      { id: "youssef-2", date: dateAfter(4), time: "18:00" },
      { id: "youssef-3", date: dateAfter(6), time: "20:00" }
    ]
  }
];
