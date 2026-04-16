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
- `period / prediction / today / detail-recorded` remain distinguishable with restrained hierarchy

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
- if `today` is outside the latest segment, the home shows the current cycle phase instead of the old binary `非经期` label
- the out-of-period phase is derived from `lastPeriodStartDate`, `defaultCycleLengthDays`, and `defaultPeriodDurationDays`
- the non-period hero states are `卵泡期`, `排卵期`, and `黄体期`; each state carries one inline hint string
- `排卵期` and `黄体期` final 7 days use an emphasized amber treatment, but they still derive from the same home read model
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

## Future-Date Read-Only Rule

- `date > today` remains read-only for direct user interaction.
- the system may still surface future auto-filled period days after a confirmed start-day action extends across `today`.
- those future auto-filled period days keep the same readable period surface treatment as normal period days, but remain interaction-blocked because they are still future dates.
- tapping a future day, including a future auto-filled period day, remains a no-op.

## Related Docs

- [function-calendar.md](./function-calendar.md)
- [function-day-recording.md](./function-day-recording.md)
- [frontend-home.md](./frontend-home.md)
