# Day-State Rules Checklist

## Persisted Truth

- `day_record` is the only persisted source of truth.
- Missing dates resolve to implicit `none`.
- Explicit `bleeding_state` values in v1 are `period` and `spotting`.
- `spotting` remains a day-level state and does not extend cycle boundaries.

## Derived Cycle Rules

- Consecutive `period` days derive a single cycle block.
- Removing the middle `period` day splits the derived cycle into two blocks.
- Filling a missing `period` day merges adjacent derived blocks.
- A single explicit `period` day is a valid one-day cycle.

## Interaction Contract

- Tap a day to edit a single day state inline on the homepage.
- Long press in the Cycle Window enters multi-select mode.
- Saving a selected range writes default `period` day records.
- Month View remains for browsing and date locating, not range editing.
