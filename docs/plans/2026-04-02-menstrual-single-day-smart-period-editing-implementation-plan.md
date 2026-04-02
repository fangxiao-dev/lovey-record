# Menstrual Single-Day Smart Period Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the new single-day smart period editing flow with contextual `月经开始 / 月经结束` semantics, bridge confirmation, and a dedicated resolve/apply transport model.

**Architecture:** Add one shared backend resolver that derives the selected date role, the intended single-day action, optional bridge confirmation, and effect preview. Expose that resolver through a dedicated query, then add a dedicated apply command that re-validates the current segment context before mutating. Update the frontend home page to consume the new resolver result, render contextual chip text/state, show confirmation prompts for bridge actions, and stop treating single-day period editing as a blind boolean toggle.

**Tech Stack:** Node.js/Express/TypeScript backend, Prisma, Jest, uni-app Vue frontend, node --test frontend tests, Playwright H5 regression

---

## Task 1: Freeze backend transport surface in docs and OpenAPI expectations

**Files:**
- Modify: `backend/docs/openapi.json`
- Test: `backend/tests/contracts/openapi.contract.test.ts`
- Read: `docs/contracts/application-contracts/menstrual-application-contract.md`

**Step 1: Write the failing OpenAPI contract assertions**

Add assertions for:

- `GET /api/queries/getSingleDayPeriodAction`
- `POST /api/commands/applySingleDayPeriodAction`

Also assert the request/response schemas include:

- query params: `moduleInstanceId`, `date`
- apply payload: `moduleInstanceId`, `selectedDate`, `action`, optional `confirmed`
- response shape fields: `role`, `chip`, `resolvedAction`, `confirmationRequired`, `effect` or `effectPreview`

**Step 2: Run test to verify it fails**

Run: `cd backend; npx jest tests/contracts/openapi.contract.test.ts --no-coverage`

Expected: FAIL because the new paths and schema assertions do not exist yet.

**Step 3: Add the new endpoint definitions to OpenAPI**

Update `backend/docs/openapi.json` with:

- new query path `getSingleDayPeriodAction`
- new command path `applySingleDayPeriodAction`
- minimal stable schema matching the contract draft

Do not remove old `recordPeriodDay` / `clearPeriodDay` from OpenAPI yet.

**Step 4: Run test to verify it passes**

Run: `cd backend; npx jest tests/contracts/openapi.contract.test.ts --no-coverage`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/docs/openapi.json backend/tests/contracts/openapi.contract.test.ts
git commit -m "docs: add single-day period resolve/apply API contract"
```

## Task 2: Add backend resolver unit tests first

**Files:**
- Create: `backend/src/services/singleDayPeriodAction.service.ts`
- Test: `backend/tests/services/singleDayPeriodAction.service.test.ts`
- Read: `backend/src/services/dayRecord.service.ts`
- Read: `backend/src/services/query.service.ts`

**Step 1: Write the failing resolver tests**

Cover at least:

- selected date outside all segments => `role = not-period`, `action = start`, no prompt, forward auto-fill preview
- selected date is segment start => `role = start`, `action = revoke-start`, no prompt, full-segment clear preview
- selected date is segment middle => `role = in-progress`, `action = end-here`, no prompt, later dates cleared
- selected date is segment end => `role = end`, `action = noop`
- forward bridge => prompt required with `把这段经期延长到 MM/DD？`
- backward bridge => prompt required with `已在 MM/DD 标记了经期开始，要提前到 MM/DD 吗？`
- two-sided bridge => prompt required with `附近已有经期记录，是否合并？`

Use focused seeded arrays of period dates and `defaultPeriodDurationDays`.

**Step 2: Run test to verify it fails**

Run: `cd backend; npx jest tests/services/singleDayPeriodAction.service.test.ts --no-coverage`

Expected: FAIL because the service file does not exist yet.

**Step 3: Implement the minimal pure resolver**

Create `backend/src/services/singleDayPeriodAction.service.ts` with pure helpers for:

- deriving the continuous segment containing the selected date
- computing selected-date role
- detecting bridge type within `N-1`
- building prompt payload
- building `writeDates` / `clearDates` / `resultingSegment` preview

Keep the first implementation pure and input-driven. Do not wire Prisma yet.

**Step 4: Run test to verify it passes**

Run: `cd backend; npx jest tests/services/singleDayPeriodAction.service.test.ts --no-coverage`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/services/singleDayPeriodAction.service.ts backend/tests/services/singleDayPeriodAction.service.test.ts
git commit -m "backend: add single-day period action resolver"
```

