#!/usr/bin/env node
// ConsultAxis static site build. No dependencies: Node 18+.
//   node build.mjs            -> dist/
// Content:   content/<lang>.json, content/legal/<lang>/*.html, content/images.json
// Config:    site.config.mjs
// Templates: src/templates.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import config from './site.config.mjs';
import { layout, pages, notFound, esc } from './src/templates.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const CONTENT = path.join(ROOT, 'content');

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const copyDir = (from, to, filter = () => true) => {
  if (!fs.existsSync(from)) return;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name); const b = path.join(to, e.name);
    if (e.isDirectory()) copyDir(a, b, filter);
    else if (filter(a)) { fs.mkdirSync(to, { recursive: true }); fs.copyFileSync(a, b); }
  }
};

// ---------------------------------------------------------------- inputs
const langs = config.languages.map((l) => l.code);
const content = Object.fromEntries(langs.map((l) => [l, readJSON(path.join(CONTENT, `${l}.json`))]));
const manifest = readJSON(path.join(CONTENT, 'images.json')).slots;
const lockPath = path.join(SRC, 'assets', 'img', 'images.lock.json');
const lock = fs.existsSync(lockPath) ? readJSON(lockPath) : {};

// icons: inline Lucide SVGs (ISC licence), no icon font, no requests
const icons = {};
for (const f of fs.readdirSync(path.join(SRC, 'assets', 'icons')).filter((f) => f.endsWith('.svg'))) {
  const raw = fs.readFileSync(path.join(SRC, 'assets', 'icons', f), 'utf8');
  icons[f.replace('.svg', '')] = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '').trim();
}
const icon = (name, cls = '') => {
  if (!icons[name]) throw new Error(`icon missing: ${name}`);
  return `<svg class="icon${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
};

// cache-busting hashes
const hash = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(SRC, p.replace(/^\//, '')))).digest('hex').slice(0, 10);
const assetHashes = {};
const asset = (p) => `${p}?v=${(assetHashes[p] ||= hash(p))}`;

// ---------------------------------------------------------------- routing
const slug = (key, lang) => {
  const r = config.routes[key];
  if (!r || r[lang] === undefined) throw new Error(`route ${key} has no slug for ${lang}`);
  return r[lang];
};
const urlFor = (key, lang) => `/${lang}/${slug(key, lang) ? slug(key, lang) + '/' : ''}`;
const absUrl = (key, lang) => config.origin + urlFor(key, lang);
const templateFor = (key) => (config.serviceAreas.includes(key) ? 'service' : key);

// ---------------------------------------------------------------- legal text tokens
const TODO = {
  de: {
    'company.street': 'STRASSE UND HAUSNUMMER (ladungsfähige Anschrift, kein Postfach)', 'company.postcode': 'PLZ', 'company.city': 'ORT',
    'company.managingDirectors': 'VOR- UND NACHNAME DER GESCHÄFTSFÜHRUNG', 'company.phone': 'TELEFONNUMMER',
    'company.registerCourt': 'REGISTERGERICHT (Amtsgericht …)', 'company.registerNumber': 'HRB-NUMMER',
    'company.vatId': 'USt-IdNr., falls erteilt, sonst Zeile entfernen', 'company.businessId': 'W-IdNr., falls erteilt, sonst Zeile entfernen',
    'hosting.provider': 'NAME UND ANSCHRIFT DES HOSTINGANBIETERS', 'hosting.serverLocation': 'SERVERSTANDORT (z. B. Deutschland)',
    'hosting.logRetentionDays': 'ANZAHL', 'mail.provider': 'E-MAIL-ANBIETER FÜR info@consultaxis.de', 'mail.location': 'VERARBEITUNGSORT',
  },
  en: {
    'company.street': 'STREET AND NUMBER (address for service, no PO box)', 'company.postcode': 'POSTCODE', 'company.city': 'CITY',
    'company.managingDirectors': 'FULL NAME(S) OF MANAGING DIRECTOR(S)', 'company.phone': 'TELEPHONE NUMBER',
    'company.registerCourt': 'REGISTER COURT (Amtsgericht …)', 'company.registerNumber': 'HRB NUMBER',
    'company.vatId': 'VAT ID if issued, otherwise remove line', 'company.businessId': 'W-IdNr. if issued, otherwise remove line',
    'hosting.provider': 'NAME AND ADDRESS OF HOSTING PROVIDER', 'hosting.serverLocation': 'SERVER LOCATION (e.g. Germany)',
    'hosting.logRetentionDays': 'NUMBER', 'mail.provider': 'EMAIL PROVIDER FOR info@consultaxis.de', 'mail.location': 'PROCESSING LOCATION',
  },
};
const todos = []; // [page, field]
function resolveTokens(html, lang, pageId) {
  return html.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
    if (expr.startsWith('todo:')) { todos.push([pageId, expr.slice(5)]); return `<mark class="todo" data-todo="note">[${esc(expr.slice(5))}]</mark>`; }
    if (expr.startsWith('url:')) return urlFor(expr.slice(4), lang);
    if (expr === 'date') return new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    let v = expr.split('.').reduce((o, k) => (o == null ? o : o[k]), config);
    if (v && typeof v === 'object') v = v[lang];
    if (v === undefined) throw new Error(`unknown token {{${expr}}} in ${pageId}`);
    if (v === '' || v === null) {
      todos.push([pageId, expr]);
      return `<mark class="todo" data-todo="${esc(expr)}">[${esc((TODO[lang] && TODO[lang][expr]) || expr)}]</mark>`;
    }
    const [grp, field] = expr.split('.');
    if (grp === 'company' && !config.companyVerified && (config.verifyFields || []).includes(field)) {
      todos.push([pageId, `verify ${expr}`]);
      const hint = lang === 'de' ? 'aus öffentlichem Verzeichnis, mit aktuellem Registerauszug prüfen' : 'from a public listing, verify against a current register extract';
      return `<mark class="todo" data-todo="verify ${esc(expr)}" title="${hint}">${esc(v)} <small>(${lang === 'de' ? 'prüfen' : 'verify'})</small></mark>`;
    }
    return esc(v);
  });
}

// ---------------------------------------------------------------- images
const missingImages = new Set();
const placeholder = () => `<div class="ph" aria-hidden="true"><svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"><path d="M0 225 H400 M100 0 V300" /><path d="M0 75 H400 M200 0 V300 M300 0 V300 M0 150 H400" stroke-opacity=".35"/><path d="M100 225 L320 30" /><circle cx="100" cy="225" r="5" fill="currentColor"/></g></svg></div>`;
function imgTag(slot, lang, used, { sizes = '100vw', eager = false } = {}) {
  const m = manifest[slot]; const l = lock[slot];
  if (!m) throw new Error(`image slot not in manifest: ${slot}`);
  if (!l || !l.widths || !l.widths.length || !l.widths.every((w) => fs.existsSync(path.join(SRC, 'assets', 'img', `${slot}-${w}.webp`)))) {
    missingImages.add(slot); return placeholder();
  }
  used.add(slot);
  const ws = [...l.widths].sort((a, b) => a - b);
  const mid = ws.find((w) => w >= 1280) || ws[ws.length - 1];
  const h = Math.round(mid / l.ratio);
  const srcset = ws.map((w) => `/assets/img/${slot}-${w}.webp ${w}w`).join(', ');
  return `<img src="/assets/img/${slot}-${mid}.webp" srcset="${srcset}" sizes="${sizes}" width="${mid}" height="${h}" alt="${esc(m.alt[lang] || m.alt.en)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

// ---------------------------------------------------------------- context
function makeCtx(lang, key, { is404 = false } = {}) {
  const t = content[lang];
  const used = new Set();
  const c = {
    lang, key, t, config, icon, is404, year: new Date().getFullYear(),
    url: (k, l = lang) => urlFor(k, l),
    absUrl: (k, l = lang) => absUrl(k, l),
    asset,
    img: (slot, opts) => imgTag(slot, lang, used, opts),
    used,
    alternates: () => is404 ? '' : [
      ...config.languages.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${absUrl(key, l.code)}">`),
      `<link rel="alternate" hreflang="x-default" href="${absUrl(key, config.defaultLanguage)}">`,
    ].join('\n'),
    legal: (k) => resolveTokens(fs.readFileSync(path.join(CONTENT, 'legal', lang, `${k}.html`), 'utf8'), lang, `${lang}/${k}`),
    consentPayload: () => ({
      version: config.consent.version,
      privacyUrl: urlFor('privacy', lang),
      text: t.ui.consent,
      services: config.consent.services.map((s) => ({ ...s, purpose: s.purpose ? s.purpose[lang] : '' })),
    }),
    creditsHtml: () => {
      if (!used.size) return '';
      const cr = t.ui.credits;
      const items = [...used].map((s) => { const m = manifest[s]; return `<li>${esc(m.alt[lang] || m.alt.en)}: ${esc(m.by)}, <a href="${esc(m.licenceUrl)}" rel="noopener noreferrer">${esc(m.licence)}</a>, <a href="${esc(m.page)}" rel="noopener noreferrer">${esc(cr.source)}</a></li>`; }).join('');
      return `<details class="credits"><summary>${esc(t.ui.footer.credits)}</summary><ul>${items}</ul></details>`;
    },
  };
  return c;
}

