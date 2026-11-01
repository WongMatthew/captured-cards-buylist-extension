
(() => {
'use strict';
const INK = '#17183B';
const LOGO = 'assets/captured-cards-logo.svg';
const LOGO_LIGHT = 'assets/captured-cards-logo-on-light.svg';
const PAL = ['#2B44D6', '#E4572E', '#FFD447', '#17183B', '#7BC8A4'];
const PAL_LABEL = ['#FFFFFF', '#FFFFFF', INK, '#FFFFFF', INK];
const GROUNDS = [['#2B44D6', 'Store blue'], ['#005BD0', 'Logo blue'], ['#17183B', 'Navy'], ['#FFFFFF', 'White'], ['#F9F6DE', 'Cream']];
const ACCENTS = [['#FFD447', 'Yellow'], ['#FFFFFF', 'White'], ['#7BC8A4', 'Green']];
const CONDS = ['NM', 'LP', 'MP', 'HP', 'DMG'];
const GRADERS = ['PSA', 'BGS', 'CGC', 'TAG', 'ACE', 'SGC'];
const RARITIES = ['SIR', 'SAR', 'IR', 'AR', 'UR', 'HR', 'SR', 'CHR', 'Alt art', 'Full art', 'Promo', 'Holo'];

const TEMPLATES = [
  { key: 'post-cover', series: 'post', group: 'Instagram / Facebook post', label: 'Cover', desc: 'Headline + up to 6 cards', w: 1080, h: 1350, per: 6, single: true },
  { key: 'post-spot', series: 'post', group: 'Instagram / Facebook post', label: 'Spotlight', desc: '1 card per image', w: 1080, h: 1350, per: 1 },
  { key: 'post-duo', series: 'post', group: 'Instagram / Facebook post', label: 'Duo', desc: '2 cards per image', w: 1080, h: 1350, per: 2 },
  { key: 'post-grid', series: 'post', group: 'Instagram / Facebook post', label: 'Grid', desc: '9 cards per image', w: 1080, h: 1350, per: 9 },
  { key: 'story-cover', series: 'story', group: 'Instagram story', label: 'Cover', desc: 'Headline + up to 6 cards', w: 1080, h: 1920, per: 6, single: true },
  { key: 'story-spot', series: 'story', group: 'Instagram story', label: 'Spotlight', desc: '1 card per image', w: 1080, h: 1920, per: 1 },
  { key: 'story-trio', series: 'story', group: 'Instagram story', label: 'Trio', desc: '3 cards per image', w: 1080, h: 1920, per: 3 },
  { key: 'story-grid', series: 'story', group: 'Instagram story', label: 'Grid', desc: '12 cards per image', w: 1080, h: 1920, per: 12 },
  { key: 'web', series: 'web', group: 'Website', label: 'Banner', desc: '1920×600, up to 5 cards', w: 1920, h: 600, per: 5, single: true },
  { key: 'web-xl', series: 'web', group: 'Website', label: 'Banner XL', desc: '1920×1080, up to 20 cards', w: 1920, h: 1080, per: 20, single: true }
];

const today = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
const uid = () => Math.random().toString(36).slice(2, 10);
const SAMPLE = [
  ['Umbreon ex', '161/131', 'PRE', 'SIR'], ['Charizard ex', '199/165', 'MEW', 'SIR'], ['Pikachu ex', '238/191', 'SSP', 'SIR'],
  ['Giratina V', '186/196', 'LOR', 'Alt art', 'graded'], ['Blastoise ex', '200/165', 'MEW', 'SIR'], ['Erika\u2019s Invitation', '203/165', 'MEW', 'SIR']
].map(([name, number, set, rarity, t]) => ({ id: uid(), name, number, set, rarity, type: t || 'raw', cond: 'NM', grader: 'PSA', grade: '10', price: '', img: '', assetId: '' }));

let state = {
  cards: SAMPLE,
  settings: { date: today, social: 'link in bio', cash: '70', trade: '80', phone: '778-881-0076', loc: 'Burnaby, BC', ground: '#2B44D6', accent: '#FFD447' },
  selected: ['post-cover', 'post-duo', 'post-grid', 'story-cover', 'story-trio', 'web'],
  posting: null,
  history: []
};
let lastDeleted = null;
let pages = [];
let dlgIndex = 0;

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (p) => {
  const n = Number(String(p).replace(/[^0-9.]/g, ''));
  if (p === '' || p == null || !isFinite(n)) return '$\u2014';
  return '$' + n.toLocaleString('en-CA', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
};
const gradeLabel = (c) => `${c.grader} ${c.grade}`.trim();
const lead = (c) => c.type === 'graded' ? gradeLabel(c) : (c.cond || 'NM');
const meta = (c, withRarity = true) => {
  const parts = [`<b>${esc(lead(c))}</b>`];
  if (c.number) parts.push(esc(c.number));
  if (c.set) parts.push(esc(c.set));
  if (withRarity && c.rarity && c.type !== 'graded') parts.push(esc(c.rarity));
  return parts.join(' · ');
};
const S = () => state.settings;
const LIGHT_GROUNDS = ['#FFFFFF', '#F9F6DE'];
const isLight = () => LIGHT_GROUNDS.includes(S().ground);
const FG = () => isLight() ? INK : '#FFFFFF';
const HL = () => isLight() ? '#005BD0' : S().accent;
const STK_SHADOW = () => isLight() ? '#F9C500' : '#FFFFFF';
const logoSrc = () => isLight() ? LOGO_LIGHT : LOGO;

const ratesShort = () => `Everything else from ${esc(S().cash)}% cash / ${esc(S().trade)}% trade`;

/* ---------- template building blocks (rendered at native pixel size) ---------- */
// Grade text size that fits the slab label: full size for "10", smaller for "Black Label 10".
const gradePx = (g, pw) => {
  const len = Math.max(1, String(g || '').length);
  return Math.max(9, Math.floor(Math.min(pw * 0.12, (pw * 0.56) / (len * 0.64))));
};
function art(c, i, w, h, o = {}) {
  const border = o.border ?? 3, radius = o.radius ?? 10, label = o.label ?? 13, extra = o.extra ?? '';
  const size = typeof w === 'number' ? `width: ${w}px; height: ${h}px;` : w;
  const slabPhoto = c.type === 'graded' && c.img && c.imgRatio && c.imgRatio < 0.67;
  if (c.img && (c.type !== 'graded' || slabPhoto)) {
    return `<div class="ci-${c.id}" style="${size} flex-shrink: 0; border: ${border}px solid ${INK}; border-radius: ${radius}px; box-sizing: border-box; background-color: #E4E8F4; background-repeat: no-repeat; background-position: center; background-size: ${slabPhoto ? 'contain' : 'cover'}; ${extra}"></div>`;
  }
  const col = PAL[i % 5];
  if (c.type === 'graded') {
    const pw = typeof w === 'number' ? w : 150;
    const pad = Math.max(6, Math.round(pw * 0.05));
    return `<div style="${size} flex-shrink: 0; border: ${border}px solid ${INK}; border-radius: ${radius}px; box-sizing: border-box; background: #E4E8F4; display: flex; flex-direction: column; padding: ${pad}px; gap: ${pad}px; ${extra}"><div style="flex: 0 0 18%; background: #FFFFFF; border: 2px solid ${INK}; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; gap: ${pad}px; padding: 0 ${pad}px; color: ${INK}; white-space: nowrap; overflow: hidden"><span style="font-size: ${Math.max(9, Math.round(pw * 0.07))}px; font-weight: 700; flex-shrink: 0">${esc(c.grader)}</span><span style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${gradePx(c.grade, pw)}px; line-height: 1; overflow: hidden; text-overflow: ellipsis">${esc(c.grade)}</span></div>${c.img ? `<div class="ci-${c.id}" style="flex: 1; border: 2px solid ${INK}; border-radius: 4px; background-color: #F4F6FB; background-repeat: no-repeat; background-position: center; background-size: contain"></div>` : `<div style="flex: 1; border: 2px solid ${INK}; border-radius: 4px; background: ${col}; display: flex; align-items: flex-end; justify-content: center; padding: 6px"><span style="background: #FFFFFF; color: ${INK}; border-radius: 999px; padding: 2px 10px; font-size: ${label}px; font-weight: 700">Slab image</span></div>`}</div>`;
  }
  return `<div style="${size} flex-shrink: 0; border: ${border}px solid ${INK}; border-radius: ${radius}px; box-sizing: border-box; background: ${col}; display: flex; align-items: flex-end; justify-content: center; padding: 10px; ${extra}"><span style="background: #FFFFFF; color: ${INK}; border-radius: 999px; padding: 2px 10px; font-size: ${label}px; font-weight: 700">Card image</span></div>`;
}
function bar(c, size, top, pad = '10px 14px', topLabel = 'Top buy') {
  const a = S().accent;
  const bg = top ? INK : a, col = top ? a : INK;
  const left = top ? `<span style="font-size: ${Math.round(size * 0.36)}px; font-weight: 700; white-space: nowrap">${topLabel}</span>` : `<span style="font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: ${Math.round(size * 0.42)}px; line-height: 1">買取</span>`;
  return `<div style="margin-top: auto; background: ${bg}; color: ${col}; border-top: 4px solid ${INK}; padding: ${pad}; display: flex; justify-content: space-between; align-items: center; gap: 8px">${left}<span style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${size}px; line-height: 1">${money(c.price)}</span></div>`;
}
function tile(c, idx, o) {
  const top = o.top && idx === 0;
  return `<div style="background: #FFFFFF; color: ${INK}; border: 4px solid ${INK}; border-radius: 18px; border-right-width: 10px; border-bottom-width: 10px; overflow: hidden; display: flex; flex-direction: column">
    <div style="padding: ${o.pad}px ${o.pad}px ${o.pad - 4}px; display: flex; flex-direction: column; align-items: center; gap: 8px">
      ${art(c, idx, o.w, o.h, { label: o.label })}
      <div style="align-self: stretch; text-align: center">
        <div style="font-size: ${o.name}px; font-weight: 700; line-height: 1.15; max-height: ${Math.round(o.name * 2.3)}px; overflow: hidden">${esc(c.name) || '&nbsp;'}</div>
        <div style="font-size: ${o.meta}px; color: #3A3B5C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${meta(c, o.rarity !== false)}</div>
      </div>
    </div>
    ${bar(c, o.price, top, o.barPad)}
  </div>`;
}
function topbar(counter, k = 1) {
  const a = S().accent, f = (n) => Math.round(n * k);
  return `<div style="display: flex; justify-content: space-between; align-items: center; gap: 20px">
    <img src="${logoSrc()}" alt="Captured! Cards" style="height: ${Math.round((f(30)) * 2.4)}px; width: auto; display: block">
    <span style="display: inline-flex; align-items: center; gap: 10px; background: ${a}; color: ${INK}; border: 4px solid ${INK}; border-radius: 999px; padding: 6px 18px 6px 8px; border-right-width: 8px; border-bottom-width: 8px; font-size: ${f(19)}px; font-weight: 700"><span style="background: ${INK}; color: ${a}; border-radius: 999px; padding: 4px 10px; font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: ${f(17)}px; line-height: 1">買取</span>We're buying</span>
    <span style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${f(24)}px; min-width: ${f(80)}px; text-align: right">${counter}</span>
  </div>`;
}
function footer(k, left, right) {
  return `<div style="margin-top: auto; padding-top: 20px; border-top: 3px solid ${FG()}; display: flex; justify-content: space-between; gap: 16px; font-size: ${Math.round(18 * k)}px; font-weight: 600"><span>${left}</span><span style="font-weight: 700; white-space: nowrap">${right}</span></div>`;
}
function root(w, h, pad, gap, inner) {
  return `<div style="width: ${w}px; height: ${h}px; box-sizing: border-box; padding: ${pad}; background: ${S().ground}; color: ${FG()}; text-align: left; font-family: 'Instrument Sans', system-ui, sans-serif; display: flex; flex-direction: column; gap: ${gap}px; overflow: hidden">${inner}</div>`;
}
const socialRight = () => `Sell us your cards → ${esc(S().social)}`;

/* ---------- templates ---------- */
function coverTpl(cards, story) {
  const a = S().accent, k = story ? 1 : 0;
  const t = story
    ? { pad: '200px 72px 210px', h1: 176, lh: 0.88, br: '<br>', stk: 64, sub: 27, art: [168, 235], name: 23, meta: 16, price: 44, cta: 27, logo: 36, pill: 19 }
    : { pad: '64px', h1: 124, lh: 0.92, br: ' ', stk: 50, sub: 22, art: [156, 218], name: 21, meta: 15, price: 40, cta: 24, logo: 36, pill: 19 };
  const tiles = cards.slice(0, 6).map((c, i) => tile(c, i, { w: t.art[0], h: t.art[1], pad: 16, name: t.name, meta: t.meta, price: t.price, top: true, label: 12 })).join('');
  return root(1080, story ? 1920 : 1350, t.pad, 0, `
  <div style="display: flex; justify-content: space-between; align-items: center">
    <img src="${logoSrc()}" alt="Captured! Cards" style="height: ${Math.round((t.logo) * 2.4)}px; width: auto; display: block">
    <span style="border: 3px solid ${FG()}; border-radius: 999px; padding: 8px 20px; font-size: ${t.pill}px; font-weight: 700">Buylist · ${esc(S().date)}</span>
  </div>
  <div style="display: flex; justify-content: space-between; align-items: ${story ? 'flex-end' : 'center'}; margin-top: ${story ? 40 : 30}px">
    <div style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${t.h1}px; line-height: ${t.lh}; letter-spacing: -0.04em">We're${t.br}<span style="color: ${HL()}">buying.</span></div>
    <div style="background: ${INK}; color: ${a}; border: 4px solid ${INK}; border-radius: 18px; font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: ${t.stk}px; line-height: 1; padding: 14px 16px; ${story ? 'margin-bottom: 20px;' : ''} transform: rotate(-8deg); box-shadow: 6px 6px 0 ${STK_SHADOW()}">買取</div>
  </div>
  <div style="margin-top: ${story ? 26 : 18}px; font-size: ${t.sub}px; font-weight: 500; line-height: 1.4">Cash or store credit, paid same day. Prices in CAD; graded cards priced by grade.</div>
  <div style="margin-top: ${story ? 32 : 34}px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px">${tiles}</div>
  <div style="margin-top: auto; padding-top: ${story ? 32 : 0}px; display: flex; justify-content: space-between; align-items: center; gap: 24px">
    <span style="display: inline-flex; align-items: center; min-height: ${story ? 72 : 64}px; padding: 0 28px; border-radius: 14px; background: ${a}; color: ${INK}; border: 4px solid ${INK}; border-right-width: 10px; border-bottom-width: 10px; font-size: ${t.cta}px; font-weight: 700">${socialRight()}</span>
    <span style="font-size: ${story ? 22 : 19}px; font-weight: 600; text-align: right; line-height: 1.35">Not on the list? We still buy<br><b>From ${esc(S().cash)}% cash · ${esc(S().trade)}% trade</b></span>
  </div>`);
}
function spotTpl(c, idx, counter, story) {
  const a = S().accent;
  const t = story
    ? { pad: '200px 72px 210px', k: 1.2, cw: 560, ch: 782, price: 132, name: 76, meta: 28, bw: 900, bh: 840 }
    : { pad: '64px', k: 1, cw: 440, ch: 614, price: 112, name: 64, meta: 24, bw: 760, bh: 660 };
  const metaLine = [`${esc(lead(c))}`, esc(c.number), esc(c.set), c.type === 'graded' ? '' : esc(c.rarity)].filter(Boolean).join(' · ');
  return root(1080, story ? 1920 : 1350, t.pad, 0, topbar(counter, t.k) + `
  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${Math.round(28 * t.k)}px">
    <div style="position: relative; width: ${t.bw}px; height: ${t.bh}px">
      ${art(c, idx, t.cw, t.ch, { border: 4, radius: Math.round(18 * t.k), label: Math.round(15 * t.k), extra: `position: absolute; left: 50%; top: 0; margin-left: -${t.cw / 2 + Math.round(45 * t.k)}px; transform: rotate(-3deg); border-right-width: 16px; border-bottom-width: 16px;` })}
      <div style="position: absolute; right: 0; bottom: 0; background: ${a}; color: ${INK}; border: 4px solid ${INK}; border-radius: 22px; border-right-width: 12px; border-bottom-width: 12px; transform: rotate(-5deg); padding: ${Math.round(14 * t.k)}px ${Math.round(24 * t.k)}px; display: flex; align-items: center; gap: ${Math.round(16 * t.k)}px">
        <span style="background: ${INK}; color: ${a}; border-radius: 12px; padding: 8px 10px; font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: ${Math.round(t.price * 0.32)}px; line-height: 1.05; text-align: center">買<br>取</span>
        <span style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${t.price}px; line-height: 0.9; letter-spacing: -0.03em">${money(c.price)}</span>
      </div>
    </div>
    <div style="text-align: center; max-width: 100%">
      <div style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: ${t.name}px; line-height: 1; letter-spacing: -0.02em">${esc(c.name)}</div>
      <div style="font-size: ${t.meta}px; font-weight: 600; margin-top: 10px">${metaLine}</div>
    </div>
  </div>` + footer(t.k, story ? `CAD · Others from ${esc(S().cash)}% cash / ${esc(S().trade)}% trade` : `Prices in CAD · ${ratesShort()}`, story ? `Sell → ${esc(S().social)}` : socialRight()));
}
function duoTpl(cards, start, counter) {
  const a = S().accent;
  const tiles = cards.map((c, i) => tile(c, start + i, { w: 360, h: 502, pad: 20, name: 30, meta: 18, price: 64, label: 15, barPad: '14px 20px' })).join('');
  return root(1080, 1350, '64px', 0, topbar(counter) + `
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px">
    <div style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 68px; line-height: 1; letter-spacing: -0.03em">Chase cards <span style="color: ${HL()}">we want.</span></div>
    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px">${tiles}</div>
  </div>` + footer(1, `Prices in CAD · ${ratesShort()}`, socialRight()));
}
function gridTpl(cards, start, counter, story) {
  const o = story ? { w: 140, h: 195, pad: 12, name: 20, meta: 14, price: 34, label: 11, barPad: '8px 12px' } : { w: 140, h: 195, pad: 12, name: 21, meta: 15, price: 36, label: 11, barPad: '8px 12px' };
  const tiles = cards.map((c, i) => tile(c, start + i, o)).join('');
  return root(1080, story ? 1920 : 1350, story ? '200px 72px 210px' : '64px', story ? 22 : 24, topbar(counter, story ? 1.2 : 1) + `
  <div style="flex: 1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: ${story ? 18 : 20}px; align-content: center">${tiles}</div>` +
    footer(story ? 1.2 : 1, story ? `CAD · Others from ${esc(S().cash)}% cash / ${esc(S().trade)}% trade` : `Prices in CAD · ${ratesShort()}`, story ? `Sell → ${esc(S().social)}` : socialRight()));
}
function trioTpl(cards, start, counter) {
  const a = S().accent;
  const rows = cards.map((c, i) => `<div style="background: #FFFFFF; color: ${INK}; border: 4px solid ${INK}; border-radius: 22px; border-right-width: 12px; border-bottom-width: 12px; padding: 20px; display: flex; gap: 28px">
      ${art(c, start + i, 230, 321, { label: 14, radius: 12 })}
      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px">
        <div style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 46px; line-height: 1.02; letter-spacing: -0.02em">${esc(c.name)}</div>
        <div style="font-size: 23px; font-weight: 600; color: #3A3B5C">${meta(c)}</div>
        <div style="margin-top: auto; background: ${a}; border: 4px solid ${INK}; border-radius: 16px; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center"><span style="font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: 32px; line-height: 1">買取</span><span style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 76px; line-height: 1; letter-spacing: -0.02em">${money(c.price)}</span></div>
      </div>
    </div>`).join('');
  return root(1080, 1920, '200px 72px 210px', 0, topbar(counter, 1.2) + `
  <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px">${rows}</div>` +
    footer(1.2, `CAD · Others from ${esc(S().cash)}% cash / ${esc(S().trade)}% trade`, `Sell → ${esc(S().social)}`));
}
function webTpl(cards) {
  const a = S().accent;
  const tiles = cards.slice(0, 5).map((c, i) => tile(c, i, { w: 128, h: 179, pad: 16, name: 19, meta: 13, price: 34, top: true, label: 11 })).join('');
  return root(1920, 600, '52px 64px', 0, `<div style="display: flex; gap: 48px; height: 100%">
  <div style="width: 560px; flex-shrink: 0; display: flex; flex-direction: column">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <img src="${logoSrc()}" alt="Captured! Cards" style="height: 72px; width: auto; display: block">
      <span style="border: 3px solid ${FG()}; border-radius: 999px; padding: 6px 16px; font-size: 16px; font-weight: 700">Buylist · ${esc(S().date)}</span>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 22px; margin-top: 26px">
      <div style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 118px; line-height: 0.88; letter-spacing: -0.045em">We're<br><span style="color: ${HL()}">buying.</span></div>
      <div style="background: ${INK}; color: ${a}; border: 4px solid ${INK}; border-radius: 16px; font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: 40px; line-height: 1; padding: 12px 14px; margin-bottom: 12px; transform: rotate(-8deg); box-shadow: 5px 5px 0 ${STK_SHADOW()}">買取</div>
    </div>
    <div style="margin-top: 16px; font-size: 18px; font-weight: 500; line-height: 1.4">Cash or store credit, same day · ${esc(S().loc)}<br>${ratesShort()}</div>
    <span style="margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; min-height: 56px; padding: 0 26px; border-radius: 14px; background: ${a}; color: ${INK}; border: 4px solid ${INK}; border-right-width: 10px; border-bottom-width: 10px; font-size: 20px; font-weight: 700">Sell us your cards → ${esc(S().phone)}</span>
  </div>
  <div style="flex: 1; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 20px; align-content: center">${tiles}</div>
  </div>`);
}
function webXlTpl(cards) {
  const a = S().accent;
  const list = cards.slice(0, 20), n = Math.max(1, list.length);
  // Pick the row count (1-3) that gives the largest card images, then size tiles to their content.
  const GRID_W = 1792, GRID_H = 780, GAP = 18, TILE_X = 38;
  const fit = (r, nonImg) => {
    const c = Math.ceil(n / r);
    const byW = (GRID_W - (c - 1) * GAP) / c - TILE_X;
    const byH = ((GRID_H - (r - 1) * GAP) / r - nonImg) * 63 / 88;
    return Math.min(byW, byH, 250);
  };
  let rows = 1, best = -1;
  for (let r = 1; r <= Math.min(3, n); r++) {
    if (Math.ceil(n / r) > 10) continue;
    const w = Math.max(fit(r, 144), 0);
    if (w > best + 1) { best = w; rows = r; }
  }
  const cols = Math.ceil(n / rows);
  const big = fit(rows, 175) >= 180;
  const imgW = Math.floor(Math.min(fit(rows, big ? 175 : 144), 250));
  const imgH = Math.round(imgW * 88 / 63);
  const tileW = imgW + TILE_X;
  const tiles = list.map((c, i) => {
    const top = i === 0;
    return `<div style="background: #FFFFFF; color: ${INK}; border: 4px solid ${INK}; border-radius: 18px; border-right-width: 10px; border-bottom-width: 10px; overflow: hidden; display: flex; flex-direction: column; min-height: 0">
      <div style="padding: 12px 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px">
        ${art(c, i, imgW, imgH, { label: 11 })}
        <div style="align-self: stretch; text-align: center">
          <div style="font-size: ${big ? 22 : 16}px; font-weight: 700; line-height: 1.15; max-height: ${big ? 52 : 38}px; overflow: hidden">${esc(c.name)}</div>
          <div style="font-size: ${big ? 15 : 12}px; color: #3A3B5C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${meta(c)}</div>
        </div>
      </div>
      ${bar(c, big ? 40 : 28, top, '8px 12px')}
    </div>`;
  }).join('');
  return root(1920, 1080, '52px 64px', 28, `
  <div style="display: flex; justify-content: space-between; align-items: center; gap: 40px">
    <div style="display: flex; align-items: center; gap: 36px">
      <img src="${logoSrc()}" alt="Captured! Cards" style="height: 72px; width: auto; display: block">
      <div style="font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 96px; line-height: 0.95; letter-spacing: -0.045em">We're <span style="color: ${HL()}">buying.</span></div>
      <div style="background: ${INK}; color: ${a}; border: 4px solid ${INK}; border-radius: 16px; font-family: 'Noto Sans JP', sans-serif; font-weight: 900; font-size: 40px; line-height: 1; padding: 12px 14px; transform: rotate(-8deg); box-shadow: 5px 5px 0 ${STK_SHADOW()}">買取</div>
    </div>
    <span style="display: inline-flex; align-items: center; min-height: 60px; padding: 0 28px; border-radius: 14px; background: ${a}; color: ${INK}; border: 4px solid ${INK}; border-right-width: 10px; border-bottom-width: 10px; font-size: 22px; font-weight: 700; white-space: nowrap">Sell us your cards → ${esc(S().phone)}</span>
  </div>
  <div style="flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(${cols}, ${tileW}px); justify-content: center; align-content: center; gap: ${GAP}px">${tiles}</div>
  <div style="display: flex; justify-content: space-between; gap: 16px; font-size: 18px; font-weight: 600"><span>Prices in CAD · Cash or store credit, same day · ${ratesShort()}</span><span>${esc(S().loc)}</span></div>`);
}

/* ---------- pages ---------- */
function chunk(arr, n) { const out = []; for (let i = 0; i < arr.length; i += n) out.push([arr.slice(i, i + n), i]); return out; }
function buildPages() {
  const cards = state.cards;
  const out = [];
  if (!cards.length) return out;
  for (const t of TEMPLATES) {
    if (!state.selected.includes(t.key)) continue;
    if (t.single) { out.push({ t, cards: cards.slice(0, t.per), start: 0 }); continue; }
    for (const [group, start] of chunk(cards, t.per)) out.push({ t, cards: group, start });
  }
  const counters = { post: 0, story: 0 };
  const totals = { post: out.filter((p) => p.t.series === 'post').length, story: out.filter((p) => p.t.series === 'story').length };
  const pad2 = (n) => String(n).padStart(2, '0');
  const perTpl = {};
  out.forEach((p) => {
    const s = p.t.series;
    let counter = '';
    if (s !== 'web') { counters[s]++; counter = totals[s] > 1 ? `${pad2(counters[s])} / ${pad2(totals[s])}` : ''; p.slide = counters[s]; }
    perTpl[p.t.key] = (perTpl[p.t.key] || 0) + 1; p.n = perTpl[p.t.key];
    const k = p.t.key;
    p.html = k === 'post-cover' ? coverTpl(p.cards, false)
      : k === 'story-cover' ? coverTpl(p.cards, true)
      : k === 'post-spot' ? spotTpl(p.cards[0], p.start, counter, false)
      : k === 'story-spot' ? spotTpl(p.cards[0], p.start, counter, true)
      : k === 'post-duo' ? duoTpl(p.cards, p.start, counter)
      : k === 'post-grid' ? gridTpl(p.cards, p.start, counter, false)
      : k === 'story-grid' ? gridTpl(p.cards, p.start, counter, true)
      : k === 'story-trio' ? trioTpl(p.cards, p.start, counter)
      : k === 'web' ? webTpl(p.cards) : webXlTpl(p.cards);
    const tag = s === 'web' ? 'web' : `${s}-${pad2(p.slide)}`;
    p.file = `capturedcards-buylist-${tag}-${k}${p.t.single ? '' : '-' + p.n}.png`;
    p.title = `${p.t.group} · ${p.t.label}${p.t.single ? '' : ' ' + p.n}`;
  });
  return out;
}

/* ---------- image styles ---------- */
function refreshImgStyles() {
  $('#imgStyles').textContent = state.cards.filter((c) => c.img).map((c) => `.ci-${c.id}{background-image:url("${c.img}")}`).join('\n');
}

/* ---------- editor UI ---------- */
function cardRow(c, i) {
  const el = document.createElement('div');
  el.className = 'crow' + (i === 0 ? ' top-buy' : '');
  el.dataset.id = c.id;
  const n = i + 1;
  el.innerHTML = `
    ${i === 0 ? '<div class="top-tag">Top buy: first card gets the highlighted price on covers and banners</div>' : ''}
    <div>
      <div class="thumb ${c.img ? 'has' : ''} ${c.type === 'graded' ? 'graded' : ''}" tabindex="0" role="button" aria-label="${c.img ? 'Replace' : 'Add'} image for card ${n}" style="${c.img ? `background-image:url('${c.img}')` : ''}">
        ${c.img ? '' : 'Drop or click to add image'}
        <button type="button" class="rm" aria-label="Remove image from card ${n}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <input type="file" accept="image/*" hidden>
    </div>
    <div class="fields">
      <div class="frow">
        <div class="f f-name"><label for="n-${c.id}">Card name</label><input id="n-${c.id}" data-k="name" value="${esc(c.name)}" placeholder="Umbreon ex"></div>
        <div class="f f-price"><label for="p-${c.id}">Buy price</label><div class="price-in"><span aria-hidden="true">$</span><input id="p-${c.id}" data-k="price" value="${esc(c.price)}" inputmode="decimal" placeholder="0"></div></div>
      </div>
      <div class="frow">
        <div class="f f-num"><label for="u-${c.id}">Number</label><input id="u-${c.id}" data-k="number" value="${esc(c.number)}" placeholder="161/131"></div>
        <div class="f f-set"><label for="s-${c.id}">Set</label><input id="s-${c.id}" data-k="set" value="${esc(c.set)}" placeholder="PRE"></div>
        <div class="f f-rar"><label for="r-${c.id}">Rarity</label><input id="r-${c.id}" data-k="rarity" value="${esc(c.rarity)}" list="rarities" placeholder="SIR"></div>
      </div>
      <div class="frow" style="align-items:flex-end">
        <div class="seg" role="group" aria-label="Raw or graded">
          <button type="button" data-type="raw" aria-pressed="${c.type !== 'graded'}">Raw</button>
          <button type="button" data-type="graded" aria-pressed="${c.type === 'graded'}">Graded</button>
        </div>
        ${c.type === 'graded'
          ? `<div class="f" style="flex:0 0 92px"><label for="g-${c.id}">Grader</label><select id="g-${c.id}" data-k="grader">${GRADERS.map((g) => `<option${g === c.grader ? ' selected' : ''}>${g}</option>`).join('')}</select></div>
             <div class="f" style="flex:0 0 72px"><label for="gr-${c.id}">Grade</label><input id="gr-${c.id}" data-k="grade" value="${esc(c.grade)}" placeholder="10"></div>`
          : `<div class="f" style="flex:0 0 110px"><label for="c-${c.id}">Condition</label><select id="c-${c.id}" data-k="cond">${CONDS.map((g) => `<option${g === c.cond ? ' selected' : ''}>${g}</option>`).join('')}</select></div>`}
      </div>
    </div>
    <div class="ctl">
      <button type="button" class="icon-btn" data-act="up" aria-label="Move card ${n} up" ${i === 0 ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg></button>
      <button type="button" class="icon-btn" data-act="down" aria-label="Move card ${n} down" ${i === state.cards.length - 1 ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <button type="button" class="icon-btn del" data-act="del" aria-label="Delete card ${n}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>
    </div>`;
  const thumb = el.querySelector('.thumb'), file = el.querySelector('input[type=file]');
  thumb.addEventListener('click', (e) => { if (!e.target.closest('.rm')) file.click(); });
  thumb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
  file.addEventListener('change', () => { if (file.files[0]) setCardImage(c.id, file.files[0]); });
  ['dragenter', 'dragover'].forEach((ev) => thumb.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); thumb.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => thumb.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); thumb.classList.remove('over'); }));
  thumb.addEventListener('drop', (e) => { const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith('image/')); if (f) setCardImage(c.id, f); });
  el.querySelector('.rm').addEventListener('click', (e) => { e.stopPropagation(); updateCard(c.id, { img: '', assetId: '' }, true); });
  el.querySelectorAll('[data-k]').forEach((inp) => {
    const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(ev, () => updateCard(c.id, { [inp.dataset.k]: inp.value }, false));
  });
  el.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => updateCard(c.id, { type: b.dataset.type }, true, `[data-type="${b.dataset.type}"]`)));
  el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(c.id, b.dataset.act)));
  return el;
}
function renderCards(focusId, focusSel) {
  const box = $('#cards');
  box.innerHTML = '';
  if (!state.cards.length) {
    box.innerHTML = '<div class="empty">No cards yet. Drop images above or add a card to start.</div>';
  } else state.cards.forEach((c, i) => box.appendChild(cardRow(c, i)));
  $('#cardCount').textContent = `${state.cards.length} ${state.cards.length === 1 ? 'card' : 'cards'}`;
  if (focusId) { const t = box.querySelector(`[data-id="${focusId}"] ${focusSel || 'input'}`); t?.focus(); }
}
function updateCard(id, patch, rerenderRow, focusSel) {
  const c = state.cards.find((x) => x.id === id); if (!c) return;
  Object.assign(c, patch);
  if (rerenderRow) { renderCards(id, focusSel); refreshImgStyles(); }
  changed();
}
function act(id, what) {
  const i = state.cards.findIndex((x) => x.id === id); if (i < 0) return;
  if (what === 'up' && i > 0) [state.cards[i - 1], state.cards[i]] = [state.cards[i], state.cards[i - 1]];
  if (what === 'down' && i < state.cards.length - 1) [state.cards[i + 1], state.cards[i]] = [state.cards[i], state.cards[i + 1]];
  if (what === 'del') {
    lastDeleted = { card: state.cards[i], index: i };
    state.cards.splice(i, 1);
    toast(`Deleted ${state.cards.length >= 0 && lastDeleted.card.name ? lastDeleted.card.name : 'card'}`, true);
  }
  renderCards(what === 'del' ? null : id, what === 'up' ? '[data-act="up"]' : what === 'down' ? '[data-act="down"]' : null);
  refreshImgStyles();
  changed();
}

