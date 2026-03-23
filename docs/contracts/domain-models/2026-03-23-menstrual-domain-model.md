# Menstrual Domain Model

**日期：** 2026-03-23

## Purpose

This document freezes the coarse-grained domain model for the menstrual MVP so frontend work and backend prototype work can align on the same concepts and rules.

It is a domain contract, not a database schema and not a transport-level API spec.

## Core Conclusions

- `day_record` is the only persisted source of truth for menstrual recording.
- `cycle` and `prediction` are derived results, not user-authored primary objects.
- shared and private entry points must resolve to the same `module instance`.
- attached daily details belong to `day_record` and do not define cycle boundaries in v1.

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
- `bleeding_state`
- `pain_level`
- `flow_level`
- `color_level`
- `note?`
- `source?`
- `created_at`
- `updated_at`

Notes:

- the only persisted source of truth for recording
- no row means implicit `none`
- attached attributes and note live on the same record

### DerivedCycle

- `id?`
- `module_instance_id`
- `profile_id`
- `start_date`
- `end_date`
- `duration_days`
- `derived_from_dates`

Notes:

- derived object, not primary user-authored input
- can be cached, but must remain reconstructable from `day_record`

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
Profile 1 --- n DayRecord
```

Business interpretation:

- an owner user owns a module instance
- a partner user may gain access through `ModuleAccess`
- `DayRecord` belongs to one `ModuleInstance` on one date
- `DerivedCycle` comes from consecutive `period` day records
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

Explicit persisted states:

- `period`
- `spotting`

Implicit product state:

- `none`

Rule:

- `none` means no explicit record exists for that date

### Prediction freshness

- `fresh`
- `stale`

Rule:

- any `day_record` change may invalidate cached prediction results

## Enum Directions

### `bleeding_state`

- `period`
- `spotting`

Implicit:

- `none`

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

- `day_record` is the only persisted source of truth for menstrual recording.
- `cycle` is a derived object and must not become the primary authoring model.
- a unique day record should be defined by `module_instance_id + profile_id + date`.
- absence of a `day_record` means the date is interpreted as `none`.
- consecutive `period` dates derive one cycle block.
- `spotting` does not define or extend v1 cycle boundaries.
- clearing a middle `period` date can split one derived cycle into two blocks.
- filling a missing `period` date between two blocks can merge them into one block.
- a single-day `period` is a valid derived cycle.
- `pain_level`, `flow_level`, and `color_level` are attached attributes on `day_record`, not independent entities.
- the default level for each attached attribute is the middle level.
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

Rule:

- attached attributes and note may affect detail presentation and retrospective understanding, but should not directly control cycle boundary derivation in v1.

## Open Questions

- whether `Profile` should remain distinct from `User` in the first backend prototype
- the exact maximum note length
- whether `special` should remain a pure presentation/event overlay in v1 or become an explicit attached event field later
