# Three-Week Home Demo Implementation Plan

> **Status:** COMPLETED

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the menstrual frontend demo around the Pencil three-week home card so runtime validation follows the current design source of truth instead of the older month-calendar acceptance page.

**Architecture:** Keep the existing token-first pipeline and build the demo from reusable primitives upward. `DateCell` remains the state renderer, but the main showcase page becomes a composed home-demo surface made from `HeaderNav`, `JumpTabs`, `SegmentedControl`, `CalendarGrid`, `CalendarLegend`, and `SelectedDatePanel`, using Pencil nodes `Yzswn / fydEy / GEh6e / mVNZO / Y5mJI / AGEIj` as the contract baseline.

**Tech Stack:** uni-app Vue 3 SFCs, SCSS tokens/utilities, node:test, Pencil MCP, Playwright MCP

---

## Scope Lock

- Treat the three-week calendar (`mVNZO`) as the primary demo contract.
- Treat ordinary month-calendar layouts as secondary browse-only states, not the current acceptance baseline.
- Match the latest Pencil look first; do not preserve older runtime structure for continuity if it conflicts.
- Strengthen `selected` shadow across all platforms, but keep it as a restrained lift cue rather than a heavy floating card.

## Pencil Source Of Truth

- `Yzswn` / `4V3lh`: month navigation row
- `fydEy` / `u0LTO`: `今天 / 本次 / 下次预测` jump tabs
- `GEh6e`: `3 周 / 月览` segmented control
- `mVNZO`: three-week calendar card
- `Y5mJI` / `AAMtX`: legend
- `AGEIj`: selected date panel

## Files Expected To Change

- Modify: `frontend/pages/menstrual/calendar-grid-showcase.vue`
- Modify: `frontend/components/menstrual/CalendarGrid.vue`
- Modify: `frontend/components/menstrual/DateCell.vue`
- Modify: `frontend/components/menstrual/date-cell-view-model.js`
- Modify: `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
- Modify: `frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs`
- Modify: `frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs`
- Create: `frontend/components/menstrual/HeaderNav.vue`
- Create: `frontend/components/menstrual/JumpTabs.vue`
- Create: `frontend/components/menstrual/SegmentedControl.vue`
- Create: `frontend/components/menstrual/SelectedDatePanel.vue`
- Create: `frontend/components/menstrual/selected-date-panel-data.js`
- Create: `frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`
- Create: `frontend/components/menstrual/__tests__/header-nav-data.test.mjs` if a dedicated data helper is introduced
- Modify if needed: `docs/design/menstrual/date-state-spec.md`

## Verification Baseline

- Node tests for the menstrual component/data suite must pass after each slice.
- Playwright MCP baseline:
  - `http://localhost:5173/#/pages/menstrual/calendar-grid-showcase`
  - iPhone 15 Pro class viewport
- Pencil comparison:
  - `mVNZO`
  - `AGEIj`
  - `AAMtX`

## Session Continuation Notes

- The current runtime still shows the older five-week acceptance page. Treat that as outdated baseline output, not the target design.
- The current Pencil source has been manually adjusted again by the user, especially `u0LTO`; re-read the latest Pencil nodes before implementation instead of trusting earlier screenshots.
- The intended top-of-card composition is:
  - `Yzswn` / `4V3lh`
  - `fydEy` / `u0LTO`
  - `GEh6e`
  - `mVNZO`
  - `Y5mJI` / `AAMtX`
  - `AGEIj`
- `selected` shadow should be strengthened across all platforms, but `today` geometry must still remain circular when `today` is present.
- Current working tree is intentionally dirty:
  - modified: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
  - untracked: `artifacts/`
- Do not revert the `.pen` changes. They contain the latest visual source-of-truth edits.
- Before Task 1, verify the current live runtime and Pencil nodes again so implementation starts from the latest design, not from stale assumptions.

### Task 1: Freeze The New Demo Contract In Data

**Files:**
- Modify: `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
- Modify: `frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs`

**Step 1: Write the failing test**

Update the acceptance-page data test so it asserts:
- the page exposes a header-nav section
- the page exposes jump tabs
- the page exposes segmented-control options
- the page calendar data is three weeks, not five
- the page still exposes legend and selected-date-panel demo data

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs
```

