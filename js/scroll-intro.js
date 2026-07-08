/**
 * Homepage scroll-scrubbed intro: fixed yellow stage + frame sequence.
 * Maps scroll through `.scroll-intro__runway` to 51 PNGs, then reveals page content.
 */
(function () {
  var TOTAL_FRAMES = 51;
  var FRAMES_PER_SCROLL_UNIT = 4;
  var SCROLL_UNIT_DESKTOP = 100;
  var SCROLL_UNIT_MOBILE = 72;
  var mobileMq = window.matchMedia("(max-width: 768px)");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var intro = document.getElementById("scroll-intro");
  var runway = intro && intro.querySelector(".scroll-intro__runway");
  var frameEl = document.getElementById("scroll-intro-frame");
  var headlineEl = document.getElementById("scroll-intro-headline");
  var cueEl = document.getElementById("scroll-intro-cue");

  if (!intro || !runway || !frameEl || !headlineEl) return;

  if (reducedMotion) {
    root.classList.add("scroll-intro-reduced");
    return;
  }

  var frames = [];
  var i;
  for (i = 0; i < TOTAL_FRAMES; i += 1) {
    frames.push(
      "assets/intro-frames/frame_" + String(i).padStart(3, "0") + ".png"
    );
  }

  var scrollUnitPx = SCROLL_UNIT_DESKTOP;
  var pixelsPerFrame = scrollUnitPx / FRAMES_PER_SCROLL_UNIT;
  var maxScrollRange = (TOTAL_FRAMES - 1) * pixelsPerFrame;
  var fadeRange = 2 * scrollUnitPx;
  var currentFrame = -1;
  var active = false;
  var complete = false;
  var resizeTimer = null;

  function syncMetrics() {
    scrollUnitPx = mobileMq.matches ? SCROLL_UNIT_MOBILE : SCROLL_UNIT_DESKTOP;
    pixelsPerFrame = scrollUnitPx / FRAMES_PER_SCROLL_UNIT;
    maxScrollRange = (TOTAL_FRAMES - 1) * pixelsPerFrame;
    fadeRange = 2 * scrollUnitPx;
    runway.style.setProperty("--scroll-intro-runway", maxScrollRange + "px");
  }

  function progressWithinIntro() {
    return Math.min(maxScrollRange, Math.max(0, window.scrollY));
  }

  function setActive(next) {
    if (next === active) return;
    active = next;
    root.classList.toggle("scroll-intro-active", active);
  }

  function setComplete(next) {
    if (next === complete) return;
    complete = next;
    intro.classList.toggle("is-complete", complete);
  }

  function render() {
    var scrolled = progressWithinIntro();
    // Stage stays dismissed through the post-animation landing buffer;
    // it only returns once scroll is back inside the scrub range.
    var finished = window.scrollY >= maxScrollRange;

    setComplete(finished);
    // Hide site chrome while the yellow stage is still covering the viewport.
    setActive(!finished);

    var fadeIn = Math.min(1, Math.max(0, scrolled / fadeRange));
    var fadeOut = Math.min(
      1,
      Math.max(0, (maxScrollRange - scrolled) / fadeRange)
    );
    headlineEl.style.opacity = String(Math.min(fadeIn, fadeOut));

    // Scroll cue: fully visible on load, faded out within 2 scroll units.
    if (cueEl) {
      cueEl.style.opacity = String(
        Math.min(1, Math.max(0, 1 - scrolled / fadeRange))
      );
    }

    var nextFrame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(scrolled / pixelsPerFrame))
    );

    if (nextFrame === currentFrame) return;
    currentFrame = nextFrame;
    frameEl.src = frames[nextFrame];
  }

  function preload() {
    // On mobile, preload nearby frames first to keep early scrub responsive.
    var priorityCount = mobileMq.matches ? 16 : TOTAL_FRAMES;
    frames.forEach(function (src, index) {
      if (index === 0) return;
      if (index < priorityCount) {
        var img = new Image();
        img.src = src;
        return;
      }
      // Defer the rest until idle when possible.
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(function () {
          var lazy = new Image();
          lazy.src = src;
        });
      } else {
        setTimeout(function () {
          var lazy = new Image();
          lazy.src = src;
        }, 250 + index * 20);
      }
    });
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      syncMetrics();
      currentFrame = -1;
      render();
    }, 120);
  }

  syncMetrics();
  render();
  window.addEventListener("scroll", render, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  if (typeof mobileMq.addEventListener === "function") {
    mobileMq.addEventListener("change", onResize);
  } else if (typeof mobileMq.addListener === "function") {
    mobileMq.addListener(onResize);
  }
  requestAnimationFrame(preload);
})();
