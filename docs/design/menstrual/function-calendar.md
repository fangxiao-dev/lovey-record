# Calendar Panel

## Purpose

This document defines the complete interaction model for the calendar panel on the menstrual home page.

It covers view switching, navigation, jump shortcuts, batch editing, and the date state interaction rules specific to the calendar surface.

This is the authoritative UX contract for `CalendarGrid`, `BatchEditPanel`, and all supporting calendar primitives.

## Component Structure

```
CalendarPanel
├── HeaderNav           ← month label + prev/next arrows
├── SegmentedControl    ← 3-week / month-view toggle
├── CalendarGrid        ← date cells, week dividers
├── JumpTabs            ← today / current / next-prediction shortcuts
└── CalendarLegend      ← period / prediction / detail-recorded legend
```

## View Modes

### 3-Week View (default)

- The default editing surface.
- Shows a 3-week rolling window centered on the active focus point.
- Default center priority (from `function-recording-model.md`):
  1. Current period
  2. Predicted period
  3. Today
- All date interactions (tap, long-press drag) are active in this view.

### Month View

- A browse-only view. No editing is allowed.
- Users can navigate and inspect date states, but cannot tap to edit or drag to batch-select.
- Switching to month view does not clear any selection state; it simply disables editing affordances.

## HeaderNav

- Displays the current month label (e.g. `2026.03`).
- Prev (`<`) and next (`>`) arrows navigate by week in 3-week view, and by month in month view.
- The month label updates as navigation proceeds.

## SegmentedControl

Two options:

| Option | State | Behavior |
|---|---|---|
| 3 周 | Active (fill: `bg.card`) | Default editing view |
| 月览 | Inactive (text: `text.secondary`) | Browse-only view |

Switching views preserves the current focus date; the view re-centers around it.

## JumpTabs

Three shortcut buttons that scroll the calendar to a specific date range:

| Button | Style | Scroll Target |
|---|---|---|
| 今天 | Outline: `accent.today` | Week containing today |
| 本次 | Fill: `accent.period` | First day of the current period |
| 下次预测 | Fill: `accent.period.soft` | First day of the next predicted period |

Rules:
- If no current period exists, `本次` is disabled (not hidden).
- If no prediction exists, `下次预测` is disabled (not hidden).
- Tapping a jump tab does not change the selected date; it only scrolls the view.

## Date State Rules

Date cell states follow the axes defined in `date-state-spec.md`:

- Business state: `none` | `prediction` | `period`
- Time emphasis: `today`
- Interaction emphasis: `selected` (transient, used during batch selection)
- Marker emphasis: `detail recorded`
- Time-position modifier: `future muted`

Forbidden combinations from `date-state-spec.md`:
- Future dates are read-only; user cannot mark them as `period`.
- Future dates should not carry the detail-recorded eye marker.
- `prediction + detail recorded` is not a supported product combination.

## Tap Interaction

- Tap any past or today date cell → opens `SelectedDatePanel` for that date (inline, below the calendar).
- Tap a future date → no action (read-only, cell appears `future muted`).
- Only one date can be active in single-day edit mode at a time. Tapping a different date switches the panel to that date and collapses the attribute grid.

## Batch Selection Interaction

### Entry

- **Long-press + drag** is the primary batch-edit entry path.
- Long-press a past date cell, then drag to extend the selection range.
- The selection range is always a contiguous sequence of dates.

### Selectable Range

- Past dates and today are selectable. Future dates are not.
- If the drag reaches a future date boundary, the selection stops at today.

### During Selection

- Selected date cells display the `selected` overlay state (drop shadow, stroke cue).
- The `BatchEditPanel` appears at the bottom of the page, replacing `SelectedDatePanel`.
- The panel title shows the selected range (e.g. `批量补录 03/18 - 03/22`).
- The `CalendarGrid` remains visible and fully interactive during selection.

### BatchEditPanel Structure

```
BatchEditPanel
├── Title              ← "批量补录 MM/DD - MM/DD" (date range)
├── ActionChips
│   ├── 设为经期       ← fill: accent.period.soft; marks all selected days as period
│   └── 清除记录       ← fill: bg.subtle; clears period status for all selected days
└── Buttons
    ├── 取消           ← cancel; deselects all, returns to normal mode
    └── 应用到区间     ← confirm; applies the active chip action to all selected dates
```

### Batch Action Rules

- Only one chip can be active at a time: `设为经期` or `清除记录`.
- `设为经期` marks `is_period = true` for all dates in the selected range.
- `清除记录` clears `is_period` only. Attribute values (`pain_level`, `flow_level`, `color_level`) are not affected.
- `应用到区间` commits the action. Changes are persisted immediately after confirmation.
- `取消` discards the pending action and exits batch mode. No changes are made.
- After applying, the panel closes and the calendar returns to normal single-day edit mode.

### Batch Selection Does Not Affect Attributes

Batch operations target `is_period` only. Attribute values (`pain_level`, `flow_level`, `color_level`) are not modified by batch operations.

Rationale: batch editing exists specifically for period marking. Attributes are per-day subjective inputs that users add manually; bulk-deleting them is not a valid use case.

## CalendarLegend

Three legend items:

| Item | Visual | Meaning |
|---|---|---|
| 本次经期 | `accent.period` fill | Days marked as period |
| 经期预测 | `accent.period.soft` fill | System-predicted future period days |
| 属性已记录 | Eye marker (`visibility` glyph) | Days with one or more recorded attribute values |

- Legend items use the same visual language as the component-library date-state source.
- Legend does not include `today` (self-explanatory) or `future muted` (implicit).

## Panel State Machine

The calendar panel operates in two mutually exclusive modes:

| Mode | Trigger | Bottom Panel | Date Cell Interaction |
|---|---|---|---|
| Single-day edit | Tap a date | `SelectedDatePanel` | Tap switches date |
| Batch edit | Long-press + drag | `BatchEditPanel` | Drag extends selection |

Switching between modes:
- Entering batch mode (long-press drag) collapses `SelectedDatePanel`.
- Exiting batch mode (`取消` or `应用到区间`) returns to single-day edit mode (no date pre-selected).

## Related Documents

- [date-state-spec.md](date-state-spec.md) — date cell visual and layout rules
- [function-day-recording.md](function-day-recording.md) — SelectedDatePanel interaction contract
- [function-recording-model.md](function-recording-model.md) — period recording model
- [function-home.md](function-home.md) — page structure and must-preserve rules
