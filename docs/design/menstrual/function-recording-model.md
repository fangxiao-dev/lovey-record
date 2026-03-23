# Recording Model

## Purpose

This document summarizes the design-facing recording model for the menstrual module.

For the full data-model contract, also read [period_model.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/period_model.md).

## Core Rule

- users edit days
- the system derives cycles
- the UI displays cycle-like blocks and current state

## Interaction Contract

- `tap` opens single-day inline editing
- `long press` enters multi-select mode
- selected ranges save as day-level records
- no second editing model should bypass the home page

## State Rules

- missing day is interpreted as implicit `none`
- consecutive `period` days derive a cycle block
- `special` stays an attached event layer
- future dates are not recordable

## View Rules

- `Cycle Window` is the default editing view
- `Month View` is a browsing view
- the default center priority is:
  1. current period
  2. predicted period
  3. today

