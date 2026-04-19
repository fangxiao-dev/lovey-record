# Calendar Panel

## Purpose

This document defines the complete interaction model for the calendar panel on the menstrual home page.

It covers view switching, navigation, jump shortcuts, batch editing, and the date state interaction rules specific to the calendar surface.

This is the authoritative UX contract for `CalendarGrid` and all supporting calendar primitives on the menstrual home page.

For the frontend/UI presentation contract, read:

- [frontend-calendar.md](./frontend-calendar.md)

## View Modes

### 3-Week View (default)

- The default editing surface.
- This view is the `聚焦视图`: users browse one menstrual event at a time rather than a generic date span.
- Shows a fixed 3-week (`21` day / `3` row) rolling window anchored by the active focus point.
- Default center priority (from `function-recording-model.md`):
  1. Current period
  2. Predicted period
  3. Today
- All date interactions (tap, long-press drag) are active in this view.

#### Focused Navigation Model

- The navigation object in 3-week view is `one period occurrence`.
- The navigation anchor remains the `period start date`.
- Navigating within this view always lands on a period start date, not on a natural week or month boundary.
- The window remains a fixed `21` day surface after navigation; the view does not become a free-form range browser.

#### Window Placement Rule

- Default behavior continues to use the current 3-week window generation logic.
- The view may optionally place the current period start on the first row, but only when that placement clearly improves readability of the current period.
- `Clearly improves readability` means cases such as:
  - the default placement pushes too much of the current period into the third row
  - the default placement makes the latter part of the current period read noticeably too far back in the window
- If the improvement is not clear, the default window placement must be preserved.

### Month View

- A browse-only view. No editing is allowed.
- Users can navigate and inspect date states, but cannot tap to edit or drag to batch-select.
- Switching to month view does not clear any selection state; it simply disables editing affordances.

## JumpTabs

Three shortcut buttons that scroll the calendar to a specific date range:

| Button | Style | Scroll Target |
|---|---|---|
| 今天 | Outline: `accent.today` | Week containing today |
| 上次 | Neutral / disabled-aware | First day of the previous period segment |
| 下次预测 | Fill: `accent.period.soft` | First day of the next predicted period |

Rules:
- If no previous segment exists, `上次` is disabled (not hidden).
- If no prediction exists, `下次预测` is disabled (not hidden).
- Tapping a jump tab does not change the selected date; it only scrolls the view.
- JumpTabs remain anchor-style shortcuts and do not replace sequential focused navigation in 3-week view.

## Header Navigation in 3-Week View

The header nav in 3-week view is part of the focused-navigation model and should be treated differently from month browsing.

### Labels

- Left action: `<<前一次`
- Right action: `后一次>>`

### Behavior

- `<<前一次` jumps to the start date of the previous real period occurrence.
- `后一次>>` jumps to the start date of the next period occurrence in the focused sequence.
- When the current focused node is `下次预测`, `<<前一次` remains available and returns to the most recent real period record.

### Boundary State

- When the current focused node is `下次预测`, `后一次>>` enters an invalid state.
- Clicking the invalid `后一次>>` does not trigger a new navigation.
- This boundary feedback must be inline, not modal.
- The inline message is: `暂无更后的月经记录`

## Date State Rules

Date cell states follow the axes defined in `date-state-spec.md`:

- Business state: `none` | `prediction` | `period`
- Time emphasis: `today`
- Interaction emphasis: `selected` (transient, used during batch selection)
- Marker emphasis: `detail recorded`
- Time-position modifier: `future muted`

Forbidden combinations from `date-state-spec.md`:
- Future dates are read-only; user cannot mark them as `period`.
- System-driven auto-fill may still render a future date as `period`.
- Future dates should not carry the detail-recorded eye marker.
- `prediction + detail recorded` is not a supported product combination.

## Tap Interaction

- Tap any past or today date cell → opens `SelectedDatePanel` for that date (inline, below the calendar).
- Tap a future date → no action.
- A future auto-filled period date reuses the same readable `period` treatment as a normal period cell, but still remains read-only.
- Only one date can be active in single-day edit mode at a time. Tapping a different date switches the panel to that date and collapses the attribute grid.

## Batch Selection Interaction

### Entry