/* ---------- images ---------- */
async function processImage(file) {
  const bmp = await createImageBitmap(file);
  const max = 1800, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
  const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  return { url, assetId: '', imgRatio: bmp.width / bmp.height };
}
async function setCardImage(id, file) {
  setStatus('Adding image…');
  try {
    const { url, assetId, imgRatio } = await processImage(file);
    updateCard(id, { img: url, assetId, imgRatio }, true, '.thumb');
  } catch (e) { toast('That file couldn\u2019t be read as an image. Try a JPG or PNG.'); setStatus(''); }
}
function nameFromFile(f) {
  return f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (m) => m.toUpperCase());
}
async function addFromFiles(files) {
  const imgs = [...files].filter((f) => f.type.startsWith('image/'));
  if (!imgs.length) return;
  setStatus(`Adding ${imgs.length} ${imgs.length === 1 ? 'image' : 'images'}…`);
  for (const f of imgs) {
    try {
      const { url, assetId, imgRatio } = await processImage(f);
      state.cards.push({ id: uid(), name: nameFromFile(f), number: '', set: '', rarity: '', type: 'raw', cond: 'NM', grader: 'PSA', grade: '10', price: '', img: url, assetId, imgRatio });
    } catch (e) { /* skip unreadable */ }
  }
  renderCards(); refreshImgStyles(); changed();
}

