# Session Handoff

## Current Goal
- Rebuild the menstrual frontend demo around the Pencil three-week home card instead of the older five-week month-calendar acceptance page.
- This work matters now because the current runtime validation surface is no longer aligned with the latest Pencil design; continuing implementation from the old month-card baseline would cause drift in `HeaderNav`, `JumpTabs`, `SegmentedControl`, `CalendarGrid`, `CalendarLegend`, `SelectedDatePanel`, and the shared selected-state cue.

## Completion Status
- Completed:
  - Added `CalendarLegend` and converted its special marker to the shared static SVG assets under `frontend/static/menstrual/`.
  - Converted `DateCell` special markers to the same shared static SVG assets and added `marker-assets.js`.
  - Added the high-value date-state aliases:
    - `todayPrediction`
    - `selectedTodayPrediction`
    - `selectedTodayPeriod`
  - Updated the acceptance-page sample strip so it now demonstrates:
    - `今天 + 预测`
    - `选中 + 今天 + 预测`
    - `今天 + 经期`
    - `选中 + 今天 + 经期`
  - Updated `docs/design/menstrual/date-state-spec.md` with overlay rules and forbidden combinations.
  - Wrote and committed the new implementation plan:
    - `docs/plans/2026-03-28-three-week-home-demo-implementation-plan.md`
- Partially completed:
  - The runtime demo page still renders the older five-week acceptance layout and has not yet been rebuilt into the three-week home-demo composition.
  - The latest Pencil top-of-card nodes were re-read and confirmed as the new source of truth, but the corresponding runtime components (`HeaderNav`, `JumpTabs`, `SegmentedControl`, `SelectedDatePanel`) have not been implemented yet.
  - The user explicitly wants `selected` shadow stronger on all platforms, but that visual change has not been applied yet.
- Not completed:
  - `HeaderNav.vue`
  - `JumpTabs.vue`
  - `SegmentedControl.vue`
  - `SelectedDatePanel.vue`
  - Three-week `CalendarGrid` runtime composition
  - Full demo-page rewrite from “month acceptance page” to “Pencil home demo”
- Verified:
  - Node test suite for the current menstrual component/data surface passed after marker-asset unification:
    - `node --test frontend/components/menstrual/__tests__/calendar-legend-data.test.mjs frontend/components/menstrual/__tests__/calendar-legend-view.test.mjs frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-state.test.mjs frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs frontend/components/menstrual/__tests__/marker-assets.test.mjs frontend/__tests__/project-structure.test.mjs`
  - Playwright MCP on `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase` still shows:
    - `0 errors / 0 warnings`
    - no horizontal overflow at iPhone 15 Pro class viewport
  - Pencil node `aUI1Y` screenshot and node reads confirm the high-value overlay state board is in place.
- Not yet verified:
  - No runtime implementation yet exists for the latest three-week home-demo composition.
  - The stronger all-platform `selected` shadow has not yet been visually checked because it has not been implemented.

## What Changed
- UI contracts and shared rendering:
  - `DateCell` and `CalendarLegend` now share one special-marker asset source instead of separate inline SVG implementations.
  - The special eye marker now resolves from `frontend/components/menstrual/marker-assets.js` and uses:
    - `/static/menstrual/view-period.svg`
    - `/static/menstrual/view-contrast.svg`
- Date-state surface:
  - Added explicit high-value aliases for the overlay cases that most directly map to Pencil and runtime verification:
    - `todayPrediction`
    - `selectedTodayPrediction`
    - `selectedTodayPeriod`
  - Kept the larger date-state system aligned to the “small number of axes + overlay priority” model recorded in the design spec.
- Demo data:
  - The secondary sample strip on `calendar-grid-showcase` was updated to show the approved high-value combinations rather than the older special-heavy examples.
- Design and planning:
  - A new implementation plan was written to shift the mainline away from the five-week month-card acceptance page and toward the Pencil three-week home demo.
  - The plan explicitly names the current Pencil contract nodes:
    - `Yzswn` / `4V3lh`
    - `fydEy` / `u0LTO`
    - `GEh6e`
    - `mVNZO`
    - `Y5mJI` / `AAMtX`
    - `AGEIj`

## Pitfalls And Resolutions
- `predictionSpecial` runtime failure appeared during MCP verification.
  - Root cause: `DateCell` state table did not include that variant although demo/runtime data referenced it.
  - Resolution: added `predictionSpecial` handling and test coverage.
  - Status: fixed and verified.
- Playwright MCP initially failed due to browser/profile issues and then due to the local dev server being down.
  - Root cause: first an MCP browser-profile conflict, later `localhost:5173` was not running.
  - Resolution: retried MCP after recovery and after the H5 server was restarted; subsequent runtime checks succeeded.
  - Status: resolved for the current environment, but the next session should still verify the server and MCP state before changing code.
- The acceptance page direction drifted toward a full five-week month card.
  - Root cause: earlier implementation and validation work assumed the month-card acceptance page remained the active target.
  - Resolution: re-read the latest Pencil nodes and explicitly redefined the target as the three-week home-demo composition.
  - Status: design direction corrected, but runtime implementation still pending.
- Marker language diverged between `DateCell`, `CalendarLegend`, and Pencil.
  - Root cause: separate inline SVG implementations made it easy for the runtime to drift from the latest design assets.
  - Resolution: introduced shared static SVG assets plus a small shared resolver module.
  - Status: fixed and verified in the current runtime.

## Open Issues
- The current runtime page still shows the outdated five-week acceptance layout and must be rebuilt into the three-week home-demo composition before more UI work continues.
- The user manually adjusted `u0LTO` again during this session; the next session must re-read the latest Pencil nodes before implementation rather than trusting earlier screenshots.
- `selected` shadow is still too weak on web and should be strengthened across all platforms during the upcoming implementation pass.
- Working tree remains intentionally dirty:
  - modified: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
  - untracked: `artifacts/`
- Do not revert the `.pen` change; it contains the latest source-of-truth design edits.

## Next Recommended Actions
- First action:
  - Read the new implementation plan and then verify the current Pencil/runtime state before changing code.
- Read first:
  - `docs/plans/2026-03-28-three-week-home-demo-implementation-plan.md`
  - `docs/design/menstrual/date-state-spec.md`
  - `frontend/components/menstrual/date-cell-state.js`
  - `frontend/components/menstrual/date-cell-view-model.js`
  - `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
  - `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- Next verification:
  - Re-read Pencil nodes:
    - `Yzswn`
    - `fydEy`
    - `GEh6e`
    - `mVNZO`
    - `Y5mJI`
    - `AGEIj`
  - Re-open `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase` with Playwright MCP and confirm it still shows the older five-week page before starting Task 1 of the plan.
  - After that, begin with Task 1 in the plan: refactor the demo data shape to the three-week home card.

## Useful References
- `docs/plans/2026-03-28-three-week-home-demo-implementation-plan.md`
- `docs/design/menstrual/date-state-spec.md`
- `docs/design/2026-03-23-ui-visual-language-guide.md`
- `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- `frontend/components/menstrual/marker-assets.js`
- `frontend/components/menstrual/DateCell.vue`
- `frontend/components/menstrual/CalendarLegend.vue`
- `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
