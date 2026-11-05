/* =========================================================
   Bloom Coffee & Brunch — main.js
   Classic script + IIFE (no modules). GSAP + ScrollTrigger from /lib.
   Motion budget: one orchestrated intro (photo → boxes → neon → button → phrase),
   plus quiet scroll parallax and the bear drawing itself.
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
    var cta = $("[data-cta]");

    // The button is centred with CSS translate(-50%,-50%); hand that over to GSAP percent props
    gsap.set(cta, { xPercent: -50, yPercent: -50, x: 0, y: 0 });

    tl.fromTo("[data-hero-media]",
        { clipPath: "inset(4% 4% 4% 4%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, clearProps: "clipPath" }, 0)
      .fromTo("[data-hero-img]",
        { opacity: 0, scale: 1.25 },
        { opacity: 1, scale: 1.04, duration: 1.8 }, 0)
      .fromTo("[data-intro='from-top']",
        { opacity: 0, yPercent: -100 },
        { opacity: 1, yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.35)
      .fromTo("[data-intro='from-right']",
        { opacity: 0, xPercent: 100 },
        { opacity: 1, xPercent: 0, duration: 0.9 }, 0.45);

    // Neon sign switching on: a few irregular flickers, then steady
    if (reduceMotion) {
      tl.fromTo(neon, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0.8);
    } else {
      tl.fromTo(neon,
        { opacity: 0 },
        { keyframes: { opacity: [0, 0.9, 0.1, 0.8, 0, 1, 0.35, 1] }, duration: 1.1, ease: "none" }, 0.85);
    }

    tl.fromTo(cta,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.9 }, 1.35)
      .fromTo("[data-intro='line']",
        { opacity: 1, yPercent: 110 },
        { yPercent: 0, duration: 1.1, stagger: 0.12 }, 1.45);

    revealAll();
  }

  /* ---------- Header state on scroll ---------- */
  function initHeader() {
    var header = $("[data-header]");
    var update = function () { header.classList.toggle("is-scrolled", window.scrollY > 60); };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ---------- Quiet scroll parallax ---------- */
  function initScrollMotion() {
    if (reduceMotion) return;
    var st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to("[data-hero-media] picture", { yPercent: 12, ease: "none", scrollTrigger: st });
    gsap.to("[data-neon]", { y: -40, ease: "none", scrollTrigger: st });
    gsap.to("[data-detail] picture", {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: "[data-detail]", start: "top bottom", end: "bottom top", scrub: true }
    });
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

    if (!hasGsap) { revealAll(); return; }

    gsap.registerPlugin(ScrollTrigger);
    safe(initIntro, "intro");
    safe(initScrollMotion, "scroll");
    safe(initGlow, "glow");
    safe(initBear, "bear");

    revealAll();
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
