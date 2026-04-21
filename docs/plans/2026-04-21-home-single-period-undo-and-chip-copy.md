# Home Single Period Undo And Chip Copy Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

## 2026-04-21 Bridge Undo Semantics Addendum

### Problem

The initial scoped-undo design treated undo as "dispatch the reverse single-day semantic action for the currently selected date".

That shortcut is not stable for bridge scenarios.

Example:

- previous state: `2026-04-16` to `2026-04-21`
- user taps `2026-04-13` and confirms backward bridge
- resulting state becomes `2026-04-13` to `2026-04-21`
- expected undo result is the exact previous state: `2026-04-16` to `2026-04-21`

Likewise:

- previous state: `2026-04-13` to `2026-04-17`
- user taps `2026-04-20` and confirms forward bridge
- resulting state becomes `2026-04-13` to `2026-04-20`
- expected undo result is the exact previous state: `2026-04-13` to `2026-04-17`

The problem is that the selected day's post-mutation role no longer describes "how to get back to the previous state":

- after `bridge-backward`, the tapped day becomes the segment start
- after `bridge-forward`, the tapped day becomes the segment end
- after `bridge-both`, the tapped day may become an interior date in the merged segment

So "re-resolve the chip and run the opposite semantic action" is not equivalent to "undo the previous mutation".

### Decision

For home scoped undo, bridge success must undo to the immediately previous persisted state.

More precisely:

- undo for a successful bridge removes only the dates introduced by that bridge
- undo must preserve the original segment that existed before the bridge
- undo semantics are mutation-relative, not selected-date-role-relative

This means:

- `16-21` -> tap `13` -> confirm bridge -> `13-21` -> undo => `16-21`
- `13-17` -> tap `20` -> confirm bridge -> `13-20` -> undo => `13-17`

### Product Rule

Home scoped undo is defined as:

- "restore the state that existed immediately before the latest successful supported single-day mutation"

It is not defined as:

- "dispatch the reverse action implied by the selected day's current chip role"

### Contract Direction

The current frontend-local undo payload approach is acceptable only if it can fully express the inverse of the just-applied mutation.

For bridge outcomes, the undo payload must be derived from the applied effect, not from the current resolved chip role.

Minimum contract-level requirement:

- successful single-day mutation responses must provide enough information to reconstruct the inverse mutation safely

The preferred long-term contract direction is one of these:

1. backend returns `inverseEffect` or `undoPayload` directly with the apply success result
2. backend exposes a dedicated undo command that accepts a mutation-scoped payload/token

The anti-goal is:

- guessing undo from `start / revoke-start / end-here / noop` alone after the mutation has already changed segment topology

### Frontend Responsibility

The home page may still own:

- the temporary floating undo affordance
- replacement behavior
- 2-second expiry
- dismiss-on-background-tap behavior

But the home page should no longer own the semantic inference of "what previous state should be restored" for bridge outcomes by re-reading the current selected date role alone.

### Backend Responsibility

The backend should remain the source of truth for:

- what dates were written
- what dates were cleared
- what segment topology existed before and after the mutation
- what inverse mutation is valid

This is especially important for:

- backward bridge
- forward bridge
- two-sided bridge
- stale apply / concurrency revalidation

### Recommended Implementation Shape

Recommended direction:

1. `applySingleDayPeriodAction` success returns:
   - `effect`
   - `affectedScopes`
   - `inverseEffect` or equivalent `undoPayload`
2. frontend stores that payload in `pendingUndoAction`
3. undo submits the stored inverse payload instead of inferring a reverse semantic action from the selected day
4. undo success refreshes calendar/day-detail/prediction through the existing scoped refresh path

If a dedicated undo command is introduced, it should still be mutation-scoped and short-lived in frontend usage; no durable history system is implied.

### Acceptance Criteria

The design is only correct if all of these pass:

- `16-21` + backward bridge at `13` + undo => `16-21`
- `13-17` + forward bridge at `20` + undo => `13-17`
- bridge undo does not clear the entire merged segment unless the entire merged segment was newly created by the just-applied mutation
- bridge undo does not depend on the selected day's post-mutation chip copy
- home undo remains page-scoped, temporary, and non-persistent

### Out Of Scope

- global undo/redo
- cross-page history
- batch-mode undo
- note/attribute undo
- persistent mutation history UI

**Goal:** Add scoped undo support for exactly three successful single-period command scenarios on the home page, and update the period chip copy rules for the selected-date panel.

**Architecture:** Keep undo entirely in the home page interaction layer instead of turning it into a global history system. Reuse the existing single-period command flow, but only expose a temporary floating undo action after backend success for three supported scenarios: `记录月经` from a non-period date, `取消经期` from the first period day, and single-day bridge actions from previous/next period direction. The adapter remains the source of chip copy rules; the page owns temporary undo state, expiry, and undo command dispatch.

**Tech Stack:** uni-app Vue 3, home page adapter/service command flow, Node built-in test runner (`node --test`)

---

### Task 1: Update chip copy rules in the adapter

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Test: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

**Step 1: Write the failing tests**

Add or update focused assertions for these rules:

```js
assert.equal(model.selectedDatePanel.periodChipText, '记录月经');
assert.equal(model.selectedDatePanel.periodChipText, '取消经期');
assert.equal(model.selectedDatePanel.periodChipText, '月经结束');
```

Cover:
- non-period selected day -> `记录月经`
- first day of a period -> `取消经期`
- non-first-day existing period cases stay unchanged

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: FAIL on the new period chip text assertions.

**Step 3: Write minimal implementation**

