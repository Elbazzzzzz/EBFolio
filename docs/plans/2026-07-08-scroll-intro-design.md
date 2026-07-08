# Homepage Scroll Intro Design

**Date:** 2026-07-08  
**Status:** Approved

## Goal

On homepage load, visitors scrub through the Headspace-style “get untangled” frame animation by scrolling, then continue into the existing portfolio content.

## Decision

Use a **sticky intro runway** above the current page (`Approach A`).

## Behavior

1. Intro section sits above the existing header/main on `index.html` only.
2. Yellow `#ffce00` **fixed** stage covers the viewport while the visitor scrolls a runway sized for 51 frames (~25px per frame, matching the source demo).
3. Frame images and the “get untangled” headline fade/scrub as in the source file.
4. After the last frame, the stage fades out and the usual homepage (header, hero, etc.) is revealed.
5. Scrolling back up restores the intro stage and re-scrubs frames.
6. `prefers-reduced-motion: reduce` skips the runway and lands on normal content.
7. Skip link continues to `#main-content`.

## Implementation note

Shipped as a fixed overlay (matching the source Headspace demo) rather than sticky pinning, so the yellow stage reliably sits above the fixed site header.

## Out of scope

- Showing once per session/visit (always available on scroll)
- Changing the homepage hero copy
- Applying the intro on case-study pages
