# Token Component Mapping

## Purpose

This document aligns the current menstrual-module component/page baseline with the token system that will later feed the uni-app implementation.

It answers four questions:

- which visual decisions are already stable in the current component/page source
- which of those decisions should become semantic tokens
- which rules should remain component-spec rules instead of tokens
- which token gaps must be filled before shared uni-app components are implemented

## Parent Plans

- umbrella plan: [../../plans/2026-03-28-pencil-to-uniapp-implementation-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-pencil-to-uniapp-implementation-plan.md)
- phase 1 child plan: [../../plans/2026-03-28-token-component-alignment-plan.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans/2026-03-28-token-component-alignment-plan.md)

## Source Priority

Use this order when the token draft and the current page/component expressions disagree:

1. current component-library and page expressions in [../../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
2. approved visual rules in [../2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-23-ui-visual-language-guide.md) and [date-state-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/date-state-spec.md)
3. token/foundation candidates in [../../design-drafts/2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design-drafts/2026-03-22-design-tokene.pen)
4. current frontend SCSS token layer under `frontend/styles/tokens/`

Rule:

- component/page is the practical reality baseline
- token is the systematized backfill target

## Conflict Taxonomy

Every token-component mismatch should be classified as one of these:

1. token exists, but component/page does not use it
2. component/page is stable, but token does not exist yet
3. both exist, but naming differs
4. both exist, but semantic meaning differs

## Naming Model

Two layers only:

- foundation primitives
  - examples: `color.warm.050`, `space.12`, `radius.16`
- semantic UI tokens
  - examples: `bg.card`, `text.primary`, `accent.period.contrast`, `calendar.week-divider`, `shadow.selected`

Rules:

- menstrual components should consume semantic token names only
- component names and visual descriptions should not become token names
- interaction rules are never token names

## Minimum Semantic Token Backfill Set

These are the minimum semantic tokens that should be stable before menstrual-home frontend implementation starts:

### Surface

- `bg.base`
- `bg.subtle`
- `bg.card`
- `bg.interactive`

### Text

- `text.primary`
- `text.secondary`
- `text.tertiary`
- `text.muted`
- `text.inverse`

### Border

- `border.subtle`
- `border.strong`
- `border.today`

### State Accent

- `accent.period`
- `accent.period.soft`
- `accent.period.contrast`
- `accent.prediction`
- `accent.today`

### Shadow

- `shadow.selected`

### Calendar

- `calendar.week-divider`

## Current Alignment Snapshot

### Already stable in the current design language

- `today` is circular and outline-first
- `selected` variants use a weak drop shadow
- `period` is the only state that switches text and attached special markers to a contrast foreground
- non-`period` special markers use the warm `period` accent
- week dividers belong to `CalendarGrid`, not to `DateCell`
- the three summary attributes in `SelectedDatePanel` are collapsed by default and expand inline

### Clear token gaps

- no explicit documented semantic token contract yet for `calendar.week-divider`
- no stable documented semantic token contract yet for `shadow.selected`
- current frontend tokens still reflect older meanings such as `status-special`
- current frontend tokens still use broader names like `status-period`, `status-prediction`, and `status-today-ring` instead of the approved `accent.*` and `border.today` pattern

### Clear semantic mismatches

- existing frontend `status-special` still implies an independent hue family, which conflicts with the approved rule that `special` shares the `period` family and differentiates by eye-marker form
- existing frontend `status-today-ring` is only color-oriented, while the approved rule is a broader `today` state semantic with stable circular outline geometry

## Component Mapping

## `StatusHeroCard`

### Semantic tokens it should consume

- `bg.card`
- `text.primary`
- `text.secondary`
- `border.subtle`
- `accent.period` only if the card needs a local period-status highlight

### Rules that stay in component spec

- card information hierarchy
- which fields are shown in the status summary
- whether the card emphasizes current cycle, current status, or contextual note copy

### Current token gaps or risks

- no menstrual-specific semantic surface contract is written yet for hero emphasis states
- must not introduce page-local accent fills before the token layer is aligned

## `DateCell`

### Semantic tokens it should consume

- `text.primary`
- `text.secondary`
- `text.muted`
- `text.inverse`
- `accent.period`
- `accent.period.soft`
- `accent.period.contrast`
- `accent.prediction`
- `accent.today`
- `border.today`
- `shadow.selected`

### Rules that stay in component spec

- `today` uses a circular outline
- `selected` keeps a weak drop shadow
- `today`-derived variants keep the same circular geometry and stroke
- `special` uses the small eye marker
- transparent placeholders may be used to stabilize the date-number baseline

### State families that must map through props, not hardcoded examples

- base states
  - `default`
  - `futureMuted`
  - `today`
  - `special`
- selected-derived states
  - `selected`
  - `selectedPeriod`
  - `selectedPrediction`
  - `selectedSpecial`
- today-derived states
  - `todaySpecial`
  - `todayPeriod`

### Current token gaps or risks

- `accent.prediction` needs a clean semantic definition that matches current page usage
- `border.today` should be separated from raw stroke color naming
- `shadow.selected` must become a shared token instead of remaining a page/component-local effect

## `CalendarLegend`

### Semantic tokens it should consume

- `text.secondary`
- `accent.period`
- `accent.prediction`
- `accent.period.contrast` only when a legend sample intentionally demonstrates the contrast case

### Rules that stay in component spec

- special legend markers use the same eye-marker language as `DateCell`
- legend item composition and label order

### Current token gaps or risks

- legend examples must not drift from the component-library date-state source
- if prediction color remains unstable, legend semantics will drift with it

## `CalendarGrid`

### Semantic tokens it should consume

- `bg.base`
- `bg.card`
- `text.primary`
- `text.secondary`
- `calendar.week-divider`

### Rules that stay in component spec

- week dividers are structural rhythm, not state markers
- date placement, row grouping, and day-of-week layout
- `CalendarGrid` consumes `DateCell`; it does not own date-state appearance

### Current token gaps or risks

- `calendar.week-divider` does not yet exist as a clearly named semantic token
- page-local date-cell drawing must not survive as a parallel source once code starts

## `SelectedDatePanel`

### Semantic tokens it should consume

- `bg.card`
- `bg.interactive`
- `text.primary`
- `text.secondary`
- `border.subtle`
- `border.strong`
- spacing and radius semantic tokens already used by shared surfaces

### Rules that stay in component spec

- three summary attributes use a horizontal summary row
- summary row is collapsed by default
- tapping a summary item expands the matching editor inline
- tapping it again collapses it back

### Current token gaps or risks

- summary row and expanded editor surfaces need a clearer semantic split
- current collapse/expand behavior is a documented interaction rule, not yet a code-level state contract

## `BatchEditPanel`

### Semantic tokens it should consume

- `bg.card`
- `text.primary`
- `text.secondary`
- `border.subtle`
- `accent.period` for active action emphasis only where needed

### Rules that stay in component spec

- long-press batch-edit remains the primary multi-day interaction model
- panel visibility and mode switching are local interaction state, not token rules

### Current token gaps or risks

- active and inactive batch-edit action emphasis may need an explicit semantic action token split later
- the first implementation should keep this panel static-first and avoid inventing page-local styling

## Current Frontend Token Rename Pressure

These current frontend names likely need alignment before component implementation:

- `$status-period` -> semantic `accent.period`
- `$status-period-soft` -> semantic `accent.period.soft`
- `$status-prediction` -> semantic `accent.prediction`
- `$status-special` -> remove or redefine so it no longer implies a separate hue family
- `$status-today-ring` -> split into semantic `accent.today` and `border.today`

## Completion Criteria For Phase 1

This phase is complete when:

- every core menstrual-home component has a token-consumption section
- the minimum token backfill set is locked
- the token gaps are classified
- the naming model is stable enough to start frontend token edits
- interaction rules are clearly separated from token rules

## Out Of Scope

- broad visual redesign in Pencil
- direct uni-app component implementation
- backend data integration
- page registration or runtime wiring
