# 2026-03-28 CalendarGrid Legend Next Plan

## Summary

This plan continues from commit `32032f7` and moves the menstrual frontend mainline from a baseline `CalendarGrid` showcase into a more realistic month-card acceptance page, then starts `CalendarLegend`.

The immediate goal is to make the runtime validation surface look and behave more like the Pencil month card instead of a debug board, while keeping `DateCell` as the single source of state rendering.

## Locked Decisions

- Use the Pencil draft as source of truth, not the current runtime code, whenever they disagree.
- Validate UI changes with Playwright MCP screenshots before handing them back for human review.
- Use an iPhone 15 Pro class viewport as the default H5 validation baseline.
- Do not use hardcoded positional rescue values or scale hacks to force layout fit.
- `CalendarGrid` owns week structure and dividers only.
- `DateCell` owns date-state appearance only.
- `CalendarLegend` uses design-draft Chinese product copy by default:
  - `本次经期`
  - `经期预测`
  - `特殊标记`

## Implementation Focus

### 1. Reframe `calendar-grid-showcase` as an acceptance page

- Keep a single primary month-card section that is visually close to the Pencil month card.
- Reduce or demote explanatory/debug copy so it does not dominate the page.
- Keep any state-sample section secondary; it must not be the main contract surface.
- Prefer realistic month-card data and month-title framing over component-demo framing.

### 2. Add `CalendarLegend`

- Implement a shared `CalendarLegend` component under `frontend/components/menstrual/`.
- Match Pencil `Primitive/CalendarLegend` (`AAMtX`) for structure, spacing, marker language, and semantic color usage.
- Reuse the same eye-marker contract as `DateCell`.
- Use Chinese product copy by default instead of English technical labels.

### 3. Keep layout token-first and container-driven

- Avoid compact helper modes, width rescue wrappers, or transform scaling.
- Let `CalendarGrid` and the acceptance page derive sizing from container layout and token spacing.
- If runtime fit fails, fix the actual width source rather than adding another page-local scale path.

## Verification

- Run the existing node test suite for menstrual primitives and showcase data after each meaningful UI change.
- Re-run Playwright MCP validation against:
  - `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase`
  - `http://localhost:5173/#/pages/menstrual/date-cell-showcase`
- Use iPhone 15 Pro class viewport for H5 validation.
- Save fresh screenshots under `artifacts/` for runtime comparison when the page meaningfully changes.
- Treat visual agreement with the named Pencil node as the acceptance check, not agreement with earlier runtime output.

## Important References

- [../design/2026-03-28-ui-collaboration-lessons.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-28-ui-collaboration-lessons.md)
- [../design/menstrual/date-state-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/date-state-spec.md)
- [../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
- [../../frontend/components/menstrual/DateCell.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/components/menstrual/DateCell.vue)
- [../../frontend/components/menstrual/CalendarGrid.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/components/menstrual/CalendarGrid.vue)
