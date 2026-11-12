// Screenshot + runtime check harness (dev only). Needs Playwright with Chromium.
//   node scripts/shots.mjs [baseUrl] [--pages /de/,/en/kontakt/] [--widths 1440,1024,768,390] [--out shots]
// Reports per page: console errors, CSP violations, horizontal overflow, external requests.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// require() resolves globally installed Playwright, ESM import does not.
const { chromium } = createRequire(import.meta.url)('playwright');

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:/.test(a)) || 'http://127.0.0.1:8080').replace(/\/$/, '');
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const out = opt('out', 'shots');
const widths = opt('widths', '1440,1024,768,390').split(',').map(Number);
const pagesArg = opt('pages', '');
const sitemap = fs.readFileSync(path.join('..', 'sitemap.xml'), 'utf8');
const pages = pagesArg ? pagesArg.split(',') : [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
const full = args.includes('--full');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const problems = [];
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w <= 430 ? 844 : w <= 820 ? 1024 : 900 }, deviceScaleFactor: 1 });
  for (const p of pages) {
    const page = await ctx.newPage();
    const issues = [];
    page.on('console', (m) => { if (m.type() === 'error') issues.push('console: ' + m.text()); });
    page.on('pageerror', (e) => issues.push('pageerror: ' + e.message));
    page.on('request', (r) => { const u = new URL(r.url()); if (u.origin !== new URL(base).origin && !r.url().startsWith('data:')) issues.push('external request: ' + r.url()); });
    const res = await page.goto(base + p, { waitUntil: 'networkidle' });
    if (!res || res.status() >= 400) issues.push('status ' + (res && res.status()));
    const store = await page.evaluate(() => ({ cookie: document.cookie, local: localStorage.length, session: sessionStorage.length }));
    if (store.cookie || store.local || store.session) issues.push('storage used: ' + JSON.stringify(store));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) issues.push(`horizontal overflow ${overflow}px`);
    const name = `${w}-${p.replace(/\//g, '_').replace(/^_|_$/g, '') || 'root'}.png`;
    await page.screenshot({ path: path.join(out, name), fullPage: full });
    if (issues.length) problems.push({ w, p, issues });
    await page.close();
  }
  const jar = await ctx.cookies();
  if (jar.length) problems.push({ w, p: '*', issues: ['cookies set: ' + jar.map((c) => c.name).join(', ')] });
  await ctx.close();
}
await browser.close();
if (problems.length) { console.log(JSON.stringify(problems, null, 2)); process.exitCode = 1; }
else console.log(`ok: ${pages.length} pages x ${widths.length} widths, no errors, no external requests, no cookies or storage, no overflow`);