/* ---------- settings + templates UI ---------- */
function renderSettings() {
  document.querySelectorAll('[data-s]').forEach((inp) => {
    inp.value = state.settings[inp.dataset.s] ?? '';
    inp.oninput = () => { state.settings[inp.dataset.s] = inp.value; changed(); };
  });
  const sw = (box, list, key) => {
    box.innerHTML = '';
    list.forEach(([hex, name]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.style.background = hex; b.setAttribute('aria-label', name);
      b.setAttribute('aria-pressed', String(state.settings[key] === hex));
      b.onclick = () => { state.settings[key] = hex; renderSettings(); changed(); };
      box.appendChild(b);
    });
  };
  sw($('#swGround'), GROUNDS, 'ground'); sw($('#swAccent'), ACCENTS, 'accent');
}
function renderTemplates() {
  const groups = [...new Set(TEMPLATES.map((t) => t.group))];
  const n = state.cards.length;
  $('#tpls').innerHTML = groups.map((g) => `<div class="tgroup"><h3>${g}</h3><div class="tpls">${TEMPLATES.filter((t) => t.group === g).map((t) => {
    const count = !n ? 0 : t.single ? 1 : Math.ceil(n / t.per);
    return `<label class="tpl"><input type="checkbox" value="${t.key}" ${state.selected.includes(t.key) ? 'checked' : ''}><span><b>${t.label}</b><small>${t.desc} · ${count} ${count === 1 ? 'image' : 'images'}</small></span></label>`;
  }).join('')}</div></div>`).join('');
  $('#tpls').querySelectorAll('input').forEach((cb) => cb.addEventListener('change', () => {
    state.selected = TEMPLATES.map((t) => t.key).filter((k) => k === cb.value ? cb.checked : state.selected.includes(k));
    changed(true);
  }));
}

