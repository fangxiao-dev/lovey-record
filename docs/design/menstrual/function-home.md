# Menstrual Home

## Purpose

The menstrual home is the module's main workbench.

It must answer current status before exposing deeper browsing and editing.

## Page Structure

The core structure remains:

- `StatusHeroCard`
- `CalendarGrid`
- `CalendarLegend`
- `SelectedDatePanel`
- `BatchEditPanel`

## Must Preserve

- home answers current status first
- single-day editing stays inline on the home page
- long-press drag is the primary batch-edit path
- month view is browse-only support, not a second editor
- `period / prediction / today / detail-recorded` remain distinguishable with restrained hierarchy

## States

The home page must cover:

- default state
- recorded state
- single-day edit state
- batch-edit state
- detail-recorded marker state
- future-date blocked state

## Selected Date Panel

- The panel always shows two independent chips: `经期` (period toggle) and `+ 记录详情` (attribute grid toggle).
- Period marking and attribute recording are independent actions.
- The attribute summary bar only renders when at least one attribute is recorded.
- The attribute grid is controlled by `+ 记录详情` / `↑ 收起`, not by tapping the summary bar.
- Attribute changes are WYSIWYG (immediate persistence); there is no save button.
- A `清空` button appears only when attributes are recorded, and only clears attributes (not period status).
- The full interaction contract is defined in [function-day-recording.md](function-day-recording.md).

## Calendar Grid Structure

- `CalendarGrid` carries week-divider lines as part of the grid structure.
- Week dividers support browsing rhythm only; they are not date-state markers.
- Date cells in the grid should consume the component-library date-state source instead of page-local hand-drawn variants.

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

