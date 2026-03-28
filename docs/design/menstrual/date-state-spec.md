# Date State Spec

## Purpose

This document records the current reusable date-state rules for the menstrual module.

It bridges the gap between:

- cross-module visual language
- menstrual-home interaction structure
- the concrete `DateState / CalendarGrid / CalendarLegend` patterns used in Pencil

## Component Scope

This spec covers:

- base date states
- selected-derived date states
- today-derived date states
- `CalendarLegend`
- `CalendarGrid` state consumption rules

This spec does not define:

- backend period logic
- day-record persistence rules
- token-file board layout

## Base State Rules

- `default` should not add unnecessary background emphasis.
- `future muted` is expressed through muted text, not a dedicated fill block.
- `today` uses a circular outline shape.
- `special` is expressed through a small eye marker, not a large filled area.
- date-number alignment must stay stable whether or not a special marker is present.
- transparent placeholder markers are allowed when needed to keep the date-number baseline aligned.

## Derived State Rules

- `selected` variants use a weak drop shadow.
- `today`-derived variants keep the same circular outline geometry and stroke as base `today`.
- `today`-derived variants must be grouped separately from normal selected-derived variants.
- non-`today` selected variants may use the selected surface language, but should not redefine the shared layout skeleton.

## Color And Marker Rules

- `period` is the only strong state that switches text and attached marker color to a contrast foreground.
- `period` text and markers use `color.accent.period.contrast`.
- non-`period` special markers use `color.accent.period`.
- `special` does not introduce a separate hue family from `period`; it differentiates by marker form.
- the small-eye marker standard is:
  - glyph: `visibility`
  - icon family: `Material Symbols Outlined`
  - weight: `700`

## CalendarLegend Rules

- `CalendarLegend` special markers must use the same eye-marker language as date states.
- legend examples should reflect the current component-library source instead of older page-local experiments.

## CalendarGrid Rules

- `CalendarGrid` must consume the component-library date-state source.
- page-local hand-drawn date cells should not remain the canonical state expression.
- week-divider lines belong to `CalendarGrid` structure, not to the date-state primitive itself.

## Source Of Truth

- active component-library source: [../../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
- menstrual-home interaction contract: [function-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/function-home.md)
- cross-module visual contract: [../2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-23-ui-visual-language-guide.md)
