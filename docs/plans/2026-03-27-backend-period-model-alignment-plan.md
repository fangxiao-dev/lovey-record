# Backend Period Model Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the existing backend with the new menstrual period model: first-day anchoring, automatic fill by default duration, tail truncation, removal of `spotting` as a primary state, and deviation as a derived label.

**Architecture:** Keep the backend centered on `day_record` as persisted truth, but change the meaning of that truth from `bleeding_state` rows to `is_period` rows with `source`. Introduce module-level settings for default duration, update command semantics from generic day-state toggles to period-segment operations, and rebuild derived cycles/predictions from anchored segments instead of raw consecutive-period scanning alone.

**Tech Stack:** Node.js 20, Express 4, TypeScript 5, Prisma 5, Jest, Supertest, MySQL 8.0

---

## Context To Read First

- `docs/contracts/domain-models/2026-03-23-menstrual-domain-model.md`
- `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md`
- `docs/contracts/use-cases/2026-03-23-menstrual-core-use-cases.md`
- `backend/prisma/schema.prisma`
- `backend/src/services/dayRecord.service.ts`
- `backend/src/services/query.service.ts`
- `backend/src/services/phase5.service.ts`

## Current Gaps To Close

1. The Prisma schema still models day state as `bleedingState: PERIOD | SPOTTING`; the new contract requires `isPeriod` plus `source`.
2. There is no persisted module-level setting for default period duration.
3. Commands still expose old names and old semantics: `recordDayState`, `recordDateRangeAsPeriod`, `clearDayRecord`.
4. Current write behavior never auto-fills a tail after first-day recognition.
5. Current clear behavior removes only one day; the new contract requires truncating the tail from the cleared date onward.
6. Current derived cycle logic still groups raw consecutive `PERIOD` dates rather than reconstructing anchored segments from the new semantics.
7. Query payloads still return `bleedingState` and `none` rather than `isPeriod`, `source`, and `hasDeviation`.
8. Current calendar/home read models do not expose `period_start` semantics.
9. Some day-edit commands are owner-only today, but the product contract says partner access should maintain the same record set.

## Open Question Blocking Full Correctness

- The new product direction says users usually know a pattern like "first day lighter, middle heavier, last day lighter", but the current rewritten contract still assumes default detail values are constant. Before implementation, confirm whether the default detail pattern is:
  - constant defaults for every period day (`pain=3`, `flow=3`, `color=3`), or
  - cycle-position-dependent defaults (for example different defaults for first/middle/last day).

Implementation can start with constant defaults if needed, but if the real product rule is cycle-position-dependent, the service/model design should account for that from the start.

## Task 1: Lock Contract Delta With One Backend Alignment Note

**Files:**
- Create: `docs/plans/2026-03-27-backend-period-model-alignment-plan.md`
- Modify: `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md`

**Step 1: Write the failing documentation check**

Create a checklist in the plan that lists every old backend contract term that must disappear from code-facing semantics:

- `bleedingState`
- `spotting` as a primary state
- `recordDayState`
- `recordDateRangeAsPeriod`
- `clearDayRecord`

**Step 2: Run a repo search to verify these old terms still exist in backend code**

Run: `Get-ChildItem backend -Recurse -File | Select-String -Pattern 'bleedingState|SPOTTING|recordDayState|recordDateRangeAsPeriod|clearDayRecord'`
Expected: matches in schema, services, tests, and possibly routes.

**Step 3: Write the alignment note**

Document in the plan that implementation must remove or adapt every old-term usage in backend runtime code while preserving migration safety.

**Step 4: Re-run the search after implementation**

Run the same search.
Expected: only migration or compatibility references remain, or none if the rename is complete.

**Step 5: Commit**

```bash
git add docs/plans/2026-03-27-backend-period-model-alignment-plan.md
git commit -m "docs: add backend period model alignment plan"
```

## Task 2: Replace The Persisted Day Model In Prisma

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Test: `backend/tests/services/dayRecord.service.test.ts`

