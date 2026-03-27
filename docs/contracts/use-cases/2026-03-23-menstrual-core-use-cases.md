# Menstrual Core Use Cases

**Date:** 2026-03-23

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

### 2. Record one day as the start of a period

The user records that one date is in period.

The system should:

- check whether the previous day is already in period
- if not, treat the selected day as the first day of a new period
- automatically fill later dates according to the current default period duration
- persist both the selected day and the auto-filled days as period days

### 3. Extend a period beyond the default duration

The user reaches the default end of the auto-filled period, but the period has not actually ended yet.

The system should:

- let the user mark one more day as period
- extend the current period segment by one day
- keep the new end date consistent in derived cycle and calendar output

### 4. End a period earlier than the default duration

The user realizes the period ended earlier than the auto-filled default tail.

The system should:

- let the user clear the first incorrect day
- remove that day and all later dates belonging to the same current tail interpretation
- update the cycle end and prediction results accordingly

### 5. Minimize interaction for expected periods

The user wants the system to do most of the repetitive work when the period follows the usual pattern.

The system should:

- require only a lightweight action to mark the period start
- automatically apply the default duration and default daily detail values
- avoid forcing the user to open detail controls unless they want to refine something

### 6. Record a day's detail when reality differs from the default pattern

The user sees that pain, flow, or color does not match the expected pattern for that day.

The system should:

- let the user adjust the relevant detail fields on that day
- preserve the day as a period day
- derive a deviation interpretation from those changed values rather than making the user choose a competing primary state

### 7. Keep expected days simple

The user has no special correction to make for a day that matches expectations.

The system should:

- keep the default detail values in effect
- avoid asking the user to explicitly confirm "expected" on each day
- treat unchanged defaults as the normal case

### 8. Add a short note for one day

The user wants to attach a short note to one day for context.

The system should:

- save the note on the same `day_record`
- enforce a maximum note length
- reject or block saves that exceed the allowed length

### 9. Automatically update cycle and prediction results after changes

After period start, extension, truncation, or detail-preserving day changes, the user expects the interpreted cycle state to stay up to date.

The system should:

- rebuild the current derived cycle from the updated period segment
- recompute the next predicted start window from cycle starts
- keep home and calendar read models synchronized with the corrected result

### 10. Adjust the default period duration

The user wants the automatic fill behavior to better match their usual period length.

The system should:

- allow a configurable default period duration in settings
- apply the new duration to future first-day records
- keep the setting visible and understandable as the source of the automatic fill behavior

### 11. Share an existing private module instance

The owner decides to grant access to a partner for the already existing menstrual module instance.

The system should:

- keep the same `module instance`
- expand access rather than duplicate data
- let the partner view and maintain the same record set

### 12. Revoke shared access while preserving data

The owner decides to stop partner access without losing the historical records.

The system should:

- revoke the partner's access to the same `module instance`
- preserve all stored `day_record` data
- keep the owner's module instance identity unchanged

### 13. Access the same module instance from different entry points

The owner or partner may enter from different private/shared surfaces but should still operate on the same underlying module.

The system should:

- resolve both paths to the same `module instance`
- return the same `day_record` truth
- return the same derived cycle and prediction results

## Notes

- these use cases are intended to drive the domain model and the application contract
- they should remain stable even if the page structure or interaction details change
