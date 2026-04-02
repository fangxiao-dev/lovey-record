# Day Recording

## Purpose

This document defines the complete interaction model for single-day recording on the menstrual home page.

It covers how users mark period status, record optional attributes, and manage recorded data for a single date.

This is the authoritative UX contract for the `SelectedDatePanel` and its child surfaces.

## Design Philosophy

- Most users only need period date marking; attribute details are secondary.
- Recording should feel lightweight, not like filling a medical form.
- Attributes are subjective relative values, not clinical absolutes. Their primary long-term value is intra-user trend comparison across cycles.
- The system should not force users to record attributes just because they marked a period day.
- Notes are lightweight context, not a competing state axis; they can exist on period or non-period explicit days.
- When attributes are recorded, they may enable future trend insights (e.g. "your pain has been increasing over the past 3 cycles"), but this is a forward capability, not a current commitment.

## Value Hierarchy Of Recorded Attributes

Based on information density and user recording motivation:

1. **Pain** (highest) - strongest subjective signal, highest recording motivation, most useful for cross-cycle trend detection
2. **Flow** (medium) - useful for pattern awareness, but harder to self-calibrate consistently
3. **Color** (lowest) - most subjective, lowest information density, weakest cross-cycle reliability

This hierarchy should inform future prioritization decisions (e.g. if simplifying the UI further, color is the first candidate to remove).

## Interaction Model

### Entry Points

The panel always shows two independent chips:

```
[ 月经 / 月经开始 / 月经结束 ]   [ + 记录详情 ]
```

- Contextual period chip: single-day smart period action for this date. Independent of attribute recording.
- `+ 记录详情` chip: opens/closes the attribute editor grid.

These two chips are always visible regardless of recording state. A user can:
- Mark period without recording attributes
- Record attributes without marking period
- Do both
- Do neither

### Period Chip Behavior

The period chip is no longer a blind `经期` toggle. It is a contextual action chip:

- `not-period`: show `月经`, unselected. Tapping starts a new segment here; if no bridge applies, the backend auto-fills forward by `defaultPeriodDurationDays - 1`.
- `start`: show selected `月经开始`. Tapping revokes the whole current segment.
- `in-progress`: show selected `月经结束`. Tapping means "所选这一天是该段经期的最后一天" and clears only later dates in the same segment.
- `end`: show selected `月经结束`. Tapping is currently a no-op.

If the selected `月经` would bridge to nearby existing period records, the page must show the backend-provided confirmation prompt before applying.

Period action does not affect recorded attributes or note content. They remain independent data axes.

### Record Detail Chip Behavior

The `+ 记录详情` chip controls the attribute editor grid:

- **Collapsed state**: chip shows `+ 记录详情`
- **Expanded state**: chip shows `↑ 收起`
- Tap toggles between these two states.
- The chip remains in the same position; only its label and icon direction change.
- Switching to a different date auto-collapses the grid.

### Attribute Editor Grid

When expanded, the grid shows three rows:

```
流量   极少  少  正常  多  极多
疼痛   无    轻  正常  强  极强
颜色   极浅  浅  正常  深  极深
```

Each row has 5 options. Selection behavior:

- Tap an unselected option: selects it, immediately persisted (WYSIWYG).
- Tap the currently selected option: deselects it, attribute returns to empty (no value recorded).
- Tap a different option in the same row: switches selection, immediately persisted.
- No save button is needed; every tap is an atomic state change.

### Summary Bar

The summary bar shows a compact horizontal strip with recorded attribute values.

The summary bar is **always visible** (permanent fixture in the panel). It does not appear or disappear based on recording state.

| State | Summary bar content |
|---|---|
| No attributes recorded | Empty frame with hint text: "选择属性后将显示在这里" |
| 1+ attribute recorded | Showing only recorded attribute chips |
| All 3 attributes recorded | Showing all three chips |

When an attribute is deselected (returns to empty), its chip disappears from the summary bar. If the last attribute is deselected, the bar returns to the empty hint state.

The summary bar chip fill color matches the corresponding option cell in the attribute grid exactly (same tone, no stroke). This gives users a direct visual connection between what they selected and what the summary shows.

**Rationale**: a permanent summary bar reduces cognitive load — users always know where to look for their selections, and there is no layout shift when attributes are added or removed.