**Step 1: Write the failing test**

Add a service-level expectation that created day records now persist:

```ts
expect(prisma.dayRecord.upsert).toHaveBeenCalledWith(
  expect.objectContaining({
    create: expect.objectContaining({
      isPeriod: true,
      source: 'manual',
    }),
  }),
);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: FAIL because the service still writes `bleedingState`.

**Step 3: Write minimal implementation**

Update Prisma schema:

- replace `bleedingState` with `isPeriod Boolean`
- make `source` required and constrain it with an enum such as `MANUAL | AUTO_FILLED`
- remove `BleedingState`
- add `ModuleSettings` with `defaultPeriodDurationDays`
- add `defaultDurationDays` to `DerivedCycle` if that field is kept in the domain contract

**Step 4: Regenerate Prisma types**

Run: `npm run db:generate`
Expected: Prisma client updates cleanly.

**Step 5: Run tests to verify they pass**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: PASS after service updates catch up.

**Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/tests/services/dayRecord.service.test.ts
git commit -m "feat: update menstrual persistence model"
```

## Task 3: Add Module Settings Access For Default Period Duration

**Files:**
- Create: `backend/src/services/moduleSettings.service.ts`
- Create: `backend/tests/services/moduleSettings.service.test.ts`
- Modify: `backend/src/services/moduleInstance.service.ts`

**Step 1: Write the failing test**

Test that creating a module instance also creates default settings:

```ts
expect(prisma.moduleSettings.create).toHaveBeenCalledWith({
  data: {
    moduleInstanceId: 'module-1',
    defaultPeriodDurationDays: 6,
  },
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand tests/services/moduleInstance.service.test.ts`
Expected: FAIL because settings are not created.

**Step 3: Write minimal implementation**

- create settings on module creation
- add a service to read and update default duration
- keep the default duration in one place, not duplicated in controller logic

**Step 4: Run focused tests**

Run:
- `npm test -- --runInBand tests/services/moduleInstance.service.test.ts`
- `npm test -- --runInBand tests/services/moduleSettings.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/moduleInstance.service.ts backend/src/services/moduleSettings.service.ts backend/tests/services/moduleInstance.service.test.ts backend/tests/services/moduleSettings.service.test.ts
git commit -m "feat: add module period duration settings"
```

## Task 4: Replace `recordDayState` With `recordPeriodDay`

**Files:**
- Modify: `backend/src/services/dayRecord.service.ts`
- Modify: `backend/src/controllers/dayRecord.controller.ts`
- Modify: `backend/src/routes/commands.ts`
- Modify: `backend/tests/services/dayRecord.service.test.ts`
- Modify: `backend/tests/integration/commands.integration.test.ts`

**Step 1: Write the failing test**

Test the new first-day rule and auto-fill:

```ts
expect(result.autoFilledDates).toEqual([
  '2026-03-24',
  '2026-03-25',
  '2026-03-26',
  '2026-03-27',
  '2026-03-28',
]);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: FAIL because the current service only writes one day.

**Step 3: Write minimal implementation**

- rename the command semantics to `recordPeriodDay`
- when the previous day is not period, treat the selected day as a new anchor
- fetch default duration from settings
- persist the selected day as `source=manual`
- persist later auto-filled days as `source=auto_filled`
- if the selected day is after the current tail, extend the same cycle

**Step 4: Run focused tests**

Run:
- `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
- `npm test -- --runInBand tests/integration/commands.integration.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/dayRecord.service.ts backend/src/controllers/dayRecord.controller.ts backend/src/routes/commands.ts backend/tests/services/dayRecord.service.test.ts backend/tests/integration/commands.integration.test.ts
git commit -m "feat: add period-day auto fill behavior"
```

## Task 5: Replace Single-Day Clear With Tail Truncation

**Files:**
- Modify: `backend/src/services/dayRecord.service.ts`
- Modify: `backend/tests/services/dayRecord.service.test.ts`

**Step 1: Write the failing test**

