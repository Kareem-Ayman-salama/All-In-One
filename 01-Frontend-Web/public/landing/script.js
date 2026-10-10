/**
 * AIN PLATFORM - LANDING SCRIPT
 * Interactive Watermark Simulator, Role Showcase Switcher, ROI Calculator,
 * Course Filter, CountUp Engine, Lead Capture & Bilingual Localization.
 */

const AIN_CONTACT = {
  whatsapp: "201025849793",
  apiBaseUrl: window.AIN_API_BASE_URL || "/api/v1",
};

// --------------------------------------------------------------------------
// BILINGUAL TRANSLATION DICTIONARY (ARABIC & ENGLISH)
// --------------------------------------------------------------------------
const I18N = {
  ar: {
    lang_btn: "English",
    nav_roles: "الأدوار الحية",
    nav_protection: "درع الحماية",
    nav_features: "المميزات",
    nav_calculator: "حاسبة الأرباح",
    nav_curricula: "الكورسات",
    nav_pricing: "الأسعار",
    nav_faq: "الأسئلة الشائعة",
    nav_marketplace: "سوق الكورسات",
    nav_role_picker: "تجربة الأدوار",
    nav_login: "تسجيل الدخول",
    nav_start_trial: "ابدأ مجاناً",
    market_launch_badge: "سوق كورسات للمدرسين والأكاديميات",
    market_launch_title: "حوّل كورساتك إلى واجهة بيع جاهزة للطلاب",
    market_launch_desc: "اعرض كورساتك المباشرة أو المسجلة، سوّق لها من صفحة عامة، واستقبل الحجوزات سواء كنت مدرسًا مستقلًا أو تدير أكاديمية كاملة.",
    market_launch_sell: "انشر كورسك",
    market_launch_browse: "تصفح السوق",
    market_launch_teacher_title: "للمدرس المستقل",
    market_launch_teacher_desc: "صفحة باسمك، أسعارك ودفعاتك بدون الحاجة إلى سنتر.",
    market_launch_academy_title: "للأكاديمية أو المركز",
    market_launch_academy_desc: "متجر بهويتك مع عدة مدرسين وكورسات وفروع.",
    market_launch_start: "ابدأ الآن",
    market_launch_register: "سجّل أكاديميتك",

    hero_badge: "تشغيل الأكاديمية من مكان واحد",
    hero_title: "شغّل أكاديميتك <span class=\"gradient-text\">باحتراف</span>، وامنح طلابك تجربة أفضل",
    hero_desc: "الكورسات، المدفوعات، الحضور، الجلسات والأجهزة في مساحة عمل واحدة بهوية أكاديميتك—بدون فوضى الأدوات المتفرقة.",
    hero_cta_primary: "ابدأ تجربة مجانية",
    hero_cta_secondary: "استكشف المنصة",
    perk_no_card: "بدون بطاقة بنكية",
    perk_watermark: "علامة مائية قابلة للتتبع",
    perk_device: "إدارة الأجهزة والجلسات",
    perk_youtube: "حضور وتقارير في مكان واحد",
    preview_workspace: "مساحة عمل الأكاديمية",
    preview_overview: "نظرة عامة",
    preview_live: "تحديث مباشر",
    preview_revenue: "إيراد الشهر",
    preview_students: "طلاب نشطون",
    preview_attendance: "متوسط الحضور",
    preview_growth: "نمو الاشتراكات",
    preview_activity_title: "جلسة مشاهدة محمية",
    preview_activity_meta: "38 طالباً متصلون الآن",
    preview_protected: "محمية",
    preview_checked_in: "حضور اليوم",

    b1_title: "مساحة عمل مخصصة لأكاديميتك",
    b1_desc: "منصة باسمك وشعارك مع غرف تعليمية منظمة وفصل كامل لبياناتك وطلابك.",
    b2_title: "ردع التسريب وتتبع المحتوى",
    b2_desc: "يحد من مشاركة الحسابات ويجعل التسريب قابلًا للتتبع باستخدام العلامة المائية الديناميكية وسياسات تقييد الأجهزة.",
    b3_title: "تحضير الحضور بـ QR Code",
    b3_desc: "نظام حضور فوري للجلسات الحضورية والأونلاين يمنع التلاعب مع إشعارات مباشرة لولي الأمر.",

    sim_intro_badge: "حماية عملية بدون وعود مستحيلة",
    sim_intro_title: "شاهد كيف نردع مشاركة الحسابات ونجعل التسريب قابلاً للتتبع",
    sim_intro_desc: "جرّب طبقة العلامة المائية المتحركة، ثم تعرّف على ربط الأجهزة والجلسات الذي يساعد فريقك على مراجعة محاولات الدخول غير المعتادة.",
    sim_intro_device: "ربط الجهاز",
    sim_intro_watermark: "علامة قابلة للتتبع",
    sim_intro_access: "ضبط الجلسات",
    sim_header: "محاكي درع الحماية المباشر (Live Anti-Piracy Shield Engine)",
    sim_status: "نظام ردع وتتبع نشط",
    sim_blocked_msg: "تم اعتراض اختصار داخل المشغل. يعتمد الردع الفعلي على ربط الجهاز والعلامة المائية القابلة للتتبع.",
    sim_controls_title: "جرّب درع الحماية بنفسك الآن",
    sim_controls_desc: "اكتب أي اسم ورقم هاتف ولاحظ كيف تظهر العلامة المائية فوق الشاشة وتتنقل تلقائياً كل 4 ثوانٍ لتردع أي محاولة تسجيل بكاميرا خارجية:",
    sim_input_name: "اسم الطالب التجريبي:",
    sim_input_phone: "رقم الهاتف / الـ IP:",
    sim_btn_move: "تحريك العلامة المائية الآن",
    sim_btn_test_click: "اختبار محاولة نسخ / كليك يمين",
    sim_score_title: "أدوات ردع عملية وتتبع مباشر",
    sim_score_subtitle: "تقييد الأجهزة والعلامة المائية المتحركة للحد من تداول الحسابات",

    trust_onboarding_title: "تهيئة بمساعدة فريقنا",
    trust_onboarding_desc: "نجهز معك أول مساحة وكورس قبل الانطلاق.",
    trust_bilingual_title: "واجهة عربية وإنجليزية",
    trust_bilingual_desc: "تجربة واضحة لفريقك وطلابك باللغتين.",
    trust_devices_title: "ويب وتطبيق Android",
    trust_devices_desc: "وصول مرن من المتصفح أو تطبيق الطالب.",
    trust_isolation_title: "فصل بيانات كل أكاديمية",
    trust_isolation_desc: "مساحة مستقلة بهوية وصلاحيات فريقك.",

    roles_badge: "تجربة شاملة لجميع الأطراف",
    roles_title: "منظومة مصممة بدقة لتلبي احتياجات فريقك بالكامل",
    roles_desc: "سواء كنت مديراً لأكاديمية، أو معلماً يقدم المحاضرات، أو طالباً يتعلم، صُممت كل شاشة لتوفر أقصى إنتاجية وسلاسة.",

    calc_badge: "احسب أرباحك وتوفيرك",
    calc_title: "كم ستوفر وتجني مع AIN مقارنة بالمنصات التقليدية؟",
    calc_desc: "حرّك المؤشر وحدد عدد طلابك لتكتشف كم من الأموال تهدر في استضافة الفيديوهات، وكم من الاشتراكات تضيع بسبب الحسابات المشتركة.",

    curr_badge: "سوق الكورسات والمناهج",
    curr_title: "استكشف باقة من أقوى الكورسات والمناهج التعليمية",
    curr_desc: "تصفح نماذج من المقررات المنشورة عبر المنصة بمختلف المراحل والتخصصات.",

    testi_badge: "نماذج سير العمل والتشغيل",
    testi_title: "حلول عملية صُممت لتحديات السناتر والأكاديميات",
    testi_desc: "منظومة متكاملة تنقلك من عشوائية الرسائل والجروبات إلى دورة عمل منظمة للحضور، الأجهزة، والمالية.",

    comp_badge: "المقارنة الصادقة",
    comp_title: "لماذا تفشل الطرق التقليدية في حماية كورساتك؟",
    comp_desc: "بيع الكورسات عبر واتساب ويوتيوب غير مدرج وروابط درايف يفتح الباب واسعاً للمشاركة المجانية وضياع مجهودك.",
    comp_before_tag: "الطرق التقليدية (واتساب / درايف / تليجرام)",
    comp_before_title: "خسائر مستمرة ومحتوى مسرب بلا رقيب",
    comp_b1_title: "الروابط تتسرب في دقائق",
    comp_b1_desc: "بمجرد مشاركة رابط الفيديو، يستطيع أي شخص إرساله لأصدقائه بدون إذنك.",
    comp_b2_title: "طالب واحد يدخل من 10 أجهزة",
    comp_b2_desc: "اشتراك واحد يتم توزيعه على دفعة كاملة لعدم وجود قفل للجلسات أو الأجهزة.",
    comp_b3_title: "تسجيل الشاشة بدون أي إثبات",
    comp_b3_desc: "إذا قام أحدهم بتصوير الشاشة بهاتفه، لا يمكنك معرفة الفاعل لعدم وجود علامة مائية.",
    comp_b4_title: "فوضى في تتبع الحضور والغياب",
    comp_b4_desc: "لا توجد سجلات من شاهد، من غاب، أو من حاول تنزيل الملفات بطرق ملتوية.",

    comp_after_tag: "منظومة AIN الذكية",
    comp_after_title: "ضوابط وصول وتتبع تساعدك على حماية المحتوى",
    comp_a1_title: "جلسات مشاهدة مؤقتة ومقيّدة",
    comp_a1_desc: "يُتحقق من صلاحية الطالب قبل بدء المشاهدة، وتستخدم الجلسة توكناً مؤقتاً يفقد صلاحيته ولا يعمل كرابط فيديو مستقل.",
    comp_a2_title: "سياسة جهاز معتمد (1 Student = 1 Device)",
    comp_a2_desc: "حساب الطالب مقترن ببصمة جهازه فقط؛ إذا حاول فتحه من جهاز ثانٍ، يتوقف الدخول ويطلب موافقتك.",
    comp_a3_title: "علامة مائية ديناميكية متحركة",
    comp_a3_desc: "تظهر بيانات تعريف الطالب فوق الفيديو وتتحرك دورياً، ما يردع التصوير الخارجي ويساعد على نسبة النسخة المتداولة إلى جلستها.",
    comp_a4_title: "تحضير QR Code وسجل أحداث",
    comp_a4_desc: "تسجيل حضور سريع، مع سجل للأحداث التي تلتقطها المنصة مثل فتح الجلسة ومحاولات بعض الاختصارات داخل المشغل.",

    feat_badge: "أدوات الأكاديمية المتكاملة",
    feat_title: "كل ما تحتاجه لإدارة وتوسيع أكاديميتك في مكان واحد",
    feat_desc: "صُممت المنصة لتلبي احتياجات المدرس المستقل والمراكز التعليمية الكبرى بأعلى كفاءة وأبسط تجربة.",
    f1_title: "مساحة عمل مخصصة بهوية أكاديميتك",
    f1_desc: "أكاديميتك باسمك وشعارك وهوية بصرية كاملة، مع فصل تام للبيانات وحماية خصوصية طلابك.",
    f2_title: "غرف تعليمية ودفعات (Cohorts)",
    f2_desc: "قسّم طلابك حسب الدفعة، اليوم، أو المستوى الدراسي، مع تحديد دقيق لصلاحيات الوصول لكل غرفة.",
    f3_title: "تشغيل YouTube Unlisted داخل المنصة",
    f3_desc: "استخدم YouTube Unlisted لتقليل تكلفة استضافة الفيديو، مع تشغيل مدمج وضوابط وصول وعلامة مائية داخل المنصة.",
    f4_title: "إدارة الأجهزة والاستبدال الذكي",
    f4_desc: "لوحة أمان كاملة لمتابعة أجهزة الطلاب، مع نظام طلب استبدال جهاز بضغطة زر للمدرس لمراجعة الطلب.",
    f5_title: "تحضير الحضور بـ QR Code ديناميكي",
    f5_desc: "نظام حضور فوري للجلسات الأونلاين والحضورية برمز QR مؤقت ومتجدد يحد من إعادة استخدام الرمز أو مشاركته.",
    f6_title: "تقارير وإيرادات تفصيلية",
    f6_desc: "متابعة دقيقة للحجوزات، اشتراكات الطلاب، نسب المشاهدة، وتصدير التقارير لـ Excel وCSV فوراً.",

    prot_badge: "درع الحماية المتعدد",
    prot_title: "6 ضوابط وصول وردع تساعدك على حماية محتواك",
    prot_desc: "تجمع المنصة بين ربط الأجهزة والجلسات والعلامات المائية والسجلات لتقليل مشاركة الحسابات وجعل التسريب أسهل في التتبع، دون ادعاء منع النسخ بشكل مطلق.",
    l1_title: "Dynamic Watermarking",
    l1_desc: "علامة مائية متحركة تعرض معرّفات مختارة للطالب والجلسة لتسهيل تتبع مصدر التسجيلات المتداولة.",
    l2_title: "Device Binding & Fingerprint",
    l2_desc: "بصمة فريدة لكل جهاز تمنع فتح الحساب من جهاز آخر إلا بموافقة صريحة من إدارة الأكاديمية.",
    l3_title: "Browser Interaction Blocking",
    l3_desc: "اعتراض بعض اختصارات الحفظ والطباعة والنقر الأيمن كطبقة ردع وتجربة استخدام، وليس كبديل للتفويض الآمن أو حماية المتصفح.",
    l4_title: "Single Active Session",
    l4_desc: "إنهاء تلقائي للجلسة القديمة إذا حاول الطالب فتح حسابه في نافذة أو جهاز آخر في نفس اللحظة.",
    l5_title: "Expiring Secure Tokens",
    l5_desc: "الملفات المرفوعة تُقدَّم بروابط وصول موقعة ومؤقتة؛ أما فيديوهات YouTube Unlisted فتخضع لضوابط الحساب والعلامة المائية داخل المشغل.",
    l6_title: "Security Audit Log",
    l6_desc: "تسجيل لكل محاولة ممنوعة أو شبهة دخول غير مصرح بها لتتمكن من اتخاذ إجراء فوري وحظر المعتدي.",

    how_badge: "خطوات الانطلاق",
    how_title: "ابدأ منصتك في 4 خطوات بسيطة وبدون تعقيد",
    how_desc: "لا تحتاج إلى خبرة تقنية؛ نساعدك في إعداد المساحة وأول دورة عمل حتى تبدأ بشكل منظم.",
    s1_title: "أنشئ مساحة الأكاديمية",
    s1_desc: "سجّل اسم أكاديميتك وبياناتك، ثم ابدأ بإعداد مساحة الـ Pilot ومراجعتها مع فريقنا.",
    s2_title: "نظّم الكورسات والغرف",
    s2_desc: "قسّم المواد التعليمية إلى غرف ودفعات وحدد أسعار الكورسات ومواعيد الجلسات.",
    s3_title: "أضف الفيديوهات والملفات",
    s3_desc: "اربط فيديوهات اليوتيوب غير المدرجة ومذكرات الـ PDF مع تفعيل العلامة المائية بضغطة زر.",
    s4_title: "ادعُ الطلاب وراقب أرباحك",
    s4_desc: "أرسل روابط الانضمام للطلاب، واعتمد الحجوزات، وتابع الحضور ونسب المشاهدة من لوحة واحدة.",

    price_badge: "خطط أسعار مرنة",
    price_title: "خطة واضحة تناسب حجم أكاديميتك",
    price_desc: "ابدأ بتجربة عملية على مجموعة صغيرة، ثم اختر السعة المناسبة لعدد الغرف والطلاب الفعلي.",
    btn_monthly: "شهرياً",
    btn_yearly: "سنوياً",
    save_20: "وفر 20%",
    egp_currency: "جنيه",
    per_month: "/ شهرياً",
    per_year: "/ سنوياً",
    pilot_duration: "/ 30 يوم",

    plan_pilot_tag: "تجربة مجانية بالكامل",
    plan_pilot_name: "باقة التجربة (Pilot)",
    plan_pilot_desc: "أفضل طريقة لتجربة المنصة مع مجموعة صغيرة من طلابك قبل أي التزام.",
    btn_claim_pilot: "ابدأ الشهر المجاني الآن",
    f_pilot_1: "مساحة عمل كاملة باسم أكاديميتك",
    f_pilot_2: "غرفة تعليمية واحدة (Room)",
    f_pilot_3: "حتى 25 طالباً تجريبياً",
    f_pilot_4: "علامة مائية ديناميكية كاملة",
    f_pilot_5: "قفل الأجهزة وجلسة مشاهدة واحدة",
    f_pilot_6: "دعم مباشر عبر WhatsApp",

    plan_starter_tag: "للمدرسين المستقلين",
    plan_starter_name: "Starter",
    plan_starter_desc: "للمدرس الذي يريد بداية قوية ومنظمة مع ضوابط وصول وعلامات مائية لمذكراته وفيديوهاته.",
    btn_subscribe: "اشترك في الباقة",
    f_starter_1: "كل مميزات باقة التجربة",
    f_starter_2: "حتى 3 غرف تعليمية مستقلة",
    f_starter_3: "حتى 100 طالب نشط",
    f_starter_4: "ربط فيديوهات (YouTube Unlisted) بدون تكلفة استضافة",
    f_starter_5: "تحضير الحضور بـ QR Code",
    f_starter_6: "تصدير تقارير الحضور والدرجات",

    featured_badge: "الأكثر طلباً للأكاديميات",
    plan_growth_tag: "للمراكز والأكاديميات",
    plan_growth_name: "Growth",
    plan_growth_desc: "الخيار الأمثل للأكاديميات التي تدير عدة دفعات ومدرسين متعددي التخصصات.",
    btn_choose_growth: "ابدأ تجربة باقة Growth",
    f_growth_1: "كل مميزات باقة Starter",
    f_growth_2: "حتى 15 غرفة وكورس تعليمي",
    f_growth_3: "حتى 500 طالب نشط",
    f_growth_4: "إدارة صلاحيات المدرسين والمساعدين",
    f_growth_5: "تقارير وتحليلات أداء الطلاب",
    f_growth_6: "سجلات أمنية متقدمة وتنبيهات فورية",

    plan_pro_tag: "للمؤسسات الكبرى",
    plan_pro_name: "Pro",
    plan_pro_desc: "للمنصات الضخمة ومراكز التدريب التي تحتاج لعلامة بيضاء ومواصفات خاصة.",
    btn_contact_pro: "تواصل معنا للترقية",
    f_pro_1: "سعة متقدمة حتى 5,000 طالب وغرف متعددة",
    f_pro_2: "نطاق خاص للأكاديمية (Custom Domain)",
    f_pro_3: "تخصيص شعار واسم وألوان أكاديميتك",
    f_pro_4: "ربط بوابات دفع مخصصة وAPI",
    f_pro_5: "مدير حساب مخصص ودعم على مدار الساعة",

    faq_badge: "إجابات شفافة ومباشرة",
    faq_title: "الأسئلة الأكثر شيوعاً حول المنصة وحماية الكورسات",
    faq_desc: "كل ما تحتاج لمعرفته حول المنصة، هندسة حماية الفيديوهات، قفل الأجهزة، والتجربة المجانية.",
    faq_filter_head: "تصفية حسب الموضوع",
    faq_filter_all: "جميع الأسئلة",
    faq_filter_security: "العلامة المائية وضوابط الوصول",
    faq_filter_devices: "قفل الأجهزة والطلاب",
    faq_filter_pricing: "الباقات والتجربة",
    faq_filter_center: "السناتر والتشغيل",
    faq_live_status: "فريق الاستشارات متواجد الآن",
    faq_card_help_title: "هل لديك سؤال محدد؟",
    faq_card_help_desc: "فريقنا التقني جاهز لمساعدتك في فحص متطلبات أكاديميتك ومحاكاة درع الحماية لكورساتك مجاناً.",
    faq_btn_whatsapp: "محادثة فورية على واتساب",
    faq_btn_call: "طلب مكالمة ديمو تجريبية",
    faq_response_time: "دعم فني واستجابة سريعة ⚡",
    faq_zero_obligation: "بدون أي التزام مالي",
    tag_security: "درع حماية الفيديوهات",
    tag_devices: "ضوابط ربط الأجهزة",
    tag_pricing: "التجربة المجانية",
    tag_center: "السناتر والتشغيل",
    q1_title: "كيف تمنع AIN تسريب الفيديوهات إذا كانت مرفوعة على YouTube؟",
    q1_body: "يمكن عرض فيديوهات YouTube Unlisted داخل مشغل المنصة مع التحقق من صلاحية حساب الطالب وربط الجهاز وإظهار علامة مائية متحركة قابلة للتتبع. هذه الضوابط تقلل المشاركة والتسريب لكنها لا تجعل محتوى يوتيوب غير قابل للاستخراج أو التسجيل بشكل مطلق.",
    q2_title: "ماذا يحدث إذا حاول الطالب فتح حسابه من هاتف صديقه أو لابتوب آخر؟",
    q2_body: "تعتمد المنصة سياسة \"جهاز واحد لكل طالب\". بمجرد أن يسجل دخوله من جهازه الأول، يتم ربط الجلسة بالجهاز المعتمد وتأمينه. وإذا حاول الدخول من جهاز ثانٍ، تظهر له رسالة تفيد بأنه وصل للحد الأقصى للأجهزة، مع إمكانية إرسال طلب استبدال جهاز للمدرس لمراجعته واعتماده.",
    q3_title: "هل هناك أي التزام أو دفع مسبق لبدء الشهر المجاني (Pilot)؟",
    q3_body: "لا نطلب بطاقة ائتمان أو بيانات بنكية لبدء التجربة. تحصل على مساحة عمل تجريبية لمدة 30 يوماً لاختبار دورة العمل مع مجموعة صغيرة، ثم تقرر إن كانت الخطة المناسبة لك.",
    q4_title: "هل يمكنني نقل طلابي ومحتواي الحالي بسهولة وبدون تعقيد؟",
    q4_body: "نعم بكل سهولة. يمكنك دعوة الطلاب بروابط مباشرة، ويقوم فريق الدعم بمساعدتك في تجهيز كشوف الطلاب ورفع المواد وإعداد أول كورس خطوة بخطوة مجاناً.",
    q5_title: "هل يحتاج الطلاب لتحميل تطبيقات معقدة أم يعمل العارض مباشرة من المتصفح والموبايل؟",
    q5_body: "يعمل النظام بسلاسة تامة على جميع المتصفحات الحديثة (Chrome, Safari, Edge) على الحواسيب والهواتف دون الحاجة لأي تثبيت، بالإضافة إلى تطبيق أندرويد مخصص يوفر تجربة تعلم مريحة للعين وتتبعاً سلساً للحضور والمحاضرات.",
    q6_title: "كيف تتعامل المنصة مع اختلاف سرعة الإنترنت لدى الطلاب؟",
    q6_body: "عند استخدام YouTube Unlisted يستفيد الطالب من البث التكيفي الذي يغيّر الجودة وفق سرعة الاتصال والإعدادات المتاحة. الاستهلاك الفعلي والتقطيع يعتمدان على جودة الفيديو وشبكة الطالب.",
    q7_title: "هل تدعم المنصة كشوف الحضور الذكية للسناتر والمجموعات الحضورية؟",
    q7_body: "تدعم المنصة تسجيل الحضور عبر QR Code، ومراجعة السجل وتصديره بصيغة مناسبة للطباعة. إشعارات أولياء الأمور الخارجية تعتمد على قنوات الإرسال التي يتم تهيئتها للأكاديمية.",

    cta_tag: "خطوة عملية قبل الاشتراك",
    cta_title: "شاهد AIN على دورة عمل حقيقية من أكاديميتك",
    cta_desc: "احجز جلسة قصيرة نراجع فيها احتياجاتك، ونجهز مساحة تجريبية، ونحدد بوضوح ما يمكن تشغيله قبل أي التزام.",
    cta_btn_start: "اطلب مساحة تجريبية",
    cta_btn_preview: "جرّب تجربة المدير والطالب",

    footer_about: "المنصة الذكية لحماية ونشر المحتوى التعليمي للأكاديميات والمراكز التدريبية في الوطن العربي.",
    footer_col_platform: "المنصة",
    footer_col_quick: "روابط سريعة",
    footer_academies: "دليل الأكاديميات",
    footer_roles: "تجربة الأدوار المباشرة",
    footer_col_support: "المساعدة والأمان",
    footer_privacy: "سياسة الخصوصية",
    footer_terms: "شروط الخدمة",
    footer_support: "الدعم الفني",
    footer_demo_request: "اطلب مكالمة ديمو",

    modal_kicker: "تجربة مجانية 30 يوم",
    modal_title: "ابدأ تجربة أكاديميتك على AIN",
    modal_desc: "سجّل بياناتك البسيطة، وسيتواصل معك خبير المنصة لتجهيز مساحتك مجاناً.",
    form_name: "الاسم بالكامل",
    form_phone: "رقم الهاتف / WhatsApp",
    form_email: "البريد الإلكتروني",
    form_org: "اسم الأكاديمية أو المركز",
    form_type: "نوع النشاط التعليمي",
    form_students: "عدد الطلاب المتوقع",
    form_content: "ما المحتوى الذي ترغب في حمايته؟",
    form_opt_choose: "اختر النوع",
    form_opt_academy: "أكاديمية تدريب",
    form_opt_instructor: "مدرس مستقل",
    form_opt_languages: "مركز لغات",
    form_opt_school: "مدرسة أو سنتر تعليمي",
    form_opt_corporate: "شركة تدريب موظفين",
    form_submit: "تأكيد وبدء المحادثة على WhatsApp",

    proof_stats: 'نظام تشغيل متكامل للسناتر التعليمية والأكاديميات الهجينة في مصر والشرق الأوسط',
    sim_video_title: "كورس الرياضيات المتقدمة - المحاضرة 04",
    sim_video_desc: "جلسة فيديو بمشاهدة مقيدة وعلامة مائية ديناميكية",
    sim_sample_student: "أحمد محمد الشناوي",

    role_tab_admin: "مدير الأكاديمية والسنتر",
    role_tab_instructor: "المعلم والمحاضر",
    role_tab_student: "الطالب وولي الأمر",
    role_browse_dash: "تصفح لوحة التحكم الحية",

    c_tab_all: "الكل (All)",
    c_tab_sec: "الثانوية العامة (3)",
    c_tab_tech: "برمجة وتقنية (2)",
    c_tab_lang: "اللغات والترجمة (1)",

    c1_badge: "ثانوية عامة",
    c1_hours: "32 ساعة تدريبية",
    c1_students: "148 طالباً",
    c1_title: "الفيزياء الحديثة للثانوية العامة 2026",
    c1_desc: "شرح تفصيلي للمنهج مع حل أكثر من 1500 فكرة وبنك أسئلة واختبارات دورية مشفرة ومحمية من التسريب.",
    c1_inst: "أ. أحمد النجار",
    c1_role: "خبير الفيزياء المعتمد",
    c1_price: "240 ج.م",
    c1_old_price: "320 ج.م",

    c2_badge: "برمجة وذكاء اصطناعي",
    c2_hours: "48 ساعة تدريبية",
    c2_students: "312 طالباً",
    c2_title: "معسكر تطوير تطبيقات الويب الشامل (Full-Stack)",
    c2_desc: "من الصفر إلى الاحتراف: React, Node.js, قواعد البيانات مع بناء مشاريع إنتاجية حقيقية وتأهيل لسوق العمل.",
    c2_inst: "م. طارق المهدي",
    c2_role: "Senior Software Architect",
    c2_price: "650 ج.م",
    c2_old_price: "900 ج.م",

    c3_badge: "ثانوية عامة",
    c3_hours: "28 ساعة تدريبية",
    c3_students: "220 طالباً",
    c3_title: "الكيمياء العضوية الشاملة - الصف الثالث الثانوي",
    c3_desc: "مخططات المعادلات، آليات التفاعل، وحل امتحانات السنوات السابقة بنظام التابلت الحديث وبنك أسئلة ذكي.",
    c3_inst: "د. سامح عبد الرازق",
    c3_role: "مدرس الكيمياء الأول",
    c3_price: "200 ج.م",
    c3_old_price: "250 ج.م",

    c4_badge: "لغات وترجمة",
    c4_hours: "36 ساعة تدريبية",
    c4_students: "180 طالباً",
    c4_title: "اللغة الإنجليزية للأعمال والتحدث بطلاقة",
    c4_desc: "تمارين نطق متقدمة، مصطلحات سوق العمل، وتدريبات استماع حية مع مدربين معتمدين دولياً مع شهادات معتمدة.",
    c4_inst: "أ. دينا الشافعي",
    c4_role: "CELTA Certified Trainer",
    c4_price: "350 ج.م",
    c4_old_price: "400 ج.م",

    c5_badge: "برمجة وتقنية",
    c5_hours: "40 ساعة تدريبية",
    c5_students: "195 طالباً",
    c5_title: "تطوير تطبيقات الموبايل باستخدام Flutter & Dart",
    c5_desc: "بناء وتصدير تطبيقات iOS وAndroid احترافية وربطها بالخوادم والـ APIs مع نشرها على متجري App Store وGoogle Play.",
    c5_inst: "م. عبد الرحمن نبيل",
    c5_role: "Mobile Lead Developer",
    c5_price: "500 ج.م",
    c5_old_price: "750 ج.م",

    c6_badge: "ثانوية عامة",
    c6_hours: "45 ساعة تدريبية",
    c6_students: "340 طالباً",
    c6_title: "التفاضل والتكامل والهندسة الفراغية",
    c6_desc: "شرح مبسط لقوانين التفاضل والتكامل وتطبيقاتها مع أسرار حل المسائل الصعبة في دقائق ونماذج امتحانات وزارية.",
    c6_inst: "أ. محمد فوزي",
    c6_role: "مدرس أول الرياضيات",
    c6_price: "220 ج.م",
    c6_old_price: "280 ج.م",

    c_btn_enroll: "احجز الآن",
    c_browse_all: "تصفح كل الكورسات في سوق AIN",

    testi_1_badge: "حماية المحتوى والأجهزة",
    testi_1_quote: "تظهر بيانات الطالب كعلامة مائية متحركة، وتعمل ضوابط الأجهزة والجلسات على الحد من تداول الحسابات وجعل أي تسريب قابلاً للتتبع.",
    testi_1_author: "حماية المحتوى والجلسات",
    testi_1_title: "ضوابط وصول وعلامة مائية ديناميكية",

    testi_2_badge: "سير عمل الحضور",
    testi_2_quote: "يسجل رمز QR الحضور خلال ثوانٍ، ويحفظ سجلاً منظماً يمكن لفريق السنتر وولي الأمر مراجعته بدون كشوف ورقية متفرقة.",
    testi_2_author: "إدارة الحضور والمجموعات",
    testi_2_title: "سير عمل الحصص الحضورية والأونلاين",

    testi_3_badge: "الرقابة المالية والتشغيل",
    testi_3_quote: "تجمع لوحة التشغيل الحجوزات والمدفوعات والمستحقات المعلقة، وتوفر تقارير قابلة للتصدير لكل دفعة لاتخاذ قرار أسرع.",
    testi_3_author: "التقارير والعمليات المالية",
    testi_3_title: "رؤية تشغيلية دقيقة لإدارة الأكاديمية",

    takeaway_1: "<strong>النتيجة العملية:</strong> علامة مائية قابلة للتتبع، مع عدم الحاجة إلى استضافة فيديو خاصة عند استخدام YouTube Unlisted.",
    takeaway_2: "<strong>النتيجة العملية:</strong> الحد من ظاهرة مشاركة الحساب الواحد بين عدة طلاب عبر حصر الجلسة على جهاز الطالب المعتمد.",
    takeaway_3: "<strong>التجربة:</strong> 30 يوماً بدون بطاقة بنكية أو رسوم مسبقة، وفق حدود باقة الـ Pilot الموضحة.",
    takeaway_4: "<strong>جاهزية التشغيل:</strong> يساعدك فريقنا على إعداد مساحة الأكاديمية وأول كورس قبل الانطلاق.",
    takeaway_5: "<strong>التوافقية:</strong> تطبيق هاتف سريع + بوابة ويب متجاوبة تعمل على مختلف الأجهزة.",
    takeaway_6: "<strong>الدمج الهجين:</strong> تدير سنترك ومجموعاتك الحضورية والأونلاين من نفس لوحة التحكم المركزية.",

    form_opt_lt25: "أقل من 25 طالباً",
    form_opt_25_100: "25 - 100 طالب",
    form_opt_100_300: "100 - 300 طالب",
    form_opt_gt300: "أكثر من 300 طالب",
    form_ph_name: "مثال: د. محمد علي",
    form_ph_org: "مثال: أكاديمية النخبة",
    form_ph_content: "مثال: كورس برمجة، مذكرات وشروحات ثانوية عامة، فيديوهات مراجعة...",
    float_whatsapp: "تحدث معنا عبر WhatsApp",
    footer_copyright: "© 2026 AIN Platform. جميع الحقوق محفوظة.",

    calc_lbl_students: "عدد الطلاب في أكاديميتك:",
    calc_lbl_price: "متوسط سعر اشتراك الكورس / الشهر:",
    calc_callout: "تشتت أدوات الحضور والدروس والمدفوعات يرهق ميزانية السنتر ووقت الإدارة. AIN يجمع كل هذه الأدوات في منصة موحدة توفر ساعات من العمل اليدوي وتقلل هدر الحسابات المشتركة.",
    calc_res_hosting_lbl: "توفير استضافة الفيديوهات سنوياً (Vimeo / Wistia):",
    calc_res_hosting_sub: "مع AIN: وفّر تكاليف الاستضافة عبر ربط فيديوهاتك المباشر",
    calc_res_reclaim_lbl: "تقدير العائد المحسن بالحد من الحسابات المشتركة:",
    calc_res_reclaim_sub: "توفير وقت الإدارة وضبط اشتراكات الطلاب الرسمية",
    calc_res_total_lbl: "إجمالي العائد الإضافي المتوقع لأكاديميتك سنوياً:",
    calc_res_cta_btn: "احجز نسختك المجانية وضاعف أرباحك الآن"
  },
  en: {
    lang_btn: "العربية",
    nav_roles: "Live Roles",
    nav_protection: "Protection",
    nav_features: "Features",
    nav_calculator: "Calculator",
    nav_curricula: "Courses",
    nav_pricing: "Pricing",
    nav_faq: "FAQ",
    nav_marketplace: "Marketplace",
    nav_role_picker: "Live Demo",
    nav_login: "Sign In",
    nav_start_trial: "Start Free",
    market_launch_badge: "A marketplace for instructors and academies",
    market_launch_title: "Turn your courses into a storefront built for students",
    market_launch_desc: "List live or recorded courses, promote them through a public page, and accept bookings whether you teach independently or run an academy.",
    market_launch_sell: "Sell your course",
    market_launch_browse: "Browse marketplace",
    market_launch_teacher_title: "For independent instructors",
    market_launch_teacher_desc: "Your own page, pricing, and cohorts—no center required.",
    market_launch_academy_title: "For academies and centers",
    market_launch_academy_desc: "A branded storefront with multiple instructors, courses, and branches.",
    market_launch_start: "Get started",
    market_launch_register: "Register academy",

    hero_badge: "Run your academy from one place",
    hero_title: "Run your academy <span class=\"gradient-text\">professionally</span> and give students a better experience",
    hero_desc: "Courses, payments, attendance, sessions, and devices in one branded workspace—without the clutter of disconnected tools.",
    hero_cta_primary: "Start a free trial",
    hero_cta_secondary: "Explore the platform",
    perk_no_card: "No credit card required",
    perk_watermark: "Traceable dynamic watermark",
    perk_device: "Device and session controls",
    perk_youtube: "Attendance and reports in one place",
    preview_workspace: "Academy workspace",
    preview_overview: "Overview",
    preview_live: "Live update",
    preview_revenue: "Monthly revenue",
    preview_students: "Active students",
    preview_attendance: "Avg. attendance",
    preview_growth: "Subscription growth",
    preview_activity_title: "Protected viewing session",
    preview_activity_meta: "38 students online now",
    preview_protected: "Protected",
    preview_checked_in: "Today's check-ins",

    b1_title: "Branded Academy Workspace",
    b1_desc: "Your academy with custom branding, organized cohorts, and isolated student data.",
    b2_title: "Leakage Deterrence & Content Tracking",
    b2_desc: "Restricts account sharing and makes leaks traceable using dynamic watermarks and device restriction policies.",
    b3_title: "Dynamic QR Attendance",
    b3_desc: "Instant check-in for physical and online sessions with real-time guardian attendance reports.",

    sim_intro_badge: "Practical protection without impossible promises",
    sim_intro_title: "See how AIN deters account sharing and makes leaks traceable",
    sim_intro_desc: "Try the moving watermark layer, then explore device and session controls that help your team review unusual sign-in attempts.",
    sim_intro_device: "Device binding",
    sim_intro_watermark: "Traceable watermark",
    sim_intro_access: "Session controls",
    sim_header: "Live Anti-Piracy Shield Engine Simulator",
    sim_status: "Active Deterrence & Tracking System",
    sim_blocked_msg: "A player shortcut was intercepted. Device binding and traceable watermarks provide the practical deterrence layer.",
    sim_controls_title: "Test Security Live",
    sim_controls_desc: "Type any student info below and watch the dynamic watermark move across the screen every 4 seconds to deter screen recording and camera capture:",
    sim_input_name: "Demo Student Name:",
    sim_input_phone: "Phone / IP Address:",
    sim_btn_move: "Move Watermark Now",
    sim_btn_test_click: "Test Copy / Right Click Attempt",
    sim_score_title: "Practical Deterrence & Live Tracking",
    sim_score_subtitle: "Device binding and moving watermarks to curb credential sharing",

    trust_onboarding_title: "Guided onboarding",
    trust_onboarding_desc: "We help set up your first workspace and course.",
    trust_bilingual_title: "Arabic and English UI",
    trust_bilingual_desc: "A clear bilingual experience for staff and students.",
    trust_devices_title: "Web and Android",
    trust_devices_desc: "Flexible access through the browser or student app.",
    trust_isolation_title: "Isolated academy data",
    trust_isolation_desc: "A separate workspace with your brand and permissions.",

    roles_badge: "End-to-End Persona Experience",
    roles_title: "Meticulously Crafted for Your Entire Team",
    roles_desc: "Whether you manage an academy, teach lectures, or learn as a student, every view provides maximum focus, ease, and efficiency.",

    calc_badge: "Calculate Your ROI & Savings",
    calc_title: "How Much Will You Save & Earn with AIN?",
    calc_desc: "Adjust the sliders with your student numbers and course fees to see how much money you waste on video hosting and lost shared accounts.",

    curr_badge: "Courses Marketplace",
    curr_title: "Explore Flagship Curricula on the Platform",
    curr_desc: "Discover samples of courses hosted on AIN across diverse secondary, technology, and language tracks.",

    testi_badge: "Operational Workflows",
    testi_title: "Practical Solutions Built for Academy & Center Operations",
    testi_desc: "A unified system transitioning your workflow from manual chat groups to automated attendance, access control, and finance.",

    comp_badge: "Honest Comparison",
    comp_title: "Why Traditional Methods Fail to Protect Your Courses?",
    comp_desc: "Selling courses through WhatsApp, unlisted YouTube links, and Google Drive leaves your content exposed to unrestricted sharing and lost revenue.",
    comp_before_tag: "Traditional Channels (WhatsApp / Drive / Telegram)",
    comp_before_title: "Continuous Revenue Leaks & Unmonitored Content",
    comp_b1_title: "Links Leak in Minutes",
    comp_b1_desc: "Once a student has the video URL, it can be shared with anyone without your knowledge.",
    comp_b2_title: "1 Account Shared Across 10 Devices",
    comp_b2_desc: "A single subscription is passed around an entire class because there is no device lock.",
    comp_b3_title: "Camera Recording With Zero Trace",
    comp_b3_desc: "If someone records the screen with a phone, you can never trace who leaked it.",
    comp_b4_title: "Total Chaos in Attendance & Analytics",
    comp_b4_desc: "No audit logs of who actually watched, who skipped, or who attempted to download files.",

    comp_after_tag: "AIN Smart Platform",
    comp_after_title: "Access and tracking controls that help protect content",
    comp_a1_title: "Restricted, short-lived viewing sessions",
    comp_a1_desc: "Student access is checked before playback, and each session uses a short-lived token that does not work as a standalone video link.",
    comp_a2_title: "Approved Device Policy (1 Student = 1 Device)",
    comp_a2_desc: "The student account binds to their device fingerprint; logging in elsewhere requires admin reset.",
    comp_a3_title: "Dynamic Moving Watermark",
    comp_a3_desc: "Student identifiers move across the video periodically, deterring external recording and helping attribute a circulated copy to its session.",
    comp_a4_title: "QR Check-in & Event History",
    comp_a4_desc: "Fast attendance capture with a history of platform-observed events such as session opens and selected player shortcut attempts.",

    feat_badge: "All-in-One Academy Suite",
    feat_title: "Everything You Need to Run Your Courses in One Place",
    feat_desc: "Engineered to empower independent instructors and large academies with maximum simplicity and security.",
    f1_title: "Custom Academy Workspace & Branding",
    f1_desc: "Your academy with custom branding, isolated data, and complete privacy from other tenants.",
    f2_title: "Rooms & Cohort Management",
    f2_desc: "Group students into batches, levels, or classes with granular permission control for each room.",
    f3_title: "Embedded YouTube Unlisted Playback",
    f3_desc: "Use YouTube Unlisted to reduce video-hosting costs, with embedded playback, access controls, and in-player watermarks.",
    f4_title: "Smart Device Management",
    f4_desc: "Full security panel to audit student devices, with a 1-click device reset request approval workflow.",
    f5_title: "Dynamic QR Attendance",
    f5_desc: "Instant check-in for physical and online sessions with short-lived QR codes that reduce code reuse and sharing.",
    f6_title: "Detailed Revenue & Reports",
    f6_desc: "Live analytics on student enrollments, attendance, and revenue with 1-click Excel/CSV export.",

    prot_badge: "Multi-layered Defense",
    prot_title: "6 Access and Deterrence Controls for Your Content",
    prot_desc: "Device binding, session controls, watermarks, and audit logs reduce account sharing and improve traceability without claiming absolute copy prevention.",
    l1_title: "Dynamic Watermarking",
    l1_desc: "A moving watermark displays selected student and session identifiers to help trace redistributed recordings.",
    l2_title: "Device Binding & Session Guard",
    l2_desc: "Approved device binding preventing multi-device logins unless explicitly approved by the academy admin.",
    l3_title: "Browser Interaction Blocking",
    l3_desc: "Common save, print, drag, and context-menu actions are intercepted as a UX deterrent, not as a browser security boundary.",
    l4_title: "Single Active Session",
    l4_desc: "Automatic termination of older sessions if a login attempt occurs simultaneously from elsewhere.",
    l5_title: "Expiring Secure Tokens",
    l5_desc: "Uploaded files use short-lived signed access URLs; YouTube Unlisted playback remains subject to account controls and visible watermarks.",
    l6_title: "Security Audit Log",
    l6_desc: "Comprehensive logs capturing every suspicious action so instructors can act swiftly and block violators.",

    how_badge: "Get Started Fast",
    how_title: "Launch Your Academy in 4 Simple Steps",
    how_desc: "No technical expertise is required; our team helps configure the workspace and first workflow for an organized launch.",
    s1_title: "Create Your Workspace",
    s1_desc: "Register your academy details, then prepare and review the Pilot workspace with our team.",
    s2_title: "Organize Rooms & Batches",
    s2_desc: "Set up cohorts, specify schedules, and assign course materials with ease.",
    s3_title: "Add Videos & Documents",
    s3_desc: "Attach unlisted YouTube links and PDF notes with dynamic watermarking enabled automatically.",
    s4_title: "Invite Students & Grow",
    s4_desc: "Send invite links, confirm seat bookings, and monitor student attendance with peace of mind.",

    price_badge: "Flexible Pricing",
    price_title: "A clear plan for your academy's size",
    price_desc: "Start with a real pilot cohort, then choose the capacity that fits your active rooms and students.",
    btn_monthly: "Monthly",
    btn_yearly: "Yearly",
    save_20: "Save 20%",
    egp_currency: "EGP",
    per_month: "/ month",
    per_year: "/ year",
    pilot_duration: "/ 30 days",

    plan_pilot_tag: "100% Free Trial",
    plan_pilot_name: "Pilot Trial",
    plan_pilot_desc: "The risk-free way to test AIN with a small student cohort before committing.",
    btn_claim_pilot: "Claim 30-Day Free Trial",
    f_pilot_1: "Full branded academy workspace",
    f_pilot_2: "1 Educational Room",
    f_pilot_3: "Up to 25 trial students",
    f_pilot_4: "Full dynamic watermark suite",
    f_pilot_5: "1 Device binding & single session",
    f_pilot_6: "Direct WhatsApp onboarding support",

    plan_starter_tag: "For Solo Educators",
    plan_starter_name: "Starter",
    plan_starter_desc: "For educators launching their brand with full protection for video lectures and notes.",
    btn_subscribe: "Choose Starter",
    f_starter_1: "All Pilot features included",
    f_starter_2: "Up to 3 independent rooms",
    f_starter_3: "Up to 100 active students",
    f_starter_4: "Embed videos (YouTube Unlisted) with zero hosting overhead",
    f_starter_5: "Dynamic QR Attendance Check-in",
    f_starter_6: "Excel & CSV report exports",

    featured_badge: "Most Popular for Academies",
    plan_growth_tag: "For Training Centers",
    plan_growth_name: "Growth",
    plan_growth_desc: "The prime package for academies operating multiple cohorts and multi-instructor teams.",
    btn_choose_growth: "Start Growth Trial",
    f_growth_1: "All Starter features included",
    f_growth_2: "Up to 15 courses & learning rooms",
    f_growth_3: "Up to 500 active students",
    f_growth_4: "Multi-instructor role permissions",
    f_growth_5: "Student progress & watch analytics",
    f_growth_6: "Advanced security logs & alerts",

    plan_pro_tag: "For Scale & Enterprise",
    plan_pro_name: "Pro",
    plan_pro_desc: "For established educational institutions seeking custom branding, APIs, and dedicated care.",
    btn_contact_pro: "Contact for Enterprise",
    f_pro_1: "High capacity up to 5,000 students & flexible rooms",
    f_pro_2: "Custom Domain support",
    f_pro_3: "Custom logo, academy name & theme colors",
    f_pro_4: "Custom payment gateway integration & API",
    f_pro_5: "Dedicated Account Manager & 24/7 SLA",

    faq_badge: "Transparent & Direct Answers",
    faq_title: "Frequently Asked Questions About AIN & Course Protection",
    faq_desc: "Everything you need to know regarding video anti-piracy, hardware device locking, and our risk-free pilot.",
    faq_filter_head: "Filter by Topic",
    faq_filter_all: "All Questions",
    faq_filter_security: "Video Tracking & Security",
    faq_filter_devices: "Device Lock & Students",
    faq_filter_pricing: "Plans & Free Pilot",
    faq_filter_center: "Centers & Operations",
    faq_live_status: "Advisors Online Now",
    faq_card_help_title: "Have a Specific Question?",
    faq_card_help_desc: "Our technical consulting team is ready to evaluate your academy setup and simulate anti-piracy protection for your courses for free.",
    faq_btn_whatsapp: "Direct Chat on WhatsApp",
    faq_btn_call: "Book a 1-on-1 Demo Session",
    faq_response_time: "Prompt Technical Support ⚡",
    faq_zero_obligation: "Free Pilot - No Credit Card Required",
    tag_security: "Content Tracking Shield",
    tag_devices: "Device Fingerprint Lock",
    tag_pricing: "Pilot Terms",
    tag_center: "Centers & Setup",
    q1_title: "How does AIN protect videos if they are hosted on YouTube?",
    q1_body: "YouTube Unlisted videos can play inside AIN after account and device checks, with a moving, traceable watermark. These controls deter sharing and improve attribution, but they do not make YouTube content impossible to extract or record.",
    q2_title: "What happens if a student attempts to log in from a friend's device?",
    q2_body: "AIN enforces a strict 1-device policy. Upon first sign-in, the device fingerprint is registered. Any subsequent login on a foreign device triggers a block and prompts the student to submit a device reset request for your approval.",
    q3_title: "Is there any obligation or upfront payment for the 30-day Pilot?",
    q3_body: "No credit card or banking details are required to start. You receive a 30-day Pilot workspace to test the workflow with a small cohort before choosing a paid plan.",
    q4_title: "Can I easily migrate my current students and content to AIN?",
    q4_body: "Yes, seamlessly. Invite students via direct link or bulk CSV import, and attach your existing video links in minutes. Our onboarding team assists you step-by-step at zero cost.",
    q5_title: "Do students need to install complex software, or does it run in browsers & mobile?",
    q5_body: "The platform runs natively on all modern web browsers (Chrome, Safari, Edge) across laptops, tablets, and phones without installation, alongside a dedicated Android app engineered for student convenience and secure playback.",
    q6_title: "How does the platform handle different student connection speeds?",
    q6_body: "With YouTube Unlisted, students benefit from adaptive streaming that changes quality according to the connection and available settings. Actual data use and buffering depend on video quality and the student's network.",
    q7_title: "Does the platform support offline center attendance and printable registers?",
    q7_body: "AIN supports QR attendance, reviewable records, and export formats suitable for printing. External guardian notifications depend on the delivery channels configured for the academy.",

    cta_tag: "A practical step before subscribing",
    cta_title: "See AIN on a real workflow from your academy",
    cta_desc: "Book a short session to review your needs, prepare a pilot workspace, and confirm exactly what can go live before any commitment.",
    cta_btn_start: "Request a pilot workspace",
    cta_btn_preview: "Try the admin and student views",

    footer_about: "The intelligent LMS and content security platform empowering academies and training centers across the Arab world.",
    footer_col_platform: "Platform",
    footer_col_quick: "Quick Links",
    footer_academies: "Academies Directory",
    footer_roles: "Interactive Role Switcher",
    footer_col_support: "Support & Legal",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_support: "Technical Support",
    footer_demo_request: "Request a Demo Call",

    modal_kicker: "30-Day Free Pilot",
    modal_title: "Launch Your Academy on AIN",
    modal_desc: "Fill in your basic information and our team will connect with you via WhatsApp to prepare your space.",
    form_name: "Full Name",
    form_phone: "Phone / WhatsApp",
    form_email: "Email Address",
    form_org: "Academy or Center Name",
    form_type: "Educational Business Type",
    form_students: "Expected Student Count",
    form_content: "What content do you want to protect?",
    form_opt_choose: "Choose Type",
    form_opt_academy: "Training Academy",
    form_opt_instructor: "Independent Instructor",
    form_opt_languages: "Language Center",
    form_opt_school: "School / Tutoring Center",
    form_opt_corporate: "Corporate Training",
    form_submit: "Confirm & Chat on WhatsApp",

    proof_stats: 'An integrated operating system for education centers and hybrid academies in Egypt & MENA',
    sim_video_title: "Advanced Calculus & Mathematics - Lecture 04",
    sim_video_desc: "Monitored video session with dynamic watermark and device binding",
    sim_sample_student: "Ahmed M. El-Shenawy",

    role_tab_admin: "Academy Director & Center",
    role_tab_instructor: "Instructor & Educator",
    role_tab_student: "Student & Guardian",
    role_browse_dash: "Explore Live Dashboard",

    c_tab_all: "All (All)",
    c_tab_sec: "High School (3)",
    c_tab_tech: "Coding & AI (2)",
    c_tab_lang: "Languages (1)",

    c1_badge: "High School",
    c1_hours: "32 Training Hours",
    c1_students: "148 Students",
    c1_title: "Modern Physics for Secondary Grade 12 (2026)",
    c1_desc: "Comprehensive syllabus breakdown with 1,500+ solved problem sets, interactive question banks, and leak-proof encrypted quizzes.",
    c1_inst: "Prof. Ahmed El-Naggar",
    c1_role: "Certified Master of Physics",
    c1_price: "240 EGP",
    c1_old_price: "320 EGP",

    c2_badge: "Programming & AI",
    c2_hours: "48 Training Hours",
    c2_students: "312 Students",
    c2_title: "Full-Stack Web Development Bootcamp",
    c2_desc: "From fundamentals to production: React, Node.js, databases, and enterprise projects tailored for the international software job market.",
    c2_inst: "Eng. Tarek El-Mahdy",
    c2_role: "Senior Software Architect",
    c2_price: "650 EGP",
    c2_old_price: "900 EGP",

    c3_badge: "High School",
    c3_hours: "28 Training Hours",
    c3_students: "220 Students",
    c3_title: "Comprehensive Organic Chemistry - Grade 12",
    c3_desc: "Reaction mechanisms, structural formula mindmaps, and modern tablet-system ministerial past paper walkthroughs.",
    c3_inst: "Dr. Sameh Abdel-Razek",
    c3_role: "Lead Chemistry Lecturer",
    c3_price: "200 EGP",
    c3_old_price: "250 EGP",

    c4_badge: "Languages",
    c4_hours: "36 Training Hours",
    c4_students: "180 Students",
    c4_title: "Business English & Professional Fluency",
    c4_desc: "Advanced pronunciation, corporate idioms, and live interactive speaking clinics with certified trainers and accredited certificates.",
    c4_inst: "Ms. Dina El-Shafei",
    c4_role: "CELTA Certified Trainer",
    c4_price: "350 EGP",
    c4_old_price: "400 EGP",

    c5_badge: "Tech & Mobile",
    c5_hours: "40 Training Hours",
    c5_students: "195 Students",
    c5_title: "Mobile App Development with Flutter & Dart",
    c5_desc: "Architect, build, and deploy production iOS and Android apps connected to REST APIs and published live on the App Store & Google Play.",
    c5_inst: "Eng. Abdelrahman Nabil",
    c5_role: "Mobile Lead Developer",
    c5_price: "500 EGP",
    c5_old_price: "750 EGP",

    c6_badge: "High School",
    c6_hours: "45 Training Hours",
    c6_students: "340 Students",
    c6_title: "Calculus & 3D Spatial Analytic Geometry",
    c6_desc: "Intuitive calculus derivations, spatial geometry tricks, and rapid exam-solving shortcuts with national past paper solutions.",
    c6_inst: "Prof. Mohamed Fawzy",
    c6_role: "Senior Mathematics Lecturer",
    c6_price: "220 EGP",
    c6_old_price: "280 EGP",

    c_btn_enroll: "Enroll Now",
    c_browse_all: "Browse All Courses in AIN Marketplace",

    testi_1_badge: "Content & Device Protection",
    testi_1_quote: "Student identifiers appear as a moving watermark, while device and session controls curb account sharing and make leaks traceable.",
    testi_1_author: "Content & Session Protection",
    testi_1_title: "Access control & digital watermarking",

    testi_2_badge: "Attendance Workflow",
    testi_2_quote: "QR check-in records attendance in seconds and keeps one organized history for center staff and guardians without scattered paper sheets.",
    testi_2_author: "Attendance & Cohort Management",
    testi_2_title: "Hybrid & in-person classroom workflows",

    testi_3_badge: "Financial Control & Operations",
    testi_3_quote: "The operations dashboard brings together bookings, payments, and pending dues with exportable cohort reports for faster decisions.",
    testi_3_author: "Reporting & Financial Operations",
    testi_3_title: "Actionable operational oversight",

    takeaway_1: "<strong>Practical takeaway:</strong> Traceable watermarking without requiring dedicated video hosting when using YouTube Unlisted.",
    takeaway_2: "<strong>Practical Takeaway:</strong> Reduce multi-student account sharing by enforcing verified device binding per student.",
    takeaway_3: "<strong>Pilot terms:</strong> 30 days without a credit card or upfront fee, within the published Pilot limits.",
    takeaway_4: "<strong>Operational readiness:</strong> Guided setup for your academy workspace and first course before launch.",
    takeaway_5: "<strong>Compatibility:</strong> Fast mobile app + responsive web portal running smoothly across devices.",
    takeaway_6: "<strong>Hybrid Workflow:</strong> Run physical study centers and remote students from one unified console.",

    form_opt_lt25: "Under 25 students",
    form_opt_25_100: "25 - 100 students",
    form_opt_100_300: "100 - 300 students",
    form_opt_gt300: "Over 300 students",
    form_ph_name: "e.g., Dr. Mohamed Ali",
    form_ph_org: "e.g., Elite Academy",
    form_ph_content: "e.g., Coding course, High School lectures, revision videos...",
    float_whatsapp: "Chat with us on WhatsApp",
    footer_copyright: "© 2026 AIN Platform. All rights reserved.",

    calc_lbl_students: "Students in your academy:",
    calc_lbl_price: "Average monthly course price:",
    calc_callout: "Fragmented attendance, lesson, and billing tools drain academy budgets and staff time. AIN unifies these workflows to save administrative hours and reduce shared account leakage.",
    calc_res_hosting_lbl: "Annual video hosting savings (Vimeo / Wistia):",
    calc_res_hosting_sub: "With AIN: save video hosting costs via direct unlisted integration",
    calc_res_reclaim_lbl: "Projected value from reduced account sharing & admin savings:",
    calc_res_reclaim_sub: "Saving admin overhead and securing legitimate student enrollments",
    calc_res_total_lbl: "Total projected extra annual return for your academy:",
    calc_res_cta_btn: "Claim Your Free Pilot & Scale Revenue Now"
  }
};