**Critical rule**: empty value is NOT represented by "正常". Empty means "not recorded". "正常" (level 3) is a meaningful recorded value. Confusing these would pollute data semantics and break future trend analysis.

### Clear Button

A `清空` button appears below the attribute grid when at least one attribute is recorded.

Rules:
- `清空` clears all three attribute values. It does NOT affect period status.
- `清空` only renders when there is at least one recorded attribute.
- No confirmation dialog or undo toast. The data is minimal (3 attributes) and trivially re-enterable.
- After clearing, the summary bar disappears and the grid resets to no selections.

### Note Input

A lightweight note input sits at the bottom of `SelectedDatePanel`.

Rules:
- The input is always available for the selected day.
- Note editing is independent of both `经期` and recorded attributes.
- Blurring the field writes the current note immediately; no separate save button is used.
- Empty note means "no note". Clearing the field and blurring should remove note content for that explicit day.
- `note-only` is a valid state:
  - it keeps the badge at `已记录`
  - it does not create the eye marker
  - it does not imply `isPeriod = true`
- Maximum length remains `500` characters.

### Badge (Top-Right Corner)

The badge in the panel header reflects recording state:

| State | Badge text |
|---|---|
| No period marked AND no attributes recorded | `点击记录` |
| Period marked OR any attribute recorded | `已记录` |
| Date is today | `今日` (takes precedence) |

## Panel State Machine

### State Definitions

The panel has 4 orthogonal state axes:

1. **Period status**: `unmarked` | `marked`
2. **Attributes**: `empty` | `partial` | `full` (0, 1-2, or 3 attributes recorded)
3. **Grid visibility**: `collapsed` | `expanded`
4. **Note presence**: `empty` | `recorded`
5. **Date context**: `past` | `today` | `future` (future dates are read-only)

### Composite States And Their Rendering

**Initial state (no data, collapsed)**:
```
3 月 26 日                           点击记录
[ 月经 ]   [ + 记录详情 ]
选择属性后将显示在这里               ← summary bar, empty hint
```

**Period marked only (collapsed)**:
```
3 月 26 日                           已记录
[ 月经开始 ✓ ]   [ + 记录详情 ]
选择属性后将显示在这里               ← summary bar, empty hint
```

**Attributes recorded, grid collapsed**:
```
3 月 26 日                           已记录
[ 月经结束 ✓ ]   [ + 记录详情 ]
[流量 正常] [疼痛 轻]                ← summary bar (only recorded slots)
```

**Grid expanded, some attributes selected**:
```
3 月 26 日                           已记录
[ 月经结束 ✓ ]   [ ↑ 收起 ]
[流量 正常] [疼痛 轻]                ← summary bar

流量   极少  少  [正常]  多  极多
疼痛   无   [轻]  正常  强  极强
颜色   极浅  浅  正常  深  极深     ← no selection in this row

              [ 清空 ]
```

**Grid expanded, no attributes selected yet**:
```
3 月 26 日                           点击记录
[ 月经 ]   [ ↑ 收起 ]

流量   极少  少  正常  多  极多
疼痛   无    轻  正常  强  极强
颜色   极浅  浅  正常  深  极深

                                    ← no summary bar, no 清空 button
```

## Component Architecture

### Hierarchy

```
SelectedDatePanel
├── Head (title + badge)
├── ChipRow
│   ├── PeriodChip          ← contextual single-day action chip, accent when selected day is already in a segment
│   └── RecordDetailChip    ← "+ 记录详情" / "↑ 收起"
├── SummaryBar              ← always rendered
│   ├── EmptyHint           ← shown when attributes.length === 0
│   └── SummarySlot × N     ← one per recorded attribute, hidden when none
├── AttributeGrid           ← conditional: only when grid is expanded
│   ├── FlowRow
│   ├── PainRow
│   └── ColorRow
└── ClearButton             ← conditional: only when attributes.length > 0
└── NoteInput               ← always rendered, blur-to-save
```

### Reusable Primitives From Component Library

The following existing Pencil primitives should be consumed, not recreated:

- `Primitive/ThreeAttrStateSummary` (node `uqMCN`) — visual language for the summary bar. Adapt to support partial rendering (1-2 slots instead of always 3).
- `Composite/SingleDayClickEditor` stateMatrix (node `aRXKk`) — the 3-row attribute grid. Already has correct option styling, selected state emphasis, and tone-based coloring.
- Attribute token families (`attribute.flow.*`, `attribute.pain.*`, `attribute.tone.*`) — already locked in the token system.

