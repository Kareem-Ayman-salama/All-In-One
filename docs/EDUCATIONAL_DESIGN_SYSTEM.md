# AIN Platform — Educational Design System Specification

**Version:** 2.0 (Modern EdTech Edition)  
**Target:** Web (Desktop, Tablet, Mobile) & Arabic RTL / English LTR  
**Guiding Principle:** Modern, Human-Centered Educational Technology Platform  

---

## 1. Design Philosophy

AIN's design personality is **professional, warm, inspiring, and clear**. It is an **educational platform first**—celebrating teaching, learning, knowledge acquisition, and student achievement. Administrative, financial, and security controls serve as reliable, seamless infrastructure supporting the educational mission.

### Visual Pillars
1. **Academic Clarity**: Clean information hierarchy with readable headings, structured lesson cards, and unambiguous calls to action.
2. **Encouraging Feedback**: Visible progress bars, achievement badges, and supportive empty states that motivate learners.
3. **Institutional Trust**: Polished typography, calm surfaces, and subtle shadows that convey credibility to academy founders and parents.
4. **Universal Accessibility**: High-contrast text, touch-friendly tap targets (≥ 44×44px), semantic HTML, and zero horizontal scrolling across viewports.

---

## 2. Color System

### Primary & Functional Palette
```css
:root {
  /* Educational Primary (Inspiring Royal Blue) */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-soft: #EFF6FF;
  --color-primary-border: #BFDBFE;

  /* Secondary / Educational Teal (Growth & Knowledge) */
  --color-secondary: #0D9488;
  --color-secondary-soft: #F0FDFA;
  --color-secondary-border: #99F6E4;

  /* Institutional Dark Navy (Trust & Depth) */
  --color-navy: #142D4E;
  --color-navy-dark: #0B192C;

  /* Warm Accent (Encouragement & Alerts) */
  --color-accent: #F59E0B;
  --color-accent-soft: #FFFBEB;
  --color-accent-border: #FDE68A;

  /* Functional Status Colors */
  --color-success: #10B981;
  --color-success-soft: #ECFDF5;
  --color-danger: #EF4444;
  --color-danger-soft: #FEF2F2;
  --color-info: #06B6D4;
  --color-info-soft: #ECFEFF;

  /* Backgrounds & Surfaces */
  --bg-page: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #FFFFFF;
  --bg-subtle: #F1F5F9;

  /* Text & Contrast */
  --text-heading: #0F172A;
  --text-body: #334155;
  --text-muted: #64748B;
  --text-disabled: #94A3B8;

  /* Borders & Dividers */
  --border-subtle: #E2E8F0;
  --border-focus: #2563EB;
}
```

### Dark Mode Adaptations
```css
:root[data-theme="dark"] {
  --bg-page: #0B1220;
  --bg-surface: #121C2D;
  --bg-surface-elevated: #18243A;
  --bg-subtle: #1E293B;

  --text-heading: #F8FAFC;
  --text-body: #E2E8F0;
  --text-muted: #94A3B8;

  --border-subtle: #1E293B;
  --color-primary-soft: rgba(37, 99, 235, 0.15);
  --color-secondary-soft: rgba(13, 148, 136, 0.15);
}
```

---

## 3. Typography System

The platform is natively bilingual. Arabic typography receives equal optical weight and line height compared to Latin type.

### Fonts
- **Arabic (RTL)**: `Cairo`, with system fallbacks (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`).
- **English (LTR)**: `Plus Jakarta Sans` and `Inter`.

### Scale & Hierarchy
| Role | Size (Desktop) | Size (Mobile) | Weight | Line Height |
|---|---|---|---|---|
| **Hero Heading** | 44px – 52px | 30px – 34px | 800 (Bold) | 1.25 |
| **Section Title** | 32px – 36px | 24px – 26px | 700 (Bold) | 1.3 |
| **Card Title / H3** | 20px – 22px | 18px – 19px | 700 (Bold) | 1.35 |
| **Subheading / H4** | 16px – 18px | 15px – 16px | 600 (Semi-bold) | 1.4 |
| **Body (Default)** | 15px – 16px | 14px – 15px | 400 (Regular) | 1.6 |
| **Small / Meta** | 13px – 14px | 12px – 13px | 500 (Medium) | 1.5 |
| **Button / Label** | 14px – 15px | 14px | 600 (Semi-bold) | 1.0 |

---

## 4. Spacing, Elevation & Corner Radii

### Corner Radii
- **Tags & Badges (`--radius-sm`)**: `8px`
- **Buttons & Form Fields (`--radius-md`)**: `10px` – `12px`
- **Cards & Content Blocks (`--radius-lg`)**: `16px`
- **Modals & Hero Containers (`--radius-xl`)**: `24px`
- **Pills (`--radius-full`)**: `9999px`

### Shadows & Depth
- **Level 1 (Card Default)**: `0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)`
- **Level 2 (Card Hover)**: `0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`
- **Level 3 (Modals & Flyouts)**: `0 20px 40px -10px rgba(15, 23, 42, 0.16)`

---

## 5. Component Patterns

### A. Educational Course Cards
- **Thumbnail**: High-aspect-ratio (16:9) image with soft border and subject tag overlay.
- **Header**: Subject badge (`ثانوية عامة`, `برمجة`, `لغات`) + Delivery badge (`حضوري`, `أونلاين`, `مسجل`).
- **Body**: Clear course title + instructor avatar, name, and subject title.
- **Meta Bar**: Duration hours + enrolled student counter + schedule tag.
- **Footer**: Price in local currency (`EGP` / `ج.م`) + high-contrast action button (`احجز مقعدك` / `تفاصيل الكورس`).

### B. Educational Buttons
- **Primary Button**: Royal Blue (`#2563EB`) background, white text, subtle shadow, elevates +2px on hover.
- **Secondary Button**: Clean white/subtle background with 1px border (`#E2E8F0`), primary text, smooth color shift on hover.
- **Ghost Button**: Transparent background, accessible hover state, used for utility actions.

