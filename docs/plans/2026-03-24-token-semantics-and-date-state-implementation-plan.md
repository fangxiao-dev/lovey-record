# Token Semantics And Date State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify menstrual token semantics in `2026-03-22-design-tokene.pen`, remove semantic hard-coding drift, and make date-state examples reusable for component-library composition.

**Architecture:** Apply a strict token-first sequence: normalize token resources in `TokFd01`, then stabilize reusable date-state primitives (`t33PT` lineage), then propagate references into `CmpLib1` and `CmpCal1`. Keep display-board flexibility, but enforce semantic consistency across name/hex/swatch and across Token Foundations vs Component Library.

**Tech Stack:** Pencil `.pen` document model, Pencil MCP tools (`batch_get`, `batch_design`, `get_variables`, `set_variables`, `get_screenshot`, `search_all_unique_properties`).

---

### Task 1: Baseline Audit And Safety Snapshot

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen`
- Reference: `docs/plans/2026-03-24-token-semantics-and-date-state-design.md`

**Step 1: Record baseline variable map**

Run: `pencil_get_variables(filePath=docs/design-drafts/2026-03-22-design-tokene.pen)`
Expected: includes `color.accent.prediction`, `color.accent.period.soft`, `color.support.info`, `color.text.support`.

**Step 2: Record baseline nodes for drift checks**

Run: `pencil_batch_get(nodeIds=["TokA012","rAtbZ","gmmIk","t33PT","CmpLib1","CmpCal1"], readDepth=6)`
Expected: see duplicate `special` in `TokA012` and mismatched support/prediction displays.

**Step 3: Record baseline screenshots**

Run: `pencil_get_screenshot(nodeId="TokFd01")` and `pencil_get_screenshot(nodeId="t33PT")`
Expected: baseline images saved for visual diff.

**Step 4: Commit checkpoint (optional, only when asked)**

If requested:
`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "chore: snapshot baseline before token semantic refactor"`

### Task 2: Merge Prediction Resource Into Period Soft Resource

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen`

**Step 1: Write failing semantic assertion (manual check)**

Rule to enforce: resource layer must not keep independent prediction color token.

**Step 2: Verify failure exists before edit**

Run: `pencil_get_variables(...)`
Expected: FAIL rule because `color.accent.prediction` exists.

**Step 3: Minimal implementation**

- Update variable table with `pencil_set_variables` so:
  - remove `color.accent.prediction`
  - keep `color.accent.period.soft`
  - keep support colors under `color.support.*`
- Update affected node references from `$color.accent.prediction` to `$color.accent.period.soft`.

**Step 4: Verify pass**

Run: `pencil_get_variables(...)`
Expected: no `color.accent.prediction`; references resolve without missing variable warnings.

**Step 5: Commit checkpoint (optional, only when asked)**

`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "refactor: merge prediction color resource into period soft token"`

### Task 3: Fix Accent Controls Semantic Board Drift

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen` (nodes `TokA010`, `TokA012`, `TokA016`, `rAtbZ`)

**Step 1: Write failing semantic checks**

- No duplicate `special` entries in `TokA012`
- No blue block labeled `special`
- `prediction` appears as business-state label mapping to `period.soft`

**Step 2: Verify failure exists before edit**

Run: `pencil_batch_get(nodeIds=["TokA010","TokA012","rAtbZ"], readDepth=5)`
Expected: duplicate `special` and incorrect label/value pair present.

**Step 3: Minimal implementation**

- Remove or relabel the duplicate blue `special` item (`NQURu`) into support presentation outside accent list.
- Correct `accent.prediction` card text so it no longer displays `period.soft` as duplicated label.
- Update hint copy (`TokA016`) to match final semantics exactly.

**Step 4: Verify pass**

Run: `pencil_batch_get(nodeIds=["TokA010","TokA012","rAtbZ"], readDepth=5)`
Expected: unique semantic items only; hint and cards consistent.

**Step 5: Commit checkpoint (optional, only when asked)**

`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "fix: align accent controls with token semantics"`

### Task 4: Repair Text Support Name/Hex/Swatch Consistency

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen` (node `gmmIk`)

**Step 1: Write failing semantic check**

`text.support` title color, displayed hex, and effective swatch mapping must resolve to same support semantic.

**Step 2: Verify failure exists before edit**