### New Elements To Create

- **RecordDetailChip**: a chip that toggles between `+ 记录详情` and `↑ 收起`. Should be implemented as a stateful chip variant, not a new component type. Reuse the existing chip styling from `ChipRow`.
- **ClearButton**: a secondary-emphasis button. Use `bg.subtle` background with `text.secondary` label. Should NOT use `accent.period` (that's reserved for primary actions like the period chip).
- **Partial SummaryBar**: the current `ThreeAttrStateSummary` assumes all 3 slots are always present. It needs to support rendering 1 or 2 slots gracefully. The layout should use `flex` with `gap`, so fewer slots naturally distribute.

### Elements To Remove Or Replace

- **`保存当天记录` button** (node `YayuR` in Pencil, `action` slot in Vue): replaced by WYSIWYG behavior + `清空` button.
- **`特殊标记` chip**: this is NOT part of the day recording panel. Recorded attribute marks are expressed as eye markers on `DateCell` and belong to the calendar grid layer, not the recording panel. Remove from `SelectedDatePanel` chip row.
- **Summary bar**: always rendered. When no attributes are recorded, shows hint text "选择属性后将显示在这里" instead of chips. The previous design had conditional rendering; this is now permanent.

## Diff From Current Design

### vs. Current Pencil (`Composite/SelectedDatePanel`, node `AGEIj`)

| Aspect | Current Pencil | New Design |
|---|---|---|
| Chips | `经期` + `特殊标记` | contextual `月经 / 月经开始 / 月经结束` + `+ 记录详情` / `↑ 收起` |
| Summary bar | Always present inside `SingleDayClickEditor` | Conditional, lives directly in `SelectedDatePanel` |
| Attribute grid | Part of `SingleDayClickEditor` composite | Inline in `SelectedDatePanel`, controlled by RecordDetailChip |
| Action button | `保存当天记录` (always present) | `清空` (conditional, only when attributes exist) |
| Grid open/close | Tap summary bar (no affordance) | Tap `+ 记录详情` chip (explicit affordance) |

### vs. Current Vue (`SelectedDatePanel.vue`)

| Aspect | Current Vue | New Design |
|---|---|---|
| `chips` prop | `['经期', '特殊标记']` | contextual `月经 / 月经开始 / 月经结束` chip + `+ 记录详情` stateful expand/collapse chip |
| `summaryItems` | Always rendered | Always rendered; empty state shows hint text |
| `isEditorOpen` | Toggled by tapping summary row | Toggled by tapping RecordDetailChip |
| `actionLabel` | `'保存当天记录'` (always visible) | `'清空'` (visible only when attributes recorded) |
| Attribute selection | No deselect behavior | Re-tap selected option = deselect |

### vs. Current Domain Model (`DayRecord`)

The domain model already supports this design with no changes needed:

- `is_period` is independent of `pain_level` / `flow_level` / `color_level` — matches the two-chip independence.
- Attributes have a default of `3` in the domain model, but this is a **persistence default**, not a UI default. The UI should treat "no selection" as "not recorded" and only write the default when the user explicitly taps level 3.
- `isDetailRecorded` is derived from whether one or more attributes are recorded. If no attributes are recorded, no eye marker should appear. This is consistent.

## Related Documents

- [function-home.md](function-home.md) — page structure and must-preserve rules
- [function-recording-model.md](function-recording-model.md) — core recording model (users edit days, system derives segments)
- [date-state-spec.md](date-state-spec.md) — date state visual rules
- [token-component-mapping.md](token-component-mapping.md) — token consumption contracts
- [../../contracts/domain-models/menstrual-domain-model.md](../../contracts/domain-models/menstrual-domain-model.md) — domain model
- [../2026-03-28-ui-collaboration-lessons.md](../2026-03-28-ui-collaboration-lessons.md) — Pencil-to-code collaboration rules

## Source Of Truth

- Pencil component library: `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`, node `bi8Au`
- Business file page instances: same file, node `NNUWu`
- This document is the authoritative UX contract; if Pencil and this doc disagree, update Pencil to match this doc.
