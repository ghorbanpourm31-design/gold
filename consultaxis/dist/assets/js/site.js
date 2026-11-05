/* ConsultAxis site script. No third-party code, no cookies, no storage. */
(() => {
  'use strict';
  const doc = document.documentElement;

  /* ---------- full-screen menu ---------- */
  const btn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  if (btn && menu) {
    const closeBtn = menu.querySelector('.menu__close');
    const outside = [document.querySelector('.site-header'), document.getElementById('main'), document.querySelector('.site-footer')].filter(Boolean);
    let last = null;
    const focusables = () => [...menu.querySelectorAll('a[href], button:not([disabled])')];
    const setOpen = (open, restore = true) => {
      menu.classList.toggle('is-open', open);
      doc.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      outside.forEach((el) => { el.inert = open; });
      if (open) { last = document.activeElement; requestAnimationFrame(() => closeBtn && closeBtn.focus()); }
      else if (restore) (last && last.isConnected ? last : btn).focus();
    };
    btn.addEventListener('click', () => setOpen(true));
    closeBtn && closeBtn.addEventListener('click', () => setOpen(false));
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], end = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); }
      else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); }
    });
    menu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) setOpen(false, false); });
    const wide = window.matchMedia('(min-width: 1200px)');
    const onWide = (e) => { if (e.matches && menu.classList.contains('is-open')) setOpen(false, false); };
    wide.addEventListener ? wide.addEventListener('change', onWide) : wide.addListener(onWide);
  }

  /* ---------- contact form (progressive enhancement; works without JS too) ---------- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const ts = form.querySelector('[data-ts]');
    const stamp = () => { if (ts) ts.value = String(Date.now()); };
    stamp();

    const preset = new URLSearchParams(window.location.search).get('area');
    if (preset && form.elements.area && [...form.elements.area.options].some((o) => o.value === preset)) form.elements.area.value = preset;

    const rules = {
      name: (v) => v.trim().length > 0,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      area: (v) => v !== '',
      message: (v) => v.trim().length > 0,
    };
    const msg = (n) => form.dataset['msg' + n.charAt(0).toUpperCase() + n.slice(1)] || '';
    const mark = (n, ok) => {
      const el = form.elements[n]; const out = document.getElementById('e-' + n);
      if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
      if (out) out.textContent = ok ? '' : msg(n);
    };
    const check = (only) => {
      let first = null;
      for (const n of Object.keys(rules)) {
        if (only && only !== n) continue;
        const ok = rules[n](form.elements[n].value || '');
        mark(n, ok);
        if (!ok && !first) first = form.elements[n];
      }
      return first;
    };
    let tried = false;
    const live = (e) => { if (tried && rules[e.target.name]) check(e.target.name); };
    form.addEventListener('input', live);
    form.addEventListener('change', live);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      tried = true;
      const bad = check();
      if (bad) { bad.focus(); return; }
      const submit = form.querySelector('button[type="submit"]');
      const label = submit.querySelector('.btn__label');
      const status = form.querySelector('.form-status');
      const original = label.textContent;
      submit.disabled = true; submit.classList.add('is-busy'); label.textContent = form.dataset.msgSending;
      status.textContent = ''; delete status.dataset.state;
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'send failed');
        status.dataset.state = 'ok'; status.textContent = form.dataset.msgSuccess;
        form.reset(); stamp(); tried = false;
      } catch (err) {
        status.dataset.state = 'error'; status.textContent = form.dataset.msgError;
      } finally {
        submit.disabled = false; submit.classList.remove('is-busy'); label.textContent = original;
        status.focus && status.setAttribute('tabindex', '-1');
      }
    });
  }
})();
