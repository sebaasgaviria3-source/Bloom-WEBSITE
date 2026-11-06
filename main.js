/* =========================================================
   Bloom Coffee & Brunch — main.js
   Classic script + IIFE (no modules). GSAP + ScrollTrigger from /lib.
   Motion budget: one orchestrated intro (photo → boxes → neon → headline → menu link),
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
        { opacity: 1, xPercent: 0, duration: 0.9 }, 0.45);

    // Neon sign switching on: a few irregular flickers, then steady
    if (reduceMotion) {
      tl.fromTo(neon, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0.8);
    } else {
      tl.fromTo(neon,
        { opacity: 0 },
        { keyframes: { opacity: [0, 0.9, 0.1, 0.8, 0, 1, 0.35, 1] }, duration: 1.1, ease: "none" }, 0.85);
    }

    tl.fromTo("[data-intro='line']",
        { opacity: 1, yPercent: 110 },
        { yPercent: 0, duration: 1.1, stagger: 0.12 }, 1.3)
      .fromTo(cta,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.9 }, 1.75);

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
    // Headline block lifts away slightly faster than the page as the collage arrives
    gsap.to("[data-hero-intro]", {
      y: -50,
      ease: "none",
      scrollTrigger: { trigger: "[data-hero-intro]", start: "top 70%", end: "bottom top", scrub: true }
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
      var eyes = $$(".bear-eye", slot);
      gsap.to(eyes, { scaleY: 0.1, duration: 0.08, yoyo: true, repeat: -1, repeatDelay: 2.8 + (i % 4) * 0.9, delay: i * 0.7, ease: "power1.inOut" });
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

    if (reduceMotion) return;

    // Peeking bears slide up from behind their edge when the section arrives, then idle
    $$("[data-peek]").forEach(function (slot) {
      var svg = $("svg", slot);
      gsap.set(svg, { yPercent: 100, transformOrigin: "50% 100%" });
      ScrollTrigger.create({
        trigger: slot.parentElement,
        start: "top 75%",
        end: "bottom 15%",
        onToggle: function (self) {
          gsap.to(svg, self.isActive
            ? { yPercent: 0, duration: 0.9, ease: "back.out(1.6)", delay: 0.15 }
            : { yPercent: 100, duration: 0.5, ease: "power2.in" });
        }
      });
      gsap.to(svg, { rotation: 4, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });

    // Sitting bears drop onto their perch and sway a little
    $$("[data-bear='sit']").forEach(function (slot) {
      var svg = $("svg", slot);
      gsap.fromTo(svg, { y: -40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: "bounce.out",
        scrollTrigger: { trigger: slot, start: "top 85%", toggleActions: "play none none reverse" }
      });
      gsap.to(svg, { rotation: -3, transformOrigin: "50% 100%", duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });

    // Eyes follow the pointer (devices with a real cursor only)
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      var px = -1, py = -1, ticking = false;
      var groups = $$(".bear-eyes").concat([$("[data-bear-face]")]).filter(Boolean);
      var movers = groups.map(function (g) {
        var eyes = g.classList.contains("bear-eyes") ? [g] : $$("[data-eye]", g);
        return { g: g, eyes: eyes };
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
    el.innerHTML = '<path fill="currentColor" d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z"/>';
    el.style.left = (x - 11) + "px";
    el.style.top = (y - 11) + "px";
    document.body.appendChild(el);
    gsap.fromTo(el, { scale: 0.4, opacity: 1 }, {
      y: -70, x: gsap.utils.random(-20, 20), scale: 1.2, opacity: 0, rotation: gsap.utils.random(-20, 20),
      duration: 1.1, ease: "power2.out", onComplete: function () { el.remove(); }
    });
  }

  /* ---------- Big headlines: words rise out of a mask (GSAP SplitText) ---------- */
  var hasSplit = !!window.SplitText;
  function splitHeadlines() {
    if (!hasSplit) return;
    $$("[data-split]").forEach(function (h) {
      h._split = SplitText.create(h, { type: "words", mask: "words", wordsClass: "w" });
    });
  }

  /* =========================================================
     Cinema: one pinned, scroll-scrubbed scene over the venue's own footage.
     1 the video grows out of a portrait window (Flip) under "Bienvenido a Bloom"
     2 photos drift in from every side at their own speed and depth, "Café, brunch y calma"
     3 the terrace photo wipes up over the video, "Una terraza para quedarse", soft hand-off
     ========================================================= */
  /* ---------- Stacked sections: each section holds while the next slides up over it ---------- */
  function initStack() {
    var mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      var dims = [];
      $$(".hero, .favs, .story, .menu-cover, .reel, .visit").forEach(function (sec) {
        var dim = document.createElement("span");
        dim.className = "stack-dim";
        dim.setAttribute("aria-hidden", "true");
        sec.appendChild(dim);
        dims.push(dim);
        var tall = function () { return sec.offsetHeight > window.innerHeight; };
        gsap.fromTo(dim, { opacity: 0 }, {
          opacity: 1, ease: "none",
          scrollTrigger: {
            trigger: sec,
            start: function () { return tall() ? "bottom bottom" : "top top"; },
            end: "+=100%",
            pin: true,
            pinSpacing: false,
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      });
      return function () { dims.forEach(function (d) { if (d.parentNode) d.parentNode.removeChild(d); }); };
    });

    // section photos drift slower than the page (depth)
    mm.add("(prefers-reduced-motion: no-preference)", function () {
      $$("[data-sec-bg]").forEach(function (img) {
        var sec = img.closest("section");
        gsap.fromTo(img, { yPercent: -5, scale: 1.08 }, { yPercent: 5, scale: 1, ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
  }

  function initCinema() {
    var section = $("[data-cinema]");
    if (!section) return;
    var stage = $("[data-cinema-stage]", section);
    var videoBox = $("[data-cinema-video]", section);
    var video = $("video", videoBox);
    var photo = $("[data-cinema-photo]", section);

    // Play the footage only while the scene is on screen
    if (video && "IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { video.preload = "auto"; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
          else video.pause();
        });
      }, { rootMargin: "200px 0px" }).observe(section);
    }

    var mm = gsap.matchMedia();
    mm.add({ isMobile: "(max-width: 899px)", motion: "(prefers-reduced-motion: no-preference)" }, function (ctx) {
      var c = ctx.conditions;
      if (!c.motion) return;
      section.classList.add("is-live");

      var tA = $("[data-cinema-text='a']", section);
      var tB = $("[data-cinema-text='b']", section);
      var tC = $("[data-cinema-text='c']", section);
      var splitA = hasSplit ? SplitText.create(tA, { type: "chars,words", mask: "words" }) : null;
      var splitB = hasSplit ? SplitText.create(tB, { type: "words", mask: "words" }) : null;
      var splitC = hasSplit ? SplitText.create(tC, { type: "chars,words", mask: "words" }) : null;
      var charsA = splitA ? splitA.chars : [tA];
      var wordsB = splitB ? splitB.words : [tB];
      var charsC = splitC ? splitC.chars : [tC];

      var tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: c.isMobile ? "+=380%" : "+=440%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          refreshPriority: 1,
          onLeave: function () { section.classList.add("is-done"); },
          onEnterBack: function () { section.classList.remove("is-done"); }
        }
      });

      // 1. The video grows from a portrait window into the full frame (Flip), title A writes in
      if (window.Flip) {
        videoBox.classList.add("is-card");
        var state = Flip.getState(videoBox, { props: "borderRadius" });
        videoBox.classList.remove("is-card");
        tl.add(Flip.from(state, { duration: 1, ease: "bloom", absolute: true, props: "borderRadius" }), 0);
      }
      tl.fromTo($("video", videoBox), { scale: 1.3 }, { scale: 1.06, duration: 1.4, ease: "power1.out" }, 0)
        .fromTo(charsA, { yPercent: 115, rotation: 6 }, { yPercent: 0, rotation: 0, duration: 0.5, stagger: 0.025, ease: "bloom" }, 0.15)
        .to(charsA, { yPercent: -115, opacity: 0, duration: 0.35, stagger: 0.015, ease: "power2.in" }, 1.15);

      // 2. Two large photos: the portrait rises out of a mask, the landscape slides in from the right
      var big = $$("[data-cbig]", section);
      if (big[0]) {
        tl.fromTo(big[0], { clipPath: "inset(100% 0% 0% 0%)", y: 60 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.7, ease: "bloom" }, 1.05)
          .fromTo($("img", big[0]), { scale: 1.3 }, { scale: 1, duration: 1.4 }, 1.05)
          .to(big[0], { y: -40, duration: 0.8 }, 1.75)
          .to(big[0], { clipPath: "inset(0% 0% 100% 0%)", duration: 0.55, ease: "power2.in" }, 2.35);
      }
      if (big[1]) {
        tl.fromTo(big[1], { clipPath: "inset(0% 0% 0% 100%)", x: 40 }, { clipPath: "inset(0% 0% 0% 0%)", x: 0, duration: 0.7, ease: "bloom" }, 1.3)
          .fromTo($("img", big[1]), { scale: 1.3, xPercent: 6 }, { scale: 1, xPercent: 0, duration: 1.3 }, 1.3)
          .to(big[1], { y: 30, duration: 0.8 }, 1.95)
          .to(big[1], { clipPath: "inset(0% 100% 0% 0%)", duration: 0.55, ease: "power2.in" }, 2.45);
      }
      tl.fromTo(wordsB, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: "bloom" }, 1.5)
        .to(tB, { opacity: 0, filter: "blur(10px)", scale: 1.06, duration: 0.4 }, 2.35);

      // 3. The terrace photo wipes up over the video; the video zooms away beneath it
      tl.fromTo(photo, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8, ease: "power2.inOut" }, 2.55)
        .fromTo($("img", photo), { scale: 1.35, yPercent: 6 }, { scale: 1.04, yPercent: 0, duration: 1.5, ease: "power1.out" }, 2.55)
        .to(videoBox, { scale: 1.15, opacity: 0.4, duration: 0.8 }, 2.55)
        .fromTo(charsC, { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.02, ease: "bloom" }, 3.1)
        .fromTo("[data-cinema-caption]", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3 }, 3.45)
        // hand-off: soft pastel fade at the foot of the frame into the story below
        .to("[data-cinema-fade]", { opacity: 1, duration: 0.45 }, 3.75)
        .to([tC, "[data-cinema-caption]"], { yPercent: -18, opacity: 0, duration: 0.45 }, 3.8);

      // caption starts hidden in the live version
      gsap.set("[data-cinema-caption]", { opacity: 0 });

      return function () { section.classList.remove("is-live"); };
    });
  }

  function initSections() {
    splitHeadlines();
    var mm = gsap.matchMedia();

    var conditions = {
      isMobile: "(max-width: 899px)",
      fine: "(hover: hover) and (pointer: fine)",
      motion: "(prefers-reduced-motion: no-preference)"
    };

    // Two batches with a pause between them, so neither is a long main-thread task
    mm.add(conditions, function (ctx) {
      var c = ctx.conditions;
      if (!c.motion) return;

      /* Headlines: words rise out of their masks */
      $$("[data-split]").forEach(function (h) {
        if (!h._split) return;
        gsap.fromTo(h._split.words, { yPercent: 110, rotation: 4 }, {
          yPercent: 0, rotation: 0, duration: 1.1, stagger: 0.08, ease: "bloom",
          scrollTrigger: { trigger: h, start: "top 88%", once: true },
          onStart: function () {
            $$(".display__it", h).forEach(function (w) {
              w.classList.add("neon-flicker");
              setTimeout(function () { w.classList.remove("neon-flicker"); w.classList.add("is-lit"); }, 1200);
            });
          }
        });
      });

      /* Ticker ribbons: endless loop that speeds up and follows the scroll direction */
      var loops = $$("[data-ticker]").map(function (track) {
        var dir = parseFloat(track.getAttribute("data-ticker"));
        return gsap.fromTo(track, { xPercent: dir > 0 ? -50 : 0 }, { xPercent: dir > 0 ? 0 : -50, duration: 26, ease: "none", repeat: -1 });
      });
      if (loops.length) {
        var scrollDir = 1;
        ScrollTrigger.create({
          trigger: ".ticker", start: "top bottom", end: "bottom top",
          onUpdate: function (self) {
            scrollDir = self.direction;
            var boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 5);
            loops.forEach(function (l) {
              gsap.to(l, { timeScale: scrollDir * boost, duration: 0.15, overwrite: true });
              gsap.to(l, { timeScale: scrollDir, duration: 1.2, delay: 0.2, ease: "power2.out" });
            });
          }
        });
      }

      /* Photos: arrive with a soft scale, then drift at their own depth */
      $$("[data-photo]").forEach(function (ph) {
        var depth = parseFloat(ph.getAttribute("data-depth")) || 0;
        var img = $("img", ph);
        gsap.fromTo(ph, { opacity: 0, scale: 0.86 }, {
          opacity: 1, scale: 1, duration: 1.1, ease: "expo.out",
          scrollTrigger: { trigger: ph, start: "top 92%", once: true }
        });
        gsap.fromTo(img, { scale: 1.25 }, {
          scale: 1, ease: "none",
          scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom 40%", scrub: true }
        });
        if (depth) {
          var amt = depth * (c.isMobile ? 40 : 90);
          gsap.fromTo(ph, { y: amt }, {
            y: -amt, ease: "none",
            scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true }
          });
        }
      });

    });

    setTimeout(function () { mm.add(conditions, function (ctx) {
      var c = ctx.conditions;
      if (!c.motion) return;

      /* Decorative shapes float and spin with the scroll */
      $$("[data-float]").forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-float"));
        gsap.fromTo(el, { y: d * 60 }, { y: -d * 60, rotation: d * 20, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
      $$("[data-spin]").forEach(function (el) {
        gsap.to(el, { rotation: 300, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 } });
      });

      /* Menú cover: photo parallax, label swings into place */
      var frame = $("[data-menu-frame]");
      if (frame) {
        gsap.fromTo($("picture", frame), { yPercent: -6 }, { yPercent: 6, ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(frame, { clipPath: "inset(8% 8% 8% 8% round 60px)" }, { clipPath: "inset(0% 0% 0% 0% round 30px)", ease: "power2.out",
          scrollTrigger: { trigger: frame, start: "top 95%", end: "top 30%", scrub: 0.6 } });
        gsap.fromTo("[data-menu-label]", { y: 90, rotation: -16, scale: 0.8 }, { y: 0, rotation: -4, scale: 1, ease: "back.out(1.4)",
          scrollTrigger: { trigger: "[data-menu-label]", start: "top bottom", end: "top 55%", scrub: 0.6 } });
      }

      /* Gallery reels: two rows travel in opposite directions as you scroll */
      $$("[data-reel]").forEach(function (row) {
        var dir = parseFloat(row.getAttribute("data-reel"));
        var dist = function () { return -Math.max(row.scrollWidth - window.innerWidth, 0); };
        gsap.fromTo(row,
          { x: function () { return dir < 0 ? 0 : dist(); } },
          { x: function () { return dir < 0 ? dist() : 0; }, ease: "none",
            scrollTrigger: { trigger: row.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6, invalidateOnRefresh: true } });
      });

      /* Map circle rolls in */
      var map = $("[data-map]");
      if (map) {
        gsap.fromTo(map, { xPercent: c.isMobile ? 40 : 30, rotation: 30, opacity: 0 }, { xPercent: 0, rotation: 0, opacity: 1, ease: "power2.out",
          scrollTrigger: { trigger: map, start: "top bottom", end: "top 60%", scrub: 0.5 } });
      }

      /* Favourites background: big line-drawn blooms turn and drift against the photos,
         so the photos' own motion reads more clearly */
      $$("[data-bloom-line]").forEach(function (el) {
        var d = parseFloat(el.getAttribute("data-bloom-line"));
        gsap.fromTo(el, { y: -d * 140, rotation: 0 }, { y: d * 140, rotation: d * 70, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
      });
      $$("[data-glow-drift]").forEach(function (el, i) {
        gsap.to(el, { xPercent: i ? 30 : -25, yPercent: i ? -20 : 18, scale: 1.2, duration: 9 + i * 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });

      /* Story: both photos bloom open together — a soft radial mask widens while blur clears */
      var storyPhotos = $$("[data-story-photo]");
      if (storyPhotos.length) {
        gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: ".story__photos", start: "top 88%", end: "center 52%", scrub: 0.9 }
        })
          .fromTo(storyPhotos, { "--m": "-22%", filter: "blur(18px)", scale: 1.14, opacity: 0.35 },
            { "--m": "100%", filter: "blur(0px)", scale: 1, opacity: 1, duration: 1 }, 0)
          .fromTo($$("img", $(".story__photos")), { scale: 1.3 }, { scale: 1, duration: 1 }, 0);
        storyPhotos.forEach(function (ph, i) {
          gsap.fromTo(ph, { y: i ? 50 : -30 }, { y: i ? -50 : 30, ease: "none",
            scrollTrigger: { trigger: ".story", start: "top bottom", end: "bottom top", scrub: true } });
        });
      }

      /* Social: the script slogan writes itself in, the icons pop and then float */
      var sTitle = $("[data-social-title]");
      if (sTitle) {
        gsap.fromTo(sTitle, { clipPath: "inset(-20% 100% -20% 0%)" }, { clipPath: "inset(-20% 0% -20% 0%)", duration: 2, ease: "power2.inOut",
          scrollTrigger: { trigger: sTitle, start: "top 85%", once: true } });
      }
      var socials = $$("[data-social]");
      if (socials.length) {
        gsap.fromTo(socials, { y: 40, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.9, stagger: 0.08, ease: "back.out(1.8)",
          scrollTrigger: { trigger: ".social__list", start: "top 90%", once: true },
          onComplete: function () {
            socials.forEach(function (a, i) {
              gsap.to($(".social__icon", a), { y: i % 2 ? 7 : -7, rotation: i % 2 ? 3 : -3, duration: 2.2 + (i % 3) * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
            });
          } });
      }

      /* Footer: the venue photo settles in slowly behind the text */
      var fPhoto = $("[data-footer-photo]");
      if (fPhoto) {
        gsap.fromTo(fPhoto, { scale: 1.18, yPercent: -4 }, { scale: 1, yPercent: 4, ease: "none",
          scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true } });
      }

      /* Desktop details: photos tilt toward the cursor, the Instagram pill is magnetic */
      if (c.fine) {
        $$(".ph").forEach(function (ph) {
          var rx = gsap.quickTo(ph, "rotationX", { duration: 0.6, ease: "power3.out" });
          var ry = gsap.quickTo(ph, "rotationY", { duration: 0.6, ease: "power3.out" });
          gsap.set(ph, { transformPerspective: 900 });
          ph.addEventListener("pointermove", function (e) {
            var r = ph.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 10);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
          });
          ph.addEventListener("pointerleave", function () { rx(0); ry(0); });
        });
        $$("[data-magnetic]").forEach(function (el) {
          var mx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
          var my = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
          el.addEventListener("pointermove", function (e) {
            var r = el.getBoundingClientRect();
            mx((e.clientX - r.left - r.width / 2) * 0.3);
            my((e.clientY - r.top - r.height / 2) * 0.4);
          });
          el.addEventListener("pointerleave", function () { mx(0); my(0); });
        });
      }
    }); }, 0);

    /* Short text: gentle fade + rise when it enters (plays once) */
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

  /* ---------- Opening hours: live status in the menu (Europe/Madrid) ---------- */
  // 0 = Sunday ... 6 = Saturday; [open, close] in minutes after midnight
  var HOURS = { 1: [540, 1320], 2: [540, 1320], 3: [540, 1320], 4: [540, 1320], 5: [540, 1320], 6: [600, 1380] };
  var DAY_NAMES = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];

  function fmt(min) { return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0"); }

  var madridFmt = null;
  function madridNow() {
    madridFmt = madridFmt || new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    });
    var parts = madridFmt.formatToParts(new Date());
    var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day: day, min: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
  }

  function initHours() {
    var els = $$("[data-hours]");
    if (!els.length || !window.Intl) return;

    function status() {
      var now = madridNow();
      var today = HOURS[now.day];
      if (today && now.min >= today[0] && now.min < today[1]) return { open: true, text: "Abierto ahora, hasta las " + fmt(today[1]) };
      if (today && now.min < today[0]) return { open: false, text: "Cerrado, abrimos hoy a las " + fmt(today[0]) };
      for (var i = 1; i <= 7; i++) {
        var d = (now.day + i) % 7;
        if (HOURS[d]) return { open: false, text: "Cerrado, abrimos " + (i === 1 ? "mañana" : DAY_NAMES[d]) + " a las " + fmt(HOURS[d][0]) };
      }
      return { open: false, text: "Horario" };
    }
    function update() {
      var st = status();
      els.forEach(function (el) {
        el.classList.toggle("is-open", st.open);
        var t = $("[data-hours-text]", el);
        if (t) t.textContent = st.text;
      });
    }
    update();
    setInterval(update, 60000);
  }

  /* ---------- Menu (top-right box) ---------- */
  /* =========================================================
     Menu: a four-panel curtain drops in, the photo behind follows the link
     under the pointer, neon links write themselves in character by character.
     ========================================================= */
  function initMenu() {
    var toggle = $("[data-menu-toggle]");
    var menu = $("[data-menu]");
    var main = $("#main");
    if (!toggle || !menu) return;
    var links = $$(".menu__links a", menu);
    var panels = $$("[data-menu-panel]", menu);
    var previews = $$("[data-preview]", menu);
    var words = $$(".menu__word", menu);
    var open = false;
    var anim = null;
    var splits = null;

    function charsOf(word) { return word._chars || [word]; }
    function ensureSplit() {
      if (splits || !hasGsap || !window.SplitText) return;
      splits = words.map(function (w) {
        var sp = SplitText.create(w, { type: "chars", charsClass: "char", mask: "chars" });
        w._chars = sp.chars;
        return sp;
      });
    }
    function showPreview(key) {
      previews.forEach(function (img) { img.classList.toggle("is-active", img.getAttribute("data-preview") === key); });
    }
    function allChars() {
      var out = [];
      words.forEach(function (w) { out = out.concat(charsOf(w)); });
      return out;
    }

    function setOpen(next) {
      if (next === open) return;
      open = next;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("is-locked", open);
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
      if (main) main.inert = open;
      if (anim) anim.kill();

      var simple = !hasGsap || reduceMotion;
      if (open) {
        menu.hidden = false;
        ensureSplit();
        var current = $("a[aria-current='page']", menu);
        showPreview(current ? current.getAttribute("data-link") : "inicio");
        if (simple) {
          if (hasGsap) gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.3 });
        } else {
          anim = gsap.timeline({ defaults: { ease: "bloom" } })
            .set(menu, { opacity: 1 })
            .fromTo(panels, { scaleY: 0, transformOrigin: "50% 0%" }, { scaleY: 1, duration: 0.7, stagger: 0.07, ease: "expo.inOut" }, 0)
            .fromTo(".menu__previews", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.45)
            .fromTo(allChars(), { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, stagger: 0.018 }, 0.45)
            .fromTo(".menu__foot > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 }, 0.75);
        }
        if (links[0]) links[0].focus({ preventScroll: true });
      } else {
        var finish = function () { menu.hidden = true; };
        if (simple) { finish(); }
        else {
          anim = gsap.timeline({ onComplete: finish })
            .to([allChars(), ".menu__foot > *", ".menu__previews"], { opacity: 0, y: -14, duration: 0.3, stagger: 0.004, ease: "power2.in" }, 0)
            .to(panels.slice().reverse(), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.6, stagger: 0.06, ease: "expo.inOut" }, 0.2);
        }
        toggle.focus({ preventScroll: true });
      }
    }

    // Hover / focus: the matching photo blooms in behind, the letters ripple
    links.forEach(function (a) {
      var key = a.getAttribute("data-link");
      var word = $(".menu__word", a);
      var ripple = function () {
        showPreview(key);
        if (!hasGsap || reduceMotion) return;
        gsap.fromTo(charsOf(word), { yPercent: 0 }, { keyframes: { yPercent: [0, -14, 0] }, duration: 0.5, stagger: 0.025, ease: "sine.inOut", overwrite: "auto" });
      };
      a.addEventListener("mouseenter", ripple);
      a.addEventListener("focus", ripple);
      a.addEventListener("click", function () {
        $$("a[aria-current]", menu).forEach(function (x) { x.removeAttribute("aria-current"); });
        a.setAttribute("aria-current", "page");
        setOpen(false);
      });
    });
    $$(".menu__foot a", menu).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });

    toggle.addEventListener("click", function () { setOpen(!open); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false); });
  }

  /* ---------- Smooth scroll: Lenis drives the page, ScrollTrigger listens (one engine) ---------- */
  var lenis = null;
  function initSmoothScroll() {
    if (reduceMotion || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // In-page links glide to their section, below the fixed header
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === "#inicio" ? 0 : -80 });
      history.replaceState(null, "", id);
    });
  }

  /* ---------- Social profiles without a URL yet: say "Muy pronto" instead of jumping ---------- */
  function initPendingLinks() {
    $$("[data-pending]").forEach(function (a) {
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("title", "Muy pronto");
      a.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if ($(".social__soon", a)) return;
        var tip = document.createElement("span");
        tip.className = "social__soon";
        tip.textContent = "Muy pronto";
        tip.setAttribute("role", "status");
        a.style.position = "relative";
        a.appendChild(tip);
        setTimeout(function () { tip.remove(); }, 1600);
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    safe(initHeader, "header");
    safe(initMenu, "menu");
    safe(initPendingLinks, "pending");

    if (!hasGsap) { safe(initHours, "hours"); safe(initBears, "bears"); revealAll(); return; }

    gsap.registerPlugin.apply(gsap, [ScrollTrigger, window.SplitText, window.Flip, window.CustomEase].filter(Boolean));
    // House ease: a fast start that settles softly, like a flower opening
    if (window.CustomEase) CustomEase.create("bloom", "M0,0 C0.16,0.78 0.22,1 1,1");
    else gsap.registerEase("bloom", gsap.parseEase("expo.out"));
    ScrollTrigger.config({ ignoreMobileResize: true });
    // First screen now; everything below the fold once the browser is idle (keeps the main thread free at load)
    safe(initIntro, "intro");
    safe(initScrollMotion, "scroll");
    safe(initBear, "bear"); // hero bear sits on the first screen
    revealAll();

    var queue = [[initSmoothScroll, "lenis"], [initGlow, "glow"], [initBears, "bears"], [initSections, "sections"], [initCinema, "cinema"], [initStack, "stack"], [initHours, "hours"]];
    var next = function () {
      var job = queue.shift();
      if (!job) { ScrollTrigger.refresh(); return; }
      safe(job[0], job[1]);
      setTimeout(next, 0);
    };
    if ("requestIdleCallback" in window) requestIdleCallback(next, { timeout: 1200 });
    else setTimeout(next, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
