// HTML templates. Pure functions: (ctx) => string.
// ctx = { lang, t, config, key, icon, img, url, alternates, assets, year }

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const arrow = (c) => c.icon('arrow-right');

// ---------------------------------------------------------------- brand mark
// Placeholder mark until the official ConsultAxis logo file is supplied.
const mark = () => `<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
  <rect x="0.5" y="0.5" width="31" height="31" rx="3" fill="none" stroke="currentColor" stroke-opacity=".28"/>
  <path d="M7 25 L25 7" stroke="#B69A69" stroke-width="2" stroke-linecap="round"/>
  <path d="M16 6 V26 M6 16 H26" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2.2" fill="#B69A69"/>
</svg>`;

// Animated "axis field" behind a section (drawn by site.js). Decorative only.
const field = (variant = 'hero') => `<canvas class="bg-field" data-field="${variant}" aria-hidden="true"></canvas><div class="bg-wash" aria-hidden="true"></div>`;

// Contact link carrying the enquiry area, so the form opens pre-filled.
const contactHref = (c, area) => `${c.url('contact')}${area ? `?area=${area}` : ''}#form`;

// Verified company address, shown only once site.config.mjs marks the details as verified.
const address = (c) => {
  const co = c.config.company;
  if (!c.config.companyVerified || !co.street) return '';
  return `<address>${esc(co.name)}<br>${esc(co.street)}<br>${esc(co.postcode)} ${esc(co.city)}<br>${esc(co.country[c.lang] || '')}</address>`;
};

const brand = (c) => `<a class="brand" href="${c.url('home')}" aria-label="ConsultAxis, ${esc(c.t.ui.home)}">${mark()}<span class="brand__word">Consult<b>Axis</b></span></a>`;

// ---------------------------------------------------------------- header / menu / footer
function langSwitch(c, cls = 'lang') {
  const items = c.config.languages.map((l) => {
    const href = c.url(c.key, l.code);
    const cur = l.code === c.lang ? ' aria-current="true"' : '';
    return `<a href="${href}" hreflang="${l.code}" lang="${l.code}"${cur} title="${esc(l.label)}">${l.short}</a>`;
  }).join('');
  return `<div class="${cls}" role="group" aria-label="${esc(c.t.ui.language)}">${items}</div>`;
}

function navState(c, item) {
  if (c.is404) return '';
  if (item === c.key) return ' aria-current="page"';
  if (item === 'business' && c.config.serviceAreas.includes(c.key)) return ' class="is-section"';
  if (item === 'contact' && (c.key === 'thanks' || c.key === 'sendError')) return ' class="is-section"';
  return '';
}

function header(c) {
  const links = c.config.nav.map((k) => `<li><a href="${c.url(k)}"${navState(c, k)}>${esc(c.t.ui.nav[k])}</a></li>`).join('');
  const mlinks = c.config.nav.map((k) => `<li><a href="${c.url(k)}"${k === c.key && !c.is404 ? ' aria-current="page"' : ''}>${esc(c.t.ui.nav[k])}${arrow(c)}</a></li>`).join('');
  return `<a class="skip" href="#main">${esc(c.t.ui.skip)}</a>
<header class="site-header">
  <div class="wrap">
    ${brand(c)}
    <nav class="nav" aria-label="${esc(c.t.ui.mainNav)}"><ul>${links}</ul></nav>
    ${langSwitch(c)}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">${esc(c.t.ui.menu)}${c.icon('menu')}</button>
  </div>
</header>
<div class="menu" id="menu" role="dialog" aria-modal="true" aria-label="${esc(c.t.ui.menu)}">
  <div class="wrap menu__top">${brand(c)}<button class="menu__close" type="button">${esc(c.t.ui.close)}${c.icon('x')}</button></div>
  <nav class="wrap menu__nav" aria-label="${esc(c.t.ui.mainNav)}"><ul>${mlinks}</ul></nav>
  <div class="wrap menu__foot">
    ${langSwitch(c)}
    <a class="btn" href="${c.url('contact')}"><span class="btn__label">${esc(c.t.ui.ctaPrimary)}</span>${arrow(c)}</a>
    <a class="menu__mail" href="mailto:${esc(c.config.company.email)}">${esc(c.config.company.email)}</a>
  </div>
</div>`;
}