/* ---------- previews ---------- */
function scaledFrame(p, dispW) {
  const s = dispW / p.t.w;
  return `<div style="width:${Math.round(p.t.w * s)}px;height:${Math.round(p.t.h * s)}px"><div style="width:${p.t.w}px;height:${p.t.h}px;transform:scale(${s});transform-origin:0 0">${p.html}</div></div>`;
}
function renderPreviews() {
  pages = buildPages();
  const box = $('#previews');
  $('#pageCount').textContent = pages.length ? `${pages.length} ${pages.length === 1 ? 'image' : 'images'} selected` : '';
  $('#dlAll').disabled = !pages.length || !dlApi;
  if (!state.cards.length) { box.innerHTML = '<div class="empty">Add at least one card to see previews.</div>'; return; }
  if (!pages.length) { box.innerHTML = '<div class="empty">Pick at least one template above to see previews.</div>'; return; }
  const order = ['post', 'story', 'web'];
  const names = { post: 'Instagram / Facebook post carousel', story: 'Instagram story sequence', web: 'Website banners' };
  const hints = { post: 'Post these in this order as one carousel.', story: 'Post these in this order as consecutive stories.', web: 'Each banner uses the first cards in your list.' };
  box.innerHTML = order.filter((s) => pages.some((p) => p.t.series === s)).map((s) => `
    <div class="pgroup"><h3>${names[s]}</h3><p class="hint">${hints[s]}</p><div class="pgrid">
    ${pages.map((p, i) => p.t.series !== s ? '' : `<figure class="pfig">
      <button type="button" class="pframe" data-i="${i}" aria-label="Open ${esc(p.title)} full size">${scaledFrame(p, s === 'web' ? 520 : (p.t.h > 1500 ? 200 : 240))}</button>
      <figcaption class="pcap"><span>${s === 'web' ? p.t.label : `${String(p.slide).padStart(2, '0')} · ${p.t.label}`}</span>${dlApi ? `<button type="button" class="btn small" data-dl="${i}">PNG</button>` : ''}</figcaption>
    </figure>`).join('')}
    </div></div>`).join('');
  box.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => openDlg(+b.dataset.i)));
  box.querySelectorAll('[data-dl]').forEach((b) => b.addEventListener('click', () => downloadOne(+b.dataset.dl)));
}
function openDlg(i) {
  dlgIndex = i; const p = pages[i]; if (!p) return;
  $('#dlgTitle').textContent = p.title;
  const avail = Math.min(window.innerWidth * 0.9, 1360), availH = window.innerHeight * 0.74;
  const s = Math.min(avail / p.t.w, availH / p.t.h, 1);
  $('#dlgBody').innerHTML = scaledFrame(p, p.t.w * s);
  $('#dlgPrev').disabled = i === 0; $('#dlgNext').disabled = i === pages.length - 1;
  $('#dlgDl').hidden = !dlApi;
  if (!$('#dlg').open) $('#dlg').showModal();
}