// --------------------------------------------------------------------------
// LANGUAGE SWITCHER ENGINE
// --------------------------------------------------------------------------
let currentLang = window.localStorage.getItem("ain-landing-lang") || "ar";
let currentActiveRole = "admin";

function applyLanguage(lang) {
  currentLang = lang;
  window.localStorage.setItem("ain-landing-lang", lang);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  const dict = I18N[lang] || I18N.ar;

  // Update elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  // Update elements with data-i18n-placeholder attribute
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.setAttribute("placeholder", dict[key]);
    }
  });

  // Update language toggle button label
  const langLabel = document.getElementById("lang-label");
  if (langLabel) {
    langLabel.textContent = dict.lang_btn;
  }

  // Update page title
  if (lang === "en") {
    document.title = "AIN | Smart All-in-One LMS & Anti-Piracy Platform for Academies";
  } else {
    document.title = "AIN | المنصة الذكية المتكاملة للأكاديميات والمراكز التعليمية";
  }

  // Update active role showcase with active language
  switchRoleShowcase(currentActiveRole);

  // Update prices & calculator with current language
  updatePricingDisplay();
  calculateRoi();
}

function toggleLanguage() {
  const next = currentLang === "ar" ? "en" : "ar";
  applyLanguage(next);
}

// --------------------------------------------------------------------------
// ROLE SHOWCASE SWITCHER ENGINE
// --------------------------------------------------------------------------
const ROLE_DATA = {
  admin: {
    kicker: '<i class="ti ti-shield-check"></i> ضوابط تشغيلية وأمنية مشددة',
    kickerEn: '<i class="ti ti-shield-check"></i> Advanced Operational & Security Controls',
    heading: 'لوحة تحكم مركزية لإدارة كل تفاصيل أكاديميتك',
    headingEn: 'Central Command Center for All Your Academy Operations',
    body: 'راقب الاشتراكات والإيرادات في الوقت الحقيقي، اعتمد طلبات حجز الحصص، وأدر أجهزة الطلاب المصرح لها. إذا حاول أي طالب فتح حسابه من جهاز صديقه، يتم إيقافه تلقائياً وتصلك إشعار فوري لمراجعة وتأكيد استبدال الجهاز.',
    bodyEn: 'Monitor enrollments and revenues in real-time, approve seat bookings, and audit authorized student devices. If a student tries logging in from a friend’s computer, they are blocked instantly while you receive an audit alert to review the reset request.',
    bullets: [
      'إدارة الدفعات والغرف التعليمية (Cohorts & Rooms) بمرونة تامة.',
      'قفل الحساب بجهاز واحد لكل طالب (1 Student = 1 Device Binding).',
      'تقارير مالية وتصدير كشوف الحضور والدرجات إلى Excel بضغطة زر.',
      'تحديد صلاحيات دقيقة للمساعدين والمدرسين دون الوصول للأرباح العامة.'
    ],
    bulletsEn: [
      'Comprehensive Cohorts & Learning Rooms management.',
      'Strict 1-Device binding per student to eliminate account sharing.',
      '1-Click Excel & CSV report exports for attendance, scores, and revenue.',
      'Granular roles and permission delegation for assistants and educators.'
    ],
    mockTitle: 'لوحة مدير الأكاديمية - نظرة سريعة',
    mockTitleEn: 'Academy Director Dashboard - Overview',
    metrics: [
      { label: 'الطلاب النشطون', labelEn: 'Active Students', value: '482 طالب', valueEn: '482 Students', color: '' },
      { label: 'إيراد الشهر', labelEn: 'Monthly Revenue', value: '96,400 ج.م', valueEn: '96,400 EGP', color: 'green' },
      { label: 'محاولات دخول للمراجعة', labelEn: 'Sign-ins to Review', value: '14 محاولة', valueEn: '14 Attempts', color: 'red' }
    ],
    items: [
      {
        icon: 'ti ti-qrcode',
        iconColor: 'green',
        title: 'تحضير دفعة الثانوية العامة (المجموعة أ)',
        titleEn: 'Grade 12 Attendance Check-in (Group A)',
        subtitle: 'تم تسجيل حضور 42 طالباً عبر QR Code بنجاح',
        subtitleEn: '42 students checked in via QR Code successfully',
        badge: 'منذ 3 دقائق',
        badgeEn: '3 min ago',
        badgeClass: 'item-time'
      },
      {
        icon: 'ti ti-device-mobile',
        iconColor: 'amber',
        title: 'طلب استبدال جهاز (محمود عادل)',
        titleEn: 'Device Reset Request (Mahmoud Adel)',
        subtitle: 'حاول الدخول من كمبيوتر جديد - بانتظار موافقتك',
        subtitleEn: 'Attempted login from foreign device - Pending approval',
        badge: 'قيد المراجعة',
        badgeEn: 'Pending Review',
        badgeClass: 'badge-pending'
      },
      {
        icon: 'ti ti-video',
        iconColor: 'blue',
        title: 'جلسة مشاهدة نشطة: المحاضرة الخامسة',
        titleEn: 'Active Stream: Lecture 05 Organic Chem',
        subtitle: 'علامة مائية فعالة لـ 38 طالباً متزامناً',
        subtitleEn: 'Dynamic watermark active for 38 simultaneous students',
        badge: 'مشاهدة آمنة',
        badgeEn: 'Secure Stream',
        badgeClass: 'badge-active'
      }
    ]
  },
  instructor: {
    kicker: '<i class="ti ti-chalkboard"></i> بيئة تدريس سلسة وبث محمي',
    kickerEn: '<i class="ti ti-chalkboard"></i> Frictionless Teaching & Protected Streaming',
    heading: 'استوديو المحاضر: ركّز على الشرح ودع المنصة تحمي مجهودك',
    headingEn: 'Instructor Studio: Focus on Teaching, We Safeguard Every Second',
    body: 'اربط فيديوهات YouTube Unlisted بدون أي تعقيد تقني أو تكاليف سيرفرات، فعّل العلامة المائية ببيانات كل طالب بضغطة زر، وتابع نسب إكمال كل فيديو وتفاعل الطلاب مع الواجبات والامتحانات الدورية.',
    bodyEn: 'Embed YouTube Unlisted lessons with zero tech friction or hosting fees. Activate floating dynamic watermarks showing student credentials with 1-click, and track exact watch minutes, quiz submissions, and homework completion.',
    bullets: [
      'استضافة مجانية غير محدودة للفيديوهات عبر مشغل AIN المحمي.',
      'علامة مائية ديناميكية تحمل اسم ورقم هاتف الطالب لتمنع وتفضح أي تصوير خارجي.',
      'بنوك أسئلة واختبارات إلكترونية بتصحيح آلي فوري وإحصائيات نقاط القوة والضعف.',
      'تتبع دقيق لدقائق المشاهدة وتفاعل الطلاب مع كل درس لمعرفة المتفوقين والكسالى.'
    ],
    bulletsEn: [
      'Unlimited zero-cost video hosting via the protected AIN player.',
      'Dynamic watermarks displaying student info to deter camera recording.',
      'Interactive quiz banks with automated grading and performance insights.',
      'Granular watch-time tracking to identify engaged and lagging students.'
    ],
    mockTitle: 'استوديو المعلم - كورس الكيمياء المتقدمة',
    mockTitleEn: 'Instructor Studio - Organic Chemistry Track',
    metrics: [
      { label: 'المحاضرات المرفوعة', labelEn: 'Uploaded Lessons', value: '28 محاضرة', valueEn: '28 Lessons', color: '' },
      { label: 'متوسط نسبة الإكمال', labelEn: 'Completion Rate', value: '91.4%', valueEn: '91.4%', color: 'green' },
      { label: 'الواجبات المصححة', labelEn: 'Graded Quizzes', value: '184 واجب', valueEn: '184 Submissions', color: 'blue' }
    ],
    items: [
      {
        icon: 'ti ti-chart-pie',
        iconColor: 'green',
        title: 'نتائج كويز الألكانات والخواص الفيزيائية',
        titleEn: 'Alkane Quiz Results & Analytics',
        subtitle: 'أعلى درجة: 98% • متوسط الدفعة: 84%',
        subtitleEn: 'Top Score: 98% • Cohort Average: 84%',
        badge: 'تم التصحيح',
        badgeEn: 'Graded',
        badgeClass: 'badge-active'
      },
      {
        icon: 'ti ti-brand-youtube',
        iconColor: 'blue',
        title: 'ربط فيديو المحاضرة 06 (YouTube Unlisted)',
        titleEn: 'Video Connected: Lecture 06 (YouTube Unlisted)',
        subtitle: 'تم تطبيق العلامة المائية وتشفير الجلسة بنجاح',
        subtitleEn: 'Watermark and session token bound successfully',
        badge: 'جاهز للعرض',
        badgeEn: 'Ready',
        badgeClass: 'badge-active'
      },
      {
        icon: 'ti ti-messages',
        iconColor: 'amber',
        title: 'استفسارات الطلاب على درس أمس',
        titleEn: 'Student Questions on Yesterday’s Lecture',
        subtitle: '3 أسئلة جديدة بانتظار الإجابة في منتدى الغرفة',
        subtitleEn: '3 new inquiries in room discussion forum',
        badge: '3 أسئلة',
        badgeEn: '3 Inquiries',
        badgeClass: 'badge-pending'
      }
    ]
  },
  student: {
    kicker: '<i class="ti ti-device-laptop"></i> تجربة تعلم تفاعلية وسريعة',
    kickerEn: '<i class="ti ti-device-laptop"></i> Fast, Distraction-Free Student Experience',
    heading: 'بوابة الطالب وولي الأمر: تجربة تعليمية سلسة وبدون تشتيت',
    headingEn: 'Student & Guardian Portal: Seamless, Distraction-Free Learning',
    body: 'مشاهدة فورية بدون تقطيع أو إعلانات مزعجة، تجربة سلسة ومتكيفة على الموبايل أو اللابتوب، تسجيل حضور سريع برمز QR شخصي عند باب السنتر أو الحصة، ومتابعة حية للواجبات والدرجات.',
    bodyEn: 'Instant streaming without buffering or intrusive ads, responsive mobile and tablet layout, contactless QR attendance at the center, and live progress dashboards accessible to parents and students.',
    bullets: [
      'مشغل فيديو سريع يتكيف تلقائياً مع جودة وسرعة باقة الإنترنت.',
      'تسجيل حضور ذكي برمز QR شخصي داخل السنتر أو الجلسات الأونلاين.',
      'وصول مباشر للمذكرات وملفات PDF المحمية بدون تنزيل أو طباعة خارجية.',
      'متابعة الواجبات والاختبارات وتنبيهات مواعيد المحاضرات القادمة أولاً بأول.'
    ],
    bulletsEn: [
      'Adaptive high-speed video player optimized for varied internet connections.',
      'Cryptographic QR code for effortless physical and virtual attendance.',
      'Integrated in-browser PDF viewer for study sheets with zero leak risk.',
      'Homework trackers, instant quiz scores, and calendar reminders.'
    ],
    mockTitle: 'بوابة الطالب - لوحة المتابعة الشخصية',
    mockTitleEn: 'Student Portal - Personal Learning Dashboard',
    metrics: [
      { label: 'الكورسات المشترك بها', labelEn: 'Enrolled Courses', value: '4 مقررات', valueEn: '4 Courses', color: '' },
      { label: 'نسبة الحضور بالـ QR', labelEn: 'QR Attendance', value: '98%', valueEn: '98%', color: 'green' },
      { label: 'الواجبات المنجزة', labelEn: 'Completed Tasks', value: '22 / 24', valueEn: '22 / 24', color: 'blue' }
    ],
    items: [
      {
        icon: 'ti ti-player-play',
        iconColor: 'blue',
        title: 'متابعة المشاهدة: كورس الفيزياء - المحاضرة 03',
        titleEn: 'Continue Watching: Physics - Lecture 03',
        subtitle: 'توقفت عند الدقيقة 24:15 • المشاهدة محصنة بعلامتك',
        subtitleEn: 'Paused at 24:15 • Watermark active on screen',
        badge: 'استئناف',
        badgeEn: 'Resume',
        badgeClass: 'badge-active'
      },
      {
        icon: 'ti ti-file-text',
        iconColor: 'amber',
        title: 'واجب الرياضيات الأسبوعي (التفاضل)',
        titleEn: 'Weekly Calculus Assignment #04',
        subtitle: 'الموعد النهائي للتسليم: غداً الساعة 8:00 مساءً',
        subtitleEn: 'Deadline: Tomorrow at 8:00 PM',
        badge: 'متبقي 20 ساعة',
        badgeEn: '20 hrs left',
        badgeClass: 'badge-pending'
      },
      {
        icon: 'ti ti-qrcode',
        iconColor: 'green',
        title: 'كود الحضور الشخصي للسنتر اليوم',
        titleEn: 'Personal QR Pass for Center Check-in Today',
        subtitle: 'جاهز للمسح عند مكتب الاستقبال بالسنتر',
        subtitleEn: 'Ready for scanning at the reception desk',
        badge: 'صالح الآن',
        badgeEn: 'Active Now',
        badgeClass: 'badge-active'
      }
    ]
  }
};

