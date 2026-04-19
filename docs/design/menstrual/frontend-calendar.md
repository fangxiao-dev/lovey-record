# Menstrual Calendar Frontend

## Purpose

This document defines the durable frontend/UI presentation contract for the menstrual home calendar surface.

For feature behavior, interaction meaning, and calendar-mode semantics, read:

- [function-calendar.md](./function-calendar.md)

## Component Structure

```txt
CalendarPanel
├── HeaderNav
├── SegmentedControl
├── CalendarGrid
├── JumpTabs
└── CalendarLegend
```

## Surface Composition

- `HeaderNav` carries the month label and the focused-navigation actions
- `SegmentedControl` carries the `聚焦模式 / 月览` switch
- `CalendarGrid` carries date cells and week dividers
- `JumpTabs` carries date-location shortcuts
- `CalendarLegend` explains period / prediction / detail-recorded meaning

## HeaderNav

- in `聚焦模式` mode, uses explicit focused-navigation buttons instead of arrow-only controls
- the label should remain visually centered while the side actions read as lightweight inline navigation

### 3-Week Focused Navigation Presentation

- Left action label: `<<前一次`
- Right action label: `后一次>>`
- These actions belong to the focused-view browsing model, not to generic date paging
- Their visual weight should stay secondary to the month label, but they must read as tappable text actions rather than decorative icons
- The invalid state for `后一次>>` must remain visible and muted when the current node is `下次预测`
- Repeated taps on the invalid `后一次>>` should surface an inline, non-modal feedback message near the action area rather than opening a dialog

### Relationship To JumpTabs

- `HeaderNav` handles sequential browsing across period occurrences
- `JumpTabs` handles direct jumps to named anchors such as `今天`, `上次`, and `下次预测`
- These two rails should read as complementary navigation layers, not duplicate controls

### Month label format

The label reflects the months visible in the current 3-week window.

| Window span | Format | Example |
|---|---|---|
| Single month | `YYYY · M月` | `2026 · 4月` |
| Cross-month, same year | `YY · M月 ~ M月` | `26 · 4月 ~ 5月` |
| Cross-year | `YY · M月 ~ YY · M月` | `26 · 12月 ~ 27 · 1月` |

Rules:
- The full 4-digit year is shown only when the window is contained within a single month.
- When the window spans two months in the same year, a 2-digit year prefix is used once: `YY · M月 ~ M月`.
- When the window spans a year boundary, each side carries its own 2-digit year: `YY · M月 ~ YY · M月`.
- The `~` separator has a single space on each side.
- Month numbers are not zero-padded (`4月`, not `04月`).

## SegmentedControl

Two options:

- `聚焦模式`
- `月览`

UI rules:

- `聚焦模式` is the primary editing mode and should read as the active default
- `月览` is visually subordinate when inactive
- switching views should not visually suggest a mode reset

## JumpTabs

The shortcut row is a lightweight navigation rail, not a second status card.

Current shortcuts:

- `今天`
- `上次`
- `下次预测`

UI rules:

- disabled shortcuts remain visible
- disabled shortcuts should use muted treatment rather than disappearing
- the right side of this row is a fixed action area
- default mode shows a compact `批量选择` entry button in that area
- batch mode swaps that same area to inline `保存 / 取消`
- the three states must read as the same button family rather than unrelated controls
- batch-mode save/cancel actions continue to appear inline on the right side of this row, not in a bottom sheet

## CalendarGrid — Month Boundary Markers

When the 3-week window spans two calendar months, the grid must render two elements that mark the boundary between them.

### Boundary divider (A)

A vertical line rendered inside the `cells` row where the month transition occurs.

- Positioned between the last cell of the old month and the first cell of the new month.
- Width: `1px`.
- Color: same as `$calendar-week-divider` (`$color-warm-100`).
- Height: spans the cell height with small top/bottom insets (`2px` each side).

### Month chip (B)

A small label that names the incoming month, anchored to the top of the boundary divider.

- Position: sits above the divider, centered on the boundary column. Its upper edge pokes into the row gap above (`top: −8px` relative to the cells row).
- Text content: the incoming month number only (e.g. `5月`).
- Layout: two characters stacked vertically in a flex column — each character remains upright (no `writing-mode` rotation).
- Background: `$color-brown-500` (`#a29488`). Distinct from period (`$accent-period`) and prediction (`$accent-prediction`).
- Text color: `$color-warm-000` (white).
- Border-radius: `4px`. Padding: `3px 3px`.

### Boundary-adjacent cell treatment

The two cells immediately flanking the divider must pull their visual background away from the boundary edge to prevent overlap with the chip and divider.

- The last cell of the old month (`boundary-right`): apply `margin-right: 10px` to the `date-cell`.
- The first cell of the new month (`boundary-left`): apply `margin-left: 10px` to the `date-cell`.
- This applies regardless of the cell's state (default, period, prediction).

### Between-row boundary (special case)

If the last day of the old month is a Sunday and the first day of the new month is a Monday, the boundary falls between two week rows. In this case:

- No vertical divider is needed (the existing week-divider line serves the same role).
- The week-divider between those two rows is rendered as two half-width segments with the month chip centered between them (replacing the solid 1px line in that slot).
- No boundary-adjacent cell margin adjustment is needed.

## CalendarLegend

Legend items should keep the same visual language as the component-library date-state source.

Current items:

- `本次经期`
- `经期预测`
- `属性已记录`

UI rules:

- the eye marker should visually match the detail-recorded marker on date cells
- legend samples should not invent page-local styling that differs from `DateCell`

## Panel Modes

The calendar surface has two presentation modes:

- single-day mode
- batch-edit mode

UI rules:

- single-day mode keeps the page visually calm and reading-first
- batch-edit mode adds inline action controls without changing the page's overall structure
- empty batch mode is allowed as a visible transitional state before the first date is selected
- month view stays browse-first and should not expose edit affordances

## UI Dependency

This file defines the UI contract only.

Behavioral rules for:

- which dates are editable
- what each shortcut means
- how batch mode enters and exits
- what month view allows

must be maintained in [function-calendar.md](./function-calendar.md).