/* ---------- export ---------- */
async function waitImages(urls) {
  await Promise.all(urls.map((u) => new Promise((r) => { const im = new Image(); im.onload = im.onerror = () => r(); im.src = u; })));
}
async function renderPng(p) {
  await document.fonts.ready;
  await Promise.all(["800 40px 'Bricolage Grotesque'", "600 40px 'Bricolage Grotesque'", "700 20px 'Instrument Sans'", "500 20px 'Instrument Sans'", "900 40px 'Noto Sans JP'"].map((f) => document.fonts.load(f, '買取 Abc').catch(() => {})));
  await waitImages([logoSrc(), ...p.cards.filter((c) => c.img).map((c) => c.img)]);
  const host = $('#renderHost');
  host.innerHTML = p.html;
  const node = host.firstElementChild;
  const sx = window.scrollX, sy = window.scrollY;
  window.scrollTo(0, 0);
  try {
    const canvas = await html2canvas(node, { scale: 1, backgroundColor: null, useCORS: true, logging: false, width: p.t.w, height: p.t.h, windowWidth: p.t.w, windowHeight: p.t.h, scrollX: 0, scrollY: 0 });
    return await new Promise((r) => canvas.toBlob(r, 'image/png'));
  } finally {
    host.innerHTML = ''; window.scrollTo(sx, sy);
  }
}
async function save(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  toast(`Downloaded ${filename}`);
}
async function downloadOne(i) {
  const p = pages[i]; if (!p || !dlApi) return;
  overlay(`Rendering ${p.title}…`);
  try { const blob = await renderPng(p); overlay(); await save(p.file, blob); }
  catch (e) { overlay(); toast('That image couldn\u2019t be rendered. Check that its card images loaded, then try again.'); }
}
async function downloadAll() {
  if (!pages.length || !dlApi) return;
  const zip = new JSZip();
  try {
    for (let i = 0; i < pages.length; i++) {
      overlay(`Rendering image ${i + 1} of ${pages.length}…`);
      zip.file(pages[i].file, await renderPng(pages[i]));
    }
    overlay('Packing the zip…');
    const blob = await zip.generateAsync({ type: 'blob' });
    overlay();
    const d = (S().date || 'buylist').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    await save(`capturedcards-buylist-${d}.zip`, blob);
  } catch (e) { overlay(); toast('Rendering stopped. Check that every card image loaded, then try again.'); }
}
function overlay(msg) { const o = $('#overlay'); o.textContent = msg || ''; o.classList.toggle('on', !!msg); }

