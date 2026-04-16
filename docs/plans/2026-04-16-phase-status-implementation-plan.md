# Phase Status Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the menstrual Hero area from binary `经期第N天 / 非经期` to a four-phase cycle model (`卵泡期 / 排卵期 / 黄体期 / 经期`) with an inline hint layer, amber emphasis for high-attention phases, and a prediction reliability warning.

**Design contracts:**
- [`docs/design/menstrual/function-phase-status.md`](../design/menstrual/function-phase-status.md)
- [`docs/design/menstrual/frontend-phase-status.md`](../design/menstrual/frontend-phase-status.md)

**Architecture:** Extend the existing `home-contract-adapter.js` with a pure phase computation function. Add a `PhaseStatusViewModel` type. Update `StatusHeroCard` (or its slot in `home.vue`) to consume the view-model and render the new two-group status row. No backend changes required for MVP — all phase logic derives from existing menstrual module settings and period records already loaded on the home page.

**Tech Stack:** uni-app Vue 3 SFCs, existing SCSS token system, existing menstrual frontend service layer, node --test frontend tests.

---

## Task 1: Verify design contracts

**Files:**
- Read: `docs/design/menstrual/function-phase-status.md`
- Read: `docs/design/menstrual/frontend-phase-status.md`
- Read: `docs/design/menstrual/frontend-home.md`

**Step 1: Confirm the PhaseStatusViewModel shape**

The adapter output must match the shape defined in `frontend-phase-status.md`:

```js
{
  phase: '卵泡期' | '排卵期' | '黄体期' | '经期',
  isLutealLate: boolean,
  emphasis: boolean,
  hint: string,
  showReliabilityWarning: boolean,
  daysUntilNextPeriod: number | null
}
```

Confirm no conflicts with existing home adapter output fields before proceeding.

**Step 2: Only patch docs if a real contract gap is found**

Do not restate design inside this plan.

---

## Task 2: Add phase computation tests in contract adapter

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Modify or create: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

**Step 1: Write failing tests for phase computation**

Cover:

- today inside period segment → `phase: '经期'`
- today in follicular window → `phase: '卵泡期'`, `emphasis: false`
- today in ovulation window (cycle_length − 14 ± 2) → `phase: '排卵期'`, `emphasis: true`
- today in early luteal → `phase: '黄体期'`, `isLutealLate: false`, `emphasis: false`
- today in luteal last 7 days → `phase: '黄体期'`, `isLutealLate: true`, `emphasis: true`
- records < 3 → `showReliabilityWarning: true`
- hint with `{n}` variable → resolved to `daysUntilNextPeriod`

Use fixed dates and settings inputs to assert exact outputs.

**Step 2: Run tests to verify they fail**

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: FAIL

**Step 3: Implement `computePhaseStatus(homeReadModel)` in the adapter**

Add a pure function that accepts the home read model and returns `PhaseStatusViewModel`.

Phase boundary rules from `function-phase-status.md`:

- ovulation window: `lastPeriodStartDate + cycleLengthDays − 14 ± 2`
- luteal late threshold: `nextPredictedStartDate − 7`
- reliability trigger: `periodRecordCount < 3`

**Step 4: Run tests to verify they pass**

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "frontend(menstrual): add phase status computation to home contract adapter"
```

---

## Task 3: Update hero status rendering in home.vue

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Read: `frontend/components/menstrual/home-contract-adapter.js`
- Read: `docs/design/menstrual/frontend-phase-status.md`

**Step 1: Write failing component rendering test**

Assert that when `phaseStatus.phase === '排卵期'`:

- phase group renders with amber pill class
- phase name renders with amber text color token
- card container renders with warm background token
- hint text renders after phase name (not at far right)

Assert that when `phaseStatus.phase === '卵泡期'`:

- phase group has no pill background
- phase name uses primary text color
- card uses white background

Assert that when `phaseStatus.showReliabilityWarning === true`:

- reliability `!` button is rendered inline with phase name

**Step 2: Run test to verify it fails**

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: FAIL

**Step 3: Implement the updated hero status section**

In `home.vue`, replace the existing `非经期 / 经期第N天` text block with the new two-group status row:

```
statusRow
  └─ phaseGroup (pill when emphasis)
       ├─ phase_icon (asset per phase)
       └─ phase_name
  └─ hintGroup
       ├─ warning_icon
       └─ hint_text
```

Apply SCSS tokens:

- Amber emphasis: use `$color-accent-detail` for text; `#FBF0D8` for pill bg (add as local token or inline)
- Card warm bg: `#FFFDF8` with `$color-border-subtle` override to `#E8D5A3` for amber states

Use `v-if` / `:class` bindings driven by `phaseStatus.emphasis` and `phaseStatus.isLutealLate`.

The `经期第N天` state retains its existing icon and layout — only the non-period branch changes.

**Step 4: Run test to verify it passes**

