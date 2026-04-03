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

- `HeaderNav` carries the month label and prev/next arrows
- `SegmentedControl` carries the `3 周 / 月览` switch
- `CalendarGrid` carries date cells and week dividers
- `JumpTabs` carries date-location shortcuts
- `CalendarLegend` explains period / prediction / detail-recorded meaning

## HeaderNav

- displays the current month label such as `2026.03`
- uses compact prev/next controls
- the label should remain visually centered while arrows stay lightweight

## SegmentedControl

Two options:

- `3 周`
- `月览`

UI rules:

- `3 周` is the primary editing mode and should read as the active default
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
- batch-mode save/cancel actions continue to appear inline on the right side of this row, not in a bottom sheet

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
- month view stays browse-first and should not expose edit affordances

## UI Dependency

This file defines the UI contract only.

Behavioral rules for:

- which dates are editable
- what each shortcut means
- how batch mode enters and exits
- what month view allows

must be maintained in [function-calendar.md](./function-calendar.md).
