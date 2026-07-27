# Homepage Hero Gallery Design

**Date:** 2026-07-27  
**Status:** Approved

## Goal

Split the homepage hero into two columns: existing bio content on the left, a case-study teaser gallery on the right that advances only when the user scrolls (or uses controls) on the gallery itself.

## Decision

Use a **wheel-trap carousel** (Approach A): fixed-height gallery stage, one slide visible, stepped via wheel/arrows/keyboard. Page scroll is suppressed while the pointer is over the gallery except at the first/last slide (pass-through).

## Layout

### Desktop (>768px)

- `.hero-home` widens beyond the current 3-column cap so both columns fit (full content width / 6-col span).
- **Left:** avatar, intro headline, bio (`#bio` preserved for home subnav).
- **Right:** gallery column — white prev/next arrows above a fixed-height stage showing one slide.

### Each slide

1. Placeholder media (alternating white / light grey fills; real images later).
2. Caption row under the image with **two tags** (e.g. `UX`, `CRO`).
3. Entire slide is an `<a>` linking to the matching case study.

### Slides (4)

| # | Link | Example tags | Placeholder |
|---|------|--------------|-------------|
| 1 | `case-study-wcr.html` | UX, CRO | grey |
| 2 | `case-study-gifct.html` | UX, High Stress | white |
| 3 | `case-study-ffs.html` | UX, Accessibility | grey |
| 4 | `case-study-wwct.html` | UX, Research | white |

Tag copy is placeholder-friendly and can be refined later.

### Mobile (≤768px)

- Gallery stacks **below** the bio as a shorter **horizontal snap** strip.
- Arrows remain clickable; no wheel-trap.

## Interaction & motion

1. Wheel/trackpad over gallery → step one slide; `preventDefault` on the wheel event while not at ends.
2. At first slide, upward/backwards wheel passes through to page; at last slide, downward/forwards wheel passes through.
3. Prev/next arrows perform the same step; muted/disabled at ends.
4. Transition: current slide scales to **0.95**, then translates off to the **right**; next enters at full size (~350–450ms ease-out).
5. `prefers-reduced-motion: reduce` (and site movement-paused if applicable): instant swap, no scale/slide.
6. Keyboard when gallery is focused: ArrowUp/Left = prev, ArrowDown/Right = next.

## Accessibility

- Gallery region with `aria-roledescription="carousel"` (or equivalent pattern).
- Polite live region announcing “Slide n of m”.
- Arrow buttons with clear `aria-label`s; `aria-disabled` at ends.
- Links remain keyboard-reachable; focus styles match existing buttons.

## Implementation note

- Homepage-only: markup in `index.html`, styles in `css/styles.css`, script `js/hero-gallery.js`.
- Slide data lives in HTML (no CMS).
- Widen hero for the split; keep left column readable (do not stretch intro line length excessively).

## Out of scope

- Real project photography (placeholders only)
- Autoplay
- Linking from tags alone (whole slide is the link)
- Applying the gallery on case-study pages
