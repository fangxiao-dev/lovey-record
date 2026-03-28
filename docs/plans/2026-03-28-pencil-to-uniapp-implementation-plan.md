# Pencil To Uni-app Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn the stabilized Pencil design system for the menstrual module into a uni-app implementation path by first normalizing design sources, then mapping them into reusable frontend tokens, components, pages, and local UI state.

**Architecture:** Treat the current component-library area in `2026-03-22-module-space-and-period-home.pen` as the practical visual baseline, then backfill only the minimum stable token layer needed for code. Implement the frontend in one direction: token mapping first, shared components second, page composition third, and page-local interaction state last.

**Tech Stack:** Pencil `.pen` design assets, repo design contracts under `docs/design/`, uni-app Vue 3 SFC pages/components, SCSS token/foundation layers under `frontend/styles/`

---

## Plan Hierarchy

- This document is the umbrella implementation plan for the full `Pencil -> uni-app` workstream.
- Child phase plans should link back to this document.
- Current child plan:
  - [2026-03-28-token-component-alignment-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-token-component-alignment-plan.md)

## Phase Structure

### Phase 1: Token-Component Alignment

**Outcome**

- resolve conflicts between the token draft and the current component/page baseline
- define which visual rules become semantic tokens
- define which rules stay at the component-spec level
- produce a component-to-token mapping reference for the menstrual module

**Primary files**

- Create: `docs/plans/2026-03-28-token-component-alignment-plan.md`
- Create: `docs/design/menstrual/token-component-mapping.md`
- Review: `docs/design/2026-03-23-ui-visual-language-guide.md`
- Review: `docs/design/menstrual/date-state-spec.md`
- Review: `docs/design-drafts/2026-03-22-design-tokene.pen`
- Review: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`

**Must lock**

- stable token naming rules
- minimum semantic token set needed for the menstrual home
- component-library consumption rules
- page consumption rules

**Phase plan**

- [2026-03-28-token-component-alignment-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-token-component-alignment-plan.md)

### Phase 2: Pencil Design Normalization For Code

**Outcome**

- convert the current visual source into a code-friendly component matrix
- remove or isolate page-only demo content from reusable component definitions
- make component naming, state grouping, and example content directly mappable to uni-app components and props

**Primary files**

- Modify: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- Review: `docs/design/menstrual/token-component-mapping.md`
- Review: `docs/design/menstrual/date-state-spec.md`

**Must lock**

- reusable component names
- stable state matrix for `DateCell`
- stable interaction structure for `SelectedDatePanel`
- page-vs-component boundaries inside the Pencil source

### Phase 3: Frontend Token Backfill

**Outcome**

- align `frontend/styles/tokens/` with the approved minimum semantic token set
- remove known mismatches between current frontend token names and current Pencil semantics
- expose the required semantic material for date-state rendering and menstrual-home surfaces

**Primary files**

- Modify: `frontend/styles/tokens/primitives.scss`
- Modify: `frontend/styles/tokens/semantic.scss`
- Modify: `frontend/styles/foundation/patterns.scss`
- Modify: `frontend/styles/foundation/mixins.scss` if new helpers are needed

**Must lock**

- `accent.period`
- `accent.period.soft`
- `accent.period.contrast`
- `accent.prediction`
- `accent.today`
- `shadow.selected`
- `calendar.week-divider`
- the surface, text, border, spacing, and radius tokens actually consumed by the menstrual components

### Phase 4: Shared Component Implementation

**Outcome**

- implement the reusable menstrual-home component set in uni-app without backend data
- keep state expression inside component props and local UI state, not page-local styling duplication

**Primary files**

- Create: `frontend/components/menstrual/DateCell.vue`
- Create: `frontend/components/menstrual/CalendarLegend.vue`
- Create: `frontend/components/menstrual/CalendarGrid.vue`
- Create: `frontend/components/menstrual/SelectedDatePanel.vue`
- Create: `frontend/components/menstrual/StatusHeroCard.vue`
- Create: `frontend/components/menstrual/BatchEditPanel.vue`

**Must lock**

- prop surface for state combinations
- internal layout semantics
- token usage
- local interaction boundaries

### Phase 5: Menstrual Home Page Assembly

**Outcome**

- assemble the menstrual home page using only the shared component set
- keep the page shell static-first and interaction-ready
- register the page in uni-app and validate that it does not depend on browser-only behavior

**Primary files**

- Create: `frontend/pages/menstrual/home.vue`
- Modify: `frontend/pages.json`
- Modify: supporting mock-state helpers only if needed

**Must lock**

- page section order
- page-local state only for collapse/expand, selection, and local preview behavior
- no real backend integration in this phase

### Phase 6: Local Interaction And Mock State

**Outcome**

- add the minimum local interactivity required to validate the design contract
- support summary collapse/expand, selected date switching, and example status switching
- keep data mocked and explicit

**Primary files**

- Modify: `frontend/pages/menstrual/home.vue`
- Modify: the menstrual shared components only when interaction wiring truly belongs there

**Must lock**

- summary-row collapse behavior
- selected-date state transitions
- batch-edit shell visibility
- mock data structure for design validation

## Cross-Phase Rules

- Frontend only. Do not modify backend code or contracts in this workstream.
- Do not let pages invent new visual patterns before tokens and components are aligned.
- Do not treat the token file as the current visual baseline; treat it as the systematized backfill target.
- Do not skip the component-library layer when a page example exposes a reusable need.
- Keep uni-app constraints explicit: `view/text/image`, `pages.json` registration, and no shared browser-only APIs.

## Verification Strategy

- After Phase 1, verify that every approved menstrual-home component has an explicit token-consumption mapping.
- After Phase 2, verify that the component-library area in Pencil is structurally reusable and not dependent on page-only demo content.
- After Phase 3, verify that frontend semantic tokens can express all currently approved menstrual-home states.
- After Phase 4, verify each shared component in isolation with mock props.
- After Phase 5, verify the new page is registered and renders with the required section order.
- After Phase 6, verify collapse/expand and local state switching manually in uni-app runtime targets.

## Defaults And Assumptions

- The current visual direction is stable enough to start code-prep work; this plan does not reopen broad visual exploration.
- The current component-library area in `2026-03-22-module-space-and-period-home.pen` is the practical source of truth for reusable visuals.
- The token file remains valuable, but only after conflict resolution and minimum token backfill.
- The first frontend implementation target is a static-first menstrual home prototype with local interaction, not a full backend-connected workflow.
