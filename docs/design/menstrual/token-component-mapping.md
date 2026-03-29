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

## Minimum Backfill Status Matrix

This section converts the minimum backfill set into an execution-ready checklist.

### Surface token status

- `bg.base`
  - current frontend token: `$bg-page`
  - status: present but rename needed
  - note: current value already matches the practical page baseline
- `bg.subtle`
  - current frontend token: `$bg-page-muted`
  - status: present but rename needed
  - note: current name is page-oriented instead of reusable semantic naming
- `bg.card`
  - current frontend token: `$bg-surface`
  - status: present but rename needed
  - note: current value is correct, but the target semantic should align to card usage
- `bg.interactive`
  - current frontend token: `$bg-surface-interactive`
  - status: present but rename needed
  - note: this is the clearest existing candidate for `SelectedDatePanel` summary-row consumption

### Text token status

- `text.primary`
  - current frontend token: `$text-primary`
  - status: already present and acceptable
- `text.secondary`
  - current frontend token: `$text-secondary`
  - status: already present and acceptable
- `text.tertiary`
  - current frontend token: `$text-tertiary`
  - status: already present and acceptable
- `text.muted`
  - current frontend token: none
  - status: missing and must be added
  - note: do not reuse `text.tertiary` blindly; the design system already treats muted as an explicit semantic
- `text.inverse`
  - current frontend token: `$text-inverse`
  - status: already present and acceptable

### Border token status

- `border.subtle`
  - current frontend token: `$border-subtle`
  - status: already present and acceptable
- `border.strong`
  - current frontend token: `$border-strong`
  - status: already present and acceptable
- `border.today`
  - current frontend token: none
  - status: missing and must be added
  - note: do not continue hiding this under `status-today-ring`

### State accent status

- `accent.period`
  - current frontend token: `$status-period`
  - status: present but rename needed
  - note: current frontend value already aligns with the practical component/page baseline
- `accent.period.soft`
  - current frontend token: `$status-period-soft`
  - status: present but rename needed
- `accent.period.contrast`
  - current frontend token: none
  - status: missing and must be added
- `accent.prediction`
  - current frontend token: `$status-prediction`
  - status: present but rename needed
  - note: current frontend value already matches the business-file baseline more closely than the token draft
- `accent.today`
  - current frontend token: partial via `$status-today-ring`
  - status: present but rename and semantic split needed
  - note: keep the color material, but separate accent meaning from `border.today`

### Shadow token status

- `shadow.selected`
  - current frontend token: none
  - status: missing and must be added
  - note: current frontend shadow tokens are generic surface tokens, not the approved selected-state semantic

### Calendar token status

- `calendar.week-divider`
  - current frontend token: none
  - status: missing and must be added

## Current Frontend Semantic Mapping Draft

This is the current recommended mapping from existing frontend SCSS names to the target semantic naming model.

### Keep as-is

- `$text-primary` -> `text.primary`
- `$text-secondary` -> `text.secondary`
- `$text-tertiary` -> `text.tertiary`
- `$text-inverse` -> `text.inverse`
- `$border-subtle` -> `border.subtle`
- `$border-strong` -> `border.strong`

### Rename to target semantic names

- `$bg-page` -> `bg.base`
- `$bg-page-muted` -> `bg.subtle`
- `$bg-surface` -> `bg.card`
- `$bg-surface-interactive` -> `bg.interactive`
- `$status-period` -> `accent.period`
- `$status-period-soft` -> `accent.period.soft`
- `$status-prediction` -> `accent.prediction`

Status:

- the code-side migration target is now direct semantic consumption
- do not keep these names as long-lived aliases once current consumers are migrated

### Split or redefine

- `$status-today-ring`
  - split into `accent.today` and `border.today`
- `$status-detail`
  - remove or redefine so it no longer describes a separate hue family
- `$text-accent`
  - remove from the token layer in Phase 1
  - current utility consumers should point to explicit semantic targets such as `accent.period`
- `$border-accent`
  - remove from the token layer in Phase 1
  - no active consumer was found in the current repo audit

### Add new semantic names

- `text.muted`
- `accent.period.contrast`
- `border.today`
- `shadow.selected`
- `calendar.week-divider`

## Current Alignment Snapshot

### Already stable in the current design language

