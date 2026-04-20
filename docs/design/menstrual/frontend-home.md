# Menstrual Home Frontend

## Purpose

This document defines the durable frontend/UI presentation contract for the menstrual home page.

For feature semantics, interaction meaning, and behavioral rules, read the paired function doc:

- [function-home.md](./function-home.md)

The menstrual home frontend must present the module as a status-first workbench.

It should make current state legible before exposing deeper browsing and editing controls.

## Page Structure

The core composition remains:

- `StatusHeroCard`
- `CalendarGrid`
- `CalendarLegend`
- `SelectedDatePanel`
- batch-mode action buttons in the jump row

When `聚焦模式` is active, the `CalendarGrid` portion of the page uses a two-row focused window.

## Hero Structure

The hero is status-first and should now use this structure:

- one top row with:
  - current-status label
  - private/shared chip
- one primary status frame
- one secondary reference row with:
  - `上次`
  - `下次`

The hero should no longer show:

- duplicated page title text such as `经期小记`
- helper copy such as `先看当前状态，再在下方聚焦模式里定位和记录。`

The private/shared chip belongs inside the hero, not as a detached page-level badge above it.

If the module name is shown as a page title, it should live above the hero as a separate title row with the approved module icon, not inside the hero header itself.

The secondary report entry card belongs directly under the hero and above the calendar/content stack. It must not drift below the selected-date panel.

### Status Frame

The primary hero frame is not a small chip. It is a dedicated status container.

Current MVP states:

- `暂无记录`
- `经期第<N>天`
- `记录中` with hint `记录更多以生成预测`
- `卵泡期` with inline hint
- `排卵期` with amber emphasis and inline hint
- `黄体期` with inline hint
- `黄体期` final 7 days with amber emphasis and countdown-capable hint

Design rule:

- treat this as a reusable `status frame` pattern, not as a one-off menstrual text block
- `暂无记录` is the pre-history fallback state and should use a neutral empty-state treatment with invitation copy
- `记录中` is the coarse cycle fallback state for "has historical cycle data, but fine-grained phase is not yet available"; it is neutral, not exceptional

### Reference Frames

The secondary hero row keeps two fixed info frames:

- `上次`
- `下次`

Rules:

- these frames always exist in layout even when their value is missing
- when a value is missing, the frame should render `暂无记录`
- `上次` and `下次` are informational frames in the hero, not the main status carrier
- when the primary status is `暂无记录`, the hero should not render phase copy or the reliability warning UI

## Jump Shortcut Row

The shortcut row should align with the hero semantics.

Rules:

- add `上次` as a shortcut
- tapping `上次` jumps to the previous segment's `startDate`
- when no previous segment exists, `上次` is disabled
- `本次` should be removed from the shortcut row because its semantics are now carried by the hero status frame
- the remaining shortcuts may continue to include `今天` and `下次预测` as long as they reflect the same read-model semantics as the hero

## View Mode Presentation

- `聚焦模式 / 月览` remains the only top-level calendar view switch.
- The active visual state of that switch on page entry should come from the last remembered `view type` when available.
- Restoring the active view should feel like continuity of preference, not restoration of a prior browsing position.
- If no remembered view type exists, the page may use the existing default entry behavior.
- Switching between the two views should preserve the existing page shell and should not imply that any record semantics changed.

## Empty State Invitation

When the home read model has no historical period segment yet, the hero should show a short invitation copy alongside `暂无记录`.

Suggested copy:

- `先记录一次经期，系统会帮你推算后续阶段`

This copy should remain concise and encouraging, and it should not imply that phase prediction is available before the first record exists.

## Selected Date Panel

- The panel always shows two independent chips: contextual period action chip (`月经` / `月经开始` / `月经结束`) and `+ 记录详情` (attribute grid toggle).
- The period chip text is derived from the selected date's role inside the current period segment:
  - `not-period` => `月经`
  - `start` => `月经开始`
  - `in-progress` / `end` => `月经结束`
- Period marking and attribute recording are independent actions.
- Single-day period editing must go through the resolve/apply flow; it is no longer treated as a blind boolean toggle on the page.
- The attribute summary bar only renders when at least one attribute is recorded.
- The attribute grid is controlled by `+ 记录详情` / `↑ 收起`, not by tapping the summary bar.
- Attribute changes are WYSIWYG (immediate persistence); there is no save button.
- A `清空` button appears only when attributes are recorded, and only clears attributes (not period status).
- The full interaction contract is defined in [function-day-recording.md](function-day-recording.md).

## Calendar Grid Structure

- `CalendarGrid` carries week-divider lines as part of the grid structure.
- Week dividers support browsing rhythm only; they are not date-state markers.
- Date cells in the grid should consume the component-library date-state source instead of page-local hand-drawn variants.
- In `聚焦模式`, `CalendarGrid` presents a fixed `14` day / `2` row rhythm.
- The first row should read as the primary focus band for current recording.
- Supporting components below the grid should continue to align cleanly under the tighter 2-row footprint without introducing new affordances.

## Visual Direction

The page should feel:

- clean
- warm
- precise
- light but intentional

It should not collapse into:

- a generic pink period app
- a medical dashboard
- a noisy analytics board

## Semantic Dependency

This file defines the UI contract only.

The durable logic for:

- when the page is `经期第<N>天`
- when it becomes `非经期`
- how `上次` is derived
- when `暂无记录` appears

must be maintained in the application contract under [../../contracts/application-contracts/menstrual-application-contract.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/contracts/application-contracts/menstrual-application-contract.md).
