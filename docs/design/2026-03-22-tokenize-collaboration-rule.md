# Tokenize Collaboration Rule

## Purpose

This rule keeps UI visual work on a single supply chain so page drafts do not invent local styles that bypass the design system.

## Scope

- `design token` and `component library` work both belong to the tokenize layer and are currently carried by [../design-drafts/2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-design-tokene.pen)
- business-page composition work is currently carried by [../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
- canonical source of reusable visual components is the tokenize file, even if a business-page file temporarily keeps a minimal local dependency copy for `.pen`-internal `ref` relationships

## Rule

1. UI visual design follows the one-way flow `design token -> component library -> business page`.
2. Business-page files are for composition and layout, not for defining new visual standards.
3. When a page can reuse an existing token, component, or variant, it must reuse it directly.
4. When a page need cannot be satisfied by the current library, do not draw a page-local special case first.
5. Add the missing component or variant to the tokenize file first, then use it in the business page.
6. If the new component requires new color, typography, spacing, radius, shadow, or state semantics, add that capability in the token layer before finalizing the component.

## Reuse Heuristics

- Same structure, different content or icon: reuse the existing component.
- Same structure, different size, emphasis, or status: add or use a variant.
- Different structure with a realistic chance of appearing again: create a new library component before page use.
- A one-off idea should still be tested against slots or variants before it is treated as a true exception.

## Working Agreement

- Prefer fixing design-system gaps upstream instead of patching pages locally.
- When a page draft exposes a missing reusable pattern, the tokenize file is updated first.
- When a page file must keep local component definitions for `.pen` references to remain valid, keep only the minimum subset actually used by that page and treat it as a synced copy rather than the source of truth.
- Page review should treat new page-local visual patterns as a design-system issue, not as an acceptable shortcut.
