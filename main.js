/* ==========================================================================
   Bloom Coffee & Brunch
   Hero pancake scrubbed by scroll (Canvas + GSAP ScrollTrigger),
   Lenis smooth scroll, Swiper gallery, quiet reveals
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
     2. Mobile menu
     ------------------------------------------------------------------ */
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var menuPanel = document.querySelector('[data-menu]');
  function setMenu(open) {
    if (!menuBtn || !menuPanel) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menuPanel.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  }
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menuPanel.hidden) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* In-page links: close the menu, then glide (Lenis) or jump */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: id === '#inicio' ? 0 : -60, duration: 1.4 });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* Navigation gets its cream background once you leave the top */
  var nav = document.querySelector('[data-nav]');
  // the small logo only appears once the big centred logo of the hero has gone
  function navState() {
    if (!nav) return;
    var limit = reduceMotion ? window.innerHeight * 0.6 : window.innerHeight * 2.6;
    nav.classList.toggle('is-scrolled', window.scrollY > limit);
  }
  window.addEventListener('scroll', navState, { passive: true });
  navState();

  /* ------------------------------------------------------------------
     3. Opening hours: status + today highlighted (Madrid time)
     ------------------------------------------------------------------ */
  (function hours() {
    var el = document.querySelector('[data-status]');
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
      if (today && now.min >= today[0] && now.min < today[1]) { open = true; text = 'Abierto ahora · hasta las ' + fmt(today[1]); }
      else if (today && now.min < today[0]) { text = 'Cerrado · abrimos a las ' + fmt(today[0]); }
      else {
        for (var i = 1; i <= 7; i++) {
          var d = (now.day + i) % 7;
          if (HOURS[d]) { text = 'Cerrado · abrimos ' + (i === 1 ? 'mañana' : 'el ' + DAYS[d]) + ' a las ' + fmt(HOURS[d][0]); break; }
        }
      }
      if (el) {
        el.classList.toggle('is-open', open);
        el.querySelector('[data-status-text]').textContent = text;
        el.hidden = false;
      }
      document.querySelectorAll('[data-hours] li').forEach(function (li) {
        li.classList.toggle('is-today', li.dataset.days.split(',').indexOf(String(now.day)) > -1);
      });
    }
    try { update(); setInterval(update, 60000); } catch (e) { /* static table stays */ }
  })();

  /* ------------------------------------------------------------------
     4. Gallery (Swiper): original proportions, centred, swipe + arrows
     ------------------------------------------------------------------ */
  (function gallery() {
    var el = document.querySelector('[data-gallery]');
    if (!el || !window.Swiper) return;
    var count = document.querySelector('[data-count]');
    var wrapper = el.querySelector('.swiper-wrapper');
    var originals = el.querySelectorAll('.swiper-slide');
    var total = originals.length;                       // exactly 4 photos
    // Swiper needs more slides than fit on screen to loop seamlessly: repeat the same
    // four photos (hidden from screen readers) so the carousel never shows a gap
    for (var r = 0; r < 2; r++) {
      Array.prototype.forEach.call(originals, function (slide) {
        var c = slide.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.classList.add('is-copy');
        wrapper.appendChild(c);
      });
    }
    var pad = function (n) { return String(n).padStart(2, '0'); };
    new Swiper(el, {
      slidesPerView: 'auto',
      centeredSlides: true,
      spaceBetween: 28,
      loop: true,
      speed: reduceMotion ? 0 : 1100,
      grabCursor: true,
      keyboard: { enabled: true },
      navigation: { prevEl: '[data-prev]', nextEl: '[data-next]' },
      autoplay: reduceMotion ? false : { delay: 4200, pauseOnMouseEnter: true, disableOnInteraction: false },
      breakpoints: { 900: { spaceBetween: 44 } },
      on: {
        slideChange: function (s) { if (count) count.textContent = pad((s.realIndex % total) + 1) + ' / ' + pad(total); }
      }
    });
  })();

  /* ------------------------------------------------------------------
     4b. 3D cup in the Carta (Three.js, loaded only when the section nears)
     Static with reduced motion; the box simply stays empty without WebGL.
     ------------------------------------------------------------------ */
  var cupBox = document.querySelector('[data-cup]');
  if (cupBox && 'IntersectionObserver' in window) {
    var cupIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      cupIO.disconnect();
      import('./cup.js?v=20261107g')
        .then(function (m) { m.initCup(cupBox, { still: reduceMotion }); })
        .catch(function () { cupBox.remove(); });
    }, { rootMargin: '600px 0px' });
    cupIO.observe(cupBox);
  }

  /* ------------------------------------------------------------------
     5. Motion (skipped entirely with reduced motion)
     ------------------------------------------------------------------ */
  var hero = document.querySelector('[data-hero]');
  if (!hero || !window.gsap || !window.ScrollTrigger || reduceMotion) {
    root.classList.remove('intro');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    var lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    lenis.on('scroll', navState);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- 5a. Frame sequence ---------- */
  var FRAME_COUNT = 80;              // 000 … 079: closed → fully open
  var SRC_W = 1600, SRC_H = 992;     // frame aspect (lg 1600 px, sm 960 px)

  var media = hero.querySelector('[data-media]');
  var canvas = hero.querySelector('[data-canvas]');
  var ctx = canvas.getContext('2d', { alpha: false });
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var set = (media.clientWidth * dpr > 900) ? 'lg' : 'sm';
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
    var s = Math.max(w / SRC_W, h / SRC_H);           // cover the frame, centred
    fit = { s: s, ox: (w - SRC_W * s) / 2, oy: (h - SRC_H * s) / 2 };
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  function draw(i, force) {
    var n = nearestLoaded(i);
    if (n < 0 || (n === current && !force)) return;
    current = n;
    var img = frames[n], s = fit.s * dpr;
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, fit.ox * dpr, fit.oy * dpr, SRC_W * s, SRC_H * s);
  }

  measure();
  loadFrames();

  var resizeT;
  window.addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { measure(); draw(Math.round(playhead.frame), true); }, 120);
  });

  /* ---------- 5b. Intro on load: quiet and short ---------- */
  var rises = hero.querySelectorAll('[data-intro="rise"]');
  var reveal = hero.querySelector('[data-intro="reveal"]');
  gsap.set(rises, { autoAlpha: 0, y: 18 });
  gsap.set(reveal, { autoAlpha: 0, clipPath: 'inset(6% 6% 6% 6%)' });
  root.classList.remove('intro');
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to(rises, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.1)
    .to(reveal, { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' }, 0.25)
    .set(reveal, { clearProps: 'clipPath' });

  /* ---------- 5c. Hero: pin + scrub, 1:1 with the scroll ---------- */
  var OPEN_END = 0.9;
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 2); },
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
    .to(hero.querySelector('[data-hint]'), { autoAlpha: 0, duration: 0.1 }, 0)
    .to({}, { duration: 1 - OPEN_END }, OPEN_END);

  /* ---------- 5d. Gallery: cards rise in one after another (CSS, so Swiper keeps control) ---------- */
  var galSection = document.querySelector('.gallery');
  if (galSection && 'IntersectionObserver' in window) {
    galSection.classList.add('is-waiting');
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { galSection.classList.remove('is-waiting'); galSection.classList.add('is-in'); io.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(galSection.querySelector('[data-gallery]'));
  }

  /* ---------- 5e. Quiet reveals ---------- */
  gsap.utils.toArray('[data-fade]').forEach(function (el) {
    gsap.from(el, {
      y: 24, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });
  /* Titles: split into words (keeping <em>), each word rises out of its own mask */
  function splitWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 1) { splitWords(child); return; }
      if (child.nodeType !== 3 || !child.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      child.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span'), inner = document.createElement('span');
        w.className = 'w'; inner.className = 'w__in'; inner.textContent = part;
        w.appendChild(inner); frag.appendChild(w);
      });
      node.replaceChild(frag, child);
    });
  }
  gsap.utils.toArray('[data-split]').forEach(function (el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    splitWords(el);
    var words = el.querySelectorAll('.w__in');
    Array.prototype.forEach.call(el.querySelectorAll('.w'), function (w) { w.setAttribute('aria-hidden', 'true'); });
    gsap.from(words, {
      yPercent: 110, duration: 1.15, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onComplete: function () { el.classList.add('is-split-done'); }
    });
  });

  /* Story photos: a mask opens from the bottom while the photo settles */
  gsap.utils.toArray('[data-reveal]').forEach(function (el, i) {
    var img = el.querySelector('img');
    var tl = gsap.timeline({
      delay: i * 0.15,
      defaults: { duration: 1.6, ease: 'power3.inOut' },
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', clearProps: 'clipPath' }, 0);
    if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.9, ease: 'power3.out', clearProps: 'transform' }, 0);
    gsap.fromTo(el, { yPercent: 4 }, {
      yPercent: -4, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