Expected: FAIL because the current acceptance-page data still describes the old month-card structure.

**Step 3: Write minimal implementation**

Refactor `calendar-grid-acceptance-page-data.js` so it returns a demo object shaped like:
- `headerNav`
- `jumpTabs`
- `viewModeControl`
- `calendarCard`
- `legend`
- `selectedDatePanel`

Keep the three-week day matrix directly aligned to `mVNZO`.

**Step 4: Run test to verify it passes**

Run the same command.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/calendar-grid-acceptance-page-data.js frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs
git commit -m "refactor(frontend): align demo data with three-week home card"
```

### Task 2: Add HeaderNav Primitive

**Files:**
- Create: `frontend/components/menstrual/HeaderNav.vue`
- Modify: `frontend/pages/menstrual/calendar-grid-showcase.vue`

**Step 1: Write the failing test**

If a data helper is introduced, create a focused data test. Otherwise write a source-level test that checks the page uses `HeaderNav` and the expected month label copy.

**Step 2: Run test to verify it fails**

Run the targeted test file.  
Expected: FAIL because the component/page wiring does not exist yet.

**Step 3: Write minimal implementation**

Implement a dumb nav row matching `Yzswn / 4V3lh`:
- left/back chevron button surface
- centered month title
- right/next chevron button surface

No live navigation behavior is required for the demo beyond props and visual structure.

**Step 4: Run test to verify it passes**

Run the targeted test file.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/HeaderNav.vue frontend/pages/menstrual/calendar-grid-showcase.vue
git commit -m "feat(frontend): add menstrual header nav primitive"
```

### Task 3: Add JumpTabs Primitive

**Files:**
- Create: `frontend/components/menstrual/JumpTabs.vue`
- Modify: `frontend/pages/menstrual/calendar-grid-showcase.vue`

**Step 1: Write the failing test**

Add a test or source assertion that the demo exposes three tabs with the Pencil copy:
- `今天`
- `本次`
- `下次预测`

**Step 2: Run test to verify it fails**

Run the targeted test.  
Expected: FAIL.

**Step 3: Write minimal implementation**

Create a pill-tab row that supports:
- neutral outlined tab
- active coral tab
- soft prediction tab

Use the Pencil spacing/radius cadence from `u0LTO`.

**Step 4: Run test to verify it passes**

Run the targeted test.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/JumpTabs.vue frontend/pages/menstrual/calendar-grid-showcase.vue
git commit -m "feat(frontend): add menstrual jump tabs"
```

### Task 4: Add SegmentedControl Primitive

**Files:**
- Create: `frontend/components/menstrual/SegmentedControl.vue`
- Modify: `frontend/pages/menstrual/calendar-grid-showcase.vue`

**Step 1: Write the failing test**

Add a test or page-source assertion for the two options:
- `3 周`
- `月览`

Ensure the active option is `3 周` in the demo.

**Step 2: Run test to verify it fails**

Run the targeted test.  
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement the segmented-control shell matching `GEh6e`:
- warm neutral outer pill
- white active segment
- muted inactive segment

**Step 4: Run test to verify it passes**

Run the targeted test.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/SegmentedControl.vue frontend/pages/menstrual/calendar-grid-showcase.vue
git commit -m "feat(frontend): add menstrual view-mode control"
```

### Task 5: Rework CalendarGrid To Three-Week Demo Layout

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue`
- Modify: `frontend/pages/menstrual/calendar-grid-showcase.vue`
- Modify: `frontend/components/menstrual/calendar-grid-acceptance-page-data.js`
- Modify: `frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs` if needed

**Step 1: Write the failing test**

Update or add a test so the grid demo asserts:
- three week rows
- English weekday initials for the home-demo card
- divider placement between weeks
- no fallback dependence on the older five-week card shape

**Step 2: Run test to verify it fails**

Run the targeted grid-related tests.  
Expected: FAIL.

**Step 3: Write minimal implementation**

Recompose the page so the primary calendar card matches `mVNZO`:
- 3 week rows
- English weekday initials
- white card shell
- warm dividers
- current selected day uses the strengthened selected cue

Keep `DateCell` responsible only for the date-state visual.

**Step 4: Run test to verify it passes**

Run the targeted grid tests.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/CalendarGrid.vue frontend/pages/menstrual/calendar-grid-showcase.vue frontend/components/menstrual/calendar-grid-acceptance-page-data.js
git commit -m "refactor(frontend): turn calendar demo into three-week home card"
```

