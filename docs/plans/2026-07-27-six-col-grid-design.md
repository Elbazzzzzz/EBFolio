# 6-column grid + left hero design

**Date:** 2026-07-27  
**Approach:** Real CSS Grid shell (Approach 1)

## Decisions

- Desktop: 6 columns, 20px gutter, 20px side margin
- Tablet/mobile: fewer columns, 20px margin/gutter
- Home hero: stacked left (avatar → headline → bio), spans columns 1–3
- Case study: main content left-aligned in columns 1–5; sticky sub-nav/metrics occupy column 6 without overlapping

## Implementation notes

- Update `:root` grid/padding tokens in `css/styles.css`
- Restack hero markup in `index.html`; keep `#bio` for home subnav
- Recalculate `--cs-rail-right` / `--cs-main-max` (drop rightward nav offset)
- Case study fixed pixel widths remain as max content caps inside the main column