function footer(c) {
  const f = c.t.ui.footer;
  const li = (k, label) => `<li><a href="${c.url(k)}">${esc(label || c.t.ui.nav[k])}</a></li>`;
  const credits = c.creditsHtml();
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        ${brand(c)}
        <p class="tagline">${esc(f.tagline)}</p>
        <a class="mail" href="mailto:${esc(c.config.company.email)}">${esc(c.config.company.email)}</a>
        ${address(c)}
      </div>
      <div class="footer-col footer-col--wide">
        <h2>${esc(f.business)}</h2>
        <ul>${c.config.serviceAreas.map((k) => li(k, c.t.pages.areas[k].short)).join('')}</ul>
      </div>
      <div class="footer-col">
        <h2>${esc(f.realestate)}</h2>
        <ul>${li('realestate', f.propertyOverview)}</ul>
      </div>
      <div class="footer-col">
        <h2>${esc(f.company)}</h2>
        <ul>${li('about')}${li('industries')}${li('partners')}${li('contact')}</ul>
      </div>
      <div class="footer-col">
        <h2>${esc(f.legal)}</h2>
        <ul>${li('imprint', f.imprint)}${li('privacy', f.privacy)}<li><button type="button" data-consent-open>${esc(f.cookies)}</button></li></ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${c.year} ${esc(f.copyright)}</p>
      ${credits}
      ${langSwitch(c)}
    </div>
  </div>
</footer>`;
}

// ---------------------------------------------------------------- layout
export function layout(c, { title, description, body, robots, ogImage }) {
  const alt = c.alternates();
  const self = c.is404 ? '' : c.absUrl(c.key, c.lang);
  const loc = c.config.languages.find((l) => l.code === c.lang).locale;
  const og = c.config.languages.filter((l) => l.code !== c.lang).map((l) => `<meta property="og:locale:alternate" content="${l.locale}">`).join('');
  const consentData = JSON.stringify(c.consentPayload());
  const ld = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: c.config.company.name, alternateName: c.config.company.brand, url: c.config.origin + '/',
    email: c.config.company.email, slogan: c.t.ui.footer.tagline,
  };
  return `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${robots ? `<meta name="robots" content="${robots}">` : ''}
${self ? `<link rel="canonical" href="${self}">` : ''}
${alt}
<meta name="theme-color" content="#FFFFFF">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ConsultAxis">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${self ? `<meta property="og:url" content="${self}">` : ''}
<meta property="og:locale" content="${loc}">${og}
${ogImage ? `<meta property="og:image" content="${ogImage}">\n<meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/geist-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${c.asset('/assets/css/site.css')}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script src="${c.asset('/assets/js/site.js')}" defer></script>
<script src="${c.asset('/assets/js/consent.js')}" defer></script>
</head>
<body>
${header(c)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(c)}
<script type="application/json" id="consent-config">${consentData.replace(/</g, '\\u003c')}</script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- shared blocks
const crumbs = (c, trail) => `<nav class="crumbs" aria-label="${esc(c.t.ui.breadcrumb)}"><ol>${trail.map(([k, label], i) => i === trail.length - 1
  ? `<li><span aria-current="page">${esc(label)}</span></li>`
  : `<li><a href="${c.url(k)}">${esc(label)}</a></li>`).join('')}</ol></nav>`;

function hero(c, { kicker, title, sub, lede, slot, crumbs: trail, actions = true, home = false, pos = '', cta }) {
  const label = (cta && cta.hero) || c.t.ui.ctaPrimary;
  const primary = `<a class="btn" href="${contactHref(c, cta && cta.area)}"><span class="btn__label">${esc(label)}</span>${arrow(c)}</a>`;
  const secondary = home ? `<a class="link-arrow" href="#divisions">${esc(c.t.ui.ctaServices)}${arrow(c)}</a>` : '';
  return `<section class="hero g-light${home ? ' hero--home' : ''}" aria-labelledby="h1">
  ${field('hero')}
  <div class="wrap">
    <div class="hero__copy">
      ${trail ? crumbs(c, trail) : ''}
      ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
      <h1 id="h1">${esc(title)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</h1>
      ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
      ${actions ? `<div class="actions">${primary}${secondary}</div>` : ''}
    </div>
    <div class="hero__media"><span class="hero__origin" aria-hidden="true"></span><div class="frame${pos ? ' ' + pos : ''}">${c.img(slot, { sizes: '(min-width: 1024px) 42vw, 100vw', eager: true })}</div></div>
  </div>
</section>`;
}

const steps = (c, items) => `<ol class="steps">${items.map((s, i) => `<li><span class="steps__n tabular">${String(i + 1).padStart(2, '0')}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`;

const approach = (c, ground = 'g-grey', title = c.t.common.approachTitle, items = c.t.common.approach) => `<section class="section ${ground}" aria-labelledby="approach">
  <div class="wrap">
    <div class="head"><h2 id="approach">${esc(title)}</h2></div>
    ${steps(c, items)}
  </div>
</section>`;

const checks = (c, items, cls = '') => `<ul class="checks ${cls}">${items.map((i) => `<li>${c.icon('check')}${esc(i)}</li>`).join('')}</ul>`;

function closing(c, cta) {
  const base = c.t.common.close;
  const k = { ...base, ...((cta && cta.close) || {}) };
  const button = (cta && cta.close && cta.close.button) || c.t.ui.ctaPrimary;
  const mail = c.config.company.email;
  return `<section class="section close g-white" aria-labelledby="close">
  <div class="wrap">
    <div class="close__card">
      ${field('card')}
      <div class="close__copy"><h2 id="close">${esc(k.title)}</h2><p>${esc(k.text)}</p></div>
      <div class="close__act">
        <a class="btn" href="${contactHref(c, cta && cta.area)}"><span class="btn__label">${esc(button)}</span>${arrow(c)}</a>
        <p class="close__mail">${esc(base.mailLabel)} <a class="inline-link" href="mailto:${esc(mail)}">${esc(mail)}</a></p>
      </div>
    </div>
  </div>
</section>`;
}

// Fill {short} placeholders in a service page's CTA texts.
const fillCta = (cta, vars) => JSON.parse(JSON.stringify(cta).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]).replace(/"/g, '\\"') : m)));

// Six axes, equal length: every axis of a business counts. Labels are HTML so they stay readable.
function axesDiagram(c) {
  // order clockwise from the top; the two longest labels sit at the top and bottom, where there is room.
  const L = c.t.common.axes; // People, Sales, Organisation, Processes, Profitability, Business development
  const order = [L[5], L[0], L[1], L[4], L[2], L[3]];
  const angles = [-90, -30, 30, 90, 150, 210];
  const pt = (a, r) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r].map((v) => v.toFixed(2));
  const hex = (r) => angles.map((a) => pt(a, r).join(',')).join(' ');
  const lines = angles.map((a) => { const [x, y] = pt(a, 100); return `<line class="draw" pathLength="1" x1="0" y1="0" x2="${x}" y2="${y}"/>`; }).join('');
  const ticks = angles.map((a) => [33, 66].map((r) => { const [x, y] = pt(a, r); const [dx, dy] = pt(a + 90, 3.2); return `<line x1="${(+x - +dx).toFixed(2)}" y1="${(+y - +dy).toFixed(2)}" x2="${(+x + +dx).toFixed(2)}" y2="${(+y + +dy).toFixed(2)}"/>`; }).join('')).join('');
  // positions (radius 44% of the box) are set in site.css by data-pos, so no inline styles are needed (CSP).
  const labels = angles.map((a, i) => `<span class="axes__label" data-pos="${i}" aria-hidden="true">${esc(order[i])}</span>`).join('');
  return `<figure class="axes" role="img" aria-label="${esc(c.t.common.axesLabel)}" data-draw>
  <svg viewBox="-104 -104 208 208" aria-hidden="true" focusable="false">
    <g fill="none" stroke="currentColor" stroke-opacity=".16" stroke-width="1"><polygon class="draw" pathLength="1" points="${hex(33)}"/><polygon class="draw" pathLength="1" points="${hex(66)}"/><polygon class="draw" pathLength="1" points="${hex(100)}"/></g>
    <g stroke="currentColor" stroke-opacity=".55" stroke-width="1.2">${lines}<g class="fade-in">${ticks}</g></g>
    <g class="axes__core"><polygon class="draw" pathLength="1" points="${hex(72)}" fill="none" stroke="#B69A69" stroke-width="1.6"/><polygon class="fade-in" points="${hex(72)}" fill="#B69A69" fill-opacity=".14"/></g>
    <circle r="5" fill="#B69A69"/>
    <g fill="#B69A69" class="fade-in">${angles.map((a) => { const [x, y] = pt(a, 100); return `<circle cx="${x}" cy="${y}" r="3.2"/>`; }).join('')}</g>
  </svg>
  ${labels}
</figure>`;
}

// Architectural floor plan drawing for Real Estate Consulting (illustration, not a listing).
const floorPlan = (label) => `<figure class="plan" role="img" aria-label="${esc(label)}" data-draw>
<svg viewBox="-44 -44 688 508" aria-hidden="true" focusable="false">
  <g fill="none" stroke="#B69A69" stroke-width="1">
    <line x1="20" y1="-22" x2="580" y2="-22"/><line x1="20" y1="-30" x2="20" y2="-14"/><line x1="330" y1="-30" x2="330" y2="-14"/><line x1="580" y1="-30" x2="580" y2="-14"/>
    <line x1="-22" y1="20" x2="-22" y2="400"/><line x1="-30" y1="20" x2="-14" y2="20"/><line x1="-30" y1="250" x2="-14" y2="250"/><line x1="-30" y1="400" x2="-14" y2="400"/>
    <line x1="602" y1="20" x2="602" y2="400" stroke-dasharray="2 5"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-linecap="square">
    <path class="draw" pathLength="1" d="M20 20 H580 V400 H20 Z" stroke-width="9"/>
    <g stroke-width="4">
      <path class="draw" pathLength="1" d="M330 20 V150 M330 190 V250"/>
      <path class="draw" pathLength="1" d="M20 250 H200 M240 250 H330"/>
      <path class="draw" pathLength="1" d="M330 210 H420 M460 210 H580"/>
      <path class="draw" pathLength="1" d="M440 210 V300 M440 340 V400"/>
      <path class="draw" pathLength="1" d="M330 250 V400"/>
    </g>
    <g stroke-width="1.2" stroke-opacity=".7" class="fade-in">
      <path d="M330 150 A40 40 0 0 1 370 190"/><line x1="330" y1="190" x2="370" y2="190"/>
      <path d="M200 250 A40 40 0 0 0 240 290"/><line x1="240" y1="250" x2="240" y2="290"/>
      <path d="M420 210 A40 40 0 0 0 460 250"/><line x1="460" y1="210" x2="460" y2="250"/>
      <path d="M440 300 A40 40 0 0 1 480 340"/><line x1="440" y1="340" x2="480" y2="340"/>
    </g>
  </g>
  <g fill="#FFFFFF" stroke="currentColor" stroke-width="1.2" class="fade-in">
    <rect x="80" y="15.5" width="130" height="9"/><rect x="400" y="15.5" width="120" height="9"/>
    <rect x="15.5" y="290" width="9" height="80"/><rect x="575.5" y="60" width="9" height="100"/><rect x="100" y="395.5" width="150" height="9"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="1.2" stroke-opacity=".38" class="fade-in">
    <rect x="60" y="70" width="150" height="58" rx="6"/><rect x="60" y="70" width="150" height="16" rx="4"/>
    <circle cx="255" cy="175" r="34"/>
    <rect x="410" y="48" width="140" height="110" rx="4"/><rect x="418" y="56" width="56" height="26" rx="4"/><rect x="484" y="56" width="56" height="26" rx="4"/>
    <path d="M36 270 V384 H160 V362 H58 V270 Z"/>
    <rect x="470" y="352" width="96" height="38" rx="10"/>
    <circle cx="540" cy="250" r="14"/>
  </g>
</svg>
</figure>`;

// ---------------------------------------------------------------- pages
export const pages = {
  home(c) {
    const p = c.t.pages.home;
    const areas = c.config.serviceAreas.map((k) => {
      const a = c.t.pages.areas[k];
      return `<li><a href="${c.url(k)}"><span class="index__letter">${a.letter}</span><span class="index__title">${esc(a.title)}</span>${c.icon('arrow-right', 'index__arrow')}<span class="index__text">${esc(a.objective)}</span></a></li>`;
    }).join('');
    const body = `
${hero(c, { kicker: p.hero.kicker, title: p.hero.title, lede: p.hero.lede, slot: 'home-hero', home: true, cta: p.cta })}

<section class="section g-grey" id="divisions" aria-labelledby="div-h">
  <div class="wrap">
    <div class="head"><h2 id="div-h">${esc(p.divisions.title)}</h2><p class="lede">${esc(p.divisions.intro)}</p></div>
    <div class="divisions">
      <a class="panel-link" href="${c.url('business')}">
        <div class="frame frame--r32">${c.img('home-business', { sizes: '(min-width: 768px) 50vw, 100vw' })}</div>
        <div class="panel-link__body"><h3>${esc(p.divisions.business.title)}</h3><p>${esc(p.divisions.business.text)}</p><ul class="focus" aria-label="${esc(p.divisions.focusLabel)}">${p.divisions.business.focus.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><span class="link-arrow">${esc(p.divisions.business.link)}${arrow(c)}</span></div>
      </a>
      <a class="panel-link" href="${c.url('realestate')}">
        <div class="frame frame--r32">${c.img('home-realestate', { sizes: '(min-width: 768px) 50vw, 100vw' })}</div>
        <div class="panel-link__body"><h3>${esc(p.divisions.realestate.title)}</h3><p>${esc(p.divisions.realestate.text)}</p><ul class="focus" aria-label="${esc(p.divisions.focusLabel)}">${p.divisions.realestate.focus.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><span class="link-arrow">${esc(p.divisions.realestate.link)}${arrow(c)}</span></div>
      </a>
    </div>
  </div>
</section>

<section class="section g-white" aria-labelledby="axes-h">
  <div class="wrap">
    <div class="split split--center">
      <div class="split__a stack"><h2 id="axes-h">${esc(p.axes.title)}</h2><div class="prose">${p.axes.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('')}</div></div>
      <div class="split__b">${axesDiagram(c)}</div>
    </div>
    <div class="statement-block"><p class="statement-block__label">${esc(p.axes.ambitionLabel)}</p><p class="statement">${esc(p.axes.ambition)}</p></div>
  </div>
</section>

<section class="section g-grey" aria-labelledby="bc-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a stack"><h2 id="bc-h">${esc(p.business.title)}</h2><p class="lede">${esc(p.business.lede)}</p><a class="link-arrow" href="${c.url('business')}">${esc(c.t.ui.allBusiness)}${arrow(c)}</a></div>
      <div class="split__b"><ul class="index">${areas}</ul></div>
    </div>
  </div>
</section>

<section class="section g-white" aria-labelledby="re-h">
  <div class="wrap">
    <div class="split split--even split--center">
      <div class="split__a">${floorPlan(c.lang === 'de' ? 'Grundriss einer Wohnung als Planzeichnung' : 'Architectural floor plan of an apartment')}</div>
      <div class="split__b stack">
        <h2 id="re-h">${esc(p.realestate.title)}</h2>
        <p class="lede">${esc(p.realestate.lede)}</p>
        ${checks(c, p.realestate.list)}
        <p class="note">${c.icon('shield-check')}<span>${esc(p.realestate.note)}</span></p>
        <a class="link-arrow" href="${c.url('realestate')}">${esc(p.realestate.link)}${arrow(c)}</a>
      </div>
    </div>
  </div>
</section>

${approach(c)}
${closing(c, p.cta)}`;
    return { body, ogSlot: 'home-hero', ...p.meta };
  },

  business(c) {
    const p = c.t.pages.business;
    const rows = c.config.serviceAreas.map((k) => {
      const a = c.t.pages.areas[k];
      return `<li>
        <div class="rows__head"><span class="rows__letter">${a.letter}</span><h3>${esc(a.title)}</h3><a class="link-arrow" href="${c.url(k)}">${esc(c.t.ui.viewService)}<span class="vh">: ${esc(a.title)}</span>${arrow(c)}</a></div>
        <div class="rows__body">${checks(c, a.services.slice(0, 4), 'checks--soft')}</div>
        <div class="rows__aside"><span class="label">${esc(c.t.ui.objective)}</span><p class="objective">${esc(a.objective)}</p></div>
      </li>`;
    }).join('');
    const body = `
${hero(c, { kicker: p.hero.kicker, title: p.hero.title, lede: p.hero.lede, slot: 'business-hero', crumbs: [['home', c.t.ui.home], ['business', c.t.ui.nav.business]], cta: p.cta })}
<section class="section g-white" aria-labelledby="areas-h">
  <div class="wrap">
    <div class="head"><h2 id="areas-h">${esc(p.areasTitle)}</h2><p class="lede">${esc(p.areasIntro)}</p></div>
    <ul class="rows">${rows}</ul>
  </div>
</section>
${approach(c)}
<section class="section g-white" aria-labelledby="scope-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a"><h2 id="scope-h">${esc(p.scope.title)}</h2></div>
      <div class="split__b stack"><div class="prose">${p.scope.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('')}</div><a class="link-arrow" href="${c.url('partners')}">${esc(p.scope.link)}${arrow(c)}</a></div>
    </div>
  </div>
</section>
${closing(c, p.cta)}`;
    return { body, ogSlot: 'business-hero', ...p.meta };
  },

  service(c) {
    const a = c.t.pages.areas[c.key];
    const s = c.t.pages.service;
    const cta = fillCta(s.cta, { short: a.short });
    const others = c.config.serviceAreas.filter((k) => k !== c.key).map((k) => {
      const o = c.t.pages.areas[k];
      return `<li><a href="${c.url(k)}"><span class="index__letter">${o.letter}</span><span class="index__title">${esc(o.title)}</span>${c.icon('arrow-right', 'index__arrow')}<span class="index__text">${esc(o.objective)}</span></a></li>`;
    }).join('');
    const body = `
${hero(c, { kicker: `${c.t.ui.nav.business} · ${a.letter}`, title: a.title, lede: a.intro, slot: `area-${c.key}`, crumbs: [['home', c.t.ui.home], ['business', c.t.ui.nav.business], [c.key, a.short]], cta })}
<section class="section g-white" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a stack"><h2 id="svc-h">${esc(s.servicesTitle)}</h2><div><span class="label">${esc(c.t.ui.objective)}</span><p class="objective">${esc(a.objective)}</p></div></div>
      <div class="split__b">${checks(c, a.services)}</div>
    </div>
  </div>
</section>
<section class="section g-grey" aria-labelledby="q-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a"><h2 id="q-h">${esc(s.questionsTitle)}</h2></div>
      <div class="split__b"><ol class="questions">${a.questions.map((q, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(q)}</li>`).join('')}</ol></div>
    </div>
  </div>
</section>
<section class="section g-white" aria-labelledby="o-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a stack"><h2 id="o-h">${esc(s.otherTitle)}</h2><a class="link-arrow" href="${c.url('business')}">${esc(c.t.ui.allBusiness)}${arrow(c)}</a></div>
      <div class="split__b"><ul class="index">${others}</ul></div>
    </div>
  </div>
</section>
${closing(c, cta)}`;
    return { body, ogSlot: `area-${c.key}`, ...a.meta };
  },

  realestate(c) {
    const p = c.t.pages.realestate;
    const blocks = p.services.map((s) => `<li>
      <div class="rows__head"><span class="rows__letter">${s.letter}</span><h3>${esc(s.title)}</h3>${s.intro ? `<p class="lede">${esc(s.intro)}</p>` : ''}</div>
      <div class="rows__wide stack">
        ${checks(c, s.items, 'checks--2')}
        ${s.examples ? `<div><span class="label">${esc(s.examplesTitle)}</span><ul class="docs">${s.examples.map((d) => `<li>${c.icon('file-text')}${esc(d)}</li>`).join('')}</ul></div>` : ''}
        ${s.note ? `<p class="note">${c.icon('shield-check')}<span>${esc(s.note)}</span></p>` : ''}
      </div>
    </li>`).join('');
    const body = `
${hero(c, { kicker: p.hero.kicker, title: p.hero.title, sub: p.hero.subtitle, lede: p.hero.lede, slot: 'realestate-hero', crumbs: [['home', c.t.ui.home], ['realestate', c.t.ui.nav.realestate]], cta: p.cta })}
<section class="section g-white" aria-labelledby="concept-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a stack"><h2 id="concept-h">${esc(p.concept.title)}</h2><div class="prose">${p.concept.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('')}</div></div>
      <div class="split__b"><div class="panel"><h3>${esc(p.concept.listTitle)}</h3>${checks(c, c.t.pages.home.realestate.list)}</div></div>
    </div>
  </div>
</section>
<section class="section g-grey" aria-labelledby="res-h">
  <div class="wrap">
    <div class="head"><h2 id="res-h">${esc(p.servicesTitle)}</h2></div>
    <ul class="rows">${blocks}</ul>
  </div>
</section>
<section class="section g-white" aria-labelledby="aud-h">
  <div class="wrap">
    <div class="split split--even split--center">
      <div class="split__a"><div class="frame frame--r45">${c.img('realestate-detail', { sizes: '(min-width: 1024px) 45vw, 100vw' })}</div></div>
      <div class="split__b stack">
        <h2 id="aud-h">${esc(p.audience.title)}</h2>
        <ul class="ticks">${p.audience.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        <p class="note">${c.icon('users')}<span>${esc(p.audience.note)}</span></p>
      </div>
    </div>
  </div>
</section>
<section class="section g-grey" aria-labelledby="plan-h">
  <div class="wrap">
    <div class="split split--even split--center">
      <div class="split__a stack"><h2 id="plan-h">${esc(p.approachTitle)}</h2>${steps(c, p.approach).replace('class="steps"', 'class="steps steps--v"')}</div>
      <div class="split__b">${floorPlan(c.lang === 'de' ? 'Grundriss einer Wohnung als Planzeichnung' : 'Architectural floor plan of an apartment')}</div>
    </div>
  </div>
</section>
<section class="section g-white" aria-labelledby="lim-h">
  <div class="wrap">
    <div class="limits">
      <div class="limits__head">${c.icon('scale')}<h2 id="lim-h">${esc(p.limits.title)}</h2></div>
      <div class="limits__body">
        <p class="objective">${esc(p.limits.intro)}</p>
        <ul class="checks checks--2 checks--x">${p.limits.items.map((i) => `<li>${c.icon('x')}${esc(i)}</li>`).join('')}</ul>
        <div class="prose">${p.limits.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('')}</div>
      </div>
    </div>
  </div>
</section>
${closing(c, p.cta)}`;
    return { body, ogSlot: 'realestate-hero', ...p.meta };
  },

  about(c) {
    const p = c.t.pages.about;
    const body = `
${hero(c, { kicker: p.hero.kicker, title: p.hero.title, lede: p.hero.lede, slot: 'about-hero', crumbs: [['home', c.t.ui.home], ['about', c.t.ui.nav.about]], cta: p.cta })}
<section class="section g-white" aria-labelledby="story-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a"><h2 id="story-h">${esc(p.story.title)}</h2></div>
      <div class="split__b"><div class="prose">${p.story.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('')}</div></div>
    </div>
    <div class="statement-block"><p class="statement-block__label">ConsultAxis</p><p class="statement">${esc(p.story.message)}</p></div>
  </div>
</section>
<section class="section g-grey" aria-labelledby="name-h">
  <div class="wrap">
    <div class="split split--center">
      <div class="split__a stack"><h2 id="name-h">${esc(p.name.title)}</h2><p class="prose">${esc(p.name.text)}</p></div>
      <div class="split__b">${axesDiagram(c)}</div>
    </div>
  </div>
</section>
<section class="section g-white" aria-labelledby="pr-h">
  <div class="wrap">
    <div class="head"><h2 id="pr-h">${esc(p.principles.title)}</h2></div>
    <dl class="defs">${p.principles.items.map((i) => `<div><dt>${esc(i.title)}</dt><dd>${esc(i.text)}</dd></div>`).join('')}</dl>
  </div>
</section>
${approach(c)}
${closing(c, p.cta)}`;
    return { body, ogSlot: 'about-hero', ...p.meta };
  },

  industries(c) {
    const p = c.t.pages.industries;
    const re = c.t.pages.realestate.audience;
    const body = `
${hero(c, { kicker: p.hero.kicker, title: p.hero.title, lede: p.hero.lede, slot: 'industries-hero', crumbs: [['home', c.t.ui.home], ['industries', c.t.ui.nav.industries]], cta: p.cta })}
<section class="section g-white" aria-labelledby="bi-h">
  <div class="wrap">
    <div class="head"><h2 id="bi-h">${esc(p.businessTitle)}</h2><p class="lede">${esc(p.businessIntro)}</p></div>
    <ul class="groups">${p.groups.map((g) => `<li><h3>${esc(g.title)}</h3><p>${esc(g.text)}</p></li>`).join('')}</ul>
    <p class="actions mt-6"><a class="link-arrow" href="${c.url('business')}">${esc(c.t.ui.allBusiness)}${arrow(c)}</a></p>
  </div>
</section>
<section class="section g-grey" aria-labelledby="ri-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a stack"><h2 id="ri-h">${esc(p.realestateTitle)}</h2><p class="lede">${esc(p.realestateIntro)}</p><a class="link-arrow" href="${c.url('realestate')}">${esc(c.t.pages.home.realestate.link)}${arrow(c)}</a></div>
      <div class="split__b"><ul class="ticks">${re.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>
    </div>
  </div>
</section>
${closing(c, p.cta)}`;
    return { body, ogSlot: 'industries-hero', ...p.meta };
  },

  partners(c) {
    const p = c.t.pages.partners;
    const body = `
${hero(c, { kicker: p.hero.kicker, title: p.hero.title, lede: p.hero.lede, slot: 'partners-hero', crumbs: [['home', c.t.ui.home], ['partners', c.t.ui.nav.partners]], actions: false })}
<section class="section g-white" aria-labelledby="net-h">
  <div class="wrap">
    <div class="split">
      <div class="split__a stack"><h2 id="net-h">${esc(p.network.title)}</h2><div class="prose">${p.network.paragraphs.map((x) => `<p>${esc(x)}</p>`).join('')}</div></div>
      <div class="split__b stack"><span class="label">${esc(p.network.areasTitle)}</span><ul class="ticks">${p.network.areas.map((i) => `<li>${esc(i)}</li>`).join('')}</ul><p class="note">${c.icon('handshake')}<span>${esc(p.network.confirmed)}</span></p></div>
    </div>
  </div>
</section>
${closing(c, { area: 'partnership', close: { title: p.join.title, text: p.join.text, button: p.join.button } })}`;
    return { body, ogSlot: 'partners-hero', ...p.meta };
  },

  contact(c) {
    const p = c.t.pages.contact;
    const f = p.form;
    const co = c.config.company;
    const areaOpts = `<option value="" selected>${esc(f.areaPlaceholder)}</option>${['business', 'realestate', 'partnership', 'other'].map((k) => `<option value="${k}">${esc(f.areaOptions[k])}</option>`).join('')}`;
    const topics = ['selling', 'buying', 'market', 'documents'].map((k) => `<label><input type="radio" name="topic" value="${k}"><span>${esc(f.topics[k])}</span></label>`).join('');
    const req = '<span class="req" aria-hidden="true"> *</span>';
    const opt = ` <span class="opt">(${esc(f.optional)})</span>`;
    const body = `
<section class="contact-hero g-light is-grey" aria-labelledby="h1">
  ${field('hero')}
  <div class="wrap">
    <div class="contact-hero__copy">
      ${crumbs(c, [['home', c.t.ui.home], ['contact', c.t.ui.nav.contact]])}
      <p class="kicker">${esc(p.hero.kicker)}</p>
      <h1 id="h1">${esc(p.hero.title)}</h1>
      <p class="lede">${esc(p.hero.lede)}</p>
      <div class="direct">
        <h2>${esc(p.direct.title)}</h2>
        <a href="mailto:${esc(co.email)}">${c.icon('mail')}<span>${esc(co.email)}</span></a>
        ${co.phone ? `<a href="tel:${esc(co.phone.replace(/[^+\d]/g, ''))}">${c.icon('phone')}<span>${esc(co.phone)}</span></a>` : ''}
        ${address(c)}
      </div>
    </div>
    <div class="contact-hero__form" id="form">
      <form class="form-card" action="/api/contact.php" method="post" novalidate data-contact-form
        data-msg-name="${esc(f.errors.name)}" data-msg-email="${esc(f.errors.email)}" data-msg-message="${esc(f.errors.message)}"
        data-msg-sending="${esc(f.sending)}" data-msg-success="${esc(f.success)}" data-msg-error="${esc(f.error)}">
        <h2>${esc(f.title)}</h2>
        <p class="req-note">${esc(f.requiredNote)}</p>
        <input type="hidden" name="lang" value="${c.lang}">
        <input type="hidden" name="ts" value="" data-ts>
        <div class="hp" aria-hidden="true"><label for="f-website">${esc(f.honeypot)}</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="fields">
          <div class="field"><label for="f-name">${esc(f.name)}${req}</label><input id="f-name" name="name" type="text" required maxlength="200" autocomplete="name" aria-describedby="e-name"><p class="field__error" id="e-name" aria-live="polite"></p></div>
          <div class="field"><label for="f-company">${esc(f.company)}${opt}</label><input id="f-company" name="company" type="text" maxlength="200" autocomplete="organization"></div>
          <div class="field"><label for="f-email">${esc(f.email)}${req}</label><input id="f-email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email" aria-describedby="e-email"><p class="field__error" id="e-email" aria-live="polite"></p></div>
          <div class="field"><label for="f-phone">${esc(f.phone)}${opt}</label><input id="f-phone" name="phone" type="tel" maxlength="50" autocomplete="tel" inputmode="tel"></div>
          <div class="field field--full"><label for="f-area">${esc(f.area)}${opt}</label><select id="f-area" name="area">${areaOpts}</select></div>
          <fieldset class="choice field--full" data-topic><legend>${esc(f.topicLegend)}${opt}</legend><div class="choice__opts">${topics}</div></fieldset>
          <div class="field field--full"><label for="f-message">${esc(f.message)}${req}</label><textarea id="f-message" name="message" required maxlength="5000" rows="6" aria-describedby="e-message"></textarea><p class="field__error" id="e-message" aria-live="polite"></p></div>
        </div>
        <div class="form-foot">
          <p class="form-privacy">${esc(f.privacy)} <a href="${c.url('privacy')}">${esc(f.privacyLink)}</a>.</p>
          <div><button class="btn" type="submit"><span class="btn__label">${esc(f.submit)}</span>${arrow(c)}</button></div>
          <p class="form-status" role="status" aria-live="polite"></p>
        </div>
      </form>
    </div>
  </div>
</section>`;
    return { body, ...p.meta };
  },

  thanks(c) {
    const p = c.t.pages.thanks;
    return { body: messagePage(c, p.title, p.text, 'home', p.back), robots: 'noindex, follow', ...p.meta };
  },

  sendError(c) {
    const p = c.t.pages.sendError;
    return { body: messagePage(c, p.title, p.text, 'contact', p.back), robots: 'noindex, follow', ...p.meta };
  },

  imprint(c) { return legalPage(c, 'imprint'); },
  privacy(c) { return legalPage(c, 'privacy'); },
};

function messagePage(c, title, text, backKey, back) {
  return `<section class="message g-light" aria-labelledby="h1">${field('hero')}<div class="wrap">
    <h1 id="h1">${esc(title)}</h1><p>${esc(text)}</p>
    <div class="actions"><a class="link-arrow" href="${c.url(backKey)}">${esc(back)}${arrow(c)}</a></div>
  </div></section>`;
}

function legalPage(c, key) {
  const p = c.t.pages[key];
  const html = c.legal(key);
  const draft = c.lang === 'de'
    ? 'Entwurf zur rechtlichen Prüfung. Markierte Felder müssen vor der Veröffentlichung mit geprüften Angaben ersetzt werden; die endgültige Fassung wird vor dem Livegang rechtlich geprüft.'
    : 'Draft for legal review. Highlighted fields must be replaced with verified details before publication; the final wording will be legally reviewed before launch.';
  const body = `<section class="page-head g-light is-grey" aria-labelledby="h1">${field('band')}<div class="wrap">
    ${crumbs(c, [['home', c.t.ui.home], [key, p.title]])}
    <h1 id="h1">${esc(p.title)}</h1>
  </div></section>
  <section class="section g-white"><div class="wrap"><article class="legal">
    ${c.config.legalDraft !== false ? `<p class="draft-note" data-launch-blocker="legal-draft">${c.icon('file-text')}<span>${esc(draft)}</span></p>` : ''}
    ${html}
  </article></div></section>`;
  return { body, ...p.meta };
}

// The 404 page is served for every language, so it carries both.
export function notFound(c, all) {
  const de = all.de.pages.notFound; const en = all.en.pages.notFound;
  return `<section class="message g-light" aria-labelledby="h1">${field('hero')}<div class="wrap">
    <h1 id="h1">${esc(de.title)}</h1><p>${esc(de.text)}</p>
    <div class="actions"><a class="link-arrow" href="/de/">${esc(de.back)}${arrow(c)}</a></div>
    <div class="message__alt" lang="en"><p>${esc(en.title)}. ${esc(en.text)}</p><div class="actions"><a class="link-arrow" href="/en/">${esc(en.back)}${arrow(c)}</a></div></div>
  </div></section>`;
}