/* ---------- misc UI ---------- */
let toastTimer;
function toast(msg, undo) {
  $('#toastMsg').textContent = msg; $('#toastBtn').hidden = !undo; $('#toast').classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('on'), undo ? 7000 : 4000);
}
$('#toastBtn').addEventListener('click', () => {
  if (!lastDeleted) return;
  state.cards.splice(lastDeleted.index, 0, lastDeleted.card); lastDeleted = null;
  $('#toast').classList.remove('on'); renderCards(); refreshImgStyles(); changed();
});
function setStatus(t) { $('#saveStatus').textContent = t; }

/* ---------- persistence (chrome.storage.local, falls back to localStorage) ---------- */
const dlApi = true;
const store = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;
let saveTimer, previewTimer;
function serial() { return { cards: state.cards, settings: state.settings, selected: state.selected, posting: state.posting, history: state.history, v: 2 }; }
function changed(now) {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => { renderTemplates(); renderPreviews(); if (state.posting) renderPostingSummary(); }, now ? 0 : 200);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 700);
}
async function persist() {
  const data = serial();
  setStatus('Saving…');
  try {
    if (store) await store.set({ buylist: data });
    else localStorage.setItem('cc-buylist', JSON.stringify(data));
    setStatus('Saved');
  } catch (e) {
    setStatus('Not saved: storage is full. Remove some images.');
  }
}
async function load() {
  try {
    if (store) { const r = await store.get('buylist'); return r && r.buylist; }
    return JSON.parse(localStorage.getItem('cc-buylist') || 'null');
  } catch (e) { return null; }
}
function hydrate(data) {
  if (!data || !Array.isArray(data.cards)) return;
  state.cards = data.cards.map((c) => ({ id: c.id || uid(), name: '', number: '', set: '', rarity: '', type: 'raw', cond: 'NM', grader: 'PSA', grade: '10', price: '', img: '', assetId: '', ...c }));
  state.settings = { ...state.settings, ...(data.settings || {}) };
  if (Array.isArray(data.selected)) state.selected = data.selected;
  state.posting = { ...defaultPosting(), ...(data.posting || {}), dest: { ...defaultPosting().dest, ...((data.posting || {}).dest || {}) } };
  if (Array.isArray(data.history)) state.history = data.history;
}

