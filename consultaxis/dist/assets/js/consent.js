/* ConsultAxis consent manager (self-hosted, no third party).
   Reads the service list from <script id="consent-config"> (generated from site.config.mjs).
   - No optional services configured: nothing is stored, no banner is shown; "Cookie settings"
     opens an explanation that no cookies are used.
   - Optional services configured: a dialog asks on the first visit with equal "Accept all" and
     "Reject all" buttons; categories are off by default; services load only after consent.
     The choice is stored in localStorage (strictly necessary to remember the consent) together
     with the policy version and a timestamp, and can be changed or withdrawn at any time. */
(() => {
  'use strict';
  const el = document.getElementById('consent-config');
  if (!el) return;
  let cfg;
  try { cfg = JSON.parse(el.textContent); } catch (e) { return; }
  const T = cfg.text || {};
  const services = Array.isArray(cfg.services) ? cfg.services : [];
  const cats = [...new Set(services.map((s) => s.category))];
  const KEY = 'cx-consent';

  const read = () => {
    if (!services.length) return null;
    try { const v = JSON.parse(window.localStorage.getItem(KEY)); return v && v.version === cfg.version ? v : null; } catch (e) { return null; }
  };
  const store = (choices) => {
    const rec = { version: cfg.version, timestamp: new Date().toISOString(), choices };
    try { window.localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) { /* private mode: ask again next time */ }
    return rec;
  };
  const apply = (rec) => {
    services.forEach((s) => {
      if (!rec.choices[s.category] || !s.src || document.querySelector(`script[data-consent-id="${s.id}"]`)) return;
      const sc = document.createElement('script');
      sc.src = s.src; sc.defer = true; sc.dataset.consentId = s.id;
      document.head.appendChild(sc);
    });
    document.dispatchEvent(new CustomEvent('consent:change', { detail: rec }));
  };

  const h = (tag, props = {}, kids = []) => {
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => { if (k === 'text') n.textContent = v; else if (k === 'class') n.className = v; else n.setAttribute(k, v); });
    kids.forEach((k) => k && n.appendChild(k));
    return n;
  };
  const xIcon = () => { const d = document.createElement('span'); d.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'; return d.firstChild; };

  let dlg = null;
  const close = () => { if (dlg && dlg.open) dlg.close(); };

  function render(mode) {
    if (dlg) dlg.remove();
    dlg = h('dialog', { class: 'consent', 'aria-labelledby': 'consent-title' });
    const inner = h('div', { class: 'consent__inner' });
    const privacy = h('a', { href: cfg.privacyUrl, text: T.privacyLink });

    if (!services.length) {
      const x = h('button', { type: 'button', class: 'consent__x', 'aria-label': T.close }, [xIcon()]);
      x.addEventListener('click', close);
      inner.append(h('h2', { id: 'consent-title', text: T.title }), h('p', { text: T.noneTitle }), h('p', { text: T.noneText }), h('p', {}, [privacy]));
      dlg.append(x, inner);
    } else {
      const current = read();
      const boxes = {};
      const list = h('div', { class: 'consent__cats' });
      list.append(h('div', { class: 'consent__cat' }, [h('strong', { text: T.necessary }), h('span', { text: '✓' }), h('p', { text: T.necessaryText })]));
      cats.forEach((cat) => {
        const id = 'consent-' + cat;
        const box = h('input', { type: 'checkbox', id });
        box.checked = !!(current && current.choices[cat]);
        boxes[cat] = box;
        const names = services.filter((s) => s.category === cat).map((s) => `${s.name} (${T.provider}: ${s.provider}; ${T.location}: ${s.location}${s.cookies && s.cookies.length ? '; ' + T.cookies + ': ' + s.cookies.join(', ') : ''}). ${s.purpose || ''}`).join(' ');
        list.append(h('div', { class: 'consent__cat' }, [h('label', { for: id, text: T[cat] || cat }), box, h('p', { text: names })]));
      });
      const decide = (choices) => {
        const prev = read();
        const rec = store(choices);
        close();
        const revoked = prev && Object.keys(prev.choices).some((k) => prev.choices[k] && !choices[k]);
        if (revoked) window.location.reload(); else apply(rec);
      };
      const all = (v) => Object.fromEntries(cats.map((c) => [c, v]));
      const accept = h('button', { type: 'button', class: 'btn btn--equal', text: T.acceptAll });
      const reject = h('button', { type: 'button', class: 'btn btn--equal', text: T.rejectAll });
      accept.addEventListener('click', () => decide(all(true)));
      reject.addEventListener('click', () => decide(all(false)));
      const saveBtn = h('button', { type: 'button', class: 'btn btn--equal', text: T.save });
      saveBtn.addEventListener('click', () => decide(Object.fromEntries(cats.map((c) => [c, boxes[c].checked]))));
      inner.append(h('h2', { id: 'consent-title', text: T.title }), h('p', { text: T.bannerText }));
      if (mode === 'settings') inner.append(list);
      else {
        const more = h('button', { type: 'button', class: 'inline-link', text: T.settings });
        more.addEventListener('click', () => { more.replaceWith(list); });
        inner.append(more);
      }
      inner.append(h('div', { class: 'consent__actions' }, [reject, accept]), h('div', {}, [saveBtn]), h('p', {}, [privacy]));
      dlg.append(inner);
      // Escape must not count as consent: the dialog simply reopens on the next page until a choice is made.
    }
    document.body.appendChild(dlg);
    dlg.addEventListener('close', () => { const opener = document.querySelector('[data-consent-open]'); if (mode === 'settings' && opener) opener.focus(); });
    dlg.showModal();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent-open]');
    if (b) { e.preventDefault(); render('settings'); }
  });

  if (services.length) {
    const rec = read();
    if (rec) apply(rec); else render('banner');
  }
})();
