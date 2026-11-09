/* ==========================================================================
   NewKind — interactions & scroll animations
   Stack: GSAP 3 (ScrollTrigger, SplitText) + Lenis smooth scroll
   ========================================================================== */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };

  function scrollToTarget(target, immediate) {
    const offset = -96;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { offset, immediate: !!immediate, duration: 1.6 });
    else {
      const y = (typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY) + offset;
      window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
    }
  }

  /* ---------- Image fallback (keeps layout pretty if an image is missing) ---------- */
  function watchImg(img) {
    const miss = () => img.classList.add("is-missing");
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener("error", miss);
  }
  $$(".media img").forEach(watchImg);

  /* ---------- Hero ambient video ---------- */
  $$("[data-hero-video]").forEach((v) => {
    const show = () => v.classList.add("is-playing");
    v.addEventListener("playing", show);
    if (reduceMotion) { v.removeAttribute("autoplay"); v.pause(); return; }
    v.muted = true;
    const p = v.play && v.play();
    if (p && p.catch) p.catch(() => {});      // autoplay blocked: photo + effects still show
    if (!v.paused) show();
  });

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Graceful exit if GSAP didn't load ---------- */
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove("js");
    initUI(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const hasSplit = !!window.SplitText;
  if (hasSplit) gsap.registerPlugin(SplitText);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  window.__lenis = lenis;

  initUI(lenis);

  /* ---------- Boot: preloader → page intro ---------- */
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  const fromTransition = store.get("nk-transition") === "1";
  store.del("nk-transition");
  fontsReady.then(() => {
    initScrollAnimations();
    const intro = buildHeroIntro();
    if (fromTransition) {
      gsap.set("#curtain", { yPercent: 0 });
      root.classList.remove("is-transitioning");
      gsap.to("#curtain", { yPercent: -100, duration: 1, ease: "expo.inOut", delay: 0.05 });
      intro.delay(0.45).play();
    } else {
      intro.play();
    }

    // Deep-link to a section (e.g. index.html#about) once everything is laid out
    if (location.hash && location.hash.length > 1) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(() => { ScrollTrigger.refresh(); scrollToTarget(t, true); }, 80);
    }
    window.addEventListener("load", () => ScrollTrigger.refresh());
  });

  /* ======================================================================
     Hero intro (paused timeline, played after preloader / curtain)
     ====================================================================== */
  function buildHeroIntro() {
    const tl = gsap.timeline({ paused: true });
    const hero = $("[data-hero]") || $("[data-hero-scroll]");
    const reveal = $("[data-video-reveal]");
    const slot = $("[data-video-slot]");
    if (reveal && slot && !reduceMotion) {
      const f = ($("[data-hero-scroll]") || $("[data-hero-frame]")).getBoundingClientRect(), r = slot.getBoundingClientRect();
      tl.fromTo(reveal, { clipPath: `inset(${r.bottom - f.top}px 0px 0px 0px)` },
        { clipPath: `inset(${r.top - f.top}px 0px 0px 0px)`, duration: 1.5, ease: "expo.inOut",
          onComplete: () => gsap.set(reveal, { clearProps: "clipPath" }) }, 0.15);
      const v = $("video", reveal);
      v && tl.fromTo(v, { scale: 1.3 }, { scale: 1.12, duration: 2, ease: "expo.out" }, 0.15);
    }
    const heroEls = $$("[data-hero-in]");
    if (!hero) {
      heroEls.forEach((el) => gsap.set(el, { autoAlpha: 1 }));
      return tl;
    }
    const media = $("[data-hero-media]", hero);
    if (media) tl.fromTo(media, { scale: 1.18 }, { scale: 1, duration: 2.2, ease: "expo.out" }, 0);

    heroEls.forEach((el, i) => {
      const type = el.dataset.heroIn;
      if (type === "split" && hasSplit && !reduceMotion) {
        const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "line" });
        gsap.set(el, { autoAlpha: 1 });
        tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, stagger: 0.1, duration: 1.4, ease: "expo.out" }, 0.15);
      } else if (type === "stagger") {
        gsap.set(el, { autoAlpha: 1 });
        tl.fromTo(el.children, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.07, duration: 1.1 }, 0.55 + i * 0.04);
      } else {
        tl.fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.35 + i * 0.08);
      }
    });
    return tl;
  }

  /* ======================================================================
     Scroll-driven animations
     ====================================================================== */
  function initScrollAnimations() {
    const mm = gsap.matchMedia();

    /* Scroll progress bar */
    if ($("#progress")) {
      gsap.to("#progress", {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
      });
    }

    /* Hero: frame insets + rounds, media parallax, content drifts up */
    const hero = $("[data-hero]");
    if (hero && !reduceMotion) {
      const frame = $("[data-hero-frame]", hero);
      const media = $("[data-hero-media]", hero);
      const content = $("[data-hero-content]", hero);
      const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      if (frame && frame.dataset.static === undefined) {
        mm.add("(min-width: 768px)", () => {
          gsap.fromTo(frame, { clipPath: "inset(0px 0px 0px 0px round 0px)" },
            { clipPath: "inset(18px 18px 0px 18px round 32px)", ease: "none", scrollTrigger: { ...st, end: "40% top" } });
        });
      }
      if (media) gsap.to(media, { yPercent: 18, ease: "none", scrollTrigger: st });

      // Slow, endless Ken Burns drift on the hero photo
      const kb = $("[data-kenburns]", hero);
      if (kb) {
        gsap.fromTo(kb, { scale: 1.04, xPercent: -1.5 }, { scale: 1.16, xPercent: 1.5, duration: 22, ease: "sine.inOut", repeat: -1, yoyo: true });
      }

      // Slow cinematic push-in on the video footage
      const vid = $("[data-hero-video]", hero);
      if (vid) gsap.fromTo(vid, { scale: 1 }, { scale: 1.08, duration: 18, ease: "sine.inOut", repeat: -1, yoyo: true });

      // Pointer parallax: photo and video drift opposite to the cursor
      if (finePointer && (kb || vid)) {
        const layers = [[kb, -18], [vid, 14], [$(".hero-glow", hero), 40]].filter((l) => l[0]);
        const movers = layers.map(([el, amt]) => ({ amt, x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }), y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" }) }));
        hero.addEventListener("pointermove", (e) => {
          const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
          movers.forEach((m) => { m.x(nx * m.amt); m.y(ny * m.amt); });
        });
      }

      // Pause the video when the hero is off-screen (saves battery)
      if (vid) {
        ScrollTrigger.create({ trigger: hero, start: "top bottom", end: "bottom top",
          onToggle: (self) => { if (self.isActive) { const p = vid.play(); p && p.catch && p.catch(() => {}); } else vid.pause(); } });
      }
      if (content) gsap.to(content, { yPercent: -18, autoAlpha: 0.15, ease: "none", scrollTrigger: st });
    }

    /* Home hero: the sticky video panel travels from the hero into the second section and opens up.
       No pinning — the layer is CSS-sticky, so motion stays native-smooth; the clip is scrubbed by scroll. */
    const hs = $("[data-hero-scroll]");
    if (hs) {
      const layer = $("[data-video-layer]", hs), slot = $("[data-video-slot]", hs);
      const content = $("[data-hero-content]", hs), vid = $("[data-hero-video]", hs), cue = $("[data-scroll-cue]", hs);
      const radius = () => (window.innerWidth < 1024 ? 22 : 28);
      // slot rectangle expressed as an inset of the (sticky, viewport-sized) layer, measured at the top of the page
      const slotInset = () => {
        const sec = hs.getBoundingClientRect(), r = slot.getBoundingClientRect(), H = layer.offsetHeight;
        const top = r.top - sec.top, left = r.left - sec.left, right = sec.right - r.right, bottom = H - (r.bottom - sec.top);
        return { top, right, bottom, left };
      };
      // expanded state: boxed to the site container (max 1320px + side padding), not full-bleed
      const boxInset = () => {
        const W = window.innerWidth, H = layer.offsetHeight;
        const pad = W >= 640 ? 32 : 20;
        const side = Math.max(pad, (W - 1320) / 2 + pad);
        const v = W >= 1024 ? 24 : 16;
        return { top: v, right: side, bottom: v, left: side };
      };
      const clipAt = (p) => {               // p: 0 = panel in the hero, 1 = boxed second section
        const a = slotInset(), b = boxInset(), m = (x, y) => (x + (y - x) * p).toFixed(2);
        return `inset(${m(a.top, b.top)}px ${m(a.right, b.right)}px ${m(a.bottom, b.bottom)}px ${m(a.left, b.left)}px round ${radius()}px)`;
      };
      // shift the footage so its subject sits inside the panel at the start, easing back to centre as it opens
      const shiftAt = (p) => {
        const a = slotInset(), W = window.innerWidth, H = layer.offsetHeight;
        const cx = a.left + (W - a.left - a.right) / 2, cy = a.top + (H - a.top - a.bottom) / 2;
        return { x: ((cx - W / 2) / W) * 100 * (1 - p), y: ((cy - H / 2) / H) * 100 * (1 - p) };
      };
      const render = (p) => {
        gsap.set(layer, { clipPath: clipAt(p) });
        if (vid) { const sh = shiftAt(p); gsap.set(vid, { xPercent: sh.x, yPercent: sh.y }); }
      };
      render(0);
      if (vid) gsap.set(vid, { scale: 1.12 });

      if (!reduceMotion) {
        const state = { p: 0 };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: hs, start: "top top", end: () => "+=" + Math.round(window.innerHeight * 1.05),
            scrub: 1.2, invalidateOnRefresh: true,
            onRefresh: () => render(state.p),
          },
        });
        tl.to(state, { p: 1, duration: 1, ease: "power2.inOut", onUpdate: () => render(state.p) }, 0)
          .to(content, { yPercent: -10, autoAlpha: 0, duration: 0.55, ease: "power1.in" }, 0)
          .to(cue, { autoAlpha: 0, duration: 0.15 }, 0);
        if (vid) tl.to(vid, { scale: 1, duration: 1, ease: "power1.out" }, 0);
      }
      if (vid) {
        ScrollTrigger.create({ trigger: hs, start: "top bottom", end: "bottom top",
          onToggle: (self) => { if (self.isActive) { const pl = vid.play(); pl && pl.catch && pl.catch(() => {}); } else vid.pause(); } });
      }
      window.addEventListener("resize", () => ScrollTrigger.refresh());
    }

    /* Split-line headings */
    $$("[data-split]").forEach((el) => {
      if (!hasSplit || reduceMotion) {
        gsap.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        return;
      }
      SplitText.create(el, {
        type: "lines", mask: "lines", linesClass: "line", autoSplit: true,
        onSplit(self) {
          gsap.set(el, { autoAlpha: 1 });
          return gsap.fromTo(self.lines, { yPercent: 110 }, {
            yPercent: 0, stagger: 0.09, duration: 1.3, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        },
      });
    });

    /* Program rows: image tilts upright and settles as it scrolls in */
    $$("[data-tilt-in]").forEach((el) => {
      if (reduceMotion) return;
      const dir = parseFloat(el.dataset.tiltIn) || 1;
      gsap.set(el.parentElement, { perspective: 1400 });
      gsap.fromTo(el, { rotateY: 14 * dir, rotateX: 6, scale: 0.88, y: 80, autoAlpha: 0.4 },
        { rotateY: 0, rotateX: 0, scale: 1, y: 0, autoAlpha: 1, ease: "none",
          scrollTrigger: { trigger: el, start: "top 95%", end: "center 55%", scrub: 0.8 } });
      const img = el.querySelector("img");
      if (img) gsap.fromTo(img, { scale: 1.18, yPercent: -4 }, { scale: 1.02, yPercent: 4, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    /* Fade-up reveals */
    $$("[data-reveal]").forEach((el) => {
      const d = parseFloat(el.dataset.delay || 0);
      const dir = el.dataset.reveal;
      const from = { autoAlpha: 0, y: 40 };
      if (dir === "left") Object.assign(from, { y: 0, x: -50 });
      if (dir === "right") Object.assign(from, { y: 0, x: 50 });
      if (dir === "scale") Object.assign(from, { y: 0, scale: 0.92 });
      gsap.fromTo(el, from, {
        autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 1.3, delay: d,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    /* Staggered groups */
    $$("[data-stagger]").forEach((group) => {
      gsap.fromTo(group.children, { autoAlpha: 0, y: 50 }, {
        autoAlpha: 1, y: 0, duration: 1.2, stagger: parseFloat(group.dataset.stagger) || 0.1,
        scrollTrigger: { trigger: group, start: "top 88%", once: true },
      });
    });

    /* Image curtain reveals */
    $$("[data-img-reveal]").forEach((wrap) => {
      const img = $("img", wrap);
      const tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: "top 85%", once: true } });
      tl.fromTo(wrap, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" });
      if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.2);
    });

    /* Parallax */
    if (!reduceMotion) {
      $$("[data-parallax]").forEach((el) => {
        const amt = parseFloat(el.dataset.parallax) || 10;
        gsap.fromTo(el, { yPercent: -amt / 2 }, {
          yPercent: amt / 2, ease: "none",
          scrollTrigger: { trigger: el.closest("section") || el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }

    /* Number counters */
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate() { el.textContent = Math.round(obj.v) + (el.dataset.suffix || ""); },
      });
    });

    /* Text that brightens word by word while scrolling */
    $$("[data-scrub-text]").forEach((el) => {
      if (!hasSplit || reduceMotion) return;
      const split = SplitText.create(el, { type: "words" });
      const panel = el.closest(".statement-panel");
      gsap.fromTo(split.words, { opacity: panel ? 0.16 : 0.18 }, {
        opacity: 1, stagger: 0.1, ease: "none",
        scrollTrigger: panel
          ? { trigger: panel, start: "top 55%", end: "bottom 85%", scrub: 0.6 }
          : { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
      });
    });

    /* Velocity-reactive marquees */
    $$("[data-marquee]").forEach((m) => {
      const track = $(".marquee-track", m);
      if (!track) return;
      // duplicate content for a seamless loop
      const clone = track.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      $$("img", clone).forEach((im) => { im.alt = ""; watchImg(im); });
      m.appendChild(clone);
      const tracks = [track, clone];
      const reverse = m.dataset.marquee === "reverse";
      const dur = parseFloat(m.dataset.speed) || 40;
      const tween = gsap.fromTo(tracks, { xPercent: reverse ? -100 : 0 }, {
        xPercent: reverse ? 0 : -100, duration: dur, ease: "none", repeat: -1,
      });
      if (reduceMotion) { tween.pause(); return; }
      if (m.dataset.pauseHover !== undefined) {
        m.addEventListener("mouseenter", () => gsap.to(tween, { timeScale: 0.15, duration: 0.6 }));
        m.addEventListener("mouseleave", () => gsap.to(tween, { timeScale: 1, duration: 0.6 }));
      }
      ScrollTrigger.create({
        trigger: m, start: "top bottom", end: "bottom top",
        onUpdate(self) {
          const v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
          gsap.to(tween, { timeScale: 1 + v, duration: 0.2, overwrite: true,
            onComplete: () => gsap.to(tween, { timeScale: 1, duration: 1.2 }) });
        },
      });
    });

    /* Stacking cards: each card sticks, then eases back as the next one slides over it */
    mm.add("(min-width: 768px)", () => {
      if (reduceMotion) return;
      const cards = $$(".stack-card");
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.fromTo(card, { scale: 1, yPercent: 0 }, {
          scale: 0.93 + i * 0.01, yPercent: -2, ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: () => "top " + (parseFloat(next.style.top) || 120) + "px", scrub: 0.5, invalidateOnRefresh: true },
        });
      });
    });

    /* Pinned horizontal scroll (desktop) */
    mm.add("(min-width: 1024px)", () => {
      if (reduceMotion) return;
      $$("[data-hscroll]").forEach((section) => {
        const track = $("[data-hscroll-track]", section);
        if (!track) return;
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
        gsap.to(track, {
          x: () => -distance(), ease: "none",
          scrollTrigger: {
            trigger: section, start: "top top", end: () => "+=" + distance(),
            pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          },
        });
        const bar = $("[data-hscroll-bar]", section);
        if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: section, start: "top top", end: () => "+=" + distance(), scrub: true } });
      });
    });

    /* Line draw (SVG paths) */
    $$("[data-draw] path").forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000;
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: p.closest("section"), start: "top 80%", end: "bottom 30%", scrub: 1 },
      });
    });

    /* Footer wordmark rise */
    const wm = $("[data-wordmark]");
    if (wm && !reduceMotion) {
      gsap.fromTo(wm, { yPercent: 40 }, { yPercent: 0, ease: "none",
        scrollTrigger: { trigger: wm.closest("footer"), start: "top bottom", end: "bottom bottom", scrub: true } });
    }
  }

  /* ======================================================================
     UI: nav, menu, dialogs, accordions, tabs, forms, transitions
     ====================================================================== */
  function initUI(lenis) {
    const g = window.gsap;

    /* ----- Nav theme + hide on scroll ----- */
    const navWrap = $("#nav");
    const shell = navWrap && $(".nav-shell", navWrap);
    const hero = $("[data-hero]");
    const startDark = navWrap && navWrap.dataset.theme === "dark";
    let lastY = window.scrollY;
    const setTheme = () => {
      if (!shell) return;
      const threshold = hero ? hero.offsetHeight - 90 : 10;
      const dark = startDark && window.scrollY < threshold;
      shell.classList.toggle("is-dark", dark);
      shell.classList.toggle("is-light", !dark);
    };
    const onScroll = () => {
      const y = window.scrollY;
      setTheme();
      if (navWrap && !document.body.classList.contains("menu-open")) {
        const goingDown = y > lastY + 4;
        const goingUp = y < lastY - 4;
        if (goingDown && y > 400) navWrap.classList.add("is-hidden");
        else if (goingUp || y < 400) navWrap.classList.remove("is-hidden");
      }
      lastY = y;
    };
    setTheme();
    if (lenis) lenis.on("scroll", onScroll);
    else window.addEventListener("scroll", onScroll, { passive: true });

    /* ----- Mobile menu ----- */
    const menu = $("#mobile-menu");
    const menuBtn = $("[data-menu-toggle]");
    let menuTl = null;
    if (menu && g) {
      menuTl = g.timeline({ paused: true })
        .set(menu, { visibility: "visible" })
        .fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "expo.inOut" })
        .fromTo($$(".mm-link span", menu), { yPercent: 110 }, { yPercent: 0, stagger: 0.05, duration: 0.9, ease: "expo.out" }, "-=0.35")
        .fromTo($$("[data-mm-fade]", menu), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8 }, "-=0.7");
    }
    const openMenu = () => {
      document.body.classList.add("menu-open");
      menuBtn && menuBtn.setAttribute("aria-expanded", "true");
      lenis && lenis.stop();
      menuTl ? menuTl.timeScale(1).play() : menu && (menu.style.visibility = "visible");
    };
    const closeMenu = () => {
      if (!document.body.classList.contains("menu-open")) return;
      document.body.classList.remove("menu-open");
      menuBtn && menuBtn.setAttribute("aria-expanded", "false");
      lenis && lenis.start();
      menuTl ? menuTl.timeScale(1.6).reverse() : menu && (menu.style.visibility = "hidden");
    };
    menuBtn && menuBtn.addEventListener("click", () =>
      document.body.classList.contains("menu-open") ? closeMenu() : openMenu());
    $$("[data-menu-close]").forEach((b) => b.addEventListener("click", closeMenu));
    $$("#mobile-menu a").forEach((a) => a.addEventListener("click", closeMenu));

    /* ----- Mobile sub-menus ----- */
    $$("[data-mm-sub]").forEach((btn) => {
      const panel = btn.nextElementSibling;
      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        $(".mm-plus", btn) && ($(".mm-plus", btn).style.transform = open ? "" : "rotate(45deg)");
        if (g) g.to(panel, { height: open ? 0 : "auto", duration: 0.6, ease: "expo.out" });
        else panel.style.height = open ? "0px" : "auto";
      });
    });

    /* ----- In-page anchors ----- */
    $$('a[href*="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname || !url.hash || url.hash.length < 2) return;
        const t = document.getElementById(url.hash.slice(1));
        if (!t) return;
        e.preventDefault();
        closeMenu();
        setTimeout(() => scrollToTarget(t), document.body.classList.contains("menu-open") ? 400 : 0);
        history.replaceState(null, "", url.hash);
      });
    });

    /* ----- Page transitions (internal .html links) ----- */
    if (g && !reduceMotion) {
      $$("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || a.target === "_blank" || a.hasAttribute("download")) return;
        if (/^(mailto:|tel:|https?:|#|javascript:)/i.test(href)) return;
        a.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          const url = new URL(a.href, location.href);
          if (url.pathname === location.pathname) return; // handled by anchor logic
          e.preventDefault();
          store.set("nk-transition", "1");
          g.fromTo("#curtain", { yPercent: 100 }, {
            yPercent: 0, duration: 0.8, ease: "expo.inOut",
            onComplete: () => { root.classList.add("is-transitioning"); location.href = a.href; },
          });
        });
      });
      window.addEventListener("pageshow", (e) => {
        if (e.persisted) { root.classList.remove("is-transitioning"); g.set("#curtain", { yPercent: 100 }); }
      });
    }

    /* ----- Magnetic buttons ----- */
    if (g && finePointer && !reduceMotion) {
      $$("[data-magnetic]").forEach((el) => {
        const xTo = g.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = g.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.25);
          yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
      });
    }

    /* ----- Glow cards follow pointer ----- */
    $$(".glow").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });

    /* ----- FAQ accordion ----- */
    $$("[data-faq]").forEach((list) => {
      const items = $$(".faq-item", list);
      const toggle = (item, open) => {
        const body = $(".faq-body", item);
        const btn = $("button", item);
        item.classList.toggle("is-open", open);
        btn && btn.setAttribute("aria-expanded", String(open));
        if (g) g.to(body, { height: open ? "auto" : 0, duration: 0.7, ease: "expo.out", onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
        else body.style.height = open ? "auto" : "0px";
      };
      items.forEach((item) => {
        $("button", item).addEventListener("click", () => {
          const willOpen = !item.classList.contains("is-open");
          items.forEach((o) => o !== item && o.classList.contains("is-open") && toggle(o, false));
          toggle(item, willOpen);
        });
      });
      if (items[0] && list.dataset.faq === "open-first") toggle(items[0], true);
    });

    /* ----- Tabs ----- */
    $$("[data-tabs]").forEach((wrap) => {
      const btns = $$("[data-tab]", wrap);
      const panels = $$("[data-panel]", wrap);
      btns.forEach((btn) => btn.addEventListener("click", () => {
        const id = btn.dataset.tab;
        btns.forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-selected", String(b === btn)); });
        panels.forEach((p) => {
          const show = p.dataset.panel === id;
          if (show) {
            p.hidden = false;
            if (g) {
              g.fromTo($$("[data-panel-in]", p), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9 });
              const im = $("img", p);
              im && g.fromTo(im, { scale: 1.12 }, { scale: 1, duration: 1.4 });
            }
          } else p.hidden = true;
        });
        window.ScrollTrigger && ScrollTrigger.refresh();
      }));
    });

    /* ----- Journal topic filter ----- */
    $$("[data-filter]").forEach((wrap) => {
      const btns = $$("[data-filter-btn]", wrap);
      const cards = $$("[data-cat]", wrap);
      const empty = $("[data-filter-empty]", wrap);
      btns.forEach((btn) => btn.addEventListener("click", () => {
        const key = btn.dataset.filterBtn;
        btns.forEach((b) => { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
        const shown = cards.filter((c) => key === "all" || c.dataset.cat === key);
        cards.forEach((c) => c.classList.toggle("is-hidden", !shown.includes(c)));
        if (empty) empty.hidden = shown.length > 0;
        if (g && shown.length) g.fromTo(shown, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "expo.out" });
        window.ScrollTrigger && ScrollTrigger.refresh();
      }));
    });

    /* ----- FAQ search + topic links ----- */
    const faqSearch = $("[data-faq-search]");
    if (faqSearch) {
      const groups = $$("[data-faq-group]");
      const empty = $("[data-faq-empty]");
      faqSearch.addEventListener("input", () => {
        const q = faqSearch.value.trim().toLowerCase();
        let any = false;
        groups.forEach((grp) => {
          let n = 0;
          $$(".faq-item", grp).forEach((item) => {
            const hit = !q || item.textContent.toLowerCase().includes(q);
            item.classList.toggle("is-hidden", !hit);
            if (hit) n++;
          });
          grp.classList.toggle("is-hidden", n === 0);
          if (n) any = true;
        });
        if (empty) empty.hidden = any;
        window.ScrollTrigger && ScrollTrigger.refresh();
      });
    }
    $$(".faq-cat-link").forEach((a) => a.addEventListener("click", (e) => {
      const t = document.getElementById(a.getAttribute("href").slice(1));
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: -110 }); else t.scrollIntoView({ behavior: "smooth" });
    }));

    /* ----- Customer story video player ----- */
    const vDialog = $("#video-dialog");
    if (vDialog) {
      const panel = $(".video-panel", vDialog);
      const video = $(".video-el", vDialog);
      const empty = $(".video-empty", vDialog);
      const title = $("[data-video-title]", vDialog);
      let lastCard = null;
      const close = () => {
        video.pause(); video.removeAttribute("src"); video.load();
        vDialog.hidden = true; lenis && lenis.start();
        lastCard && lastCard.focus && lastCard.focus();
      };
      document.addEventListener("click", (e) => {
        const card = e.target.closest("[data-video-card]");
        if (card) {
          lastCard = card;
          const src = card.dataset.video, poster = $("img", card);
          title.textContent = card.dataset.title || "";
          panel.style.backgroundImage = poster ? `url("${poster.currentSrc || poster.src}")` : "";
          if (src) { video.hidden = false; empty.hidden = true; video.src = src; video.play().catch(() => {}); }
          else { video.hidden = true; empty.hidden = false; }
          vDialog.hidden = false; lenis && lenis.stop();
          $(".video-close", vDialog).focus();
          if (g) g.fromTo(panel, { autoAlpha: 0, scale: 0.92, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.7, ease: "expo.out" });
          return;
        }
        if (!vDialog.hidden && e.target.closest("[data-video-close]")) close();
      });
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !vDialog.hidden) close(); });
    }

    /* ----- Footer: back to top ----- */
    $$("[data-back-top]").forEach((b) => b.addEventListener("click", () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.6 }); else window.scrollTo({ top: 0, behavior: "smooth" });
    }));

    /* ----- Book-a-call dialog ----- */
    const dialog = $("#call-dialog");
    if (dialog) {
      const panel = $("[data-dialog-panel]", dialog);
      const backdrop = $("[data-dialog-backdrop]", dialog);
      let lastFocus = null;
      const open = (preset) => {
        lastFocus = document.activeElement;
        closeMenu();
        dialog.classList.add("is-open");
        dialog.setAttribute("aria-hidden", "false");
        lenis && lenis.stop();
        document.body.style.overflow = "hidden";
        if (preset) {
          const sel = $('select[name="program"]', dialog);
          if (sel) { sel.value = preset; sel.dispatchEvent(new Event("change")); }
        }
        if (g) {
          g.fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" });
          g.fromTo(panel, { y: 60, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.9 });
        }
        setTimeout(() => { const f = $("input, select, textarea", panel); f && f.focus({ preventScroll: true }); }, 250);
      };
      const close = () => {
        const done = () => {
          dialog.classList.remove("is-open");
          dialog.setAttribute("aria-hidden", "true");
          document.body.style.overflow = "";
          lenis && lenis.start();
          lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
        };
        if (g) {
          g.to(backdrop, { autoAlpha: 0, duration: 0.35 });
          g.to(panel, { y: 40, autoAlpha: 0, duration: 0.4, ease: "power2.in", onComplete: done });
        } else done();
      };
      $$("[data-open-call]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); open(b.dataset.openCall); }));
      $$("[data-close-call]", dialog).forEach((b) => b.addEventListener("click", close));
      backdrop && backdrop.addEventListener("click", close);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && dialog.classList.contains("is-open")) close(); });
    }

    /* ----- Program → subprogram selects ----- */
    const SUB = {
      Fertility: ["Natural Fertility Program", "IUI/IVF Preparation Program", "Egg Freezing Prep Program", "PMOS Balance Program"],
      Pregnancy: ["Pregnancy Wellness Program", "Postpartum Recovery Program"],
      "Weight Loss": ["GLP-1 Weight Management Program", "Sustainable Weight Loss Program"],
      "I'm not sure yet": ["Help me choose"],
    };
    $$('select[name="program"]').forEach((sel) => {
      const form = sel.form;
      const sub = form && $('select[name="subprogram"]', form);
      if (!sub) return;
      const fill = () => {
        const list = SUB[sel.value] || [];
        sub.innerHTML = list.length
          ? '<option value="">Select a subprogram</option>' + list.map((s) => `<option>${s}</option>`).join("")
          : '<option value="">Select a main program first</option>';
        sub.disabled = !list.length;
      };
      sel.addEventListener("change", fill);
      fill();
    });

    /* ----- Multi-step program finder ----- */
    $$("[data-steps]").forEach((form) => {
      const steps = $$("[data-step]", form);
      const bar = $("[data-step-bar]", form);
      const label = $("[data-step-label]", form);
      const pct = $("[data-step-pct]", form);
      let i = 0;
      const show = (n) => {
        steps.forEach((s, k) => (s.hidden = k !== n));
        const p = Math.round(((n + 1) / steps.length) * 100);
        bar && (g ? g.to(bar, { width: p + "%", duration: 0.8 }) : (bar.style.width = p + "%"));
        label && (label.textContent = `Step ${n + 1} of ${steps.length}`);
        pct && (pct.textContent = p + "%");
        g && g.fromTo(steps[n].children, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, stagger: 0.06, duration: 0.8 });
        if (n === steps.length - 1) buildSummary();
      };
      const valid = (n) => {
        const fields = $$("input, select, textarea", steps[n]).filter((f) => !f.disabled);
        for (const f of fields) { if (!f.checkValidity()) { f.reportValidity(); return false; } }
        return true;
      };
      const buildSummary = () => {
        const out = $("[data-summary]", form);
        if (!out) return;
        const fd = new FormData(form);
        const rows = [["Program", fd.get("program")], ["Subprogram", fd.get("subprogram")], ["Where you are", fd.get("stage")], ["Name", fd.get("name")], ["Email", fd.get("email")], ["Phone", fd.get("phone")]]
          .filter((r) => r[1]);
        out.innerHTML = rows.map((r) => `<div class="flex justify-between gap-4 py-2 border-b border-ink/10"><span class="text-ink/60">${r[0]}</span><span class="font-semibold text-right">${String(r[1]).replace(/</g, "&lt;")}</span></div>`).join("");
      };
      $$("[data-next]", form).forEach((b) => b.addEventListener("click", () => { if (valid(i) && i < steps.length - 1) show(++i); }));
      $$("[data-prev]", form).forEach((b) => b.addEventListener("click", () => { if (i > 0) show(--i); }));
      steps.forEach((s, k) => (s.hidden = k !== 0));
    });

    /* ----- Form submission (Netlify Forms compatible) ----- */
    $$("form[data-ajax]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const btn = $('[type="submit"]', form);
        const status = $("[data-form-status]", form);
        const original = btn ? btn.innerHTML : "";
        if (btn) { btn.disabled = true; btn.innerHTML = "Sending…"; }
        try {
          const body = new URLSearchParams(new FormData(form)).toString();
          const res = await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
          if (!res.ok) throw new Error(res.status);
          const ok = $("[data-form-success]", form.parentElement) || $("[data-form-success]", form);
          if (ok) {
            form.hidden = true; ok.hidden = false;
            g && g.fromTo(ok, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9 });
          }
        } catch (err) {
          if (status) {
            status.hidden = false;
            status.textContent = "We couldn't send this right now. Please call +91 9135353535 or email hr@newkind.com and we'll help you directly.";
          }
        } finally {
          if (btn) { btn.disabled = false; btn.innerHTML = original; }
        }
      });
    });
  }
})();
