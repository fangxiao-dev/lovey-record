# Session Handoff

## Current Goal
- Continue the `Pencil -> uni-app` frontend mainline for the menstrual MVP.
- The immediate target is to turn `calendar-grid-showcase` from a debug-style board into a realistic month-card acceptance page, then add `CalendarLegend`.
- This matters now because the hardest part of the recent work was not raw component coding but aligning on the right validation method and source-of-truth rules; those agreements now need to be preserved so the next session does not regress into the same mistakes.

## Completion Status
- Completed:
  - `DateCell` is implemented as the current date-state primitive.
  - `CalendarGrid` baseline, showcase page, tests, and page registration were added and committed in `32032f7`.
  - `DateCell` no longer uses the previous image-marker route in the committed implementation; it now uses a shared glyph-style marker contract.
  - `calendar-grid-showcase` and `date-cell-showcase` were both runtime-validated in H5 with Playwright MCP.
  - iPhone 15 Pro class viewport validation was established as the right H5 baseline after narrower default shells proved misleading.
  - A next-step plan was prepared and has now been saved to disk.
- Partially completed:
  - `calendar-grid-showcase` still reads like a showcase page more than a final acceptance card. It is closer than before, but it still needs to be visually reframed around the month card.
  - `CalendarLegend` design source was identified in Pencil and its copy/style direction is locked, but the component itself has not been implemented yet.
- Not completed:
  - `CalendarLegend` does not exist in `frontend/components/menstrual/` yet.
  - The month-card acceptance page has not yet been refactored to use `CalendarLegend`.
  - WeChat Mini Program runtime has not been verified in this line of work.
- Verified:
  - Fresh node tests passed after the latest `DateCell` / `CalendarGrid` contract changes:
    - `node --test frontend/components/menstrual/__tests__/date-cell-state.test.mjs frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs frontend/__tests__/project-structure.test.mjs`
  - Fresh Playwright MCP H5 checks were run against:
    - `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase`
    - `http://localhost:5173/#/pages/menstrual/date-cell-showcase`
  - For the iPhone 15 Pro class viewport, the final measured H5 page state was:
    - `calendar-grid-showcase`: `scrollWidth === clientWidth`
    - `date-cell-showcase`: `scrollWidth === clientWidth`
- Not yet verified:
  - No WeChat Mini Program runtime verification.
  - No post-commit implementation for `CalendarLegend`, because it has not started yet.

## What Changed
- A baseline `CalendarGrid` component and `calendar-grid-showcase` page were added and committed in `32032f7`.
- The debugging process uncovered that the initial compact-mode approach was wrong:
  - wrapper-based scaling
  - hardcoded rescue widths/heights
  - image-based marker assets
  - validation inside an overly narrow runtime shell
- The implementation was then corrected toward a better direction:
  - `DateCell` moved back toward a container-driven layout
  - marker rendering was aligned to a shared glyph-style contract instead of the wrong image asset route
  - `CalendarGrid` stopped depending on compact helper modes and transform scaling
  - H5 validation was re-run with an iPhone 15 Pro class viewport instead of the too-narrow default shell
- The design source of truth was explicitly traced in Pencil:
  - `aUI1Y` is the key `DateState` contract board
  - `AAMtX` is `Primitive/CalendarLegend`
  - the month-card `CalendarGrid` in Pencil is a better acceptance target than the current debug-like showcase
- A new plan was written to disk:
  - [../docs/plans/2026-03-28-calendar-grid-legend-next-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-calendar-grid-legend-next-plan.md)

## Pitfalls And Resolutions
- Problem: marker and layout kept drifting away from the Pencil design even when individual tweaks “looked better”.
  - Root cause: the runtime code, screenshots, and ad hoc fixes were being treated as the source of truth instead of the named Pencil nodes.
  - Resolution: explicitly lock the named Pencil node as canonical and compare runtime output against it.
  - Status: resolved as a workflow rule, but still depends on the next session continuing to follow it.
