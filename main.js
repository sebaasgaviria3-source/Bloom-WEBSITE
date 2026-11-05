/* =========================================================
   Bloom Coffee & Brunch — main.js
   Classic script + IIFE (no modules). GSAP + ScrollTrigger from /lib.
   Every init is isolated with safe(); content never depends on JS.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[bloom:" + name + "]", err); }
  }

  function revealAll() { root.classList.remove("js-intro"); }

  /* ---------- Intro timeline (on load) ---------- */
  function initIntro() {
    var media = $("[data-hero-media]");
    var img = $("[data-hero-img]");
    var tag = $(".hero__tag");
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    // Pill is centred with CSS translate(-50%,-50%); hand that over to GSAP percent props
    gsap.set(tag, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    tl.fromTo(media,
        { clipPath: "inset(5% 5% 5% 5% round 28px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.5, clearProps: "clipPath" }, 0)
      .fromTo(img,
        { opacity: 0, scale: 1.28 },
        { opacity: 1, scale: 1.06, duration: 1.9 }, 0)
      .fromTo("[data-intro='drop']",
        { opacity: 0, y: -40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "back.out(1.7)" }, 0.35)
      .fromTo("[data-intro='pop']",
        { opacity: 0, scale: 0.4 },
        { opacity: 1, scale: 1, duration: 0.9, ease: "back.out(2.2)" }, 0.65)
      .fromTo(".hero__kicker",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8 }, 0.75)
      .fromTo("[data-intro='line']",
        { opacity: 1, yPercent: 115, rotate: 3 },
        { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.12 }, 0.8)
      .fromTo("[data-swash]",
        { strokeDasharray: 320, strokeDashoffset: 320 },
        { strokeDashoffset: 0, duration: 0.9, ease: "power3.inOut" }, 1.5)
      .fromTo(".hero__aside [data-intro='fade']",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }, 1.25)
      .fromTo("[data-action-bar]",
        { yPercent: 140, y: 0 },
        { yPercent: 0, y: 0, duration: 1, ease: "back.out(1.4)" }, 1.4);

    // From-states are now inline: the CSS pre-hide can go
    revealAll();
  }

  /* ---------- Header state on scroll ---------- */
  function initHeader() {
    var header = $("[data-header]");
    var update = function () { header.classList.toggle("is-scrolled", window.scrollY > 60); };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Scroll-linked motion (GSAP ScrollTrigger) ---------- */
  function initScrollMotion() {
    var mm = gsap.matchMedia();

    mm.add({
      motion: "(prefers-reduced-motion: no-preference)",
      desktop: "(min-width: 1100px)"
    }, function (ctx) {
      var c = ctx.conditions;
      if (!c.motion) return;

      // Hero photo parallax: photo drifts slower than the page
      gsap.to("[data-hero-media] picture", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });

      // Title lines slide in opposite directions while the block crosses the viewport
      $$(".hero__title .line").forEach(function (line, i) {
        var dir = i % 2 === 0 ? -1 : 1;
        gsap.fromTo(line,
          { x: dir * (c.desktop ? 28 : 14) },
          {
            x: -dir * (c.desktop ? 28 : 14),
            ease: "none",
            scrollTrigger: { trigger: "[data-hero-block]", start: "top bottom", end: "bottom top", scrub: 0.6 }
          });
      });

      // Floating blooms rise at different speeds
      $$("[data-float]").forEach(function (el, i) {
        gsap.to(el, {
          y: -60 - i * 40,
          ease: "none",
          scrollTrigger: { trigger: "[data-hero-block]", start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    });
  }

  /* ---------- Idle loops: blooms spin, pill breathes ---------- */
  function initIdle() {
    $$("[data-float]").forEach(function (el, i) {
      gsap.to(el, { rotation: i % 2 ? -360 : 360, duration: 38 + i * 12, ease: "none", repeat: -1 });
    });
  }

  /* ---------- Pastel glows drift slowly (blurred colour, never hard edges) ---------- */
  function initGlow() {
    $$("[data-glow]").forEach(function (el, i) {
      gsap.to(el, {
        xPercent: i % 2 ? -18 : 16,
        yPercent: i % 2 ? 12 : -14,
        scale: 1.15,
        duration: 9 + i * 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      });
    });
  }

  /* ---------- Opening hours: live "open now" status (Europe/Madrid) ---------- */
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
        text.textContent = "Abierto ahora · hasta las " + fmt(today[1]);
        return;
      }
      el.classList.remove("is-open");
      if (today && now.min < today[0]) {
        text.textContent = "Cerrado · abrimos hoy a las " + fmt(today[0]);
        return;
      }
      for (var i = 1; i <= 7; i++) {
        var d = (now.day + i) % 7;
        if (HOURS[d]) {
          text.textContent = "Cerrado · abrimos " + (i === 1 ? "mañana" : DAY_NAMES[d]) + " a las " + fmt(HOURS[d][0]);
          return;
        }
      }
    }
    update();
    setInterval(update, 60000);
  }

  /* ---------- Bear: line drawing on scroll, then idle life ---------- */
  function initBear() {
    var bear = $("[data-bear]");
    if (!bear) return;
    var paths = $$("[data-draw]", bear);
    var face = $("[data-bear-face]", bear);
    var body = $("[data-bear-body]", bear);
    var eyes = $$("[data-eye]", bear);

    paths.forEach(function (p) {
      var len = Math.ceil(p.getTotalLength()) + 2;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = reduceMotion ? 0 : len;
    });

    // Life: gentle sway + blinking
    gsap.to(body, { rotation: 4, svgOrigin: "100 190", duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    gsap.to(eyes, { scaleY: 0.1, duration: 0.09, yoyo: true, repeat: -1, repeatDelay: 3.4, ease: "power1.inOut" });

    if (reduceMotion) return;

    gsap.set(face, { opacity: 0, scale: 0.6, svgOrigin: "100 120" });
    var tl = gsap.timeline({
      scrollTrigger: { trigger: bear, start: "top 100%", end: "bottom 95%", scrub: 0.7 }
    });
    tl.to(paths, { strokeDashoffset: 0, duration: 1, stagger: 0.06, ease: "none" })
      .to(face, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, "-=0.35");
  }

  /* ---------- Ticker: infinite loop that reacts to scroll velocity ---------- */
  function initTicker() {
    var track = $("[data-ticker]");
    if (!track) return;
    var base = reduceMotion ? 0.35 : 1;
    var loop = gsap.to(track, { xPercent: -50, duration: 34, ease: "none", repeat: -1 });
    loop.timeScale(base);
    var dir = 1;

    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: function (self) {
        if (reduceMotion) return;
        var v = self.getVelocity();
        dir = self.direction;
        var boost = gsap.utils.clamp(-7, 7, v / 220);
        loop.timeScale(boost || dir);
        gsap.to(loop, { timeScale: dir * base, duration: 1.1, ease: "power2.out", overwrite: true });
      }
    });

    var host = track.parentElement;
    host.addEventListener("pointerenter", function () { gsap.to(loop, { timeScale: 0.15, duration: 0.6, overwrite: true }); });
    host.addEventListener("pointerleave", function () { gsap.to(loop, { timeScale: dir * base, duration: 0.6, overwrite: true }); });
  }

  /* ---------- Photo follows the cursor a little (desktop) ---------- */
  function initPhotoHover() {
    if (!finePointer || reduceMotion) return;
    var media = $("[data-hero-media]");
    var img = $("[data-hero-img]");
    var xTo = gsap.quickTo(img, "x", { duration: 1.2, ease: "power3.out" });
    var yTo = gsap.quickTo(img, "y", { duration: 1.2, ease: "power3.out" });
    media.addEventListener("pointermove", function (e) {
      var r = media.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * -24);
      yTo(((e.clientY - r.top) / r.height - 0.5) * -16);
    });
    media.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      btn.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Mobile menu ---------- */
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
            .fromTo([".menu__eyebrow", ".menu__foot"], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 0.45);
        } else {
          menu.style.clipPath = "none";
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
    links.forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    $$(".menu__foot a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false); });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (e) { if (e.matches) setOpen(false); });
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initHeader, "header");
    safe(initHours, "hours");
    safe(initMenu, "menu");

    if (!hasGsap) { revealAll(); return; }

    gsap.registerPlugin(ScrollTrigger);
    root.classList.add("has-gsap");

    safe(initIntro, "intro");
    safe(initScrollMotion, "scroll");
    safe(initIdle, "idle");
    safe(initGlow, "glow");
    safe(initBear, "bear");
    safe(initTicker, "ticker");
    safe(initPhotoHover, "photoHover");
    safe(initMagnetic, "magnetic");

    // Never leave anything hidden, whatever happens above
    revealAll();
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
