/* Saurav Chauhan — portfolio
   Motion layer. No dependencies, no build step.

   INSTRUMENT MODULES          KINETIC MODULES
     0  boot sequence            11  hero particle field
     1  mobile menu              12  cursor ring
     2  entrance                 13  page-transition veil
     3  reveal (+ stagger wave)  14  pinned horizontal projects
     4  counters + odometer      15  scroll-linked image frames
     5  scroll progress          16  pinned hero request packet
     6  header hide/show         17  section-head line reveals
     7  parallax                 18  scroll-reactive tape
     8  magnetic buttons         19  contact flight
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


  /* 0. Boot sequence ------------------------------------------------------- */

  /* The arrival moment: a four-line system boot in the site's own console
     voice, ending on the same 200 OK the hero packet carries. Hard limits so
     it stays a greeting and not a gate: ~1.3s total, any input skips it, it
     runs once per session, and no-JS or reduced-motion visitors never see it
     because the DOM only exists here. Returns a gate that entrance waits on. */
  var onBoot = (function bootSequence() {
    var cbs = [], done = false;

    function release() {
      done = true;
      var list = cbs;
      cbs = [];
      list.forEach(function (cb) { cb(); });
    }

    var skip = reduce;
    if (!skip) {
      try {
        skip = sessionStorage.getItem("sc-boot") === "1";
        sessionStorage.setItem("sc-boot", "1");
      } catch (err) { skip = true; }   // storage blocked → never replay per page
    }
    if (skip) return function (cb) { cb(); };

    var el = document.createElement("div");
    el.className = "boot";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<span class="boot-bar"></span>' +
      '<div class="boot-panel">' +
        '<p class="boot-title">saurav chauhan · portfolio</p>' +
        '<p class="boot-line"><span>init motion layer</span><span class="boot-leader"></span><span class="boot-ok">ok</span></p>' +
        '<p class="boot-line"><span>route request path</span><span class="boot-leader"></span><span class="boot-ok">ok</span></p>' +
        '<p class="boot-line"><span>load readouts</span><span class="boot-leader"></span><span class="boot-ok">ok</span></p>' +
        '<p class="boot-line boot-done">200 OK · ready</p>' +
      '</div>';
    document.body.appendChild(el);
    root.style.overflow = "hidden";

    var lines = el.querySelectorAll(".boot-line");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("is-running");
        lines.forEach(function (line, i) {
          setTimeout(function () { line.classList.add("on"); }, 160 + i * 170);
        });
      });
    });

    var lifted = false;
    function lift() {
      if (lifted) return;
      lifted = true;
      root.style.overflow = "";
      el.classList.add("is-lifting");
      release();   // entrance plays underneath while the cover lifts
      setTimeout(function () { el.remove(); }, 620);
    }

    var timer = setTimeout(lift, 1280);
    ["keydown", "pointerdown", "wheel", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, function () {
        clearTimeout(timer);
        lift();
      }, { once: true, passive: true });
    });

    return function (cb) { done ? cb() : cbs.push(cb); };
  })();


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
    /* Waits on the boot gate: on a first visit the entrance plays underneath
       the lifting cover; every other time the gate is already open. */
    onBoot(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          items.forEach(function (el) { el.classList.add("is-entered"); });
        });
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


  /* 17. Section-head line reveals ------------------------------------------- */

  /* The hero h1's masked reveal, made the house style: every section heading
     (and the footer's closing line) is wrapped in the same .mask pair and
     released when scrolled to, with the section rule drawing out beside it.
     Wrapping happens here, not in markup, so no-JS pages ship plain text. */
  (function headingMasks() {
    if (reduce || !supportsIO) return;

    var containers = Array.prototype.slice.call(document.querySelectorAll(".section-head"));
    var footTop = document.querySelector(".footer-top");
    if (footTop) containers.push(footTop);

    var armed = [];
    containers.forEach(function (box) {
      var h2 = box.querySelector("h2");
      if (!h2) return;
      h2.innerHTML = '<span class="mask"><span class="mask-inner">' + h2.innerHTML + "</span></span>";
      box.classList.add("mask-armed");
      armed.push(box);
    });
    if (!armed.length) return;

    /* Observation starts once the boot cover is gone, so a first visit's
       above-fold headings play in view instead of behind the overlay. */
    onBoot(function () {
      once(armed, function (el) { el.classList.add("is-visible"); },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
    });
  })();


  /* 18. Scroll-reactive tape ------------------------------------------------ */

  /* The tech tape stops being a fixed-speed loop: it drifts on its own, speeds
     up with a downward scroll, runs backwards on an upward one, and eases to a
     stop under the pointer so it can be read. CSS animation remains the
     fallback everywhere this does not initialise. */
  /* No pointer gate: the CSS loop already runs everywhere, so driving the same
     motion from the rAF loop costs nothing extra on touch — and flick-scrolls
     make the reaction MORE visible there, not less. The clamp bounds the burst. */
  (function tape() {
    var wrap = document.querySelector(".marquee");
    var track = document.querySelector(".marquee-track");
    if (!wrap || !track || reduce) return;
    var group = track.querySelector(".marquee-group");
    if (!group) return;

    root.classList.add("js-tape");

    var x = 0, w = 0, base = 0, boost = 0;
    var lastY = window.scrollY, visible = true, hovered = false;

    function measure() { w = group.getBoundingClientRect().width; }

    frameJobs.push(function () {
      if (!visible || !w) return false;
      base = lerp(base, hovered ? 0 : 0.55, 0.08);
      boost *= 0.9;
      x -= base + clamp(boost, -16, 16);
      x = -(((-x % w) + w) % w);   // keep x in (-w, 0]; two identical groups make the wrap seamless
      track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      return true;   // continuous while visible, like the particle field
    });

    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      boost += (y - lastY) * 0.08;
      lastY = y;
      requestFrame();
    }, { passive: true });

    wrap.addEventListener("pointerenter", function () { hovered = true; });
    wrap.addEventListener("pointerleave", function () { hovered = false; });
    window.addEventListener("resize", measure);

    if (supportsIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) requestFrame();
      }).observe(wrap);
    }

    measure();
    requestFrame();
  })();


  /* 19. Contact flight ------------------------------------------------------ */

  /* A paper plane crosses the contact footer, scrubbed by scroll: it advances
     as the footer scrolls up, flies backwards when you do, and banks to follow
     its own curve. Position AND heading are both sampled from the trail path
     itself, so the plane and its vapor trail cannot drift apart. The footer is
     the last element on every page, so t = (vh - top) / height runs exactly
     0 → 1 between the footer entering and the page bottoming out. */
  (function flight() {
    var footer = document.querySelector(".site-footer");
    if (!footer || reduce) return;

    var scene = document.createElement("div");
    scene.className = "flight";
    scene.setAttribute("aria-hidden", "true");
    scene.innerHTML =
      '<svg class="flight-svg" preserveAspectRatio="none"><path class="flight-trail"/></svg>' +
      '<svg class="flight-plane" viewBox="0 0 40 40">' +
        '<path d="M4 8 L38 20 L4 32 L12 20 Z" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M12 20 L38 20" fill="none" stroke="var(--accent-dim)" stroke-width="1.25"/>' +
      '</svg>';
    footer.appendChild(scene);

    var trail = scene.querySelector(".flight-trail");
    var plane = scene.querySelector(".flight-plane");
    if (!trail.getTotalLength) { scene.remove(); return; }

    var HALF = 27;   // half the plane's CSS box; rotation happens around its centre
    var len = 0, lastT = -1;

    function measure() {
      var w = footer.offsetWidth, h = footer.offsetHeight;
      scene.querySelector(".flight-svg").setAttribute("viewBox", "0 0 " + w + " " + h);
      /* Take-off off-screen left, climb over the heading, and LAND high right —
         inside the scene, not past it, because the page bottom is where most
         visitors come to rest and the resting composition should still have
         the plane in it, parked at the end of its trail. */
      trail.setAttribute("d",
        "M" + (-70) + " " + (h * 0.78) +
        " C " + (w * 0.30) + " " + (h * 0.72) +
        ", " + (w * 0.55) + " " + (h * 0.08) +
        ", " + (w * 0.90) + " " + (h * 0.16));
      len = trail.getTotalLength();
      trail.style.strokeDasharray = len;
      trail.style.strokeDashoffset = len;
      lastT = -1;
    }

    function update() {
      var r = footer.getBoundingClientRect();                    // read
      var vh = window.innerHeight;
      if (r.top > vh + 80 || !len) return false;
      var t = clamp((vh - r.top) / r.height, 0, 1);
      if (t === lastT) return false;
      lastT = t;

      var at = t * len;                                           // write
      var pt = trail.getPointAtLength(at);
      var ahead = trail.getPointAtLength(Math.min(at + 2, len));
      var ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
      plane.style.transform =
        "translate3d(" + (pt.x - HALF).toFixed(1) + "px," + (pt.y - HALF).toFixed(1) + "px,0)" +
        " rotate(" + ang.toFixed(1) + "deg)";
      trail.style.strokeDashoffset = (len - at).toFixed(1);
      return false;   // scroll-driven, never self-sustaining
    }

    frameJobs.push(update);
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", function () { measure(); requestFrame(); });
    window.addEventListener("load", function () { measure(); requestFrame(); });

    measure();
    scene.classList.add("is-on");
    requestFrame();
  })();


  /* 16. Pinned hero — the request packet ------------------------------------ */

  /* The vehicle-on-a-path idea, in this site's own vocabulary: the hero pins and
     a request rides the pipeline it already draws. Scroll down and it descends
     browser → Nuxt → NestJS → PostgreSQL; scroll up and the response climbs back.

     Position comes from getPointAtLength() on a path that lives in the markup,
     so the route stays hand-editable in the SVG and JS never hard-codes a
     coordinate. Same stage/sticky/progress shape as module 14. */
  (function heroPacket() {
    var hero = document.querySelector("[data-hero-pin]");
    if (!hero || reduce) return;

    var path = hero.querySelector(".packet-path");
    var packet = hero.querySelector(".packet");
    if (!path || !packet || !path.getTotalLength) return;

    var label = packet.querySelector(".packet-label");
    var stations = Array.prototype.slice.call(hero.querySelectorAll(".station"));
    var stationY = stations.map(function (s) {
      return parseFloat(s.getAttribute("y")) + parseFloat(s.getAttribute("height")) / 2;
    });

    /* Height as well as width: pinning a hero that cannot fit in 100vh would
       crop it, and .hero-sticky hides its overflow. */
    var fits = window.matchMedia("(min-width: 64rem) and (min-height: 44rem)");
    var len = 0, on = false, lastP = -1, lit = [];

    function enable() {
      root.classList.add("js-hero-pin");
      on = true;
      len = path.getTotalLength();
    }

    function disable() {
      root.classList.remove("js-hero-pin");
      on = false;
      packet.classList.remove("is-on", "is-up");
      stations.forEach(function (s) { s.classList.remove("is-lit"); });
      lit = [];
    }

    function update() {
      if (!on) return false;
      var r = hero.getBoundingClientRect();                       // read
      var total = hero.offsetHeight - window.innerHeight;
      var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      if (p === lastP) return false;

      var pt = path.getPointAtLength(p * len);                    // write
      packet.setAttribute("transform", "translate(" + pt.x.toFixed(2) + "," + pt.y.toFixed(2) + ")");
      packet.classList.toggle("is-on", p > 0.004 && p < 0.996);

      /* Only flip on a real move — an equal frame would otherwise reset the
         direction to "request" every time scrolling settles. */
      if (lastP >= 0 && Math.abs(p - lastP) > 0.0004) {
        var up = p < lastP;
        packet.classList.toggle("is-up", up);
        if (label) label.textContent = up ? "200 OK ↑" : "GET /search ↓";
      }

      for (var i = 0; i < stations.length; i++) {
        var near = Math.abs(pt.y - stationY[i]) < 17;
        if (near !== lit[i]) {                                     // toggle only on change
          stations[i].classList.toggle("is-lit", near);
          lit[i] = near;
        }
      }

      lastP = p;
      return false;   // scroll-driven, never self-sustaining
    }

    function sync() {
      if (fits.matches) { if (!on) enable(); }
      else if (on) disable();
      update();
    }

    frameJobs.push(update);
    window.addEventListener("scroll", function () { if (on) requestFrame(); }, { passive: true });
    window.addEventListener("resize", function () { sync(); requestFrame(); });
    if (fits.addEventListener) fits.addEventListener("change", sync);
    sync();
    requestFrame();
  })();


  /* 15. Scroll-linked image frames ----------------------------------------- */

  /* Three motions per figure. Two are one-shot and live entirely in CSS (the
     clip wipe and the scale settle, fired by one class). Only the parallax
     drift needs a frame, and it writes to a different element than the settle
     so the two never contend for one transform.

     Travel: the frame's top edge at the viewport bottom is p=0, its bottom edge
     at the viewport top is p=1. Offset runs +drift → -drift across that, so the
     image lags the page rather than leading it. */
  (function scrollImages() {
    var shots = document.querySelectorAll("[data-shot]");
    if (!shots.length) return;

    /* Enter state first — under reduced motion .js-fx is absent, so the CSS has
       no initial state and this class toggle is inert. Costs nothing to keep. */
    once(shots, function (el) { el.classList.add("is-visible"); },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });

    if (reduce) return;

    var items = [];
    Array.prototype.forEach.call(shots, function (el) {
      var img = el.querySelector("img");
      var frame = el.querySelector(".shot-frame");
      if (img && frame) items.push({ el: el, img: img, frame: frame, drift: 0 });
    });
    if (!items.length) return;

    /* --shot-drift is declared in CSS and read back here, so the image height
       and the travel distance can never drift apart (they would silently, if
       this number were typed in two places). */
    function measure() {
      items.forEach(function (it) {
        var d = parseFloat(getComputedStyle(it.el).getPropertyValue("--shot-drift"));
        if (isNaN(d)) d = 9;
        it.drift = it.frame.offsetHeight * (d / 100);
      });
    }

    frameJobs.push(function () {
      var vh = window.innerHeight;
      var rects = items.map(function (it) {                 // read every rect...
        return it.el.getBoundingClientRect();
      });
      for (var i = 0; i < items.length; i++) {              // ...then write
        var r = rects[i];
        if (r.bottom < -80 || r.top > vh + 80) continue;     // off-screen, skip the write
        var p = clamp((vh - r.top) / (vh + r.height), 0, 1);
        items[i].img.style.transform =
          "translate3d(0," + ((0.5 - p) * 2 * items[i].drift).toFixed(2) + "px,0)";
      }
      return false;   // driven by scroll, never self-sustaining
    });

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", function () { measure(); requestFrame(); });
    /* Re-measure once images have real dimensions; aspect-ratio holds the box so
       this cannot shift layout, but the frame height is only final after load. */
    window.addEventListener("load", function () { measure(); requestFrame(); });

    measure();
    requestFrame();
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
        root.classList.remove("js-fx", "js-pin", "js-scroll", "js-hero-pin", "js-tape");
        document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
      }
    });
  }
})();