### C. Progress Indicators & Stats
- **Course Progress**: Horizontal progress track (`height: 8px; border-radius: 9999px; background: #E2E8F0;`) with royal blue fill (`#2563EB`) and percentage callout.
- **Stat Cards**: Rounded cards with soft color-tinted icon box (e.g. Blue for Courses, Green for Attendance, Amber for Quizzes, Cyan for Meetings).

### D. Empty States
- Always feature an educational icon (e.g. `BookOpen`, `GraduationCap`, `CalendarClock`).
- Supportive, encouraging copy (e.g. *"لا توجد واجبات معلقة اليوم — استمر في التقدم!"*).
- Clear next-step button (e.g. *"تصفح الدروس"* or *"استكشف الكورسات"*).

---

## 6. Homepage Content Hierarchy (UX Redesign)

1. **Clean Educational Header Navigation**:
   - Brand logo (`AIN.`)
   - Links: سوق الكورسات (`/courses`), للأكاديميات (`#academies`), للمعلمين (`/sell-courses`), المميزات (`#features`), الأسعار (`#pricing`), الأسئلة الشائعة (`#faq`)
   - Actions: زر تغيير اللغة (AR/EN), تسجيل الدخول (`/login`), ابدأ مجاناً (CTA Modal)
2. **Inspiring Educational Hero Section**:
   - Headline: *"منصة واحدة تجمع التعليم والإدارة في تجربة أذكى"*
   - Subtitle: *"اكتشف الكورسات، نظّم العملية التعليمية، وتابع رحلة التعلّم من مكان واحد..."*
   - Dual CTAs: *"استكشف الكورسات"* (Primary) & *"ابدأ أكاديميتك"* (Secondary)
   - Trust highlights: *"بدون بطاقة بنكية"*, *"حضور ذكي بـ QR"*, *"مساحة مستقلة بهويتك"*
   - Interactive Composition: Active Lesson Player + Student Progress Bar + Attendance Pill + Course Preview.
3. **Audience-Based Pathways (اختر مسارك)**:
   - 3 interactive pathway cards:
     - **أنا طالب** (تصفح الكورسات وتابع جدولك واختباراتك) -> `/courses`
     - **أنا معلم** (انشر كورساتك وأدر دفعاتك باحترافية) -> `/sell-courses`
     - **أدير أكاديمية** (نظام تشغيلي متكامل للطلاب والحضور) -> `/register-company`
4. **Featured Courses & Curricula Discovery**:
   - Interactive category pills: الكل, ثانوية عامة, برمجة وتقنية, لغات وترجمة.
   - Rich responsive cards with pricing, instructor credentials, and direct booking triggers.
5. **How AIN Supports Learning (رحلة التعلّم والنجاح)**:
   - 5-step visual roadmap: اكتشف الكورس ← انضم وسجّل ← تعلّم وتفاعل ← تدرب بالاختبارات ← حقق تقدمك وشهادتك.
6. **Core Educational Features (المميزات التعليمية)**:
   - Online video lessons (YouTube Unlisted integration).
   - Dynamic QR Code attendance for live & center classes.
   - Homework submissions & auto-graded quizzes.
   - Academic progress reports for students & parents.
   - Cohorts & room organization.
7. **Academy Management Suite (إدارة الأكاديمية والسنتر)**:
   - Unified administrative dashboard preview prioritizing academic health and operations.
8. **Responsible Content Protection (حماية متقدمة لمحتواك)**:
   - Moving dynamic watermark, device binding (1 Student = 1 Device), and session safety presented as empowering peace-of-mind features.
9. **Transparent Pricing**:
   - Pilot (30-day free trial), Starter (500 EGP), Growth (1,200 EGP), Pro (2,500 EGP).
10. **FAQ & Community Support**:
    - Transparent answers covering courses, setup, devices, and trials.
11. **Educational Closing & Conversion**:
    - Dual call to action: *"ابدأ رحلتك التعليمية"* & *"اطلب مساحة تجريبية لأكاديميتك"*.

---

## 7. Responsive Breakpoint Strategy

- **Mobile Small (`375px` – `414px`)**:
  - Single column flow; hamburger navigation drawer; touch targets ≥ 44px; horizontal scroll disabled (`overflow-x: hidden`).
- **Tablet (`768px` – `1023px`)**:
  - 2-column course grids; flexible bento cards; readable tables with horizontal touch scroll wrappers.
- **Desktop (`1024px` – `1440px+`)**:
  - 3-column course grids; rich hero split composition; persistent sidebars for authenticated portals.
