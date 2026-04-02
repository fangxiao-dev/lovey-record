# Test Strategy Matrix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Define a durable test matrix for the repo that classifies every current test by layer, format, priority, environment, and trigger policy.

**Architecture:** Keep the current inventory explicit first, then define a layered execution policy that separates fast PR gates from slower local/regression checks. The matrix should reflect the actual repository entry points instead of an idealized framework split, because this repo already mixes unit tests, contract tests, browser regressions, and manual QA checklists across frontend, backend, and shared tooling.

**Tech Stack:** Markdown docs, GitHub Actions, Jest, Node test runner, Playwright, Python test harnesses, manual QA checklists

---

## Scope

This plan covers:

- the current test inventory across frontend, backend, and shared/public tooling
- a classification matrix by:
  - layer: frontend, backend, public/shared
  - form: API, page, browser visual
  - priority: P0, P1, P2
  - environment: GitHub-only, local-only, or both
  - trigger policy: when the test should run
- the current state of the repo’s test execution entry points
- the desired target strategy for PR, pre-merge, local release gate, and on-demand regression

This plan does not yet change the CI workflow or release-gate commands.

## Current State Summary

### Existing automated entry points

- GitHub Actions currently runs:
  - backend tests excluding `integration`
  - frontend root-level `__tests__` tests, excluding `frontend/services/menstrual/__tests__`
- Local release gate currently runs:
  - backend `phase5.service.test.ts`
  - backend `query.service.test.ts`
  - the focused frontend menstrual contract tests
  - H5 live regression through `npm run test:menstrual:live:boot`
- Local-only supplemental checks currently include:
  - backend integration tests
  - Playwright `tests/cloud-request-verification.spec.mjs`
  - Python `tests/doc_audit/*`
  - manual QA checklists under `docs/checklists/`

### Current gaps

- There is no single document that maps every current test file to a release policy.
- Some expensive tests are still local-only by convention rather than by explicit rule.
- The GitHub workflow and the release gate do not yet share one common priority model.
- Manual QA lives in checklists, but the repo has not formalized when those checklists become mandatory.

## Task 1: Write the inventory matrix

**Files:**
- Create: `docs/plans/2026-04-02-test-strategy-matrix-plan.md`

**Step 1: Encode every current test asset**

Write a matrix table that lists the real test files and grouped checklists:

- `frontend/services/menstrual/__tests__/module-shell-service.test.mjs`
- `frontend/services/menstrual/__tests__/module-shell-command-service.test.mjs`
- `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`
- `frontend/services/menstrual/__tests__/home-command-service.test.mjs`
- `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`
- `frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs`
- `frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs`
- `frontend/components/menstrual/__tests__/calendar-grid-showcase-shell.test.mjs`
- `frontend/components/menstrual/__tests__/calendar-legend-data.test.mjs`
- `frontend/components/menstrual/__tests__/calendar-legend-view.test.mjs`
- `frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs`
- `frontend/components/menstrual/__tests__/date-cell-state.test.mjs`
- `frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs`
- `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`
- `frontend/components/menstrual/__tests__/marker-assets.test.mjs`
- `frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs`
- `frontend/__tests__/interaction-feedback-contract.test.mjs`
- `frontend/__tests__/project-structure.test.mjs`
- `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`
- `backend/tests/services/auth.service.test.ts`
- `backend/tests/services/dayRecord.service.test.ts`
- `backend/tests/services/moduleInstance.service.test.ts`
- `backend/tests/services/moduleSettings.service.test.ts`
- `backend/tests/services/phase5.record-day-details-nullable.test.ts`
- `backend/tests/services/phase5.service.test.ts`
- `backend/tests/services/query.service.test.ts`
- `backend/tests/services/singleDayPeriodAction.service.test.ts`
- `backend/tests/integration/auth-flow.integration.test.ts`
- `backend/tests/integration/commands.integration.test.ts`
- `backend/tests/integration/cors.integration.test.ts`
- `backend/tests/integration/non-period-recording.integration.test.ts`
- `backend/tests/integration/queries.integration.test.ts`
- `backend/tests/contracts/openapi.contract.test.ts`
- `backend/tests/middleware/auth.middleware.test.ts`
- `backend/tests/middleware/errorHandler.middleware.test.ts`
- `backend/tests/unit/seedScenarios.test.ts`
- `tests/cloud-request-verification.spec.mjs`
- `tests/doc_audit/test_classifier.py`
- `tests/doc_audit/test_entrypoints.py`
- `tests/doc_audit/test_graph.py`
- `tests/doc_audit/test_init_mode.py`
- `tests/doc_audit/test_reporting.py`
- `tests/doc_audit/test_verification.py`
- the manual QA checklists in `docs/checklists/*.md`

**Step 2: Add the matrix columns**

For each row, assign:

- layer
- form
- priority
- environment
- current trigger
- notes on what it proves

**Step 3: Separate grouped checklists from executable tests**

Make it explicit that the three checklist docs are not runnable automation, but they are still part of the quality system.

## Task 2: Define the target trigger policy

**Files:**
- Modify: `docs/plans/2026-04-02-test-strategy-matrix-plan.md`

**Step 1: Define P0**

Mark P0 as the smallest set that must pass before accepting a product change:

- backend service tests that cover active domain rules
- frontend menstrual contract/service tests that cover the current MVP entry flow
- H5 live regression for the menstrual home flow
- cross-layer API/header verification where routing or auth behavior changed

**Step 2: Define P1**

Mark P1 as the broader pre-merge / pre-release set:

- backend integration tests
- frontend component contract tests
- frontend root invariants and architecture checks
- backend contract tests such as OpenAPI surface validation

**Step 3: Define P2**

Mark P2 as the slowest and most situational set:

- doc-audit Python checks
- manual QA checklists
- exploratory browser checks not wired into the current release gate

**Step 4: Assign environments**

Use these environment tags:

- `github-only` for workflows that currently exist only in GitHub Actions
- `local-only` for commands that require local runtime, browser, or manual interaction
- `both` where a test is useful in both places and can be executed without policy drift

## Task 3: Turn the matrix into an operating policy

**Files:**
- Modify: `docs/governance/release-gate.md`
- Modify: `.github/workflows/doc-audit.yml`
- Modify: `docs/README.md`

**Step 1: Align the release gate with the matrix**

Move the release gate wording from a file list to a policy list:

- what must pass on every PR
- what can run locally before merge
- what is reserved for release-candidate verification

**Step 2: Align GitHub Actions with the same tiers**

Split the workflow into fast and slow lanes if needed so the PR lane maps cleanly to P0 and the release lane can include P1 or P2 later.

**Step 3: Link the new plan from docs navigation**

Add one pointer in the docs index so the strategy matrix is easy to find from the rest of the repo documentation.

## Acceptance Criteria

- Every current project-owned test asset is listed in the matrix.
- Every row has a layer, form, priority, environment, and trigger policy.
- The document distinguishes automation from manual QA.
- The document states the current state without claiming a strategy that does not yet exist.
- The document identifies the next doc and workflow changes needed to make the strategy real.

## Verification

- Re-read the new plan for completeness against the current test inventory.
- Confirm that `docs/plans/2026-04-02-test-strategy-matrix-plan.md` names the actual current scripts and files used by the repo.
- Confirm that the plan does not assert any CI behavior that the repo does not currently implement.