Adjust the chip text derivation helpers in `home-contract-adapter.js`:
- `deriveSingleDayPeriodChip(...)`
- `deriveChipFromPeriodDates(...)`

Rules:
- when the selected day is not period: return `{ text: '记录月经', selected: false }`
- when the selected day is a period start day: return `{ text: '取消经期', selected: true, ... }`
- keep the existing labels for later-in-segment cases

Do not widen scope to batch mode or other chip semantics.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: PASS with updated chip copy assertions.

**Step 5: Commit**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "feat: update home period chip copy rules"
```

### Task 2: Define supported undo payload shape and page state

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Test: `frontend/pages/menstrual/__tests__/home-phase-status.test.mjs`

**Step 1: Write the failing source test**

Add source-inspection assertions for a home-page undo state and floating action anchors:

```js
assert.match(source, /pendingUndoAction:/);
assert.match(source, /menstrual-home__undo-float/);
assert.match(source, /scheduleUndoExpiry/);
assert.match(source, /clearPendingUndoAction/);
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: FAIL because the undo state and floating button do not exist yet.

**Step 3: Write minimal implementation**

In `frontend/pages/menstrual/home.vue`, add:
- `pendingUndoAction: null`
- one expiry timer field
- helper methods:
  - `isSupportedSinglePeriodUndoAction(...)`
  - `createPendingUndoAction(...)`
  - `showPendingUndoAction(...)`
  - `scheduleUndoExpiry(...)`
  - `clearPendingUndoAction(...)`

Add a bottom floating button shell in the template:

```vue
<view v-if="pendingUndoAction" class="menstrual-home__undo-float" @tap="handleUndoTap">
	<text class="menstrual-home__undo-float-label">撤回</text>
</view>
```

Add basic styles only for position, spacing, and visibility. Do not wire behavior yet.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: PASS with the new source anchors present.

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
git commit -m "feat: scaffold home undo floating action state"
```

### Task 3: Capture undo only for the three supported successful single-period scenarios

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Test: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`

**Step 1: Write the failing tests**

Add focused tests around the single-period command flow to verify:
- supported scenario success stores a pending undo action
- unsupported single-period outcomes do not create undo state
- batch operations never create undo state

Use existing home-page test harness patterns from the batch-selection contract tests instead of inventing a new harness.

Representative assertion targets:

```js
assert.equal(ctx.pendingUndoAction.undoAction.action, 'clear-record');
assert.equal(ctx.pendingUndoAction.visible, true);
assert.equal(ctx.pendingUndoAction, null);
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected: FAIL because supported undo capture is not implemented.

**Step 3: Write minimal implementation**

In `home.vue`, hook undo creation only after backend success in the single-period command path:
- `handleTogglePeriod`
- `handleSingleDayPeriodAction`
- any bridge-confirm path that ultimately dispatches the same single-period command

Implementation rules:
- show undo only after backend success
- only support these scenarios:
  - non-period -> record period
  - first-day period -> cancel period
  - previous/next bridge flows that end in a single-period command
- explicitly skip:
  - batch mode
  - note/attribute changes
  - other mutations

Persist enough undo metadata to execute the reverse command later:
- original selected date
- reverse `action`
- any command parameters needed by the single-period command service
- a lightweight key/timestamp for replacement and expiry

**Step 4: Run test to verify it passes**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected: PASS for the new supported/unsupported undo cases.

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
git commit -m "feat: capture undo after supported single period commands"
```

### Task 4: Execute the undo command and clear temporary state

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Test: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`

**Step 1: Write the failing tests**

Add tests for:
- clicking `撤回` dispatches the reverse single-period command
- undo success clears the floating action and refreshes page state
- undo failure clears or closes the undo affordance and shows a toast
- starting a new supported undo action replaces the previous one

Representative assertions:

```js
assert.deepEqual(commandCalls.at(-1), { action: 'clear-record', ... });
assert.equal(ctx.pendingUndoAction, null);
assert.equal(toastCalls.at(-1).title, '撤回失败');
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected: FAIL because `handleUndoTap` and expiry semantics are not finished.

**Step 3: Write minimal implementation**

In `home.vue`, add:
- `handleUndoTap`
- busy-guard for duplicate taps
- reverse command dispatch through the same single-period command service
- success path:
  - clear undo state
  - refresh page data using the existing optimistic refresh/reload path
- failure path:
  - clear undo state
  - `uni.showToast({ title: '撤回失败', icon: 'none' })`

Do not add nested undo, redo, or persistence across refreshes.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected: PASS for undo execution and failure handling.

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
git commit -m "feat: add home single period undo action"
```

### Task 5: Verify the full scoped feature set

**Files:**
- Verify only: `frontend/components/menstrual/home-contract-adapter.js`
- Verify only: `frontend/pages/menstrual/home.vue`
- Verify only: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`
- Verify only: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
- Verify only: `frontend/pages/menstrual/__tests__/home-phase-status.test.mjs`

**Step 1: Run focused adapter tests**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: PASS

**Step 2: Run focused home-page structure test**

Run:

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: PASS

**Step 3: Run home interaction tests**

Run:

```bash
node --test frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
```

Expected: PASS

**Step 4: Manual verification checklist**

Validate in the app:
- non-period selected day shows `记录月经`
- first period day shows `取消经期`
- later period days keep existing wording
- successful supported single-period command shows a bottom floating `撤回`
- `撤回` disappears after timeout
- batch mode never shows `撤回`
- undo failure does not leave a stuck floating action

**Step 5: Commit final verification-only follow-up if needed**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/pages/menstrual/home.vue frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
git commit -m "test: verify scoped home undo flow"
```