// ---------------------------------------------------------------- build
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const report = { pages: [], todos, missingImages: [], gaps: [] };
for (const lang of langs) {
  for (const key of Object.keys(config.routes)) {
    const c = makeCtx(lang, key);
    const tpl = templateFor(key);
    if (!pages[tpl]) throw new Error(`no template for ${key}`);
    const r = pages[tpl](c);
    const ogSlot = r.ogSlot && lock[r.ogSlot] ? `${config.origin}/assets/img/${r.ogSlot}-${[...lock[r.ogSlot].widths].sort((a, b) => a - b).find((w) => w >= 1200) || lock[r.ogSlot].widths[0]}.webp` : '';
    const robots = r.robots || (config.noindex.includes(key) ? 'noindex, follow' : '');
    const html = layout(c, { title: r.title, description: r.description, body: r.body, robots, ogImage: ogSlot });
    const out = path.join(DIST, lang, slug(key, lang), 'index.html');
    write(out, html);
    report.pages.push(path.relative(DIST, out));
  }
}

// 404 (bilingual)
{
  const c = makeCtx(config.defaultLanguage, 'home', { is404: true });
  const body = notFound(c, content);
  write(path.join(DIST, '404.html'), layout(c, { title: `${content.de.pages.notFound.title} | ConsultAxis`, description: content.de.pages.notFound.text, body, robots: 'noindex, follow' }));
}

