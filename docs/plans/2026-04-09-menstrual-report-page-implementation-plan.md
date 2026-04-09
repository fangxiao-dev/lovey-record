# Menstrual Report Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a menstrual module `report` page with a secondary entry from home, a two-row summary card, a tab-switched trend area, and a history list aligned to the approved report-page design.

**Architecture:** Keep the report page read-only and separate from the home page's edit flows. Build one dedicated read-model adapter/service path for summary, trend, and history data, then compose a new uni-app page from lightweight report-specific components while reusing the existing token and menstrual visual language. This plan implements the approved design contracts in [`docs/design/menstrual/function-cycle-tracking.md`](D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/function-cycle-tracking.md) and [`docs/design/menstrual/frontend-cycle-tracking.md`](D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/frontend-cycle-tracking.md).

**Tech Stack:** uni-app Vue 3 SFCs, existing SCSS token system, existing menstrual frontend service layer, node --test frontend tests, Playwright H5 regression, Pencil draft for visual verification

---

## Task 1: Verify approved design contracts before runtime work

**Files:**
- Read: `docs/design/menstrual/frontend-cycle-tracking.md`
- Read: `docs/design/menstrual/function-cycle-tracking.md`
- Modify: `docs/design/menstrual/frontend-cycle-tracking.md`
- Modify: `docs/design/menstrual/function-cycle-tracking.md`

**Step 1: Re-read both approved design contracts**

Check that design and functional docs now agree on:

- page sections
- minimum chart point threshold
- summary semantics

**Step 2: Only patch docs if implementation reveals drift**

Do not restate design inside this plan. The design source of truth is the two docs above.

**Step 3: Commit, only if doc drift was corrected**

```bash
git add docs/design/menstrual/frontend-cycle-tracking.md docs/design/menstrual/function-cycle-tracking.md
git commit -m "docs: fix menstrual report contract drift"
```

## Task 2: Add report-page route and page shell test first

**Files:**
- Modify: `frontend/pages.json`
- Create: `frontend/pages/menstrual/report.vue`
- Test: create `frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

**Step 1: Write the failing page-shell test**

Assert that the report page shell can represent:

- weak header
- summary card container
- trend card container
- history list container

Also assert the route path is expected:

- `pages/menstrual/report`

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

Expected: FAIL because the page and route do not exist yet.

**Step 3: Add the page route and minimal shell**

Create `frontend/pages/menstrual/report.vue` with:

- back button
- low-presence title
- placeholder summary/trend/history sections

Register it in `frontend/pages.json`.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pages.json frontend/pages/menstrual/report.vue frontend/pages/menstrual/__tests__/report-page-shell.test.mjs
git commit -m "frontend: add menstrual report page shell"
```

## Task 3: Add home entry wiring for the chosen secondary card

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Test: create or modify `frontend/components/menstrual/__tests__/home-report-entry.test.mjs`

**Step 1: Write the failing entry test**

Assert that home can render the chosen report entry card:

- placed after the selected-date panel section
- uses the report icon asset
- navigates to `pages/menstrual/report`

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/components/menstrual/__tests__/home-report-entry.test.mjs`

Expected: FAIL because the entry card does not exist yet.

**Step 3: Implement the chosen entry**

Add the approved `方案 2` style secondary entry card:

- calm compact card
- report icon
- title and supporting text
- tap navigation to report page

Keep it clearly secondary to home editing surfaces.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/components/menstrual/__tests__/home-report-entry.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-report-entry.test.mjs
git commit -m "frontend: add report page entry card to menstrual home"
```

## Task 4: Add report read-model adapter tests for summary semantics

**Files:**
- Create: `frontend/components/menstrual/report-contract-adapter.js`
- Test: create `frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs`

**Step 1: Write the failing adapter tests**

Cover:

- averages render with one decimal place
- fluctuation renders as integer `-x ~ +y`
- summary rows are flattened into one line per metric group
- cycle and duration history rows are latest first

Use fixed input records to assert exact output strings.

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs`

Expected: FAIL because the adapter does not exist yet.

**Step 3: Implement the pure adapter**

Create helpers for:

- historical average formatting
- fluctuation formatting
- history row formatting
- trend dataset filtering
- valid-point counting

Keep it pure and independent from UI.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/report-contract-adapter.js frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs
git commit -m "frontend: add menstrual report contract adapter"
```

## Task 5: Add report read-service tests first

**Files:**
- Create: `frontend/services/menstrual/report-contract-service.js`
- Test: create `frontend/services/menstrual/__tests__/report-contract-service.test.mjs`
- Read: `frontend/services/menstrual/home-contract-service.js`

**Step 1: Write the failing service tests**

Assert the service can load and normalize the required data for:

- summary
- trend
- history

If the backend does not yet expose a dedicated report endpoint, document and test the temporary composition path from available menstrual reads.

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/services/menstrual/__tests__/report-contract-service.test.mjs`

Expected: FAIL because the service does not exist yet.

**Step 3: Implement the minimal read service**

Create one service that returns a single report-page payload for the adapter layer.

Keep it read-only and isolated from home mutation code.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/services/menstrual/__tests__/report-contract-service.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/services/menstrual/report-contract-service.js frontend/services/menstrual/__tests__/report-contract-service.test.mjs
git commit -m "frontend: add menstrual report read service"
```

## Task 6: Build summary, trend, and history components one by one

