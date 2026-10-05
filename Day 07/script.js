/* NYTA — Day 06 interactions */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Active nav link while scrolling ---------- */
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const sectionsForNav = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sectionsForNav.forEach(s => navObserver.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal, .hero__media');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Stat count-up ---------- */
  const counters = document.querySelectorAll('[data-count][data-suffix]');
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      countObserver.unobserve(el);
      if (reduceMotion) return;
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix;
      const duration = 1400;
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => countObserver.observe(el));

  /* ---------- How it works: image + step carousel ---------- */
  (() => {
    const how = document.querySelector('.how');
    if (!how) return;
    const media = how.querySelector('[data-how-media]');
    const slides = [...how.querySelectorAll('.how__slide')];
    const steps = [...how.querySelectorAll('.step')];
    const bars = [...how.querySelectorAll('.how__bar')];
    const countEl = how.querySelector('[data-how-count]');
    const STEP_MS = 6500;
    let current = 0, elapsed = 0, last = performance.now();
    let hovering = false, visible = false, focusWithin = false;

    // warm the cache so the wipe never shows a half-loaded photo
    slides.forEach(s => { s.loading = 'eager'; if (s.decode) s.decode().catch(() => {}); });

    const fill = (i, p) => bars[i].style.setProperty('--p', p);

    function go(i, { user = false } = {}) {
      const n = steps.length;
      i = (i + n) % n;
      if (i === current && !user) return;
      const back = user && i < current;
      const prev = slides[current];
      slides.forEach(s => s.classList.remove('is-leaving', 'is-active', 'is-back'));
      if (prev !== slides[i]) prev.classList.add('is-leaving');
      void slides[i].offsetWidth;                     // restart the CSS animation
      slides[i].classList.add('is-active');
      if (back) slides[i].classList.add('is-back');
      media.classList.add('is-ready');

      steps.forEach((s, k) => {
        const on = k === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-selected', String(on));
        s.tabIndex = on ? 0 : -1;
      });
      bars.forEach((_, k) => fill(k, k < i ? 1 : 0));
      if (countEl) countEl.textContent = String(i + 1).padStart(2, '0');
      current = i;
      elapsed = 0;
    }

    function tick(now) {
      const dt = Math.min(now - last, 100);
      last = now;
      const running = visible && !hovering && !focusWithin && !document.hidden && !reduceMotion;
      if (running) {
        elapsed += dt;
        fill(current, Math.min(elapsed / STEP_MS, 1));
        if (elapsed >= STEP_MS) go(current + 1);
      }
      requestAnimationFrame(tick);
    }

    // clicks
    steps.forEach((s, i) => s.addEventListener('click', () => go(i, { user: true })));
    bars.forEach((b, i) => b.addEventListener('click', () => go(i, { user: true })));

    // keyboard: arrows / Home / End move between tabs
    how.querySelector('.how__steps').addEventListener('keydown', e => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = null;
      if (e.key in map) next = current + map[e.key];
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = steps.length - 1;
      if (next === null) return;
      e.preventDefault();
      go(next, { user: true });
      steps[current].focus();
    });

    // pause while the visitor is reading or interacting
    [media, how.querySelector('.how__steps')].forEach(el => {
      el.addEventListener('mouseenter', () => { hovering = true; });
      el.addEventListener('mouseleave', () => { hovering = false; });
    });
    how.addEventListener('focusin', () => { focusWithin = true; });
    how.addEventListener('focusout', () => { focusWithin = how.contains(document.activeElement); });

    // swipe the photo on touch screens
    let sx = null, sy = null;
    media.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    media.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = sy = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(current + (dx < 0 ? 1 : -1), { user: true });
    });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.35 }).observe(how);

    go(0, { user: true });
    // Figma shows step 1 already partly filled (72px of the first bar)
    elapsed = reduceMotion ? STEP_MS : STEP_MS * 0.16;
    fill(0, reduceMotion ? 1 : 0.16);
    requestAnimationFrame(tick);
  })();

  /* ---------- Sliders (testimonials, case studies) ---------- */
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const track = slider.querySelector('[data-track]');
    const items = [...track.children];
    const countEl = slider.querySelector('[data-count]');
    const barEl = slider.querySelector('[data-bar]');
    const prev = slider.querySelector('[data-prev]');
    const next = slider.querySelector('[data-next]');
    const total = items.length;
    const pad = n => String(n).padStart(2, '0');

    const barTrackW = 150;
    barEl.style.width = (barTrackW / total) + 'px';

    function activeIndex() {
      const left = track.scrollLeft;
      let best = 0, bestDist = Infinity;
      items.forEach((item, i) => {
        const d = Math.abs(item.offsetLeft - items[0].offsetLeft - left);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function update() {
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      let i = activeIndex();
      if (atEnd) i = total - 1;
      countEl.textContent = `${pad(i + 1)}/${pad(total)}`;
      barEl.style.transform = `translateX(${i * (barTrackW / total)}px)`;
      prev.disabled = atStart;
      next.disabled = atEnd;
    }

    function go(dir) {
      const i = Math.max(0, Math.min(total - 1, activeIndex() + dir));
      track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);

    // drag to scroll with the mouse
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('is-dragging');
        // snap to nearest after drag
        const i = activeIndex();
        track.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: 'smooth' });
      }
    });

    // keyboard support
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
    track.tabIndex = 0;

    update();
  });

  /* ---------- Campaign collage: gentle parallax ---------- */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  const campaigns = document.querySelector('.campaigns');
  function parallax() {
    if (window.innerWidth <= 1024) return;
    const r = campaigns.getBoundingClientRect();
    const centerOffset = r.top + r.height / 2 - window.innerHeight / 2;
    parallaxEls.forEach(el => {
      el.style.transform = `translate3d(0, ${centerOffset * Number(el.dataset.parallax)}px, 0)`;
    });
  }
  if (!reduceMotion && campaigns) {
    window.addEventListener('scroll', () => requestAnimationFrame(parallax), { passive: true });
    parallax();
  }

  /* ---------- Service "Request" pre-fills the contact form ---------- */
  const messageField = document.querySelector('.form textarea');
  document.querySelectorAll('[data-service]').forEach(a => {
    a.addEventListener('click', () => {
      if (messageField && !messageField.value) {
        messageField.value = `Hi NYTA, I'd like to request: ${a.dataset.service}.`;
      }
    });
  });

  /* ---------- Contact form (front-end only) ---------- */
  const form = document.querySelector('.form');
  const status = document.querySelector('.form__status');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(input => {
      const valid = input.type === 'email'
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())
        : input.value.trim().length > 0;
      input.closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    status.classList.toggle('is-ok', ok);
    if (!ok) {
      status.textContent = 'Please fill in your name, a valid email and a message.';
      return;
    }
    status.textContent = 'Thanks — we’ll be in touch within one working day.';
    form.reset();
  });
  form?.addEventListener('input', e => e.target.closest('.field')?.classList.remove('is-invalid'));

  /* ---------- Full talent photos replace the cut-off crops when present ---------- */
  document.querySelectorAll('img[data-full]').forEach(img => {
    const probe = new Image();
    probe.onload = () => {
      img.src = img.dataset.full;
      img.closest('.is-partial')?.classList.remove('is-partial');
    };
    probe.src = img.dataset.full;
  });

  /* ---------- Talents row: start centred on the featured talent on small screens ---------- */
  const talentRow = document.querySelector('.talents__row');
  const featured = document.querySelector('[data-featured]');
  function centreFeatured() {
    if (!talentRow || !featured || window.innerWidth > 1024) return;
    talentRow.scrollLeft = featured.offsetLeft - (talentRow.clientWidth - featured.offsetWidth) / 2;
  }
  window.addEventListener('load', centreFeatured);

  /* ---------- Close the mobile menu with Escape / when resizing up ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760 && nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
})();