/* ---------- posting with Muse ---------- */
const MUSE_URL = 'https://muse.ai/';
const DEST = [
  { key: 'igFeed', label: 'Instagram feed', sub: 'Carousel of your post images', series: 'post', acct: 'ig' },
  { key: 'igStory', label: 'Instagram story', sub: 'Your story images, in order', series: 'story', acct: 'ig' },
  { key: 'fbPost', label: 'Facebook Page post', sub: 'Multi-photo post of your post images', series: 'post', acct: 'fb' },
  { key: 'fbStory', label: 'Facebook story', sub: 'Your story images, in order', series: 'story', acct: 'fb' }
];
const FALLBACK_TEXT = { evening: 'an evening slot, 6:00–8:30 pm', lunch: 'a weekday lunch slot, 11:30 am–1:00 pm', weekend: 'a weekend late-morning slot, 10:00 am–12:30 pm', muse: 'whatever time you judge best for a local trading card shop audience' };
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const pad2 = (n) => String(n).padStart(2, '0');
const localInput = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
function defaultPosting() {
  const start = new Date(); start.setMinutes(0, 0, 0); start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 2 * 86400000); end.setHours(21, 0, 0, 0);
  return { dest: { igFeed: true, igStory: true, fbPost: true, fbStory: false }, ig: '', fb: 'Captured! Cards', caption: '', fbSame: true, fbCaption: '', hashtags: '#pokemon #pokemontcg #pokemoncards #tcg #burnaby #vancouver', mode: 'now', winStart: localInput(start), winEnd: localInput(end), fallback: 'evening', confirmTime: true };
}
const P = () => state.posting;
function buildCaption() {
  const s = S();
  const named = state.cards.filter((c) => c.name);
  const lines = named.slice(0, 10).map((c) => `• ${c.name}${c.number ? ` (${c.number})` : ''}${c.type === 'graded' ? ` ${gradeLabel(c)}` : ''}: ${money(c.price)}`);
  const more = named.length > 10 ? [`…plus ${named.length - 10} more in the slides.`] : [];
  return [`We're buying! This week's buylist (${s.date}):`, '', ...lines, ...more, '', `Not on the list? We still buy, from ${s.cash}% cash / ${s.trade}% trade.`, `Sell us your cards → ${s.social}`, `📍 ${s.loc}`].join('\n');
}
const fullCaption = (txt) => [txt.trim(), P().hashtags.trim()].filter(Boolean).join('\n\n');
const igCaption = () => fullCaption(P().caption);
const fbCaption = () => fullCaption(P().fbSame ? P().caption : P().fbCaption);
const chosen = () => DEST.filter((d) => P().dest[d.key]);
const seriesPages = (s) => pages.filter((p) => p.t.series === s);
const acctName = (d) => d.acct === 'ig' ? (P().ig.trim() || 'my Instagram account') : (P().fb.trim() || 'my Facebook Page');
const fmtWhen = (v) => { const d = new Date(v); return isNaN(d) ? v : d.toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

function postIssues() {
  const errs = [], warns = [];
  const ds = chosen();
  if (!ds.length) errs.push('Pick at least one place to post.');
  ds.forEach((d) => {
    const n = seriesPages(d.series).length;
    if (!n) errs.push(`${d.label} needs ${d.series === 'post' ? 'a post template' : 'a story template'} ticked in step 3.`);
    if (d.key === 'igFeed' && n > 20) errs.push(`Instagram carousels take up to 20 images; you have ${n}. Untick a template in step 3.`);
    if (d.key === 'fbStory' && n > 10) warns.push(`That's ${n} Facebook story frames; viewers often drop off after a few.`);
  });
  if (ds.some((d) => d.acct === 'ig') && !P().ig.trim()) errs.push('Add your Instagram account handle.');
  if (ds.some((d) => d.acct === 'fb') && !P().fb.trim()) errs.push('Add your Facebook Page name.');
  if (ds.some((d) => d.key === 'igFeed' || d.key === 'fbPost') && !P().caption.trim()) errs.push('Write a caption, or click "Rebuild from cards".');
  if (!P().fbSame && ds.some((d) => d.key === 'fbPost') && !P().fbCaption.trim()) errs.push('Write the Facebook caption, or tick "Use the same caption on Facebook".');
  if (igCaption().length > 2200) errs.push(`The Instagram caption is ${igCaption().length} characters; Instagram allows 2,200.`);
  if ((igCaption().match(/#[^\s#]+/g) || []).length > 30) errs.push('Instagram allows up to 30 hashtags.');
  if (P().mode === 'peak') {
    const a = new Date(P().winStart), b = new Date(P().winEnd);
    if (isNaN(a) || isNaN(b)) errs.push('Set both the earliest and latest time for the posting window.');
    else {
      if (b <= a) errs.push('The latest time must be after the earliest time.');
      if (b <= new Date()) errs.push('The posting window has already passed.');
      if ((b - a) < 3600000) warns.push('The window is under an hour, so Muse has little room to find a peak.');
    }
  }
  if (state.cards.some((c) => c.name && !String(c.price).trim())) warns.push('Some cards have no price; they will show "$—".');
  if (state.cards.some((c) => !c.img)) warns.push('Some cards have no image and will show a placeholder.');
  return { errs, warns };
}

function museMessage(files) {
  const ds = chosen();
  const where = ds.map((d, i) => {
    const list = files[d.series].join(', ');
    const how = d.key === 'igFeed' ? 'one carousel post' : d.key === 'fbPost' ? 'one multi-photo post' : 'consecutive story frames';
    return `${i + 1}. ${d.label} (${acctName(d)}): ${how} using these images in this order: ${list}.`;
  }).join('\n');
  const needsFeed = ds.some((d) => d.key === 'igFeed' || d.key === 'fbPost');
  const caps = [];
  if (ds.some((d) => d.key === 'igFeed')) caps.push(`CAPTION FOR INSTAGRAM (use exactly as written):\n"""\n${igCaption()}\n"""`);
  if (ds.some((d) => d.key === 'fbPost')) caps.push(`CAPTION FOR FACEBOOK (use exactly as written):\n"""\n${fbCaption()}\n"""`);
  if (ds.some((d) => d.series === 'story')) caps.push('Stories go out without a caption.');
  let when;
  if (P().mode === 'now') {
    when = 'WHEN\nPublish as soon as I approve the staging preview below.';
  } else {
    when = `WHEN\nSchedule each post for the best time between ${fmtWhen(P().winStart)} and ${fmtWhen(P().winEnd)} (${TZ}).\nPick the time from my accounts' recent insights: when my followers are most active and when similar posts got the most engagement. If you can't see insights, aim for ${FALLBACK_TEXT[P().fallback]} inside the window.\nFeed posts and stories can go at the same time unless the insights suggest otherwise.${P().confirmTime ? '\nTell me the time you picked for each post and why before scheduling.' : ''}`;
  }
  return [
    'Hi Muse, please publish this Captured! Cards buylist for me using my social posting connector.',
    `FILES\nI've attached ${files.count} images (from the folder "${files.folder}"). Use them exactly as provided: no cropping, filters, text or edits. Keep the numbered order.`,
    `WHERE\n${where}`,
    caps.join('\n\n'),
    when,
    `STAGING (required)\nBefore you publish or schedule anything, show me a preview for each destination: the account, the images in order, the exact caption${needsFeed ? '' : ' (if any)'}, and the date and time it will go out. Then wait until I reply "approve". Don't publish or schedule anything before that.\nIf a platform rejects an image or a step fails, tell me what happened instead of changing the images or caption.`
  ].join('\n\n');
}
const SKILL = () => `For any Captured! Cards buylist post: publish to Instagram${P().ig ? ' (' + P().ig + ')' : ''} and Facebook${P().fb ? ' (' + P().fb + ')' : ''} through my social posting connector. Use the attached images exactly as provided, in their numbered order, and use captions exactly as written. Before publishing or scheduling anything, always show me a preview for each destination (account, images in order, caption, date and time) and wait for my explicit "approve". When I ask for a peak time, choose it from my accounts' insights inside the window I give, and tell me the time and why. If anything fails, tell me instead of editing the post.`;

/* posting UI */
function renderDests() {
  $('#dests').innerHTML = DEST.map((d) => {
    const n = seriesPages(d.series).length;
    const sub = n ? `${d.sub} · ${n} ${n === 1 ? 'image' : 'images'}` : `Tick a ${d.series} template in step 3`;
    return `<label class="dest"><input type="checkbox" data-dest="${d.key}" ${P().dest[d.key] ? 'checked' : ''}><span><b>${d.label}</b><small class="${n ? '' : 'warn'}">${sub}</small></span></label>`;
  }).join('');
  $('#dests').querySelectorAll('[data-dest]').forEach((cb) => cb.addEventListener('change', () => { P().dest[cb.dataset.dest] = cb.checked; postChanged(); }));
}
function renderPostingSummary() {
  renderDests();
  const ds = chosen();
  const n = new Set(ds.map((d) => d.series));
  const counts = [...n].map((s) => `${seriesPages(s).length} ${s} ${seriesPages(s).length === 1 ? 'image' : 'images'}`).join(' and ');
  $('#whatSummary').textContent = ds.length ? `Sending ${counts || 'no images'} from step 4.` : '';
  $('#capCount').textContent = `${igCaption().length} / 2,200 characters · ${(igCaption().match(/#[^\s#]+/g) || []).length} / 30 hashtags`;
  $('#fbCapWrap').hidden = P().fbSame;
  $('#peakFields').hidden = P().mode !== 'peak';
  $('#tzNote').textContent = `Times are in your computer's time zone (${TZ}).`;
  const box = $('#postErrors'); box.classList.remove('on'); box.innerHTML = '';
  renderHistory();
}
function postChanged() { renderPostingSummary(); clearTimeout(saveTimer); saveTimer = setTimeout(persist, 700); }
function initPosting() {
  if (!P().caption) P().caption = buildCaption();
  document.querySelectorAll('[data-p]').forEach((el) => {
    el.value = P()[el.dataset.p] ?? '';
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { P()[el.dataset.p] = el.value; postChanged(); });
  });
  document.querySelectorAll('[data-pc]').forEach((el) => {
    el.checked = !!P()[el.dataset.pc];
    el.addEventListener('change', () => { P()[el.dataset.pc] = el.checked; postChanged(); });
  });
  document.querySelectorAll('input[name=pMode]').forEach((r) => {
    r.checked = r.value === P().mode;
    r.addEventListener('change', () => { if (r.checked) { P().mode = r.value; postChanged(); } });
  });
  $('#rebuildCaption').addEventListener('click', () => {
    if (P().caption.trim() && P().caption !== buildCaption() && !confirm('Replace your caption with one built from the current card list?')) return;
    P().caption = buildCaption(); $('#pCaption').value = P().caption; postChanged();
  });
  $('#reviewBtn').addEventListener('click', openReview);
  $('#museSetupBtn').addEventListener('click', () => { $('#skillText').value = SKILL(); $('#setupDlg').showModal(); });
  $('#copySkill').addEventListener('click', async () => { await copyText(SKILL()); toast('Skill copied. Paste it into Muse.'); });
  $('#openMuse2').addEventListener('click', () => window.open(MUSE_URL, '_blank'));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => $('#' + b.dataset.close).close()));
  renderPostingSummary();
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

/* review (staging in the extension) */
function openReview() {
  const { errs, warns } = postIssues();
  const box = $('#postErrors');
  if (errs.length) {
    box.innerHTML = `Fix these before sending:<ul>${errs.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
    box.classList.add('on'); box.scrollIntoView({ block: 'nearest' }); return;
  }
  const ds = chosen();
  const thumbs = (s) => seriesPages(s).map((p) => scaledFrame(p, p.t.h > 1500 ? 70 : 90)).join('');
  const whenTxt = P().mode === 'now'
    ? 'Right after you approve Muse’s preview.'
    : `At a peak time between ${fmtWhen(P().winStart)} and ${fmtWhen(P().winEnd)} (${TZ}). If Muse can't see insights it aims for ${FALLBACK_TEXT[P().fallback]}.${P().confirmTime ? ' Muse confirms the time with you first.' : ''}`;
  $('#reviewBody').innerHTML = `
    ${warns.length ? `<div class="errors on" style="border-color:var(--line);color:var(--text)">Heads up:<ul>${warns.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    ${ds.map((d) => `<div class="rv"><h4>${d.label}</h4><small>${esc(acctName(d))} · ${seriesPages(d.series).length} images</small>
      <div class="thumbs">${thumbs(d.series)}</div>
      ${d.key === 'igFeed' ? `<pre>${esc(igCaption())}</pre>` : d.key === 'fbPost' ? `<pre>${esc(fbCaption())}</pre>` : '<small>Stories go out without a caption.</small>'}
    </div>`).join('')}
    <div class="rv"><h4>When</h4><p style="margin:0">${esc(whenTxt)}</p></div>
    <label class="chk" style="margin:6px 0 14px"><input type="checkbox" id="rvOk"> I've checked the cards, prices, images and captions</label>
    <div class="list-actions"><button class="btn primary" type="button" id="rvSend" disabled>Save images and prepare Muse message</button><button class="btn" type="button" data-close2>Keep editing</button></div>
    <p class="hint" style="margin-top:10px">Nothing is posted yet. Muse will show you its own preview and wait for your "approve".</p>`;
  $('#rvOk').addEventListener('change', (e) => { $('#rvSend').disabled = !e.target.checked; });
  $('#reviewBody').querySelector('[data-close2]').addEventListener('click', () => $('#reviewDlg').close());
  $('#rvSend').addEventListener('click', sendToMuse);
  $('#reviewDlg').showModal();
}

async function saveFile(path, blob) {
  if (typeof chrome !== 'undefined' && chrome.downloads?.download) {
    const url = URL.createObjectURL(blob);
    try { await chrome.downloads.download({ url, filename: path, conflictAction: 'uniquify', saveAs: false }); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 60000); }
    return true;
  }
  return false;
}
async function sendToMuse() {
  const ds = chosen();
  const series = [...new Set(ds.map((d) => d.series))];
  const stamp = new Date();
  const folder = `CapturedCards/buylist-${stamp.getFullYear()}-${pad2(stamp.getMonth() + 1)}-${pad2(stamp.getDate())}-${pad2(stamp.getHours())}${pad2(stamp.getMinutes())}`;
  const files = { folder: folder.replace('/', ' / '), count: 0 };
  const jobs = [];
  series.forEach((s) => {
    files[s] = [];
    seriesPages(s).forEach((p, i) => { const name = `${s}-${pad2(i + 1)}-${p.t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${p.t.single ? '' : '-' + p.n}.png`; files[s].push(name); jobs.push([name, p]); });
  });
  files.count = jobs.length;
  const msg = museMessage(files);
  $('#reviewDlg').close();
  const canFolder = typeof chrome !== 'undefined' && !!chrome.downloads?.download;
  const zip = canFolder ? null : new JSZip();
  try {
    for (let i = 0; i < jobs.length; i++) {
      overlay(`Rendering image ${i + 1} of ${jobs.length}…`);
      const blob = await renderPng(jobs[i][1]);
      if (canFolder) await saveFile(`${folder}/${jobs[i][0]}`, blob); else zip.file(jobs[i][0], blob);
    }
    const txt = new Blob([msg], { type: 'text/plain' });
    if (canFolder) await saveFile(`${folder}/muse-message.txt`, txt);
    else { zip.file('muse-message.txt', txt); overlay('Packing the zip…'); await save(`${folder.split('/')[1]}.zip`, await zip.generateAsync({ type: 'blob' })); }
    overlay();
  } catch (e) { overlay(); toast('Rendering stopped. Check that every card image loaded, then try again.'); return; }
  const entry = { id: uid(), at: stamp.toISOString(), dests: ds.map((d) => d.label), mode: P().mode, winStart: P().winStart, winEnd: P().winEnd, folder, count: jobs.length, msg, status: 'sent' };
  state.history = [entry, ...(state.history || [])].slice(0, 25);
  persist(); renderHistory();
  showHandoff(entry, canFolder);
}
function showHandoff(entry, canFolder) {
  $('#reviewTitle').textContent = 'Ready for Muse';
  $('#reviewBody').innerHTML = `
    <p><b>${entry.count} images saved</b> to your Downloads folder in <b>${esc(canFolder ? entry.folder : entry.folder.split('/')[1] + '.zip')}</b>${canFolder ? ', with a copy of the message as muse-message.txt' : ' (unzip it first)'}.</p>
    <ol class="steps">
      <li>Click the button below. It copies Muse's instructions and opens Muse.</li>
      <li>In Muse, paste the message and attach all ${entry.count} images from that folder.</li>
      <li>Muse replies with a staging preview. Check it, then reply <b>approve</b>.</li>
    </ol>
    <div class="list-actions"><button class="btn primary" type="button" id="hoGo">Copy message and open Muse</button><button class="btn" type="button" id="hoCopy">Copy message only</button></div>
    <p class="hint" style="margin-top:10px">First time? Use "Muse setup" to connect a posting connector and save the staging skill.</p>`;
  $('#hoGo').addEventListener('click', async () => { await copyText(entry.msg); window.open(MUSE_URL, '_blank'); toast('Message copied. Paste it into Muse.'); });
  $('#hoCopy').addEventListener('click', async () => { await copyText(entry.msg); toast('Message copied.'); });
  if (!$('#reviewDlg').open) $('#reviewDlg').showModal();
  $('#reviewDlg').addEventListener('close', () => { $('#reviewTitle').textContent = 'Check before sending to Muse'; }, { once: true });
}
function renderHistory() {
  const h = state.history || [];
  const wrap = $('#historyWrap');
  if (!h.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `<h3 style="font-size:18px;margin-bottom:8px">Sent to Muse</h3><div class="hist">${h.map((e) => `<div class="hrow">
    <div><b>${new Date(e.at).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${esc(e.dests.join(', '))}</b>
    <small>${e.count} images · ${e.mode === 'now' ? 'Post after approval' : `Peak time, ${fmtWhen(e.winStart)} – ${fmtWhen(e.winEnd)}`}</small></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="pill ${e.status === 'posted' ? 'done' : ''}">${e.status === 'posted' ? 'Posted' : 'Waiting on Muse'}</span>
    <button class="btn small" type="button" data-hcopy="${e.id}">Copy message</button>
    <button class="btn small" type="button" data-hdone="${e.id}">${e.status === 'posted' ? 'Mark as waiting' : 'Mark as posted'}</button></div>
  </div>`).join('')}</div>`;
  wrap.querySelectorAll('[data-hcopy]').forEach((b) => b.addEventListener('click', async () => { const e = h.find((x) => x.id === b.dataset.hcopy); await copyText(e.msg); toast('Message copied.'); }));
  wrap.querySelectorAll('[data-hdone]').forEach((b) => b.addEventListener('click', () => { const e = h.find((x) => x.id === b.dataset.hdone); e.status = e.status === 'posted' ? 'sent' : 'posted'; persist(); renderHistory(); }));
}

/* ---------- wiring ---------- */
$('#addCard').addEventListener('click', () => {
  const c = { id: uid(), name: '', number: '', set: '', rarity: '', type: 'raw', cond: 'NM', grader: 'PSA', grade: '10', price: '', img: '', assetId: '' };
  state.cards.push(c); renderCards(c.id); changed();
});
$('#sortPrice').addEventListener('click', () => {
  const v = (c) => Number(String(c.price).replace(/[^0-9.]/g, '')) || 0;
  state.cards.sort((a, b) => v(b) - v(a)); renderCards(); changed();
});
$('#clearAll').addEventListener('click', () => {
  if (!state.cards.length) return;
  if (!confirm(`Remove all ${state.cards.length} cards from the list?`)) return;
  state.cards = []; renderCards(); refreshImgStyles(); changed();
});
const bulk = $('#bulkDrop'), bulkFile = $('#bulkFile');
bulk.addEventListener('click', () => bulkFile.click());
bulk.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bulkFile.click(); } });
bulkFile.addEventListener('change', () => { addFromFiles(bulkFile.files); bulkFile.value = ''; });
['dragenter', 'dragover'].forEach((ev) => bulk.addEventListener(ev, (e) => { e.preventDefault(); bulk.classList.add('over'); }));
['dragleave', 'drop'].forEach((ev) => bulk.addEventListener(ev, (e) => { e.preventDefault(); bulk.classList.remove('over'); }));
bulk.addEventListener('drop', (e) => addFromFiles(e.dataTransfer?.files || []));
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());
$('#dlAll').addEventListener('click', downloadAll);
$('#dlgClose').addEventListener('click', () => $('#dlg').close());
$('#dlgPrev').addEventListener('click', () => openDlg(dlgIndex - 1));
$('#dlgNext').addEventListener('click', () => openDlg(dlgIndex + 1));
$('#dlgDl').addEventListener('click', () => downloadOne(dlgIndex));
$('#dlg').addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' && dlgIndex > 0) openDlg(dlgIndex - 1); if (e.key === 'ArrowRight' && dlgIndex < pages.length - 1) openDlg(dlgIndex + 1); });

const dl = document.createElement('datalist'); dl.id = 'rarities'; dl.innerHTML = RARITIES.map((r) => `<option value="${r}">`).join(''); document.body.appendChild(dl);

(async () => {
  hydrate(await load());
  if (!state.posting) state.posting = defaultPosting();
  renderCards(); renderSettings(); refreshImgStyles(); renderTemplates(); renderPreviews();
  initPosting();
  setStatus('Saved');
})();
})();
