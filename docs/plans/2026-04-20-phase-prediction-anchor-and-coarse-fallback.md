# Phase Prediction Anchor And Coarse Fallback Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align menstrual home phase display with `predictionSummary.predictedStartDate`, and replace the current implicit `卵泡期` fallback with the neutral coarse cycle state `记录中 / 记录更多以生成预测`.

**Architecture:** Keep the current frontend-only phase pipeline inside `frontend/components/menstrual/home-contract-adapter.js`, but change the out-of-period phase anchor from `cycleLengthDays` to `predictionSummary.predictedStartDate` when available. Preserve `经期 > 排卵期 > 卵泡期 > 黄体期` priority, keep `isLutealLate` as a flag on top of `黄体期`, and let the adapter emit a coarse state when historical data exists but fine-grained phase classification is unavailable. Update `frontend/pages/menstrual/home.vue` to render that coarse state without treating it as an error or empty state.

**Tech Stack:** uni-app Vue 3 SFCs, existing menstrual frontend adapter/service layer, node `--test` frontend tests, existing phase-status contracts under `docs/design/menstrual/`.

---

## Task 1: Lock Adapter Contract Tests To The New Semantics

**Files:**
- Modify: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`
- Read: `docs/design/menstrual/function-phase-status.md`
- Read: `docs/design/menstrual/frontend-phase-status.md`

**Step 1: Add failing tests for predicted-start anchored phase computation**

Add or update tests so phase classification is driven by `predictionSummary.predictedStartDate` instead of only `defaultPredictionTermDays`.

Cover at least:

- `predictedStartDate = 2026-04-20`, `today = 2026-04-06` through `2026-04-10` period window -> `phase: '经期'`
- `predictedStartDate = 2026-04-20`, `today = 2026-04-04` or another date before the ovulation window -> `phase: '卵泡期'`
- `predictedStartDate = 2026-04-20`, `today = 2026-04-04 +` not relevant? No. Use `today = 2026-04-06`? Wrong. Use a fixed date in the ovulation window such as `2026-04-04` only if it matches the window. Prefer a clean case: `predictedStartDate = 2026-04-20`, `today = 2026-04-06`, `currentSegment.startDate = 2026-03-24`, `period already ended`; then `ovulationCenter = 2026-04-06`, so `phase: '排卵期'`
- one early luteal case where `today > ovulationWindowEndDate && today < predictedStartDate - 7`
- one late luteal case where `today >= predictedStartDate - 7 && today < predictedStartDate`

Use explicit dates that make the predicted-start anchor obvious in the assertions.

**Step 2: Add failing tests for coarse fallback**

Cover:

- historical segment exists, but `predictionSummary = null` -> `phase: null`
- historical segment exists, but `predictionSummary.predictedStartDate = null` -> `phase: null`
- coarse fallback still returns:

```js
{
  phase: null,
  emphasis: false,
  isLutealLate: false,
  hint: '记录更多以生成预测'
}
```

- no historical segment still goes through the existing page-level empty state `暂无记录` instead of the coarse cycle state

**Step 3: Add failing page-model test for frozen coarse copy**

In the same test file, assert that `createMenstrualHomePageModel(...)` exposes hero data for the coarse state with:

```js
statusFrame: {
  state: 'out_of_period',
  text: '记录中',
  phaseStatus: {
    phase: null,
    hint: '记录更多以生成预测'
  }
}
```

Do not let the adapter silently fall back to `卵泡期`.

**Step 4: Run the adapter test file to verify failure**

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: FAIL because current implementation still computes ovulation from `startDate + cycleLengthDays - 14` and still defaults missing prediction data to `卵泡期`.

**Step 5: Commit the red tests**

```bash
git add frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "test(frontend): capture predicted-start phase anchor and coarse fallback"
```

---

## Task 2: Update The Contract Adapter

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Test: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

**Step 1: Implement a coarse phase-status helper**

Add a small pure helper that returns the frozen fallback payload:

```js
function createCoarsePhaseStatus(showReliabilityWarning = false) {
	return {
		phase: null,
		isLutealLate: false,
		emphasis: false,
		hint: '记录更多以生成预测',
		showReliabilityWarning,
		daysUntilNextPeriod: null
	};
}
```

Keep this helper adapter-local. Do not move copy decisions into `home.vue`.

**Step 2: Change `computePhaseStatus(...)` to prefer `predictedStartDate`**

Implement this decision order:

```js
if (!today || !currentSegment?.startDate || !periodDurationDays) {
	return createCoarsePhaseStatus(showReliabilityWarning);
}

if (today is inside current period) {
	return period phase;
}

if (!predictedStartDate) {
	return createCoarsePhaseStatus(showReliabilityWarning);
}

