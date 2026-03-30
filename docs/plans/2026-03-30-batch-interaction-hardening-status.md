# Batch Interaction Hardening Status

**Date:** 2026-03-30

## Purpose

This document records the current verification state of the `menstrual/home` batch interaction model and lists the remaining hardening items with their product semantic decisions.

It is intended to make the state explicit so that future work can continue from a clear baseline, not from undocumented assumptions.

## What Is Already Verified

The following batch behaviors are covered by the live H5 regression in `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`:

| Behavior | Test | Notes |
|---|---|---|
| Long-press activates batch mode (≥500 ms) | `menstrual home batch live regression` | Desktop mouse, timer-based |
| Short press does not activate batch | same | Verified by cancel after short hold |
| Drag extend: anchor → next cell → further | same | Steps 3 to avoid missed events |
| Drag retract: move back to anchor | same | Selection shrinks as expected |
| Drag toggle: cells outside the anchor/cursor path deselect | same | Key semantic: only anchor and cursor endpoint are selected |
| Cancel clears batch state and restores panel | same | Cancel button re-enters single-day mode |
| Save writes the correct range and triggers refresh | same | Saves to cursor end, not anchor start if retracted |
| Previous single-day selection does not override batch cursor | `previous single-day selection does not override the latest batch path day` | Regression for a specific selection state conflict |

Unit contract tests in `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs` additionally cover the key ordering rules and toggle logic for programmatic paths.

## Product Semantics That Are Now Frozen

These were ambiguous or debated during implementation and are now resolved:

### Selection model: anchor + cursor, not linear fill

When the user drags from anchor A to cursor C, the selection is not a filled range A..C. Instead, the selection algorithm toggles keys cumulatively as the cursor moves. Only the anchor and the cells the cursor has visited are in the selection.

**Why this matters:** If the user drags from A to B to C then back to B, C is still selected but B is deselected. The visible selection at cursor B is {A, C}. This differs from a naive "fill between anchor and cursor" model.

**Decision:** Keep the cursor-trail model. It matches the existing live tests and is the implemented behavior. Any future change to a "fill between endpoints" model would be a breaking product change.

### Batch save: saves the full current selection, not just the range between anchor and cursor

`applyBatchAction` computes ranges from `selectedBatchKeys`, which is the full accumulated selection state, not just the start-end bounds.

**Decision:** This is correct. The batch path writes what is visually selected.

### cancel: full state reset

Cancel clears `batchStartKey`, `batchEndKey`, `batchHoveredKey`, and `batchSelectedKeysState`. The panel reverts to single-day mode showing the last `activeDate`.

**Decision:** Confirmed by live test. No partial state is retained after cancel.

## Remaining Hardening Items (Not Yet Verified)

These are NOT blocking the first MVP (they are listed as non-blocking in `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`) but should be addressed before declaring the home interaction fully stable.

### H1: Cross-week drag continuity

**What it is:** User starts a long-press on a cell in week 1, then drags across the week boundary into week 2.

**Current state:** Not explicitly tested. The hit-test uses `getBoundingClientRect` on all visible cells at drag start, so cross-week dragging should work if the rects are correctly captured at `mousedown`. No known bug, but no test.

**Required semantic decision before writing the test:** Is a cross-week selection valid? If yes, what is the maximum range? Current code has no explicit limit.

**Recommended semantic:** Allow cross-week selection up to the visible 21-day window. No artificial cap needed.

### H2: Future-boundary interaction

**What it is:** The user tries to include a future date cell (after `today`) in a batch selection. Future cells have `selectable: false`.

**Current state:** `handlePointerMove` guards `cell.selectable !== false` before emitting `batch-extend`. So the cursor cannot extend into future cells. But the visual state (which cells have `--selected`) may look confusing if the cursor hovers over a future cell while already extending.

**Required semantic decision:** Should the selection stop at the last selectable cell when the cursor enters a future cell, or should it hold the last valid state?

**Recommended semantic:** Hold the last valid selectable state. Do not extend or retract when hovering over a non-selectable cell.

**Status:** This is the implemented behavior (the guard simply does not emit `batch-extend`). Need a test to prove it.

### H3: Cancel recovery and panel restoration

**What it is:** After cancel, the panel should show the correct `activeDate` and not leave stale batch-mode UI.

**Current state:** Verified by the live test's cancel path (`Cancel button` click after a short hold). The long full-cancel path (drag then cancel) is not explicitly tested as a full regression item.

**Required action:** Add a sub-case to the live regression that performs a full drag-save sequence followed by a drag-cancel sequence, and confirms the panel restores correctly.

### H4: Fast pointer toggling

**What it is:** The user moves the cursor quickly back and forth over the same cells several times within a single drag. The selection state should remain consistent.

**Current state:** No test. The `toggleBatchSelectionKey` function adds or removes a key based on whether it is already in the set. If the cursor visits the same cell twice, it toggles twice (net: no change). This is correct for slow movement but may produce unexpected state under real-world fast swipes if pointer events fire out of order or are coalesced.

**Required semantic decision:** Is a cell that has been visited and toggled twice (back to unselected) expected to be unselected at save? Yes — consistent with toggle model.

**Status:** No test exists. Low risk for non-real-time weighting on H5 drag. Highest risk on WeChat Mini Program touch events. Defer until Mini Program validation.

## Next Actions

1. Add a cross-week drag test (H1) once the visible window spans multiple weeks reliably.
2. Add a future-boundary hold test (H2) using a setup where today is mid-window.
3. Expand the cancel recovery test (H3) to cover drag-then-cancel.
4. Defer H4 until WeChat Mini Program touch behavior is validated.
