# Menstrual Core Use Cases

**日期：** 2026-03-23

## Purpose

This document freezes the coarse-grained MVP use cases for the menstrual module.

It is intentionally UI-agnostic. It describes what the user needs to accomplish and what the system must guarantee, without binding the product to a specific gesture, page control, or transport format.

## Scope

This document covers:

- core menstrual MVP use cases
- the intended user outcome for each use case
- the expected system responsibility for each use case

This document does not cover:

- page structure
- gesture design
- visual layout
- API payload formats
- persistence schema

## Use Cases

### 1. First-time entry and status understanding

The user enters the menstrual module and needs to understand the current status immediately.

The system should provide:

- current status summary
- current or predicted relevant window
- whether prior records already exist
- the next meaningful action the user can take

### 2. Record a single day's primary menstrual state

The user records or edits the primary state of a single date.

The system should allow:

- setting a date as `period`
- setting a date as `spotting`
- clearing the explicit record for that date

The result should update the persisted `day_record` and trigger cycle and prediction recomputation.

### 3. Record a single day's body and menstrual details

The user records more detailed daily information for one date.

The system should allow editing these attached attributes on a `day_record`:

- `pain_level`
- `flow_level`
- `color_level`

Each field has five levels and defaults to the middle level when a new record is created.

### 4. Add a short note for a single day

The user adds a short note to provide contextual information for one day.

The system should:

- save the note on the same `day_record`
- enforce a maximum note length
- reject or block saves that exceed the allowed length

### 5. Record a contiguous date range as a period

The user records several continuous dates as a period in one action.

The system should:

- create or update one `day_record` per selected date
- apply `period` as the default primary state
- apply default attached attribute values unless the user later refines them
- recompute cycle blocks after save

### 6. Cancel an unsaved range selection

The user abandons a temporary multi-date selection before saving.

The system should:

- discard the temporary selection
- keep persisted records unchanged
- keep derived cycle and prediction results unchanged

### 7. Refine a previously recorded day after quick range recording

The user records a period range quickly first, then later opens one day to refine its details.

The system should:

- preserve the existing day-level primary state
- allow later edits to `pain_level`, `flow_level`, `color_level`, and `note`
- avoid requiring all details at initial range save time

### 8. Clear a previously recorded day

The user removes the explicit record for one day and returns it to an unrecorded state.

The system should:

- remove the explicit `day_record` for that date
- remove attached details and note for that date
- recompute derived cycle results

### 9. Automatically update derived cycle and prediction results

After any single-day or range save, the user expects the system to refresh the interpreted cycle state automatically.

The system should:

- derive cycle blocks from consecutive `period` days
- keep `spotting` outside the v1 cycle boundary rule
- recompute the next predicted start window from cycle starts

### 10. Share an existing private module instance

The owner decides to grant access to a partner for the already existing menstrual module instance.

The system should:

- keep the same `module instance`
- expand access rather than duplicate data
- let the partner view and maintain the same record set

### 11. Revoke shared access while preserving data

The owner decides to stop partner access without losing the historical records.

The system should:

- revoke the partner's access to the same `module instance`
- preserve all stored `day_record` data
- keep the owner's module instance identity unchanged

### 12. Access the same module instance from different entry points

The owner or partner may enter from different private/shared surfaces but should still operate on the same underlying module.

The system should:

- resolve both paths to the same `module instance`
- return the same `day_record` truth
- return the same derived cycle and prediction results

## Notes

- these use cases are intended to drive the domain model and the application contract
- they should remain stable even if the page structure or interaction details change
