/* ConsultAxis site script. No third-party code, no cookies, no storage. */
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js'); // line drawings only start hidden when this script can reveal them

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

    // ?area= presets the enquiry type; the five business areas all map to Business Consulting.
    const AREA_ALIAS = { people: 'business', sales: 'business', documents: 'business', operations: 'business', strategy: 'business' };
    let preset = new URLSearchParams(window.location.search).get('area');
    preset = AREA_ALIAS[preset] || preset;
    const areaSel = form.elements.area;
    if (preset && areaSel && [...areaSel.options].some((o) => o.value === preset)) areaSel.value = preset;

    // The property question only appears for Real Estate Consulting.
    const topic = form.querySelector('[data-topic]');
    const syncTopic = () => {
      if (!topic) return;
      const show = areaSel.value === 'realestate';
      topic.hidden = !show;
      if (!show) topic.querySelectorAll('input').forEach((i) => { i.checked = false; });
    };
    if (areaSel) { areaSel.addEventListener('change', syncTopic); syncTopic(); }

    const rules = {
      name: (v) => v.trim().length > 0,
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
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
        form.reset(); stamp(); syncTopic(); tried = false;
      } catch (err) {
        status.dataset.state = 'error'; status.textContent = form.dataset.msgError;
      } finally {
        submit.disabled = false; submit.classList.remove('is-busy'); label.textContent = original;
      }
    });
  }

  /* ======================================================================
     MOTION
     ====================================================================== */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- background: the "axis field" ----------
     A faint grid, gold axes through an origin point, pulses travelling outwards along
     the axes and slow ripple rings. Drawn on a canvas behind the opening section of
     every page and behind each closing card. It pauses off-screen and in hidden tabs;
     with reduced motion it draws a single still frame. */
  const NAVY = '20,43,69', GOLD = '182,154,105';
  function axisField(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const variant = canvas.dataset.field || 'hero';
    const host = canvas.parentElement;
    let bg = 'rgb(255, 255, 255)';
    let w = 0, h = 0, dpr = 1, ox = 0, oy = 0, tx = 0, ty = 0, px = 0, py = 0, running = false, raf = 0, last = 0, t = 0;
    const pulses = [];
    const rnd = (a, b) => a + Math.random() * (b - a);

    function origin() {
      const wide = w >= 1024;
      if (variant === 'card') return [w * 0.82, h * 0.72];
      if (variant === 'band') return [w * 0.86, h * 0.78];
      // the hero photo's origin dot when present, so the drawn axes meet the CSS ones
      const dot = host.querySelector('.hero__origin');
      if (wide && dot && dot.offsetParent) {
        const a = dot.getBoundingClientRect(), b = canvas.getBoundingClientRect();
        return [a.left - b.left + a.width / 2, a.top - b.top + a.height / 2];
      }
      // stacked layout: keep the axes in the bottom-right corner, clear of the text
      return wide ? [w * 0.6, h * 0.8] : [w - 14, h - 28];
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      [ox, oy] = origin(); tx = ox; ty = oy; px = ox; py = oy;
      bg = getComputedStyle(host).backgroundColor || bg;
      if (!running) draw(0);
    }
    function spawn() {
      // direction: one of the four axis rays or the rising diagonal
      const k = Math.floor(Math.random() * 5); // 0-3: the four axis rays, 4: the rising diagonal
      pulses.push({ d: [[1, 0], [-1, 0], [0, -1], [0, 1], null][k], diag: k === 4, s: rnd(0, 40), v: rnd(46, 110) });
    }
    function draw(dt) {
      t += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // follow the pointer gently (critically damped, no overshoot)
      px += (tx - px) * Math.min(1, dt * 2.4); py += (ty - py) * Math.min(1, dt * 2.4);
      const cx = px, cy = py;

      // grid, centred on the origin so it moves with it
      const g = variant === 'card' ? 56 : 64;
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${NAVY},0.05)`;
      ctx.beginPath();
      for (let x = ((cx % g) + g) % g; x < w; x += g) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
      for (let y = ((cy % g) + g) % g; y < h; y += g) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); }
      ctx.stroke();

      // soft glow at the origin
      const R = Math.max(w, h) * 0.55;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      glow.addColorStop(0, `rgba(${GOLD},0.10)`); glow.addColorStop(1, `rgba(${GOLD},0)`);
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

      // ripple rings expanding from the origin
      for (let i = 0; i < 3; i++) {
        const k = ((t / 7 + i / 3) % 1);
        const r = 40 + k * R;
        ctx.strokeStyle = `rgba(${GOLD},${(0.28 * (1 - k)).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }

      // axes with tick marks
      ctx.strokeStyle = `rgba(${GOLD},0.55)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cy + 0.5); ctx.lineTo(w, cy + 0.5); ctx.moveTo(cx + 0.5, 0); ctx.lineTo(cx + 0.5, h); ctx.stroke();
      ctx.strokeStyle = `rgba(${NAVY},0.16)`;
      ctx.beginPath();
      for (let x = cx % 32; x < w; x += 32) { ctx.moveTo(x, cy - 3); ctx.lineTo(x, cy + 4); }
      for (let y = cy % 32; y < h; y += 32) { ctx.moveTo(cx - 3, y); ctx.lineTo(cx + 4, y); }
      ctx.stroke();
      // the rising "growth" diagonal, breathing slowly
      const ang = -0.72 + Math.sin(t * 0.25) * 0.05;
      ctx.strokeStyle = `rgba(${GOLD},0.6)`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R * 2, cy + Math.sin(ang) * R * 2); ctx.stroke();

      // pulses travelling outwards, each with a short fading tail
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.s += p.v * dt;
        const d = p.diag ? [Math.cos(ang), Math.sin(ang)] : p.d;
        const x = cx + d[0] * p.s, y = cy + d[1] * p.s;
        if (x < -20 || x > w + 20 || y < -20 || y > h + 20) { pulses.splice(i, 1); continue; }
        const tail = 46;
        const grad = ctx.createLinearGradient(x - d[0] * tail, y - d[1] * tail, x, y);
        grad.addColorStop(0, `rgba(${GOLD},0)`); grad.addColorStop(1, `rgba(${GOLD},0.9)`);
        ctx.strokeStyle = grad; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - d[0] * tail, y - d[1] * tail); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = `rgba(${GOLD},1)`; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      // the origin itself
      ctx.fillStyle = `rgba(${GOLD},0.95)`; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();

      // fade the field out behind the copy column so text keeps full contrast
      if (variant === 'hero' && w >= 1024) {
        const veil = ctx.createLinearGradient(0, 0, w * 0.55, 0);
        veil.addColorStop(0, bg); veil.addColorStop(0.55, bg.replace('rgb(', 'rgba(').replace(')', ',0.65)')); veil.addColorStop(1, bg.replace('rgb(', 'rgba(').replace(')', ',0)'));
        ctx.fillStyle = veil; ctx.fillRect(0, 0, w * 0.55, h);
      }
    }
    let spawnAt = 0;
    function frame(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (now > spawnAt) { spawn(); spawnAt = now + rnd(380, 900); }
      draw(dt);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduce || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    if (reduce) { t = 2.2; for (let i = 0; i < 6; i++) pulses.push({ d: [[1, 0], [-1, 0], [0, -1], [0, 1]][i % 4], s: 60 + i * 70, v: 0 }); draw(0); return; }
    new ResizeObserver(() => resize()).observe(canvas);
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if (window.matchMedia('(pointer: fine)').matches) {
      host.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        const [bx, by] = origin();
        tx = bx + ((e.clientX - r.left) / r.width - 0.5) * 36;
        ty = by + ((e.clientY - r.top) / r.height - 0.5) * 24;
      });
      host.addEventListener('pointerleave', () => { [tx, ty] = origin(); });
    }
  }
  document.querySelectorAll('canvas[data-field]').forEach(axisField);

  /* ---------- scroll reveals ----------
     Only elements that start below the fold get the hidden state, so nothing visible
     ever blinks. Items in a group arrive 70 ms apart (capped). */
  if (!reduce && 'IntersectionObserver' in window) {
    const groups = [
      '.head > *', '.split__a > :not(ul):not(ol):not(dl)', '.split__b > :not(ul):not(ol):not(dl)',
      '.divisions > *', '.index > li', '.rows > li', '.steps > li', '.groups > li', '.defs > div',
      '.ticks > li', '.questions > li', '.checks > li', '.statement-block > *', '.limits', '.close__card',
      '.docs > li', '.focus > li', '.legal > h2',
    ];
    const fold = window.innerHeight * 0.92;
    const seen = new Set();
    // Clipped elements have no visible area, so an observer could never see them arrive:
    // those are watched through a proxy (their parent) and revealed with it.
    const proxyFor = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        (proxyFor.get(e.target) || [e.target]).forEach((el) => el.classList.add('in'));
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    const watchVia = (el, proxy) => { const list = proxyFor.get(proxy) || []; list.push(el); proxyFor.set(proxy, list); io.observe(proxy); };
    groups.forEach((sel) => {
      document.querySelectorAll(`main ${sel}`).forEach((el) => {
        if (seen.has(el) || el.closest('.hero, .contact-hero, .page-head, .message')) return;
        seen.add(el);
        if (el.getBoundingClientRect().top < fold) return;
        const sibs = [...el.parentElement.children].filter((x) => x.matches(sel));
        const i = Math.min(sibs.indexOf(el), 6);
        el.style.setProperty('--d', `${i * 70}ms`);
        el.classList.add('rv');
        if (!el.matches('.frame, .plan')) io.observe(el);
      });
    });
    // photographs wipe in, line drawings draw themselves
    document.querySelectorAll('main .frame, main .plan').forEach((el) => {
      if (el.closest('.hero') || el.getBoundingClientRect().top < fold) return;
      io.unobserve(el); el.classList.add('rv'); watchVia(el, el.parentElement);
    });
    document.querySelectorAll('main [data-draw]').forEach((el) => {
      if (el.getBoundingClientRect().top < fold) { el.classList.add('in'); return; }
      io.observe(el);
    });
  } else {
    document.querySelectorAll('[data-draw]').forEach((el) => el.classList.add('in'));
  }
})();
