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
- `future muted` is expressed through muted text and may coexist with a business fill.
- `today` uses a circular outline shape.
- `detail recorded` is expressed through a small eye marker, not a large filled area.
- date-number alignment must stay stable whether or not the eye marker is present.
- transparent placeholder markers are allowed when needed to keep the date-number baseline aligned.

## DateCell Internal Layout Rules

- DateCell layout should be locked by internal composition, not by ad hoc per-board nudging.
- When a DateCell is resized, prefer reusing the existing `DateState` template and scaling its internal layout proportionally.
- Do not rebuild the number-marker stack manually if the existing `DateState` template can be reused.
- `aUI1Y` in the active component-library board is the DateCell source of truth for occupied box, geometry, and internal rhythm.
- The current compact DateCell baseline is a `45x45` occupied box.
- The `45x45` baseline is a Pencil-canvas reference for visual proportion only, not a frontend runtime contract.
- Non-`today` DateCells use a square box on that `45x45` baseline.
- `today` and `today`-derived DateCells keep a perfect circular outline, but still occupy the same `45x45` outer box as neighboring DateCells.
- Frontend implementations must not hardcode `45x45` from the design board; they should preserve the same semantic geometry and content rhythm through layout tokens, responsive constraints, and state-driven styling.
- Date numerals should stay visually top-weighted rather than vertically centered.
- Treat the numeral as sitting around the upper `2/5` of the DateCell, with the marker living in the lower half.
- The numeral-marker stack should be aligned by container rhythm first:
  - tighten parent `padding-top`
  - tighten parent `gap`
  - only use transparent placeholder content to preserve baseline stability
- Do not push marker glyphs to the frame bottom edge.
- The marker should sit clearly above the lower border, remaining visually subordinate to the numeral.
- If a state has no visible marker, keep the invisible placeholder marker so the numeral baseline matches marker-bearing states.
- The same internal layout rhythm should apply across:
  - `default`
  - `detail`
  - `prediction`
  - `period`
  - `future muted`
- `today` may keep its circular geometry, but its numeral and placeholder/marker rhythm should still align with the shared DateCell baseline.
- Page instances and `CalendarGrid` consumers must inherit this `45x45` geometry baseline instead of keeping wider board-local proportions.

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
  - `detail recorded`
- time-position modifier:
  - `future muted`

These axes should be the design source of truth even when implementation still exposes a small set of alias variants for convenience.

## Forbidden Combinations

- `date > today` is currently read-only.
- future dates may use `prediction`.
- future dates may use system-derived `period` when auto-fill extends a confirmed segment beyond `today`.
- future dates must remain read-only even when a system-derived `period` fill is visible.
- future dates should not use the detail-recorded eye marker.
- `prediction + detail recorded` should not be treated as a long-lived reusable product combination.
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

- `detail recorded` uses the shared eye marker only.
- `detail recorded` does not take over the surface from `prediction` or `period`.
- on `period`, marker and text stay on the contrast foreground.
- on non-`period` states, the eye marker stays in `accent.period`.

### Future Muting

- `future muted` is a time-position modifier, not a peer business fact.
- on the current menstrual home calendar, plain future dates keep muted number/text styling until a stronger business fill is present.
- a future auto-filled period date uses the same `period` foreground/background pairing as a normal period cell so the state remains readable on the accent fill.
- visible prediction styling in the calendar follows the same predicted period range as hero `下次`.
- that visible range is derived from `predictedStartDate + defaultPeriodDurationDays - 1`; `prediction_start` remains only the first day of the visible forecast span and the shortcut target.
- if a future predicted-range date is brought into an explicitly selected/focused state by a higher-level interaction contract, that interaction may layer selected emphasis on top of the forecast meaning.

## High-Value Overlay Cases

The following overlay cases deserve explicit Pencil and runtime review because they carry the highest risk of visual drift:

- `today + prediction`
- `selected + today + prediction`
- `today + period`
- `selected + today + period`
- `today + detail`
- `selected + today + detail`

## Color And Marker Rules

- `period` is the only strong state that switches text and attached marker color to a contrast foreground.
- `period` text and markers use `color.accent.period.contrast`.
- non-`period` detail markers use `color.accent.period`.
- `detail recorded` does not introduce a separate hue family from `period`; it differentiates by marker form.
- the small-eye marker standard is:
  - glyph: `visibility`
  - icon family: `Material Symbols Outlined`
  - weight: `700`

## CalendarLegend Rules

- `CalendarLegend` detail markers must use the same eye-marker language as date states.
- legend examples should reflect the current component-library source instead of older page-local experiments.

## CalendarGrid Rules

- `CalendarGrid` must consume the component-library date-state source.
- page-local hand-drawn date cells should not remain the canonical state expression.
- week-divider lines belong to `CalendarGrid` structure, not to the date-state primitive itself.

## Source Of Truth

- active component-library source: [../../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
- menstrual-home interaction contract: [function-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/function-home.md)
- cross-module visual contract: [../2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-23-ui-visual-language-guide.md)
