# Frontend Integration Prep

**Purpose:** capture the smallest backend-side support work that helps the frontend start integrating before real DB work begins.

## Seed Baseline
- `npm run db:seed` loads a deterministic set of frontend-integration scenarios.
- The seeded scenarios are:
  - `emptyModule`
  - `activePeriodHomeView`
  - `predictedNextPeriod`
  - `dayDetailDeviation`
  - `sharedModuleAccess`
- These are local-development and frontend-integration fixtures, not a migration/backfill tool.

## Recommended Mock Data Scenarios

### `emptyModule`
- private module instance
- no current cycle
- no prediction
- no explicit day record
- default module settings available through `getModuleSettings`

### `activePeriodHomeView`
- private module instance
- current in-period segment containing today
- calendar marks present
- prediction summary present
- module settings available through a parallel `getModuleSettings` read

### `predictedNextPeriod`
- no active current segment
- prediction window present
- calendar contains `prediction_start`

### `dayDetailDeviation`
- explicit period day
- non-default detail levels
- `note` present
- `isDetailRecorded = true`

### `sharedModuleAccess`
- shared module instance
- one active partner
- same module instance visible through home/access queries

## Current High-Value Test Coverage
- command/query auth envelope and `x-wx-openid` behavior
- module creation
- default period duration update
- explicit and implicit day detail reads
- module access state reads
- module settings reads
- calendar window and prediction summary shaping
- core cycle derivation and prediction recomputation at service level

## Best Next Test Additions
- one or two integration examples for `recordDayDetails`, `getCalendarWindow`, and `getPredictionSummary`

## Known Runtime Gaps To Keep Visible
- `getModuleHomeView` runtime field names still use `currentCycle` and `cycle_window`, while the newer contract language expects segment-oriented naming.
- `getModuleHomeView` runtime response does not currently include `moduleSettings`.
- `recordDayNote` now rejects notes longer than `500` characters with `NOTE_TOO_LONG`.

## Real DB Placeholder
- Real DB preparation is intentionally deferred.
- When the team starts introducing a real database workflow, this file should grow a short section covering:
  - local migration command sequence
  - initialization or seed entrypoints
  - environment variable expectations
  - what is verified only in-memory versus against a real database
