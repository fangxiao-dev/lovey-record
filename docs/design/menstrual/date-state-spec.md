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

## State Axes

The long-term date-state model should be understood as a small number of composable axes rather than an open-ended list of named combinations.

- business state:
  - `none`
  - `prediction`
  - `period`
- time emphasis:
  - `today`
- interaction emphasis:
  - `selected`
- marker emphasis:
  - `special`
- time-position modifier:
  - `future muted`

These axes should be the design source of truth even when implementation still exposes a small set of alias variants for convenience.

## Forbidden Combinations

- `date > today` is currently read-only.
- future dates may use `prediction`, but should not use user-edited `period`.
- future dates should not use `special`.
- `prediction + special` should not be treated as a long-lived reusable product combination.
- when a future date has no stronger business state, it falls back to `future muted`.

## Overlay Priority Rules

### Business Surface

- business-state priority is `period > prediction > none`.
- `period` keeps the strongest accent surface.
- `prediction` keeps its lighter forecast surface.
- `future muted` must not override an active `prediction` or `period` business surface.

### Geometry

- `today` owns outline geometry.
- any state containing `today` keeps the circular outline shape.
- `selected` must not turn a `today` outline back into a rounded rectangle.

### Interaction Emphasis

- `selected` is a transient interaction cue, not a durable business state.
- `selected` should add its own shadow/lift cue when the user is actively choosing a date.
- `selected` must not erase `today`, `prediction`, or `period` meaning.

### Marker Emphasis

- `special` uses the shared eye marker only.
- `special` does not take over the surface from `prediction` or `period`.
- on `period`, marker and text stay on the contrast foreground.
- on non-`period` states, the `special` marker stays in `accent.period`.

### Future Muting

- `future muted` is a time-position modifier, not a peer business fact.
- use muted text for future dates only when there is no stronger business state.
- future prediction dates should remain recognizable as `prediction`, not collapse to a gray-only state.

## High-Value Overlay Cases

The following overlay cases deserve explicit Pencil and runtime review because they carry the highest risk of visual drift:

- `today + prediction`
- `selected + today + prediction`
- `today + period`
- `selected + today + period`
- `today + special`
- `selected + today + special`

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
