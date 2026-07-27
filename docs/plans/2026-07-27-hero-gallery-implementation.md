# Homepage Hero Gallery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the homepage hero into bio (left) + case-study teaser gallery (right) with wheel-trap stepping, clickable arrows, scale-then-exit-right motion, and a mobile horizontal snap strip.

**Architecture:** Markup-driven slides in `index.html`. CSS handles two-column hero, stage clipping, placeholder fills, tags, and transition classes. A small homepage-only script owns index state, wheel pass-through at ends, arrows/keyboard, and reduced-motion instant swaps.

**Tech Stack:** Static HTML, CSS, vanilla JS (no new dependencies). Design: `docs/plans/2026-07-27-hero-gallery-design.md`

---

### Task 1: Restructure hero markup + gallery HTML

**Files:**
- Modify: `index.html` (hero section ~122–155; stylesheet cache bump; script tag before `</body>`)

**Step 1: Replace the hero section body**

Keep the outer `<section class="hero-home">`. Change the inner structure so left content and gallery sit as siblings:

```html
<section class="hero-home" aria-label="Introduction">
  <div class="hero-home__layout" data-mobile-nav-sentinel>
    <div class="hero-home__main">
      <div class="hero-home__stack">
        <div class="hero-home__text-panel">
          <!-- existing avatar + intro unchanged -->
        </div>
        <div id="bio" class="bio hero-home__bio" aria-labelledby="bio-heading">
          <!-- existing bio unchanged -->
        </div>
      </div>
    </div>

    <div
      class="hero-gallery"
      id="hero-gallery"
      aria-roledescription="carousel"
      aria-label="Featured case studies"
    >
      <div class="hero-gallery__controls">
        <button
          type="button"
          class="hero-gallery__arrow hero-gallery__arrow--prev"
          aria-label="Previous case study"
          aria-controls="hero-gallery-stage"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M10 4L16 14H4L10 4Z" fill="#FFFFFF" />
          </svg>
        </button>
        <button
          type="button"
          class="hero-gallery__arrow hero-gallery__arrow--next"
          aria-label="Next case study"
          aria-controls="hero-gallery-stage"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M10 16L4 6H16L10 16Z" fill="#FFFFFF" />
          </svg>
        </button>
      </div>

      <div class="hero-gallery__stage" id="hero-gallery-stage" tabindex="0">
        <a
          class="hero-gallery__slide is-active"
          href="case-study-wcr.html"
          data-index="0"
          aria-label="Worldwide Cancer Research case study"
        >
          <div class="hero-gallery__media hero-gallery__media--grey" aria-hidden="true"></div>
          <div class="hero-gallery__tags">
            <span class="hero-gallery__tag">UX</span>
            <span class="hero-gallery__tag">CRO</span>
          </div>
        </a>
        <a
          class="hero-gallery__slide"
          href="case-study-gifct.html"
          data-index="1"
          aria-label="GIFCT case study"
          hidden
        >
          <div class="hero-gallery__media hero-gallery__media--white" aria-hidden="true"></div>
          <div class="hero-gallery__tags">
            <span class="hero-gallery__tag">UX</span>
            <span class="hero-gallery__tag">High Stress</span>
          </div>
        </a>
        <a
          class="hero-gallery__slide"
          href="case-study-ffs.html"
          data-index="2"
          aria-label="Fight for Sight case study"
          hidden
        >
          <div class="hero-gallery__media hero-gallery__media--grey" aria-hidden="true"></div>
          <div class="hero-gallery__tags">
            <span class="hero-gallery__tag">UX</span>
            <span class="hero-gallery__tag">Accessibility</span>
          </div>
        </a>
        <a
          class="hero-gallery__slide"
          href="case-study-wwct.html"
          data-index="3"
          aria-label="Walk Wheel Cycle Trust case study"
          hidden
        >
          <div class="hero-gallery__media hero-gallery__media--white" aria-hidden="true"></div>
          <div class="hero-gallery__tags">
            <span class="hero-gallery__tag">UX</span>
            <span class="hero-gallery__tag">Research</span>
          </div>
        </a>
      </div>

      <p class="visually-hidden" id="hero-gallery-status" aria-live="polite" aria-atomic="true"></p>
    </div>
  </div>
</section>
```

Notes:
- Move `data-mobile-nav-sentinel` to `.hero-home__layout` (or keep on a left-side element that still marks CTAs/hero end — prefer layout wrapper so sentinel still covers hero).
- Preserve all existing avatar `srcset` / bio copy exactly.

**Step 2: Bump CSS cache + add script**

In `<head>`, bump `styles.css?v=60` → `styles.css?v=61` (or current+1).

Before `</body>`:

```html
<script src="js/hero-gallery.js?v=1" defer></script>
```

**Step 3: Visual check**

