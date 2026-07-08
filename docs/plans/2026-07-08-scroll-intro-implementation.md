# Homepage Scroll Intro Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a scroll-driven “get untangled” frame animation above the homepage that pins while scrubbing, then hands off to existing portfolio content.

**Architecture:** Sticky runway section at the top of `index.html`. CSS handles sticky yellow stage + layout. A small homepage-only script maps scroll progress within the runway to 51 PNG frames and headline opacity. Reduced-motion users skip the intro runway.

**Tech Stack:** Static HTML, CSS, vanilla JS, PNG frame sequence in `assets/intro-frames/`

---

### Task 1: Confirm frame assets exist

**Files:**
- Verify: `assets/intro-frames/frame_000.png` … `frame_050.png`

**Step 1: Count frames**

Run: `ls assets/intro-frames | wc -l`

Expected: `51`

---

### Task 2: Add intro markup to homepage

**Files:**
- Modify: `index.html`

**Step 1: Insert intro before `.page`**

Place this immediately after the skip link and before `<div class="page">`:

```html
<section
  class="scroll-intro"
  id="scroll-intro"
  aria-label="Introduction animation"
  data-total-frames="51"
>
  <div class="scroll-intro__runway">
    <div class="scroll-intro__stage" aria-hidden="true">
      <img
        class="scroll-intro__frame"
        id="scroll-intro-frame"
        src="assets/intro-frames/frame_000.png"
        width="520"
        height="693"
        alt=""
        decoding="async"
      />
      <p class="scroll-intro__headline" id="scroll-intro-headline">get untangled</p>
    </div>
  </div>
</section>
```

**Step 2: Add script tag before closing `</body>`**

```html
<script src="js/scroll-intro.js" defer></script>
```

Leave existing scripts as-is.

---

### Task 3: Add intro CSS

**Files:**
- Modify: `css/styles.css` (append a new section at the end)

**Step 1: Append styles**

```css
/* —— Homepage scroll intro —— */
.scroll-intro {
  --scroll-intro-yellow: #ffce00;
  --scroll-intro-ink: #2d2c2b;
  position: relative;
  z-index: 20;
  background: var(--scroll-intro-yellow);
  color: var(--scroll-intro-ink);
}

.scroll-intro__runway {
  height: calc(100vh + var(--scroll-intro-runway, 1250px));
}

.scroll-intro__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--scroll-intro-yellow);
  pointer-events: none;
}

.scroll-intro__frame {
  width: min(72vmin, 520px);
  aspect-ratio: 3 / 4;
  height: auto;
  object-fit: contain;
  display: block;
}

.scroll-intro__headline {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  font-family: "Kaisei Decol", "Helvetica Neue", Arial, sans-serif;
  font-size: clamp(2rem, 6vw, 4.5rem);
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: lowercase;
  color: var(--scroll-intro-ink);
  opacity: 0;
  user-select: none;
  pointer-events: none;
  white-space: nowrap;
}

html.scroll-intro-reduced .scroll-intro {
  display: none;
}

html.scroll-intro-active {
  /* Keep page content from fighting the yellow stage while pinned */
}

html.scroll-intro-active .site-header,
html.scroll-intro-active .nav-mobile,
html.scroll-intro-active .home-subnav {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

@media (prefers-reduced-motion: reduce) {
  .scroll-intro {
    display: none;
  }
}
```

Bump the stylesheet cache buster in `index.html` from `?v=3` to `?v=4`.

---

### Task 4: Implement scroll-intro.js

**Files:**
- Create: `js/scroll-intro.js`

**Step 1: Write script**

```js
/**
 * Homepage scroll-scrubbed intro: yellow sticky stage + frame sequence.
 * Maps scroll through `.scroll-intro__runway` to 51 PNGs, then hands off to page content.
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

  function syncRunwayHeight() {
    runway.style.setProperty("--scroll-intro-runway", MAX_SCROLL_RANGE + "px");
  }

  function progressWithinIntro() {
    var rect = intro.getBoundingClientRect();
    // Distance scrolled through intro: 0 at start, MAX when stage finishes pinning
    var scrolled = -rect.top;
    return Math.min(MAX_SCROLL_RANGE, Math.max(0, scrolled));
  }

  function isIntroActive(scrolled) {
    // Active while sticky stage still covers the viewport
    var rect = intro.getBoundingClientRect();
    return rect.bottom > window.innerHeight * 0.5 && scrolled < MAX_SCROLL_RANGE + window.innerHeight * 0.25;
  }

  function setActive(next) {
    if (next === active) return;
    active = next;
    root.classList.toggle("scroll-intro-active", active);
  }

  function render() {
    var scrolled = progressWithinIntro();
    setActive(scrolled < MAX_SCROLL_RANGE || intro.getBoundingClientRect().top > -MAX_SCROLL_RANGE);

    // Tighter active rule: hide chrome while sticky stage occupies most of viewport
    var stageVisible = intro.getBoundingClientRect().top <= 0 &&
      intro.getBoundingClientRect().bottom >= window.innerHeight * 0.85;
    setActive(stageVisible);

    var fadeIn = Math.min(1, Math.max(0, scrolled / FADE_RANGE));
    var fadeOut = Math.min(1, Math.max(0, (MAX_SCROLL_RANGE - scrolled) / FADE_RANGE));
    headlineEl.style.opacity = String(Math.min(fadeIn, fadeOut));

    var nextFrame = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(scrolled / PIXELS_PER_FRAME))
    );

    if (nextFrame === currentFrame) return;
    currentFrame = nextFrame;
    frameEl.src = frames[nextFrame];
  }

  // Preload remaining frames in background (start after first paint)
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
  window.addEventListener("resize", function () {
    syncRunwayHeight();
    render();
  }, { passive: true });
  requestAnimationFrame(preload);
})();
```

Simplify `setActive` logic during implementation if the dual rules feel redundant — keep a single clear rule: chrome hidden while `intro.getBoundingClientRect().bottom > window.innerHeight` AND `intro.getBoundingClientRect().top < 1`.

---

### Task 5: Manual verification

**Step 1: Open homepage locally**

Open `index.html` in a browser (or local static server).

**Step 2: Check**

- Yellow fullscreen stage on load with frame_000
- Scrolling advances frames; “get untangled” fades in then out
- After runway, existing homepage hero/header appear
- Scroll back up re-enters intro
- Skip link still jumps to main content
- With reduced motion (browser setting), intro is hidden and normal page shows

---

### Task 6: Commit (only if user asks)

Do not commit unless explicitly requested.
