#!/usr/bin/env node
// Launch-readiness check for the built site (run `npm run build` first).
//   node scripts/check.mjs [--strict]   (--strict exits 1 while launch blockers remain)
// Checks: internal links resolve, no external resources (privacy), one h1 + title + description
// per page, hreflang pairs, remaining legal placeholders, missing photographs, config gaps.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../site.config.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.resolve(ROOT, '..'); // the built site lives in the repository root
const strict = process.argv.includes('--strict');
if (!fs.existsSync(DIST)) { console.error('site not built: run npm run build'); process.exit(1); }

const html = [];
const SKIP = new Set(['_source', '.git', 'node_modules']);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p); } else if (p.endsWith('.html')) html.push(p); });
walk(DIST);

const errors = []; const blockers = []; const origin = new URL(config.origin);
const resolves = (u) => {
  const clean = u.split('#')[0].split('?')[0];
  if (!clean) return true;
  let p = path.join(DIST, decodeURIComponent(clean));
  if (clean.endsWith('/')) p = path.join(p, 'index.html');
  return fs.existsSync(p);
};

for (const file of html) {
  const rel = '/' + path.relative(DIST, file).replace(/\\/g, '/');
  const s = fs.readFileSync(file, 'utf8');
  const isPage = !rel.endsWith('/404.html') && rel !== '/index.html';
  if (!/<html lang="[a-z]{2}"/.test(s)) errors.push(`${rel}: missing <html lang>`);
  if (!/<title>[^<]+<\/title>/.test(s)) errors.push(`${rel}: missing <title>`);
  if (isPage && !/<meta name="description" content="[^"]{30,}"/.test(s)) errors.push(`${rel}: missing or short meta description`);
  const h1 = (s.match(/<h1[\s>]/g) || []).length;
  if (isPage && h1 !== 1) errors.push(`${rel}: ${h1} <h1> elements`);
  if (isPage && !/noindex/.test(s)) {
    const alts = (s.match(/rel="alternate" hreflang=/g) || []).length;
    if (alts !== config.languages.length + 1) errors.push(`${rel}: ${alts} hreflang links, expected ${config.languages.length + 1}`);
  }
  // resources that load automatically must be first-party
  for (const m of s.matchAll(/<(script|img|link|iframe|source|video|audio)\b[^>]*?\s(src|href|srcset)="([^"]+)"/g)) {
    const [, tag, attr, val] = m;
    if (tag === 'link' && !/rel="(stylesheet|preload|icon|modulepreload|manifest)"/.test(m[0])) continue;
    for (const u of val.split(',').map((x) => x.trim().split(' ')[0])) {
      if (/^https?:\/\//.test(u) && new URL(u).host !== origin.host) errors.push(`${rel}: external ${tag} ${u}`);
      else if (u.startsWith('/') && !resolves(u)) errors.push(`${rel}: broken ${tag} ${attr} ${u}`);
    }
  }
  for (const m of s.matchAll(/<a\b[^>]*\shref="(\/[^"]*)"/g)) if (!resolves(m[1])) errors.push(`${rel}: broken link ${m[1]}`);
  const todos = (s.match(/<mark class="todo"/g) || []).length;
  if (todos) blockers.push(`${rel}: ${todos} legal placeholder(s) to complete`);
  if (s.includes('data-launch-blocker="legal-draft"')) blockers.push(`${rel}: draft notice still shown (set legalDraft: false in site.config.mjs after the legal review)`);
  const ph = (s.match(/class="ph"/g) || []).length;
  if (ph) blockers.push(`${rel}: ${ph} photograph(s) not downloaded (npm run images)`);
}
for (const f of fs.readdirSync(path.join(DIST, 'assets', 'css'))) {
  const css = fs.readFileSync(path.join(DIST, 'assets', 'css', f), 'utf8');
  for (const m of css.matchAll(/url\(["']?(https?:[^)"']+)/g)) errors.push(`css ${f}: external url ${m[1]}`);
}
for (const [group, obj] of Object.entries({ company: config.company, hosting: config.hosting, mail: config.mail })) {
  for (const [k, v] of Object.entries(obj)) if (v === '') blockers.push(`site.config.mjs: ${group}.${k} is empty`);
}

console.log(`checked ${html.length} HTML files`);
if (errors.length) console.log(`\nERRORS (${errors.length})\n  ` + errors.join('\n  '));
else console.log('no errors: links resolve, no external resources, headings, titles and hreflang complete');
if (blockers.length) console.log(`\nLAUNCH BLOCKERS (${blockers.length})\n  ` + blockers.join('\n  '));
if (errors.length || (strict && blockers.length)) process.exitCode = 1;