- `today` is circular and outline-first
- `selected` variants use a weak drop shadow
- `period` is the only state that switches text and attached detail markers to a contrast foreground
- non-`period` detail markers use the warm `period` accent
- week dividers belong to `CalendarGrid`, not to `DateCell`
- the three summary attributes in `SelectedDatePanel` are collapsed by default and expand inline

### Clear token gaps

- no explicit documented semantic token contract yet for `calendar.week-divider`
- no stable documented semantic token contract yet for `shadow.selected`
- current frontend tokens still reflect older meanings such as `status-detail`
- current frontend tokens still use broader names like `status-period`, `status-prediction`, and `status-today-ring` instead of the approved `accent.*` and `border.today` pattern

### Clear semantic mismatches

- existing frontend `status-detail` still implies an independent hue family, which conflicts with the approved rule that `detail-recorded` shares the `period` family and differentiates by eye-marker form
- existing frontend `status-today-ring` is only color-oriented, while the approved rule is a broader `today` state semantic with stable circular outline geometry

## Variable Inventory Diff

The current token draft and the current component/page baseline already expose concrete mismatches.

### Same variable name, different value

- `color.accent.period`
  - token draft: `#D89A8D`
  - component/page baseline: `#C9786A`
  - status: semantic meaning is the same, but the component/page value is the practical baseline
- `color.accent.prediction`
  - token draft: `#FFF4EF`
  - component/page baseline: `#EADFD6`
  - status: semantic meaning is the same, but the current page expression is darker and more material
- `color.accent.detail`
  - token draft: `#D89A8D`
  - component/page baseline: `#B08D57`
- status: semantic conflict, because the approved visual contract says `detail-recorded` should not keep an independent hue family
- `color.bg.base`
  - token draft: `#FCF9F6`
  - component/page baseline: `#FAF7F2`
  - status: low-risk material mismatch; align to the page baseline actually used in the business file
- `space.page`
  - token draft: `24`
  - component/page baseline: `16`
  - status: layout-scale mismatch; must be reviewed against the actual page spacing direction before code work starts

### Present in token draft, missing from current component/page variable set

- `color.bg.panel`
- `color.bg.neutral`
- `color.bg.sheet`
- `color.support.calm`
- `color.support.info`
- `color.text.support`
- `color.text.inverse`

Status:

- these are forward-update candidates from token to component
- some may be immediately useful in code even if they are not yet wired into the current component-library variable set
- `color.support.calm`, `color.support.info`, and `color.text.support` are now aligned in the frontend token layer and no longer blocked on raw-value mismatch

### Present in component/page variable set, missing from token draft

- `color.accent.period.soft`
- `color.accent.period.contrast`

Status:

- these are reverse-update candidates from component/page to token
- both are already stable enough to be treated as first-class semantic tokens

## Direct-Color Findings From The Current Component/Page Baseline

The current business file still contains raw colors that are not yet normalized into variables.

### Reverse-update candidates from component/page into token

- purple attribute family
  - raw examples: `#E7DBEA`, `#D3C3D6`, `#9840A8FF`
  - current usage pattern: attribute chips / symptom-intensity strips / icon accents in the business file
  - alignment value: if this family remains part of the menstrual-home editing surface, it should become a semantic support or attribute token family instead of staying as page-local raw fills
- soft calm-card family
  - raw examples: `#DCEFE3`, `#BFD6C8`
  - current usage pattern: recent tool cards and light supportive surfaces in the business file
  - alignment value: these may map into or refine the existing `support.calm` direction from the token draft
- pale info chip family
  - raw example: `#8EAFD0`
  - current usage pattern: small pill/chip-like markers in the business file
  - alignment value: this likely belongs under the token draft's `support.info` family, but the exact semantic naming still needs to be locked

### Attribute token families now locked for the current board

These families are now stable enough to exist as semantic token families in the token file, even if the exact values may still be tuned later.

- `attribute.flow`
  - `icon`
  - `trace`
  - `light`
  - `medium`
  - `heavy`
  - `extreme`
  - `textSoft`
  - `textContrast`
- `attribute.pain`
  - `icon`
  - `none`
  - `light`
  - `medium`
  - `strong`
  - `extreme`
  - `textSoft`
  - `textContrast`
- `attribute.tone`
  - `icon`
  - `veryLight`
  - `light`
  - `medium`
  - `dark`
  - `veryDark`
  - `textSoft`
  - `textContrast`

Status:

- these families were reverse-updated from the current business-file attribute editor and summary chips
- the naming is now semantic-first
- the concrete values may still be adjusted without changing the family structure
- deep state chips now also require family-level text contrast tokens instead of reusing generic muted text

### Forward-update candidates from token into component/page

- `color.support.calm`
  - token draft value: `#6BB98E`
  - likely destination: supportive calm surfaces, tags, or secondary status accents
- `color.support.info`
  - token draft value: `#82AAEE`
  - likely destination: linked/info labels and light informational chips
- `color.bg.panel`
  - token draft value: `#F8F4EF`
  - likely destination: a more explicit panel layer for expanded editors such as `SelectedDatePanel`
- `color.text.inverse`
  - token draft value: `#FFFFFF`
  - likely destination: contrast text on strong fills, especially if future component states need a non-period inverse foreground

### Already synced from code side back into token board

- `color.accent.period`
- `color.accent.period.soft`
- `color.accent.period.contrast`
- `color.accent.prediction`
- `color.bg.base`
- `color.bg.panel`
- `color.bg.subtle`
- `color.border.today`

Status:

- these values have now been aligned in the frontend token layer and reflected back into `2026-03-22-design-tokene.pen` for manual review

## Alignment Decisions Emerging From The Audit

- `accent.period` should follow the current component/page baseline, then be backfilled into the token source.
- `accent.period.soft` and `accent.period.contrast` are no longer optional local variables; they belong in the shared semantic token layer.
- `accent.detail` should not survive as an independent hue semantic. It should be removed, aliased, or redefined so that `detail-recorded` continues to share the warm `period` family and differ by marker form.
- support families are the clearest token-to-component forward-update opportunity in the current system.
- the purple attribute family is the clearest component-to-token reverse-update opportunity in the current system.

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
- `detail` uses the small eye marker
- transparent placeholders may be used to stabilize the date-number baseline

### State families that must map through props, not hardcoded examples

- base states
  - `default`
  - `futureMuted`
  - `today`
- `detail`
- selected-derived states
  - `selected`
  - `selectedPeriod`
  - `selectedPrediction`
- `selectedDetail`
- today-derived states
- `todayDetail`
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

- detail legend markers use the same eye-marker language as `DateCell`
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

- summary bar only renders when at least one attribute is recorded
- attribute grid is toggled by `+ 记录详情` / `↑ 收起` chip, not by tapping the summary bar
- attribute changes are WYSIWYG; no save button
- `清空` button replaces the former save button, only visible when attributes are recorded
- full interaction contract: [function-day-recording.md](function-day-recording.md)

### Current token gaps or risks

- summary row and expanded editor surfaces need a clearer semantic split
- current collapse/expand behavior is now a documented interaction rule in function-day-recording.md

## `BatchActionButtons`

### Semantic tokens it should consume

- `text.secondary`
- `bg.subtle`
- `accent.period`
- `accent.period.contrast`
- `radius.control`

### Rules that stay in component spec

- long-press batch-edit remains the primary multi-day interaction model
- buttons appear inline on the right side of the jump-tabs row only during batch mode
- button visibility and mode switching are local interaction state, not token rules

### Current token gaps or risks

- save and cancel rely on shared control tokens, so future destructive or disabled variants still need separate semantic action tokens
- the current button pair should stay small and inline rather than expanding into a card-like secondary surface

## Current Frontend Token Rename Pressure

These current frontend names likely need alignment before component implementation:

- `$status-period` -> semantic `accent.period`
- `$status-period-soft` -> semantic `accent.period.soft`
- `$status-prediction` -> semantic `accent.prediction`
- `$status-detail` -> remove or redefine so it no longer implies a separate hue family
- `$status-today-ring` -> split into semantic `accent.today` and `border.today`
- `$text-accent` -> remove and point remaining consumers directly at explicit semantics such as `accent.period`
- `$border-accent` -> remove from the current menstrual scope; no active consumer found
- `$status-success` / `$status-warning` / `$status-danger` -> keep temporarily because `uni.scss` still maps them into uni compatibility colors
- `bg-page` / `bg-page-muted` / `bg-surface` / `bg-surface-interactive` alias retention is no longer needed once `uni.scss` consumes semantic names directly
- `status-period` / `status-period-soft` / `status-prediction` / `status-detail` / `status-today-ring` alias retention is no longer needed once no code consumer remains

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
