# Batch Grid Period Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render the batch selection result directly on the calendar grid before save so the user can see whether the selected dates will become period or non-period.

**Architecture:** Keep the preview fully local to the frontend. `home.vue` continues to own batch selection and `batchDraft.isPeriod`, while `CalendarGrid.vue` receives a small preview prop and derives an effective preview variant only for the currently selected batch range. This avoids backend preflight calls and keeps latency at the Vue render level only.

**Tech Stack:** uni-app Vue 3 SFCs, node:test

---

### Task 1: Lock The Preview Contract In Tests

**Files:**
- Modify: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`

**Step 1: Write the failing test**

Add focused tests for `CalendarGrid.effectiveVariant` that assert:
- selected batch cells render as `selectedPeriod` / `selectedTodayPeriod` when batch preview is period
- selected batch cells render as `selected` / `selectedToday` when batch preview is clear
- non-selected cells remain on their original variant

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected: FAIL because `CalendarGrid` does not yet understand batch period preview.

**Step 3: Write minimal implementation**

Only after the failing expectation is in place, add the smallest prop + variant logic needed to satisfy the tests.

**Step 4: Run test to verify it passes**

Run the same command.  
Expected: PASS.

### Task 2: Thread The Batch Preview Into CalendarGrid

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/components/menstrual/CalendarGrid.vue`

**Step 1: Add the preview prop at the callsite**

In `home.vue`, pass a nullable preview flag to `CalendarGrid`:
- batch mode -> `batchDraft.isPeriod`
- non-batch mode -> `null`

**Step 2: Normalize and preview base variants**

In `CalendarGrid.vue`:
- normalize selected variants back to their base semantic variant
- apply batch preview only for `selectedKeys`
- reapply selected overlay after preview semantics are computed

**Step 3: Keep scope narrow**

Do not preview:
- note state
- detail marker state
- summary chips

Only preview the period/non-period semantic family on grid cells.

**Step 4: Run targeted verification**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs
```

Expected: PASS.

### Task 3: Verify Behavior And Prepare Handoff

**Files:**
- No required source changes unless verification finds issues

**Step 1: Verify there is no backend dependency**

Confirm the preview uses only local batch state and does not add API calls.

**Step 2: Verify interaction expectations**

Check:
- period preview flips immediately when toggling the batch period chip
- clear preview removes period styling immediately
- drag extension updates preview range continuously

**Step 3: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/components/menstrual/CalendarGrid.vue frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs docs/plans/2026-04-02-batch-grid-period-preview-implementation-plan.md
git commit -m "feat(frontend): preview batch period result on calendar grid"
```
