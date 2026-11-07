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
    document.querySelectorAll('[data-carta]').forEach(function (a) { a.href = CARTA_PDF; });
  }

  /* ------------------------------------------------------------------
     2. Open / closed, computed in Madrid time
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
     3. Hero
     ------------------------------------------------------------------ */
  var hero = document.querySelector('[data-hero]');
  var hasGsap = window.gsap && window.ScrollTrigger;

  if (!hero || !hasGsap) { root.classList.remove('intro'); return; }

  gsap.registerPlugin(ScrollTrigger);

  if (reduceMotion) {
    // Static, complete page: the closed-pancake poster, no pin, no scrub.
    root.classList.remove('intro');
    return;
  }

  /* ---------- 3a. Smooth scroll (Lenis) driving ScrollTrigger ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- 3b. Frame sequence ---------- */
  var FRAME_COUNT = 80;            // 000.webp … 079.webp (closed → fully open)
  var SRC_W = 954, SRC_H = 592;    // source frame size
  var FOCAL_X = 0.47, FOCAL_Y = 0.5;

  var media = hero.querySelector('[data-media]');
  var canvas = hero.querySelector('[data-canvas]');
  var ctx = canvas.getContext('2d', { alpha: false });
  var notes = Array.prototype.slice.call(hero.querySelectorAll('.note'));

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var set = media.clientWidth * dpr > 720 ? 'lg' : 'sm';
  var frames = new Array(FRAME_COUNT);
  var loaded = new Array(FRAME_COUNT).fill(false);
  var current = -1;
  var playhead = { frame: 0 };
  var cover = { s: 1, ox: 0, oy: 0, w: 0, h: 0 };

  function src(i) { return 'assets/frames/pancake/' + set + '/' + String(i).padStart(3, '0') + '.webp'; }

  // Load order: first frame, then coarse-to-fine strides, so scrubbing
  // early on always has a nearby frame to show.
  function loadOrder() {
    var seen = {}, order = [];
    [FRAME_COUNT, 16, 8, 4, 2, 1].forEach(function (step) {
      for (var i = 0; i < FRAME_COUNT; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
    });
    if (!seen[FRAME_COUNT - 1]) order.splice(1, 0, FRAME_COUNT - 1);
    return order;
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
          var done = function () {
            active--;
            if (img.naturalWidth) {
              frames[i] = img; loaded[i] = true;
              if (i === 0 && current < 0) { draw(0, true); hero.classList.add('is-live'); placeNotes(); }
              else if (Math.abs(i - Math.round(playhead.frame)) <= 2) draw(Math.round(playhead.frame), true);
            }
            next();
          };
          (img.decode ? img.decode() : Promise.reject()).then(done, function () {
            if (img.complete) done(); else img.onload = img.onerror = done;
          });
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
    cover = { s: s, w: w, h: h, ox: (w - SRC_W * s) * FOCAL_X, oy: (h - SRC_H * s) * FOCAL_Y };
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    placeNotes();
  }

  function draw(i, force) {
    var n = nearestLoaded(i);
    if (n < 0 || (n === current && !force)) return;
    current = n;
    var img = frames[n];
    var s = cover.s * dpr;
    ctx.drawImage(img, 0, 0, SRC_W, SRC_H, cover.ox * dpr, cover.oy * dpr, SRC_W * s, SRC_H * s);
  }

  /* Annotations: anchors are given in source-frame pixels (final frame),
     mapped through the same cover transform as the canvas. */
  function placeNotes() {
    notes.forEach(function (li) {
      var x = cover.ox + parseFloat(li.dataset.x) * cover.s;
      var y = cover.oy + parseFloat(li.dataset.y) * cover.s;
      li.style.left = x + 'px';
      li.style.top = Math.max(18, y) + 'px';
      // Flip side if the pill would be cut by the frame edge
      var want = li.dataset.sideOrig || (li.dataset.sideOrig = li.dataset.side);
      li.dataset.side = want;
      var w = li.offsetWidth;
      if (want === 'right' && x + w > cover.w - 8) li.dataset.side = 'left';
      if (want === 'left' && x - w < 8) li.dataset.side = 'right';
      li.hidden = x < 6 || x > cover.w - 6;
    });
  }

  measure();
  loadFrames();

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { measure(); draw(Math.round(playhead.frame), true); }, 120);
  });

  /* ---------- 3c. Intro (on load — the pancake itself never autoplays) ---------- */
  var lines = hero.querySelectorAll('[data-line]');
  var script = hero.querySelector('[data-script]');
  var seal = hero.querySelector('[data-seal]');
  var fades = document.querySelectorAll('[data-intro="fade"]');
  var rises = document.querySelectorAll('[data-intro="rise"]');

  gsap.set(lines, { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 60 });
  gsap.set(script, { clipPath: 'inset(-30% 100% -40% -10%)' });
  gsap.set(media, { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(canvas, { scale: 1.12 });
  gsap.set(seal, { scale: 0.4, rotate: -120, autoAlpha: 0 });
  gsap.set(fades, { autoAlpha: 0 });
  gsap.set(rises, { autoAlpha: 0, y: 24 });
  root.classList.remove('intro');

  var intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .to(media, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0)
    .to(canvas, { scale: 1, duration: 1.8 }, 0.3)
    .to(lines, { clipPath: 'inset(-20% -5% -25% -5%)', yPercent: 0, duration: 1.1, stagger: 0.09 }, 0.35)
    .to(script, { clipPath: 'inset(-30% -10% -40% -10%)', duration: 1.4, ease: 'power2.inOut' }, 0.85)
    .to(seal, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1.2 }, 1.0)
    .to(fades, { autoAlpha: 1, duration: 0.8, stagger: 0.05, ease: 'power1.out' }, 0.9)
    .to(rises, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1.05)
    .add(function () { gsap.set([lines, script, media], { clearProps: 'clipPath' }); });

  /* ---------- 3d. Scroll choreography: pin + scrub ---------- */
  var meter = hero.querySelector('[data-meter]');
  var meterLabel = hero.querySelector('[data-meter-label]');
  var ghost = hero.querySelector('[data-ghost]');
  var lastLabel = '';

  function setLabel(p) {
    var q = Math.min(1, p / 0.8);
    var t = p < 0.02 ? 'Desliza para abrir' : q >= 1 ? 'Capa a capa' : 'Abriendo ' + String(Math.round(q * 100)).padStart(2, '0') + '%';
    if (t !== lastLabel) { meterLabel.textContent = t; lastLabel = t; }
  }

  var tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 2.4); },
      pin: true,
      scrub: true,             // locked 1:1 to scroll: stops when scrolling stops, reverses on scroll up
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: function (self) { setLabel(self.progress); },
      onRefresh: function () { measure(); draw(Math.round(playhead.frame), true); }
    }
  });

  // 0 → 0.8: the pancake opens frame by frame. 0.8 → 1: hold the open frame while the notes arrive.
  var OPEN_END = 0.8;
  tl.to(playhead, {
      frame: FRAME_COUNT - 1,
      duration: OPEN_END,
      snap: 'frame',
      onUpdate: function () { draw(Math.round(playhead.frame)); }
    }, 0)
    .to(meter, { scaleX: 1, duration: OPEN_END }, 0)
    .to(ghost, { xPercent: -22, duration: 1 }, 0)
    .to(seal, { rotate: 300, duration: 1 }, 0);

  // Annotations arrive once the layers have separated
  notes.forEach(function (li, k) {
    var at = OPEN_END + 0.01 + k * 0.04;
    tl.fromTo(li, { autoAlpha: 0, '--draw': 0 }, { autoAlpha: 1, '--draw': 1, duration: 0.05, ease: 'power2.out' }, at);
  });

  // Keep the timeline exactly 1 unit long so progress == scroll progress
  tl.set({}, {}, 1);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { placeNotes(); ScrollTrigger.refresh(); });
  }
})();
