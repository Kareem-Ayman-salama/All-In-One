const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const screenshotsDir = path.join(root, 'previews', 'screenshots');
const statesDir = path.join(screenshotsDir, 'after-state-coverage');
const rtlDir = path.join(screenshotsDir, 'after-rtl-arabic-coverage');
const storeDir = path.join(screenshotsDir, 'store-ready-preview-set');

const width = 390;
const height = 844;
const ink = '#0f172a';
const muted = '#64748b';
const page = '#f7fafc';
const surface = '#ffffff';
const line = '#dbe4ee';
const blue = '#0f5bb5';
const cyan = '#19b7d5';
const green = '#16a34a';
const amber = '#f59e0b';
const red = '#ef4444';
const indigo = '#6366f1';

for (const dir of [statesDir, rtlDir, storeDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function esc(value) {
  return String(value).replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char],
  );
}

function frame(title, subtitle, body, accent = blue, options = {}) {
  const dir = options.rtl ? 'rtl' : 'ltr';
  const titleX = options.rtl ? 338 : 28;
  const anchor = options.rtl ? 'end' : 'start';
  const avatarX = options.rtl ? 58 : 332;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" direction="${dir}">
  <style>
    .font{font-family:Inter,Arial,sans-serif}.ink{fill:${ink}}.muted{fill:${muted}}
    .title{font-size:25px;font-weight:850}.h{font-size:17px;font-weight:800}.body{font-size:13px}.small{font-size:11px}.label{font-size:11px;font-weight:800}
  </style>
  <rect width="${width}" height="${height}" rx="34" fill="#111827"/>
  <rect x="10" y="10" width="370" height="824" rx="28" fill="${page}"/>
  <rect x="158" y="24" width="74" height="7" rx="4" fill="#111827" opacity=".85"/>
  <circle cx="${avatarX}" cy="66" r="22" fill="#e8f7fb"/>
  <text x="${avatarX}" y="73" text-anchor="middle" class="font" font-size="18" font-weight="900" fill="${cyan}">A</text>
  <text x="${titleX}" y="72" text-anchor="${anchor}" class="font title ink">${esc(title)}</text>
  <text x="${titleX}" y="101" text-anchor="${anchor}" class="font body muted">${esc(subtitle)}</text>
  <rect x="28" y="118" width="334" height="4" rx="2" fill="${accent}"/>
  ${body}
  </svg>`;
}

function button(y, label, color = blue) {
  return `<rect x="28" y="${y}" width="334" height="54" rx="8" fill="${color}"/>
  <text x="195" y="${y + 34}" text-anchor="middle" class="font" font-size="15" font-weight="850" fill="#fff">${esc(label)}</text>`;
}

function card(y, title, subtitle, color = blue, icon = 'A') {
  return `<rect x="28" y="${y}" width="334" height="86" rx="8" fill="${surface}" stroke="${line}"/>
  <circle cx="56" cy="${y + 32}" r="17" fill="${color}" opacity=".14"/>
  <text x="56" y="${y + 38}" text-anchor="middle" class="font label" fill="${color}">${esc(icon)}</text>
  <text x="84" y="${y + 30}" class="font h ink">${esc(title)}</text>
  <text x="84" y="${y + 54}" class="font body muted">${esc(subtitle)}</text>`;
}

function rtlCard(y, title, subtitle, color = blue, icon = 'A') {
  return `<rect x="28" y="${y}" width="334" height="86" rx="8" fill="${surface}" stroke="${line}"/>
  <circle cx="334" cy="${y + 32}" r="17" fill="${color}" opacity=".14"/>
  <text x="334" y="${y + 38}" text-anchor="middle" class="font label" fill="${color}">${esc(icon)}</text>
  <text x="306" y="${y + 30}" text-anchor="end" class="font h ink">${esc(title)}</text>
  <text x="306" y="${y + 54}" text-anchor="end" class="font body muted">${esc(subtitle)}</text>`;
}

function chip(x, y, text, color) {
  return `<rect x="${x}" y="${y}" width="${text.length * 7 + 28}" height="30" rx="15" fill="${color}" opacity=".12"/>
  <text x="${x + 14}" y="${y + 20}" class="font label" fill="${color}">${esc(text)}</text>`;
}

function skeleton(y, h = 86) {
  return `<rect x="28" y="${y}" width="334" height="${h}" rx="8" fill="${surface}" stroke="${line}"/>
  <rect x="52" y="${y + 24}" width="176" height="12" rx="6" fill="#e2e8f0"/>
  <rect x="52" y="${y + 50}" width="252" height="10" rx="5" fill="#edf2f7"/>
  <circle cx="322" cy="${y + 38}" r="16" fill="#edf2f7"/>`;
}

const stateScreens = [
  {
    name: '42-empty-courses.png',
    svg: frame(
      'No courses yet',
      'Empty catalog state with a clear recovery action.',
      `<circle cx="195" cy="252" r="76" fill="#e8f7fb"/>
      <path d="M154 250h82M154 276h58M166 224h58" stroke="${cyan}" stroke-width="10" stroke-linecap="round"/>
      <text x="195" y="388" text-anchor="middle" class="font h ink">Nothing to show</text>
      <text x="195" y="418" text-anchor="middle" class="font body muted">Try another category or reset filters.</text>
      ${button(486, 'Clear filters', blue)}
      ${button(554, 'Browse featured courses', cyan)}`,
      cyan,
    ),
  },
  {
    name: '43-empty-notifications.png',
    svg: frame(
      'All caught up',
      'No unread notifications right now.',
      `<circle cx="195" cy="250" r="76" fill="#dcfce7"/>
      <path d="M171 254l16 16 36-46" stroke="${green}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="195" y="388" text-anchor="middle" class="font h ink">Inbox is clean</text>
      <text x="195" y="418" text-anchor="middle" class="font body muted">Bookings and updates will appear here.</text>
      ${card(520, 'Notification settings', 'Push and email alerts are enabled', green, 'N')}`,
      green,
    ),
  },
  {
    name: '44-loading-skeleton.png',
    svg: frame(
      'Loading courses',
      'Skeleton state while network content arrives.',
      `${skeleton(154)}${skeleton(258)}${skeleton(362)}${skeleton(466)}
      <rect x="84" y="630" width="222" height="8" rx="4" fill="#dbeafe"/>
      <rect x="84" y="630" width="138" height="8" rx="4" fill="${blue}"/>`,
    ),
  },
  {
    name: '45-offline-mode.png',
    svg: frame(
      'Offline mode',
      'Cached learning data is still available.',
      `<rect x="28" y="154" width="334" height="118" rx="8" fill="#fff7ed" stroke="#fed7aa"/>
      <text x="50" y="196" class="font h ink">You are offline</text>
      <text x="50" y="225" class="font body muted">Showing cached courses and notifications.</text>
      ${card(314, 'My Courses', 'Available from approved offline cache', green, 'C')}
      ${card(414, 'Notifications', 'Last refreshed 12 minutes ago', amber, 'N')}
      ${button(556, 'Retry connection', amber)}`,
      amber,
    ),
  },
  {
    name: '46-error-state.png',
    svg: frame(
      'Something failed',
      'API error state with retry and support fallback.',
      `<circle cx="195" cy="236" r="72" fill="#fee2e2"/>
      <text x="195" y="263" text-anchor="middle" class="font" font-size="70" font-weight="900" fill="${red}">!</text>
      <text x="195" y="368" text-anchor="middle" class="font h ink">Could not load data</text>
      <text x="195" y="398" text-anchor="middle" class="font body muted">Check connection or try again in a moment.</text>
      ${button(476, 'Try again', red)}
      <text x="195" y="570" text-anchor="middle" class="font body muted">Contact support</text>`,
      red,
    ),
  },
  {
    name: '47-session-expired.png',
    svg: frame(
      'Session expired',
      'Secure re-authentication state.',
      `<rect x="105" y="170" width="180" height="180" rx="90" fill="#eef2ff"/>
      <path d="M165 246v-32c0-18 12-32 30-32s30 14 30 32v32" stroke="${indigo}" stroke-width="11" fill="none" stroke-linecap="round"/>
      <rect x="149" y="238" width="92" height="64" rx="12" fill="${indigo}"/>
      <text x="195" y="392" text-anchor="middle" class="font h ink">Sign in again</text>
      <text x="195" y="422" text-anchor="middle" class="font body muted">We locked the session to protect your account.</text>
      ${button(500, 'Go to login', indigo)}`,
      indigo,
    ),
  },
];

const rtlScreens = [
  {
    name: '48-rtl-home.png',
    svg: frame(
      'الرئيسية',
      'تابع التعلم والحجوزات من مكان واحد.',
      `${rtlCard(150, 'أكمل تعلمك', '٣ دروس متاحة اليوم', blue, 'د')}
      ${rtlCard(250, 'حجوزاتي', 'طلبان في انتظار التأكيد', cyan, 'ح')}
      ${rtlCard(350, 'الإشعارات', '٥ تحديثات جديدة', green, 'إ')}
      <rect x="28" y="480" width="334" height="126" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="334" y="520" text-anchor="end" class="font h ink">تقدم الأسبوع</text>
      <text x="334" y="550" text-anchor="end" class="font body muted">أنهيت ٦٨٪ من خطة التعلم.</text>
      <rect x="84" y="578" width="250" height="8" rx="4" fill="#dbeafe"/>
      <rect x="166" y="578" width="168" height="8" rx="4" fill="${blue}"/>`,
      blue,
      { rtl: true },
    ),
  },
  {
    name: '49-rtl-explore.png',
    svg: frame(
      'استكشف الكورسات',
      'ابحث وقارن واحجز أسرع.',
      `${chip(244, 150, 'ذكاء اصطناعي', blue)}${chip(146, 150, 'تصميم', cyan)}${chip(64, 150, 'أعمال', green)}
      ${rtlCard(210, 'أساسيات الذكاء الاصطناعي', 'مباشر - مبتدئ - ١٢٥٠ جنيه', blue, 'AI')}
      ${rtlCard(310, 'تحليل البيانات', '٣٢ درس - تقييم ٤.٨', cyan, 'D')}
      ${rtlCard(410, 'تصميم المنتجات', 'مشروع عملي وشهادة', green, 'UX')}`,
      cyan,
      { rtl: true },
    ),
  },
  {
    name: '50-rtl-organization.png',
    svg: frame(
      'إدارة الأكاديمية',
      'مؤشرات التشغيل والفريق والمحتوى.',
      `${rtlCard(150, 'الحجوزات', '٧ طلبات تحتاج قرار', amber, 'ح')}
      ${rtlCard(250, 'الكورسات', '٣ كورسات قيد المراجعة', blue, 'ك')}
      ${rtlCard(350, 'الحضور', 'جلسة مفتوحة الآن', green, 'ح')}
      ${rtlCard(450, 'الأعضاء', '١٨ عضو نشط', indigo, 'ع')}`,
      green,
      { rtl: true },
    ),
  },
  {
    name: '51-rtl-profile.png',
    svg: frame(
      'الملف الشخصي',
      'الأجهزة، التنبيهات، والخصوصية.',
      `${rtlCard(150, 'سارة حسن', 'طالبة - القاهرة', blue, 'س')}
      ${rtlCard(250, 'التنبيهات', 'البريد والإشعارات مفعلة', cyan, 'ت')}
      ${rtlCard(350, 'الجاهزية بدون إنترنت', '١٢ مجموعة بيانات محفوظة', green, 'ج')}
      ${rtlCard(450, 'جلسات نشطة', 'جهازان متصلان', indigo, 'ج')}`,
      indigo,
      { rtl: true },
    ),
  },
];

async function renderSet(screens, dir, contactName, thumbWidth, thumbHeight, cols) {
  const files = [];

  for (const screen of screens) {
    const output = path.join(dir, screen.name);
    await sharp(Buffer.from(screen.svg)).png().toFile(output);
    files.push(output);
  }

  const thumbs = await Promise.all(
    files.map((file) => sharp(file).resize(thumbWidth, thumbHeight).png().toBuffer()),
  );
  const rows = Math.ceil(files.length / cols);
  const contactWidth = 16 + cols * (thumbWidth + 12) + 4;
  const contactHeight = 28 + rows * (thumbHeight + 22);

  await sharp({
    create: {
      width: contactWidth,
      height: contactHeight,
      channels: 4,
      background: '#f8fafc',
    },
  })
    .composite(
      thumbs.map((input, index) => ({
        input,
        left: 16 + (index % cols) * (thumbWidth + 12),
        top: 28 + Math.floor(index / cols) * (thumbHeight + 22),
      })),
    )
    .png()
    .toFile(path.join(dir, contactName));
}

async function renderStoreSet() {
  const sourceFiles = [
    path.join(screenshotsDir, 'after-html-reference', '01-auth-after.png'),
    path.join(screenshotsDir, 'after-html-reference', '02-home-after.png'),
    path.join(screenshotsDir, 'after-html-reference', '03-explore-courses-after.png'),
    path.join(screenshotsDir, 'after-learning-redesign', '05-course-details.png'),
    path.join(screenshotsDir, 'after-learning-redesign', '07-course-workspace.png'),
    path.join(screenshotsDir, 'after-organization-redesign', '12-organization-overview.png'),
    path.join(screenshotsDir, 'after-platform-admin-redesign', '27-platform-overview.png'),
    path.join(screenshotsDir, 'after-core-flow-redesign', '41-profile.png'),
  ];
  const titles = [
    'Secure access',
    'Personal learning hub',
    'Explore live courses',
    'Book with confidence',
    'Learn in one workspace',
    'Run your academy',
    'Platform moderation',
    'Privacy and devices',
  ];
  const outputs = [];

  for (let index = 0; index < sourceFiles.length; index += 1) {
    const source = sourceFiles[index];
    const output = path.join(storeDir, `${String(index + 1).padStart(2, '0')}-store-${titles[index].toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
    const phone = await sharp(source).resize(360, 779).png().toBuffer();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
      <style>.font{font-family:Inter,Arial,sans-serif}</style>
      <rect width="1080" height="1920" fill="#f8fafc"/>
      <rect x="0" y="0" width="1080" height="600" fill="${blue}"/>
      <circle cx="876" cy="220" r="180" fill="#19b7d5" opacity=".22"/>
      <circle cx="140" cy="516" r="140" fill="#ffffff" opacity=".10"/>
      <text x="90" y="210" class="font" font-size="76" font-weight="900" fill="#fff">${esc(titles[index])}</text>
      <text x="92" y="292" class="font" font-size="34" fill="#dbeafe">AIN mobile app preview</text>
      <rect x="336" y="520" width="408" height="884" rx="48" fill="#111827"/>
      <rect x="360" y="544" width="360" height="779" rx="34" fill="#fff"/>
    </svg>`;
    await sharp(Buffer.from(svg))
      .composite([{ input: phone, left: 360, top: 544 }])
      .png()
      .toFile(output);
    outputs.push(output);
  }

  const thumbs = await Promise.all(
    outputs.map((file) => sharp(file).resize(162, 288).png().toBuffer()),
  );
  await sharp({
    create: {
      width: 724,
      height: 636,
      channels: 4,
      background: '#f8fafc',
    },
  })
    .composite(
      thumbs.map((input, index) => ({
        input,
        left: 20 + (index % 4) * 176,
        top: 24 + Math.floor(index / 4) * 304,
      })),
    )
    .png()
    .toFile(path.join(storeDir, '00-contact-sheet.png'));
}

async function render() {
  await renderSet(stateScreens, statesDir, '00-contact-sheet.png', 156, 338, 3);
  await renderSet(rtlScreens, rtlDir, '00-contact-sheet.png', 170, 368, 4);
  await renderStoreSet();
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