Run: `pencil_batch_get(nodeIds=["gmmIk"], readDepth=4, resolveVariables=true)`
Expected: hex text mismatches support semantic.

**Step 3: Minimal implementation**

- Set title fill to `$color.text.support`.
- Set hex text content to the resolved support value.
- Ensure parent swatch row still represents text token board conventions.

**Step 4: Verify pass**

Run: `pencil_batch_get(nodeIds=["gmmIk"], readDepth=4, resolveVariables=true)`
Expected: name/hex/swatch all aligned to support semantics.

**Step 5: Commit checkpoint (optional, only when asked)**

`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "fix: make text support token display internally consistent"`

### Task 5: Promote Date States Into Reusable Token-Level Primitives

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen` (node `t33PT` and descendants)

**Step 1: Write failing structural check**

All 5 date states should be reusable primitives with stable naming and shared semantics.

**Step 2: Verify failure exists before edit**

Run: `pencil_batch_get(nodeIds=["t33PT"], readDepth=6)`
Expected: only subset has `reusable: true`; naming not fully normalized.

**Step 3: Minimal implementation**

- Normalize names:
  - `date-special`
  - `date-prediction`
  - `date-normal`
  - `date-period`
  - `date-selected-today`
- Ensure all are reusable or assembled from reusable base/variants.
- Keep order exactly: special/prediction/normal/period/selected(today).
- Keep selected-today stroke mapped to today semantic (allowed same-value alias).

**Step 4: Verify pass**

Run: `pencil_batch_get(nodeIds=["t33PT"], readDepth=6)` and `pencil_get_screenshot(nodeId="t33PT")`
Expected: 5-state strip is visually intact and semantically reusable.

**Step 5: Commit checkpoint (optional, only when asked)**

`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "feat: define reusable token-level date state primitives"`

### Task 6: Replace Semantic Hard-Coded Colors In Component Library

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen` (areas under `CmpLib1`, especially `CmpCal1`)

**Step 1: Write failing check**

Component-library state visuals must resolve from `$color.*` semantic tokens, not raw hex codes.

**Step 2: Verify failure exists before edit**

Run: `pencil_search_all_unique_properties(parents=["CmpLib1"], properties=["fillColor","strokeColor","textColor"])`
Expected: direct semantic hex values remain in state nodes.

**Step 3: Minimal implementation**

- Replace state-related hard-coded fills/strokes/text colors with semantic variable refs.
- Keep non-semantic decorative/neutral display values only where intentional.
- Prioritize `Composite/CalendarGrid` and `Primitive/CalendarLegend` alignment.

**Step 4: Verify pass**

Run:
- `pencil_batch_get(nodeIds=["CmpCal1"], readDepth=6, resolveVariables=false)`
- `pencil_get_screenshot(nodeId="CmpCal1")`
Expected: color references are tokenized; visuals unchanged in intent.

**Step 5: Commit checkpoint (optional, only when asked)**

`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "refactor: tokenise component library state colors"`

### Task 7: End-To-End Consistency Verification

**Files:**
- Modify: `docs/design-drafts/2026-03-22-design-tokene.pen` (if final fixes needed)
- Reference: `docs/plans/2026-03-24-token-semantics-and-date-state-design.md`

**Step 1: Run structural consistency checks**

Run: `pencil_batch_get(nodeIds=["TokFd01","TokA012","gmmIk","t33PT","CmpCal1"], readDepth=6, resolveVariables=true)`
Expected: no semantic drift in key boards.

**Step 2: Run property audit**

Run: `pencil_search_all_unique_properties(parents=["TokFd01","CmpLib1"], properties=["fillColor","strokeColor","textColor"])`
Expected: no unexpected semantic hard-coded values remain.

**Step 3: Run screenshot QA**

Run:
- `pencil_get_screenshot(nodeId="TokFd01")`
- `pencil_get_screenshot(nodeId="TokA010")`
- `pencil_get_screenshot(nodeId="t33PT")`
- `pencil_get_screenshot(nodeId="CmpCal1")`
Expected: no duplicated semantics, no label-color mismatch, no visual regressions.

**Step 4: Final commit (optional, only when asked)**

`git add docs/design-drafts/2026-03-22-design-tokene.pen`
`git commit -m "refactor: align menstrual token semantics and reusable date states"`