```bash
node --test frontend/pages/menstrual/__tests__/home-phase-status.test.mjs
```

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "frontend(menstrual): render phase status in hero with amber emphasis"
```

---

## Task 4: Wire hint rotation and variable resolution

**Files:**
- Create: `frontend/components/menstrual/phase-hint-rotation.js`
- Create: `frontend/components/menstrual/__tests__/phase-hint-rotation.test.mjs`

**Step 1: Write failing tests**

Cover:

- each phase returns a string from its hint set
- `{n}` in hint text is replaced with `daysUntilNextPeriod`
- rotation is session-stable (same call returns same hint within a session)
- rotation advances to next hint on subsequent calls past the session boundary (can be simulated with a seeded counter)

**Step 2: Run tests to verify they fail**

```bash
node --test frontend/components/menstrual/__tests__/phase-hint-rotation.test.mjs
```

Expected: FAIL

**Step 3: Implement `resolveHint(phase, isLutealLate, daysUntilNext)`**

Hint sets per phase (initial MVP):

```js
{
  '经期':        ['注意休息'],
  '卵泡期':      ['状态逐渐恢复'],
  '排卵期':      ['精力可能较好'],
  '黄体期_early': ['注意身体变化'],
  '黄体期_late':  ['月经可能临近', '还有 {n} 天经期']
}
```

Use `uni.getStorageSync` / `uni.setStorageSync` for persistence — **do not use `localStorage` or `sessionStorage`**, which are browser-only and unavailable in the WeChat mini program runtime.

Session boundary detection: on app launch, read a session token from `uni.getStorageSync('menstrual_hint_session')` and compare against a value set in memory. If they differ (new session), increment the rotation index for each phase and write the new token.

Key naming: `menstrual_hint_idx_{phase}` (e.g. `menstrual_hint_idx_排卵期`).

**Step 4: Run tests to verify they pass**

```bash
node --test frontend/components/menstrual/__tests__/phase-hint-rotation.test.mjs
```

Expected: PASS

**Step 5: Wire into adapter and home.vue**

Pass `resolveHint(...)` output as the `hint` field on `PhaseStatusViewModel` inside the adapter. The component renders it as-is.

**Step 6: Commit**

```bash
git add frontend/components/menstrual/phase-hint-rotation.js frontend/components/menstrual/__tests__/phase-hint-rotation.test.mjs frontend/components/menstrual/home-contract-adapter.js
git commit -m "frontend(menstrual): add hint rotation and variable resolution for phase status"
```

---

## Task 5: Add reliability warning button and modal

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Create or modify: `frontend/components/menstrual/__tests__/home-phase-status.test.mjs`

**Step 1: Write failing test**

Assert:

- when `showReliabilityWarning: true`, a `!` button renders next to the phase name
- tapping `!` opens a modal with reliability copy
- modal can be dismissed

**Step 2: Run test to verify it fails**

Expected: FAIL

**Step 3: Implement reliability `!` button**

- Inline `!` button (small, muted, pill shape) placed after phase name text
- On tap: show a `uni.showModal` or a lightweight local bottom sheet with copy:
  > 当前预测基于较少记录，随着记录次数增加会更准确

**Step 4: Run test to verify it passes**

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/components/menstrual/__tests__/home-phase-status.test.mjs
git commit -m "frontend(menstrual): add prediction reliability warning indicator to hero"
```

---

## Task 6: Update function-home.md to reflect phase status

**Files:**
- Modify: `docs/design/menstrual/function-home.md`
- Modify: `docs/design/menstrual/frontend-home.md`

**Step 1: Add phase status to Hero Behavior section in function-home.md**

Add a paragraph under `## Hero Behavior`:

- when today is outside the latest period segment, the hero now shows the current cycle phase (`卵泡期 / 排卵期 / 黄体期`) instead of `非经期`
- phase is derived from `lastPeriodStartDate`, `defaultCycleLengthDays`, and `defaultPeriodDurationDays`

**Step 2: Update Status Frame section in frontend-home.md**

Replace the MVP states list:

```
- `经期第<N>天`
- `非经期`
```

with:

```
- `经期第<N>天`
- `卵泡期` (with hint)
- `排卵期` (with amber emphasis + hint)
- `黄体期` (with hint; amber emphasis when within 7 days of next period)
```

**Step 3: Commit**

```bash
git add docs/design/menstrual/function-home.md docs/design/menstrual/frontend-home.md
git commit -m "docs: update home design contracts for phase status feature"
```

---

## Completion Criteria

- [ ] `computePhaseStatus` returns correct phase for all five cases (period / follicular / ovulation / luteal-early / luteal-late)
- [ ] amber pill and amber text apply for `排卵期` and `黄体期 · 前7天`
- [ ] neutral white card for `卵泡期` and `黄体期 · 早段`
- [ ] hint text renders inline after phase name, left-aligned, with 16px gap
- [ ] hint with `{n}` resolves to `daysUntilNextPeriod`
- [ ] hint rotation is session-stable
- [ ] `!` button renders when `periodRecordCount < 3`
- [ ] `!` modal shows reliability copy
- [ ] `经期第N天` state is visually unchanged
- [ ] `上次` / `下次` reference row is visually unchanged
- [ ] all unit tests pass
- [ ] home and function docs updated
