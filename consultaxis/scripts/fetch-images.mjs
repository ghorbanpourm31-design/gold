#!/usr/bin/env node
// Downloads every photograph in content/images.json ONCE, converts it to WebP in several widths and
// stores it in src/assets/img/ so the live site serves all images itself (no third-party requests).
//   node scripts/fetch-images.mjs [--only home-hero,area-sales] [--force]
// Needs: curl and ffmpeg (with libwebp) on the PATH.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src', 'assets', 'img');
const LOCK = path.join(OUT, 'images.lock.json');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'consultaxis-img-'));
const WIDTHS = [640, 960, 1280, 1920];
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const force = args.includes('--force');

const run = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8' });
for (const tool of ['curl', 'ffmpeg', 'ffprobe']) {
  if (run(tool, ['-version']).error) { console.error(`${tool} is required (install ffmpeg / curl and try again)`); process.exit(1); }
}

const slots = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'images.json'), 'utf8')).slots;
const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : {};
fs.mkdirSync(OUT, { recursive: true });

let ok = 0; const failed = [];
for (const [slot, m] of Object.entries(slots)) {
  if (only && !only.includes(slot)) continue;
  const have = lock[slot] && lock[slot].widths.every((w) => fs.existsSync(path.join(OUT, `${slot}-${w}.webp`)));
  if (have && !force) { ok++; continue; }
  const orig = path.join(TMP, `${slot}.orig`);
  const dl = run('curl', ['-fsSL', '--retry', '2', '--max-time', '180', '-A', 'ConsultAxisWebsiteBuild/1.0 (+https://www.consultaxis.de)', '-o', orig, m.download]);
  if (dl.status !== 0) { failed.push(`${slot}: download failed (${(dl.stderr || '').trim().split('\n').pop()})`); continue; }
  const probe = run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', orig]);
  const [w, h] = (probe.stdout || '').trim().split(',').map(Number);
  if (!w || !h) { failed.push(`${slot}: not an image`); continue; }
  const widths = WIDTHS.filter((x) => x <= w);
  if (!widths.length) widths.push(w);
  let bad = false;
  for (const x of widths) {
    const r = run('ffmpeg', ['-y', '-loglevel', 'error', '-i', orig, '-vf', `scale=${x}:-2:flags=lanczos`, '-c:v', 'libwebp', '-quality', '78', '-compression_level', '6', '-map_metadata', '-1', path.join(OUT, `${slot}-${x}.webp`)]);
    if (r.status !== 0) { bad = true; failed.push(`${slot}: ffmpeg failed (${(r.stderr || '').trim()})`); break; }
  }
  if (bad) continue;
  lock[slot] = { widths, w, h, ratio: +(w / h).toFixed(4), source: m.download, fetched: new Date().toISOString().slice(0, 10) };
  ok++;
  console.log(`ok  ${slot}  ${w}x${h} -> ${widths.join(', ')}`);
}
fs.writeFileSync(LOCK, JSON.stringify(lock, null, 2) + '\n');
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`${ok} photographs ready${failed.length ? `, ${failed.length} failed:\n  ${failed.join('\n  ')}` : ''}`);
if (failed.length) process.exitCode = 1;
