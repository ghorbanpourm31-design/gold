# ConsultAxis website

Bilingual (German / English) website of **ConsultAxis UG (haftungsbeschränkt)**. *Success Along Every Axis.*

**This repository root is the finished website.** Deploy it as it is: `index.html` sends visitors to `/de/` (German, primary) and `/en/` is the English version.

| Path | What it is |
|---|---|
| `index.html`, `404.html`, `de/`, `en/`, `assets/`, `api/`, `sitemap.xml`, `robots.txt`, `favicon.svg` | The built website (generated, do not edit by hand) |
| `_source/` | The project: content, templates, scripts and documentation. Edit here, then rebuild. |
| `wrangler.jsonc`, `.assetsignore`, `_headers`, `_redirects` | Cloudflare deployment (Workers static assets / Pages) |
| `.htaccess` | Apache / PHP hosting (HTTPS, redirects, security headers, contact form) |

## Edit and rebuild

```bash
cd _source
npm run build     # writes the website into the repository root
npm run check     # links, headings, hreflang, external requests, launch blockers
npm run serve     # preview with PHP at http://127.0.0.1:8080
```

Read `_source/README.md` for editing content and adding languages, `_source/TECH-INVENTORY.md` for the legal/technical inventory, and `_source/BRIEF-RESPONSE.md` for the open items.

## Deploying

- **Cloudflare Workers / Pages:** connect this repository; no build command, output directory `/` (root). `_source/` and `api/` are excluded by `.assetsignore`. The contact form needs PHP and does not work on Cloudflare.
- **Apache host with PHP (recommended, e.g. a German shared host):** upload the repository root (without `_source/` and `.git/`) to the web root. The contact form works there.
