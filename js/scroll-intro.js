/**
 * Homepage intro: fixed yellow stage + frame sequence.
 * Autoplays on load at AUTOPLAY_FPS (programmatic scroll through
 * `.scroll-intro__runway` and a fast landing buffer to the hero). Manual scroll,
 * wheel, touch, or keyboard input cancels autoplay immediately.
 */
(function () {
  var TOTAL_FRAMES = 51;
  var FRAMES_PER_SCROLL_UNIT = 4;
  var SCROLL_UNIT_DESKTOP = 100;
  var SCROLL_UNIT_MOBILE = 72;
  var AUTOPLAY_DELAY_MS = 1500;
  var AUTOPLAY_FPS = 12;
  var AUTOPLAY_FRAME_MS = 1000 / AUTOPLAY_FPS;
  // After the last frame, snap through the landing buffer quickly so the hero
  // reveals without a long pause (was 800ms/step).
  var AUTOPLAY_LANDING_STEP_MS = 40;
  var FAILSAFE_BUFFER_MS = 1500;
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
  var autoplayTimer = null;
  var autoplayDelayTimer = null;
  var failsafeTimer = null;
  var userTookOver = false;
  var lastProgrammaticY = 0;

  function introTargetScroll() {
    // Scroll past the landing buffer too, so the hero sits at the top
    // of the viewport once the stage has faded out.
    return Math.max(maxScrollRange, intro.offsetHeight);
  }

  function autoplayMaxDurationMs() {
    var startFrame = Math.max(
      0,
      Math.min(TOTAL_FRAMES - 1, Math.floor(window.scrollY / pixelsPerFrame))
    );
    var frameSteps = TOTAL_FRAMES - 1 - startFrame;
    var landingSteps = Math.max(
      0,
      Math.ceil((introTargetScroll() - maxScrollRange) / pixelsPerFrame)
    );

    return (
      AUTOPLAY_DELAY_MS +
      frameSteps * AUTOPLAY_FRAME_MS +
      landingSteps * AUTOPLAY_LANDING_STEP_MS +
      FAILSAFE_BUFFER_MS
    );
  }

  function cancelAutoplay() {
    clearTimeout(autoplayDelayTimer);
    autoplayDelayTimer = null;
    clearTimeout(autoplayTimer);
    autoplayTimer = null;
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
    // Stop autoplay fighting the pointer; failsafe still reveals the hero if
    // the user does not scroll manually.
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

  function startAutoplay() {
    autoplayDelayTimer = null;
    if (userTookOver || complete) return;

    if (window.scrollY >= introTargetScroll()) return;

    var targetY = introTargetScroll();
    var frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(window.scrollY / pixelsPerFrame))
    );

    function step() {
      if (userTookOver) return;

      if (window.scrollY >= targetY) {
        autoplayTimer = null;
        return;
      }

      if (frameIndex < TOTAL_FRAMES - 1) {
        frameIndex += 1;
        lastProgrammaticY = Math.round(
          Math.min(targetY, frameIndex * pixelsPerFrame)
        );
        window.scrollTo(0, lastProgrammaticY);
        autoplayTimer = setTimeout(step, AUTOPLAY_FRAME_MS);
        return;
      }

      // Frame sequence finished — coast through the landing buffer quickly
      // so the hero loads in without a long pause after the GIF.
      var nextY = Math.min(targetY, window.scrollY + pixelsPerFrame);
      lastProgrammaticY = Math.round(nextY);
      window.scrollTo(0, lastProgrammaticY);

      if (nextY >= targetY) {
        autoplayTimer = null;
        return;
      }

      autoplayTimer = setTimeout(step, AUTOPLAY_LANDING_STEP_MS);
    }

    autoplayTimer = setTimeout(step, AUTOPLAY_FRAME_MS);
  }

  function onScroll() {
    render();

    if (userTookOver) return;
    if (window.scrollY === lastProgrammaticY) return;

    if (autoplayDelayTimer || autoplayTimer || failsafeTimer) {
      onUserScroll();
    }
  }

  syncMetrics();
  render();
  window.addEventListener("scroll", onScroll, { passive: true });
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
      lastProgrammaticY = introTargetScroll();
      window.scrollTo(0, lastProgrammaticY);
      render();
    }, autoplayMaxDurationMs());
  }
})();