Open `http://localhost:8080/index.html` — markup should render (unstyled gallery OK until Task 2).

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat(home): add hero gallery markup and case-study links"
```

---

### Task 2: Desktop + mobile gallery CSS

**Files:**
- Modify: `css/styles.css` (hero section ~844–949 and mobile hero block ~2541+)

**Step 1: Widen hero and add split layout**

Replace / extend `.hero-home` rules so the hero can span the full padded content width (not only `--grid-span-3`):

```css
.hero-home {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%; /* was var(--grid-span-3) — gallery needs full width */
  min-height: auto;
  padding-top: calc(var(--main-pad-for-nav-floating) + clamp(8px, 1.5vh, 20px));
  padding-bottom: 0;
  margin-bottom: 0;
  box-sizing: border-box;
}

.hero-home__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--grid-gutter);
  align-items: start;
  width: 100%;
  margin-bottom: clamp(24px, 3.5vh, 40px);
}

.hero-home__main {
  min-width: 0;
  max-width: var(--grid-span-3); /* keep bio line length readable */
}

.hero-home__stack {
  /* keep existing column stack styles; drop full-width margin if layout owns spacing */
  width: 100%;
  margin-bottom: 0;
}
```

**Step 2: Gallery component styles**

Append after the bio block (before home-subnav):

```css
/* --- Hero gallery --- */

.hero-gallery {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: stretch;
}

.hero-gallery__controls {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.hero-gallery__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-rect);
  background: transparent;
  cursor: pointer;
  color: #ffffff;
}

.hero-gallery__arrow:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 2px;
}

.hero-gallery__arrow[aria-disabled="true"] {
  opacity: 0.35;
  cursor: not-allowed;
}

.hero-gallery__stage {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  max-height: min(62vh, 560px);
  overflow: hidden;
  outline: none;
}

.hero-gallery__stage:focus-visible {
  outline: 2px solid #ffffff;
  outline-offset: 3px;
}

.hero-gallery__slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  transform: translate3d(0, 0, 0) scale(1);
  opacity: 0;
  pointer-events: none;
  transition:
    transform 400ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-gallery__slide.is-active {
  opacity: 1;
  pointer-events: auto;
  z-index: 2;
}

.hero-gallery__slide.is-exit {
  opacity: 0;
  transform: translate3d(18%, 0, 0) scale(0.95);
  z-index: 3;
  pointer-events: none;
}

.hero-gallery__slide.is-enter {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  z-index: 2;
}

.hero-gallery__media {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  border-radius: var(--radius-rect);
}

.hero-gallery__media--grey {
  background: #c8cdd1;
}

.hero-gallery__media--white {
  background: #ffffff;
}

.hero-gallery__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 12px;
  flex: none;
}

.hero-gallery__tag {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: 1.2;
  color: #f2f2f2;
}

@media (prefers-reduced-motion: reduce) {
  .hero-gallery__slide {
    transition: none;
  }
}

html[data-movement-paused="true"] .hero-gallery__slide {
  transition: none;
}
```

**Step 3: Mobile ≤768px — horizontal snap under bio**

Inside the existing `@media (max-width: 768px)` hero block, add:

```css
.hero-home__layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-home__main {
  max-width: 100%;
}

.hero-gallery__stage {
  display: flex;
  flex-direction: row;
  gap: 12px;
  aspect-ratio: auto;
  max-height: none;
  height: auto;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 0;
  -webkit-overflow-scrolling: touch;
}

.hero-gallery__slide {
  position: relative;
  inset: auto;
  flex: 0 0 78%;
  max-width: 280px;
  opacity: 1;
  pointer-events: auto;
  transform: none;
  scroll-snap-align: start;
}

.hero-gallery__slide[hidden] {
  display: flex !important; /* show all slides in the strip */
  /* Prefer: JS removes [hidden] on mobile — see Task 3 */
}