### Task 6: Implement SelectedDatePanel

**Files:**
- Create: `frontend/components/menstrual/SelectedDatePanel.vue`
- Create: `frontend/components/menstrual/selected-date-panel-data.js`
- Create: `frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`
- Modify: `frontend/pages/menstrual/calendar-grid-showcase.vue`

**Step 1: Write the failing test**

Add a data test that asserts the panel provides:
- selected date title
- optional `今日` badge
- status chips (for example `经期`, `特殊标记`)
- three-attribute summary items
- primary action label

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs
```

Expected: FAIL because the data helper/component does not exist.

**Step 3: Write minimal implementation**

Build `SelectedDatePanel` from `AGEIj`:
- header row
- status chip row
- three-attribute summary row
- primary CTA

Make it a pure presentation component driven by props or a small helper.

**Step 4: Run test to verify it passes**

Run the same command.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/SelectedDatePanel.vue frontend/components/menstrual/selected-date-panel-data.js frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs frontend/pages/menstrual/calendar-grid-showcase.vue
git commit -m "feat(frontend): add selected date panel demo"
```

### Task 7: Strengthen Selected Shadow Across Platforms

**Files:**
- Modify: `frontend/components/menstrual/DateCell.vue`
- Modify: `frontend/components/menstrual/date-cell-view-model.js` if needed
- Modify: `frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs`
- Modify token/foundation files only if the shared shadow token must change globally

**Step 1: Write the failing test**

Add or update a test that asserts the selected cue remains:
- present on selected states
- absent on non-selected states
- compatible with `today` circle geometry

If a token file changes, add a source-level assertion for the new shadow value.

**Step 2: Run test to verify it fails**

Run the targeted selected-state test.  
Expected: FAIL if the test encodes the stronger cue contract.

**Step 3: Write minimal implementation**

Increase the selected shadow visibility in a way that works cross-platform:
- favor slightly stronger blur/offset/alpha
- do not switch to a thick border-heavy style
- preserve today circle geometry

**Step 4: Run test to verify it passes**

Run the targeted test.  
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/DateCell.vue frontend/components/menstrual/date-cell-view-model.js frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs
git commit -m "style(frontend): strengthen selected date lift cue"
```

### Task 8: Runtime And Pencil Verification

**Files:**
- No required source changes unless issues are found
- Save fresh screenshots under `artifacts/`

**Step 1: Run full targeted test suite**

Run:

```bash
node --test frontend/components/menstrual/__tests__/calendar-legend-data.test.mjs frontend/components/menstrual/__tests__/calendar-legend-view.test.mjs frontend/components/menstrual/__tests__/calendar-grid-acceptance-page-data.test.mjs frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-state.test.mjs frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs frontend/components/menstrual/__tests__/marker-assets.test.mjs frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs frontend/__tests__/project-structure.test.mjs
```

Expected: PASS.

**Step 2: Run Playwright MCP**

Validate:
- no console errors or warnings
- no horizontal overflow
- screenshot at iPhone 15 Pro class viewport

**Step 3: Run Pencil comparison**

Compare the runtime with:
- `mVNZO`
- `Y5mJI`
- `AGEIj`

Document any intentional remaining drift.

**Step 4: Commit if verification uncovered fixes**

If any final polish changes were needed, commit them separately with a verification-focused message.

### Task 9: Update Long-Lived Docs If Needed

**Files:**
- Modify if required: `docs/design/menstrual/date-state-spec.md`
- Modify if required: `docs/plans/2026-03-28-calendar-grid-legend-next-plan.md`

**Step 1: Check for drift**

If the three-week home demo changes the durable component contract, update the relevant design doc.

**Step 2: Make only necessary doc edits**

Do not duplicate runtime specifics that belong only in the demo page data.

**Step 3: Verify doc links and wording**

Make sure future sessions will read the three-week home card as the active acceptance surface.

**Step 4: Commit**

```bash
git add docs/design/menstrual/date-state-spec.md docs/plans/2026-03-28-calendar-grid-legend-next-plan.md
git commit -m "docs(frontend): align demo documentation with three-week home card"
```
