# Token Component Alignment Implementation Plan

> **Status:** COMPLETED

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the current Pencil token draft with the real component/page baseline so the menstrual module can move into uni-app with a minimum viable, stable semantic token layer.

**Architecture:** Use the component-library and page expressions in `2026-03-22-module-space-and-period-home.pen` as the reality check, not the aspirational token board. Audit conflicts, classify them, define the minimum backfill token set, and record a component-to-token mapping so later frontend implementation can consume semantic tokens instead of page-local design decisions.

**Tech Stack:** Pencil `.pen` files, design contracts under `docs/design/`, markdown mapping docs under `docs/design/menstrual/`, frontend SCSS tokens under `frontend/styles/tokens/`

---

## Plan Hierarchy

- Parent umbrella plan:
  - [2026-03-28-pencil-to-uniapp-implementation-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-pencil-to-uniapp-implementation-plan.md)
- This document is the Phase 1 child plan for that broader implementation.

### Task 1: Record the alignment scope and conflict taxonomy

**Files:**
- Modify: `docs/plans/2026-03-28-token-component-alignment-plan.md`
- Review: `docs/design/2026-03-22-tokenize-collaboration-rule.md`
- Review: `docs/design/2026-03-23-ui-visual-language-guide.md`
- Review: `docs/design/menstrual/date-state-spec.md`

**Steps**

1. Confirm the alignment scope is limited to the menstrual-module token/component/page chain.
2. Record the four conflict classes:
   - token exists but component/page does not use it
   - component/page is stable but token is missing
   - both exist but naming differs
   - both exist but semantic meaning differs
3. Record the alignment rule:
   - component/page is the reality baseline
   - token is the systematized backfill target
4. Record the deliverables for this phase:
   - token inventory
   - missing-token list
   - rename/deprecate decisions
   - component-to-token mapping

### Task 2: Audit the current token draft

**Files:**
- Review: `docs/design-drafts/2026-03-22-design-tokene.pen`
- Review: `frontend/styles/tokens/primitives.scss`
- Review: `frontend/styles/tokens/semantic.scss`
- Create: `docs/design/menstrual/token-component-mapping.md`

**Steps**

1. Extract the current token categories already represented in the token draft:
   - palette
   - semantic colors
   - typography
   - spacing
   - radius
   - shadows
2. Compare them with the current frontend SCSS token surface.
3. Write down which token names are already usable as-is.
4. Write down which token names are misleading, incomplete, or inconsistent with the current UI direction.

### Task 3: Audit the practical component/page baseline

**Files:**
- Review: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- Review: `docs/design/menstrual/function-home.md`
- Review: `docs/design/menstrual/date-state-spec.md`
- Modify: `docs/design/menstrual/token-component-mapping.md`

**Steps**

1. Enumerate the components that will drive the first uni-app implementation:
   - `StatusHeroCard`
   - `DateCell`
   - `CalendarLegend`
   - `CalendarGrid`
   - `SelectedDatePanel`
   - `JumpTabs`
2. For each component, record the stable visual semantics it actually uses today.
3. For each component, separate:
   - material choices that should become tokens
   - structural/shape rules that should remain component-spec rules
4. Record page-level interaction structures that are not token concerns, especially the summary-row collapse model.

### Task 4: Define the minimum token backfill set

**Files:**
- Modify: `docs/design/menstrual/token-component-mapping.md`
- Review: `frontend/styles/tokens/semantic.scss`

**Steps**

1. Define the minimum semantic tokens required before any menstrual-home code work starts.
2. The minimum set must include at least:
   - `bg.base`
   - `bg.subtle`
   - `bg.card`
   - `bg.interactive`
   - `text.primary`
   - `text.secondary`
   - `text.tertiary`
   - `text.muted`
   - `text.inverse`
   - `border.subtle`
   - `border.strong`
   - `border.today`
   - `accent.period`
   - `accent.period.soft`
   - `accent.period.contrast`
   - `accent.prediction`
   - `accent.today`
   - `shadow.selected`
   - `calendar.week-divider`
3. Mark each token as one of:
   - already present and acceptable
   - present but rename needed
   - missing and must be added
   - should stay out of token scope

### Task 5: Lock naming rules

**Files:**
- Modify: `docs/design/menstrual/token-component-mapping.md`
- Review: `docs/design/2026-03-23-ui-visual-language-guide.md`

**Steps**

1. Record the two-layer naming model:
   - foundation names for primitive scales
   - semantic names for UI consumption
2. Record that the menstrual module should consume semantic names only.
3. Record that component names, page labels, and ad-hoc visual descriptions must not become semantic-token names.
4. Record the approved examples for the first implementation slice:
   - `accent.period.contrast`
   - `calendar.week-divider`
   - `shadow.selected`
   - `text.muted`

### Task 6: Build the component-to-token mapping document

**Files:**
- Create: `docs/design/menstrual/token-component-mapping.md`

**Steps**

1. Add one section per core component.
2. For each component, list:
   - required semantic tokens
   - component-owned structural rules
   - open token gaps
3. For `DateCell`, explicitly map each approved state family:
   - base states
   - selected-derived states
   - today-derived states
4. For `SelectedDatePanel`, map:
   - summary-row surface and spacing tokens
   - expanded-panel surface and border tokens
   - note that collapse behavior is interaction logic, not token logic

### Task 7: Define completion criteria for the next phase

**Files:**
- Modify: `docs/plans/2026-03-28-token-component-alignment-plan.md`
- Modify: `docs/design/menstrual/token-component-mapping.md`

**Steps**

1. Record what must be true before frontend token edits begin:
   - token gaps are classified
   - naming decisions are locked
   - component-to-token mapping exists for the first page slice
2. Record what remains explicitly out of scope for this phase:
   - broad Pencil visual redesign
   - uni-app page implementation
   - backend data integration

## Verification

- Every core menstrual-home component has a token-consumption section.
- Every stable visual decision is classified as token-level or component-spec-level.
- The minimum semantic token list is complete enough to start frontend token backfill.
- The alignment plan does not let the token draft override stable component/page reality.

## Defaults And Assumptions

- `2026-03-22-module-space-and-period-home.pen` is the practical baseline for approved visuals.
- `2026-03-22-design-tokene.pen` is still useful, but only after explicit alignment and naming cleanup.
- The frontend token layer will consume semantic names, not raw visual descriptors.
- The first downstream code target remains the menstrual home, not the entire app.
