# Tokenize Collaboration Rule

## Purpose

This rule keeps UI visual work on a single supply chain so page drafts do not invent local styles that bypass the design system.

## Scope

- `design token` and foundations work are currently carried by [../design-drafts/2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-design-tokene.pen)
- `component library`, `date states`, and business-page composition work are currently carried by [../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
- canonical source of reusable visual components is the business-page file's component-library area

## Rule

1. UI visual design follows the one-way flow `design token -> component library -> business page`.
2. The active component-library source lives in the business-page file, but it must still consume token decisions from the token file.
3. When a page can reuse an existing token, component, or variant, it must reuse it directly.
4. When a page need cannot be satisfied by the current library, do not draw a page-local special case first.
5. Add missing color, typography, spacing, radius, shadow, or surface capability in the token file first.
6. Add missing component, component variant, or date-state expression in the business-page file's component-library area after the token capability is ready.

## Reuse Heuristics

- Same structure, different content or icon: reuse the existing component.
- Same structure, different size, emphasis, or status: add or use a variant.
- Different structure with a realistic chance of appearing again: create a new library component before page use.
- A one-off idea should still be tested against slots or variants before it is treated as a true exception.

## Working Agreement

- Prefer fixing design-system gaps upstream instead of patching pages locally.
- When a page draft exposes a missing reusable pattern, update the token file first only if the gap is token-level.
- When the gap is component-structure, component-variant, or date-state expression, update the business-page file's component-library area.
- Page review should treat new page-local visual patterns as a design-system issue, not as an acceptable shortcut.