- Batch edit now supports two entry paths:
  - **Long-press + drag** on a past date cell
  - tap the explicit `批量选择` button in the jump row
- Long-press a past date cell still enters batch mode directly from that cell and then drags to extend the selection range.
- Tapping `批量选择` enters an empty batch mode first.
- The selection range is always a contiguous sequence of dates.
- Dragging to an earlier date is allowed; the range should normalize to the earlier start and later end.

### Selectable Range

- Past dates and today are selectable. Future dates are not.
- If the drag reaches a future date boundary, the selection stops at today.

## Hero / Prediction Boundary

- Calendar prediction styling now follows the same predicted period range that hero `下次` displays.
- The visible range is derived as `predictedStartDate ~ predictedStartDate + defaultPeriodDurationDays - 1`.
- `prediction_start` still anchors the shortcut target and remains the first day of that visible prediction range.
- `prediction_start` always follows the latest recomputed real period segment start; if the latest segment start changes, the visible prediction range changes with it.
- `下次预测` shortcut still jumps only to `prediction_start`.

### During Selection

- Selected date cells display the `selected` overlay state (drop shadow, stroke cue).
- Batch mode does not open a separate bottom panel.
- Instead, the jump row's right-side action area switches by mode:
  - default mode: `批量选择`
  - batch mode: `保存 / 取消`
- In batch mode, two compact action buttons appear on the right side of the jump-tab row:
  - `保存` uses the `period` accent treatment
  - `取消` uses a neutral, non-accent treatment
- The `CalendarGrid` remains visible and fully interactive during selection.
- The underlying single-day selection context should follow the latest drag position, so the final drag endpoint becomes the selected day after save.

### Batch Action Buttons

```
JumpTabs Row
├── JumpTabs           ← 今天 / 上次 / 下次预测
└── Right Action Area
    ├── 批量选择       ← default mode entry button
    └── 保存 / 取消    ← visible only in batch mode
```

### Batch Toggle Rules

- Batch selection follows path-based toggle semantics instead of a simple start/end range.
- Tapping `批量选择` enters batch mode with no selected dates.
- In empty batch mode:
  - `保存` is disabled
  - `取消` exits batch mode without any write
  - tapping the first selectable date creates the batch start and immediately selects that date
- After the first date is selected, tapping another selectable date or dragging continues the same batch-selection flow.
- Entering a date cell toggles that cell's selected state.
- Re-entering a previously selected cell toggles it back off.
- This means a path like `25 -> 27 -> 25` should leave `25` unselected again.
- `保存` persists the currently selected dates as period days.
- `取消` discards the pending selection and exits batch mode. No changes are made.
- Batch selection still does not modify attribute values or note content.

### Batch Selection Does Not Affect Attributes

Batch operations target `is_period` only. Attribute values (`pain_level`, `flow_level`, `color_level`) are not modified by batch operations.

Rationale: batch editing exists specifically for period marking. Attributes are per-day subjective inputs that users add manually; bulk-deleting them is not a valid use case.

## Panel State Machine

The calendar panel operates in two mutually exclusive modes:

| Mode | Trigger | Bottom Panel | Date Cell Interaction |
|---|---|---|---|
| Single-day edit | Tap a date | `SelectedDatePanel` | Tap switches date |
| Batch edit | Long-press + drag | Jump row save/cancel buttons | Drag toggles selection along the path |

Switching between modes:
- Entering batch mode through either entry path collapses `SelectedDatePanel`.
- `取消` exits batch mode without persistence and returns to the latest single-day context reached during the batch gesture.
- `保存` commits the current selected dates, then returns to single-day edit mode focused on the latest dragged day.

## Reconciliation Expectation

- Period writes should stabilize `CalendarGrid` and `SelectedDatePanel` first.
- Hero / shortcut summary may reconcile one refresh beat later as long as the already-committed calendar and selected-day state do not flash back.

## Related Documents

- [date-state-spec.md](date-state-spec.md) — date cell visual and layout rules
- [function-day-recording.md](function-day-recording.md) — SelectedDatePanel interaction contract
- [function-recording-model.md](function-recording-model.md) — period recording model
- [function-home.md](function-home.md) — page structure and must-preserve rules
- [frontend-calendar.md](frontend-calendar.md) — frontend/UI presentation contract
