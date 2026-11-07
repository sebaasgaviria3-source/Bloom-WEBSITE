/* =========================================================
   Bloom Coffee & Brunch — main.js
   Classic script + IIFE (no modules). GSAP + ScrollTrigger from /lib.
   Motion budget: one orchestrated intro (pancakes → header → headline → neon → buttons),
   the scroll-scrubbed pancake hero, and scroll motion in the sections below.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[bloom:" + name + "]", err); }
  }

  function revealAll() { root.classList.remove("js-intro"); }

  /* ---------- Intro: the one orchestrated moment ---------- */
  function initIntro() {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    var neon = $("[data-neon]");

    tl.fromTo("[data-hero-frame]",
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.4 }, 0.1)
      .fromTo("[data-intro='from-top']",
        { opacity: 0, yPercent: -100 },
        { opacity: 1, yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.3)
      .fromTo("[data-intro='from-right']",
        { opacity: 0, xPercent: 100 },
        { opacity: 1, xPercent: 0, duration: 0.9 }, 0.4)
      .fromTo("[data-intro='fade']",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.9 }, 0.35)
      .fromTo("[data-intro='line']",
        { opacity: 1, yPercent: 110 },
        { yPercent: 0, duration: 1.1, stagger: 0.12 }, 0.5);

    // Neon script switching on: a few irregular flickers, then steady
    if (reduceMotion) {
      tl.fromTo(neon, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0.9);
    } else {
      tl.fromTo(neon,
        { opacity: 0 },
        { keyframes: { opacity: [0, 0.9, 0.1, 0.8, 0, 1, 0.35, 1] }, duration: 1.1, ease: "none" }, 1.0);
    }

    tl.fromTo("[data-cta]",
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 1.35);

    revealAll();
  }

  /* ---------- Header state on scroll ---------- */
  function initHeader() {
    var header = $("[data-header]");
    var update = function () { header.classList.toggle("is-scrolled", window.scrollY > 60); };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* =========================================================
     Hero: pancakes open frame by frame with the scroll.
     - 97 frames cropped from the reference video (tools/build_pancake.sh).
     - Pinned stage; ScrollTrigger progress → frame index, linear, scrub: true,
       so the stack opens/closes exactly with the scroll and stops when it stops.
     - Frames load coarse-to-fine (every 32nd, 16th … 1st) so fast scrolling
       always has a near frame to show; frame 0 doubles as the LCP poster.
     - Reduced motion / no JS: the poster stays, nothing is pinned.
     ========================================================= */
  var FRAMES = 97;

  function initPancake() {
    var stage = $("[data-hero-stage]");
    var frame = $("[data-hero-frame]");
    var canvas = $("[data-hero-canvas]");
    if (!stage || !frame || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d", { alpha: false });

    var set = null, gen = 0;
    var images = [], ready = [];
    var target = 0, shown = -1, rafId = 0, live = false;

    function frameSrc(s, i) { return "assets/pancake/" + s + "/f_" + String(i).padStart(3, "0") + ".webp"; }

    function loadOrder() {
      var order = [], seen = {};
      [32, 16, 8, 4, 2, 1].forEach(function (step) {
        for (var i = 0; i < FRAMES; i += step) if (!seen[i]) { seen[i] = 1; order.push(i); }
      });
      return order; // 0, 32, 64, 96, 16, 48 …
    }

    function useSet(next) {
      if (next === set) return;
      set = next;
      var token = ++gen;
      var folder = next;
      images = new Array(FRAMES);
      ready = new Array(FRAMES);
      shown = -1;
      var order = loadOrder(), q = 0, active = 0, MAX = 6;

      function pump() {
        while (token === gen && active < MAX && q < order.length) start(order[q++]);
      }
      function start(i) {
        active++;
        var img = new Image();
        img.decoding = "async";
        img.src = frameSrc(folder, i);
        images[i] = img;
        var loading = img.decode ? img.decode() : new Promise(function (res, rej) { img.onload = res; img.onerror = rej; });
        loading.then(function () {
          if (token !== gen) return;
          ready[i] = true;
          requestDraw();
        }).catch(function () { /* a missing frame is skipped; the nearest one is used */ })
          .then(function () { active--; pump(); });
      }
      pump();
    }

    function nearest(t) {
      if (ready[t]) return t;
      for (var d = 1; d < FRAMES; d++) {
        if (t - d >= 0 && ready[t - d]) return t - d;
        if (t + d < FRAMES && ready[t + d]) return t + d;
      }
      return -1;
    }

    function draw() {
      rafId = 0;
      var i = nearest(target);
      if (i < 0 || i === shown) return;
      var img = images[i];
      var cw = canvas.width, ch = canvas.height;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var s = Math.max(cw / iw, ch / ih); // manual "cover", centred
      var w = iw * s, h = ih * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      shown = i;
      if (!live) { live = true; frame.classList.add("is-live"); }
    }

    function requestDraw() { if (!rafId) rafId = requestAnimationFrame(draw); }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(frame.clientWidth * dpr), h = Math.round(frame.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        shown = -1;
        requestDraw();
      }
    }

    function sync(self) {
      target = Math.round(self.progress * (FRAMES - 1)); // linear: 1:1 with the video
      requestDraw();
    }

    var mm = gsap.matchMedia();
    mm.add({
      motion: "(prefers-reduced-motion: no-preference)",
      mobile: "(max-width: 767px)"
    }, function (mctx) {
      var c = mctx.conditions;
      if (!c.motion) return; // static poster, no pin

      useSet(c.mobile ? "m" : "d");
      size();

      var tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          // scroll distance of the animation: 2 screens on desktop, 1.4 on phones
          end: function () { return "+=" + Math.round(window.innerHeight * (c.mobile ? 1.4 : 2)); },
          pin: true,
          scrub: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: sync,
          onRefresh: function (self) { size(); sync(self); }
        }
      });

      // Timeline length = 1, so positions read as scroll progress.
      tl.fromTo(frame, { scale: 1 }, { scale: c.mobile ? 1.04 : 1.07, duration: 1 }, 0)
        // Text lifts away in the first fifth so it never covers the opening stack
        .fromTo("[data-hero-text]", { y: 0, opacity: 1 }, { y: -70, opacity: 0, duration: 0.2, stagger: 0.02, immediateRender: false }, 0)
        .fromTo("[data-hero-hint]", { opacity: 1 }, { opacity: 0, duration: 0.08, immediateRender: false }, 0)
        .fromTo(".hero__bigword", { scale: 1 }, { scale: 1.12, duration: 1 }, 0);

      // Layered depth: each decoration drifts at its own speed
      $$("[data-depth]", stage).forEach(function (el) {
        tl.fromTo(el, { y: 0 }, { y: parseFloat(el.getAttribute("data-depth")) || 0, duration: 1 }, 0);
      });
    });

    window.addEventListener("resize", size);
  }

  /* ---------- Blurred glows drift slowly inside the pink block ---------- */
  function initGlow() {
    if (reduceMotion) return;
    $$("[data-glow]").forEach(function (el, i) {
      gsap.to(el, {
        xPercent: i % 2 ? -18 : 16,
        yPercent: i % 2 ? 12 : -14,
        scale: 1.15,
        duration: 10 + i * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }

  /* ---------- Bear: draws itself on scroll, then blinks ---------- */
  function initBear() {
    var bear = $("[data-bear]");
    if (!bear) return;
    var paths = $$("[data-draw]", bear);
    var face = $("[data-bear-face]", bear);
    var eyes = $$("[data-eye]", bear);

    paths.forEach(function (p) {
      var len = Math.ceil(p.getTotalLength()) + 2;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = reduceMotion ? 0 : len;
    });

    gsap.to(eyes, { scaleY: 0.1, duration: 0.09, yoyo: true, repeat: -1, repeatDelay: 3.4, ease: "power1.inOut" });

    if (reduceMotion) return;

    gsap.set(face, { opacity: 0 });
    gsap.timeline({
      scrollTrigger: { trigger: bear, start: "top 95%", end: "top 55%", scrub: 0.7 }
    })
      .to(paths, { strokeDashoffset: 0, duration: 1, stagger: 0.05, ease: "none" })
      .to(face, { opacity: 1, duration: 0.3 }, "-=0.3");
  }

  /* =========================================================
     Sections after the hero — motion taken from the reference video.
     All scroll-linked (scrub) so it moves with the finger, both ways.
     Created top-to-bottom, as the ScrollTrigger skill recommends.
     ========================================================= */
  function initSections() {
    var mm = gsap.matchMedia();

    mm.add({
      isMobile: "(max-width: 767px)",
      isWide: "(min-width: 900px)",
      motion: "(prefers-reduced-motion: no-preference)"
    }, function (ctx) {
      var c = ctx.conditions;
      if (!c.motion) return; // reduced motion: everything stays in place, fully visible

      /* 1. Gallery: faster, softer slide-in from the sides with a slight turn and settle */
      $$("[data-collage]").forEach(function (item) {
        var dir = item.getAttribute("data-from") === "left" ? -1 : 1;
        var speed = parseFloat(item.getAttribute("data-speed")) || 1;
        var img = $("img", item);

        gsap.fromTo(item,
          { xPercent: dir * (c.isMobile ? 100 : 75), rotation: dir * 5, scale: 0.9 },
          {
            xPercent: 0, rotation: 0, scale: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: item, start: "top bottom", end: c.isMobile ? "top 72%" : "top 70%", scrub: 0.35 }
          });

        var drift = (speed - 1) * (c.isMobile ? 140 : 220);
        if (drift) {
          gsap.fromTo(item, { y: drift }, {
            y: -drift, ease: "none",
            scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true }
          });
        }
        gsap.fromTo(img, { yPercent: -6 }, {
          yPercent: 6, ease: "none",
          scrollTrigger: { trigger: item, start: "top bottom", end: "bottom top", scrub: true }
        });
      });

      /* 2. Venue: pinned stage — the photo opens from an arch window to the full frame,
            the title rises word by word and the story fades in beside it */
      var stage = $("[data-venue-stage]");
      if (stage) {
        var vPhoto = $("[data-venue-photo]", stage);
        var archFrom = c.isWide
          ? "inset(14% 16% 14% 16% round 999px 999px 0px 0px)"
          : "inset(12% 20% 4% 20% round 999px 999px 0px 0px)";
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: stage, start: "top top", end: "+=110%", pin: true, scrub: 0.5, anticipatePin: 1 }
        })
          .fromTo(vPhoto, { clipPath: archFrom }, { clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)", duration: 1 }, 0)
          .fromTo($("img", vPhoto), { scale: 1.35 }, { scale: 1, duration: 1 }, 0)
          .fromTo(".venue__title .w > span", { yPercent: 115 }, { yPercent: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" }, 0.35)
          .fromTo("[data-venue-text]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12, ease: "power2.out" }, 0.55);
      }

      /* 3a. Colour photo A: horizontal wipe from the right, image settling inside */
      var wipe = $("[data-wipe]");
      if (wipe) {
        var st = { trigger: wipe, start: "top 92%", end: "top 40%", scrub: 0.4 };
        gsap.fromTo(wipe, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.out", scrollTrigger: st });
        gsap.fromTo($("img", wipe), { scale: 1.3, xPercent: 8 }, { scale: 1, xPercent: 0, ease: "power2.out", scrollTrigger: st });
      }

      /* 3b. Colour photo B: swings up into place like a print dropped on the table */
      var tilt = $("[data-tilt]");
      if (tilt) {
        gsap.fromTo(tilt,
          { yPercent: 35, rotation: 12, scale: 0.82 },
          { yPercent: 0, rotation: -3, scale: 1, ease: "power2.out",
            scrollTrigger: { trigger: tilt, start: "top bottom", end: "top 50%", scrub: 0.4 } });
        gsap.fromTo($("img", tilt), { yPercent: 6 }, {
          yPercent: -6, ease: "none",
          scrollTrigger: { trigger: tilt, start: "top bottom", end: "bottom top", scrub: true }
        });
      }

      /* 4. Band slides in from the left, the italic word follows */
      var band = $("[data-band]");
      if (band) {
        gsap.timeline({ scrollTrigger: { trigger: band, start: "top bottom", end: "top 55%", scrub: 0.4 } })
          .fromTo(band, { xPercent: -100 }, { xPercent: 0, ease: "power2.out" })
          .fromTo(".band__script", { x: 50, opacity: 0 }, { x: 0, opacity: 1, ease: "power2.out" }, 0.35);
      }

      /* 5. Menu sheet rises over the gallery like the next page */
      var sheet = $("[data-sheet]");
      if (sheet) {
        gsap.fromTo(sheet,
          { y: c.isMobile ? 70 : 120, borderTopLeftRadius: c.isMobile ? 64 : 120, borderTopRightRadius: c.isMobile ? 64 : 120 },
          { y: 0, borderTopLeftRadius: c.isMobile ? 28 : 40, borderTopRightRadius: c.isMobile ? 28 : 40, ease: "power2.out",
            scrollTrigger: { trigger: sheet, start: "top bottom", end: "top 35%", scrub: 0.4 } });
      }

      /* 6. Map circle rolls in from the right */
      var map = $("[data-map]");
      if (map) {
        gsap.fromTo(map,
          { xPercent: c.isMobile ? 70 : 40, rotation: 25 },
          { xPercent: 0, rotation: 0, ease: "power2.out",
            scrollTrigger: { trigger: map, start: "top bottom", end: "top 55%", scrub: 0.4 } });
      }

      /* 7. Instagram photos slide in from their sides */
      $$(".insta__item").forEach(function (item) {
        var dir = item.getAttribute("data-from") === "left" ? -1 : 1;
        gsap.fromTo(item, { xPercent: dir * 70, opacity: 0.3 }, {
          xPercent: 0, opacity: 1, ease: "power2.out",
          scrollTrigger: { trigger: item, start: "top bottom", end: "top 65%", scrub: 0.4 }
        });
      });
    });

    /* Text: gentle fade + rise when it enters (plays once, not scrubbed) */
    if (!reduceMotion) {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 90%",
        once: true,
        onEnter: function (batch) {
          gsap.fromTo(batch, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out", stagger: 0.08, overwrite: true });
        }
      });
    }
  }

  /* ---------- Menu tabs (works with or without GSAP) ---------- */
  function initMenuTabs() {
    var list = $("[data-tabs]");
    if (!list) return;
    var tabs = $$("[role='tab']", list);
    var bar = $("[data-tabs-bar]", list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var current = 0;

    panels.forEach(function (p, i) { p.hidden = i !== 0; });

    function moveBar(i) {
      if (!bar) return;
      var t = tabs[i];
      var pad = 14;
      bar.style.width = (t.offsetWidth - pad * 2) + "px";
      bar.style.transform = "translateX(" + (t.offsetLeft + pad) + "px)";
    }

    function select(i, focus) {
      if (i === current) return;
      var prev = panels[current];
      var next = panels[i];
      tabs[current].setAttribute("aria-selected", "false");
      tabs[current].tabIndex = -1;
      tabs[i].setAttribute("aria-selected", "true");
      tabs[i].tabIndex = 0;
      if (focus) tabs[i].focus();
      tabs[i].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      current = i;
      moveBar(i);

      prev.hidden = true;
      next.hidden = false;
      if (hasGsap && !reduceMotion) {
        var photo = $(".menu-panel__photo", next);
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .fromTo(photo, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power4.inOut" }, 0)
          .fromTo($("img", photo), { scale: 1.2 }, { scale: 1, duration: 0.9 }, 0)
          .fromTo($$(".dish", next), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06 }, 0.15);
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i, false); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, n = tabs.length;
        if (k === "ArrowRight") { e.preventDefault(); select((current + 1) % n, true); }
        else if (k === "ArrowLeft") { e.preventDefault(); select((current - 1 + n) % n, true); }
        else if (k === "Home") { e.preventDefault(); select(0, true); }
        else if (k === "End") { e.preventDefault(); select(n - 1, true); }
      });
    });

    moveBar(0);
    window.addEventListener("resize", function () { moveBar(current); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveBar(current); });
  }

  /* ---------- Opening hours: live status in the menu (Europe/Madrid) ---------- */
  // 0 = Sunday ... 6 = Saturday; [open, close] in minutes after midnight
  var HOURS = { 1: [540, 1320], 2: [540, 1320], 3: [540, 1320], 4: [540, 1320], 5: [540, 1320], 6: [600, 1380] };
  var DAY_NAMES = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];

  function fmt(min) { return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0"); }

  function madridNow() {
    var parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: day, min: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
  }

  function initHours() {
    var el = $("[data-hours]");
    var text = $("[data-hours-text]");
    if (!el || !text || !window.Intl) return;

    function update() {
      var now = madridNow();
      var today = HOURS[now.day];
      if (today && now.min >= today[0] && now.min < today[1]) {
        el.classList.add("is-open");
        text.textContent = "Abierto ahora, hasta las " + fmt(today[1]);
        return;
      }
      el.classList.remove("is-open");
      if (today && now.min < today[0]) {
        text.textContent = "Cerrado, abrimos hoy a las " + fmt(today[0]);
        return;
      }
      for (var i = 1; i <= 7; i++) {
        var d = (now.day + i) % 7;
        if (HOURS[d]) {
          text.textContent = "Cerrado, abrimos " + (i === 1 ? "mañana" : DAY_NAMES[d]) + " a las " + fmt(HOURS[d][0]);
          return;
        }
      }
    }
    update();
    setInterval(update, 60000);
  }

  /* ---------- Menu (top-right box) ---------- */
  function initMenu() {
    var toggle = $("[data-menu-toggle]");
    var menu = $("[data-menu]");
    var main = $("#main");
    if (!toggle || !menu) return;
    var links = $$(".menu__links a", menu);
    var open = false;
    var anim = null;

    function origin() {
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2, y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      return { x: x, y: y, r: radius };
    }

    function setOpen(next) {
      if (next === open) return;
      open = next;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("is-locked", open);
      if (main) main.inert = open;
      if (anim) anim.kill();

      var o = origin();
      if (open) {
        menu.hidden = false;
        if (hasGsap) {
          anim = gsap.timeline()
            .fromTo(menu,
              { clipPath: "circle(0px at " + o.x + "px " + o.y + "px)" },
              { clipPath: "circle(" + o.r + "px at " + o.x + "px " + o.y + "px)", duration: 0.8, ease: "expo.inOut" })
            .fromTo($$(".menu__links a span", menu), { yPercent: 110 }, { yPercent: 0, duration: 0.8, stagger: 0.06, ease: "expo.out" }, 0.3)
            .fromTo(".menu__foot", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.5);
        }
        if (links[0]) links[0].focus({ preventScroll: true });
      } else {
        var done = function () { menu.hidden = true; };
        if (hasGsap) {
          anim = gsap.to(menu, {
            clipPath: "circle(0px at " + o.x + "px " + o.y + "px)",
            duration: 0.6, ease: "expo.inOut", onComplete: done
          });
        } else { done(); }
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener("click", function () { setOpen(!open); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false); });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (e) { if (e.matches) setOpen(false); });
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initHeader, "header");
    safe(initHours, "hours");
    safe(initMenu, "menu");
    safe(initMenuTabs, "menuTabs");

    if (!hasGsap) { revealAll(); return; }

    gsap.registerPlugin(ScrollTrigger);
    safe(initIntro, "intro");
    safe(initPancake, "pancake");
    safe(initGlow, "glow");
    safe(initBear, "bear");
    safe(initSections, "sections");

    revealAll();
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
