# Report Align Settings Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** let users align report-page default cycle and duration settings directly from `report` via a confirm flow that uses rounded averages, optimistic UI updates, and the existing backend settings commands.

**Architecture:** keep the backend surface unchanged and compose the feature in the frontend by extending the report adapter, adding a report-local align dialog state machine, and reusing `persistModuleSettings` plus `persistModulePredictionTerm` for persistence. Use a custom modal instead of `uni.showModal` so the dialog can render bold `周期 / 时长`, multi-line diffs, and the `happy.png` illustration for non-executable cases.

**Tech Stack:** uni-app Vue 3, JavaScript page/component modules, existing menstrual command/query services, Node built-in `node:test`, H5 manual verification

---

## Scope Lock

- Add a real `一键对齐` action in `report`; do not route to `management`.
- Reuse existing commands:
  - `frontend/services/menstrual/module-shell-command-service.js`
  - `persistModuleSettings`
  - `persistModulePredictionTerm`
- Do not add or change backend APIs.
- Use rounded averages:
  - duration average from `durationDays`
  - cycle average from computed `cycleLength`
- Use three dialog scenarios only:
  - `empty`
  - `duration-only`
  - `full`
- For `empty`, show info only with a single `知道了` button.
- For `duration-only`, allow confirm and update `时长` only.
- For `full`, allow confirm and update both `周期` and `时长`.
- Do not add cross-page live sync to an already-mounted `management` page instance.

## Acceptance Criteria

- Clicking `一键对齐` on `report` opens a custom modal, not a native `uni.showModal`.
- With `0` records, the modal shows `还没有统计到数据噢，先记一笔吧` and `happy.png`, and no update runs.
- With `1` record, the modal shows `周期统计至少需要两次记录，本次只会更改时长噢` and `happy.png`, and only `时长` is updated after confirm.
- With `2+` usable records, the modal shows two diff rows:
  - `周期：旧值 -> 新值`
  - `时长：旧值 -> 新值`
- All `周期 / 时长` keywords in the dialog are rendered with bold text nodes.
- Confirm uses rounded averages and updates the report footer optimistically.
- Persistence failures roll the footer back and show an error.
- Readonly users still cannot mutate settings from `report`.

## Files Expected To Change

- Modify: `docs/design/menstrual/function-cycle-tracking.md`
- Modify if the visual contract needs explicit UI wording: `docs/design/menstrual/frontend-cycle-tracking.md`
- Modify: `frontend/components/menstrual/report-contract-adapter.js`
- Modify: `frontend/components/menstrual/ReportSummaryCard.vue`
- Modify: `frontend/pages/menstrual/report.vue`
- Modify: `frontend/services/menstrual/module-shell-command-service.js` only if a small shared helper is needed; otherwise reuse as-is
- Modify or add: `frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs`
- Modify or add: `frontend/components/menstrual/__tests__/report-summary-card.test.mjs`
- Modify or add: `frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`
- Add if needed: a new report-page interaction test under `frontend/pages/menstrual/__tests__/`

## Temporary Working Plan

### Task 1: Lock the report align interaction contract in docs

**Files:**
- Modify: `docs/design/menstrual/function-cycle-tracking.md`
- Modify if needed: `docs/design/menstrual/frontend-cycle-tracking.md`

**Step 1: Add the missing interaction contract**

Document:

- `一键对齐` stays on the report page
- average source rules for `时长 / 周期`
- rounding rule: standard nearest integer
- dialog scenarios: `empty`, `duration-only`, `full`
- readonly behavior
- optimistic update and rollback expectation

**Step 2: Keep the wording exact**

Include the approved copy verbatim:

```text
还没有统计到数据噢，先记一笔吧
周期统计至少需要两次记录，本次只会更改时长噢
```

and the diff format:

```text
周期：<old> 天 -> <next> 天
时长：<old> 天 -> <next> 天
```

**Step 3: Sanity check the docs**

Verify the report interaction text does not conflict with existing `management` or home-page setting semantics.

### Task 2: Extend the report adapter with align candidates

**Files:**
- Modify: `frontend/components/menstrual/report-contract-adapter.js`
- Modify: `frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs`

**Step 1: Add failing adapter tests**

Cover at least:

- `0` records returns `empty`
- `1` record returns `duration-only`
- `2+` records returns `full`
- `duration` target uses rounded average of `durationDays`
- `cycle` target uses rounded average of computed `cycleLength`
- footer current values remain formatted with spaces: `周期 28 天 · 时长 7 天`

**Step 2: Run the adapter test**

```bash
node --test frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs
```

Expected:

- new assertions fail before implementation

**Step 3: Implement the minimal adapter additions**

Add a new report-local structure such as:

```js
align: {
  scenario: 'empty' | 'duration-only' | 'full',
  currentDurationDays: 7,
  currentPredictionTermDays: 28,
  nextDurationDays: 5,
  nextPredictionTermDays: 29,
  canAlignDuration: true,
  canAlignPrediction: false
}
```

Rules:

