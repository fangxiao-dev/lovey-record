# Backend Period Model Runtime Snapshot

> **Status:** COMPLETED

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Document the aligned backend period model so the active contract surface stays centered on `isPeriod`, `source`, anchored period segments, `ModuleSettings`, and derived `isDetailRecorded` labels.

**Architecture:** Keep `day_record` as persisted truth, derive anchored period segments from first-day anchors plus automatic fill, and recompute predictions from segment starts. Module settings hold the default duration used for future auto-fill, while detail fields remain attached metadata that can produce a derived deviation label.

**Tech Stack:** Node.js 20, Express 4, TypeScript 5, Prisma 5, Jest, Supertest, MySQL 8.0

---

## Current Status

- Backend runtime is already aligned to the new model and was verified before this doc refresh.
- The remaining work in this file is to keep the active backend documentation consistent with the runtime and with the long-lived contracts in `docs/contracts/`.
- No frontend/UI work belongs here.

## Contract Surface

### Persisted Model

- `DayRecord`
  - `isPeriod`
  - `source`
  - attached detail levels
  - note
- `ModuleSettings`
  - `defaultPeriodDurationDays`

### Derived Model

- anchored period segments
- prediction windows
- `isDetailRecorded`
- calendar and home read models

### Active Commands

- `createModuleInstance`
- `recordPeriodDay`
- `clearPeriodDay`
- `recordDayDetails`
- `recordDayNote`
- `updateDefaultPeriodDuration`
- `shareModuleInstance`
- `revokeModuleAccess`

### Active Queries

- `getModuleHomeView`
- `getDayRecordDetail`
- `getCalendarWindow`
- `getPredictionSummary`
- `getModuleAccessState`
- `getModuleSettings`

## Invariants

- A period day is stored with `isPeriod = true`.
- `source` explains whether the day was manual or auto-filled.
- The first period day anchors the segment.
- Auto-fill follows `defaultPeriodDurationDays`.
- Clearing a day inside the tail truncates that day and later tail days in the same segment.
- Detail edits do not change period membership by themselves.
- `isDetailRecorded` is derived from whether any detail attribute has been recorded.
- Private and shared entry points resolve to the same module instance.

## Verification Notes

- Use repo-wide search against `docs/contracts`, `docs/plans`, `project-context.md`, and `docs/README.md` to keep old command and old state names out of active docs.
- Re-open edited docs after changes to confirm links, titles, and terminology remain consistent.
- Keep this file free of historical command names and legacy state names.

## Out Of Scope

- Frontend/UI docs
- Design drafts
- Backend runtime code changes
- Migration or backfill work