.hero-gallery__media {
  aspect-ratio: 4 / 5;
  flex: none;
  height: auto;
  min-height: 220px;
}
```

Prefer having JS remove `hidden` below the mobile breakpoint and rely on CSS for the strip (cleaner than `!important`). Document that in Task 3.

**Step 4: Commit**

```bash
git add css/styles.css index.html
git commit -m "style(home): split hero and style case-study gallery"
```

---

### Task 3: Gallery JS (wheel trap, arrows, motion)

**Files:**
- Create: `js/hero-gallery.js`

**Step 1: Implement script**

```js
(function () {
  const root = document.getElementById("hero-gallery");
  if (!root) return;

  const stage = root.querySelector(".hero-gallery__stage");
  const slides = Array.from(root.querySelectorAll(".hero-gallery__slide"));
  const prevBtn = root.querySelector(".hero-gallery__arrow--prev");
  const nextBtn = root.querySelector(".hero-gallery__arrow--next");
  const status = document.getElementById("hero-gallery-status");
  if (!stage || slides.length === 0) return;

  const REDUCE =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.movementPaused === "true";
  const MOBILE_MQ = window.matchMedia("(max-width: 768px)");

  let index = Math.max(
    0,
    slides.findIndex((s) => s.classList.contains("is-active"))
  );
  let animating = false;

  function isMobile() {
    return MOBILE_MQ.matches;
  }

  function updateChrome() {
    const atStart = index <= 0;
    const atEnd = index >= slides.length - 1;
    prevBtn.setAttribute("aria-disabled", atStart ? "true" : "false");
    nextBtn.setAttribute("aria-disabled", atEnd ? "true" : "false");
    if (status) {
      status.textContent = "Slide " + (index + 1) + " of " + slides.length;
    }
  }

  function showInstant(next) {
    slides.forEach((slide, i) => {
      const on = i === next;
      slide.classList.toggle("is-active", on);
      slide.classList.remove("is-exit", "is-enter");
      if (isMobile()) {
        slide.hidden = false;
      } else {
        slide.hidden = !on;
      }
    });
    index = next;
    updateChrome();
    if (isMobile()) {
      slides[next].scrollIntoView({ inline: "start", block: "nearest", behavior: REDUCE ? "auto" : "smooth" });
    }
  }

  function goTo(next) {
    if (next < 0 || next >= slides.length || next === index || animating) return;

    if (isMobile() || REDUCE) {
      showInstant(next);
      return;
    }

    animating = true;
    const current = slides[index];
    const incoming = slides[next];

    incoming.hidden = false;
    incoming.classList.add("is-enter");
    // force reflow so enter transition runs from a resting state
    void incoming.offsetWidth;
    current.classList.add("is-exit");
    current.classList.remove("is-active");
    incoming.classList.add("is-active");

    window.setTimeout(function () {
      current.classList.remove("is-exit");
      current.hidden = true;
      incoming.classList.remove("is-enter");
      index = next;
      animating = false;
      updateChrome();
    }, 420);
  }

  function step(delta) {
    goTo(index + delta);
  }

  prevBtn.addEventListener("click", function () {
    if (prevBtn.getAttribute("aria-disabled") === "true") return;
    step(-1);
  });

  nextBtn.addEventListener("click", function () {
    if (nextBtn.getAttribute("aria-disabled") === "true") return;
    step(1);
  });

  stage.addEventListener(
    "wheel",
    function (event) {
      if (isMobile()) return;
      const dy = event.deltaY;
      if (Math.abs(dy) < 4) return;

      const goingNext = dy > 0;
      const atStart = index <= 0;
      const atEnd = index >= slides.length - 1;

      if ((goingNext && atEnd) || (!goingNext && atStart)) {
        return; // pass through to page
      }

      event.preventDefault();
      if (animating) return;
      step(goingNext ? 1 : -1);
    },
    { passive: false }
  );

  stage.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  });

  function syncMode() {
    if (isMobile()) {
      slides.forEach((s) => {
        s.hidden = false;
        s.classList.remove("is-exit", "is-enter");
      });
      slides[index].classList.add("is-active");
    } else {
      showInstant(index);
    }
    updateChrome();
  }

  MOBILE_MQ.addEventListener("change", syncMode);
  syncMode();
})();
```

**Step 2: Manual verification**

On desktop at `http://localhost:8080/index.html`:

1. Hover gallery and scroll — slides advance; page does not scroll until first/last.
2. Arrows step; disabled styling at ends.
3. Active slide scales slightly then exits right.
4. Click slide → opens case study.
5. Resize to mobile → horizontal strip under bio; all slides visible; arrows scroll strip.

**Step 3: Commit**

```bash
git add js/hero-gallery.js index.html
git commit -m "feat(home): wire hero gallery wheel trap and transitions"
```

---

### Task 4: Polish edges + a11y pass

**Files:**
- Modify: `css/styles.css` / `js/hero-gallery.js` / `css/theme-mono-dark.css` only if contrast needs a tweak

**Step 1: Checklist**

- [ ] Skip link / home subnav still find `#bio`
- [ ] Mobile nav sentinel still works (`data-mobile-nav-sentinel` on layout)
- [ ] Focus rings visible on dark theme
- [ ] Live region updates on step
- [ ] No horizontal page overflow from exit animation (`overflow: hidden` on stage)
- [ ] Reduced motion: instant swap

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add css/styles.css js/hero-gallery.js index.html
git commit -m "fix(home): polish hero gallery a11y and mobile strip"
```

---

### Task 5: Verification before done

**Step 1: Open homepage**

`http://localhost:8080/index.html` (or `:5500`)

**Step 2: Confirm against design**

Matches `docs/plans/2026-07-27-hero-gallery-design.md`: split layout, wheel-only-on-gallery, scale 5% + exit right, white arrows, two tags, case-study links, mobile strip under bio.
