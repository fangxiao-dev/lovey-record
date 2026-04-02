# MVP Release Gate

**Maintained:** ongoing — update this file when test commands, file paths, or manual checks change.

## Purpose

This document is the repeatable release gate for the menstrual MVP.
It must be run before accepting any mainline milestone as release-ready.
The criteria below map directly to the MVP definition in `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`.
For the current classification and tiering model, see [`docs/governance/test-strategy-matrix.md`](D:/CodeSpace/hbuilder-projects/lovey-record/docs/governance/test-strategy-matrix.md).

## How To Run

### Automated gate (run first)

```bash
# P0: backend service tests
cd backend
npm test -- --runInBand tests/services/phase5.service.test.ts tests/services/query.service.test.ts

# P0: focused frontend menstrual unit tests
cd ..
node --test \
  frontend/services/menstrual/__tests__/module-shell-service.test.mjs \
  frontend/services/menstrual/__tests__/module-shell-command-service.test.mjs \
  frontend/services/menstrual/__tests__/home-contract-service.test.mjs \
  frontend/services/menstrual/__tests__/home-command-service.test.mjs \
  frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs \
  frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs

# P0: full live H5 regression with one-click startup
npm run test:menstrual:live:boot
```

All three commands must exit 0 with 0 failures.

### Current tier map

| Tier | What it means now | Current execution surface |
|---|---|---|
| P0 | Must pass before a product change is treated as release-ready | backend `phase5.service.test.ts`, backend `query.service.test.ts`, focused frontend menstrual contract tests, H5 live regression, AI-run browser scenario supplement, manual Mini Program QA |
| P1 | Should pass before merge or before a release candidate if the change touches broader behavior | manual GitHub `workflow_dispatch` lane with `tier: p1`, plus local backend integration tests |
| P2 | On-demand, nightly, or hygiene-only checks | doc audit tests, exploratory browser checks, checklist maintenance |

### Manual platform checks (run after automated gate passes)

These cannot be automated from the repo at this stage:

| # | Area | Check | Pass Criteria |
|---|------|-------|---------------|
| M1 | Mini Program shell | Open the app on WeChat; the module shell loads and shows the menstrual module tile | Tile visible, no blank screen |
| M2 | Mini Program entry | Tap the module tile; menstrual home loads with live data | Home page renders, hero card shows status |
| M3 | Mini Program single-day | Tap a date, toggle period on and off | Record persists on reload |
| M4 | Mini Program long-press | Long-press a date cell for ≥500 ms; batch panel appears | Save/Cancel buttons appear |
| M5 | Mini Program batch drag | Drag across multiple cells; selection extends and retracts correctly | Visual selection matches expected range |
| M6 | Mini Program batch save | Save a batch range; page reloads with correct period marks | Correct cells show period color |
| M7 | Mini Program share | Owner taps share; partner openid can read the same home data | Partner sees same data, no duplication |
| M8 | Mini Program revoke | Owner revokes; partner access is denied | Partner gets access error or blank |
| M9 | Mini Program settings | Owner changes default duration from shell; records a new first day; range length matches new setting | Auto-fill count = new duration |

### Playwright MCP browser scenarios

This is the local browser-scenario supplement for AI-executed verification.
See [`docs/checklists/playwright-mcp-browser-scenarios.md`](D:/CodeSpace/hbuilder-projects/lovey-record/docs/checklists/playwright-mcp-browser-scenarios.md) for the execution model and scenario set.

Use it after the automated gate when a change touches browser-visible H5 behavior, routing, sharing, or settings propagation.

Recommended minimum scenarios:

- module shell entry
- single-day editing
- batch gesture editing
- sharing and revoke
- settings propagation
- routing and transport diagnostics

## Automated Test Coverage Map

| Automated test | What it proves |
|---|---|
| `phase5.service.test.ts` | Share, revoke, settings, calendar window backend logic |
| `query.service.test.ts` | sharingStatus derivation from active partner access |
| `module-shell-service.test.mjs` | Shell page model mapping for private and shared zones |
| `module-shell-command-service.test.mjs` | Shell share/revoke/settings command wiring |
| `home-contract-service.test.mjs` | Home page model loading and calendar range calculation |
| `home-command-service.test.mjs` | Home page command wiring for live module interactions |
| `batch-selection-contract.test.mjs` | Batch selection key ordering and edge toggle behavior |
| `calendar-grid-h5-long-press.test.mjs` | Long-press + drag event sequencing on H5 |
| `live: module shell entry` | Real shell load → home entry flow (H5) |
| `live: shared zone render` | Shared module appears in shared zone (H5) |
| `live: batch regression` | Full long-press → drag → save → refresh loop (H5) |
| `live: share / revoke` | Owner share → partner read → owner revoke (H5) |
| `live: settings strip` | Shell settings chip updates defaultPeriodDurationDays (H5) |
| `live: defaultPeriodDurationDays auto-fill` | Changed duration reflected in next first-day record auto-fill length (H5) |
| `live: batch path priority` | Single-day selection does not override latest batch end day (H5) |

## Release Blocking Criteria

The release gate fails (do not merge) if any of the following is true:

- Any automated test exits non-zero
- Manual checks M1–M6 fail on WeChat Mini Program
- Manual checks M7–M8 fail (share/revoke broken in Mini Program)
- Manual check M9 fails (settings chain broken in Mini Program)
- Browser scenarios in `docs/checklists/playwright-mcp-browser-scenarios.md` fail for the touched flow

## Non-Blocking Items (Do Not Hold Release)

These are known gaps that do not block the first MVP:

- Batch corner cases under fast pointer motion not yet exhaustively covered
  (covered more in `docs/plans/2026-03-30-batch-interaction-hardening-status.md`)
- WeChat-specific long-press timing edge cases not yet fully characterized
- Multi-module expansion, analytics, production auth hardening

## Release Checklist Template

Copy this block when running a release gate:

```
Release Gate Run: ____-__-__

[ ] npm test (backend phase5 + query): PASS / FAIL
[ ] node --test (focused frontend menstrual unit suite): PASS / FAIL
[ ] npm run test:menstrual:live:boot (10 tests): PASS / FAIL

Manual (Mini Program):
[ ] M1 shell loads
[ ] M2 home entry
[ ] M3 single-day record
[ ] M4 long-press activates batch
[ ] M5 batch drag extend/retract
[ ] M6 batch save + reload
[ ] M7 share
[ ] M8 revoke
[ ] M9 settings -> first-day auto-fill

Playwright MCP browser scenarios:
[ ] module shell entry
[ ] single-day editing
[ ] batch gesture editing
[ ] sharing and revoke
[ ] settings propagation
[ ] routing and transport diagnostics

Result: PASS / FAIL
Signed off by: ____________
```