Test that clearing a day removes that date and every later date in the same interpreted tail:

```ts
expect(result.removedDates).toEqual([
  '2026-03-25',
  '2026-03-26',
  '2026-03-27',
  '2026-03-28',
]);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: FAIL because the current service removes one date only.

**Step 3: Write minimal implementation**

- determine the affected cycle segment containing the cleared date
- delete the cleared date and all later dates inside that same current segment
- keep earlier dates of the same cycle intact
- return `removedDates`

**Step 4: Run focused tests**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/dayRecord.service.ts backend/tests/services/dayRecord.service.test.ts
git commit -m "feat: truncate period tail when clearing day"
```

## Task 6: Rebuild Derived Cycle Logic Around Anchored Segments

**Files:**
- Modify: `backend/src/services/dayRecord.service.ts`
- Modify: `backend/tests/services/dayRecord.service.test.ts`

**Step 1: Write the failing test**

Test that recomputation respects:

- first-day anchors
- auto-filled tails
- manual extension
- tail truncation

Example assertion:

```ts
expect(prisma.derivedCycle.createMany).toHaveBeenCalledWith({
  data: [
    expect.objectContaining({
      startDate: new Date('2026-03-23'),
      endDate: new Date('2026-03-28'),
      durationDays: 6,
      defaultDurationDays: 6,
    }),
  ],
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: FAIL because the current logic only scans consecutive dates.

**Step 3: Write minimal implementation**

- reconstruct segments from persisted `isPeriod` rows and `source`
- derive cycle start from a day whose previous day is not period
- derive cycle end from the last remaining period day in that segment
- keep prediction computation based on cycle starts

**Step 4: Run focused tests**

Run: `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/dayRecord.service.ts backend/tests/services/dayRecord.service.test.ts
git commit -m "feat: derive cycles from anchored period segments"
```

## Task 7: Change Day Detail Semantics To Derived Deviation

**Files:**
- Modify: `backend/src/services/phase5.service.ts`
- Modify: `backend/src/services/query.service.ts`
- Modify: `backend/tests/services/phase5.service.test.ts`
- Modify: `backend/tests/services/query.service.test.ts`

**Step 1: Write the failing test**

Test that changing any detail field does not compete with the period state but does surface deviation:

```ts
expect(result.dayRecord.hasDeviation).toBe(true);
expect(result.dayRecord.isPeriod).toBe(true);
```

**Step 2: Run test to verify it fails**

Run:
- `npm test -- --runInBand tests/services/phase5.service.test.ts`
- `npm test -- --runInBand tests/services/query.service.test.ts`

Expected: FAIL because the current read model does not expose `hasDeviation`.

**Step 3: Write minimal implementation**

- keep detail edits constrained to existing period records
- compute `hasDeviation` in read models from detail values vs default pattern
- do not introduce a saved competing state for deviation unless later required

**Step 4: Run focused tests**

Run:
- `npm test -- --runInBand tests/services/phase5.service.test.ts`
- `npm test -- --runInBand tests/services/query.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/phase5.service.ts backend/src/services/query.service.ts backend/tests/services/phase5.service.test.ts backend/tests/services/query.service.test.ts
git commit -m "feat: expose derived deviation semantics"
```

## Task 8: Rename Query Payloads To The New Read Model

**Files:**
- Modify: `backend/src/services/query.service.ts`
- Modify: `backend/src/services/phase5.service.ts`
- Modify: `backend/tests/services/query.service.test.ts`
- Modify: `backend/tests/services/phase5.service.test.ts`
- Modify: `backend/tests/integration/queries.integration.test.ts`

**Step 1: Write the failing test**

Add expectations for:

- `isPeriod`
- `source`
- `hasDeviation`
- `period_start` marks

**Step 2: Run test to verify it fails**

Run:
- `npm test -- --runInBand tests/services/query.service.test.ts`
- `npm test -- --runInBand tests/services/phase5.service.test.ts`
- `npm test -- --runInBand tests/integration/queries.integration.test.ts`

Expected: FAIL because the current payload still exposes `bleedingState`.

**Step 3: Write minimal implementation**

- replace `bleedingState` read-model fields with `isPeriod`
- expose `source` where contract says it should appear
- emit `period_start` for anchor days and `period` for continuation days
- keep `prediction_start` and `today`

**Step 4: Run focused tests**

Run:
- `npm test -- --runInBand tests/services/query.service.test.ts`
- `npm test -- --runInBand tests/services/phase5.service.test.ts`
- `npm test -- --runInBand tests/integration/queries.integration.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/query.service.ts backend/src/services/phase5.service.ts backend/tests/services/query.service.test.ts backend/tests/services/phase5.service.test.ts backend/tests/integration/queries.integration.test.ts
git commit -m "feat: align menstrual read models with new contract"
```

## Task 9: Allow Shared Partners To Maintain The Same Record Set

**Files:**
- Modify: `backend/src/services/dayRecord.service.ts`
- Modify: `backend/src/services/phase5.service.ts`
- Modify: `backend/tests/services/dayRecord.service.test.ts`
- Modify: `backend/tests/services/phase5.service.test.ts`

**Step 1: Write the failing test**

Test that an active partner can:

- record a period day
- clear a period day
- update details
- update note

**Step 2: Run test to verify it fails**

Run:
- `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
- `npm test -- --runInBand tests/services/phase5.service.test.ts`

