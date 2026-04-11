# Selected Date Panel — Pencil Update Plan

> **Status:** COMPLETED

## Purpose

This plan guides the Pencil design update for the `SelectedDatePanel` to match the new day-recording interaction contract.

Read this first: [docs/design/menstrual/function-day-recording.md](../design/menstrual/function-day-recording.md)

That document is the authoritative UX contract. This plan is the execution guide derived from it. When in doubt, the design doc wins.

## Source Files

- Pencil file: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`
- Component library board: node `bi8Au`
- Business page state overview: node `NNUWu`

## Scope Of Changes

Two component nodes need updating:

1. **`Composite/SelectedDatePanel`** (node `AGEIj`) — panel structure
2. **`Composite/SingleDayClickEditor`** (node `YAPOj`) — to be unbundled; its child primitives survive independently

Five page-instance states in the business file (node `NNUWu`) need to be created or replaced:

- Current `recordedPanel` (node `7feFs`) — replace
- Current `singlePanel` (node `hvrEj`) — replace
- Add 3 new instances (see Step 2)

## Step 1 — Update `Composite/SelectedDatePanel` (node `AGEIj`)

### Current children

```
AGEIj
├── clUNn  (head: title + badge)
├── cI1De  (chip row: 经期 + 特殊标记)
├── 2WMXA  (editor area — refs SingleDayClickEditor)
└── YayuR  (action button: 保存当天记录)
```

### Target children

```
AGEIj
├── clUNn          (head: title + badge)         — keep as-is
├── cI1De          (chip row)                    — modify second chip
│   ├── hiZ3i      (经期 chip)                   — keep
│   └── GxhTZ      → rename to recordDetailChip, label "+ 记录详情"
├── summaryBarSlot  (conditional)                — ref uqMCN when attributes exist
├── gridSlot        (conditional)                — ref aRXKk when grid is expanded
└── clearButtonSlot (conditional)                — 清空 button when attributes exist
```

### Specific changes

- **`cI1De` chip row**: change the second chip (`GxhTZ`) from `特殊标记` to `+ 记录详情`. Keep `$color.bg.subtle` fill. Change label text only. Rename node to `recordDetailChip`.
- **Remove `YayuR`** (保存当天记录): replace with a `清空` button. Use `$color.bg.subtle` background, `$color.text.secondary` text. This is NOT an accent button — do not use `$color.accent.period`.
- **Unbundle `2WMXA`**: replace the single `SingleDayClickEditor` ref with two independent refs — `ThreeAttrStateSummary` (uqMCN) for the summary bar and `stateMatrix` (aRXKk) for the grid. Each is conditionally present.

## Step 2 — Create Page Instances For Each State (node `NNUWu`)

Replace the current `recordedPanel` (7feFs) and `singlePanel` (hvrEj) with these 5 states:

| State | 经期 | Summary bar | Grid | 清空 | Badge |
|---|---|---|---|---|---|
| Default (no data) | inactive | — | — | — | 点击记录 |
| Period only | active | — | — | — | 已记录 |
| Attributes recorded, collapsed | active | visible | — | — | 已记录 |
| Grid expanded, attributes selected | active | visible | visible | visible | 已记录 |
| Grid expanded, no attributes yet | inactive | — | visible | — | 点击记录 |

The fifth state (grid open but no attributes) is new — it shows the entry UX before any selection is made.

## Step 3 — Preserve Reusable Primitives

Do NOT modify these — they are already correct:

- `Primitive/ThreeAttrStateSummary` (node `uqMCN`) — keep internal structure; allow 1-2 slot partial rendering via flex layout
- `stateMatrix` inside `SingleDayClickEditor` (node `aRXKk`) — keep all styling, tone colors, selected-state emphasis rules
- All `attribute.flow.*`, `attribute.pain.*`, `attribute.tone.*` token families — already locked

`Composite/SingleDayClickEditor` (node `YAPOj`) may be deprecated after this update. Its two child primitives (summary + matrix) are consumed directly by `SelectedDatePanel`.

## Step 4 — Token Consumption For New Elements

No new tokens are needed. Map new elements to existing tokens:

| Element | Token |
|---|---|
| RecordDetailChip background | `$color.bg.subtle` |
| RecordDetailChip text | `$color.text.secondary` |
| ClearButton background | `$color.bg.subtle` |
| ClearButton text | `$color.text.secondary` |
| Summary bar container | `#faf3ebff` (existing from uqMCN, keep as-is) |
| Grid container | `$color.bg.base` (existing from aRXKk, keep as-is) |

## Done Criteria

- `Composite/SelectedDatePanel` (AGEIj) reflects the new chip layout and conditional structure
- All 5 page-instance states exist in `NNUWu` and match the state table above
- `保存当天记录` button is gone; `清空` button exists with secondary styling
- `ThreeAttrStateSummary` and `stateMatrix` primitives are untouched
- `特殊标记` chip is removed from the panel chip row
