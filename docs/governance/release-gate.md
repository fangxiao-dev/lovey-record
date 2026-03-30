# MVP Release Gate

**Maintained:** ongoing — update this file when test commands, file paths, or manual checks change.

## Purpose

This document is the repeatable release gate for the menstrual MVP.
It must be run before accepting any mainline milestone as release-ready.
The criteria below map directly to the MVP definition in `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`.

## How To Run

### Automated gate (run first)

```bash
# 1. Backend service tests
cd backend
npm test -- --runInBand tests/services/phase5.service.test.ts tests/services/query.service.test.ts

# 2. Frontend unit tests
cd ..
node --test \
  frontend/services/menstrual/__tests__/module-shell-service.test.mjs \
  frontend/services/menstrual/__tests__/module-shell-command-service.test.mjs \
  frontend/services/menstrual/__tests__/home-contract-service.test.mjs \
  frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs \
  frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs

# 3. Full live H5 regression (requires backend + frontend dev servers running)
npm run test:menstrual:live
```

All three commands must exit 0 with 0 failures.

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

## Automated Test Coverage Map

| Automated test | What it proves |
|---|---|
| `phase5.service.test.ts` | Share, revoke, settings, calendar window backend logic |
| `query.service.test.ts` | sharingStatus derivation from active partner access |
| `module-shell-service.test.mjs` | Shell page model mapping for private and shared zones |
| `module-shell-command-service.test.mjs` | Shell share/revoke/settings command wiring |
| `home-contract-service.test.mjs` | Home page model loading and calendar range calculation |
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
[ ] node --test (frontend unit suite, 22 tests): PASS / FAIL
[ ] npm run test:menstrual:live (7 tests): PASS / FAIL

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

Result: PASS / FAIL
Signed off by: ____________
```