## Task 3: Add backend integration tests for resolve query

**Files:**
- Modify: `backend/src/controllers/query.controller.ts`
- Modify: `backend/src/routes/queries.ts`
- Modify: `backend/src/services/query.service.ts`
- Test: `backend/tests/integration/queries.integration.test.ts`

**Step 1: Write the failing integration test**

Add one test that mocks or seeds a known period segment and then calls:

`GET /api/queries/getSingleDayPeriodAction?moduleInstanceId=...&date=...`

Assert:

- `role`
- `chip.text`
- `chip.selected`
- `resolvedAction.action`
- `prompt.required`

Use a bridge case as the strongest assertion because it exercises prompt generation.

**Step 2: Run test to verify it fails**

Run: `cd backend; npx jest tests/integration/queries.integration.test.ts --no-coverage`

Expected: FAIL because the route/handler/query does not exist yet.

**Step 3: Implement query wiring**

Add query flow:

- `query.service.ts` reads existing period dates + settings for the module instance
- calls the resolver service
- returns `ResolveSingleDayPeriodActionResult`

Wire:

- controller handler
- query route

**Step 4: Run test to verify it passes**

Run: `cd backend; npx jest tests/integration/queries.integration.test.ts --no-coverage`

Expected: PASS

**Step 5: Commit**

```bash
git add backend/src/controllers/query.controller.ts backend/src/routes/queries.ts backend/src/services/query.service.ts backend/tests/integration/queries.integration.test.ts
git commit -m "backend: expose getSingleDayPeriodAction query"
```

## Task 4: Add backend apply-command tests first

**Files:**
- Modify: `backend/src/services/dayRecord.service.ts`
- Test: `backend/tests/services/dayRecord.service.test.ts`
- Test: `backend/tests/integration/commands.integration.test.ts`
- Read: `backend/src/services/singleDayPeriodAction.service.ts`

**Step 1: Write failing service tests for apply semantics**

Add service-level tests for:

- `revoke-start` clears all dates in the segment
- `end-here` clears only later dates in the segment
- apply rejects bridge actions that require confirmation when `confirmed` is false
- apply accepts bridge actions when `confirmed = true`
- apply re-validates current data before mutating

Keep these tests narrow and explicit about `writeDates` / `clearDates`.

**Step 2: Write failing integration test for apply command**

Add integration test for:

- `POST /api/commands/applySingleDayPeriodAction`

Assert:

- input forwarding
- `confirmationRequired` behavior
- happy path envelope

**Step 3: Run tests to verify they fail**

Run:

`cd backend; npx jest tests/services/dayRecord.service.test.ts tests/integration/commands.integration.test.ts --no-coverage`

Expected: FAIL because apply flow does not exist yet.

**Step 4: Implement apply command**

Implement a new command entry that:

- re-runs the resolver against current data
- compares the requested action with the current valid action
- refuses to mutate if confirmation is required but not confirmed
- applies `writeDates` / `clearDates`
- recomputes cycles and prediction

Do not replace old `recordPeriodDay` / `clearPeriodDay` yet.

**Step 5: Run tests to verify they pass**

Run:

`cd backend; npx jest tests/services/dayRecord.service.test.ts tests/integration/commands.integration.test.ts --no-coverage`

Expected: PASS

