/* Saurav Chauhan — portfolio
   Motion layer. No dependencies, no build step.

   INSTRUMENT MODULES          KINETIC MODULES
     1  mobile menu              11  hero particle field
     2  entrance                 12  cursor ring
     3  reveal (+ stagger wave)  13  page-transition veil
     4  counters + odometer      14  pinned horizontal projects
     5  scroll progress
     6  header hide/show
     7  parallax
     8  magnetic buttons
     9  card sheen
    10  eased scrolling + anchors
        console  ·  marquee pause  ·  scroll-spy  ·  toc-spy

   THREE RULES THIS FILE KEEPS
   a) One rAF loop. Every scroll-linked job registers in frameJobs; the loop stops
      itself when no job reports work. No second loop, no second scroll listener.
   b) Read then write. A frame job batches all getBoundingClientRect reads before
      any style write, so nothing thrashes layout.
   c) The reduced-motion end state IS the design. Every module either no-ops or
      jumps to its finished state; nothing is left half-animated. */

(function () {
  "use strict";

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = motionQuery.matches;
  var supportsIO = "IntersectionObserver" in window;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var root = document.documentElement;

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };

  /* CSS default is always the fallback; the enhancement is additive. */
  if (!reduce) root.classList.add("js-fx");

  var frameJobs = [];
  var frameRunning = false;

  function requestFrame() {
    if (frameRunning || reduce) return;
    frameRunning = true;
    requestAnimationFrame(tick);
  }

  function tick() {
    var busy = false;
    for (var i = 0; i < frameJobs.length; i++) {
      if (frameJobs[i]() === true) busy = true;
    }
    frameRunning = busy;
    if (busy) requestAnimationFrame(tick);
  }

  /* One shared observer factory: fire once, then stop watching. */
  function once(nodes, cb, options) {
    if (!nodes.length) return;
    if (!supportsIO) { nodes.forEach(cb); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cb(e.target);
        io.unobserve(e.target);
      });
    }, options || { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    nodes.forEach(function (n) { io.observe(n); });
  }


  /* 1. Mobile menu -------------------------------------------------------- */

  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.getElementById("nav-mobile");

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
  }

  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      var open = drawer.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
    drawer.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeDrawer();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) {
        closeDrawer();
        toggle.focus();
      }
    });
  }


  /* 2. Entrance ----------------------------------------------------------- */

  (function entrance() {
    var items = document.querySelectorAll("[data-enter]");
    if (!items.length) return;
    items.forEach(function (el, i) { el.style.setProperty("--d", (i * 90) + "ms"); });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) { el.classList.add("is-entered"); });
      });
    });
  })();


  /* 3. Reveal ------------------------------------------------------------- */

  (function reveal() {
    /* Stagger as a diagonal wave rather than a queue: a multi-column grid
       arrives as one sweep from its top-left. All rects are read in one pass
       before any style is written. */
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children);
      if (!kids.length) return;

      var rects = kids.map(function (k) { return k.getBoundingClientRect(); });   // read
      var xs = rects.map(function (r) { return r.left; });
      var ys = rects.map(function (r) { return r.top; });
      var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
      var spanX = maxX - minX || 1, spanY = maxY - minY || 1;

      kids.forEach(function (kid, i) {                                            // write
        var dx = (xs[i] - minX) / spanX;
        var dy = (ys[i] - minY) / spanY;
        kid.classList.add("reveal");
        kid.style.setProperty("--d", Math.min((dx * 0.55 + dy) * 300, 420) + "ms");
      });
    });

    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (reduce || !supportsIO) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    once(items, function (el) { el.classList.add("is-visible"); });
  })();


  /* 4. Counters and odometers --------------------------------------------- */

  /* Plain count-up, kept for any [data-count] node. */
  function renderCount(el, value) {
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    el.textContent = (el.dataset.prefix || "") + value.toFixed(decimals) + (el.dataset.suffix || "");
  }

  function runCount(el) {
    var target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    if (reduce) { renderCount(el, target); return; }
    var start = null;
    (function step(now) {
      if (start === null) start = now;
      var t = clamp((now - start) / 1400, 0, 1);
      var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      renderCount(el, target * eased);
      if (t < 1) requestAnimationFrame(step);
      else renderCount(el, target);
    })(performance.now());
  }

  /* Odometer: each digit is a ribbon of 0-9 repeated SPINS times, so every wheel
     makes SPINS-1 full turns before settling on its value. Digits are delayed
     left to right, so the number lands like a mechanical counter. */
  var SPINS = 3;

  function buildOdo(el) {
    var text = (el.dataset.prefix || "") + el.dataset.odo + (el.dataset.suffix || "");
    el.textContent = "";
    el.setAttribute("aria-label", text);
    var digitIndex = 0;

    text.split("").forEach(function (ch) {
      if (ch >= "0" && ch <= "9") {
        var win = document.createElement("span");
        win.className = "odo-digit";
        win.setAttribute("aria-hidden", "true");
        var strip = document.createElement("span");
        strip.className = "odo-strip";
        for (var s = 0; s < SPINS; s++) {
          for (var d = 0; d <= 9; d++) {
            var cell = document.createElement("span");
            cell.className = "odo-cell";
            cell.textContent = d;
            strip.appendChild(cell);
          }
        }
        strip.dataset.target = 10 * (SPINS - 1) + Number(ch);
        strip.style.setProperty("--d", (digitIndex * 90) + "ms");
        win.appendChild(strip);
        el.appendChild(win);
        digitIndex++;
      } else {
        var lit = document.createElement("span");
        lit.className = "odo-lit";
        lit.setAttribute("aria-hidden", "true");
        lit.textContent = ch;
        el.appendChild(lit);
      }
    });
  }

  function rollOdo(el) {
    el.querySelectorAll(".odo-strip").forEach(function (strip) {
      strip.style.setProperty("--i", strip.dataset.target);
    });
  }

  (function counters() {
    var odos = document.querySelectorAll("[data-odo]");
    odos.forEach(function (el) {
      buildOdo(el);
      if (reduce) rollOdo(el);   // land immediately, no spin
    });

    var plain = Array.prototype.slice.call(document.querySelectorAll("[data-count]"))
      .filter(function (el) { return !("countManual" in el.dataset); });

    if (reduce || !supportsIO) {
      plain.forEach(function (el) { renderCount(el, parseFloat(el.dataset.count)); });
      return;
    }

    plain.forEach(function (el) { renderCount(el, 0); });
    once(plain, runCount, { threshold: 0.5 });
    if (!reduce) once(odos, rollOdo, { threshold: 0.5 });
  })();

  /* The 7 → 90 measurement bar: fill to 7/90 first, hold, then run to full while
     the counter spins. Two timeouts, no per-frame cost. */
  (function windowBar() {
    var bar = document.querySelector("[data-bar]");
    if (!bar) return;
    var fill = bar.querySelector(".bar-fill");
    var counter = document.querySelector("[data-count-manual]");

    if (reduce) {
      fill.style.setProperty("--w", "1");
      if (counter) rollOdo(counter);
      return;
    }

    once([bar], function () {
      requestAnimationFrame(function () { fill.style.setProperty("--w", "0.078"); });
      setTimeout(function () {
        fill.style.transition = "transform 900ms var(--ease-meas)";
        fill.style.setProperty("--w", "1");
        if (counter) rollOdo(counter);
      }, 900);
    }, { threshold: 0.5 });
  })();


  /* Console — the tenant-isolation demo ------------------------------------ */

  (function console_() {
    var fig = document.querySelector("[data-console]");
    if (!fig) return;

    var tabs = Array.prototype.slice.call(fig.querySelectorAll('[role="tab"]'));

    function setState(state) {
      fig.dataset.state = state;
      tabs.forEach(function (t) {
        var on = t.dataset.set === state;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener("click", function () { setState(t.dataset.set); });
      t.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        var i = tabs.indexOf(t);
        var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        setState(next.dataset.set);
      });
    });

    /* Ships as "patched" so JS-off and reduced-motion both land on the honest
       final state. Only if motion is allowed do we rewind and play the fix. */
    if (reduce || !supportsIO) return;
    setState("vulnerable");
    once([fig], function () {
      setTimeout(function () { setState("patched"); }, 900);
    }, { threshold: 0.4 });
  })();


  /* Marquee — pause when off-screen so it stops costing battery -------------- */

  (function marqueePause() {
    var track = document.querySelector(".marquee-track");
    if (!track || !supportsIO) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        track.style.animationPlayState = e.isIntersecting ? "running" : "paused";
      });
    }).observe(track);
  })();


  /* 5 + 6. Scroll progress and header -------------------------------------- */

  (function scrollUI() {
    var bar = document.querySelector(".scroll-progress");
    var header = document.querySelector(".site-header");
    if (!bar && !header) return;

    var lastY = window.scrollY;
    var queued = false;

    function update() {
      queued = false;
      var y = window.scrollY;
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0) + ")";
      }
      if (header) {
        var drawerOpen = drawer && drawer.classList.contains("is-open");
        var down = y > lastY;
        if (!drawerOpen && down && y > 400) header.classList.add("is-hidden");
        else if (!down || y < 120) header.classList.remove("is-hidden");
      }
      lastY = y;
    }

    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();


  /* 7. Parallax ------------------------------------------------------------ */

  (function parallax() {
    var layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length || reduce) return;

    var current = [], targets = [];
    layers.forEach(function (_, i) { current[i] = 0; targets[i] = 0; });

    function measure() {
      var y = window.scrollY;
      layers.forEach(function (el, i) {
        var speed = parseFloat(el.dataset.parallax) || 0.15;
        targets[i] = clamp(y * speed, 0, window.innerHeight * speed * 1.5);
      });
      requestFrame();
    }

    frameJobs.push(function () {
      var busy = false;
      layers.forEach(function (el, i) {
        current[i] = lerp(current[i], targets[i], 0.12);
        if (Math.abs(targets[i] - current[i]) > 0.1) busy = true;
        else current[i] = targets[i];
        el.style.transform = "translate3d(0," + current[i].toFixed(2) + "px,0)";
      });
      return busy;
    });

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();
  })();


  /* 8. Magnetic buttons ---------------------------------------------------- */

  (function magnetic() {
    if (!finePointer || reduce) return;
    var STRENGTH = 0.28, MAX = 7;
    document.querySelectorAll(".btn, .btn-resume").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = clamp((e.clientX - (r.left + r.width / 2)) * STRENGTH, -MAX, MAX);
        var y = clamp((e.clientY - (r.top + r.height / 2)) * STRENGTH, -MAX, MAX);
        el.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
      el.addEventListener("blur", function () { el.style.transform = ""; });
    });
  })();


  /* 9. Card sheen ---------------------------------------------------------- */

  (function sheen() {
    if (!finePointer || reduce) return;
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  })();


  /* 11. Hero particle field ------------------------------------------------ */

  /* ~44 dots drifting along lanes, as if requests were moving through the
     system behind the name. Stops completely when scrolled out of view. */
  (function particles() {
    var canvas = document.querySelector(".hero-canvas");
    /* Width, not pointer: this is about screen real estate and battery, and a
       phone should never run a continuous canvas loop. */
    if (!canvas || reduce || window.innerWidth < 1024) return;

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, dots = [], visible = true;

    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      dots = [];
      var lanes = 7;
      for (var i = 0; i < 44; i++) {
        var lane = i % lanes;
        dots.push({
          x: Math.random() * w,
          y: (h / (lanes + 1)) * (lane + 1) + (Math.random() * 10 - 5),
          v: 0.18 + Math.random() * 0.5,
          r: Math.random() < 0.18 ? 1.8 : 1.1,
          a: 0.10 + Math.random() * 0.30
        });
      }
    }

    function draw() {
      if (!visible) return false;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.v;
        if (d.x > w + 8) d.x = -8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(77, 212, 172, " + d.a + ")";
        ctx.fill();
      }
      return true;   // continuous while visible
    }

    size(); seed();
    frameJobs.push(draw);
    canvas.classList.add("is-on");
    requestFrame();

    if (supportsIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) requestFrame();
      }).observe(canvas);
    }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); seed(); requestFrame(); }, 150);
    });
  })();


  /* 12. Cursor ring -------------------------------------------------------- */

  /* Trails the real pointer. The native cursor is NOT hidden — precision and
     accessibility are unaffected; this is an accent, not a replacement. */
  (function cursorRing() {
    if (!finePointer || reduce) return;

    var ring = document.createElement("div");
    ring.className = "cursor";
    ring.setAttribute("aria-hidden", "true");
    var label = document.createElement("span");
    label.className = "cursor-label";
    ring.appendChild(label);
    document.body.appendChild(ring);

    var tx = -100, ty = -100, cx = -100, cy = -100, seen = false;

    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!seen) { cx = tx; cy = ty; seen = true; ring.classList.add("is-on"); }
      requestFrame();

      var hit = e.target.closest("a, button");
      if (hit) {
        ring.classList.add("is-active");
        label.textContent = hit.matches("[download], [href$='.pdf']") ? "open"
          : hit.tagName === "BUTTON" ? ""
          : hit.hasAttribute("target") ? "visit" : "go";
      } else {
        ring.classList.remove("is-active");
        label.textContent = "";
      }
    }, { passive: true });

    document.addEventListener("pointerleave", function () { ring.classList.remove("is-on"); });
    document.addEventListener("pointerenter", function () { if (seen) ring.classList.add("is-on"); });

    frameJobs.push(function () {
      cx = lerp(cx, tx, 0.18);
      cy = lerp(cy, ty, 0.18);
      var done = Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1;
      if (done) { cx = tx; cy = ty; }
      ring.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      return !done;
    });
  })();


  /* 14. Pinned horizontal projects ----------------------------------------- */

  /* Only on a wide, fine-pointer, motion-allowed viewport. Everywhere else the
     CSS grid default stands and this never runs. */
  (function pinProjects() {
    var stage = document.querySelector("[data-pin]");
    if (!stage || reduce) return;

    var sticky = stage.querySelector(".pin-sticky");
    var track = stage.querySelector(".pin-track");
    var prog = stage.querySelector(".pin-progress span");
    if (!sticky || !track) return;

    var wide = window.matchMedia("(min-width: 68rem)");
    var travel = 0, on = false;

    function enable() {
      root.classList.add("js-pin");
      on = true;
      measure();
    }
    function disable() {
      root.classList.remove("js-pin");
      on = false;
      track.style.setProperty("--px", 0);
      stage.style.removeProperty("--stage-h");
    }

    function measure() {
      if (!on) return;
      /* read — the track starts at the container's left inset, not at 0, so the
         distance it must travel is its width minus the space actually available
         to its right. Measuring against the full viewport leaves the last card
         short by the inset. */
      var trackW = track.scrollWidth;
      var trackLeft = track.getBoundingClientRect().left;
      var available = window.innerWidth - trackLeft;
      travel = Math.max(0, trackW - available + 24);
      // write
      stage.style.setProperty("--stage-h", (100 + (travel / window.innerWidth) * 100) + "vh");
    }

    function update() {
      if (!on) return false;
      var r = stage.getBoundingClientRect();                 // read
      var total = stage.offsetHeight - window.innerHeight;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      track.style.setProperty("--px", (p * travel).toFixed(1));   // write
      if (prog) prog.style.setProperty("--pp", p.toFixed(3));
      return false;
    }

    /* Width only — the track is driven by vertical scroll, so a touch laptop or
       a tablet in landscape has no reason to be excluded. */
    function sync() {
      if (wide.matches) { if (!on) enable(); }
      else if (on) disable();
      update();
    }

    frameJobs.push(update);
    window.addEventListener("scroll", function () { if (on) requestFrame(); }, { passive: true });
    window.addEventListener("resize", function () { measure(); sync(); requestFrame(); });
    if (wide.addEventListener) wide.addEventListener("change", sync);
    sync();
  })();


  /* 10. Eased scrolling ---------------------------------------------------- */

  var scroller = (function () {
    var target = window.scrollY, current = window.scrollY;
    var animating = false, self = false;

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    frameJobs.push(function () {
      if (!animating) return false;
      current = lerp(current, target, 0.14);
      if (Math.abs(target - current) < 0.4) { current = target; animating = false; }
      self = true;
      window.scrollTo(0, current);
      return animating;
    });

    window.addEventListener("scroll", function () {
      if (self) { self = false; return; }
      if (!animating) { current = target = window.scrollY; }
    }, { passive: true });

    window.addEventListener("resize", function () {
      current = target = window.scrollY;
      animating = false;
    });

    return {
      by: function (delta) {
        if (!animating) current = window.scrollY;
        target = clamp((animating ? target : current) + delta, 0, maxScroll());
        animating = true;
        requestFrame();
      },
      to: function (y) {
        current = window.scrollY;
        target = clamp(y, 0, maxScroll());
        animating = true;
        requestFrame();
      }
    };
  })();

  if (!reduce) {
    root.classList.add("js-scroll");
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;
      else if (e.deltaMode === 2) delta *= window.innerHeight;
      e.preventDefault();
      scroller.by(delta);
    }, { passive: false });
  }


  /* 13. Page-transition veil ----------------------------------------------- */

  var veil = null;

  (function pageVeil() {
    if (reduce) return;
    veil = document.createElement("div");
    veil.className = "veil";
    veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    /* Lift on arrival. pageshow (not load) so a bfcache back-navigation also
       clears it instead of leaving the page covered. */
    window.addEventListener("pageshow", function () {
      veil.classList.remove("is-covering");
      veil.classList.add("is-lifting");
      setTimeout(function () { veil.classList.remove("is-lifting"); }, 560);
    });
  })();

  function leaveTo(href) {
    if (!veil) { window.location.href = href; return; }
    veil.classList.remove("is-lifting");
    veil.classList.add("is-covering");
    setTimeout(function () { window.location.href = href; }, 430);
    // If navigation is blocked for any reason, never strand the page under a veil
    setTimeout(function () { veil.classList.remove("is-covering"); }, 3000);
  }


  /* Link handling: in-page anchors ease, internal pages veil ---------------- */

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[href]");
    if (!link) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    var url;
    try { url = new URL(link.href, window.location.href); } catch (err) { return; }
    if (url.host !== window.location.host) return;
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    /* Same page + hash → eased scroll */
    if (url.pathname === window.location.pathname && url.hash) {
      var el = document.getElementById(url.hash.slice(1));
      if (!el) return;
      e.preventDefault();
      closeDrawer();
      var top = el.getBoundingClientRect().top + window.scrollY - 88;
      if (reduce) window.scrollTo(0, Math.max(top, 0));
      else scroller.to(top);
      history.pushState(null, "", url.hash);
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
      return;
    }

    /* Different page on this site → veil out, then navigate */
    if (url.pathname !== window.location.pathname && !reduce && veil) {
      if (/\.(pdf|zip|png|jpg|svg|xml|txt)$/i.test(url.pathname)) return;
      e.preventDefault();
      closeDrawer();
      leaveTo(url.href);
    }
  });


  /* Scroll-spy nav and detail-page TOC ------------------------------------- */

  function spy(links) {
    if (!links.length || !supportsIO) return;
    var sections = links
      .map(function (l) {
        var h = l.getAttribute("href") || "";
        var i = h.indexOf("#");
        return i < 0 ? null : document.getElementById(h.slice(i + 1));
      })
      .filter(Boolean);
    if (!sections.length) return;

    var visible = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      });
      if (!visible.size) return;
      var topmost = Array.from(visible).sort(function (a, b) {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      })[0];
      links.forEach(function (l) {
        l.classList.toggle("is-active", (l.getAttribute("href") || "").endsWith("#" + topmost.id));
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    sections.forEach(function (s) { io.observe(s); });
  }

  spy(Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']")));
  spy(Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']")));

  /* Respond live if the visitor flips the OS motion setting */
  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", function (e) {
      if (e.matches) {
        root.classList.remove("js-fx", "js-pin", "js-scroll");
        document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
      }
    });
  }
})();
