# Focused Mode Two-Row Implementation Plan

**Goal:** make menstrual home `聚焦模式` use a fixed two-row / fourteen-day window, place the default focused occurrence in the first row, and restore the last user-selected `view type` between `聚焦模式` and `月览` without restoring historical browse position.

**Architecture:** update the long-lived menstrual design contracts first, then adjust the focused-window adapter and page state, then wire view-type memory into the page shell, and finally verify that existing recording and browse semantics remain unchanged under the new two-row layout.

**Tech Stack:** uni-app Vue 3, JavaScript service and adapter modules, Node built-in `node:test`, H5 manual verification

---

## Scope Lock

- Change `聚焦模式` from `3` rows / `21` days to `2` rows / `14` days.
- Change the default focused placement from center-row bias to first-row placement.
- Remember only the last selected `view type`:
  - `聚焦模式`
  - `月览`
- Do not remember:
  - focused occurrence date
  - month browse anchor
  - jump target
  - selected day
- Keep all existing recording, jump, navigation, and batch-edit semantics unchanged.
- Keep `月览` as browse-only.

## Acceptance Criteria

- `聚焦模式` renders a fixed `14` day window across `2` rows.
- Default focused occurrence lands in the first row after initial focus resolution.
- Header navigation still moves by period occurrence, not by natural date range.
- `今天 / 上次 / 下次预测` semantics stay unchanged.
- The page reopens in the last selected `view type`.
- Reopening the page does not restore a historical browse position.
- Switching between views does not regress single-day edit or batch edit behavior.

## Files Expected To Change

- Modify: `docs/design/menstrual/function-calendar.md`
- Modify: `docs/design/menstrual/frontend-calendar.md`
- Modify: `docs/design/menstrual/function-home.md`
- Modify: `docs/design/menstrual/frontend-home.md`
- Modify: `docs/design/menstrual/function-recording-model.md`
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Modify: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/components/menstrual/CalendarGrid.vue`
- Modify: `frontend/components/menstrual/HeaderNav.vue`
- Modify: `frontend/components/menstrual/SegmentedControl.vue`
- Modify if needed: `frontend/components/menstrual/JumpTabs.vue`
- Modify if needed: `frontend/components/menstrual/CalendarLegend.vue`
- Modify or verify: `frontend/services/menstrual/home-contract-service.js`
- Modify or add tests under: `frontend/components/menstrual/__tests__/`
- Modify or add tests under: `frontend/services/menstrual/__tests__/`

## Temporary Working Plan

### Task 1: Align focused-window adapter output to two rows

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Modify: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

**Step 1: Add failing tests**

Cover at least:

- focused window output uses `14` days instead of `21`
- focused occurrence lands in the first row by default
- cross-month labels still derive correctly from the shorter window
- focused navigation targets remain period-occurrence based

**Step 2: Run targeted tests**

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected:

- new tests fail before implementation

**Step 3: Implement adapter changes**

- replace fixed `21` day assumptions with fixed `14` day assumptions
- update default window placement to first-row bias
- keep `previousPeriodStart / nextPeriodStart / prediction boundary` behavior intact

**Step 4: Re-run targeted tests**

Expected:

- adapter tests pass

### Task 2: Add view-type memory without browse-position restore

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify if needed: `frontend/services/menstrual/home-contract-service.js`
- Modify or add tests under the relevant page or service suites

**Step 1: Add failing tests**

Cover at least:

- page initializes from remembered `view type`
- switching view updates the remembered value
- no prior `focusDate`, month anchor, or jump target is restored from that memory

**Step 2: Implement memory wiring**

- read remembered `view type` during page initialization
- write remembered `view type` on user toggle
- keep current browse recomputation rules for whichever view becomes active

**Step 3: Re-run targeted tests**

Expected:

- page or service tests pass

### Task 3: Recompose the focused grid and shell around the two-row window

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/components/menstrual/CalendarGrid.vue`
- Modify: `frontend/components/menstrual/HeaderNav.vue`
- Modify: `frontend/components/menstrual/SegmentedControl.vue`
- Modify if needed: `frontend/components/menstrual/JumpTabs.vue`
- Modify if needed: `frontend/components/menstrual/CalendarLegend.vue`

**Step 1: Update focused grid presentation**

- ensure the focused grid renders `2` rows cleanly
- recompute row dividers, month boundary markers, and spacing for the shorter footprint
- keep the first row reading as the primary focus band

**Step 2: Verify shell components still fit**

- `HeaderNav` remains readable with the updated focused window label rhythm
- `SegmentedControl` reflects remembered active mode on entry
- `JumpTabs` and right-side action area still fit without new affordances
- `CalendarLegend` remains visually balanced under the tighter grid

**Step 3: Preserve editor semantics**

- `SelectedDatePanel` behavior remains unchanged
- batch mode entry/save/cancel behavior remains unchanged
- `月览` remains browse-only

### Task 4: Verification and regression closeout

**Files:**
- Verify: `frontend/components/menstrual/home-contract-adapter.js`
- Verify: `frontend/pages/menstrual/home.vue`
- Verify: relevant tests under `frontend/components/menstrual/__tests__/`
- Verify: relevant tests under `frontend/services/menstrual/__tests__/`

**Step 1: Run automated verification**

Minimum targeted command:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Run any additional targeted page or service tests needed for remembered `view type`.

**Step 2: Manual H5 verification**

Checklist:

1. enter menstrual home with no remembered view and confirm the fallback entry behavior still works
2. switch from `聚焦模式` to `月览`, leave the page, and re-enter
3. confirm the page reopens in `月览`
4. switch back to `聚焦模式`, leave the page, and re-enter
5. confirm the page reopens in `聚焦模式`
6. in `聚焦模式`, confirm the grid shows `2` rows / `14` days
7. confirm the default focused occurrence lands in the first row
8. confirm `今天 / 上次 / 下次预测` still navigate correctly
9. confirm single-day tap editing still works
10. confirm batch selection still works
11. confirm `月览` still blocks editing affordances

**Step 3: Record remaining gaps**

If still unverified, explicitly note:

- WeChat DevTools not verified
- true-device not verified

## Stop Conditions

- stop only if current code reveals a hidden dependency on `21` day window semantics that cannot be updated without changing product behavior outside this agreed scope
- stop only if existing view-memory implementation conflicts with the new requirement to remember view type but not browse position
