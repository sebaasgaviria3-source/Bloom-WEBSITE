/* =========================================================
   Bloom Coffee & Brunch — main.js
   Classic script + IIFE (no modules, no build). GSAP + ScrollTrigger + SplitText + Lenis from /lib.
   Everything that moves runs only when <html> has .motion (JS on, no reduced-motion).
   The hero (cover) keeps its own intro and bear exactly as before.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = false, motion = false; // set once the libraries are in (see the loader at the end)
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var CARTA_PDF = "assets/carta-bloom.pdf";
  var CARTA_WA = "https://wa.me/34640240176?text=" + encodeURIComponent("¡Hola Bloom! ¿Me podéis enviar la carta?");

  function safe(fn, name) {
    try { fn(); } catch (err) { console.warn("[bloom:" + name + "]", err); }
  }
  function ready() { root.classList.add("is-ready"); }

  /* =========================================================
     HERO (unchanged): the one orchestrated moment
     ========================================================= */
  function initIntro() {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    var neon = $("[data-neon]");
    var cta = $("[data-cta]");

    tl.fromTo("[data-hero-media]",
        { clipPath: "inset(4% 4% 4% 4%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, clearProps: "clipPath" }, 0)
      // the photo is visible from the first paint (it is the LCP); it only settles in scale
      .fromTo("[data-hero-img]",
        { scale: 1.18 },
        { scale: 1.04, duration: 1.8 }, 0)
      .fromTo("[data-intro='from-top']",
        { opacity: 0, yPercent: -100 },
        { opacity: 1, yPercent: 0, duration: 0.9, stagger: 0.08 }, 0.35)
      .fromTo("[data-intro='from-right']",
        { opacity: 0, xPercent: 100 },
        { opacity: 1, xPercent: 0, duration: 0.9 }, 0.45)
      // Neon sign switching on: a few irregular flickers, then steady
      .fromTo(neon,
        { opacity: 0 },
        { keyframes: { opacity: [0, 0.9, 0.1, 0.8, 0, 1, 0.35, 1] }, duration: 1.1, ease: "none" }, 0.85)
      .fromTo("[data-intro='line']",
        { opacity: 1, yPercent: 110 },
        { yPercent: 0, duration: 1.1, stagger: 0.12 }, 1.3)
      .fromTo(cta,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.9 }, 1.75);

    ready();
  }

  // the cover drifts away as you scroll, and the page slides up over it
  function initHeroScroll() {
    var st = { trigger: ".hero", start: "top top", end: "bottom top", scrub: true };
    gsap.to("[data-hero-media] picture", { yPercent: 14, ease: "none", scrollTrigger: st });
    gsap.to("[data-neon]", { y: -40, ease: "none", scrollTrigger: st });
    gsap.to("[data-hero-intro]", {
      y: -50, ease: "none",
      scrollTrigger: { trigger: "[data-hero-intro]", start: "top 70%", end: "bottom top", scrub: true }
    });
    var hero = $(".hero");
    if (hero) {
      ScrollTrigger.create({
        trigger: hero,
        start: function () { return hero.offsetHeight > window.innerHeight ? "bottom bottom" : "top top"; },
        end: "+=100%",
        pin: true,
        pinSpacing: false,
        invalidateOnRefresh: true
      });
    }
  }

  /* ---------- Hero bear: draws itself, then blinks ---------- */
  function initBear() {
    var bear = $("svg[data-bear]");
    if (!bear) return;
    var paths = $$("[data-draw]", bear);
    var face = $("[data-bear-face]", bear);
    var eyes = $$("[data-eye]", bear);

    paths.forEach(function (p) {
      var len = Math.ceil(p.getTotalLength()) + 2;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = motion ? len : 0;
    });
    if (!motion) return;

    gsap.to(eyes, { scaleY: 0.1, duration: 0.09, yoyo: true, repeat: -1, repeatDelay: 3.4, ease: "power1.inOut" });
    gsap.set(face, { opacity: 0 });
    gsap.timeline({ scrollTrigger: { trigger: bear, start: "top 95%", end: "top 55%", scrub: 0.7 } })
      .to(paths, { strokeDashoffset: 0, duration: 1, stagger: 0.05, ease: "none" })
      .to(face, { opacity: 1, duration: 0.3 }, "-=0.3");
  }

  /* =========================================================
     Bloom bear: the hero mascot, reused across the page.
     "peek" = head and paws over an edge, "sit" = whole bear holding the rose.
     Colours come from CSS custom properties on each slot.
     ========================================================= */
  var BEAR_STYLE = 'stroke="var(--bear-ink, #C42A5C)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"';
  var BEAR_FILL = 'fill="var(--bear-fill, #FFF7F0)"';
  var BEARS = {
    peek:
      '<svg viewBox="0 0 200 150" aria-hidden="true" focusable="false"><g class="bear-hit" ' + BEAR_STYLE + '>' +
        '<circle cx="54" cy="56" r="19" ' + BEAR_FILL + '/><circle cx="146" cy="56" r="19" ' + BEAR_FILL + '/>' +
        '<path d="M50 66 A8 8 0 0 1 55 52 M145 52 A8 8 0 0 1 150 66" fill="none"/>' +
        '<path d="M34 152 C34 94 63 64 100 64 C137 64 166 94 166 152 Z" ' + BEAR_FILL + '/>' +
        '<ellipse cx="100" cy="121" rx="22" ry="16" ' + BEAR_FILL + '/>' +
        '<path d="M100 118 Q100 126 93 127 M100 118 Q100 126 107 127" fill="none" stroke-width="3"/>' +
        '<g class="bear-eyes" stroke="none"><ellipse class="bear-eye" cx="80" cy="100" rx="4.5" ry="5" fill="var(--bear-ink, #C42A5C)"/><ellipse class="bear-eye" cx="120" cy="100" rx="4.5" ry="5" fill="var(--bear-ink, #C42A5C)"/></g>' +
        '<ellipse class="bear-nose" cx="100" cy="113" rx="7" ry="5" fill="var(--bear-ink, #C42A5C)" stroke="none"/>' +
        '<circle cx="64" cy="119" r="7" fill="var(--rose-light, #FF9DBC)" stroke="none" opacity=".8"/><circle cx="136" cy="119" r="7" fill="var(--rose-light, #FF9DBC)" stroke="none" opacity=".8"/>' +
        '<path d="M22 152 C22 130 54 130 54 152 Z M146 152 C146 130 178 130 178 152 Z" ' + BEAR_FILL + '/>' +
        '<path d="M33 140 V146 M43 140 V146 M157 140 V146 M167 140 V146" stroke-width="2.5"/>' +
      '</g></svg>',
    sit:
      '<svg viewBox="0 0 220 200" aria-hidden="true" focusable="false"><g class="bear-hit" ' + BEAR_STYLE + '>' +
        '<ellipse cx="100" cy="166" rx="44" ry="26" ' + BEAR_FILL + '/>' +
        '<ellipse cx="62" cy="182" rx="22" ry="13" ' + BEAR_FILL + '/><ellipse cx="138" cy="182" rx="22" ry="13" ' + BEAR_FILL + '/>' +
        '<circle cx="64" cy="66" r="18" ' + BEAR_FILL + '/><circle cx="136" cy="66" r="18" ' + BEAR_FILL + '/>' +
        '<path d="M60.5 74 A8 8 0 0 1 66 62 M134 62 A8 8 0 0 1 139.5 74" fill="none"/>' +
        '<ellipse cx="100" cy="112" rx="55" ry="50" ' + BEAR_FILL + '/>' +
        '<ellipse cx="100" cy="135" rx="21" ry="15" ' + BEAR_FILL + '/>' +
        '<path d="M100 134 Q100 142 93 143 M100 134 Q100 142 107 143" fill="none" stroke-width="3"/>' +
        '<g class="bear-eyes" stroke="none"><ellipse class="bear-eye" cx="80" cy="104" rx="4.5" ry="5" fill="var(--bear-ink, #C42A5C)"/><ellipse class="bear-eye" cx="120" cy="104" rx="4.5" ry="5" fill="var(--bear-ink, #C42A5C)"/></g>' +
        '<ellipse class="bear-nose" cx="100" cy="128" rx="7" ry="5" fill="var(--bear-ink, #C42A5C)" stroke="none"/>' +
        '<circle cx="66" cy="124" r="7" fill="var(--rose-light, #FF9DBC)" stroke="none" opacity=".8"/><circle cx="134" cy="124" r="7" fill="var(--rose-light, #FF9DBC)" stroke="none" opacity=".8"/>' +
        '<g class="bear-rose" stroke="var(--bear-rose, var(--bear-ink, #C42A5C))" fill="none">' +
          '<path d="M140 168 C152 142 166 112 177 86"/>' +
          '<path stroke-width="3.5" d="M162 124 C175 121 185 111 187 101 C175 101 165 109 162 124Z"/>' +
          '<path d="M163 60 C160 76 169 86 177 86 C187 86 196 76 192 60 M163 60 C166 51 173 52 177 58 C181 50 189 50 192 60 M171 68 C172 61 182 60 184 67 C185 73 176 75 175 69"/>' +
        '</g>' +
        '<ellipse cx="136" cy="160" rx="12" ry="10" ' + BEAR_FILL + '/>' +
      '</g></svg>'
  };


  function initBears() {
    // Only the empty slots; the hero bear is drawn inline and animated by initBear()
    var slots = $$(".bear-slot[data-bear]");
    slots.forEach(function (slot) {
      slot.innerHTML = BEARS[slot.getAttribute("data-bear")] || "";
    });
    if (!hasGsap) return;

    // Blink: each bear on its own rhythm
    slots.forEach(function (slot, i) {
      gsap.to($$(".bear-eye", slot), { scaleY: 0.1, duration: 0.08, yoyo: true, repeat: -1, repeatDelay: 2.8 + (i % 4) * 0.9, delay: i * 0.7, ease: "power1.inOut", transformOrigin: "50% 50%" });
    });

    // Tap a bear: a little hop and a heart floats up
    $$(".bear-slot .bear-hit").forEach(function (hit) {
      hit.addEventListener("click", function (e) {
        var svg = hit.ownerSVGElement;
        gsap.timeline()
          .to(svg, { y: -14, duration: 0.18, ease: "power2.out" })
          .to(svg, { y: 0, duration: 0.5, ease: "bounce.out" });
        heart(e.clientX, e.clientY);
      });
    });

    if (!motion) return;

    // Line bears draw themselves when they arrive, then float
    $$(".bear-slot[data-float]").forEach(function (slot) {
      var svg = $("svg", slot);
      var lines = $$("path", svg);
      lines.forEach(function (p) {
        var len = Math.ceil(p.getTotalLength()) + 2;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      });
      gsap.to(lines, { strokeDashoffset: 0, duration: 1.6, stagger: 0.04, ease: "power2.out",
        scrollTrigger: { trigger: slot, start: "top 85%", once: true } });
      gsap.to(svg, { y: -12, rotation: -3, transformOrigin: "50% 100%", duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });

    // Eyes follow the pointer (devices with a real cursor only)
    if (finePointer) {
      var px = -1, py = -1, ticking = false;
      var movers = $$(".bear-eyes").concat([$("[data-bear-face]")]).filter(Boolean).map(function (g) {
        return { g: g, eyes: g.classList.contains("bear-eyes") ? [g] : $$("[data-eye]", g) };
      });
      window.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          movers.forEach(function (m) {
            var r = m.g.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) return;
            var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
            var d = Math.hypot(dx, dy) || 1, k = Math.min(d / 260, 1) * 3.2;
            gsap.to(m.eyes, { x: dx / d * k, y: dy / d * k, duration: 0.4, overwrite: "auto" });
          });
        });
      }, { passive: true });
    }
  }

  function heart(x, y) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("viewBox", "0 0 24 24");
    el.setAttribute("class", "bear-heart");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<path fill="currentColor" d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z"/>';
    el.style.left = (x - 11) + "px";
    el.style.top = (y - 11) + "px";
    document.body.appendChild(el);
    gsap.fromTo(el, { scale: 0.4, opacity: 1 }, {
      y: -70, x: gsap.utils.random(-20, 20), scale: 1.2, opacity: 0, rotation: gsap.utils.random(-20, 20),
      duration: 1.1, ease: "power2.out", onComplete: function () { el.remove(); }
    });
  }

  /* =========================================================
     Header: glass on scroll, hides going down, returns going up,
     marks the link of the section in view
     ========================================================= */
  function initHeader() {
    var header = $("[data-header]");
    if (!header) return;
    var lastY = window.scrollY, ticking = false;
    var update = function () {
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 60);
      var menuOpen = root.classList.contains("menu-open");
      header.classList.toggle("is-hidden", !menuOpen && y > lastY + 4 && y > 240);
      if (y < lastY - 4 || y < 240) header.classList.remove("is-hidden");
      lastY = y;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

    var links = $$("[data-nav]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { // the cover clears every mark
          if (a.getAttribute("data-nav") === en.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute("data-nav")); if (s) io.observe(s); });
    var cover = document.getElementById("inicio");
    if (cover) io.observe(cover);
  }

  /* =========================================================
     Mobile menu: a circle opens from the burger, links rise one by one
     ========================================================= */
  var lenis = null;
  function initMenu() {
    var burger = $("[data-burger]");
    var menu = $("[data-menu]");
    if (!burger || !menu) return;
    var label = $(".sr-only", burger);
    var links = $$(".menu__links a", menu);
    var open = false, tl = null;

    function origin() {
      var r = burger.getBoundingClientRect();
      return (r.left + r.width / 2) + "px " + (r.top + r.height / 2) + "px";
    }
    function setOpen(next, returnFocus) {
      if (next === open) return;
      open = next;
      burger.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Cerrar menú" : "Abrir menú";
      root.classList.toggle("menu-open", open);
      document.body.classList.toggle("is-locked", open);
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      if (tl) tl.kill();
      if (open) {
        menu.hidden = false;
        if (motion) {
          var o = origin();
          tl = gsap.timeline()
            .fromTo(menu, { clipPath: "circle(0% at " + o + ")" }, { clipPath: "circle(150% at " + o + ")", duration: 0.8, ease: "power3.inOut" })
            .fromTo(links, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: "power3.out" }, 0.3)
            .fromTo($(".menu__foot", menu), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, 0.55);
        }
        links[0].focus({ preventScroll: true });
      } else {
        var done = function () { menu.hidden = true; if (returnFocus) burger.focus({ preventScroll: true }); };
        if (motion) {
          var o2 = origin();
          tl = gsap.timeline({ onComplete: done })
            .to(menu, { clipPath: "circle(0% at " + o2 + ")", duration: 0.6, ease: "power3.inOut" });
        } else done();
      }
    }
    burger.addEventListener("click", function () { setOpen(!open, true); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false, false); });
    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false, true); return; }
      if (e.key === "Tab") { // keep focus inside the menu + burger
        var f = [burger].concat($$("a", menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) setOpen(false, false); });
  }

  /* =========================================================
     Opening hours in Europe/Madrid (Anexo B)
     ========================================================= */
  var HOURS = { 0: null, 1: [9, 22], 2: [9, 22], 3: [9, 22], 4: [9, 22], 5: [9, 22], 6: [10, 23] };
  var DAYS = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function madridNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ""; };
    var h = parseInt(get("hour"), 10) % 24;
    return { day: WD[get("weekday")], mins: h * 60 + parseInt(get("minute"), 10) };
  }
  function hhmm(h) { return h + ":00"; }

  function statusText(now) {
    var today = HOURS[now.day];
    if (today && now.mins >= today[0] * 60 && now.mins < today[1] * 60) {
      return { open: true, text: "Abierto ahora · hasta las " + hhmm(today[1]) };
    }
    if (today && now.mins < today[0] * 60) return { open: false, text: "Cerrado · abrimos hoy a las " + hhmm(today[0]) };
    for (var k = 1; k <= 7; k++) {
      var d = (now.day + k) % 7;
      if (HOURS[d]) return { open: false, text: "Cerrado · abrimos " + (k === 1 ? "mañana" : DAYS[d]) + " a las " + hhmm(HOURS[d][0]) };
    }
    return { open: false, text: "Cerrado" };
  }

  function initStatus() {
    var els = $$("[data-status]");
    var rows = $$("[data-hours-table] tr[data-days]");
    var paint = function () {
      var now = madridNow();
      var s = statusText(now);
      els.forEach(function (el) {
        el.setAttribute("data-open", String(s.open));
        var t = $("[data-status-text]", el);
        if (t) t.textContent = s.text;
        if (el.tagName === "A") el.setAttribute("aria-label", "Cómo llegar. " + s.text);
      });
      rows.forEach(function (tr) {
        var isToday = parseInt(tr.getAttribute("data-days"), 10) === now.day;
        tr.classList.toggle("is-today", isToday);
        var th = $("th", tr), tag = $(".today-tag", th);
        if (isToday && !tag) { tag = document.createElement("span"); tag.className = "today-tag"; tag.textContent = "Hoy"; th.appendChild(tag); }
        if (!isToday && tag) tag.remove();
      });
    };
    paint();
    setInterval(paint, 60000);
  }

  /* =========================================================
     Carta: PDF if it exists, otherwise ask for it on WhatsApp
     ========================================================= */
  function initCarta() {
    var links = $$("[data-carta-pdf]");
    if (!links.length) return;
    var fallback = function () {
      links.forEach(function (a) { a.href = CARTA_WA; a.target = "_blank"; a.rel = "noopener"; });
      var main = $("[data-carta-main]");
      if (main) main.textContent = "Pídenos la carta por WhatsApp";
    };
    if (!window.fetch) return;
    fetch(CARTA_PDF, { method: "HEAD", cache: "no-store" }).then(function (r) {
      var type = (r.headers.get("content-type") || "").toLowerCase();
      if (!r.ok || type.indexOf("pdf") === -1) fallback();
    }).catch(fallback);
  }

  /* ---------- Mobile action bar: shows once 60% of the cover is behind ---------- */
  function initActionBar() {
    var bar = $("[data-actionbar]");
    var hero = $(".hero");
    if (!bar) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      var limit = hero ? hero.offsetHeight * 0.6 : 300;
      var nearEnd = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 40;
      bar.classList.toggle("is-visible", window.scrollY > limit && !root.classList.contains("menu-open") || nearEnd && window.scrollY > limit);
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Terrace video: plays only while it is on screen ---------- */
  function initVideo() {
    var v = $("[data-video]");
    if (!v) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { v.controls = true; v.preload = "metadata"; return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
        else v.pause();
      });
    }, { threshold: 0.25 }).observe(v);
  }

  /* =========================================================
     MOTION (JS on + no reduced-motion)
     ========================================================= */
  function initSmoothScroll() {
    if (!window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === "#inicio" ? 0 : -60 });
      history.replaceState(null, "", id);
    });
  }

  // Headings rise line by line out of a mask (after the fonts are in, so lines are measured right)
  function initSplits() {
    if (!window.SplitText) return;
    $$("[data-split]").forEach(function (el) {
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 110, duration: 1.05, stagger: 0.1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 86%", once: true }
          });
        }
      });
    });
  }

  // Photo frames open from below, the photo settles from 1.3 to 1
  function initReveals() {
    $$("[data-reveal-photo]").forEach(function (frame) {
      var img = $("img, video", frame);
      var tl = gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 88%", once: true } });
      tl.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.out" }, 0);
      if (img) tl.fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0);
    });
  }

  // Depth: each layer travels at its own speed, so photos pass over one another
  function initParallax() {
    $$("[data-speed]").forEach(function (el) {
      var s = parseFloat(el.getAttribute("data-speed")) || 0;
      // phones get half the travel, so the captions stay readable
      var amount = function () { return s * window.innerHeight * (window.innerWidth < 900 ? 0.5 : 1); };
      gsap.fromTo(el, { y: function () { return -amount(); } }, {
        y: function () { return amount(); },
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true }
      });
    });
    // the fixed photo behind the Carta drifts a touch
    var win = $(".window__img");
    if (win) {
      gsap.fromTo(win, { yPercent: -3, scale: 1.08 }, { yPercent: 3, scale: 1.08, ease: "none",
        scrollTrigger: { trigger: "[data-window]", start: "top bottom", end: "bottom top", scrub: true } });
    }
  }

  // Ribbon: endless loop; scrolling speeds it up and sets its direction
  function initMarquee() {
    var track = $("[data-marquee]");
    if (!track) return;
    var loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
    var dir = 1;
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = self.getVelocity();
        if (v) dir = v < 0 ? -1 : 1;
        var speed = gsap.utils.clamp(1, 5, 1 + Math.abs(v) / 400);
        gsap.to(loop, { timeScale: speed * dir, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: "power2.out" });
      }
    });
  }

  // Quote lights up word by word
  function initWords() {
    $$("[data-words]").forEach(function (q) {
      var words = q.textContent.trim().split(/\s+/);
      q.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
      gsap.fromTo($$(".w", q), { opacity: 0.18 }, { opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: q, start: "top 82%", end: "bottom 45%", scrub: true } });
    });
  }

  function initSideways() {
    var ev = $("[data-everyday]");
    if (ev) gsap.fromTo(ev, { xPercent: 4 }, { xPercent: -28, ease: "none",
      scrollTrigger: { trigger: ev.parentElement, start: "top bottom", end: "bottom top", scrub: true } });

    $$("[data-row]").forEach(function (row) {
      var dir = parseFloat(row.getAttribute("data-row"));
      var dist = function () { return Math.max(row.scrollWidth - window.innerWidth, 0) * 0.6; };
      gsap.fromTo(row, { x: function () { return dir < 0 ? 0 : -dist(); } }, {
        x: function () { return dir < 0 ? -dist() : 0; },
        ease: "none",
        scrollTrigger: { trigger: row.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true }
      });
    });
  }

  function initFooterWord() {
    var w = $("[data-footer-word]");
    if (!w) return;
    w.innerHTML = w.textContent.split("").map(function (c) { return '<span class="ch">' + c + "</span>"; }).join("");
    gsap.from($$(".ch", w), { yPercent: 70, opacity: 0, rotation: 6, duration: 1, stagger: 0.07, ease: "back.out(1.6)",
      scrollTrigger: { trigger: w, start: "top 90%", once: true } });
  }

  /* ---------- Pointer details (mouse only) ---------- */
  function initPointer() {
    if (!finePointer) return;

    // magnetic buttons
    $$("[data-magnetic]").forEach(function (el) {
      var xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });

    // photo that follows the cursor over the carta list
    var list = $("[data-carta-list]"), prev = $("[data-carta-preview]");
    if (list && prev && window.matchMedia("(min-width: 900px)").matches) {
      var img = $("img", prev);
      var px = gsap.quickTo(prev, "x", { duration: 0.5, ease: "power3.out" });
      var py = gsap.quickTo(prev, "y", { duration: 0.5, ease: "power3.out" });
      var rot = gsap.quickTo(prev, "rotation", { duration: 0.6, ease: "power3.out" });
      var lastX = 0;
      list.addEventListener("pointermove", function (e) {
        px(e.clientX + 30); py(e.clientY - 180);
        rot(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
        lastX = e.clientX;
      });
      $$(".carta-row", list).forEach(function (row) {
        row.addEventListener("pointerenter", function () {
          var src = row.getAttribute("data-preview-src");
          if (src && img.getAttribute("src") !== src) img.setAttribute("src", src);
          gsap.to(prev, { opacity: 1, scale: 1, duration: 0.35 });
        });
      });
      list.addEventListener("pointerleave", function () { gsap.to(prev, { opacity: 0, scale: 0.9, duration: 0.3 }); });
    }

    // round label that follows the cursor over the collage
    var label = $("[data-cursor-label]");
    if (label) {
      var text = $("span", label);
      var lx = gsap.quickTo(label, "x", { duration: 0.35, ease: "power3.out" });
      var ly = gsap.quickTo(label, "y", { duration: 0.35, ease: "power3.out" });
      $$("[data-cursor]").forEach(function (item) {
        item.addEventListener("pointerenter", function () {
          text.textContent = item.getAttribute("data-cursor");
          gsap.to(label, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)" });
        });
        item.addEventListener("pointermove", function (e) { lx(e.clientX); ly(e.clientY); });
        item.addEventListener("pointerleave", function () { gsap.to(label, { scale: 0, opacity: 0, duration: 0.3 }); });
      });
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initHeader, "header");
    safe(initMenu, "menu");
    safe(initStatus, "status");
    safe(initCarta, "carta");
    safe(initActionBar, "actionbar");
    safe(initVideo, "video");

    if (!hasGsap) { safe(initBears, "bears"); ready(); return; }
    gsap.registerPlugin.apply(gsap, [ScrollTrigger, window.SplitText].filter(Boolean));
    ScrollTrigger.config({ ignoreMobileResize: true });

    if (!motion) { safe(initBear, "bear"); safe(initBears, "bears"); ready(); return; }

    // First screen now; everything below the fold once the browser is idle (keeps the first paint free)
    safe(initIntro, "intro");
    safe(initBear, "bear");

    var queue = [[initHeroScroll, "hero"], [initSmoothScroll, "lenis"], [initBears, "bears"], [initReveals, "reveals"], [initParallax, "parallax"],
      [initMarquee, "marquee"], [initWords, "words"], [initSideways, "sideways"], [initFooterWord, "footer"], [initPointer, "pointer"],
      [initSplits, "splits"]];
    var next = function () {
      var job = queue.shift();
      if (!job) { ScrollTrigger.refresh(); return; }
      safe(job[0], job[1]);
      setTimeout(next, 0);
    };
    // headings are split once the fonts are in, so the lines are measured on the real letters (never wait more than 2.5 s)
    var started = false;
    var go = function () {
      if (started) return;
      started = true;
      if ("requestIdleCallback" in window) requestIdleCallback(next, { timeout: 1200 });
      else setTimeout(next, 300);
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(go, go);
    setTimeout(go, 2500);
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Loader: paint the cover first (it is the LCP), then pull the libraries in order ---------- */
  var LIBS = ["lib/gsap.min.js", "lib/ScrollTrigger.min.js", "lib/SplitText.min.js", "lib/lenis.min.js"];
  function loadLibs(done) {
    var i = 0;
    (function next() {
      if (i >= LIBS.length) { done(); return; }
      var s = document.createElement("script");
      s.src = LIBS[i++];
      s.onload = next;
      s.onerror = next; // a missing library only switches the motion off
      document.head.appendChild(s);
    })();
  }
  function start() {
    requestAnimationFrame(function () {
      setTimeout(function () {
        loadLibs(function () {
          hasGsap = !!(window.gsap && window.ScrollTrigger);
          motion = root.classList.contains("motion") && hasGsap;
          boot();
        });
      }, 0);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
