/**
 * Homepage scroll-scrubbed intro: fixed yellow stage + frame sequence.
 * Maps scroll through `.scroll-intro__runway` to 51 PNGs, then reveals page content.
 */
(function () {
  var TOTAL_FRAMES = 51;
  var FRAMES_PER_SCROLL_UNIT = 4;
  var SCROLL_UNIT_PX = 100;
  var PIXELS_PER_FRAME = SCROLL_UNIT_PX / FRAMES_PER_SCROLL_UNIT;
  var MAX_SCROLL_RANGE = (TOTAL_FRAMES - 1) * PIXELS_PER_FRAME;
  var FADE_RANGE = 2 * SCROLL_UNIT_PX;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var intro = document.getElementById("scroll-intro");
  var runway = intro && intro.querySelector(".scroll-intro__runway");
  var frameEl = document.getElementById("scroll-intro-frame");
  var headlineEl = document.getElementById("scroll-intro-headline");

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

  var currentFrame = -1;
  var active = false;
  var complete = false;

  function syncRunwayHeight() {
    runway.style.setProperty("--scroll-intro-runway", MAX_SCROLL_RANGE + "px");
  }

  function progressWithinIntro() {
    return Math.min(MAX_SCROLL_RANGE, Math.max(0, window.scrollY));
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
    var finished = window.scrollY >= MAX_SCROLL_RANGE;

    setComplete(finished);
    // Hide site chrome while the yellow stage is still covering the viewport.
    setActive(!finished);

    var fadeIn = Math.min(1, Math.max(0, scrolled / FADE_RANGE));
    var fadeOut = Math.min(
      1,
      Math.max(0, (MAX_SCROLL_RANGE - scrolled) / FADE_RANGE)
    );
    headlineEl.style.opacity = String(Math.min(fadeIn, fadeOut));

    var nextFrame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(scrolled / PIXELS_PER_FRAME))
    );

    if (nextFrame === currentFrame) return;
    currentFrame = nextFrame;
    frameEl.src = frames[nextFrame];
  }

  function preload() {
    frames.forEach(function (src, index) {
      if (index === 0) return;
      var img = new Image();
      img.src = src;
    });
  }

  syncRunwayHeight();
  render();
  window.addEventListener("scroll", render, { passive: true });
  window.addEventListener(
    "resize",
    function () {
      syncRunwayHeight();
      render();
    },
    { passive: true }
  );
  requestAnimationFrame(preload);
})();
