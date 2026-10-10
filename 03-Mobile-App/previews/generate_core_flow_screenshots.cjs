const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'previews', 'screenshots', 'after-core-flow-redesign');

const width = 390;
const height = 844;
const ink = '#0f172a';
const muted = '#64748b';
const line = '#dbe4ee';
const surface = '#ffffff';
const page = '#f7fafc';
const blue = '#0f5bb5';
const cyan = '#19b7d5';
const green = '#16a34a';
const amber = '#f59e0b';
const red = '#ef4444';
const indigo = '#6366f1';

fs.mkdirSync(outDir, { recursive: true });

function esc(value) {
  return String(value).replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char],
  );
}

function frame(title, subtitle, body, accent = blue) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .font{font-family:Inter,Arial,sans-serif}.ink{fill:${ink}}.muted{fill:${muted}}
    .title{font-size:25px;font-weight:850}.h{font-size:17px;font-weight:800}.body{font-size:13px}.small{font-size:11px}.label{font-size:11px;font-weight:800}
  </style>
  <rect width="${width}" height="${height}" rx="34" fill="#111827"/>
  <rect x="10" y="10" width="370" height="824" rx="28" fill="${page}"/>
  <rect x="158" y="24" width="74" height="7" rx="4" fill="#111827" opacity=".85"/>
  <circle cx="332" cy="66" r="22" fill="#e8f7fb"/>
  <text x="332" y="73" text-anchor="middle" class="font" font-size="18" font-weight="900" fill="${cyan}">A</text>
  <text x="28" y="72" class="font title ink">${esc(title)}</text>
  <text x="28" y="101" class="font body muted">${esc(subtitle)}</text>
  <rect x="28" y="118" width="334" height="4" rx="2" fill="${accent}"/>
  ${body}
  </svg>`;
}

function input(y, label, value = '') {
  return `<text x="28" y="${y}" class="font label ink">${esc(label)}</text>
  <rect x="28" y="${y + 10}" width="334" height="54" rx="8" fill="${surface}" stroke="${line}"/>
  <text x="48" y="${y + 44}" class="font body muted">${esc(value)}</text>`;
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

function chip(x, y, text, color) {
  return `<rect x="${x}" y="${y}" width="${text.length * 7 + 28}" height="30" rx="15" fill="${color}" opacity=".12"/>
  <text x="${x + 14}" y="${y + 20}" class="font label" fill="${color}">${esc(text)}</text>`;
}

const screens = [
  {
    name: '32-splash.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>.font{font-family:Inter,Arial,sans-serif}</style>
      <rect width="${width}" height="${height}" rx="34" fill="#111827"/>
      <rect x="10" y="10" width="370" height="824" rx="28" fill="${blue}"/>
      <rect x="158" y="24" width="74" height="7" rx="4" fill="#f8fafc" opacity=".75"/>
      <circle cx="195" cy="350" r="92" fill="#ffffff" opacity=".12"/>
      <circle cx="195" cy="350" r="68" fill="#ffffff" opacity=".98"/>
      <text x="195" y="378" text-anchor="middle" class="font" font-size="74" font-weight="950" fill="${blue}">A</text>
      <text x="195" y="485" text-anchor="middle" class="font" font-size="30" font-weight="900" fill="#fff">AIN</text>
      <text x="195" y="516" text-anchor="middle" class="font" font-size="13" fill="#dbeafe">All-in-one learning operations</text>
      <rect x="145" y="706" width="100" height="6" rx="3" fill="#dbeafe" opacity=".65"/>
      <rect x="145" y="706" width="68" height="6" rx="3" fill="#fff"/>
    </svg>`,
  },
  {
    name: '33-register.png',
    svg: frame(
      'Create account',
      'Start learning or manage an academy workspace.',
      `${chip(28, 146, 'Student', blue)}${chip(126, 146, 'Owner', cyan)}
      ${input(202, 'Full name', 'Sarah Hassan')}
      ${input(292, 'Email address', 'sarah@example.com')}
      ${input(382, 'Password', '••••••••••')}
      ${button(490, 'Create account')}
      <text x="195" y="575" text-anchor="middle" class="font body muted">Already have an account? Sign in</text>
      ${card(634, 'Workspace ready', 'Choose your role after verification', green, 'W')}`,
    ),
  },
  {
    name: '34-verify-email.png',
    svg: frame(
      'Verify email',
      'Enter the code sent to your inbox.',
      `<rect x="28" y="158" width="334" height="146" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="201" class="font h ink">Check your email</text>
      <text x="50" y="228" class="font body muted">We sent a 6-digit code to sarah@example.com.</text>
      <text x="50" y="272" class="font" font-size="28" font-weight="900" fill="${ink}">4  8  2  9  1  6</text>
      ${button(340, 'Verify account', green)}
      <rect x="28" y="426" width="334" height="70" rx="8" fill="#fff7ed" stroke="#fed7aa"/>
      <text x="50" y="467" class="font body" fill="#9a3412">Resend available in 24 seconds</text>`,
      green,
    ),
  },
  {
    name: '35-forgot-password.png',
    svg: frame(
      'Reset access',
      'Recover your account with a secure reset link.',
      `${input(172, 'Email address', 'sarah@example.com')}
      ${button(282, 'Send reset link')}
      ${card(382, 'Security note', 'Links expire quickly and work once only', amber, '!')}
      ${card(496, 'Need help?', 'Contact workspace support if email changed', cyan, '?')}`,
      amber,
    ),
  },
  {
    name: '36-reset-password.png',
    svg: frame(
      'New password',
      'Set a stronger password for your account.',
      `${input(172, 'New password', '••••••••••••')}
      ${input(262, 'Confirm password', '••••••••••••')}
      <rect x="28" y="370" width="334" height="76" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="405" class="font h ink">Strength: strong</text>
      <rect x="50" y="426" width="250" height="8" rx="4" fill="#dcfce7"/>
      <rect x="50" y="426" width="220" height="8" rx="4" fill="${green}"/>
      ${button(486, 'Update password', green)}`,
      green,
    ),
  },
  {
    name: '37-invitation.png',
    svg: frame(
      'Workspace invite',
      'Review the invitation before joining.',
      `${card(158, 'AIO Academy', 'Invited as Instructor', blue, 'A')}
      <rect x="28" y="270" width="334" height="146" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="309" class="font h ink">Permissions</text>
      <text x="50" y="340" class="font body muted">Manage lessons, attendance, rooms, and assigned content.</text>
      ${chip(50, 368, 'Courses', blue)}${chip(140, 368, 'Rooms', cyan)}${chip(218, 368, 'Attendance', green)}
      ${button(458, 'Accept invitation', blue)}
      <text x="195" y="548" text-anchor="middle" class="font body muted">Wrong account? Switch user</text>`,
    ),
  },
  {
    name: '38-workspace-selection.png',
    svg: frame(
      'Choose workspace',
      'Switch between learning and academy operations.',
      `${card(154, 'Personal learning', 'Student dashboard and courses', blue, 'S')}
      ${card(254, 'AIO Academy', 'Owner workspace - Growth plan active', cyan, 'O')}
      ${card(354, 'Future Skills Hub', 'Instructor access - 4 assigned batches', green, 'I')}
      <rect x="28" y="480" width="334" height="126" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="519" class="font h ink">Plan status</text>
      <text x="50" y="548" class="font body muted">All enabled modules are available on mobile.</text>
      <rect x="50" y="574" width="250" height="8" rx="4" fill="#dbeafe"/>
      <rect x="50" y="574" width="206" height="8" rx="4" fill="${blue}"/>`,
    ),
  },
  {
    name: '39-access-denied.png',
    svg: frame(
      'Access limited',
      'This role or subscription cannot open this screen.',
      `<rect x="103" y="168" width="184" height="184" rx="92" fill="#fee2e2"/>
      <text x="195" y="286" text-anchor="middle" class="font" font-size="76" font-weight="900" fill="${red}">!</text>
      <text x="195" y="406" text-anchor="middle" class="font h ink">Permission required</text>
      <text x="195" y="436" text-anchor="middle" class="font body muted">Ask the workspace owner to update your role.</text>
      ${button(500, 'Back to home', blue)}
      <rect x="28" y="610" width="334" height="88" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="650" class="font h ink">Required module</text>
      <text x="50" y="678" class="font body muted">Organization attendance management</text>`,
      red,
    ),
  },
  {
    name: '40-booking-success.png',
    svg: frame(
      'Booking sent',
      'Your lesson request is waiting for confirmation.',
      `<circle cx="195" cy="224" r="64" fill="#dcfce7"/>
      <path d="M166 226l18 18 42-50" stroke="${green}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="28" y="328" width="334" height="150" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="368" class="font h ink">AI Foundations</text>
      <text x="50" y="397" class="font body muted">Sunday, 10:00 AM - Live room request</text>
      <text x="50" y="432" class="font body muted">You will get a notification after approval.</text>
      ${button(520, 'View my bookings', green)}
      <text x="195" y="610" text-anchor="middle" class="font body muted">Explore more courses</text>`,
      green,
    ),
  },
  {
    name: '41-profile.png',
    svg: frame(
      'Profile',
      'Preferences, devices, offline readiness, and sessions.',
      `${card(150, 'Sarah Hassan', 'Student - Cairo, Egypt', blue, 'S')}
      ${card(250, 'Notifications', 'Email, push, and booking updates enabled', cyan, 'N')}
      ${card(350, 'Offline readiness', '12 datasets cached with tenant-safe keys', green, 'O')}
      ${card(450, 'Active sessions', '2 devices - last seen just now', indigo, 'D')}
      <rect x="28" y="570" width="334" height="106" rx="8" fill="${surface}" stroke="${line}"/>
      <text x="50" y="610" class="font h ink">Privacy controls</text>
      <text x="50" y="638" class="font body muted">Protected content stays memory-only.</text>
      ${chip(50, 660, 'Secure viewer', green)}${chip(176, 660, 'No downloads', red)}`,
      indigo,
    ),
  },
];

async function render() {
  const files = [];

  for (const screen of screens) {
    const output = path.join(outDir, screen.name);
    await sharp(Buffer.from(screen.svg)).png().toFile(output);
    files.push(output);
  }

  const thumbs = await Promise.all(
    files.map((file) => sharp(file).resize(156, 338).png().toBuffer()),
  );

  await sharp({
    create: {
      width: 840,
      height: 756,
      channels: 4,
      background: '#f8fafc',
    },
  })
    .composite(
      thumbs.map((input, index) => ({
        input,
        left: 16 + (index % 5) * 164,
        top: 28 + Math.floor(index / 5) * 360,
      })),
    )
    .png()
    .toFile(path.join(outDir, '00-contact-sheet.png'));
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