ovulationCenterDate = addDays(predictedStartDate, -14);
ovulationWindowStartDate = addDays(ovulationCenterDate, -2);
ovulationWindowEndDate = addDays(ovulationCenterDate, 2);
lateLutealStartDate = addDays(predictedStartDate, -7);
```

Then classify with fixed priority:

- `经期`
- `排卵期`
- `卵泡期`
- `黄体期`

Do not derive `ovulationCenterDate` from `cycleLengthDays` when `predictedStartDate` is present.

**Step 3: Preserve existing reliability warning behavior**

Keep:

```js
showReliabilityWarning = basedOnCycleCount < 3
```

but apply it both to fine-grained phases and to the coarse cycle state.

**Step 4: Update `createHeroCard(...)` to surface coarse state correctly**

When `phaseStatus.phase === null` and historical period data exists:

- `statusFrame.text` should be `记录中`
- `statusFrame.phaseStatus` should still be present
- the hero remains in the non-empty branch

Do not send this state through the `暂无记录` empty-state branch.

**Step 5: Run adapter tests to verify they pass**

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: PASS

**Step 6: Commit the adapter change**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "feat(frontend): anchor phase status to predicted start and add coarse fallback"
```

---

## Task 3: Update Hero Rendering For The Coarse Cycle State

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/pages/menstrual/__tests__/home-phase-status.test.mjs`
- Read: `docs/design/menstrual/frontend-phase-status.md`

**Step 1: Add failing rendering tests for `phase = null`**

In `frontend/pages/menstrual/__tests__/home-phase-status.test.mjs`, add a case where:

```js
page.heroCard.statusFrame = {
  state: 'out_of_period',
  text: '记录中',
  phaseStatus: {
    phase: null,
    emphasis: false,
    isLutealLate: false,
    hint: '记录更多以生成预测',
    showReliabilityWarning: true
  }
}
```

Assert:

- the hero does not render `暂无记录`
- the hero does not render a phase icon for `卵泡期`
- the hero renders primary text `记录中`
- the hero renders hint text `记录更多以生成预测`
- the hero can still render the reliability `!` affordance if `showReliabilityWarning === true`
- the hero uses a neutral non-emphasis style

**Step 2: Run the page-status test to verify failure**

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: FAIL because the current template only has two branches:

- `phaseStatus.phase !== '经期'` phase row
- `state === 'no_record'` empty state

and it does not yet know how to render `phase = null`.

**Step 3: Implement a dedicated coarse-status branch in `home.vue`**

Add a neutral branch between the current phase-row branch and the empty-state branch.

Target structure:

```vue
<template v-if="phaseStatus && phaseStatus.phase !== null && phaseStatus.phase !== '经期'">
  <!-- existing phase row -->
</template>
<template v-else-if="phaseStatus && phaseStatus.phase === null">
  <!-- coarse cycle state -->
</template>
<template v-else-if="state === 'no_record'">
  <!-- empty state -->
</template>
```

The coarse cycle branch should:

- render `page.heroCard.statusFrame.text`
- render `page.heroCard.statusFrame.phaseStatus.hint`
- reuse the current neutral hero styling
- skip phase-specific icon selection

**Step 4: Run the page-status test to verify it passes**

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: PASS

**Step 5: Commit the hero rendering update**

```bash
git add frontend/pages/menstrual/home.vue frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
git commit -m "feat(frontend): render coarse cycle state in menstrual hero"
```

---

## Task 4: Final Verification And Contract Drift Check

**Files:**
- Read: `docs/design/menstrual/function-phase-status.md`
- Read: `docs/design/menstrual/frontend-phase-status.md`
- Read: `docs/design/menstrual/function-home.md`
- Read: `docs/design/menstrual/frontend-home.md`

**Step 1: Run focused frontend tests**

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: PASS

**Step 2: Run the broader menstrual frontend test slice**

```bash
node --test frontend/components/menstrual/__tests__/*.test.mjs frontend/pages/menstrual/__tests__/*.test.mjs
```

Expected: PASS. If the shell expands poorly on Windows, run the two directories as separate commands or use PowerShell path enumeration.

**Step 3: Manually audit the implementation against the frozen contracts**

Verify:

- out-of-period fine-grained phases anchor to `predictionSummary.predictedStartDate`
- `黄体期前7天` remains a flag, not a fifth phase
- historical-data-but-no-prediction case renders `记录中 / 记录更多以生成预测`
- no-history case still renders `暂无记录`
- hero `下次` range and phase classification now follow the same prediction source

**Step 4: Run @superpowers:verification-before-completion discipline**

Before claiming success, record the exact test commands run and whether they passed. Do not infer success from partial output.

**Step 5: Commit the verification pass if any final test-only adjustments were required**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs frontend/pages/menstrual/home.vue frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
git commit -m "test(frontend): verify phase prediction anchor and coarse fallback"
```

Skip this commit if Task 4 required no code or test-file changes.

---

## Completion Criteria

- [ ] `computePhaseStatus(...)` uses `predictionSummary.predictedStartDate` as the primary out-of-period phase anchor
- [ ] `ovulationCenterDate` is derived as `predictedStartDate - 14` whenever prediction data exists
- [ ] `经期 > 排卵期 > 卵泡期 > 黄体期` priority remains intact
- [ ] `黄体期前7天` stays represented by `isLutealLate`, not by a fifth `phase`
- [ ] missing fine-grained prediction data no longer defaults to `卵泡期`
- [ ] historical-data coarse fallback renders `记录中 / 记录更多以生成预测`
- [ ] no-history empty state still renders `暂无记录`
- [ ] hero coarse fallback uses neutral styling and does not look like an exception
- [ ] adapter and hero tests pass
- [ ] broader menstrual frontend test slice passes
