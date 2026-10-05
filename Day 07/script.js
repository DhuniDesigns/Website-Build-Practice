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

  /* ---------- How it works: steps with auto-advancing progress ---------- */
  const steps = [...document.querySelectorAll('.step')];
  const bars = [...document.querySelectorAll('.how__bar')];
  const STEP_MS = 6000;
  let current = 0;
  let stepStart = 0;
  let paused = false;
  let howVisible = false;

  function setStep(i) {
    current = i;
    stepStart = performance.now();
    steps.forEach((s, idx) => {
      s.classList.toggle('is-active', idx === i);
      s.setAttribute('aria-selected', String(idx === i));
    });
    bars.forEach((b, idx) => {
      b.classList.toggle('is-done', idx < i);
      b.firstElementChild.style.width = idx < i ? '100%' : '0';
    });
  }

  function loop(now) {
    if (howVisible && !paused && !reduceMotion) {
      const p = Math.min((now - stepStart) / STEP_MS, 1);
      bars[current].firstElementChild.style.width = (p * 100) + '%';
      if (p >= 1) setStep((current + 1) % steps.length);
    } else {
      stepStart = now - parseFloat(bars[current].firstElementChild.style.width || 0) / 100 * STEP_MS;
    }
    requestAnimationFrame(loop);
  }

  if (steps.length) {
    steps.forEach((s, i) => s.addEventListener('click', () => setStep(i)));
    const how = document.querySelector('.how');
    how.addEventListener('mouseenter', () => { paused = true; });
    how.addEventListener('mouseleave', () => { paused = false; });
    new IntersectionObserver(([e]) => { howVisible = e.isIntersecting; }, { threshold: 0.3 }).observe(how);
    setStep(0);
    // Figma shows step 1 with a 72px fill on a ~453px bar
    bars[0].firstElementChild.style.width = reduceMotion ? '100%' : '16%';
    requestAnimationFrame(loop);
  }

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
    if (window.innerWidth <= 1200) return;
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
})();