**Step 6: Run full backend tests**

Run:

`cd backend; npx jest --no-coverage`

Expected: PASS with no regressions.

**Step 7: Commit**

```bash
git add backend/src/services/dayRecord.service.ts backend/src/controllers/dayRecord.controller.ts backend/src/routes/commands.ts backend/tests/services/dayRecord.service.test.ts backend/tests/integration/commands.integration.test.ts
git commit -m "backend: add applySingleDayPeriodAction command"
```

## Task 5: Add frontend contract adapter tests for contextual chip semantics

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Test: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`
- Test: `frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`

**Step 1: Write the failing frontend adapter tests**

Add assertions that the selected-date panel model can represent:

- `月经开始` unselected for `not-period`
- `月经开始` selected for `start`
- `月经结束` for `in-progress`
- `月经结束` for `end`

If the current panel data model does not expose chip text separately from selected state, make the failing test assert the new fields explicitly.

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`

Expected: FAIL because the adapter still assumes a generic `经期` toggle.

**Step 3: Implement minimal adapter changes**

Update the panel model shape so it can express:

- period chip text
- period chip selected state
- optional pending prompt metadata if needed later

Do not wire live query calls yet.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs
git commit -m "frontend: adapt selected date panel for contextual period action chip"
```

## Task 6: Add frontend service tests for resolve/apply transport

**Files:**
- Modify: `frontend/services/menstrual/home-command-service.js`
- Modify: `frontend/services/menstrual/home-contract-service.js`
- Test: `frontend/services/menstrual/__tests__/home-command-service.test.mjs`
- Test: `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`

**Step 1: Write the failing service tests**

Add tests that assert:

- `home-contract-service` calls `getSingleDayPeriodAction` for the selected date context
- `home-command-service` calls `applySingleDayPeriodAction`
- apply payload includes `moduleInstanceId`, `selectedDate`, `action`, optional `confirmed`

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/services/menstrual/__tests__/home-command-service.test.mjs frontend/services/menstrual/__tests__/home-contract-service.test.mjs`

Expected: FAIL because the new transport methods do not exist.

**Step 3: Implement minimal service methods**

Add:

- read-side request for `getSingleDayPeriodAction`
- write-side request for `applySingleDayPeriodAction`

Keep existing batch methods unchanged.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/services/menstrual/__tests__/home-command-service.test.mjs frontend/services/menstrual/__tests__/home-contract-service.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/services/menstrual/home-command-service.js frontend/services/menstrual/home-contract-service.js frontend/services/menstrual/__tests__/home-command-service.test.mjs frontend/services/menstrual/__tests__/home-contract-service.test.mjs
git commit -m "frontend: add single-day period resolve/apply services"
```

## Task 7: Update SelectedDatePanel component for contextual period chip

**Files:**
- Modify: `frontend/components/menstrual/SelectedDatePanel.vue`
- Test: `frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`

**Step 1: Write the failing component-facing assertions**

Add tests that assume the panel receives:

- `periodChipText`
- `periodChipSelected`

and renders:

- `月经开始`
- `月经结束`

without breaking the independent detail chip.

**Step 2: Run test to verify it fails**

Run:

`node --test frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`

Expected: FAIL because the component still hardcodes `经期`.

**Step 3: Implement the minimal component change**

Replace the hardcoded period chip label with a prop-driven label and selected state.

Do not redesign layout beyond what is needed for the new text.

**Step 4: Run test to verify it passes**

Run:

`node --test frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/SelectedDatePanel.vue frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs
git commit -m "frontend: render contextual period action chip text"
```

## Task 8: Wire home page to resolve/apply flow and confirmation modal

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`
- Test: `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
- Test: create or modify a focused home-page interaction test if the current test set is too indirect

**Step 1: Write the failing interaction tests**

Add tests for:

- selected date outside segment shows `月经开始`
- selected start day shows selected `月经开始`
- selected middle day shows `月经结束`
- tapping a bridge candidate opens confirmation instead of mutating immediately
- cancelling the prompt produces no change
- confirming the prompt calls the apply command with `confirmed: true`

**Step 2: Run test to verify it fails**

Run the smallest relevant frontend test set that covers the page interaction.

Expected: FAIL because `home.vue` still drives single-day edits through `persistSelectedDatePeriodState`

**Step 3: Implement page wiring**

Update `home.vue` so that:

- selected date refresh consumes `getSingleDayPeriodAction`
- panel props render contextual period chip semantics
- chip tap routes into apply flow instead of old toggle flow
- bridge confirmation uses a modal before calling apply
- batch mode path remains unchanged

Remove direct single-day dependency on `persistSelectedDatePeriodState` from the page.

**Step 4: Run test to verify it passes**

Run the same focused frontend interaction test set.

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/pages/menstrual/home.vue frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs
git commit -m "frontend: wire home page to single-day period resolve/apply flow"
```

