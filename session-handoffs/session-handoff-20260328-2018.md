# Session Handoff

## Current Goal
- Keep polishing the menstrual frontend so `calendar-grid-showcase` matches the current Pencil contracts for `NABud`, `mVNZO`, `AGEIj`, and `AAMtX`.
- This work matters now because the runtime page has already been moved from the old five-week acceptance surface to the full three-week home layout, and the remaining work is now pure visual convergence rather than structural rework.

## Completion Status
- Completed:
  - `calendar-grid-showcase` is now a full `NABud`-style home runtime instead of a partial lower-half demo.
  - The page data helper now includes `topBar`, `heroCard`, `viewModeControl`, `headerNav`, `jumpTabs`, `calendarCard`, `legend`, and `selectedDatePanel`.
  - `CalendarGrid` / `DateCell` were tightened to the current `mVNZO` matrix:
    - `17` default
    - `18-21` period
- `22` period + detail
    - `23-25` current-month prediction
- `26` selected detail non-period
    - `27-30` default
    - `31` today
    - `01-03` future muted
    - `04-06` future prediction
  - `SelectedDatePanel` now follows the `NABud` instance override instead of the earlier generic AGEIj-style summary cards.
  - Global font tokens now prefer `IBM Plex Sans` with the previous Chinese system stack as fallback.
- Partially completed:
  - Visual convergence is close, but one more eye-level comparison pass is still recommended for hero spacing, HeaderNav button mass, and the summary-strip icon look.
- Not completed:
  - No local bundled IBM Plex Sans font asset was added; the font change is currently a preferred font stack, not a guaranteed packaged font on every device.
- Verified:
  - Targeted Node test suite passed:
    - `node --test frontend/components/menstrual/__tests__/calendar-legend-data.test.mjs frontend/components/menstrual/__tests__/calendar-legend-view.test.mjs frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-shell.test.mjs frontend/components/menstrual/__tests__/date-cell-state.test.mjs frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs frontend/components/menstrual/__tests__/marker-assets.test.mjs frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs frontend/__tests__/project-structure.test.mjs`
  - Playwright on `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase` at iPhone 15 Pro class viewport showed:
    - `0 errors / 0 warnings`
    - no horizontal overflow (`scrollWidth === clientWidth`)
  - Fresh runtime screenshot saved:
    - `artifacts/calendar-grid-showcase-nabud-aligned.png`
- Not yet verified:
  - No WeChat Mini Program-specific visual verification has been done yet.
  - No packaged local font asset flow has been verified; only the fallback stack preference changed.

## What Changed
- Page composition:
  - `frontend/pages/menstrual/calendar-grid-showcase.vue` now renders the full `NABud`-style order: top bar, hero card, mode control, nav, tabs, calendar, legend, selected panel.
- Data/model surface:
  - `frontend/components/menstrual/calendar-grid-acceptance-page-data.js` now expresses a homepage-level view model instead of only a calendar-card demo object.
  - `frontend/components/menstrual/selected-date-panel-data.js` now encodes the `homeSelected` instance content using `flow / pain / color` summary items with icon/tone metadata.
- Primitive visual tightening:
  - `frontend/components/menstrual/CalendarGrid.vue` was tightened to the smaller `mVNZO` card spacing and dividers.
  - `frontend/components/menstrual/DateCell.vue` now uses a compact square base size with today-only circle geometry.
  - `frontend/components/menstrual/CalendarLegend.vue` now uses tighter marker sizing and line height.
  - `frontend/components/menstrual/SelectedDatePanel.vue` now renders the compact `uqMCN`-style summary strip and left-aligned CTA.
- Token changes:
  - `frontend/styles/tokens/semantic.scss` changed selected shadow to a tighter Pencil-like lift.
  - `frontend/styles/tokens/primitives.scss` now prefers `IBM Plex Sans` before the previous Chinese system fallbacks.

## Pitfalls And Resolutions
- The page was still structurally stuck in the earlier “lower-half only” runtime.
  - Root cause: prior work had only converted the demo into a three-week card, not the full `NABud` home composition.
  - Resolution: the page data/helper and runtime layout were both expanded to full homepage scope.
  - Status: fixed and verified in H5 runtime.
- The date matrix drifted from the latest manual Pencil edits.
- Root cause: older runtime data still used `selectedPeriod` for `22`, plain `detail` for `26`, and muted future values for `04-06`.
  - Resolution: rewrote the matrix to match the current `homeCalendarGrid` instance exactly.
  - Status: fixed and covered by tests.
- `SelectedDatePanel` was aligned to the base AGEIj card, not the overridden `homeSelected` instance.
  - Root cause: earlier implementation used the generic summary-card version and ignored the `uqMCN` override inside `NABud`.
  - Resolution: reworked the data helper and component to follow the compact strip version.
  - Status: fixed in H5 runtime; only minor visual polish may remain.
- IBM Plex Sans was requested, but the repo had no local font asset.
  - Root cause: no `.ttf/.woff` font files exist under `frontend/`.
  - Resolution: switched token stacks to prefer `IBM Plex Sans` while preserving the previous system fallbacks.
  - Status: implemented as a preference stack only, not a guaranteed packaged font.

## Open Issues
- One more visual comparison pass is still recommended for:
  - heroCard top whitespace and overall compactness
  - HeaderNav chevron button mass
  - `SelectedDatePanel` summary-strip icon appearance versus Pencil
- IBM Plex Sans is not bundled locally, so devices without the font will still fall back to the Chinese system stack.
- WeChat Mini Program runtime has not yet been manually checked after the latest visual changes.

## Next Recommended Actions
- First action:
  - Re-open the latest Pencil screenshots for `NABud`, `mVNZO`, `AGEIj`, `AAMtX`, and compare them side-by-side with `artifacts/calendar-grid-showcase-nabud-aligned.png` before making any more code changes.
- Read first:
  - `frontend/pages/menstrual/calendar-grid-showcase.vue`
  - `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
  - `frontend/components/menstrual/SelectedDatePanel.vue`
  - `frontend/components/menstrual/CalendarGrid.vue`
  - `frontend/components/menstrual/DateCell.vue`
  - `frontend/styles/tokens/primitives.scss`
- Next verification:
  - `node --test frontend/components/menstrual/__tests__/calendar-legend-data.test.mjs frontend/components/menstrual/__tests__/calendar-legend-view.test.mjs frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-shell.test.mjs frontend/components/menstrual/__tests__/date-cell-state.test.mjs frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs frontend/components/menstrual/__tests__/marker-assets.test.mjs frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs frontend/__tests__/project-structure.test.mjs`
  - Playwright: open `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase`, check console/overflow, and capture a new screenshot if more polish changes land.

## Useful References
- `session-handoffs/session-handoff-20260328-2018.md`
- `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- `artifacts/calendar-grid-showcase-nabud-aligned.png`
- `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
- `frontend/components/menstrual/SelectedDatePanel.vue`
- `frontend/styles/tokens/primitives.scss`
