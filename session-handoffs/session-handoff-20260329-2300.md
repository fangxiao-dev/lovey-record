# Session Handoff

## Current Goal
- Continue from isolated menstrual-home fixes into the broader first-MVP completion path.
- Use the new MVP definition/gap list as the controlling baseline instead of continuing to work task-by-task without a release bar.

## Completion Status
- Completed:
  - Formal `menstrual/home` live-first read/write loop is in place for single-day period/detail/note and batch period marking.
  - Batch selection UI SSOT was cleaned up: old `BatchEditPanel` and the `gr2x1` diff board were removed from the Pencil source; SSOT is now back on `bi8Au`.
  - Query cache-busting was added in `frontend/services/menstrual/home-contract-service.js` by appending `_ts` directly to query URLs. This fixed the stale H5 reload problem where cleared dates could still render as period.
  - Local Playwright regression support was added at repo root: `package.json` now includes `@playwright/test` and `npm run test:menstrual:live`.
  - Page-level live regression spec was added at `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`.
  - The MVP completion-definition doc was added at `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`.
- Partially completed:
  - Menstrual home is in hardening mode, not yet fully release-stable. Core path works, but more batch corner cases still need to be pressed.
  - Playwright live regression currently covers the menstrual-home hotspot, not the full shell-to-home-to-share/settings MVP path.
  - Module shell, sharing, and settings are documented as MVP gaps but are not yet implemented as real frontend flows.
- Not completed:
  - Real module-shell entry closure
  - Real share/revoke frontend flow
  - Real settings flow for default period duration
  - Full MVP-path release gate
- Verified:
  - `node --test frontend/services/menstrual/__tests__/home-contract-service.test.mjs`
  - `node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
  - `node --test frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs`
  - `npm run test:menstrual:live`
- Not verified:
  - WeChat Mini Program behavior for the same long-press + drag model
  - Any shell/share/settings flow, because those frontend flows do not exist yet

## What Changed
- Added a concrete MVP completion baseline in `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`. This reframes the work from isolated feature fixes to a release-style gap list.
- Cleaned the active design source:
  - removed old `Composite/BatchEditPanel`
  - removed `gr2x1`
  - kept current batch-action-button SSOT in the main Pencil source
- Updated supporting docs to align with the new batch model and terminology:
  - `docs/terminology.md`
  - `docs/design/2026-03-23-ui-visual-language-guide.md`
  - `docs/design/menstrual/token-component-mapping.md`
- Added root-level Playwright support:
  - `package.json`
  - `package-lock.json` from `npm install`
  - `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`
- Strengthened automated regression:
  - `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs` now also covers “previous tapped single-day selection must not override the latest batch-hovered date after save”.
- Fixed stale-query rendering on H5:
  - `frontend/services/menstrual/home-contract-service.js`
  - regression assertion in `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`

## Pitfalls And Resolutions
- H5 reload kept showing stale period cells after `clearPeriodRange`.
  - Root cause: the frontend query layer was issuing identical GET requests, allowing cached query responses to survive across reloads.
  - Resolution: append `_ts` directly to query URLs in `home-contract-service.js`.
  - Status: resolved and verified in H5 with fresh reload checks.
- Adding `Cache-Control` / `Pragma` headers initially broke live requests.
  - Root cause: cross-origin request behavior on the H5 dev setup became unsafe with extra headers.
  - Resolution: removed those headers and kept URL-level cache-busting only.
  - Status: resolved.
- First Playwright live regression attempt was flaky on the path-toggle save case.
  - Root cause: the spec advanced too quickly and relied on raw timing; headless execution could outrun the DOM’s selected-state transitions.
  - Resolution: the spec now waits for expected selection-state transitions before proceeding to the next pointer segment.
  - Status: resolved; `npm run test:menstrual:live` passed with 2 tests.
- Pencil MCP deletion removed the live node state, but the raw `.pen` file still contained old `BatchEditPanel` content.
  - Root cause: live edit state and on-disk source were not fully aligned.
  - Resolution: manually removed the stale blocks from the `.pen` file via patch after confirming the current layout.
  - Status: resolved.

## Open Issues
- The repo now has a local Playwright entry for the menstrual-home hotspot, but not yet for the full MVP path. The next session should not assume shell/share/settings are covered.
- `docs/plans/2026-03-28-pencil-to-uniapp-implementation-plan.md` and `docs/plans/2026-03-28-token-component-alignment-plan.md` still mention `BatchEditPanel`. Those appear to be historical plan references, not active SSOT, but the next session should decide whether to clean them for consistency.
- Remaining batch corner cases are not exhausted. The next session should pick the next real gesture-path cases from user feedback rather than assume the interaction is fully closed.

## Next Recommended Actions
- First action: start executing against `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`, not against isolated bug reports.
- Read first:
  - `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`
  - `frontend/pages/index/index.vue`
  - `frontend/pages/menstrual/home.vue`
  - `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`
- Most relevant next verification:
  - `npm run test:menstrual:live`
  - `node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
- Recommended implementation order:
  1. decide the first real module-shell closure slice
  2. wire one real frontend share/revoke path
  3. wire one real frontend settings path
  4. expand the Playwright regression from home-only to MVP-path coverage

## Useful References
- `D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\plans\2026-03-29-mvp-definition-and-gap-list.md`
- `D:\CodeSpace\hbuilder-projects\lovey-record-backend\frontend\scripts\menstrual-home-batch-live-regression.spec.mjs`
- `D:\CodeSpace\hbuilder-projects\lovey-record-backend\frontend\services\menstrual\home-contract-service.js`
- `D:\CodeSpace\hbuilder-projects\lovey-record-backend\frontend\components\menstrual\__tests__\batch-selection-contract.test.mjs`
- `D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\menstrual\function-home.md`
- `D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\menstrual\function-calendar.md`