Expected: FAIL because current write logic is owner-only in multiple places.

**Step 3: Write minimal implementation**

- replace owner-only checks with "owner or active partner" for day-maintenance commands
- keep owner-only checks for sharing settings changes if that remains the intended rule

**Step 4: Run focused tests**

Run:
- `npm test -- --runInBand tests/services/dayRecord.service.test.ts`
- `npm test -- --runInBand tests/services/phase5.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/dayRecord.service.ts backend/src/services/phase5.service.ts backend/tests/services/dayRecord.service.test.ts backend/tests/services/phase5.service.test.ts
git commit -m "feat: allow shared maintenance of menstrual records"
```

## Task 10: Add `updateDefaultPeriodDuration` Endpoint

**Files:**
- Modify: `backend/src/controllers/phase5.controller.ts`
- Modify: `backend/src/routes/commands.ts`
- Modify: `backend/tests/integration/commands.integration.test.ts`
- Modify: `backend/tests/services/moduleSettings.service.test.ts`

**Step 1: Write the failing test**

```ts
expect(response.body).toEqual({
  ok: true,
  data: {
    moduleInstanceId: 'module-1',
    defaultPeriodDurationDays: 6,
    settingsChanged: true,
  },
  error: null,
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand tests/integration/commands.integration.test.ts`
Expected: FAIL because the endpoint does not exist.

**Step 3: Write minimal implementation**

- add controller and route
- delegate to settings service
- keep validation simple and explicit

**Step 4: Run focused tests**

Run:
- `npm test -- --runInBand tests/services/moduleSettings.service.test.ts`
- `npm test -- --runInBand tests/integration/commands.integration.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/controllers/phase5.controller.ts backend/src/routes/commands.ts backend/tests/services/moduleSettings.service.test.ts backend/tests/integration/commands.integration.test.ts
git commit -m "feat: add default period duration endpoint"
```

## Task 11: Run Full Verification And Update Docs

**Files:**
- Modify: `backend/tests/...` as needed
- Modify: `docs/plans/2026-03-27-backend-implementation-plan.md`

**Step 1: Run the full backend suite**

Run: `npm test -- --runInBand`
Expected: PASS

**Step 2: Run the build**

Run: `npm run build`
Expected: PASS

**Step 3: Update the implementation plan status**

Note that the backend is now aligned to the new period model and old command names are retired.

**Step 4: Commit**

```bash
git add backend docs/plans/2026-03-27-backend-implementation-plan.md
git commit -m "docs: mark backend period model alignment complete"
```
