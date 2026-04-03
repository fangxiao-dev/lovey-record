# Menstrual Day Recording Frontend

## Purpose

This document defines the durable frontend/UI presentation contract for `SelectedDatePanel` and its child surfaces.

For feature behavior, recording semantics, and interaction rules, read:

- [function-day-recording.md](./function-day-recording.md)

## Component Architecture

```txt
SelectedDatePanel
├── Head
├── ChipRow
│   ├── PeriodChip
│   └── RecordDetailChip
├── SummaryBar
├── AttributeGrid
├── ClearButton
└── NoteInput
```

## Chip Row

The chip row always shows two independent controls:

- contextual period chip
- detail-grid toggle chip

UI rules:

- both chips stay visible regardless of record state
- the detail toggle chip changes label between `+ 记录详情` and `↑ 收起`
- the chip row should not reflow heavily when state changes

## Summary Bar

The summary bar is a permanent visual fixture.

States:

- empty hint state
- partial recorded state
- full recorded state

UI rules:

- when empty, show hint text instead of removing the bar
- when attributes exist, show only recorded attribute chips
- summary chip fill should visually match the selected option tone from the grid

## Attribute Grid

The grid contains three rows:

- `流量`
- `疼痛`
- `颜色`

UI rules:

- option rows should read as lightweight segmented choices, not form fields
- the selected tone must be clear without becoming noisy
- expanding and collapsing the grid should feel like inline reveal, not page navigation

## Clear Button

The clear action is a secondary button.

UI rules:

- only show it when attributes exist
- keep it visually subordinate to the contextual period chip
- do not style it as a destructive danger action

## Note Input

The note area is always available.

UI rules:

- note input should feel lightweight and supportive
- it should not compete visually with period or attribute controls

## Pencil And Component Dependency

This frontend contract consumes the same long-lived component direction described by:

- [token-component-mapping.md](./token-component-mapping.md)
- [date-state-spec.md](./date-state-spec.md)

## UI Dependency

This file defines the UI contract only.

Behavioral rules for:

- period chip semantics
- attribute deselect rules
- badge meaning
- note-only states

must be maintained in [function-day-recording.md](./function-day-recording.md).