function switchRoleShowcase(roleKey) {
  currentActiveRole = roleKey;
  const data = ROLE_DATA[roleKey] || ROLE_DATA.admin;
  const isAr = currentLang === "ar";

  // Update tabs active state
  ['admin', 'instructor', 'student'].forEach((k) => {
    const btn = document.getElementById(`role-btn-${k}`);
    if (btn) btn.classList.toggle('active', k === roleKey);
  });

  // Update text elements
  const kickerEl = document.getElementById('role-kicker');
  const headingEl = document.getElementById('role-heading');
  const bodyEl = document.getElementById('role-body');
  const bulletsEl = document.getElementById('role-bullets');

  if (kickerEl) kickerEl.innerHTML = isAr ? data.kicker : data.kickerEn;
  if (headingEl) headingEl.textContent = isAr ? data.heading : data.headingEn;
  if (bodyEl) bodyEl.textContent = isAr ? data.body : data.bodyEn;

  if (bulletsEl) {
    const list = isAr ? data.bullets : data.bulletsEn;
    bulletsEl.innerHTML = list.map((b) => `<li><i class="ti ti-check"></i> ${b}</li>`).join('');
  }

  // Update mock dashboard
  const headTitle = document.getElementById('mock-head-title');
  if (headTitle) headTitle.textContent = isAr ? data.mockTitle : data.mockTitleEn;

  const previewCol = document.getElementById('role-preview-col');
  if (previewCol) {
    const metricsHtml = data.metrics.map((m) => `
      <div class="metric-pill ${m.color}">
        <small>${isAr ? m.label : m.labelEn}</small>
        <strong>${isAr ? m.value : m.valueEn}</strong>
      </div>
    `).join('');

    const itemsHtml = data.items.map((it) => `
      <div class="mock-list-item">
        <div class="item-icon ${it.iconColor}"><i class="${it.icon}"></i></div>
        <div class="item-text">
          <strong>${isAr ? it.title : it.titleEn}</strong>
          <small>${isAr ? it.subtitle : it.subtitleEn}</small>
        </div>
        <span class="${it.badgeClass}">${isAr ? it.badge : (it.badgeEn || it.badge)}</span>
      </div>
    `).join('');

    previewCol.innerHTML = `
      <div class="mock-dash-card">
        <div class="mock-dash-head">
          <div class="mock-title">
            <i class="ti ti-dashboard"></i>
            <span id="mock-head-title">${isAr ? data.mockTitle : data.mockTitleEn}</span>
          </div>
          <span class="mock-live-badge"><i class="ti ti-point-filled"></i> ${isAr ? 'متصل الآن' : 'Live Sync'}</span>
        </div>
        <div class="mock-metrics-row">
          ${metricsHtml}
        </div>
        <div class="mock-list-box">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// SAVINGS & ROI CALCULATOR ENGINE
// --------------------------------------------------------------------------
function calculateRoi() {
  const studentsRange = document.getElementById("calc-students-range");
  const priceRange = document.getElementById("calc-price-range");

  if (!studentsRange || !priceRange) return;

  const students = parseInt(studentsRange.value, 10) || 250;
  const price = parseInt(priceRange.value, 10) || 250;
  const isAr = currentLang === "ar";

  // Update slider badge labels
  const studentsValEl = document.getElementById("calc-students-val");
  const priceValEl = document.getElementById("calc-price-val");

  if (studentsValEl) {
    studentsValEl.textContent = isAr ? `${students} طالب` : `${students} Students`;
  }
  if (priceValEl) {
    priceValEl.textContent = isAr ? `${price} ج.م` : `${price} EGP`;
  }

  // Formula:
  // 1. Hosting Savings (Vimeo/Wistia bandwith fees ~$8/student/yr ~ 96 EGP/student/yr)
  const hostingSavings = Math.round(students * 8 * 12);

  // 2. Leaked Accounts Recovered: ~25% of students share credentials without device binding.
  // With 1 student = 1 device lock, these 25% are forced to purchase legitimate seats.
  const recoveredStudents = Math.round(students * 0.25);
  const recoveredRevenue = Math.round(recoveredStudents * price * 12);

  // 3. Grand Total Annual Benefit
  const grandTotal = hostingSavings + recoveredRevenue;

  // Format currency
  const curr = isAr ? "ج.م" : "EGP";

  const resHostingEl = document.getElementById("res-hosting-savings");
  const resRecoveredEl = document.getElementById("res-leak-recovered");
  const resTotalEl = document.getElementById("res-total-benefit");

  if (resHostingEl) resHostingEl.textContent = `${hostingSavings.toLocaleString()} ${curr}`;
  if (resRecoveredEl) resRecoveredEl.textContent = `${recoveredRevenue.toLocaleString()} ${curr}`;
  if (resTotalEl) resTotalEl.textContent = `+${grandTotal.toLocaleString()} ${curr}`;
}

// --------------------------------------------------------------------------
// CURRICULA & COURSES FILTER ENGINE
// --------------------------------------------------------------------------
function filterCourses(category) {
  // Update active tab button
  document.querySelectorAll(".curr-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`.curr-tab-btn[onclick*="${category}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  const cards = document.querySelectorAll(".course-card");
  cards.forEach((card) => {
    const cardCat = card.getAttribute("data-category");
    if (category === "all" || cardCat === category) {
      card.style.display = "flex";
      card.style.animation = "fadeInCard 0.4s ease forwards";
    } else {
      card.style.display = "none";
    }
  });
}

// --------------------------------------------------------------------------
// PRICING SWITCHER (MONTHLY / YEARLY -20%)
// --------------------------------------------------------------------------
let billingPeriod = "monthly";

const PLAN_PRICES = {
  starter: { monthly: 500, yearly: 400 },
  growth: { monthly: 1200, yearly: 960 },
  pro: { monthly: 2500, yearly: 2000 }
};

function switchBilling(period) {
  billingPeriod = period;

  document.getElementById("btn-monthly")?.classList.toggle("active", period === "monthly");
  document.getElementById("btn-yearly")?.classList.toggle("active", period === "yearly");

  updatePricingDisplay();
}

function updatePricingDisplay() {
  const isAr = currentLang === "ar";
  const periodText = billingPeriod === "monthly" 
    ? (isAr ? "/ شهرياً" : "/ month")
    : (isAr ? "/ شهرياً (تدفع سنوياً)" : "/ mo (billed yearly)");

  const starterEl = document.getElementById("starter-price");
  const growthEl = document.getElementById("growth-price");
  const proEl = document.getElementById("pro-price");

  if (starterEl) starterEl.textContent = PLAN_PRICES.starter[billingPeriod].toLocaleString();
  if (growthEl) growthEl.textContent = PLAN_PRICES.growth[billingPeriod].toLocaleString();
  if (proEl) proEl.textContent = PLAN_PRICES.pro[billingPeriod].toLocaleString();

  const starterPeriod = document.getElementById("starter-period");
  const growthPeriod = document.getElementById("growth-period");
  const proPeriod = document.getElementById("pro-period");

  if (starterPeriod) starterPeriod.textContent = periodText;
  if (growthPeriod) growthPeriod.textContent = periodText;
  if (proPeriod) proPeriod.textContent = periodText;
}

// --------------------------------------------------------------------------
// INTERACTIVE WATERMARK SIMULATOR ENGINE
// --------------------------------------------------------------------------
const WATERMARK_POSITIONS = [
  "pos-top-left",
  "pos-top-right",
  "pos-center",
  "pos-bottom-left",
  "pos-bottom-right"
];

let watermarkPositionIndex = 0;
let watermarkAutoInterval = null;
let simPlaying = true;

function moveSimWatermark(index) {
  const watermark = document.getElementById("sim-watermark-tag");
  if (!watermark) return;

  WATERMARK_POSITIONS.forEach((pos) => watermark.classList.remove(pos));

  const targetPos = WATERMARK_POSITIONS[index % WATERMARK_POSITIONS.length];
  watermark.classList.add(targetPos);
  watermarkPositionIndex = index % WATERMARK_POSITIONS.length;
}

function moveSimWatermarkRandomly() {
  let next = (watermarkPositionIndex + 1 + Math.floor(Math.random() * (WATERMARK_POSITIONS.length - 1))) % WATERMARK_POSITIONS.length;
  moveSimWatermark(next);
}

function updateSimWatermark() {
  const nameVal = document.getElementById("sim-input-name")?.value || "أحمد محمد الشناوي";
  const phoneVal = document.getElementById("sim-input-phone")?.value || "197.48.22.14";
  const display = document.getElementById("sim-watermark-display");
  if (display) {
    display.textContent = `${nameVal} • ${phoneVal} • Session #${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

function handleSimRightClick(event) {
  event.preventDefault();
  triggerSimSecurityAlert();
}

function triggerSimSecurityAlert() {
  const toast = document.getElementById("sim-blocked-toast");
  if (!toast) return;

  toast.classList.add("show");
  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function toggleSimPlayback() {
  simPlaying = !simPlaying;
  const icon = document.getElementById("sim-play-icon");
  if (icon) {
    icon.className = simPlaying ? "ti ti-player-pause" : "ti ti-player-play";
  }
}

function startSimulatorAutoLoop() {
  if (watermarkAutoInterval) clearInterval(watermarkAutoInterval);
  watermarkAutoInterval = setInterval(() => {
    moveSimWatermark((watermarkPositionIndex + 1) % WATERMARK_POSITIONS.length);
  }, 4500);
}

// --------------------------------------------------------------------------
// ANIMATED COUNTER ENGINE (IntersectionObserver)
// --------------------------------------------------------------------------
function initCounters() {
  const counters = document.querySelectorAll(".counter-num");
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach((c) => observer.observe(c));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute("data-target"), 10) || 100;
  const duration = 1400; // ms
  const stepTime = 20; // ms
  const steps = duration / stepTime;
  const increment = target / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = `+${Math.floor(current).toLocaleString()}`;
  }, stepTime);
}

// --------------------------------------------------------------------------
// MOBILE MENU & DRAWER NAVIGATION
// --------------------------------------------------------------------------
function toggleMobileMenu() {
  const drawer = document.getElementById("mobile-drawer");
  const overlay = document.getElementById("drawer-overlay");
  if (!drawer || !overlay) return;

  const isOpen = drawer.classList.contains("is-open");
  if (isOpen) {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  } else {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
}

// --------------------------------------------------------------------------
// MODAL & SCROLL UTILITIES
// --------------------------------------------------------------------------
function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openLeadModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("on");
  document.body.style.overflow = "hidden";
  const firstInput = modal.querySelector("input, select, textarea");
  window.setTimeout(() => firstInput?.focus(), 80);
}

function closeLeadModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("on");
  document.body.style.overflow = "";
}

function value(formData, key) {
  return String(formData.get(key) || "").trim();
}

function openWhatsApp(message) {
  const url = `https://wa.me/${AIN_CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

async function captureTrialLead(data) {
  const payload = Object.fromEntries(data.entries());
  try {
    await fetch(`${AIN_CONTACT.apiBaseUrl}/public/trial-leads`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("Could not post trial lead API, proceeding to WhatsApp directly:", error);
  }
}

async function submitTrialForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submitBtn = form.querySelector("[type='submit']");

  const data = new FormData(form);
  const isAr = currentLang === "ar";

  const message = isAr ? [
    "مرحبًا فريق AIN، أريد حجز تجربة شهر مجاني للمنصة.",
    "",
    `👤 الاسم: ${value(data, "name")}`,
    `📱 الهاتف / WhatsApp: ${value(data, "phone")}`,
    `✉️ البريد الإلكتروني: ${value(data, "email")}`,
    `🏛️ اسم الأكاديمية / المركز: ${value(data, "organization")}`,
    `🎯 نوع النشاط: ${value(data, "type")}`,
    `👥 عدد الطلاب المتوقع: ${value(data, "students")}`,
    `🔒 المحتوى المطلوب حمايته: ${value(data, "content")}`,
  ].join("\n") : [
    "Hello AIN team, I would like to activate a 30-day free trial for my academy.",
    "",
    `Name: ${value(data, "name")}`,
    `Phone: ${value(data, "phone")}`,
    `Email: ${value(data, "email")}`,
    `Organization: ${value(data, "organization")}`,
    `Type: ${value(data, "type")}`,
    `Expected Students: ${value(data, "students")}`,
    `Target Content: ${value(data, "content")}`,
  ].join("\n");

  submitBtn?.setAttribute("disabled", "disabled");
  try {
    await captureTrialLead(data);
    form.reset();
  } finally {
    submitBtn?.removeAttribute("disabled");
  }
  closeLeadModal("trial-modal");
  openWhatsApp(message);
}

// --------------------------------------------------------------------------
// INITIALIZATION ON DOM READY
// --------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Apply saved or default language
  applyLanguage(currentLang);

  // Initialize role showcase
  switchRoleShowcase("admin");

  // Initialize ROI calculator
  calculateRoi();

  // Initialize count-up observer
  initCounters();

  // Start watermark simulator loop
  moveSimWatermark(0);
  startSimulatorAutoLoop();

  // Close modals on overlay backdrop click
  document.querySelectorAll(".overlay").forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLeadModal(overlay.id);
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.querySelectorAll(".overlay.on").forEach((overlay) => {
      closeLeadModal(overlay.id);
    });
    const drawer = document.getElementById("mobile-drawer");
    const drawerOverlay = document.getElementById("drawer-overlay");
    if (drawer?.classList.contains("is-open")) {
      drawer.classList.remove("is-open");
      drawerOverlay?.classList.remove("is-open");
      document.body.style.overflow = "";
    }
  }
});

// --------------------------------------------------------------------------
// FAQ ACCORDION & TOPIC FILTER ENGINE
// --------------------------------------------------------------------------
function toggleFaqCard(faqId) {
  const targetCard = document.querySelector(`.faq-card[data-faq-id="${faqId}"]`);
  if (!targetCard) return;

  const isCurrentlyActive = targetCard.classList.contains("is-active");

  // Smooth accordion: collapse other cards for clean reading experience
  document.querySelectorAll(".faq-card.is-active").forEach((card) => {
    if (card !== targetCard) {
      card.classList.remove("is-active");
    }
  });

  // Toggle target card state
  if (isCurrentlyActive) {
    targetCard.classList.remove("is-active");
  } else {
    targetCard.classList.add("is-active");
  }
}

function filterFaqCategory(category, buttonEl) {
  // Update active chip state
  document.querySelectorAll(".faq-chip").forEach((chip) => {
    chip.classList.remove("active");
  });
  if (buttonEl) {
    buttonEl.classList.add("active");
  }

  const cards = document.querySelectorAll(".faq-card");
  cards.forEach((card) => {
    const cardCat = card.getAttribute("data-category");
    if (category === "all" || cardCat === category) {
      card.style.display = "";
      card.style.animation = "fadeInCard 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards";
    } else {
      card.style.display = "none";
    }
  });
}

// Expose global methods for inline HTML event handlers
window.toggleMobileMenu = toggleMobileMenu;
window.toggleLanguage = toggleLanguage;
window.switchRoleShowcase = switchRoleShowcase;
window.calculateRoi = calculateRoi;
window.filterCourses = filterCourses;
window.switchBilling = switchBilling;
window.toggleSimPlayback = toggleSimPlayback;
window.moveSimWatermark = moveSimWatermark;
window.moveSimWatermarkRandomly = moveSimWatermarkRandomly;
window.updateSimWatermark = updateSimWatermark;
window.triggerSimSecurityAlert = triggerSimSecurityAlert;
window.handleSimRightClick = handleSimRightClick;
window.scrollToId = scrollToId;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
window.submitTrialForm = submitTrialForm;
window.toggleFaqCard = toggleFaqCard;
window.filterFaqCategory = filterFaqCategory;

