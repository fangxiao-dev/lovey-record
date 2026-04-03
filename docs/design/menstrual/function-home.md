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
- if `today` is outside the latest segment, the home shows the out-of-period state
- if later bridge or extension logic changes the latest segment, the hero status and reference ranges must update with the refreshed home read model

## Shortcut Semantics

- `今天` jumps to today's week / focus surface
- `上次` jumps to the previous segment `startDate`
- `上次` is disabled when no previous segment exists
- `下次预测` jumps to the prediction start when prediction exists
- the old `本次` shortcut semantics are absorbed by the hero status layer and should not remain as a separate shortcut

## Related Docs

- [function-calendar.md](./function-calendar.md)
- [function-day-recording.md](./function-day-recording.md)
- [frontend-home.md](./frontend-home.md)
