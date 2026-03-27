# Menstrual Domain Model

**Date:** 2026-03-23

## Purpose

This document freezes the coarse-grained domain model for the menstrual MVP so frontend work and backend prototype work align on the same concepts and rules.

It is a domain contract, not a database schema and not a transport-level API spec.

## Core Conclusions

- `day_record` remains the primary persisted source of truth.
- A menstrual cycle is still a derived object, but its derivation is no longer "only from consecutive explicit period days".
- The user primarily expresses "this day starts or continues a menstrual period"; the system then expands and corrects the period segment.
- Shared and private entry points must resolve to the same `module instance`.
- Daily detail fields do not decide whether the user is in period, but they can produce a derived deviation label.

## Domain Objects

### User

- `id`
- `created_at`

Notes:

- identity object for access and ownership
- MVP does not require a full production account model here

### Profile

- `id`
- `owner_user_id`
- `display_name?`
- `created_at`

Notes:

- represents the menstrual record owner profile
- may temporarily collapse into `User` in implementation if needed

### ModuleInstance

- `id`
- `module_type`
- `owner_user_id`
- `profile_id`
- `sharing_status`
- `created_at`
- `updated_at`

Notes:

- the stable identity of one menstrual module instance
- private/shared status changes do not create a new instance

### ModuleAccess

- `id`
- `module_instance_id`
- `user_id`
- `role`
- `access_status`
- `granted_at`
- `revoked_at?`

Notes:

- expresses who can access one module instance
- is the main domain hook for sharing behavior

### DayRecord

- `id`
- `module_instance_id`
- `profile_id`
- `date`
- `is_period`
- `pain_level`
- `flow_level`
- `color_level`
- `note?`
- `source`
- `created_at`
- `updated_at`

Notes:

- the only persisted source of truth for daily menstrual recording
- no row means implicit `none`
- `source` should distinguish at least `manual` and `auto_filled`
- the user-facing result treats manual and auto-filled period days as equal period days
- attached attributes and note live on the same record

### DerivedCycle

- `id?`
- `module_instance_id`
- `profile_id`
- `start_date`
- `end_date`
- `duration_days`
- `derived_from_dates`
- `default_duration_days`

Notes:

- derived object, not primary user-authored input
- one cycle is anchored by a detected first day, then expanded by default duration and later corrected by user edits
- can be cached, but must remain reconstructable from `day_record` plus module settings

### Prediction

- `module_instance_id`
- `profile_id`
- `predicted_start_date`
- `prediction_window_start`
- `prediction_window_end`
- `based_on_cycle_count`
- `computed_at`

Notes:

- derived object, not primary user-authored input
- can be cached if needed

### ModuleSettings

- `module_instance_id`
- `default_period_duration_days`

Notes:

- stores the user's default period duration
- this setting drives automatic fill length after first-day recognition

### ModuleHomeView

- `module_instance_id`
- `current_status_summary`
- `visible_window`
- `selected_date_state?`
- `calendar_marks`
- `prediction_summary`

Notes:

- application-level read model for the homepage
- useful for query design

## Relationships

```txt
User 1 --- n Profile
User 1 --- n ModuleAccess
Profile 1 --- n ModuleInstance
ModuleInstance 1 --- n ModuleAccess
ModuleInstance 1 --- n DayRecord
ModuleInstance 1 --- n DerivedCycle
ModuleInstance 1 --- 1 Prediction
ModuleInstance 1 --- 1 ModuleSettings
Profile 1 --- n DayRecord
```

Business interpretation:

- an owner user owns a module instance
- a partner user may gain access through `ModuleAccess`
- `DayRecord` belongs to one `ModuleInstance` on one date
- `DerivedCycle` comes from a first-day anchor plus automatic fill and later tail correction
- `Prediction` is computed from derived cycle starts

## State Models

### ModuleInstance

- `private`
- `shared`

Transitions:

- `private -> shared`
- `shared -> private`

### ModuleAccess

- `active`
- `revoked`

Transitions:

- access granted
- access revoked

### DayRecord

Explicit persisted meanings:

- `is_period = true`
- implicit `none`

Rule:

- `none` means no explicit record exists for that date
- there is no longer a separate primary `spotting` state in v1

### Daily expectation label

- `expected`
- `deviation`

Rule:

- this is a derived interpretation layer, not the primary period-state layer
- when detail fields stay on the default pattern, the day is considered expected
- when one or more detail fields deviate from the default pattern, the day may be labeled as deviation in read models or UI

### Prediction freshness

- `fresh`
- `stale`

Rule:

- any `day_record` change or settings change may invalidate cached prediction results

## Enum Directions

### `source`

- `manual`
- `auto_filled`

### `pain_level`

- `1`
- `2`
- `3`
- `4`
- `5`

Default:

- `3`

### `flow_level`

- `1`
- `2`
- `3`
- `4`
- `5`

Default:

- `3`

### `color_level`

- `1`
- `2`
- `3`
- `4`
- `5`

Default:

- `3`

### `sharing_status`

- `private`
- `shared`

### `role`

- `owner`
- `partner`

### `access_status`

- `active`
- `revoked`

## Constraints And Invariants

- `day_record` is the primary persisted source of truth for menstrual recording.
- `cycle` is a derived object and must not become the primary authoring model.
- a unique day record should be defined by `module_instance_id + profile_id + date`.
- absence of a `day_record` means the date is interpreted as `none`.
- if a date is recorded as period and the previous date is not period, that date is treated as the first day of a new period segment.
- after first-day recognition, the system should automatically fill subsequent dates according to `default_period_duration_days`.
- auto-filled dates and manual dates are equivalent in user-visible period semantics.
- `source` should still be retained internally so the system can explain and safely recalculate auto-filled behavior.
- if the user extends a period beyond the default range, the cycle end should extend accordingly.
- if the user clears a date inside the auto-filled tail, that date and all later dates in the same derived tail should be removed from that cycle.
- this tail-truncation rule still applies even when later dates were previously manually extended as part of the same cycle interpretation.
- a single-day period is a valid derived cycle.
- `pain_level`, `flow_level`, and `color_level` are attached attributes on `day_record`, not independent entities.
- the default level for each attached attribute is the middle level.
- changing detail fields does not by itself turn a non-period day into a period day.
- a deviation label is derived from detail variation, not chosen as a competing primary state.
- `note` is attached to `day_record` and must obey a maximum length rule.
- future dates are not recordable.
- shared/private changes access scope, not data ownership.
- private and shared entry points must resolve to the same `module instance`.
- prediction must be computed from derived cycle start dates rather than user-authored cycle end dates.

## Derived Data

These values should be treated as derived rather than primary persisted truth:

- current status summary
- current derived cycle
- predicted next start date
- prediction window
- cycle duration
- homepage calendar marks
- daily deviation label

Rule:

- attached attributes and note may affect detail presentation and deviation labeling, but should not override whether a date belongs to a period segment.

## Open Questions

- whether `Profile` should remain distinct from `User` in the first backend prototype
- the exact maximum note length
- whether deviation should remain purely derived in read models or also be cached as a convenience field later