## Task 9: Refresh live regression coverage

**Files:**
- Modify: `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`
- Optionally create: `frontend/scripts/menstrual-home-single-day-live-regression.spec.mjs`

**Step 1: Write or update live regression steps**

Cover at least:

- fresh not-period day => `月经开始`
- start day => selected `月经开始`, tap removes whole segment
- middle day => `月经结束`, tap truncates later dates
- bridge candidate => prompt appears with the correct frozen copy
- cancel leaves data unchanged
- confirm applies the bridge
- batch path still does not trigger smart bridging

**Step 2: Run the live regression to verify failures if any**

Run the existing or new Playwright command for the H5 environment.

Expected: initial failures until the new flow is wired.

**Step 3: Fix any mismatches in selectors or runtime assumptions**

Keep the regression aligned to the new chip text and prompt copy.

**Step 4: Re-run live regression to verify pass**

Run the same Playwright command again.

Expected: PASS

**Step 5: Commit**

```bash
git add frontend/scripts/menstrual-home-batch-live-regression.spec.mjs frontend/scripts/menstrual-home-single-day-live-regression.spec.mjs
git commit -m "test: cover single-day smart period editing live regression"
```

## Task 10: Final document alignment and cleanup

**Files:**
- Modify: `docs/design/menstrual/function-home.md`
- Modify: `docs/design/menstrual/function-day-recording.md`
- Modify: `docs/contracts/application-contracts/menstrual-application-contract.md`
- Read: `docs/plans/2026-04-02-menstrual-single-day-smart-period-editing-design.md`
- Read: `docs/contracts/application-contracts/menstrual-application-contract.md`

**Step 1: Update stale references**

Remove or soften wording that still implies:

- plain `经期` boolean toggle
- unconditional forward auto-fill
- single-day writes without contextual action resolution

**Step 2: Run any existing doc/link verification if available**

Use the smallest relevant verification command already used in this repo for doc correctness, or manually re-read the changed docs if no lightweight check exists.

**Step 3: Commit**

```bash
git add docs/design/menstrual/function-home.md docs/design/menstrual/function-day-recording.md docs/contracts/application-contracts/menstrual-application-contract.md
git commit -m "docs: align single-day period editing docs with resolve/apply model"
```

## Completion Criteria

- [ ] OpenAPI includes `getSingleDayPeriodAction` and `applySingleDayPeriodAction`
- [ ] Backend resolver derives role, action, bridge type, prompt, and effect preview
- [ ] Apply command re-validates current context before mutating
- [ ] Frontend panel renders contextual `月经开始 / 月经结束` semantics
- [ ] Bridge actions show the frozen confirmation copy
- [ ] `start` tap revokes the whole segment
- [ ] `in-progress` tap makes the selected day the final day
- [ ] `end` tap is a no-op
- [ ] Batch selection remains explicit-only and independent
- [ ] Backend tests pass
- [ ] Frontend unit tests pass
- [ ] H5 live regression passes
