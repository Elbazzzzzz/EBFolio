/**
 * Homepage intro: fixed yellow stage + frame sequence.
 * Autoplays on load (driven by programmatic scroll through `.scroll-intro__runway`),
 * so the same scrub pipeline also responds to manual scroll if the user takes over.
 * A failsafe guarantees the page content is revealed within FAILSAFE_MS of load.
 */
(function () {
  var TOTAL_FRAMES = 51;
  var FRAMES_PER_SCROLL_UNIT = 4;
  var SCROLL_UNIT_DESKTOP = 100;
  var SCROLL_UNIT_MOBILE = 72;
  var AUTOPLAY_DELAY_MS = 700;
  var AUTOPLAY_DURATION_MS = 4800;
  var FAILSAFE_MS = 8000;
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

  /* —— Autoplay on load ——
     Drives the same scroll-scrubbed pipeline programmatically, so manual
     scroll stays a fully working alternative trigger at any point. */
  var autoplayRaf = null;
  var autoplayDelayTimer = null;
  var failsafeTimer = null;
  var userTookOver = false;

  function introTargetScroll() {
    // Scroll past the landing buffer too, so the hero sits at the top
    // of the viewport once the stage has faded out.
    return Math.max(maxScrollRange, intro.offsetHeight);
  }

  function cancelAutoplay() {
    clearTimeout(autoplayDelayTimer);
    if (autoplayRaf) {
      cancelAnimationFrame(autoplayRaf);
      autoplayRaf = null;
    }
  }

  function onUserScroll() {
    if (userTookOver) return;
    userTookOver = true;
    // The user is in control now: stop driving the scroll and stand down
    // the failsafe (their scrolling is the reveal trigger from here).
    cancelAutoplay();
    clearTimeout(failsafeTimer);
  }

  function onPointerDown() {
    // A click or scrollbar drag stops the autoplay fighting the pointer,
    // but the failsafe stays armed so the content still reveals on time.
    cancelAutoplay();
  }

  function onScrollKeydown(event) {
    var scrollKeys = [
      " ",
      "Spacebar",
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
    ];
    if (scrollKeys.indexOf(event.key) !== -1) onUserScroll();
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function startAutoplay() {
    if (userTookOver || complete) return;

    var startY = window.scrollY;
    if (startY >= maxScrollRange) return;

    var targetY = introTargetScroll();
    var startTime = null;

    function step(timestamp) {
      if (userTookOver) return;
      if (startTime === null) startTime = timestamp;
      var t = Math.min(1, (timestamp - startTime) / AUTOPLAY_DURATION_MS);
      window.scrollTo(0, Math.round(startY + (targetY - startY) * easeInOutCubic(t)));
      autoplayRaf = t < 1 ? requestAnimationFrame(step) : null;
    }

    autoplayRaf = requestAnimationFrame(step);
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

  window.addEventListener("wheel", onUserScroll, { passive: true });
  window.addEventListener("touchmove", onUserScroll, { passive: true });
  window.addEventListener("keydown", onScrollKeydown);
  window.addEventListener("touchstart", onPointerDown, { passive: true });
  window.addEventListener("mousedown", onPointerDown, { passive: true });

  if (window.location.hash) {
    // Deep link (e.g. #projects): let the hash navigation own the scroll
    // instead of animating over it. The stage clears as soon as the
    // browser/hash scroll passes the scrub range.
    userTookOver = true;
  } else {
    autoplayDelayTimer = setTimeout(startAutoplay, AUTOPLAY_DELAY_MS);

    // Failsafe: whatever happens to the animation, the content is revealed
    // within FAILSAFE_MS of load (unless the user has taken over scrolling).
    failsafeTimer = setTimeout(function () {
      if (userTookOver || complete || window.scrollY >= maxScrollRange) return;
      cancelAutoplay();
      window.scrollTo(0, introTargetScroll());
      render();
    }, FAILSAFE_MS);
  }
})();
