/* ==========================================================================
   Bloom Coffee & Brunch — Portada
   Scroll-scrubbed pancake sequence (Canvas + GSAP ScrollTrigger + Lenis)
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
    document.querySelectorAll('[data-carta]').forEach(function (a) {
      a.href = CARTA_PDF;
    });
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
     3. Open / closed, computed in Madrid time
     ------------------------------------------------------------------ */
  (function status() {
    var el = document.querySelector('[data-status]');
    if (!el) return;
    // 0 = Sunday … 6 = Saturday. [open, close] in minutes, null = closed
    var HOURS = { 0: null, 1: [540, 1320], 2: [540, 1320], 3: [540, 1320], 4: [540, 1320], 5: [540, 1320], 6: [600, 1380] };
    var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var fmt = function (m) { return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };

    function madridNow() {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      return { day: day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
    }

    function update() {
      var now = madridNow();
      var today = HOURS[now.day];
      var text, open = false;
      if (today && now.min >= today[0] && now.min < today[1]) {
        open = true;
        text = 'Abierto · hasta las ' + fmt(today[1]);
      } else if (today && now.min < today[0]) {
        text = 'Cerrado · abrimos a las ' + fmt(today[0]);
      } else {
        for (var i = 1; i <= 7; i++) {
          var d = (now.day + i) % 7;
          if (HOURS[d]) {
            text = 'Cerrado · abrimos ' + (i === 1 ? 'mañana' : 'el ' + DAYS[d]) + ' a las ' + fmt(HOURS[d][0]);
            break;
          }
        }
      }
      el.classList.toggle('is-open', open);
      el.querySelector('[data-status-text]').textContent = text;
      el.hidden = false;
    }
    try { update(); setInterval(update, 60000); } catch (e) { /* leave hidden */ }
  })();

  /* ------------------------------------------------------------------
     4. Hero
     ------------------------------------------------------------------ */
  var hero = document.querySelector('[data-hero]');
  var dock = document.querySelector('[data-dock]');
  var hasGsap = window.gsap && window.ScrollTrigger;

  if (!hero || !hasGsap || reduceMotion) {
    // Static, complete page: the closed-pancake poster, no pin, no scrub.
    root.classList.remove('intro');
    if (dock) dock.classList.add('is-shown');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 4a. Smooth scroll (Lenis) driving ScrollTrigger ---------- */
  if (window.Lenis) {
    var lenis = new Lenis({ lerp: 0.14, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- 4b. Frame sequence ---------- */
  var FRAME_COUNT = 80;            // 000.webp … 079.webp (closed → fully open)
  var SRC_W = 954, SRC_H = 592;    // source frame size
  var FOCAL_X = 0.5, FOCAL_Y = 0.5;

  var media = hero.querySelector('[data-media]');
  var canvas = hero.querySelector('[data-canvas]');
  var ctx = canvas.getContext('2d', { alpha: false });

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var set = media.clientWidth * dpr > 720 ? 'lg' : 'sm';
  var frames = new Array(FRAME_COUNT);
  var loaded = new Array(FRAME_COUNT).fill(false);
  var current = -1;
  var playhead = { frame: 0 };
  var cover = { s: 1, ox: 0, oy: 0 };

  function src(i) { return 'assets/frames/pancake/' + set + '/' + String(i).padStart(3, '0') + '.webp'; }

  // First frame, then coarse-to-fine strides, so a fast scroll always
  // has a nearby frame to show while the rest arrive.
  function loadOrder() {
    var seen = {}, order = [];
    [FRAME_COUNT, 16, 8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < FRAME_COUNT; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
    });
    order.splice(1, 0, FRAME_COUNT - 1);
    return order.filter(function (v, k, a) { return a.indexOf(v) === k; });
  }

  function loadFrames() {
    var queue = loadOrder();
    var active = 0, MAX = 6;
    function next() {
      while (active < MAX && queue.length) {
        (function (i) {
          active++;
          var img = new Image();
          img.decoding = 'async';
          img.src = src(i);
          var finished = false;
          var done = function () {
            if (finished) return; finished = true;
            active--;
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
    var s = Math.max(w / SRC_W, h / SRC_H);
    cover = { s: s, ox: (w - SRC_W * s) * FOCAL_X, oy: (h - SRC_H * s) * FOCAL_Y };
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function draw(i, force) {
    var n = nearestLoaded(i);
    if (n < 0 || (n === current && !force)) return;
    current = n;
    var s = cover.s * dpr;
    ctx.drawImage(frames[n], 0, 0, SRC_W, SRC_H, cover.ox * dpr, cover.oy * dpr, SRC_W * s, SRC_H * s);
  }

  measure();
  loadFrames();

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { measure(); draw(Math.round(playhead.frame), true); }, 120);
  });

  /* ---------- 4c. Intro on load (the pancake itself never autoplays) ---------- */
  var tiles = document.querySelectorAll('[data-intro="drop"]');
  var pill = hero.querySelector('[data-intro="pop"]');
  var lines = hero.querySelectorAll('[data-line]');
  var neon = hero.querySelector('[data-neon]');
  var doodlePaths = hero.querySelectorAll('.doodle path');
  var status = hero.querySelector('[data-intro="fade"]');

  doodlePaths.forEach(function (p) {
    var len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
  });
  gsap.set(tiles, { yPercent: -110 });
  gsap.set(lines, { autoAlpha: 0, y: 30 });
  gsap.set(pill, { autoAlpha: 0, scale: 0.85 });
  gsap.set(neon, { autoAlpha: 0 });
  gsap.set(status, { autoAlpha: 0 });
  root.classList.remove('intro');

  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(tiles, { yPercent: 0, duration: 1, stagger: 0.08 }, 0.1)
    .to(lines, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.25)
    .to(doodlePaths, { strokeDashoffset: 0, duration: 1.8, stagger: 0.06, ease: 'power2.inOut' }, 0.3)
    .to(pill, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'back.out(1.8)' }, 0.65)
    .to(status, { autoAlpha: 1, duration: 0.6 }, 0.9)
    // neon sign switching on: a couple of flickers, then steady
    .to(neon, { keyframes: [
      { autoAlpha: 1, duration: 0.06 }, { autoAlpha: 0.2, duration: 0.08 },
      { autoAlpha: 1, duration: 0.05 }, { autoAlpha: 0.35, duration: 0.1 },
      { autoAlpha: 1, duration: 0.2 }
    ], ease: 'none' }, 1.1);

  /* ---------- 4d. Scroll: pin + scrub, 1:1 with scroll position ---------- */
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 2.2); },
      pin: true,
      scrub: true,             // stops when scrolling stops, reverses on scroll up
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) { if (dock) dock.classList.toggle('is-shown', self.progress > 0.97); },
      onRefresh: function () { measure(); draw(Math.round(playhead.frame), true); }
    }
  }).to(playhead, {
    frame: FRAME_COUNT - 1,
    duration: 1,
    snap: 'frame',
    onUpdate: function () { draw(Math.round(playhead.frame)); }
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
