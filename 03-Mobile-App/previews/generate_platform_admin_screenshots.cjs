const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outDir = path.join(
  root,
  'previews',
  'screenshots',
  'after-platform-admin-redesign',
);

const width = 390;
const height = 844;
const bg = '#f7fafc';
const ink = '#0f172a';
const muted = '#64748b';
const line = '#dbe4ee';
const blue = '#0f5bb5';
const cyan = '#19b7d5';
const green = '#16a34a';
const amber = '#f59e0b';
const red = '#ef4444';

fs.mkdirSync(outDir, { recursive: true });

function esc(value) {
  return String(value).replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char],
  );
}

function metric(x, y, boxWidth, label, value, color) {
  return `<rect x="${x}" y="${y}" width="${boxWidth}" height="92" rx="8" fill="#fff" stroke="${line}"/>
  <circle cx="${x + 24}" cy="${y + 25}" r="10" fill="${color}" opacity=".16"/>
  <text x="${x + 20}" y="${y + 61}" class="font" font-size="27" font-weight="900" fill="${ink}">${esc(value)}</text>
  <text x="${x + 20}" y="${y + 79}" class="font small muted">${esc(label)}</text>`;
}

function row(y, title, subtitle, tag, color, action = 'Review') {
  return `<rect x="28" y="${y}" width="334" height="86" rx="8" fill="#fff" stroke="${line}"/>
  <circle cx="55" cy="${y + 31}" r="17" fill="${color}" opacity=".14"/>
  <text x="55" y="${y + 37}" text-anchor="middle" class="font label" fill="${color}">${esc(tag[0])}</text>
  <text x="82" y="${y + 28}" class="font h ink">${esc(title)}</text>
  <text x="82" y="${y + 51}" class="font body muted">${esc(subtitle)}</text>
  <rect x="286" y="${y + 24}" width="52" height="28" rx="14" fill="${color}" opacity=".12"/>
  <text x="312" y="${y + 43}" text-anchor="middle" class="font label" fill="${color}">${esc(action)}</text>`;
}

function chip(x, y, text, color) {
  return `<rect x="${x}" y="${y}" width="${text.length * 7 + 28}" height="30" rx="15" fill="${color}" opacity=".12"/>
  <text x="${x + 14}" y="${y + 20}" class="font label" fill="${color}">${esc(text)}</text>`;
}

