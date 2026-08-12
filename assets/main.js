/* Saurav Chauhan — portfolio
   Motion layer. No dependencies.

   Modules:
     1. Mobile menu
     2. Entrance         hero / page-header animation on load
     3. Reveal           scroll-triggered, with stagger inside [data-stagger]
     4. Counters         count-up on [data-count]
     5. Scroll progress  top bar
     6. Header           hides on scroll down, returns on scroll up
     7. Parallax         [data-parallax] drift
     8. Magnetic         buttons lean toward the cursor
     9. Card sheen       gradient follows the cursor
    10. Smooth scroll    eased wheel scrolling + animated anchor jumps

   Everything degrades: with JS off, the .no-js CSS keeps the page fully
   visible; with prefers-reduced-motion, every module below either turns
   itself off or jumps straight to the finished state. */

(function () {
  "use strict";

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduce = motionQuery.matches;
  var supportsIO = "IntersectionObserver" in window;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, min, max) { return Math.min(Math.max(v, min), max); };

  /* Single shared rAF loop. Modules register a callback; the loop only runs
     while at least one of them reports it still has work to do. */
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

    items.forEach(function (el, i) {
      el.style.setProperty("--d", (i * 90) + "ms");
    });

    // One frame of delay so the browser paints the "before" state first —
    // without it the transition has nothing to animate from.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) { el.classList.add("is-entered"); });
      });
    });
  })();


  /* 3. Reveal on scroll --------------------------------------------------- */

  (function reveal() {
    // Children of a [data-stagger] container reveal as a group, one after another
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.classList.add("reveal");
        child.style.setProperty("--d", (i * 90) + "ms");
      });
    });

    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!supportsIO || reduce) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    items.forEach(function (el) { observer.observe(el); });
  })();


  /* 4. Counters ----------------------------------------------------------- */

  (function counters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    var render = function (el, value) {
      var decimals = parseInt(el.dataset.decimals || "0", 10);
      el.textContent = (el.dataset.prefix || "") +
                       value.toFixed(decimals) +
                       (el.dataset.suffix || "");
    };

    var run = function (el) {
      var target = parseFloat(el.dataset.count);
      if (isNaN(target)) return;

      if (reduce) { render(el, target); return; }

      var duration = 1400;
      var start = null;

      var step = function (now) {
        if (start === null) start = now;
        var t = clamp((now - start) / duration, 0, 1);
        // easeOutExpo — fast start, long settle, so the final digits land softly
        var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        render(el, target * eased);
        if (t < 1) requestAnimationFrame(step);
        else render(el, target);
      };

      requestAnimationFrame(step);
    };

    if (!supportsIO || reduce) {
      nodes.forEach(function (el) { render(el, parseFloat(el.dataset.count)); });
      return;
    }

    // Show zero until the counter scrolls into view, or the first digits are missed
    nodes.forEach(function (el) { render(el, 0); });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (el) { observer.observe(el); });
  })();


  /* 5 + 6. Scroll progress and header ------------------------------------- */

  (function scrollUI() {
    var bar = document.querySelector(".scroll-progress");
    var header = document.querySelector(".site-header");
    if (!bar && !header) return;

    var lastY = window.scrollY;
    var queued = false;

    var update = function () {
      queued = false;
      var y = window.scrollY;

      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? clamp(y / max, 0, 1) : 0) + ")";
      }

      if (header) {
        // Hide only when scrolling down, well past the hero, and never while
        // the mobile drawer is open — hiding it would take the drawer with it.
        var drawerOpen = drawer && drawer.classList.contains("is-open");
        var down = y > lastY;
        if (!drawerOpen && down && y > 400) header.classList.add("is-hidden");
        else if (!down || y < 120) header.classList.remove("is-hidden");
      }

      lastY = y;
    };

    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  })();


  /* 7. Parallax ----------------------------------------------------------- */

  (function parallax() {
    var layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length || reduce) return;

    var current = [];
    var targets = [];

    layers.forEach(function (_, i) { current[i] = 0; targets[i] = 0; });

    var measure = function () {
      var y = window.scrollY;
      layers.forEach(function (el, i) {
        var speed = parseFloat(el.dataset.parallax) || 0.15;
        // Only drift while the element is still near the top of the document,
        // so nothing floats far out of its own section.
        targets[i] = clamp(y * speed, 0, window.innerHeight * speed * 1.5);
      });
      requestFrame();
    };

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


  /* 8. Magnetic buttons --------------------------------------------------- */

  (function magnetic() {
    if (!finePointer || reduce) return;

    var STRENGTH = 0.28;
    var MAX = 7;

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


  /* 9. Card sheen --------------------------------------------------------- */

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


  /* 10. Smooth scroll ----------------------------------------------------- */

  /* Eases the document's real scroll position rather than transforming a
     wrapper, so position:sticky, anchors and the scrollbar all keep working.
     Wheel input only — touch and trackpad-on-mobile already scroll smoothly,
     and keyboard/scrollbar scrolling is left entirely to the browser. */

  var scroller = (function () {
    var target = window.scrollY;
    var current = window.scrollY;
    var animating = false;
    var self = false;          // true while we are the one calling scrollTo

    var maxScroll = function () {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    };

    frameJobs.push(function () {
      if (!animating) return false;

      current = lerp(current, target, 0.14);

      if (Math.abs(target - current) < 0.4) {
        current = target;
        animating = false;
      }

      self = true;
      window.scrollTo(0, current);
      return animating;
    });

    // Anything that moves the page without going through us — scrollbar drag,
    // keyboard, browser restore — resyncs our position so the next wheel
    // event continues from where the page actually is.
    window.addEventListener("scroll", function () {
      if (self) { self = false; return; }
      if (!animating) { current = target = window.scrollY; }
    }, { passive: true });

    window.addEventListener("resize", function () {
      current = target = window.scrollY;
      animating = false;
    });

    return {
      enabled: false,
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
    document.documentElement.classList.add("js-scroll");
    scroller.enabled = true;

    window.addEventListener("wheel", function (e) {
      // Leave zoom and horizontal gestures to the browser
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      var delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 16;                    // lines  → px
      else if (e.deltaMode === 2) delta *= window.innerHeight; // pages → px

      e.preventDefault();
      scroller.by(delta);
    }, { passive: false });
  }

  /* Anchor links: animate rather than jump, and offset for the sticky header */
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href*="#"]');
    if (!link) return;

    var url = new URL(link.href, window.location.href);
    if (url.pathname !== window.location.pathname || url.host !== window.location.host) return;

    var id = url.hash.slice(1);
    if (!id) return;

    var el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();
    closeDrawer();

    var top = el.getBoundingClientRect().top + window.scrollY - 88;

    if (reduce) window.scrollTo(0, Math.max(top, 0));
    else scroller.to(top);

    history.pushState(null, "", url.hash);
    // Keep the keyboard where the eye went
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  });


  /* Scroll-spy nav -------------------------------------------------------- */

  (function spy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".nav a[href^='#']")
    );
    if (!links.length || !supportsIO) return;

    var sections = links
      .map(function (l) { return document.querySelector(l.getAttribute("href")); })
      .filter(Boolean);

    var visible = new Set();

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });

      if (!visible.size) return;

      var topmost = Array.from(visible).sort(function (a, b) {
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      })[0];

      links.forEach(function (l) {
        l.classList.toggle("is-active", l.getAttribute("href") === "#" + topmost.id);
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    sections.forEach(function (s) { observer.observe(s); });
  })();
})();