- `nextDurationDays = Math.round(avgDuration)`
- `nextPredictionTermDays = Math.round(avgCycle)`
- `canAlignPrediction` is false unless there are at least two records with one valid `cycleLength`

**Step 4: Re-run the adapter test**

Expected:

- adapter tests pass with the new align payload

### Task 3: Wire the summary card so `一键对齐` emits a real action

**Files:**
- Modify: `frontend/components/menstrual/ReportSummaryCard.vue`
- Modify: `frontend/components/menstrual/__tests__/report-summary-card.test.mjs`

**Step 1: Add failing structural assertions**

Cover at least:

- the card emits `action: 'settings'`
- the card emits `action: 'align'`
- `refresh.png` remains present on the align button
- the align button is no longer a dead visual-only element

**Step 2: Implement the minimal event wiring**

Keep `手动调整` unchanged, but make `一键对齐` emit:

```js
$emit('footer-tap', { footer, action: 'align' })
```

**Step 3: Re-run the summary-card test**

```bash
node --test frontend/components/menstrual/__tests__/report-summary-card.test.mjs
```

Expected:

- summary-card assertions pass

### Task 4: Add a report-page local align modal and optimistic update flow

**Files:**
- Modify: `frontend/pages/menstrual/report.vue`
- Reuse: `frontend/services/menstrual/module-shell-command-service.js`
- Add or modify tests under: `frontend/pages/menstrual/__tests__/`
- Modify: `frontend/pages/menstrual/__tests__/report-page-shell.test.mjs`

**Step 1: Add failing page tests**

Cover at least:

- `align` action opens a custom modal state, not navigation
- `empty` scenario shows single-button info mode
- `duration-only` confirm calls only `persistModuleSettings`
- `full` confirm calls `persistModuleSettings` then `persistModulePredictionTerm`
- readonly mode blocks mutation
- command failure rolls the footer back

**Step 2: Add report-page state**

Add local state similar to:

```js
alignDialog: {
  visible: false,
  mode: 'empty',
  busy: false,
  payload: null
},
moduleSettingsSnapshot: null
```

**Step 3: Build the modal view**

Render a report-page local custom modal with:

- bold `周期` / `时长` labels via separate `<text>` nodes
- `happy.png` for `empty` and `duration-only`
- single `知道了` button for `empty`
- `取消 / 确认` buttons for executable scenarios

Do not use `rich-text`; keep it plain uni-app template nodes.

**Step 4: Implement confirm behavior**

Pseudo-flow:

```js
const previous = { ...currentFooterSettings };
applyOptimisticFooter(nextDurationDays, nextPredictionTermDays);
try {
  if (canAlignDuration) await persistModuleSettings(...);
  if (canAlignPrediction) await persistModulePredictionTerm(...);
  await refreshModuleSettingsOnlyOrReloadReport();
} catch (error) {
  restoreFooter(previous);
  showAlignFailure(error);
}
```

Details:

- keep `settings` action navigation unchanged
- block `align` if `footer.portalMode === 'readonly-warning'`
- run commands serially: duration first, prediction second
- after success, reload module settings and rebuild `reportView`

**Step 5: Re-run the page tests**

Expected:

- the page tests pass with the new dialog and optimistic flow

### Task 5: Final regression verification

**Files:**
- Verify: `frontend/components/menstrual/report-contract-adapter.js`
- Verify: `frontend/components/menstrual/ReportSummaryCard.vue`
- Verify: `frontend/pages/menstrual/report.vue`
- Verify: relevant report tests under `frontend/components/menstrual/__tests__/`
- Verify: relevant report tests under `frontend/pages/menstrual/__tests__/`

**Step 1: Run the report-focused test suite**

Minimum command:

```bash
node --test frontend/components/menstrual/__tests__/report-contract-adapter.test.mjs frontend/components/menstrual/__tests__/report-summary-card.test.mjs frontend/components/menstrual/__tests__/report-trend-card.test.mjs frontend/components/menstrual/__tests__/report-history-list.test.mjs frontend/pages/menstrual/__tests__/report-page-shell.test.mjs
```

Add any new report-page interaction test file to the command.

**Step 2: Manual H5 verification**

Checklist:

1. open `http://localhost:5173/#/pages/menstrual/report`
2. click `一键对齐` with zero records and confirm the info-only dialog shows
3. seed or use a one-record case and confirm only `时长` is updated
4. use a two-plus-record case and confirm both values update
5. confirm the footer text changes immediately after confirm
6. reload the page and confirm the new settings persist
7. open `management` after the update and confirm it reads the persisted values
8. simulate a failed command and confirm rollback messaging is visible

**Step 3: Record remaining gaps**

If still unverified, explicitly note:

- WeChat DevTools not verified
- true-device not verified
- failure-path verification only covered by mocks if no easy live failure trigger exists

## Stop Conditions

- stop only if current backend command semantics reject report-page callers in a way that cannot be solved without an API or permission-contract change
- stop only if the existing report payload does not contain enough setting truth to support rollback without first changing query shape