// root: language entry (the server redirects; this is the fallback)
{
  const alts = config.languages.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${absUrl('home', l.code)}">`).join('\n');
  write(path.join(DIST, 'index.html'), `<!doctype html>
<html lang="${config.defaultLanguage}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ConsultAxis</title>
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=/${config.defaultLanguage}/">
${alts}
<link rel="alternate" hreflang="x-default" href="${absUrl('home', config.defaultLanguage)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
</head>
<body>
<p><a href="/de/">ConsultAxis auf Deutsch</a> · <a href="/en/">ConsultAxis in English</a></p>
</body>
</html>
`);
}

// assets: css, js, fonts, images (icons are inlined above)
copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'), (f) => !f.includes(`${path.sep}icons${path.sep}`) && !f.endsWith('images.lock.json'));
write(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#142B45"/><path d="M8 24 L24 8" stroke="#B69A69" stroke-width="2.2" stroke-linecap="round"/><path d="M16 7 V25 M7 16 H25" stroke="#F4F5F6" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="16" r="2.4" fill="#B69A69"/></svg>`);

// server files
copyDir(path.join(ROOT, 'public'), DIST);
const contactConfig = {
  recipient: config.company.email,
  from: `website@${new URL(config.origin).hostname.replace(/^www\./, '')}`,
  fromName: 'ConsultAxis Website',
  languages: langs,
  redirects: Object.fromEntries(langs.map((l) => [l, { ok: urlFor('thanks', l), error: urlFor('sendError', l), form: urlFor('contact', l) }])),
  areas: ['', 'business', 'realestate', 'partnership', 'other'],
  areaLabels: { '': 'nicht angegeben', ...content.de.pages.contact.form.areaOptions },
  topics: ['', 'selling', 'buying', 'market', 'documents'],
  topicLabels: { '': '-', ...content.de.pages.contact.form.topics },
};
write(path.join(DIST, 'api', 'contact-config.php'), `<?php\n// Generated by build.mjs from site.config.mjs. Do not edit here.\nreturn json_decode(${JSON.stringify(JSON.stringify(contactConfig))}, true);\n`);

// sitemap + robots
const indexable = Object.keys(config.routes).filter((k) => !config.noindex.includes(k));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${indexable.flatMap((k) => langs.map((l) => `  <url>
    <loc>${absUrl(k, l)}</loc>
${langs.map((x) => `    <xhtml:link rel="alternate" hreflang="${x}" href="${absUrl(k, x)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl(k, config.defaultLanguage)}"/>
  </url>`)).join('\n')}
</urlset>
`;
write(path.join(DIST, 'sitemap.xml'), sitemap);
write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${config.origin}/sitemap.xml\n`);

// report
report.missingImages = [...missingImages];
for (const [k, v] of Object.entries(config.company)) if (v === '') report.gaps.push(`company.${k}`);
for (const [k, v] of Object.entries(config.hosting)) if (v === '') report.gaps.push(`hosting.${k}`);
for (const [k, v] of Object.entries(config.mail)) if (v === '') report.gaps.push(`mail.${k}`);
write(path.join(ROOT, 'build-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log(`built ${report.pages.length} pages in ${langs.length} languages -> dist/`);
if (report.missingImages.length) console.log(`photographs not downloaded yet (${report.missingImages.length}): run npm run images`);
if (todos.length) console.log(`legal placeholders still open: ${new Set(todos.map((t) => t[1])).size} fields (see build-report.json)`);
