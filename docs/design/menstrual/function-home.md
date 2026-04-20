# Menstrual Home Function

## Purpose

This document defines the durable feature and interaction contract for the menstrual home page.

For the frontend/UI presentation contract, read the paired frontend doc:

- [frontend-home.md](./frontend-home.md)

For durable home read-model semantics, read:

- [../../contracts/application-contracts/menstrual-application-contract.md](../../contracts/application-contracts/menstrual-application-contract.md)

## Role

The menstrual home is the module's main workbench.

It must answer current status before exposing deeper browsing and editing.

## Must Preserve

- home answers current status first
- single-day editing stays inline on the home page
- long-press drag is the primary batch-edit path
- month view is browse-only support, not a second editor
- 聚焦模式 acts as the focused-view browsing surface for period occurrences
- 聚焦模式 uses a compact 2-row / 14-day focused window for current recording
- `period / prediction / today / detail-recorded` remain distinguishable with restrained hierarchy
- entering the page should restore the last user-selected `view type` when available
- the page must remember only `聚焦模式 / 月览`, not the previous browse position inside either view

## States

The home page must cover:

- default state
- recorded state
- single-day edit state
- batch-edit state
- detail-recorded marker state
- future-date blocked state

## Hero Behavior

- the hero is status-first
- current status is derived from the latest recomputed segment, not from stale text
- if `today` is inside the latest segment, the home shows the in-period state
- if no historical period segment exists yet, the hero shows `暂无记录` and invites the user to record their first period
- if `today` is outside the latest segment and historical segment data exists, the home shows the current cycle phase instead of the old binary `非经期` label
- the out-of-period phase is derived from the latest real segment plus the same `predictionSummary.predictedStartDate` that powers the hero `下次` range
- `defaultCycleLengthDays` may remain an upstream prediction input, but once `predictedStartDate` exists, the hero phase should follow that prediction anchor rather than recomputing a separate display-only timeline
- the non-period hero states are `卵泡期`, `排卵期`, and `黄体期`; each state carries one inline hint string
- `排卵期` and `黄体期` final 7 days use an emphasized amber treatment, but they still derive from the same home read model
- if historical segment data exists but the prediction chain is not yet sufficient to classify one of the three non-period phases, the hero should use a neutral coarse cycle state rather than an exception-style fallback
- that coarse cycle state uses:
  - primary status: `记录中`
  - hint text: `记录更多以生成预测`
- the empty state `暂无记录` is not a phase; it is the fallback hero state before any period data exists
- if later bridge or extension logic changes the latest segment, the hero status and reference ranges must update with the refreshed home read model

## Shortcut Semantics

- `今天` jumps to today's week / focus surface
- `上次` jumps to the previous segment `startDate`
- `上次` is disabled when no previous segment exists
- `下次预测` jumps to the prediction start when prediction exists
- prediction always follows the latest recomputed period segment `startDate`; if the latest real segment moves because of new records or revokes, the shortcut target moves with it
- hero `下次` displays the predicted period range, derived as `predictedStartDate + defaultPeriodDurationDays - 1`
- CalendarGrid uses that same predicted period range as the visible prediction highlight span
- the `下次预测` shortcut still jumps to the predicted start date only; it does not jump to the whole range
- the old `本次` shortcut semantics are absorbed by the hero status layer and should not remain as a separate shortcut

## Focused-View Browsing Semantics

- The home page's `聚焦模式` calendar is not a generic rolling date pager; it is the focused-view surface for browsing period occurrences.
- The focused-view navigation anchor is always the `period start date`.
- Header navigation moves across `previous period occurrence` and `next period occurrence`, rather than moving by natural week or month units.
- The focused window is a fixed 2-row / 14-day surface.
- The default focused occurrence should land in the first row of that surface.
- When the focused node reaches `下次预测`, forward browsing stops there:
  - the right-side forward action becomes invalid
  - repeated taps do not navigate further
  - inline feedback is shown as `暂无更后的月经记录`
- Backward browsing from `下次预测` returns to the most recent real period record.

## View Mode Memory

- The page should reopen in the last user-selected `view type`.
- Supported remembered values are:
  - `聚焦模式`
  - `月览`
- This memory affects only which view is active after page entry or reload.
- This memory must not persist or restore:
  - focused occurrence date
  - month-browse anchor
  - selected date
  - jump-tab target
- If no prior view memory exists yet, the page may fall back to the current system default initial view behavior.

## Future-Date Read-Only Rule

- `date > today` remains read-only for direct user interaction.
- the system may still surface future auto-filled period days after a confirmed start-day action extends across `today`.
- those future auto-filled period days keep the same readable period surface treatment as normal period days, but remain interaction-blocked because they are still future dates.
- tapping a future day, including a future auto-filled period day, remains a no-op.

## Related Docs

- [function-calendar.md](./function-calendar.md)
- [function-day-recording.md](./function-day-recording.md)
- [frontend-home.md](./frontend-home.md)