**Files:**
- Create: `frontend/components/menstrual/ReportSummaryCard.vue`
- Create: `frontend/components/menstrual/ReportTrendCard.vue`
- Create: `frontend/components/menstrual/ReportHistoryList.vue`
- Test: create `frontend/components/menstrual/__tests__/report-summary-card.test.mjs`
- Test: create `frontend/components/menstrual/__tests__/report-trend-card.test.mjs`
- Test: create `frontend/components/menstrual/__tests__/report-history-list.test.mjs`

**Step 1: Write the failing component tests**

Summary card test:

- renders two rows only
- each row keeps average and fluctuation on one line

Trend card test:

- supports `Cycle | Duration` tab switching
- hides chart when valid points are below 3
- shows `记录 3 次后开始有图`

History list test:

- renders header row
- renders latest-first rows
- renders `-` for missing cycle

**Step 2: Run tests to verify they fail**

Run:

`node --test frontend/components/menstrual/__tests__/report-summary-card.test.mjs frontend/components/menstrual/__tests__/report-trend-card.test.mjs frontend/components/menstrual/__tests__/report-history-list.test.mjs`

Expected: FAIL because the components do not exist yet.

**Step 3: Implement the minimal components**

Build components using the existing menstrual token language:

- summary card: one card, two rows
- trend card: weak label, compact tabs, chart area / empty state
- history list: light table-like list

Do not add prediction or settings guidance.

**Step 4: Run tests to verify they pass**

Run:

`node --test frontend/components/menstrual/__tests__/report-summary-card.test.mjs frontend/components/menstrual/__tests__/report-trend-card.test.mjs frontend/components/menstrual/__tests__/report-history-list.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/ReportSummaryCard.vue frontend/components/menstrual/ReportTrendCard.vue frontend/components/menstrual/ReportHistoryList.vue frontend/components/menstrual/__tests__/report-summary-card.test.mjs frontend/components/menstrual/__tests__/report-trend-card.test.mjs frontend/components/menstrual/__tests__/report-history-list.test.mjs
git commit -m "frontend: add menstrual report page components"
```

## Task 7: Compose the real report page

**Files:**
- Modify: `frontend/pages/menstrual/report.vue`
- Test: modify `frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

**Step 1: Extend the failing page test**

Assert that the real page composition:

- renders weak header
- mounts the summary card
- mounts the trend card
- mounts the history list
- wires trend tab state correctly

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

Expected: FAIL because the page still uses placeholder sections.

**Step 3: Compose the page**

Wire:

- page load -> report service
- service payload -> report adapter
- adapter output -> summary, trend, history components

Keep layout and spacing aligned with the approved visual hierarchy.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/report.vue frontend/pages/menstrual/__tests__/report-page-shell.test.mjs
git commit -m "frontend: compose menstrual report page"
```

## Task 8: Add focused H5 runtime regression for report page

**Files:**
- Create or modify: `frontend/scripts/menstrual-report-live-regression.spec.mjs`
- Read: `docs/checklists/frontend-h5-live-regression.md`

**Step 1: Write the runtime scenario**

Cover:

- enter report from home entry card
- weak header renders and back navigation works
- summary card shows both rows
- trend tab switches between cycle and duration
- insufficient-data state shows `记录 3 次后开始有图`
- history list renders latest first

**Step 2: Run the H5 regression**

Run the repo's fixed H5 Playwright command from the checklist.

Expected: initial failure until selectors and wiring are correct.

**Step 3: Fix selectors or runtime assumptions**

Adjust the page and test hooks as needed.

**Step 4: Re-run the regression**

Run the same H5 Playwright command again.

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/scripts/menstrual-report-live-regression.spec.mjs
git commit -m "test: add menstrual report page live regression"
```

## Task 9: Final visual and doc verification

**Files:**
- Modify: `docs/plans/2026-04-09-menstrual-report-page-implementation-plan.md`
- Modify: `docs/design/menstrual/frontend-cycle-tracking.md`
- Modify: `docs/design/menstrual/function-cycle-tracking.md`
- Read: `docs/design/2026-03-23-ui-visual-language-guide.md`
- Read: `frontend/AGENTS.md`

**Step 1: Re-read the final UI against the approved design**

Check:

- summary rows stay one-line
- no prediction leaks into report UI
- trend empty-state copy is exact
- history stays read-only and lightweight

**Step 2: Re-read H5 verification notes**

State clearly what was runtime-verified and what remains Mini Program-only.

**Step 3: Update plan notes if implementation reality changed**

Only adjust docs where execution revealed real drift.

**Step 4: Commit**

```bash
git add docs/plans/2026-04-09-menstrual-report-page-implementation-plan.md docs/design/menstrual/frontend-cycle-tracking.md docs/design/menstrual/function-cycle-tracking.md
git commit -m "docs: finalize menstrual report page plan notes"
```

## Completion Criteria

- [ ] home page exposes the chosen report entry card
- [ ] `pages/menstrual/report` is registered in `pages.json`
- [ ] report page uses a weak header
- [ ] summary card renders exactly two rows
- [ ] each summary row keeps average and fluctuation on the same line
- [ ] average uses one decimal place
- [ ] fluctuation uses integer-day `-x ~ +y`
- [ ] fluctuation is based on historical average
- [ ] trend card supports `Cycle | Duration` switching
- [ ] trend card hides chart when valid points are below 3
- [ ] insufficient-data copy is `记录 3 次后开始有图`
- [ ] history list renders latest first
- [ ] history list shows `-` for missing cycle
- [ ] H5 runtime regression passes
