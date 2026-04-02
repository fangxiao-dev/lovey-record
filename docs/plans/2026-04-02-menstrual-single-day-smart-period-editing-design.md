# Menstrual Single-Day Smart Period Editing Design

**Date:** 2026-04-02

## Purpose

Freeze the product semantics for single-day period editing before implementation.

This design replaces the current hidden `period toggle + unconditional auto-fill` behavior with a clearer single-day action model based on contextual meaning:

- `月经开始`
- `月经结束`

It also defines when bridging existing period segments is allowed, when confirmation is required, and how this model stays separate from batch selection.

## Why This Design Exists

The current runtime behavior and the current contract have drifted:

- current single-day runtime calls `recordPeriodDay`
- backend implementation currently auto-fills `N-1` days unconditionally after the selected date
- current contract direction says only a recognized new start should auto-fill
- batch selection already behaves differently: it writes the explicit selected range and does not auto-fill outside the range

This document freezes the intended product semantics so frontend, backend, and tests can align around the same rules.

## Goals

- Make the user-visible single-day action predictable
- Keep the UI simple and lightweight
- Preserve realistic menstrual-record editing behavior
- Allow intelligent segment bridging, but only with explicit confirmation
- Keep batch selection as a separate explicit-edit model

## Non-Goals

- Do not introduce persisted `start` / `in-progress` / `end` fields
- Do not redesign batch selection in this document
- Do not change attribute or note semantics in this document
- Do not introduce advanced anomaly analysis or probabilistic inference

## Final UI Model

The single-day period control is no longer treated as a generic boolean toggle.

The panel shows one contextual period chip:

- `not-period`: show `月经开始`, unselected
- `start`: show `月经开始`, selected
- `in-progress`: show `月经结束`
- `end`: show `月经结束`

Important:

- `start / in-progress / end / not-period` are derived UI semantics, not new persisted states
- the chip text carries the primary action meaning
- color/state styling distinguishes whether the selected day is already inside a period segment

## Source-of-Truth Model

Persistence remains day-based:

- `day_record.isPeriod`
- detail fields
- note

Segment semantics are derived from consecutive `isPeriod = true` days:

- first day of a segment => `start`
- middle days => `in-progress`
- last day => `end`
- outside all segments => `not-period`

No new persisted segment-role field should be added for this feature.

## Single-Day Action Rules

### Rule A: `月经开始` on `not-period`

When the selected day is outside any existing period segment:

1. check whether this action triggers bridging
2. if no bridging applies:
   - treat the selected day as a new period start
   - auto-fill forward by `N-1` days, where `N` is `defaultPeriodDurationDays`
3. if bridging applies:
   - show a confirmation prompt first
   - only apply the bridging write after confirmation

### Rule B: `月经开始` on `start`

When the selected day is already the start of a period segment:

- the chip still reads `月经开始`
- the chip is shown in selected state
- tapping it means: revoke this start judgment
- result: remove the entire current segment

This rule applies to both:

- single-day segments
- multi-day segments

### Rule C: `月经结束` on `in-progress` or `end`

The fixed meaning is:

`所选这一天是该段经期的最后一天`

Important:

- this refers to the selected date, not system `today`

Result:

- keep the selected date as `period`
- clear all later `period` dates in the same continuous segment
- the selected date becomes the new `end`

If the selected date is already `end`:

- default result is no change
- no implicit extra removal happens

## Bridging Rules

Bridging only belongs to the `月经开始` action on a `not-period` day.

Bridging threshold:

- use `N-1` as the maximum gap length that can still be treated as the same period continuation

### Forward Bridge

Condition:

- there is an existing period segment before the selected day
- the gap from that segment to the selected day is `<= N-1`

Effect:

- fill the gap
- include the selected day in that existing segment

Prompt:

- `把这段经期延长到 MM/DD？`

### Backward Bridge

Condition:

- there is an existing period segment after the selected day
- the gap from the selected day to that later segment is `<= N-1`