function shell(title, subtitle, body, accent = blue) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .font{font-family:Inter,Arial,sans-serif}.ink{fill:${ink}}.muted{fill:${muted}}
    .small{font-size:12px}.body{font-size:13px}.title{font-size:25px;font-weight:800}.h{font-size:17px;font-weight:800}.label{font-size:11px;font-weight:800}
  </style>
  <rect width="${width}" height="${height}" rx="34" fill="#111827"/>
  <rect x="10" y="10" width="370" height="824" rx="28" fill="${bg}"/>
  <rect x="158" y="24" width="74" height="7" rx="4" fill="#111827" opacity=".85"/>
  <circle cx="332" cy="66" r="22" fill="#e8f7fb"/>
  <text x="332" y="73" text-anchor="middle" class="font" font-size="18" font-weight="900" fill="${cyan}">A</text>
  <text x="28" y="72" class="font title ink">${esc(title)}</text>
  <text x="28" y="101" class="font body muted">${esc(subtitle)}</text>
  <rect x="28" y="118" width="334" height="4" rx="2" fill="${accent}" opacity=".95"/>
  ${body}
  <rect x="36" y="786" width="318" height="42" rx="21" fill="#ffffff" stroke="${line}"/>
  <circle cx="82" cy="807" r="13" fill="#eaf4ff"/><rect x="77" y="802" width="10" height="10" rx="3" fill="${blue}"/>
  <circle cx="159" cy="807" r="13" fill="#eefcf8"/><path d="M153 808l4 4 8-10" stroke="${green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="236" cy="807" r="13" fill="#fff7e8"/><path d="M236 798v18M227 807h18" stroke="${amber}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="313" cy="807" r="13" fill="#eef2ff"/><circle cx="313" cy="807" r="5" fill="#6366f1"/>
  </svg>`;
}

const screens = [
  {
    name: '27-platform-overview.png',
    svg: shell(
      'Platform control',
      'Admin health, approvals, and revenue signals.',
      `${metric(28, 146, 100, 'Academies', '128', blue)}
      ${metric(145, 146, 100, 'Courses', '420', cyan)}
      ${metric(262, 146, 100, 'Pending', '24', amber)}
      <text x="28" y="286" class="font h ink">Review queue</text>
      ${row(310, 'Academy verification', '8 owners waiting for checks', 'A', blue)}
      ${row(410, 'Course approvals', '12 courses need moderation', 'C', cyan)}
      ${row(510, 'Promotion approvals', '4 campaigns need a decision', 'P', amber)}
      <rect x="28" y="632" width="334" height="116" rx="8" fill="#fff" stroke="${line}"/>
      <text x="50" y="669" class="font h ink">Revenue snapshot</text>
      <text x="50" y="694" class="font body muted">Subscriptions are up 18% this month.</text>
      <rect x="50" y="718" width="250" height="10" rx="5" fill="#dbeafe"/>
      <rect x="50" y="718" width="196" height="10" rx="5" fill="${blue}"/>`,
    ),
  },
  {
    name: '28-platform-academy-approvals.png',
    svg: shell(
      'Academy approvals',
      'Verify owners before they start selling.',
      `${chip(28, 146, 'Pending 8', amber)}${chip(126, 146, 'Verified 96', green)}${chip(240, 146, 'Rejected 3', red)}
      ${row(196, 'North Star Academy', 'Commercial register uploaded', 'N', blue, 'Verify')}
      ${row(296, 'Future Skills Hub', 'Missing owner identity note', 'F', amber, 'Open')}
      ${row(396, 'Blue Orbit Labs', 'Tax card and address ready', 'B', cyan, 'Verify')}
      <rect x="28" y="530" width="334" height="152" rx="8" fill="#fff" stroke="${line}"/>
      <text x="50" y="569" class="font h ink">Decision checklist</text>
      <text x="50" y="601" class="font body muted">Identity, documents, category, payment profile.</text>
      <path d="M52 628l5 5 11-14M52 660l5 5 11-14" stroke="${green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="82" y="633" class="font body ink">Documents readable</text>
      <text x="82" y="665" class="font body ink">Owner data matches account</text>`,
    ),
  },
  {
    name: '29-platform-course-approvals.png',
    svg: shell(
      'Course approvals',
      'Review quality, pricing, and publish readiness.',
      `${chip(28, 146, 'Pending 12', amber)}${chip(138, 146, 'Needs edits 5', red)}${chip(270, 146, 'Live 302', green)}
      ${row(196, 'AI Foundations', '16 lessons - Beginner - EGP 1,250', 'A', blue, 'Approve')}
      ${row(296, 'Data Analysis Bootcamp', '32 lessons - Intermediate', 'D', cyan, 'Open')}
      ${row(396, 'UX Writing Sprint', '8 lessons - Draft pricing', 'U', amber, 'Edit')}
      <rect x="28" y="530" width="334" height="136" rx="8" fill="#fff" stroke="${line}"/>
      <text x="50" y="569" class="font h ink">Quality score</text>
      <text x="50" y="596" class="font body muted">Content, instructor profile, outcomes, media.</text>
      <rect x="50" y="625" width="250" height="10" rx="5" fill="#e2e8f0"/>
      <rect x="50" y="625" width="214" height="10" rx="5" fill="${green}"/>`,
    ),
  },
  {
    name: '30-platform-promotion-approvals.png',
    svg: shell(
      'Promotion approvals',
      'Moderate featured campaigns and placements.',
      `${metric(28, 146, 157, 'Active promos', '18', green)}
      ${metric(205, 146, 157, 'Waiting review', '4', amber)}
      ${row(270, 'Summer AI Bundle', 'Homepage feature - 7 days', 'S', amber, 'Approve')}
      ${row(370, 'Python Career Track', 'Explore banner - EGP 800 budget', 'P', blue, 'Open')}
      ${row(470, 'Weekend Design Lab', 'Category placement - ends Friday', 'W', cyan, 'Approve')}
      <rect x="28" y="604" width="334" height="110" rx="8" fill="#fff" stroke="${line}"/>
      <text x="50" y="641" class="font h ink">Placement guardrails</text>
      <text x="50" y="670" class="font body muted">No duplicate hero slots, verified academy only.</text>`,
    ),
  },
  {
    name: '31-platform-categories.png',
    svg: shell(
      'Categories',
      'Keep catalog taxonomy clean and discoverable.',
      `${metric(28, 146, 157, 'Categories', '36', blue)}
      ${metric(205, 146, 157, 'With courses', '28', cyan)}
      <rect x="28" y="270" width="334" height="52" rx="8" fill="#fff" stroke="${line}"/>
      <text x="52" y="303" class="font body muted">Search categories</text>
      <circle cx="324" cy="296" r="12" fill="#e8f7fb"/>
      <path d="M319 296h10M324 291v10" stroke="${cyan}" stroke-width="2"/>
      ${row(350, 'Artificial Intelligence', '128 courses - featured in home', 'A', blue, 'Edit')}
      ${row(450, 'Design & Product', '64 courses - 8 subcategories', 'D', cyan, 'Edit')}
      ${row(550, 'Business Skills', '92 courses - high conversion', 'B', green, 'Edit')}`,
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
    files.map((file) => sharp(file).resize(185, 401).png().toBuffer()),
  );

  await sharp({
    create: {
      width: 1005,
      height: 472,
      channels: 4,
      background: '#f8fafc',
    },
  })
    .composite(
      thumbs.map((input, index) => ({
        input,
        left: 16 + index * 197,
        top: 54,
      })),
    )
    .png()
    .toFile(path.join(outDir, '00-contact-sheet.png'));
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
