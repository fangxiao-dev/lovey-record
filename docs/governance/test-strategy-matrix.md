# Test Strategy Matrix

## Purpose

This document classifies the current repo-owned tests and manual QA checks by:

- layer: frontend, backend, public/shared
- form: API, page, browser visual
- priority: P0, P1, P2
- environment: GitHub-only, local-only, both
- current trigger policy

It describes the current state first. It does not assume a future CI layout that is not yet implemented.

## Current Trigger Policy

### P0

Run before accepting a product change that touches active menstrual MVP behavior, routing, or page interaction.

Typical coverage:

- backend service rules used by the active MVP
- frontend shell/home contract logic
- H5 browser live regression
- cross-layer request/routing verification when transport behavior changes

### P1

Run before merge or before a release candidate when the change is broader than a single flow.

Typical coverage:

- backend integration routes
- frontend component contract tests
- backend contract and middleware checks
- broader root invariants

### P2

Run on demand, nightly, or as documentation / hygiene checks.

Typical coverage:

- doc audit checks
- manual QA checklists
- exploratory browser checks that are not part of the release gate

## Matrix

| Layer | Form | Priority | Environment | Current trigger | Files |
|---|---|---:|---|---|---|
| Frontend | API / contract | P0 | Both | PR gate + local release gate | `frontend/services/menstrual/__tests__/module-shell-service.test.mjs`, `frontend/services/menstrual/__tests__/module-shell-command-service.test.mjs`, `frontend/services/menstrual/__tests__/home-contract-service.test.mjs`, `frontend/services/menstrual/__tests__/home-command-service.test.mjs` |
| Frontend | API / contract | P0 | Both | PR gate + local release gate when MVP interaction changes | `frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs`, `frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs` |
| Frontend | Browser visual | P0 | Local-only | Local release gate, H5 regression only | `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs` |
| Frontend | API / contract | P1 | Both | Manual GitHub `workflow_dispatch` lane plus local release gate when relevant | `frontend/components/menstrual/__tests__/calendar-grid-showcase-data.test.mjs`, `frontend/components/menstrual/__tests__/calendar-grid-showcase-shell.test.mjs`, `frontend/components/menstrual/__tests__/calendar-legend-data.test.mjs`, `frontend/components/menstrual/__tests__/calendar-legend-view.test.mjs`, `frontend/components/menstrual/__tests__/date-cell-showcase-data.test.mjs`, `frontend/components/menstrual/__tests__/date-cell-state.test.mjs`, `frontend/components/menstrual/__tests__/date-cell-view-model.test.mjs`, `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`, `frontend/components/menstrual/__tests__/marker-assets.test.mjs`, `frontend/components/menstrual/__tests__/selected-date-panel-data.test.mjs` |
| Frontend | API / contract | P1 | Both | Manual GitHub `workflow_dispatch` lane, local when touching feedback or structure rules | `frontend/__tests__/interaction-feedback-contract.test.mjs`, `frontend/__tests__/project-structure.test.mjs` |
| Backend | API / service | P0 | Both | PR gate + local release gate for active domain rules | `backend/tests/services/dayRecord.service.test.ts`, `backend/tests/services/phase5.service.test.ts`, `backend/tests/services/query.service.test.ts` |
| Backend | API / service | P1 | Both | Manual GitHub `workflow_dispatch` lane or local broader validation | `backend/tests/services/auth.service.test.ts`, `backend/tests/services/moduleInstance.service.test.ts`, `backend/tests/services/moduleSettings.service.test.ts`, `backend/tests/services/phase5.record-day-details-nullable.test.ts`, `backend/tests/services/singleDayPeriodAction.service.test.ts` |
| Backend | API / integration | P1 | Local-only | Local pre-merge / release-candidate validation | `backend/tests/integration/auth-flow.integration.test.ts`, `backend/tests/integration/commands.integration.test.ts`, `backend/tests/integration/cors.integration.test.ts`, `backend/tests/integration/non-period-recording.integration.test.ts`, `backend/tests/integration/queries.integration.test.ts` |
| Backend | API / contract | P1 | Both | Manual GitHub `workflow_dispatch` lane or local smoke when API surface changes | `backend/tests/contracts/openapi.contract.test.ts` |
| Backend | API / middleware | P2 | Both | On-demand hygiene or regression diagnosis | `backend/tests/middleware/auth.middleware.test.ts`, `backend/tests/middleware/errorHandler.middleware.test.ts` |
| Backend | API / unit | P2 | Both | On-demand hygiene or seed scenario checks | `backend/tests/unit/seedScenarios.test.ts` |
| Public/shared | API / browser hybrid | P0 | Local-only | Local diagnostic regression for routing/auth behavior | `tests/cloud-request-verification.spec.mjs` |
| Public/shared | Browser scenario supplement | P0 | Local-only | AI-run Playwright MCP supplement after automated gate | `docs/checklists/playwright-mcp-browser-scenarios.md` |
| Public/shared | Manual browser visual | P0 | Local-only | After automated gate, before release signoff | `docs/checklists/frontend-h5-live-regression.md`, `docs/checklists/module-space-sharing-manual-qa.md` |

## Current State Notes

- GitHub Actions currently covers:
  - P0 backend tests on every push / pull request
  - P0 frontend menstrual tests on every push / pull request
  - P1 backend and frontend broad unit / contract tests on manual `workflow_dispatch` with `tier: p1`
- Local release gate currently covers:
  - backend `phase5.service.test.ts`
  - backend `query.service.test.ts`
  - focused frontend menstrual contract tests
  - H5 live regression through `npm run test:menstrual:live:boot`
- The backend integration suite, `cloud-request-verification.spec.mjs`, and the doc-audit Python tests are still local-only.
- Manual QA checklists are the release signoff layer for behavior that still needs a human browser or Mini Program check.

## Suggested Policy Target

The repo should eventually converge on:

- P0: required on every product PR
- P1: required before merge or release candidate
- P2: scheduled, on-demand, or release-support checks

That target is not fully implemented yet; it is the direction this matrix is meant to support.