Effect:

- move the segment start earlier to the selected day
- fill the gap between the selected day and that later segment

Prompt:

- `已在 MM/DD 标记了经期开始，要提前到 MM/DD 吗？`

The first `MM/DD` refers to the existing start date.
The second `MM/DD` refers to the newly selected date.

### Two-Sided Bridge

Condition:

- both the previous and the next period segments are within bridgeable distance

Effect:

- fill the gaps
- merge nearby period records into one continuous segment

Prompt:

- `附近已有经期记录，是否合并？`

## Priority Rules

The action resolver must evaluate in this order:

1. determine whether the selected date is already inside a period segment
2. if inside a segment:
   - if the selected date is `start`, apply Rule B
   - otherwise apply Rule C
   - do not enter bridge detection
3. if outside a segment:
   - evaluate bridge conditions
   - if bridging applies, require confirmation
   - if no bridging applies, apply Rule A normal start behavior

This ordering is required to avoid mixing:

- revoke-start semantics
- end-here semantics
- bridge-start semantics

## Relationship With Batch Selection

Batch selection remains a separate explicit-edit model.

Batch rules stay unchanged:

- batch writes the explicitly selected dates only
- batch does not trigger smart auto-fill
- batch does not trigger smart bridging
- batch does not reuse single-day `开始/结束` semantics

Reason:

- batch is an explicit manual range decision
- single-day smart rules should not silently expand a batch operation beyond what the user selected

## Relationship With Detail And Note

Details and note remain independent.

This design does not change:

- attribute recording
- note recording
- attribute/note persistence rules

Single-day smart period editing must not implicitly change:

- detail levels
- note content

## Recommended Contract Changes

### Frontend Interaction Contract

The single-day panel contract should move from a boolean `period toggle` interpretation to a contextual action interpretation.

The contract should be able to express:

- derived day position relative to the current period segment
- current chip text
- whether the chip is shown as selected
- whether this action requires a confirmation prompt

### Backend Command Semantics

The current single-day command surface likely needs to be split conceptually, even if not exposed as separate endpoints yet.

Implementation may still hide this behind one endpoint family, but product semantics must support these distinct outcomes:

- start new segment with forward auto-fill
- revoke whole segment from segment start
- truncate a segment so the selected date becomes the end
- bridge forward
- bridge backward
- merge both sides

### Explainability

When confirmation is needed, the resolver should provide enough information for the frontend prompt to render correctly:

- bridge type
- existing affected start/end dates
- target selected date
- resulting segment range after confirmation

## Recommended Testing Additions

The final implementation should cover at least these cases:

- `not-period` -> `月经开始` creates a fresh segment and auto-fills `N-1`
- `start` -> tap selected `月经开始` removes the whole segment
- `in-progress` -> `月经结束` keeps the selected day and truncates later days
- `end` -> `月经结束` is a no-op
- forward bridge prompts and, after confirmation, extends the segment
- backward bridge prompts and, after confirmation, moves the start earlier
- two-sided bridge prompts and, after confirmation, merges both sides
- batch selection remains explicit-only and does not trigger smart auto-fill or bridging

## Implementation Notes

The implementation should prefer a single shared resolver that returns a structured decision object before persistence.

That resolver should answer:

- is the selected date inside a segment
- if yes, is it `start`, `in-progress`, or `end`
- if not, is forward/backward/two-sided bridging applicable
- does the action require confirmation
- what exact dates will be written or cleared

This keeps:

- frontend chip behavior
- prompt behavior
- backend writes
- automated tests

aligned around the same rule engine.

## Final Decision Summary

- single-day period editing uses contextual `月经开始` / `月经结束` semantics
- `start` still displays `月经开始` and tapping it revokes the whole segment
- `in-progress` and `end` display `月经结束`
- `月经结束` always means the selected date becomes the final day of the segment
- any bridging requires confirmation
- batch selection stays explicit and separate
- persistence remains day-record-based; segment roles stay derived
