/* ==========================================================================
   Bloom Coffee & Brunch
   Full-screen scroll-scrubbed pancake + overlapping photo stack
   (Canvas + GSAP ScrollTrigger + Lenis)
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Carta: PDF when it exists, WhatsApp until then. Never a dead end.
     ------------------------------------------------------------------ */
  var CARTA_PDF = ''; // e.g. 'carta-bloom.pdf' once the file is uploaded
  if (CARTA_PDF) {
    document.querySelectorAll('[data-carta]').forEach(function (a) { a.href = CARTA_PDF; });
  }

  /* ------------------------------------------------------------------
     2. Menu overlay
     ------------------------------------------------------------------ */
  (function menu() {
    var btn = document.querySelector('[data-menu-toggle]');
    var panel = document.querySelector('[data-menu]');
    if (!btn || !panel) return;
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      panel.hidden = !open;
      root.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
      if (open) { var first = panel.querySelector('a'); if (first) first.focus(); }
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); }
    });
  })();

  /* ------------------------------------------------------------------
     3. Open / closed, computed in Madrid time (shown in the menu)
     ------------------------------------------------------------------ */
  (function status() {
    var el = document.querySelector('[data-status]');
    if (!el) return;
    var HOURS = { 0: null, 1: [540, 1320], 2: [540, 1320], 3: [540, 1320], 4: [540, 1320], 5: [540, 1320], 6: [600, 1380] };
    var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var fmt = function (m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
    function madridNow() {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
        min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10)
      };
    }
    function update() {
      var now = madridNow(), today = HOURS[now.day], text, open = false;
      if (today && now.min >= today[0] && now.min < today[1]) { open = true; text = 'Abierto · hasta las ' + fmt(today[1]); }
      else if (today && now.min < today[0]) { text = 'Cerrado · abrimos a las ' + fmt(today[0]); }
      else {
        for (var i = 1; i <= 7; i++) {
          var d = (now.day + i) % 7;
          if (HOURS[d]) { text = 'Cerrado · abrimos ' + (i === 1 ? 'mañana' : 'el ' + DAYS[d]) + ' a las ' + fmt(HOURS[d][0]); break; }
        }
      }
      el.classList.toggle('is-open', open);
      el.querySelector('[data-status-text]').textContent = text;
      el.hidden = false;
    }
    try { update(); setInterval(update, 60000); } catch (e) { /* stays hidden */ }
  })();

  /* ------------------------------------------------------------------
     4. Motion
     ------------------------------------------------------------------ */
  var hero = document.querySelector('[data-hero]');
  if (!hero || !window.gsap || !window.ScrollTrigger || reduceMotion) {
    root.classList.remove('intro');   // static, complete page
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scroll (Lenis) driving ScrollTrigger */
  if (window.Lenis) {
    var lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- 4a. Frame sequence ---------- */
  var FRAME_COUNT = 80;              // 000 … 079: closed → fully open
  var SRC_W = 1600, SRC_H = 992;     // frame aspect (lg files; sm files are 960 px wide)
  var PORTRAIT_ZOOM = 1.6;           // on tall screens the pancake spans the width

  var media = hero.querySelector('[data-media]');
  var canvas = hero.querySelector('[data-canvas]');
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var set = (window.innerWidth * dpr > 1100) ? 'lg' : 'sm';
  var frames = new Array(FRAME_COUNT);
  var loaded = new Array(FRAME_COUNT).fill(false);
  var current = -1;
  var playhead = { frame: 0 };
  var fit = { s: 1, ox: 0, oy: 0 };

  function src(i) { return 'assets/frames/pancake/' + set + '/' + String(i).padStart(3, '0') + '.webp'; }

  function loadOrder() {
    var seen = {}, order = [0, FRAME_COUNT - 1];
    seen[0] = seen[FRAME_COUNT - 1] = 1;
    [16, 8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < FRAME_COUNT; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
    });
    return order;
  }

  function loadFrames() {
    var queue = loadOrder(), active = 0, MAX = 6;
    function next() {
      while (active < MAX && queue.length) {
        (function (i) {
          active++;
          var img = new Image(), finished = false;
          img.decoding = 'async';
          img.src = src(i);
          var done = function () {
            if (finished) return; finished = true; active--;
            if (img.naturalWidth) {
              frames[i] = img; loaded[i] = true;
              if (i === 0 && current < 0) { draw(0, true); hero.classList.add('is-live'); }
              else if (Math.abs(i - Math.round(playhead.frame)) <= 2) draw(Math.round(playhead.frame), true);
            }
            next();
          };
          if (img.decode) img.decode().then(done, function () { if (img.complete) done(); else img.onload = img.onerror = done; });
          else img.onload = img.onerror = done;
        })(queue.shift());
      }
    }
    next();
  }

  function nearestLoaded(i) {
    if (loaded[i]) return i;
    for (var d = 1; d < FRAME_COUNT; d++) {
      if (i - d >= 0 && loaded[i - d]) return i - d;
      if (i + d < FRAME_COUNT && loaded[i + d]) return i + d;
    }
    return -1;
  }

  function measure() {
    var w = media.clientWidth, h = media.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var s;
    if (w / h <= 1) {                       // portrait: pancake spans the screen, blurred plate fills the rest
      s = (w * PORTRAIT_ZOOM) / SRC_W;
      fit = { s: s, ox: (w - SRC_W * s) / 2, oy: (h - SRC_H * s) * 0.46, portrait: true };
    } else {                                 // landscape: full-bleed cover
      s = Math.max(w / SRC_W, h / SRC_H);
      fit = { s: s, ox: (w - SRC_W * s) / 2, oy: (h - SRC_H * s) / 2 };
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function draw(i, force) {
    var n = nearestLoaded(i);
    if (n < 0 || (n === current && !force)) return;
    current = n;
    var img = frames[n], s = fit.s * dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, fit.ox * dpr, fit.oy * dpr, SRC_W * s, SRC_H * s);
    if (fit.portrait) {
      // feather the top and bottom of the photo into the blurred plate behind it
      var top = fit.oy * dpr, hh = SRC_H * s;
      var g = ctx.createLinearGradient(0, top, 0, top + hh);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.2, '#000');
      g.addColorStop(0.8, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  measure();
  loadFrames();

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { measure(); draw(Math.round(playhead.frame), true); }, 120);
  });

  /* ---------- 4b. Intro on load (the pancake itself never autoplays) ---------- */
  var lines = hero.querySelectorAll('[data-line]');
  var neon = hero.querySelector('[data-neon]');
  var fades = document.querySelectorAll('[data-intro="fade"]');
  var rises = document.querySelectorAll('[data-intro="rise"]');
  var hint = hero.querySelector('[data-hint]');
  var copy = hero.querySelector('.hero__copy');

  gsap.set(lines, { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 80 });
  gsap.set(fades, { autoAlpha: 0 });
  gsap.set(rises, { autoAlpha: 0, y: 20 });
  gsap.set(neon, { autoAlpha: 0 });
  gsap.set(canvas, { scale: 1.08 });
  root.classList.remove('intro');

  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(canvas, { scale: 1, duration: 2.2 }, 0)
    .to(fades, { autoAlpha: 1, duration: 1, stagger: 0.1 }, 0.2)
    .to(lines, { clipPath: 'inset(-25% -5% -30% -5%)', yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.35)
    .to(rises, { autoAlpha: 1, y: 0, duration: 1 }, 0.9)
    .to(neon, { keyframes: [
      { autoAlpha: 1, duration: 0.06 }, { autoAlpha: 0.2, duration: 0.08 },
      { autoAlpha: 1, duration: 0.05 }, { autoAlpha: 0.35, duration: 0.1 },
      { autoAlpha: 1, duration: 0.2 }
    ], ease: 'none' }, 1.2);

  /* ---------- 4c. Hero scroll: pin + scrub, 1:1 with the scroll ---------- */
  var OPEN_END = 0.88;   // pancake fully open here; the last stretch holds the open frame
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 2.4); },
      pin: true,
      scrub: true,             // stops when scrolling stops, reverses on scroll up
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: function () { measure(); draw(Math.round(playhead.frame), true); }
    }
  })
    .to(playhead, {
      frame: FRAME_COUNT - 1, duration: OPEN_END, snap: 'frame',
      onUpdate: function () { draw(Math.round(playhead.frame)); }
    }, 0)
    // text steps aside so the pancake owns the screen
    .to(copy, { autoAlpha: 0, y: -40, duration: 0.22 }, 0.02)
    .to(hint, { autoAlpha: 0, duration: 0.1 }, 0)
    .to(neon, { autoAlpha: 0, duration: 0.2 }, 0.1)
    .to(media, { scale: 1.06, duration: 1 }, 0)
    .to({}, { duration: 1 - OPEN_END }, OPEN_END);

  /* ---------- 4d. Photo stack: overlapping shots, each at its own speed ---------- */
  var shots = document.querySelectorAll('[data-shot]');
  shots.forEach(function (shot) {
    var img = shot.querySelector('img');
    var cap = shot.querySelector('figcaption');
    var speed = parseFloat(shot.dataset.speed) || 0.2;

    // the frame drifts up faster or slower than the scroll, so shots slide over each other
    gsap.fromTo(shot, { y: function () { return window.innerHeight * speed; } }, {
      y: function () { return -window.innerHeight * speed * 0.6; },
      ease: 'none',
      scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });

    // curtain opens from below while the photo settles from a zoom
    gsap.fromTo(shot, { clipPath: 'inset(22% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
      scrollTrigger: { trigger: shot, start: 'top bottom', end: 'top 45%', scrub: true }
    });
    gsap.fromTo(img, { scale: 1.28, yPercent: -6 }, {
      scale: 1, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true }
    });

    if (cap) {
      gsap.from(cap, {
        yPercent: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: shot, start: 'top 55%', toggleActions: 'play none none reverse' }
      });
    }
  });

  var close = document.querySelector('.close');
  if (close) {
    gsap.from(close.children, {
      y: 40, autoAlpha: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: { trigger: close, start: 'top 80%' }
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
