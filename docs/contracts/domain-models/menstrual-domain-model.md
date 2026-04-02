# Period Domain Model

**Created:** 2026-03-23
**Last Updated:** 2026-04-02

## Purpose

This document freezes the coarse-grained domain model for the period MVP so backend contract work stays aligned on the same concepts and rules.

It is a domain contract, not a database schema and not a transport-level API spec.

## Core Conclusions

- `day_record` remains the primary persisted source of truth.
- The user expresses "this day is in period"; the system then anchors, extends, and truncates the period segment around that day.
- Shared and private entry points must resolve to the same `module instance`.
- Daily detail fields do not decide whether a day is in period, but they can produce a derived deviation label.
- `ModuleSettings` is a first-class part of the model and controls the default auto-fill duration.

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

- the stable identity of one period module instance
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

### ModuleSettings

- `module_instance_id`
- `default_period_duration_days`
- `default_prediction_term_days`

Notes:

- stores the current default fill length for anchored period segments
- stores the fixed term used to predict the next period start from the latest segment start
- settings changes affect future auto-fill and derived read models

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

- the only persisted source of truth for daily recording
- no row means an implicit non-period day
- `source` distinguishes manual input from auto-filled input
- user-visible period meaning does not depend on whether a day was manual or auto-filled
- attached attributes and note live on the same record
- `isDetailRecorded` is derived from whether any attached attribute value exists, not stored here

### AnchoredPeriodSegment

- `module_instance_id`
- `profile_id`
- `anchor_date`
- `end_date`
- `duration_days`
- `derived_from_dates`
- `default_period_duration_days`

Notes:

- derived object, not primary user-authored input
- one segment is anchored by a first recorded period day, then expanded by the default duration and later corrected by user edits
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
- `predicted_start_date` is computed as `latest_period_segment_start + default_prediction_term_days`

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
ModuleInstance 1 --- n AnchoredPeriodSegment
ModuleInstance 1 --- 1 Prediction
ModuleInstance 1 --- 1 ModuleSettings
Profile 1 --- n DayRecord
```

Business interpretation:

- an owner user owns a module instance
- a partner user may gain access through `ModuleAccess`
- `DayRecord` belongs to one `ModuleInstance` on one date
- `AnchoredPeriodSegment` comes from a first-day anchor plus automatic fill and later tail correction
- `Prediction` is computed from the latest anchored segment start date plus the configured prediction term

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
- implicit non-period day

Rule:

- a date with no record is interpreted as non-period

### Daily expectation label

- `expected`
- `deviation`

Rule:

- this is a derived interpretation layer, not the primary period layer
- when detail fields stay on the default pattern, the day is considered expected
- when one or more detail fields are recorded, the day may surface an eye-marker in read models or UI
- `isDetailRecorded` is the boolean read-model form of this derived marker state

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

- `day_record` is the primary persisted source of truth for daily period recording.
- `anchored_period_segment` is derived and must not become the primary authoring model.
- a unique day record should be defined by `module_instance_id + profile_id + date`.
- absence of a `day_record` means the date is interpreted as non-period.
- if a date is recorded as period and the previous day is not period, that date is treated as the first day of a new anchored segment.
- after first-day recognition, the system should automatically fill subsequent dates according to `default_period_duration_days`.
- auto-filled dates and manual dates are equivalent in user-visible period semantics.
- `source` is retained internally so the system can explain and safely recalculate auto-filled behavior.
- if the user extends a period beyond the default range, the segment end should extend accordingly.
- if the user clears a date inside the auto-filled tail, that date and all later dates in the same derived tail should be removed from that segment.
- this tail-truncation rule still applies even when later dates were previously manually extended as part of the same segment interpretation.
- a single-day segment is a valid derived result.
- `pain_level`, `flow_level`, and `color_level` are attached attributes on `day_record`, not independent entities.
- attached attributes and `note` may exist on an explicit non-period `day_record`; they do not require `is_period = true`.
- the default level for each attached attribute is the middle level.
- changing detail fields does not by itself turn a non-period day into a period day.
- a deviation label is derived from detail variation, not chosen as a competing primary state.
- `note` is attached to `day_record` and must obey a maximum length rule.
- future dates are not recordable.
- shared/private changes access scope, not data ownership.
- private and shared entry points must resolve to the same `module instance`.
- prediction must be computed from the latest anchored segment start date rather than user-authored end dates.

## Derived Data

These values should be treated as derived rather than primary persisted truth:

- current status summary
- current anchored period segment
- predicted next start date
- prediction window
- segment duration
- homepage calendar marks
- daily deviation label

Rule:

- attached attributes and note may affect detail presentation and deviation labeling, but should not override whether a date belongs to a period segment.

## Open Questions

- whether `Profile` should remain distinct from `User` in the first backend prototype
- whether deviation should remain purely derived in read models or also be cached as a convenience field later