- Problem: earlier validation used a too-narrow runtime shell, which made the layout seem broken in ways that did not match the target device.
  - Root cause: Playwright was originally validating whatever default H5 shell width was available, not a deliberate mobile target viewport.
  - Resolution: switch to an iPhone 15 Pro class viewport for H5 validation.
  - Status: resolved.
- Problem: hardcoded compact helpers and transform scaling temporarily “fixed” fit but distorted the real contract.
  - Root cause: trying to rescue overflow symptoms instead of fixing the actual container-width relationship.
  - Resolution: remove compact helper mode and layout scaling from the committed path; move back to container-driven sizing.
  - Status: resolved in the current committed line.
- Problem: the eye marker kept looking wrong even when the color was correct.
  - Root cause: the marker source itself was wrong; image assets and ad hoc shapes did not match the Pencil marker language.
  - Resolution: stop treating the image route as canonical, move back toward a shared glyph contract, and use the Pencil/`Material Symbols Outlined visibility` standard as the baseline.
  - Status: partially resolved; the current committed result is better, but `CalendarLegend` still needs to be built on the same contract and the final visual can still be refined.
- Problem: debug captions and showcase text kept dominating what should have been a month-card acceptance surface.
  - Root cause: the showcase was doing too many jobs at once: component demo, state board, runtime acceptance page.
  - Resolution: agree that the next step is to reframe it as a realistic month-card acceptance page and demote debug material to secondary space.
  - Status: not implemented yet; plan is written.

## Open Issues
- `CalendarLegend` still needs to be implemented from Pencil `AAMtX`.
- `calendar-grid-showcase` still needs to be reworked so the primary card feels like the real month card instead of a debug showcase with explanation text.
- The current working tree still contains unrelated or not-yet-committed state:
  - [../docs/design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design-drafts/2026-03-22-module-space-and-period-home.pen) is modified
  - [../frontend/static/menstrual](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/static/menstrual) is untracked
  - [../artifacts](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/artifacts) is untracked
  - an older handoff file delete and a newer handoff file add are also present in git status
- The next session must confirm which of those working-tree changes are intentional before making more code changes.

## Next Recommended Actions
- First action:
  - Read the new plan and the latest handoff, then verify the current runtime state before changing code.
- Then implement in this order:
  - reshape `calendar-grid-showcase` into a realistic month-card acceptance page
  - add `CalendarLegend`
  - integrate `CalendarLegend` into the acceptance page
- Read first:
  - [../docs/plans/2026-03-28-calendar-grid-legend-next-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-calendar-grid-legend-next-plan.md)
  - [../docs/design/2026-03-28-ui-collaboration-lessons.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-28-ui-collaboration-lessons.md)
  - [../docs/design/menstrual/date-state-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/date-state-spec.md)
  - [../frontend/components/menstrual/DateCell.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/components/menstrual/DateCell.vue)
  - [../frontend/components/menstrual/CalendarGrid.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/components/menstrual/CalendarGrid.vue)
  - [../frontend/pages/menstrual/calendar-grid-showcase.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/pages/menstrual/calendar-grid-showcase.vue)
- Most relevant verification next:
  - Playwright MCP screenshot validation with iPhone 15 Pro class viewport
  - fresh H5 page checks for:
    - `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase`
    - `http://localhost:5173/#/pages/menstrual/date-cell-showcase`

## Useful References
- [../docs/plans/2026-03-28-calendar-grid-legend-next-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-calendar-grid-legend-next-plan.md)
- [../docs/design/2026-03-28-ui-collaboration-lessons.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-28-ui-collaboration-lessons.md)
- [../docs/design/menstrual/date-state-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/date-state-spec.md)
- [../docs/design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
- [../frontend/components/menstrual/DateCell.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/components/menstrual/DateCell.vue)
- [../frontend/components/menstrual/CalendarGrid.vue](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/components/menstrual/CalendarGrid.vue)
- [../artifacts/calendar-grid-iphone15pro.png](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/artifacts/calendar-grid-iphone15pro.png)
- [../artifacts/date-cell-iphone15pro.png](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/artifacts/date-cell-iphone15pro.png)
